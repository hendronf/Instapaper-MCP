import fetch from 'node-fetch';

/**
 * Instapaper API v2 client (OAuth 2 bearer token).
 *
 * Get a personal access token on your application's page at
 * https://www.instapaper.com/developers/applications. Responses are mapped
 * back to the v1-style shapes (bookmark_id, starred, folder_id, highlight_id)
 * that the MCP tools in index.ts expect.
 */

const MAX_CONCURRENT_REQUESTS = 4;
const MAX_RETRIES = 4;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const backoffMs = (attempt: number) => 1000 * 2 ** attempt; // 1s, 2s, 4s, 8s

interface InstapaperCredentials {
  accessToken: string;
}

interface Bookmark {
  bookmark_id: number;
  url: string;
  title: string;
  description: string;
  time: number;
  starred: string;
  archived: boolean;
  folder_id: number | null;
  tags: string[];
  author: string | null;
  progress: number;
  progress_timestamp: number;
  private_source?: string; // Empty string for public, source label for private
}

interface Folder {
  folder_id: number;
  title: string;
  position: number;
  count: number;
}

interface Article {
  bookmark_id: number;
  title: string | null;
  author: string | null;
  published: string | null; // YYYY-MM-DD
  description: string | null;
  words: number | null;
  paywalled: boolean;
  text: string;
}

interface Tag {
  tag_id: number;
  name: string;
  count: number;
}

interface Highlight {
  highlight_id: number;
  bookmark_id: number;
  text: string;
  note: string | null;
  position: number;
  time: number;
}

export class InstapaperClient {
  private accessToken: string;
  private baseUrl = 'https://www.instapaper.com/api/2';

  constructor(credentials: InstapaperCredentials) {
    this.accessToken = credentials.accessToken;
  }

  /**
   * Check the access token by fetching the connected account
   */
  async authenticate(): Promise<void> {
    await this.request('GET', '/me');
  }

