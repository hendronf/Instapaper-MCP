import crypto from 'crypto';
import fetch from 'node-fetch';

interface InstapaperCredentials {
  consumerKey: string;
  consumerSecret: string;
  username: string;
  password: string;
}

interface OAuthTokens {
  token: string;
  tokenSecret: string;
}

interface Bookmark {
  bookmark_id: number;
  url: string;
  title: string;
  description: string;
  time: number;
  starred: string;
  folder?: string;
  hash: string;
  progress: number;
  progress_timestamp: number;
  private_source?: string; // Empty string for public, source label for private
}

interface Folder {
  folder_id: number;
  title: string;
  position: number;
}

interface Highlight {
  highlight_id: number;
  text: string;
  position: number;
  time: number;
}

export class InstapaperClient {
  private consumerKey: string;
  private consumerSecret: string;
  private username: string;
  private password: string;
  private oauthToken?: string;
  private oauthTokenSecret?: string;
  private baseUrl = 'https://www.instapaper.com/api/1';

  constructor(credentials: InstapaperCredentials) {
    this.consumerKey = credentials.consumerKey;
    this.consumerSecret = credentials.consumerSecret;
    this.username = credentials.username;
    this.password = credentials.password;
  }

  /**
   * Authenticate with Instapaper using xAuth to get OAuth tokens
   */
  async authenticate(): Promise<void> {
    const params = new URLSearchParams({
      x_auth_username: this.username,
      x_auth_password: this.password,
      x_auth_mode: 'client_auth',
    });

    const url = `${this.baseUrl}/oauth/access_token`;
    const oauthParams = this.generateOAuthParams(url, 'POST', params);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: oauthParams.toString(),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const text = await response.text();
    const tokenParams = new URLSearchParams(text);
    this.oauthToken = tokenParams.get('oauth_token') || undefined;
    this.oauthTokenSecret = tokenParams.get('oauth_token_secret') || undefined;

    if (!this.oauthToken || !this.oauthTokenSecret) {
      throw new Error('Failed to obtain OAuth tokens');
    }
  }

  /**
   * Verify credentials are valid
   */
  async verifyCredentials(): Promise<boolean> {
    try {
      await this.makeAuthenticatedRequest('/api/1/account/verify_credentials');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List bookmarks with optional filters
   */
  async listBookmarks(options: {
    folder?: string;
    limit?: number;
    have?: string;
  } = {}): Promise<Bookmark[]> {
    const params = new URLSearchParams();
    if (options.folder) params.append('folder_id', options.folder);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.have) params.append('have', options.have);

    const response = await this.makeAuthenticatedRequest('/bookmarks/list', params);
    
    // Filter out non-bookmark items (user info, etc.)
    return response.filter((item: any) => item.type === 'bookmark');
  }

  /**
   * Get full text of an article
   */
  async getArticleText(bookmarkId: number): Promise<string> {
    const params = new URLSearchParams({
      bookmark_id: bookmarkId.toString(),
    });

    const response = await this.makeAuthenticatedRequest('/bookmarks/get_text', params);
    return response;
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
    content?: string; // Required for private sources
    is_private_from_source?: string; // Set to source label (e.g., 'email', 'notebook') for private bookmarks
  } = {}): Promise<Bookmark> {
    const params = new URLSearchParams();
    
    // For private sources, url is ignored and content is required
    if (!options.is_private_from_source) {
      params.append('url', url);
    }

    if (options.title) params.append('title', options.title);
    if (options.description) params.append('description', options.description);
    if (options.folder_id) params.append('folder_id', options.folder_id.toString());
    if (options.resolve_final_url !== undefined && !options.is_private_from_source) {
      params.append('resolve_final_url', options.resolve_final_url ? '1' : '0');
    }
    if (options.is_private_from_source) {
      params.append('is_private_from_source', options.is_private_from_source);
      if (!options.content) {
        throw new Error('content parameter is required for private bookmarks');
      }
      params.append('content', options.content);
    }

    const response = await this.makeAuthenticatedRequest('/bookmarks/add', params);
    return response[0];
  }  /**
   * Delete a bookmark
   */
  async deleteBookmark(bookmarkId: number): Promise<void> {
    const params = new URLSearchParams({
      bookmark_id: bookmarkId.toString(),
    });

    await this.makeAuthenticatedRequest('/bookmarks/delete', params);
  }

  /**
   * Star a bookmark
   */
  async starBookmark(bookmarkId: number): Promise<Bookmark> {
    const params = new URLSearchParams({
      bookmark_id: bookmarkId.toString(),
    });

    const response = await this.makeAuthenticatedRequest('/bookmarks/star', params);
    return response[0];
  }

  /**
   * Unstar a bookmark
   */
  async unstarBookmark(bookmarkId: number): Promise<Bookmark> {
    const params = new URLSearchParams({
      bookmark_id: bookmarkId.toString(),
    });

    const response = await this.makeAuthenticatedRequest('/bookmarks/unstar', params);
    return response[0];
  }

  /**
   * Archive a bookmark
   */
  async archiveBookmark(bookmarkId: number): Promise<Bookmark> {
    const params = new URLSearchParams({
      bookmark_id: bookmarkId.toString(),
    });

    const response = await this.makeAuthenticatedRequest('/bookmarks/archive', params);
    return response[0];
  }

