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
    private_source?: string;
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
    published: string | null;
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
export declare class InstapaperClient {
    private accessToken;
    private baseUrl;
    constructor(credentials: InstapaperCredentials);
    /**
     * Check the access token by fetching the connected account
     */
    authenticate(): Promise<void>;
    /**
     * Verify credentials are valid
     */
    verifyCredentials(): Promise<boolean>;
    /**
     * List bookmarks with optional filters (first page only)
     */
    listBookmarks(options?: {
        folder?: string;
        tag?: string;
        limit?: number;
    }): Promise<Bookmark[]>;
    /**
     * List one page of bookmarks.
     * folder: "unread" (home), "archive", "starred" (liked), or a numeric folder_id
     * tag: a tag name; takes precedence over folder
     * since: Unix timestamp; returns everything changed since then across all
     *   sections (folder/tag are ignored) plus deleted_ids
     * total is the size of the whole section (in since mode: changed + deleted)
     */
    listBookmarksPage(options?: {
        folder?: string;
        tag?: string;
        limit?: number;
        offset?: number;
        since?: number;
    }): Promise<{
        bookmarks: Bookmark[];
        total: number;
        deleted_ids?: number[];
    }>;
    /**
     * Fetch every bookmark in the account (all sections), paging through sync mode
     */
    listAllBookmarks(): Promise<Bookmark[]>;
    /**
     * Get the parsed article as plain text, with its metadata
     */
    getArticle(bookmarkId: number): Promise<Article>;
    /**
     * Get the parsed article as plain text
     */
    getArticleText(bookmarkId: number): Promise<string>;
    /**
     * Add a new bookmark (public or private)
     * For private sources: leave url empty and provide content instead
     */
    addBookmark(url: string, options?: {
        title?: string;
        description?: string;
        folder_id?: number;
        resolve_final_url?: boolean;
        tags?: string[];
        archived?: boolean;
        content?: string;
        is_private_from_source?: string;
    }): Promise<Bookmark>;
    /**
     * Edit a bookmark's title and/or description
     */
    updateBookmark(bookmarkId: number, changes: {
        title?: string;
        description?: string;
    }): Promise<Bookmark>;
    /**
     * Delete a bookmark
     */
    deleteBookmark(bookmarkId: number): Promise<void>;
    /**
     * Star (like) a bookmark
     */
    starBookmark(bookmarkId: number): Promise<Bookmark>;
    /**
     * Unstar (unlike) a bookmark
     */
    unstarBookmark(bookmarkId: number): Promise<Bookmark>;
    /**
     * Archive a bookmark
     */
    archiveBookmark(bookmarkId: number): Promise<Bookmark>;
    /**
     * Unarchive a bookmark
     */
    unarchiveBookmark(bookmarkId: number): Promise<Bookmark>;
    /**
     * Move bookmark to a folder
     */
    moveBookmark(bookmarkId: number, folderId: number): Promise<Bookmark>;
    /**
     * Update reading progress
     */
    updateReadProgress(bookmarkId: number, progress: number, timestamp?: number): Promise<Bookmark>;
    /**
     * Add a private bookmark from HTML content
     * Use this for content that doesn't have a URL (emails, notebooks, etc)
     */
    addPrivateBookmark(content: string, options: {
        title?: string;
        description?: string;
        folder_id?: number;
        source_label: string;
    }): Promise<Bookmark>;
    /**
     * List all folders
     */
    listFolders(): Promise<Folder[]>;
    /**
     * Add a new folder
     */
    addFolder(title: string): Promise<Folder>;
    /**
     * Delete a folder
     */
    deleteFolder(folderId: number): Promise<void>;
    /**
     * Reorder folders
     */
    reorderFolders(order: Array<{
        folder_id: number;
        position: number;
    }>): Promise<Folder[]>;
    /**
     * List highlights for a bookmark
     */
    listHighlights(bookmarkId: number): Promise<Highlight[]>;
    /**
     * Add a highlight
     */
    addHighlight(bookmarkId: number, text: string, position?: number, // which occurrence of text in the article, counting from 0
    note?: string): Promise<Highlight>;
    /**
     * Delete a highlight
     */
    deleteHighlight(highlightId: number): Promise<void>;
    /**
     * List all tags
     */
    listTags(): Promise<Tag[]>;
    /**
     * Create a tag
     */
    createTag(name: string): Promise<Tag>;
    /**
     * Rename a tag (the API has no endpoint for deleting tags)
     */
    renameTag(tagId: number, name: string): Promise<Tag>;
    /**
     * Add and/or remove tags on a bookmark, by tag name.
     * Names to add that don't exist yet are created. Names to remove are
     * matched case-insensitively; unknown ones are ignored. Pass knownTags
     * (from listTags) to avoid refetching them for every bookmark.
     */
    updateBookmarkTags(bookmarkId: number, options: {
        add?: string[];
        remove?: string[];
    }, knownTags?: Tag[]): Promise<{
        tags: string[];
    }>;
    private moveToSection;
    private activeRequests;
    private waiting;
    private acquireSlot;
    private releaseSlot;
    /**
     * Make an authenticated request to the Instapaper API
     */
    private request;
}
export {};
//# sourceMappingURL=instapaper-client.d.ts.map