  /**
   * Verify credentials are valid
   */
  async verifyCredentials(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List bookmarks with optional filters (first page only)
   */
  async listBookmarks(options: { folder?: string; tag?: string; limit?: number } = {}): Promise<Bookmark[]> {
    return (await this.listBookmarksPage(options)).bookmarks;
  }

  /**
   * List one page of bookmarks.
   * folder: "unread" (home), "archive", "starred" (liked), or a numeric folder_id
   * tag: a tag name; takes precedence over folder
   * since: Unix timestamp; returns everything changed since then across all
   *   sections (folder/tag are ignored) plus deleted_ids
   * total is the size of the whole section (in since mode: changed + deleted)
   */
  async listBookmarksPage(options: {
    folder?: string;
    tag?: string;
    limit?: number;
    offset?: number;
    since?: number;
  } = {}): Promise<{ bookmarks: Bookmark[]; total: number; deleted_ids?: number[] }> {
    const query: Record<string, string> = {};
    const folder = options.folder;
    if (options.since) {
      query.since = Math.max(1, Math.floor(options.since)).toString();
    } else if (options.tag) {
      query.section = 'tag';
      query.tag = options.tag;
    } else if (!folder || folder === 'unread' || folder === 'home') {
      query.section = 'home';
    } else if (folder === 'archive') {
      query.section = 'archive';
    } else if (folder === 'starred' || folder === 'liked') {
      query.section = 'liked';
    } else {
      query.section = 'folder';
      query.folder_id = folder;
    }
    query.limit = Math.min(Math.max(options.limit ?? 25, 1), 500).toString();
    if (options.offset) query.offset = Math.max(0, Math.floor(options.offset)).toString();

    const response = await this.request('GET', '/bookmarks', undefined, query);
    const page: { bookmarks: Bookmark[]; total: number; deleted_ids?: number[] } = {
      bookmarks: response.bookmarks.map(toBookmark),
      total: response.total,
    };
    if (response.deleted_ids) page.deleted_ids = response.deleted_ids;
    return page;
  }

  /**
   * Fetch every bookmark in the account (all sections), paging through sync mode
   */
  async listAllBookmarks(): Promise<Bookmark[]> {
    const all = new Map<number, Bookmark>();
    const deleted = new Set<number>();
    const limit = 500;
    let offset = 0;
    for (;;) {
      const page = await this.listBookmarksPage({ since: 1, limit, offset });
      for (const b of page.bookmarks) all.set(b.bookmark_id, b);
      for (const id of page.deleted_ids ?? []) deleted.add(id);
      const received = page.bookmarks.length + (page.deleted_ids?.length ?? 0);
      offset += received;
      if (received < limit) break;
    }
    return [...all.values()].filter((b) => !deleted.has(b.bookmark_id));
  }

  /**
   * Get the parsed article as plain text, with its metadata
   */
  async getArticle(bookmarkId: number): Promise<Article> {
    const response = await this.request('GET', `/bookmarks/${bookmarkId}/parse`);
    const metadata = response.metadata ?? {};
    const content = response.content ?? {};
    return {
      bookmark_id: bookmarkId,
      title: metadata.title ?? null,
      author: metadata.author?.name ?? null,
      published: metadata.pubtime ? new Date(metadata.pubtime * 1000).toISOString().slice(0, 10) : null,
      description: metadata.description ?? null,
      words: content.words ?? null,
      paywalled: content.paywalled ?? false,
      text: htmlToText(content.body ?? ''),
    };
  }

  /**
   * Get the parsed article as plain text
   */
  async getArticleText(bookmarkId: number): Promise<string> {
    return (await this.getArticle(bookmarkId)).text;
  }

  /**
   * Add a new bookmark (public or private)
   * For private sources: leave url empty and provide content instead
   */
  async addBookmark(url: string, options: {
    title?: string;
    description?: string;
    folder_id?: number;
    resolve_final_url?: boolean;
    tags?: string[]; // tag names; missing ones are created
    archived?: boolean; // save straight to the archive
    content?: string; // Required for private sources
    is_private_from_source?: string; // Set to source label (e.g., 'email', 'notebook') for private bookmarks
  } = {}): Promise<Bookmark> {
    const body: Record<string, unknown> = {};

    if (options.is_private_from_source) {
      if (!options.content) {
        throw new Error('content parameter is required for private bookmarks');
      }
      body.private_source = options.is_private_from_source;
      body.content = options.content;
    } else {
      body.url = url;
      if (options.resolve_final_url !== undefined) body.canonicalize = options.resolve_final_url;
    }

    if (options.title) body.title = options.title;
    if (options.description) body.description = options.description;
    if (options.folder_id) body.folder_id = options.folder_id;
    if (options.tags?.length) body.tags = options.tags.map((name) => ({ name }));
    if (options.archived) body.archived = true;

    return toBookmark(await this.request('POST', '/bookmarks', body));
  }

  /**
   * Edit a bookmark's title and/or description
   */
  async updateBookmark(
    bookmarkId: number,
    changes: { title?: string; description?: string }
  ): Promise<Bookmark> {
    const body: Record<string, unknown> = {};
    if (changes.title !== undefined) body.title = changes.title;
    if (changes.description !== undefined) body.description = changes.description;
    if (!Object.keys(body).length) {
      throw new Error('Nothing to change: provide title and/or description');
    }
    return toBookmark(await this.request('POST', `/bookmarks/${bookmarkId}`, body));
  }

  /**
   * Delete a bookmark
   */
  async deleteBookmark(bookmarkId: number): Promise<void> {
    await this.request('DELETE', `/bookmarks/${bookmarkId}`);
  }

  /**
   * Star (like) a bookmark
   */
  async starBookmark(bookmarkId: number): Promise<Bookmark> {
    return toBookmark(await this.request('POST', `/bookmarks/${bookmarkId}/like`));
  }

  /**
   * Unstar (unlike) a bookmark
   */
  async unstarBookmark(bookmarkId: number): Promise<Bookmark> {
    return toBookmark(await this.request('DELETE', `/bookmarks/${bookmarkId}/like`));
  }

  /**
   * Archive a bookmark
   */
  async archiveBookmark(bookmarkId: number): Promise<Bookmark> {
    return this.moveToSection(bookmarkId, 'archive');
  }

  /**
   * Unarchive a bookmark
   */
  async unarchiveBookmark(bookmarkId: number): Promise<Bookmark> {
    return this.moveToSection(bookmarkId, 'home');
  }

  /**
   * Move bookmark to a folder
   */
  async moveBookmark(bookmarkId: number, folderId: number): Promise<Bookmark> {
    return this.moveToSection(bookmarkId, folderId.toString());
  }

  /**
   * Update reading progress
   */
  async updateReadProgress(
    bookmarkId: number,
    progress: number,
    timestamp?: number
  ): Promise<Bookmark> {
    const body = {
      progress: {
        percentage: progress,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
      },
    };
    return toBookmark(await this.request('POST', `/bookmarks/${bookmarkId}`, body));
  }

  /**
   * Add a private bookmark from HTML content
   * Use this for content that doesn't have a URL (emails, notebooks, etc)
   */
  async addPrivateBookmark(content: string, options: {
    title?: string;
    description?: string;
    folder_id?: number;
    source_label: string; // e.g., 'email', 'notebook', 'slack'
  }): Promise<Bookmark> {
    return this.addBookmark('', {
      ...options,
      content,
      is_private_from_source: options.source_label,
    });
  }

  /**
   * List all folders
   */
  async listFolders(): Promise<Folder[]> {
    const response = await this.request('GET', '/folders');
    return response.folders.map(toFolder);
  }

  /**
   * Add a new folder
   */
  async addFolder(title: string): Promise<Folder> {
    return toFolder(await this.request('POST', '/folders', { title }));
  }

  /**
   * Delete a folder
   */
  async deleteFolder(folderId: number): Promise<void> {
    await this.request('DELETE', `/folders/${folderId}`);
  }

  /**
   * Reorder folders
   */
  async reorderFolders(order: Array<{ folder_id: number; position: number }>): Promise<Folder[]> {
    const response = await this.request('POST', '/folders/reorder', { order });
    return response.folders.map(toFolder);
  }

  /**
   * List highlights for a bookmark
   */
  async listHighlights(bookmarkId: number): Promise<Highlight[]> {
    const response = await this.request('GET', `/bookmarks/${bookmarkId}/highlights`);
    return response.highlights.map(toHighlight);
  }

  /**
   * Add a highlight
   */
  async addHighlight(
    bookmarkId: number,
    text: string,
    position = 0, // which occurrence of text in the article, counting from 0
    note?: string
  ): Promise<Highlight> {
    const body: Record<string, unknown> = { text, position };
    if (note) body.note = note;
    const response = await this.request('POST', `/bookmarks/${bookmarkId}/highlights`, body);
    return toHighlight(response);
  }

  /**
   * Delete a highlight
   */
  async deleteHighlight(highlightId: number): Promise<void> {
    await this.request('DELETE', `/highlights/${highlightId}`);
  }

  /**
   * List all tags
   */
  async listTags(): Promise<Tag[]> {
    const response = await this.request('GET', '/tags');
    return response.tags.map(toTag);
  }

  /**
   * Create a tag
   */
  async createTag(name: string): Promise<Tag> {
    return toTag(await this.request('POST', '/tags', { name }));
  }

  /**
   * Rename a tag (the API has no endpoint for deleting tags)
   */
  async renameTag(tagId: number, name: string): Promise<Tag> {
    return toTag(await this.request('POST', `/tags/${tagId}`, { name }));
  }

  /**
   * Add and/or remove tags on a bookmark, by tag name.
   * Names to add that don't exist yet are created. Names to remove are
   * matched case-insensitively; unknown ones are ignored. Pass knownTags
   * (from listTags) to avoid refetching them for every bookmark.
   */
  async updateBookmarkTags(
    bookmarkId: number,
    options: { add?: string[]; remove?: string[] },
    knownTags?: Tag[]
  ): Promise<{ tags: string[] }> {
    const body: Record<string, unknown> = {};
    if (options.add?.length) {
      body.add_tags = options.add.map((name) => ({ name }));
    }
    if (options.remove?.length) {
      const tags = knownTags ?? (await this.listTags());
      const byName = new Map(tags.map((t) => [t.name.trim().toLowerCase(), t.tag_id]));
      const ids = options.remove
        .map((name) => byName.get(name.trim().toLowerCase()))
        .filter((id): id is number => id !== undefined);
      if (ids.length) body.remove_tags = ids.map((id) => ({ id }));
    }
    if (!body.add_tags && !body.remove_tags) {
      throw new Error('Nothing to change: provide add_tags and/or remove_tags with existing tag names');
    }

    // response.created_tags is not used: the API also lists tags that already existed there
    const response = await this.request('POST', `/bookmarks/${bookmarkId}/tags`, body);
    return { tags: response.tags.map((t: any) => t.name) };
  }

  private async moveToSection(bookmarkId: number, section: string): Promise<Bookmark> {
    return toBookmark(await this.request('POST', `/bookmarks/${bookmarkId}/move`, { section }));
  }

  private activeRequests = 0;
  private waiting: Array<() => void> = [];

  private async acquireSlot(): Promise<void> {
    if (this.activeRequests < MAX_CONCURRENT_REQUESTS) {
      this.activeRequests++;
      return;
    }
    // releaseSlot hands its slot straight to the next waiter
    await new Promise<void>((resolve) => this.waiting.push(resolve));
  }

  private releaseSlot(): void {
    const next = this.waiting.shift();
    if (next) next();
    else this.activeRequests--;
  }

  /**
   * Make an authenticated request to the Instapaper API
   */
  private async request(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    body?: Record<string, unknown>,
    query?: Record<string, string>
  ): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
    };
    if (body) headers['Content-Type'] = 'application/json';

