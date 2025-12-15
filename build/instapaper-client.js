import crypto from 'crypto';
import fetch from 'node-fetch';
export class InstapaperClient {
    consumerKey;
    consumerSecret;
    username;
    password;
    oauthToken;
    oauthTokenSecret;
    baseUrl = 'https://www.instapaper.com/api/1';
    constructor(credentials) {
        this.consumerKey = credentials.consumerKey;
        this.consumerSecret = credentials.consumerSecret;
        this.username = credentials.username;
        this.password = credentials.password;
    }
    /**
     * Authenticate with Instapaper using xAuth to get OAuth tokens
     */
    async authenticate() {
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
    async verifyCredentials() {
        try {
            await this.makeAuthenticatedRequest('/api/1/account/verify_credentials');
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * List bookmarks with optional filters
     */
    async listBookmarks(options = {}) {
        const params = new URLSearchParams();
        if (options.folder)
            params.append('folder_id', options.folder);
        if (options.limit)
            params.append('limit', options.limit.toString());
        if (options.have)
            params.append('have', options.have);
        const response = await this.makeAuthenticatedRequest('/bookmarks/list', params);
        // Filter out non-bookmark items (user info, etc.)
        return response.filter((item) => item.type === 'bookmark');
    }
    /**
     * Get full text of an article
     */
    async getArticleText(bookmarkId) {
        const params = new URLSearchParams({
            bookmark_id: bookmarkId.toString(),
        });
        const response = await this.makeAuthenticatedRequest('/bookmarks/get_text', params);
        return response;
    }
    /**
     * Add a new bookmark
     */
    async addBookmark(url, options = {}) {
        const params = new URLSearchParams({ url });
        if (options.title)
            params.append('title', options.title);
        if (options.description)
            params.append('description', options.description);
        if (options.folder_id)
            params.append('folder_id', options.folder_id.toString());
        if (options.resolve_final_url !== undefined) {
            params.append('resolve_final_url', options.resolve_final_url ? '1' : '0');
        }
        const response = await this.makeAuthenticatedRequest('/bookmarks/add', params);
        return response[0];
    }
    /**
     * Delete a bookmark
     */
    async deleteBookmark(bookmarkId) {
        const params = new URLSearchParams({
            bookmark_id: bookmarkId.toString(),
        });
        await this.makeAuthenticatedRequest('/bookmarks/delete', params);
    }
    /**
     * Star a bookmark
     */
    async starBookmark(bookmarkId) {
        const params = new URLSearchParams({
            bookmark_id: bookmarkId.toString(),
        });
        const response = await this.makeAuthenticatedRequest('/bookmarks/star', params);
        return response[0];
    }
    /**
     * Unstar a bookmark
     */
    async unstarBookmark(bookmarkId) {
        const params = new URLSearchParams({
            bookmark_id: bookmarkId.toString(),
        });
        const response = await this.makeAuthenticatedRequest('/bookmarks/unstar', params);
        return response[0];
    }
    /**
     * Archive a bookmark
     */
    async archiveBookmark(bookmarkId) {
        const params = new URLSearchParams({
            bookmark_id: bookmarkId.toString(),
        });
        const response = await this.makeAuthenticatedRequest('/bookmarks/archive', params);
        return response[0];
    }
    /**
     * Unarchive a bookmark
     */
    async unarchiveBookmark(bookmarkId) {
        const params = new URLSearchParams({
            bookmark_id: bookmarkId.toString(),
        });
        const response = await this.makeAuthenticatedRequest('/bookmarks/unarchive', params);
        return response[0];
    }
    /**
     * Move bookmark to a folder
     */
    async moveBookmark(bookmarkId, folderId) {
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
    async updateReadProgress(bookmarkId, progress, timestamp) {
        const params = new URLSearchParams({
            bookmark_id: bookmarkId.toString(),
            progress: progress.toString(),
            progress_timestamp: (timestamp || Math.floor(Date.now() / 1000)).toString(),
        });
        const response = await this.makeAuthenticatedRequest('/bookmarks/update_read_progress', params);
        return response[0];
    }
    /**
     * List all folders
     */
    async listFolders() {
        const response = await this.makeAuthenticatedRequest('/folders/list');
        return response;
    }
    /**
     * Add a new folder
     */
    async addFolder(title) {
        const params = new URLSearchParams({ title });
        const response = await this.makeAuthenticatedRequest('/folders/add', params);
        return response[0];
    }
    /**
     * Delete a folder
     */
    async deleteFolder(folderId) {
        const params = new URLSearchParams({
            folder_id: folderId.toString(),
        });
        await this.makeAuthenticatedRequest('/folders/delete', params);
    }
    /**
     * Reorder folders
     */
    async reorderFolders(order) {
        const orderString = order.map(item => `${item.folder_id}:${item.position}`).join(',');
        const params = new URLSearchParams({ order: orderString });
        const response = await this.makeAuthenticatedRequest('/folders/set_order', params);
        return response;
    }
    /**
     * List highlights for a bookmark
     */
    async listHighlights(bookmarkId) {
        const params = new URLSearchParams({
            bookmark_id: bookmarkId.toString(),
        });
        const response = await this.makeAuthenticatedRequest('/bookmarks/highlights', params);
        return response;
    }
    /**
     * Add a highlight
     */
    async addHighlight(bookmarkId, text, position) {
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
    async deleteHighlight(highlightId) {
        const params = new URLSearchParams({
            highlight_id: highlightId.toString(),
        });
        await this.makeAuthenticatedRequest('/highlights/delete', params);
    }
    /**
     * Make an authenticated request to Instapaper API
     */
    async makeAuthenticatedRequest(endpoint, params) {
        if (!this.oauthToken || !this.oauthTokenSecret) {
            await this.authenticate();
        }
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        const oauthParams = this.generateOAuthParams(url, 'POST', params, {
            token: this.oauthToken,
            tokenSecret: this.oauthTokenSecret,
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
        }
        else {
            return await response.text();
        }
    }
    /**
     * Generate OAuth 1.0a signature and parameters
     */
    generateOAuthParams(url, method, params, tokens) {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = crypto.randomBytes(16).toString('hex');
        const oauthParams = {
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
    percentEncode(str) {
        return encodeURIComponent(str)
            .replace(/!/g, '%21')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\*/g, '%2A');
    }
}
//# sourceMappingURL=instapaper-client.js.map