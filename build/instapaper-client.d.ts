interface InstapaperCredentials {
    consumerKey: string;
    consumerSecret: string;
    username: string;
    password: string;
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
    private_source?: string;
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
export declare class InstapaperClient {
    private consumerKey;
    private consumerSecret;
    private username;
    private password;
    private oauthToken?;
    private oauthTokenSecret?;
    private baseUrl;
    constructor(credentials: InstapaperCredentials);
    /**
     * Authenticate with Instapaper using xAuth to get OAuth tokens
     */
    authenticate(): Promise<void>;
    /**
     * Verify credentials are valid
     */
    verifyCredentials(): Promise<boolean>;
    /**
     * List bookmarks with optional filters
     */
    listBookmarks(options?: {
        folder?: string;
        limit?: number;
        have?: string;
    }): Promise<Bookmark[]>;
    /**
     * Get full text of an article
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
        content?: string;
        is_private_from_source?: string;
    }): Promise<Bookmark>; /**
     * Delete a bookmark
     */
    deleteBookmark(bookmarkId: number): Promise<void>;
    /**
     * Star a bookmark
     */
    starBookmark(bookmarkId: number): Promise<Bookmark>;
    /**
     * Unstar a bookmark
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
    addHighlight(bookmarkId: number, text: string, position: number): Promise<Highlight>;
    /**
     * Delete a highlight
     */
    deleteHighlight(highlightId: number): Promise<void>;
    /**
     * Make an authenticated request to Instapaper API
     */
    private makeAuthenticatedRequest;
    /**
     * Generate OAuth 1.0a signature and parameters
     */
    private generateOAuthParams;
    /**
     * Percent encode for OAuth
     */
    private percentEncode;
}
export {};
//# sourceMappingURL=instapaper-client.d.ts.map