  /**
   * Unarchive a bookmark
   */
  async unarchiveBookmark(bookmarkId: number): Promise<Bookmark> {
    const params = new URLSearchParams({
      bookmark_id: bookmarkId.toString(),
    });

    const response = await this.makeAuthenticatedRequest('/bookmarks/unarchive', params);
    return response[0];
  }

  /**
   * Move bookmark to a folder
   */
  async moveBookmark(bookmarkId: number, folderId: number): Promise<Bookmark> {
    const params = new URLSearchParams({
      bookmark_id: bookmarkId.toString(),
      folder_id: folderId.toString(),
    });

    const response = await this.makeAuthenticatedRequest('/bookmarks/move', params);
    return response[0];
  }

  /**
   * Update reading progress
   */
  async updateReadProgress(
    bookmarkId: number,
    progress: number,
    timestamp?: number
  ): Promise<Bookmark> {
    const params = new URLSearchParams({
      bookmark_id: bookmarkId.toString(),
      progress: progress.toString(),
      progress_timestamp: (timestamp || Math.floor(Date.now() / 1000)).toString(),
    });

    const response = await this.makeAuthenticatedRequest('/bookmarks/update_read_progress', params);
    return response[0];
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
    const response = await this.makeAuthenticatedRequest('/folders/list');
    return response;
  }

  /**
   * Add a new folder
   */
  async addFolder(title: string): Promise<Folder> {
    const params = new URLSearchParams({ title });
    const response = await this.makeAuthenticatedRequest('/folders/add', params);
    return response[0];
  }

  /**
   * Delete a folder
   */
  async deleteFolder(folderId: number): Promise<void> {
    const params = new URLSearchParams({
      folder_id: folderId.toString(),
    });

    await this.makeAuthenticatedRequest('/folders/delete', params);
  }

  /**
   * Reorder folders
   */
  async reorderFolders(order: Array<{ folder_id: number; position: number }>): Promise<Folder[]> {
    const orderString = order.map(item => `${item.folder_id}:${item.position}`).join(',');
    const params = new URLSearchParams({ order: orderString });

    const response = await this.makeAuthenticatedRequest('/folders/set_order', params);
    return response;
  }

  /**
   * List highlights for a bookmark
   */
  async listHighlights(bookmarkId: number): Promise<Highlight[]> {
    const params = new URLSearchParams({
      bookmark_id: bookmarkId.toString(),
    });

    const response = await this.makeAuthenticatedRequest('/bookmarks/highlights', params);
    return response;
  }

  /**
   * Add a highlight
   */
  async addHighlight(
    bookmarkId: number,
    text: string,
    position: number
  ): Promise<Highlight> {
    const params = new URLSearchParams({
      bookmark_id: bookmarkId.toString(),
      text,
      position: position.toString(),
    });

    const response = await this.makeAuthenticatedRequest('/highlights/add', params);
    return response[0];
  }

  /**
   * Delete a highlight
   */
  async deleteHighlight(highlightId: number): Promise<void> {
    const params = new URLSearchParams({
      highlight_id: highlightId.toString(),
    });

    await this.makeAuthenticatedRequest('/highlights/delete', params);
  }

  /**
   * Make an authenticated request to Instapaper API
   */
  private async makeAuthenticatedRequest(
    endpoint: string,
    params?: URLSearchParams
  ): Promise<any> {
    if (!this.oauthToken || !this.oauthTokenSecret) {
      await this.authenticate();
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const oauthParams = this.generateOAuthParams(url, 'POST', params, {
      token: this.oauthToken!,
      tokenSecret: this.oauthTokenSecret!,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: oauthParams.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.statusText} - ${error}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  }

  /**
   * Generate OAuth 1.0a signature and parameters
   */
  private generateOAuthParams(
    url: string,
    method: string,
    params?: URLSearchParams,
    tokens?: OAuthTokens
  ): URLSearchParams {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.consumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_version: '1.0',
    };

    if (tokens) {
      oauthParams.oauth_token = tokens.token;
    }

    // Merge all parameters for signature
    const allParams = new URLSearchParams(oauthParams);
    if (params) {
      params.forEach((value, key) => {
        allParams.append(key, value);
      });
    }

    // Sort parameters
    const sortedParams = Array.from(allParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${this.percentEncode(key)}=${this.percentEncode(value)}`)
      .join('&');

    // Create signature base string
    const signatureBase = [
      method.toUpperCase(),
      this.percentEncode(url),
      this.percentEncode(sortedParams),
    ].join('&');

    // Create signing key
    const signingKey = [
      this.percentEncode(this.consumerSecret),
      this.percentEncode(tokens?.tokenSecret || ''),
    ].join('&');

    // Generate signature
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBase)
      .digest('base64');

    oauthParams.oauth_signature = signature;

    // Return all parameters including original params
    const result = new URLSearchParams(oauthParams);
    if (params) {
      params.forEach((value, key) => {
        result.append(key, value);
      });
    }

    return result;
  }

  /**
   * Percent encode for OAuth
   */
  private percentEncode(str: string): string {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
  }
}