    // Bulk tools fire many calls at once: cap concurrency and back off on rate limits.
    // 429s are retried for any method (the request was not processed); 5xx and
    // network errors only for GET, so writes are never applied twice.
    let response: Awaited<ReturnType<typeof fetch>> | undefined;
    for (let attempt = 0; ; attempt++) {
      const canRetry = attempt < MAX_RETRIES;
      await this.acquireSlot();
      try {
        response = await fetch(url.toString(), {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch (error) {
        if (method === 'GET' && canRetry) {
          await sleep(backoffMs(attempt));
          continue;
        }
        throw error;
      } finally {
        this.releaseSlot();
      }

      const retryable = response.status === 429 || (method === 'GET' && response.status >= 500);
      if (!retryable || !canRetry) break;
      const retryAfter = Number(response.headers.get('retry-after'));
      await sleep(retryAfter > 0 ? retryAfter * 1000 : backoffMs(attempt));
    }

    const text = await response.text();
    if (!response.ok) {
      let message = text || response.statusText;
      try {
        message = JSON.parse(text).error?.message ?? message;
      } catch {
        // non-JSON error body
      }
      throw new Error(`Instapaper API error ${response.status}: ${message}`);
    }

    return text ? JSON.parse(text) : null;
  }
}

function toBookmark(b: any): Bookmark {
  return {
    bookmark_id: b.id,
    url: b.url ?? '',
    title: b.title ?? '',
    description: b.description ?? '',
    time: b.time,
    starred: b.liked ? '1' : '0',
    archived: b.archived,
    folder_id: b.folder_id ?? null,
    tags: (b.tags ?? []).map((t: any) => t.name),
    author: b.author ?? null,
    progress: b.progress?.percentage ?? 0,
    progress_timestamp: b.progress?.timestamp ?? 0,
    private_source: b.private_source ?? '',
  };
}

function toFolder(f: any): Folder {
  return {
    folder_id: f.id,
    title: f.title,
    position: f.position,
    count: f.count,
  };
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  mdash: '—', ndash: '–', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
};

/**
 * Convert the parser's article HTML to readable plain text:
 * paragraphs and headings become blank-line separated blocks, list items get "- ".
 */
function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(p|div|h[1-6]|blockquote|pre|ul|ol|table|tr|figure|section|article)>/gi, '\n\n')
    .replace(/<(p|div|h[1-6]|blockquote|pre|ul|ol|table|tr|figure|section|article)[^>]*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .split('\n')
    .map((line) => line.replace(/[ \t ]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toTag(t: any): Tag {
  return {
    tag_id: t.id,
    name: t.name,
    count: t.count,
  };
}

function toHighlight(h: any): Highlight {
  return {
    highlight_id: h.id,
    bookmark_id: h.bookmark_id,
    text: h.text,
    note: h.note ?? null,
    position: h.position,
    time: h.time,
  };
}
