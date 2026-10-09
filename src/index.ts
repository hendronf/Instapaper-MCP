#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { InstapaperClient } from './instapaper-client.js';
import * as dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load environment variables from the project's .env, whatever directory the
// MCP client launches the server from (variables already set take precedence)
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') });

// Validate required environment variables
// INSTAPAPER_ACCESS_TOKEN: personal access token from your application's page
// at https://www.instapaper.com/developers/applications
if (!process.env.INSTAPAPER_ACCESS_TOKEN) {
  throw new Error('Missing required environment variable: INSTAPAPER_ACCESS_TOKEN');
}

// Initialize Instapaper client
const client = new InstapaperClient({
  accessToken: process.env.INSTAPAPER_ACCESS_TOKEN,
});

// Create MCP server
const server = new Server(
  {
    name: 'instapaper-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

/**
 * TOOLS - Actions Claude can take
 * Organized by frequency of use for optimal LLM discovery
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ========== DISCOVERY & READING (Most Frequently Used) ==========
      {
        name: 'list_bookmarks',
        description: 'List bookmarks from a section (unread, archive, starred, a folder) or a tag, newest first. Returns one page plus the section\'s real total and next_offset; call again with offset to page through. With since, returns everything changed since that time across all sections, plus deleted_ids, for syncing. To find articles by topic or keyword across the whole account, use search_bookmarks instead.',
        inputSchema: {
          type: 'object',
          properties: {
            folder: {
              type: 'string',
              description: 'Folder to list from: "unread" (default), "archive", "starred", or a folder_id',
            },
            tag: {
              type: 'string',
              description: 'Optional: list bookmarks carrying this tag name (across all sections). Overrides folder.',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of bookmarks to return (1-500, default 25)',
              minimum: 1,
              maximum: 500,
            },
            offset: {
              type: 'number',
              description: 'Number of bookmarks to skip, for paging (default 0). Use next_offset from the previous call.',
              minimum: 0,
            },
            since: {
              type: 'number',
              description: 'Optional Unix timestamp: return everything changed since then, across all sections (folder and tag are ignored), plus deleted_ids',
              minimum: 1,
            },
          },
          required: [],
        },
      },
      {
        name: 'search_bookmarks',
        description: 'Search the whole account (unread, archive, liked and every folder) by keyword. Matches bookmarks whose title, URL, description, author or tags contain every word of the query (case-insensitive), newest first. Optionally narrow to a folder or a tag. Returns total_matches plus up to limit results. Searches saved metadata, not the full article text.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search words; all must match',
            },
            folder: {
              type: 'string',
              description: 'Optional: only search "unread", "archive", "starred", or a folder_id',
            },
            tag: {
              type: 'string',
              description: 'Optional: only search bookmarks carrying this tag name',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default 25)',
              default: 25,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_article_content',
        description: 'Retrieve the complete text of a single article, as clean plain text, with its metadata (title, author, publication date, word count, whether it looks paywalled). Use this to analyze, summarize, or process the full article. Requires a bookmark ID.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_id: {
              type: 'number',
              description: 'ID of the bookmark to fetch content for',
            },
          },
          required: ['bookmark_id'],
        },
      },
      {
        name: 'get_articles_content_bulk',
        description: 'Fetch the complete text of multiple articles simultaneously for efficient bulk analysis. Provide an array of bookmark IDs. Articles are retrieved in parallel for best performance. Each article is returned as plain text with its metadata (title, author, publication date, word count), or with an error. Ideal for synthesizing information across multiple sources, comparing perspectives, or comprehensive research analysis.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_ids: {
              type: 'array',
              items: {
                type: 'number',
              },
              description: 'Array of bookmark IDs to fetch content for',
            },
          },
          required: ['bookmark_ids'],
        },
      },
      {
        name: 'list_highlights',
        description: 'Retrieve all highlights/excerpts saved from a specific article. Shows all the important passages you have highlighted in that bookmark, useful for reviewing key points and important takeaways.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_id: {
              type: 'number',
              description: 'ID of the bookmark',
            },
          },
          required: ['bookmark_id'],
        },
      },

      // ========== QUICK ACTIONS (Frequently Used) ==========
      {
        name: 'add_bookmark',
        description: 'Save an article or web page to Instapaper. Use this when the user wants to save a URL for later reading. Optionally set a title, description/notes, folder, tags, or save it straight to the archive. Saving a URL that is already saved does not create a duplicate: the existing bookmark is updated with what you send and moved back to the top. Returns the bookmark ID, title, URL and tags.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL of the article to save',
            },
            title: {
              type: 'string',
              description: 'Optional title for the bookmark. If omitted, Instapaper looks it up, which makes the call slower.',
            },
            description: {
              type: 'string',
              description: 'Optional description or notes about the article',
            },
            folder_id: {
              type: 'number',
              description: 'Optional folder ID to save the bookmark in',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional tag names to apply; tags that do not exist yet are created',
            },
            archived: {
              type: 'boolean',
              description: 'Save straight to the archive instead of the unread list (default false)',
            },
            resolve_final_url: {
              type: 'boolean',
              description: 'Follow redirects and canonicalize the URL before saving (default true). Set false to save the URL exactly as given.',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'add_private_bookmark',
        description: 'Save private content without a URL to Instapaper (e.g., from emails, notebooks, clipped text, Slack messages). Private bookmarks are not shared and don\'t have URLs. Perfect for personal notes, clipped content, or information from sources without URLs. Requires HTML content to be provided.',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'HTML content of the private bookmark. Can be plain text or HTML.',
            },
            title: {
              type: 'string',
              description: 'Optional title for the bookmark',
            },
            description: {
              type: 'string',
              description: 'Optional description or notes',
            },
            source_label: {
              type: 'string',
              description: 'Source label for this private bookmark (e.g., "email", "notebook", "slack", "clipped-text")',
            },
            folder_id: {
              type: 'number',
              description: 'Optional folder ID to save the bookmark in',
            },
          },
          required: ['content', 'source_label'],
        },
      },
      {
        name: 'star_bookmark',
        description: 'Mark a bookmark as starred/important. Starring articles highlights them in your Instapaper library and helps you track your favorite or most valuable reads.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_id: {
              type: 'number',
              description: 'ID of the bookmark to star',
            },
          },
          required: ['bookmark_id'],
        },
      },
      {
        name: 'unstar_bookmark',
        description: 'Remove the star from a bookmark. Use this when an article is no longer a favorite or needs to be deprioritized in your library.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_id: {
              type: 'number',
              description: 'ID of the bookmark to unstar',
            },
          },
          required: ['bookmark_id'],
        },
      },
      {
        name: 'archive_bookmark',
        description: 'Move a bookmark to the archive. Archiving removes articles from your unread queue without deleting them, useful for marking articles as done or temporarily hiding them. The bookmark can be unarchived later.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_id: {
              type: 'number',
              description: 'ID of the bookmark to archive',
            },
          },
          required: ['bookmark_id'],
        },
      },
      {
        name: 'unarchive_bookmark',
        description: 'Restore a bookmark from the archive back to your unread list. Use this to bring back articles you want to read or reconsider.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_id: {
              type: 'number',
              description: 'ID of the bookmark to unarchive',
            },
          },
          required: ['bookmark_id'],
        },
      },
      {
        name: 'move_bookmark',
        description: 'Organize a bookmark by moving it to a specific folder. Use this to categorize articles (e.g., move research articles to a "UX Research" folder). Requires both the bookmark ID and target folder ID.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_id: {
              type: 'number',
              description: 'ID of the bookmark to move',
            },
            folder_id: {
              type: 'number',
              description: 'ID of the destination folder',
            },
          },
          required: ['bookmark_id', 'folder_id'],
        },
      },
      {
        name: 'move_bookmarks_bulk',
        description: 'Move multiple bookmarks to the same folder in parallel. While Instapaper API only supports single moves, this tool batches them efficiently using parallel requests. Ideal for organizing large sets of articles after search or bulk discovery. Returns success count and any failures.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_ids: {
              type: 'array',
              items: {
                type: 'number',
              },
              description: 'Array of bookmark IDs to move',
            },
            folder_id: {
              type: 'number',
              description: 'ID of the destination folder for all bookmarks',
            },
          },
          required: ['bookmark_ids', 'folder_id'],
        },
      },
      {
        name: 'star_bookmarks_bulk',
        description: 'Mark multiple bookmarks as starred in parallel. Use this to quickly highlight a set of important articles you want to track or prioritize. Returns success count and any failures.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_ids: {
              type: 'array',
              items: {
                type: 'number',
              },
              description: 'Array of bookmark IDs to star',
            },
          },
          required: ['bookmark_ids'],
        },
      },
      {
        name: 'unstar_bookmarks_bulk',
        description: 'Remove stars from multiple bookmarks in parallel. Use this to deprioritize a group of articles at once. Returns success count and any failures.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_ids: {
              type: 'array',
              items: {
                type: 'number',
              },
              description: 'Array of bookmark IDs to unstar',
            },
          },
          required: ['bookmark_ids'],
        },
      },
      {
        name: 'archive_bookmarks_bulk',
        description: 'Move multiple bookmarks to archive in parallel. Use this to quickly mark a set of articles as done or hide them from your unread queue. Returns success count and any failures.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_ids: {
              type: 'array',
              items: {
                type: 'number',
              },
              description: 'Array of bookmark IDs to archive',
            },
          },
          required: ['bookmark_ids'],
        },
      },
      {
        name: 'unarchive_bookmarks_bulk',
        description: 'Restore multiple bookmarks from archive in parallel. Use this to bring back a group of articles to your unread list. Returns success count and any failures.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_ids: {
              type: 'array',
              items: {
                type: 'number',
              },
              description: 'Array of bookmark IDs to unarchive',
            },
          },
          required: ['bookmark_ids'],
        },
      },
      {
        name: 'update_read_progress_bulk',
        description: 'Update reading progress for multiple bookmarks in parallel. Useful for batch-updating progress on a set of related articles or bulk-marking articles as read. Progress ranges from 0.0 (not started) to 1.0 (finished). Returns success count and any failures.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_ids: {
              type: 'array',
              items: {
                type: 'number',
              },
              description: 'Array of bookmark IDs to update',
            },
            progress: {
              type: 'number',
              description: 'Reading progress as a decimal (0.0 = not started, 1.0 = finished)',
              minimum: 0,
              maximum: 1,
            },
          },
          required: ['bookmark_ids', 'progress'],
        },
      },

      // ========== FOLDER MANAGEMENT ==========
      {
        name: 'list_folders',
        description: 'Retrieve all folders in your Instapaper account. This shows custom folders you have created for organizing articles. Returns folder names, IDs, and positions.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_folder',
        description: 'Create a new folder for organizing bookmarks. Provide a folder name/title. Folders help categorize articles by topic, project, or any organizational system you prefer.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Name of the folder to create',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'delete_folder',
        description: 'Remove a folder from your Instapaper account. When a folder is deleted, all bookmarks in it are automatically moved to the unread section. Use this to clean up unused folders.',
        inputSchema: {
          type: 'object',
          properties: {
            folder_id: {
              type: 'number',
              description: 'ID of the folder to delete',
            },
          },
          required: ['folder_id'],
        },
      },
      {
        name: 'reorder_folders',
        description: 'Reorder your folders in a custom sequence. Provide an array of folder IDs with their desired positions. This helps organize your folder structure for better workflow.',
        inputSchema: {
          type: 'object',
          properties: {
            folder_order: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  folder_id: {
                    type: 'number',
                    description: 'The folder ID',
                  },
                  position: {
                    type: 'number',
                    description: 'The desired position (1 = first)',
                  },
                },
                required: ['folder_id', 'position'],
              },
              description: 'Array of folder ID and position pairs',
            },
          },
          required: ['folder_order'],
        },
      },

      // ========== TAG MANAGEMENT ==========
      {
        name: 'list_tags',
        description: 'Retrieve all tags in your Instapaper account with how many bookmarks carry each one. Use this before tagging so you reuse existing tag names instead of creating near-duplicates.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_tag',
        description: 'Create a new tag. Not required before tagging: tag_bookmark and tag_bookmarks_bulk create missing tags automatically.',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the tag to create',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'rename_tag',
        description: 'Rename an existing tag, e.g. to fix a typo. Every bookmark carrying it keeps it. Fails if the new name is already taken. Note: the Instapaper API cannot delete tags; to merge two tags, use tag_bookmarks_bulk to add the target and remove the source, then delete the empty tag in the Instapaper app.',
        inputSchema: {
          type: 'object',
          properties: {
            tag_id: {
              type: 'number',
              description: 'ID of the tag to rename (from list_tags)',
            },
            name: {
              type: 'string',
              description: 'New name for the tag',
            },
          },
          required: ['tag_id', 'name'],
        },
      },
      {
        name: 'tag_bookmark',
        description: 'Add and/or remove tags on a single bookmark, by tag name. Tags to add that do not exist yet are created. Returns the bookmark\'s full tag list afterwards.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_id: {
              type: 'number',
              description: 'ID of the bookmark',
            },
            add_tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tag names to add',
            },
            remove_tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tag names to remove (case-insensitive; unknown names are ignored)',
            },
          },
          required: ['bookmark_id'],
        },
      },
      {
        name: 'tag_bookmarks_bulk',
        description: 'Add and/or remove the same tags on multiple bookmarks at once, by tag name. Use this to tag a batch of articles on one topic, or to merge one tag into another (add the target, remove the source).',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_ids: {
              type: 'array',
              items: { type: 'number' },
              description: 'Array of bookmark IDs to update',
            },
            add_tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tag names to add',
            },
            remove_tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tag names to remove (case-insensitive; unknown names are ignored)',
            },
          },
          required: ['bookmark_ids'],
        },
      },

      // ========== HIGHLIGHTS MANAGEMENT ==========
      {
        name: 'add_highlight',
        description: 'Add a highlight (excerpt) to an article, optionally with a note. The text must appear verbatim in the article (copy it from get_article_content). Use this to mark important passages, quotes, or key insights for later reference. Accounts without Instapaper Premium are limited to 5 highlights per month.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_id: {
              type: 'number',
              description: 'ID of the bookmark',
            },
            text: {
              type: 'string',
              description: 'Exact passage to highlight, as it appears in the article',
            },
            position: {
              type: 'number',
              description: 'Which occurrence of the text to highlight, counting from 0 (default 0, the first). Only needed when the same text appears more than once.',
              minimum: 0,
            },
            note: {
              type: 'string',
              description: 'Optional note to attach to the highlight',
            },
          },
          required: ['bookmark_id', 'text'],
        },
      },
      {
        name: 'delete_highlight',
        description: 'Remove a specific highlight from an article. Use this to clean up highlights or remove excerpts you no longer need.',
        inputSchema: {
          type: 'object',
          properties: {
            highlight_id: {
              type: 'number',
              description: 'ID of the highlight to delete',
            },
          },
          required: ['highlight_id'],
        },
      },

      // ========== ADVANCED OPERATIONS ==========
      {
        name: 'update_read_progress',
        description: 'Track reading progress on a bookmark. Provide a progress value between 0.0 (not started) and 1.0 (finished). Useful for tracking where you left off in long articles or research papers.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_id: {
              type: 'number',
              description: 'ID of the bookmark',
            },
            progress: {
              type: 'number',
              description: 'Reading progress as a decimal (0.0 = not started, 1.0 = finished)',
              minimum: 0,
              maximum: 1,
            },
          },
          required: ['bookmark_id', 'progress'],
        },
      },
      {
        name: 'update_bookmark',
        description: 'Edit the title and/or description of a saved bookmark, e.g. to fix a bad title or add notes. To change tags use tag_bookmark; to change reading progress use update_read_progress.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_id: {
              type: 'number',
              description: 'ID of the bookmark',
            },
            title: {
              type: 'string',
              description: 'New title',
            },
            description: {
              type: 'string',
              description: 'New description or notes',
            },
          },
          required: ['bookmark_id'],
        },
      },
      {
        name: 'delete_bookmark',
        description: 'Permanently remove a bookmark from Instapaper. This action cannot be undone. Use this when the user wants to delete an article they no longer need.',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_id: {
              type: 'number',
              description: 'ID of the bookmark to delete',
            },
          },
          required: ['bookmark_id'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    const typedArgs = args as Record<string, unknown>;

    switch (name) {
      case 'list_bookmarks': {
        const offset = (typedArgs.offset as number) || 0;
        const page = await client.listBookmarksPage({
          folder: typedArgs.folder as string | undefined,
          tag: typedArgs.tag as string | undefined,
          limit: (typedArgs.limit as number) || 25,
          offset,
          since: typedArgs.since as number | undefined,
        });
        const received = page.bookmarks.length + (page.deleted_ids?.length ?? 0);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total: page.total,
                  returned: page.bookmarks.length,
                  offset,
                  next_offset: offset + received < page.total ? offset + received : null,
                  ...(page.deleted_ids ? { deleted_ids: page.deleted_ids } : {}),
                  bookmarks: page.bookmarks,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'add_bookmark': {
        const bookmark = await client.addBookmark(typedArgs.url as string, {
          title: typedArgs.title as string | undefined,
          description: typedArgs.description as string | undefined,
          folder_id: typedArgs.folder_id as number | undefined,
          tags: typedArgs.tags as string[] | undefined,
          archived: typedArgs.archived as boolean | undefined,
          resolve_final_url: typedArgs.resolve_final_url as boolean | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                bookmark_id: bookmark.bookmark_id,
                title: bookmark.title,
                url: bookmark.url,
                tags: bookmark.tags,
                archived: bookmark.archived,
              }, null, 2),
            },
          ],
        };
      }

      case 'update_bookmark': {
        const bookmark = await client.updateBookmark(typedArgs.bookmark_id as number, {
          title: typedArgs.title as string | undefined,
          description: typedArgs.description as string | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                bookmark_id: bookmark.bookmark_id,
                title: bookmark.title,
                description: bookmark.description,
              }, null, 2),
            },
          ],
        };
      }

      case 'add_private_bookmark': {
        const bookmark = await client.addPrivateBookmark(typedArgs.content as string, {
          title: typedArgs.title as string | undefined,
          description: typedArgs.description as string | undefined,
          source_label: typedArgs.source_label as string,
          folder_id: typedArgs.folder_id as number | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                bookmark_id: bookmark.bookmark_id,
                title: bookmark.title,
                private_source: bookmark.private_source,
                message: 'Private bookmark saved successfully',
              }, null, 2),
            },
          ],
        };
      }

      case 'delete_bookmark': {
        await client.deleteBookmark(typedArgs.bookmark_id as number);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Bookmark deleted' }),
            },
          ],
        };
      }

      case 'archive_bookmark': {
        const bookmark = await client.archiveBookmark(typedArgs.bookmark_id as number);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, bookmark }, null, 2),
            },
          ],
        };
      }

      case 'unarchive_bookmark': {
        const bookmark = await client.unarchiveBookmark(typedArgs.bookmark_id as number);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, bookmark }, null, 2),
            },
          ],
        };
      }

      case 'star_bookmark': {
        const bookmark = await client.starBookmark(typedArgs.bookmark_id as number);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, bookmark }, null, 2),
            },
          ],
        };
      }

      case 'unstar_bookmark': {
        const bookmark = await client.unstarBookmark(typedArgs.bookmark_id as number);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, bookmark }, null, 2),
            },
          ],
        };
      }

      case 'move_bookmark': {
        const bookmark = await client.moveBookmark(typedArgs.bookmark_id as number, typedArgs.folder_id as number);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, bookmark }, null, 2),
            },
          ],
        };
      }

      case 'move_bookmarks_bulk': {
        const bookmarkIds = typedArgs.bookmark_ids as number[];
        const folderId = typedArgs.folder_id as number;
        const results: Record<number, { success: boolean } | { error: string }> = {};

        // Move bookmarks in parallel
        const promises = bookmarkIds.map(async (id) => {
          try {
            await client.moveBookmark(id, folderId);
            results[id] = { success: true };
          } catch (error) {
            results[id] = {
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });

        await Promise.all(promises);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total: bookmarkIds.length,
                  moved: Object.values(results).filter((r) => 'success' in r).length,
                  failed: Object.values(results).filter((r) => 'error' in r).length,
                  folder_id: folderId,
                  results,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'star_bookmarks_bulk': {
        const bookmarkIds = typedArgs.bookmark_ids as number[];
        const results: Record<number, { success: boolean } | { error: string }> = {};

        // Star bookmarks in parallel
        const promises = bookmarkIds.map(async (id) => {
          try {
            await client.starBookmark(id);
            results[id] = { success: true };
          } catch (error) {
            results[id] = {
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });

        await Promise.all(promises);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total: bookmarkIds.length,
                  starred: Object.values(results).filter((r) => 'success' in r).length,
                  failed: Object.values(results).filter((r) => 'error' in r).length,
                  results,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'unstar_bookmarks_bulk': {
        const bookmarkIds = typedArgs.bookmark_ids as number[];
        const results: Record<number, { success: boolean } | { error: string }> = {};

        // Unstar bookmarks in parallel
        const promises = bookmarkIds.map(async (id) => {
          try {
            await client.unstarBookmark(id);
            results[id] = { success: true };
          } catch (error) {
            results[id] = {
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });

        await Promise.all(promises);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total: bookmarkIds.length,
                  unstarred: Object.values(results).filter((r) => 'success' in r).length,
                  failed: Object.values(results).filter((r) => 'error' in r).length,
                  results,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'archive_bookmarks_bulk': {
        const bookmarkIds = typedArgs.bookmark_ids as number[];
        const results: Record<number, { success: boolean } | { error: string }> = {};

        // Archive bookmarks in parallel
        const promises = bookmarkIds.map(async (id) => {
          try {
            await client.archiveBookmark(id);
            results[id] = { success: true };
          } catch (error) {
            results[id] = {
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });

        await Promise.all(promises);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total: bookmarkIds.length,
                  archived: Object.values(results).filter((r) => 'success' in r).length,
                  failed: Object.values(results).filter((r) => 'error' in r).length,
                  results,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'unarchive_bookmarks_bulk': {
        const bookmarkIds = typedArgs.bookmark_ids as number[];
        const results: Record<number, { success: boolean } | { error: string }> = {};

        // Unarchive bookmarks in parallel
        const promises = bookmarkIds.map(async (id) => {
          try {
            await client.unarchiveBookmark(id);
            results[id] = { success: true };
          } catch (error) {
            results[id] = {
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });

        await Promise.all(promises);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total: bookmarkIds.length,
                  unarchived: Object.values(results).filter((r) => 'success' in r).length,
                  failed: Object.values(results).filter((r) => 'error' in r).length,
                  results,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'update_read_progress_bulk': {
        const bookmarkIds = typedArgs.bookmark_ids as number[];
        const progress = typedArgs.progress as number;
        const results: Record<number, { success: boolean } | { error: string }> = {};

        // Update progress for bookmarks in parallel
        const promises = bookmarkIds.map(async (id) => {
          try {
            await client.updateReadProgress(id, progress);
            results[id] = { success: true };
          } catch (error) {
            results[id] = {
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });

        await Promise.all(promises);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total: bookmarkIds.length,
                  updated: Object.values(results).filter((r) => 'success' in r).length,
                  failed: Object.values(results).filter((r) => 'error' in r).length,
                  progress,
                  results,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'update_read_progress': {
        const bookmark = await client.updateReadProgress(typedArgs.bookmark_id as number, typedArgs.progress as number);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, progress: typedArgs.progress }, null, 2),
            },
          ],
        };
      }

      case 'list_folders': {
        const folders = await client.listFolders();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ folders }, null, 2),
            },
          ],
        };
      }

      case 'create_folder': {
        const folder = await client.addFolder(typedArgs.title as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, folder }, null, 2),
            },
          ],
        };
      }

      case 'delete_folder': {
        await client.deleteFolder(typedArgs.folder_id as number);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Folder deleted' }),
            },
          ],
        };
      }

      case 'reorder_folders': {
        const folderOrder = typedArgs.folder_order as Array<{ folder_id: number; position: number }>;
        const folders = await client.reorderFolders(folderOrder);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, folders }, null, 2),
            },
          ],
        };
      }

      case 'list_tags': {
        const tags = await client.listTags();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ tags }, null, 2),
            },
          ],
        };
      }

      case 'create_tag': {
        const tag = await client.createTag(typedArgs.name as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, tag }, null, 2),
            },
          ],
        };
      }

      case 'rename_tag': {
        const tag = await client.renameTag(typedArgs.tag_id as number, typedArgs.name as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, tag }, null, 2),
            },
          ],
        };
      }

      case 'tag_bookmark': {
        const result = await client.updateBookmarkTags(typedArgs.bookmark_id as number, {
          add: typedArgs.add_tags as string[] | undefined,
          remove: typedArgs.remove_tags as string[] | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, bookmark_id: typedArgs.bookmark_id, ...result }, null, 2),
            },
          ],
        };
      }

      case 'tag_bookmarks_bulk': {
        const bookmarkIds = typedArgs.bookmark_ids as number[];
        const changes = {
          add: typedArgs.add_tags as string[] | undefined,
          remove: typedArgs.remove_tags as string[] | undefined,
        };
        const knownTags = changes.remove?.length ? await client.listTags() : undefined;
        const results: Record<number, { tags: string[] } | { error: string }> = {};

        // Sequential so a new tag is created once, not raced by parallel requests
        for (const id of bookmarkIds) {
          try {
            const { tags } = await client.updateBookmarkTags(id, changes, knownTags);
            results[id] = { tags };
          } catch (error) {
            results[id] = {
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total: bookmarkIds.length,
                  updated: Object.values(results).filter((r) => 'tags' in r).length,
                  failed: Object.values(results).filter((r) => 'error' in r).length,
                  results,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'add_highlight': {
        const highlight = await client.addHighlight(
          typedArgs.bookmark_id as number,
          typedArgs.text as string,
          (typedArgs.position as number | undefined) ?? 0,
          typedArgs.note as string | undefined
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, highlight }, null, 2),
            },
          ],
        };
      }

      case 'list_highlights': {
        const highlights = await client.listHighlights(typedArgs.bookmark_id as number);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ highlights }, null, 2),
            },
          ],
        };
      }

      case 'delete_highlight': {
        await client.deleteHighlight(typedArgs.highlight_id as number);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Highlight deleted' }),
            },
          ],
        };
      }

      case 'search_bookmarks': {
        // The API has no search endpoint, so scan the whole account client-side
        const words = (typedArgs.query as string).toLowerCase().split(/\s+/).filter(Boolean);
        const folder = typedArgs.folder as string | undefined;
        const tag = (typedArgs.tag as string | undefined)?.trim().toLowerCase();
        const limit = (typedArgs.limit as number) || 25;

        const inFolder = (b: { archived: boolean; starred: string; folder_id: number | null }) => {
          if (!folder) return true;
          if (folder === 'unread' || folder === 'home') return !b.archived && b.folder_id === null;
          if (folder === 'archive') return b.archived;
          if (folder === 'starred' || folder === 'liked') return b.starred === '1';
          return b.folder_id === Number(folder);
        };

        const matches = (await client.listAllBookmarks())
          .filter(inFolder)
          .filter((b) => !tag || b.tags.some((t) => t.trim().toLowerCase() === tag))
          .filter((b) => {
            const haystack = [b.title, b.url, b.description, b.author ?? '', ...b.tags].join(' ').toLowerCase();
            return words.every((w) => haystack.includes(w));
          })
          .sort((a, b) => b.time - a.time);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  query: typedArgs.query,
                  total_matches: matches.length,
                  returned: Math.min(matches.length, limit),
                  bookmarks: matches.slice(0, limit),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_article_content': {
        const { text, ...metadata } = await client.getArticle(typedArgs.bookmark_id as number);
        return {
          content: [
            {
              type: 'text',
              text: `${JSON.stringify(metadata, null, 2)}\n\n${text}`,
            },
          ],
        };
      }

      case 'get_articles_content_bulk': {
        const bookmarkIds = typedArgs.bookmark_ids as number[];
        const results: Record<number, { text: string } | { error: string }> = {};

        // Fetch articles in parallel for better performance
        const promises = bookmarkIds.map(async (id) => {
          try {
            results[id] = await client.getArticle(id);
          } catch (error) {
            results[id] = {
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        });

        await Promise.all(promises);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  total: bookmarkIds.length,
                  fetched: Object.values(results).filter((r) => 'text' in r).length,
                  failed: Object.values(results).filter((r) => 'error' in r).length,
                  articles: results,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
      ],
      isError: true,
    };
  }
});

/**
 * RESOURCES - Data Claude can read
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'instapaper://bookmarks/unread',
        name: 'Unread Bookmarks',
        description: 'All unread articles in your Instapaper account',
        mimeType: 'application/json',
      },
      {
        uri: 'instapaper://bookmarks/archive',
        name: 'Archived Bookmarks',
        description: 'All archived articles',
        mimeType: 'application/json',
      },
      {
        uri: 'instapaper://bookmarks/starred',
        name: 'Starred Bookmarks',
        description: 'All starred articles',
        mimeType: 'application/json',
      },
      {
        uri: 'instapaper://folders',
        name: 'Folders',
        description: 'List of all folders',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  try {
    const uri = request.params.uri.toString();

    if (uri === 'instapaper://bookmarks/unread') {
      const bookmarks = await client.listBookmarks({ folder: 'unread' });
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(bookmarks, null, 2),
          },
        ],
      };
    }

    if (uri === 'instapaper://bookmarks/archive') {
      const bookmarks = await client.listBookmarks({ folder: 'archive' });
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(bookmarks, null, 2),
          },
        ],
      };
    }

    if (uri === 'instapaper://bookmarks/starred') {
      const bookmarks = await client.listBookmarks({ folder: 'starred' });
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(bookmarks, null, 2),
          },
        ],
      };
    }

    if (uri === 'instapaper://folders') {
      const folders = await client.listFolders();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(folders, null, 2),
          },
        ],
      };
    }

    // Handle folder-specific resources: instapaper://folder/{folder_id}
    if (uri.startsWith('instapaper://folder/')) {
      const folderId = uri.split('/').pop();
      const bookmarks = await client.listBookmarks({ folder: folderId });
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(bookmarks, null, 2),
          },
        ],
      };
    }

    // Handle article text: instapaper://article/{bookmark_id}
    if (uri.startsWith('instapaper://article/')) {
      const bookmarkId = parseInt(uri.split('/').pop() || '0', 10);
      const text = await client.getArticleText(bookmarkId);
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text,
          },
        ],
      };
    }

    throw new Error(`Unknown resource URI: ${uri}`);
  } catch (error) {
    throw new Error(`Failed to read resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * PROMPTS - Reusable workflows
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'weekly_reading_digest',
        description: 'Generate a weekly digest of unread articles organized by topic',
      },
      {
        name: 'recommend_next_read',
        description: 'Suggest which article to read next based on interests and starred content',
      },
      {
        name: 'research_synthesis',
        description: 'Synthesize insights from articles on a specific topic',
        arguments: [
          {
            name: 'topic',
            description: 'The research topic to synthesize',
            required: true,
          },
        ],
      },
      {
        name: 'organize_backlog',
        description: 'Suggest how to organize unread articles into folders',
      },
      {
        name: 'archive_candidates',
        description: 'Identify old unread articles that might be worth archiving',
      },
      {
        name: 'save_as_private_bookmark',
        description: 'Guidelines for saving content to private bookmarks (emails, notes, clipped text, etc.)',
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const typedArgs = args as Record<string, unknown> | undefined;

  switch (name) {
    case 'weekly_reading_digest':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Please analyze my unread Instapaper articles and create a weekly reading digest. Group articles by topic, highlight the most important ones, and suggest a reading order.',
            },
          },
        ],
      };

    case 'recommend_next_read':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Based on my starred articles and reading history, recommend which unread article I should read next and explain why it would be valuable.',
            },
          },
        ],
      };

    case 'research_synthesis':
      if (!typedArgs?.topic) {
        throw new Error('Topic argument is required');
      }
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please find all articles in my Instapaper related to "${typedArgs.topic}" and provide a comprehensive synthesis of the key insights, themes, and practical takeaways.`,
            },
          },
        ],
      };

    case 'organize_backlog':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Review my unread articles and suggest a folder organization system. Propose folder names and which articles should go in each folder.',
            },
          },
        ],
      };

    case 'archive_candidates':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: 'Identify unread articles that are older than 3 months or seem less relevant now. Suggest which ones to archive and which to keep.',
            },
          },
        ],
      };

    case 'save_as_private_bookmark':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `You have access to the add_private_bookmark tool for saving content from LLMs and generated text to Instapaper.

WHEN TO USE add_private_bookmark:
- Saving AI-generated content (summaries, analyses, notes you create)
- Saving email subscriptions or newsletters (source: "email")
- Saving personal notes or research (source: "notebook")
- Saving Slack messages or team communications (source: "slack")
- Saving clipped text or snippets (source: "clipped-text")
- Saving any URL-less content you want to preserve

WHEN TO USE add_bookmark instead:
- Saving web articles or web pages (these have URLs)
- Saving content from websites
- Saving any content where you have an HTTP/HTTPS URL

KEY DIFFERENCES:
- add_bookmark: Requires a URL, for web content
- add_private_bookmark: No URL needed, for personal/generated content

BEST PRACTICES FOR LLM-GENERATED CONTENT:
1. When you create a summary, analysis, or generated text: Use add_private_bookmark to save it
2. Set source_label to something descriptive like "generated", "summary", "notes", "analysis"
3. Include a meaningful title that describes what was generated
4. Add a description explaining the context
5. This creates an archived record of your AI interactions

EXAMPLE USAGE:
If you've generated a research summary, save it with:
  - content: The full generated text/HTML
  - title: "Research Summary: [Topic]"
  - source_label: "generated" or "analysis"
  - description: "Generated by AI on [date] for [purpose]"

This helps you maintain a searchable archive of all your generated insights and analyses.`,
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Instapaper MCP Server running on stdio');
  console.error('Authenticating with Instapaper...');
  
  try {
    await client.authenticate();
    console.error('Successfully authenticated with Instapaper');
  } catch (error) {
    console.error('Failed to authenticate:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
