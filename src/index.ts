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

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'INSTAPAPER_CONSUMER_KEY',
  'INSTAPAPER_CONSUMER_SECRET',
  'INSTAPAPER_USERNAME',
  'INSTAPAPER_PASSWORD',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Initialize Instapaper client
const client = new InstapaperClient({
  consumerKey: process.env.INSTAPAPER_CONSUMER_KEY!,
  consumerSecret: process.env.INSTAPAPER_CONSUMER_SECRET!,
  username: process.env.INSTAPAPER_USERNAME!,
  password: process.env.INSTAPAPER_PASSWORD!,
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
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Content Management
      {
        name: 'add_bookmark',
        description: 'Add a new bookmark to Instapaper',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL of the article to save',
            },
            title: {
              type: 'string',
              description: 'Optional title for the bookmark',
            },
            description: {
              type: 'string',
              description: 'Optional description or notes about the article',
            },
            folder_id: {
              type: 'number',
              description: 'Optional folder ID to save the bookmark in',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'delete_bookmark',
        description: 'Delete a bookmark from Instapaper',
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
      {
        name: 'archive_bookmark',
        description: 'Archive a bookmark (move to archive)',
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
        description: 'Unarchive a bookmark (move back to unread)',
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
        name: 'star_bookmark',
        description: 'Star a bookmark (mark as important)',
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
        description: 'Remove star from a bookmark',
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
        name: 'move_bookmark',
        description: 'Move a bookmark to a different folder',
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
        name: 'update_read_progress',
        description: 'Update reading progress for a bookmark (0.0 to 1.0)',
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
      // Folder Management
      {
        name: 'list_folders',
        description: 'List all folders in your Instapaper account',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_folder',
        description: 'Create a new folder',
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
        description: 'Delete a folder (bookmarks will move to unread)',
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
      // Highlights
      {
        name: 'add_highlight',
        description: 'Add a highlight to a bookmark',
        inputSchema: {
          type: 'object',
          properties: {
            bookmark_id: {
              type: 'number',
              description: 'ID of the bookmark',
            },
            text: {
              type: 'string',
              description: 'Text to highlight',
            },
            position: {
              type: 'number',
              description: 'Position in the article (character offset)',
            },
          },
          required: ['bookmark_id', 'text', 'position'],
        },
      },
      {
        name: 'list_highlights',
        description: 'List all highlights for a bookmark',
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
      {
        name: 'delete_highlight',
        description: 'Delete a highlight',
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
      // Search and Discovery
      {
        name: 'search_bookmarks',
        description: 'Search bookmarks by title or URL',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            folder: {
              type: 'string',
              description: 'Optional folder to search in (unread, archive, starred, or folder_id)',
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
      // Content Access
      {
        name: 'get_article_content',
        description: 'Get the full text content of an article',
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
        description: 'Get the full text content of multiple articles at once for bulk data lookup',
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
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    const typedArgs = args as Record<string, unknown>;

    switch (name) {
      case 'add_bookmark': {
        const bookmark = await client.addBookmark(typedArgs.url as string, {
          title: typedArgs.title as string | undefined,
          description: typedArgs.description as string | undefined,
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
                url: bookmark.url,
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

      case 'add_highlight': {
        const highlight = await client.addHighlight(
          typedArgs.bookmark_id as number,
          typedArgs.text as string,
          typedArgs.position as number
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
        const bookmarks = await client.listBookmarks({
          folder: typedArgs.folder as string | undefined,
          limit: (typedArgs.limit as number) || 25,
        });

        // Simple client-side search (Instapaper API doesn't have built-in search)
        const query = (typedArgs.query as string).toLowerCase();
        const filtered = bookmarks.filter(
          (b) =>
            b.title.toLowerCase().includes(query) ||
            b.url.toLowerCase().includes(query) ||
            (b.description && b.description.toLowerCase().includes(query))
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  query: typedArgs.query,
                  results: filtered.length,
                  bookmarks: filtered,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_article_content': {
        const content = await client.getArticleText(typedArgs.bookmark_id as number);
        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      }

      case 'get_articles_content_bulk': {
        const bookmarkIds = typedArgs.bookmark_ids as number[];
        const results: Record<number, { content: string } | { error: string }> = {};

        // Fetch articles in parallel for better performance
        const promises = bookmarkIds.map(async (id) => {
          try {
            const content = await client.getArticleText(id);
            results[id] = { content };
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
                  fetched: Object.values(results).filter((r) => 'content' in r).length,
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
