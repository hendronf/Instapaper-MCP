# Instapaper MCP Server

A comprehensive Model Context Protocol (MCP) server for Instapaper integration. This server allows Claude and other MCP clients to interact with your Instapaper account - reading, saving, organizing, and analyzing your articles.

## Features

### 🛠️ Tools (Actions)

**Content Management:**
- `add_bookmark` - Save articles with title, description, and folder
- `add_private_bookmark` - Save private content without URLs (emails, notes, generated content)
- `delete_bookmark` - Remove articles
- `archive_bookmark` - Move articles to archive
- `unarchive_bookmark` - Restore from archive
- `star_bookmark` - Mark as important
- `unstar_bookmark` - Remove star
- `move_bookmark` - Organize into folders
- `update_read_progress` - Track reading progress

**Bulk Operations (Parallel Processing):**
- `move_bookmarks_bulk` - Move multiple bookmarks to a folder at once
- `star_bookmarks_bulk` - Star multiple bookmarks in parallel
- `unstar_bookmarks_bulk` - Remove stars from multiple bookmarks
- `archive_bookmarks_bulk` - Archive multiple bookmarks at once
- `unarchive_bookmarks_bulk` - Restore multiple bookmarks from archive
- `update_read_progress_bulk` - Update reading progress for multiple articles

**Folder Management:**
- `list_folders` - View all folders
- `create_folder` - Create new folders
- `delete_folder` - Remove folders
- `reorder_folders` - Customize folder order

**Highlights:**
- `add_highlight` - Save important passages
- `list_highlights` - View highlights for an article
- `delete_highlight` - Remove highlights

**Search & Discovery:**
- `list_bookmarks` - List articles from folders with sync support
- `search_bookmarks` - Find articles by title, URL, or description

**Content Access:**
- `get_article_content` - Fetch full text of a single article
- `get_articles_content_bulk` - Fetch content from multiple articles at once for bulk analysis

### 📚 Resources (Data Claude Can Read)

- `instapaper://bookmarks/unread` - All unread articles
- `instapaper://bookmarks/archive` - Archived articles
- `instapaper://bookmarks/starred` - Starred articles
- `instapaper://folders` - List of folders
- `instapaper://folder/{folder_id}` - Articles in a specific folder
- `instapaper://article/{bookmark_id}` - Full text of an article

### 💡 Prompts (Reusable Workflows)

- `weekly_reading_digest` - Organized summary of unread articles
- `recommend_next_read` - AI-powered reading suggestions
- `research_synthesis` - Synthesize insights from articles on a topic
- `organize_backlog` - Suggest folder organization
- `archive_candidates` - Identify old articles to archive
- `save_as_private_bookmark` - Guidelines for saving private content and generated insights

## Installation

### Prerequisites

1. **Node.js 18+** installed on your system
2. **Instapaper account** with API credentials

### Step 1: Get Instapaper API Credentials

1. Go to https://www.instapaper.com/api
2. Fill out the API access request form
3. Wait for approval (usually takes a few days)
4. You'll receive a Consumer Key and Consumer Secret

### Step 2: Clone and Install

```bash
# Clone or download this repository
cd instapaper-mcp-server

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
```

### Step 3: Configure Environment Variables

Edit `.env` and add your credentials:

```env
INSTAPAPER_CONSUMER_KEY=your_consumer_key_here
INSTAPAPER_CONSUMER_SECRET=your_consumer_secret_here
INSTAPAPER_USERNAME=your_instapaper_email@example.com
INSTAPAPER_PASSWORD=your_instapaper_password
```

### Step 4: Build the Server

```bash
npm run build
```

## Usage with Claude Desktop

### Configure Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "instapaper": {
      "command": "node",
      "args": ["/absolute/path/to/instapaper-mcp-server/build/index.js"],
      "env": {
        "INSTAPAPER_CONSUMER_KEY": "your_consumer_key",
        "INSTAPAPER_CONSUMER_SECRET": "your_consumer_secret",
        "INSTAPAPER_USERNAME": "your_email",
        "INSTAPAPER_PASSWORD": "your_password"
      }
    }
  }
}
```

**Important:** Replace `/absolute/path/to/instapaper-mcp-server` with the actual full path.

### Restart Claude Desktop

After updating the config, restart Claude Desktop completely (quit and reopen).

## Example Usage

Once configured, you can interact with Instapaper through Claude. Here are real-world examples showing what happens when you make requests:

### Example 1: Organize Recent Bookmarks by Topic

**You ask Claude:**
```
"Organize my recent bookmarks by topic"
```

**Claude's workflow:**
1. Fetches your unread bookmarks using `list_bookmarks`
2. Analyzes the titles and URLs to identify topics (e.g., "AI/ML", "Design", "Product Management")
3. Creates new folders for each topic using `create_folder`
4. Gets the bookmark IDs for articles in each category
5. Uses `move_bookmarks_bulk` to organize them all at once

**You see:**
```
✓ Fetched 47 unread bookmarks
✓ Identified topics: AI & Machine Learning (12), UX Design (15), Product Strategy (11), Other (9)
✓ Created folders: "AI & ML", "UX Design", "Product Strategy"
✓ Moved 38 bookmarks to topic folders:
  - AI & ML: 12 moved
  - UX Design: 15 moved  
  - Product Strategy: 11 moved

Your bookmarks are now organized by topic!
```

### Example 2: Review Top Articles and Sync Across Devices

**You ask Claude:**
```
"Show me my starred articles and mark the most interesting ones as fully read"
```

**Claude's workflow:**
1. Fetches starred bookmarks using `list_bookmarks` with `folder: "starred"`
2. Retrieves full article text for your starred items using `get_articles_content_bulk`
3. Analyzes the content and identifies the most compelling articles
4. Updates reading progress for selected articles using `update_read_progress_bulk`

**You see:**
```
✓ Found 24 starred articles
✓ Fetched full text from 24 articles in parallel
✓ Most interesting articles:
  1. "The Future of Design Systems" - Design patterns at scale
  2. "Rethinking Product Strategy" - How great teams think about roadmaps
  3. "AI-Assisted Development" - New tools reshaping engineering

✓ Marked these 3 articles as fully read
✓ Progress updated across your devices
```

### Example 3: Batch Process and Archive

**You ask Claude:**
```
"Archive all articles older than 3 months that I haven't starred"
```

**Claude's workflow:**
1. Lists all unread bookmarks with timestamps
2. Filters for articles older than 3 months
3. Excludes any that are starred
4. Uses `archive_bookmarks_bulk` to move them all to archive

**You see:**
```
✓ Analyzed 128 bookmarks
✓ Found 47 articles older than 3 months, not starred
✓ Archived 47 bookmarks in parallel:
  - Successfully archived: 47
  - Errors: 0

Your queue is now more focused on recent content!
```

### Example 4: Research Synthesis

**You ask Claude:**
```
"Find all my articles about remote work culture and create a summary"
```

**Claude's workflow:**
1. Searches bookmarks using `search_bookmarks` for "remote work culture"
2. Fetches full article content using `get_articles_content_bulk`
3. Synthesizes key insights from all articles
4. Optionally stars the most relevant articles using `star_bookmarks_bulk`

**You see:**
```
✓ Found 8 articles about remote work culture
✓ Retrieved full text from all 8 articles
✓ Analysis: Key themes across your reading:
  - Asynchronous communication is critical (5/8 articles)
  - Building trust in distributed teams (6/8 articles)
  - Time zone management strategies (4/8 articles)

✓ Key takeaways:
  - Documentation and clarity reduce misunderstandings
  - Regular 1-on-1s maintain relationships
  - Async-first mindset improves flexibility

✓ Starred your 3 most-cited articles for reference
```

### Example 5: Quick Content Pipeline

**You ask Claude:**
```
"Save this research summary to Instapaper with the 'AI Research' folder"
```

**Claude's workflow:**
1. Saves article using `add_bookmark` to specified folder
2. Confirms save is complete

**You see:**
```
✓ Saved to Instapaper:
  - Title: "AI Research Summary - Week 48"
  - Folder: AI Research
  - Ready to read on any device

The article will sync to your Kindle in a few minutes.
```

## Development

### Run in Development Mode

```bash
# Watch for changes
npm run watch

# Test with MCP Inspector
npm run inspector
```

### Project Structure

```
instapaper-mcp-server/
├── src/
│   ├── index.ts              # Main MCP server
│   └── instapaper-client.ts  # Instapaper API client
├── build/                     # Compiled JavaScript
├── .env                       # Your credentials (git-ignored)
├── .env.example              # Template
├── package.json
└── tsconfig.json
```

## Troubleshooting

### Authentication Errors

If you see authentication errors:
1. Verify your credentials in `.env`
2. Ensure you have API access (check your Instapaper email)
3. Try re-authenticating by restarting Claude Desktop

### Tools Not Showing Up

1. Check that the path in `claude_desktop_config.json` is absolute
2. Verify the server builds successfully: `npm run build`
3. Check Claude Desktop logs for errors

### API Rate Limits

Instapaper has rate limits. If you hit them:
- Wait a few minutes before trying again
- Reduce the frequency of requests
- Use resources (reading data) instead of tools when possible

## Advanced Features

### Reading Full Article Text

```
"Read the full text of bookmark ID 12345 and summarize it"
```

Claude will use the `instapaper://article/{bookmark_id}` resource to access the full article content.

### Folder-Based Research

```
"Analyze all articles in my 'User Research' folder and identify common themes"
```

### Highlight Management

```
"Add a highlight to bookmark 12345: 'Users prefer familiar patterns over novel ones' at position 1000"

"Show me all my highlights from the article about design systems"
```

### Bulk Operations

**Bulk Content Analysis:**
```
"Get the content from bookmarks 123, 124, and 125 and identify common themes"

"Fetch all articles in my 'AI Research' folder and analyze them for recent developments"
```

**Bulk Organization:**
```
"Move bookmarks 100, 101, 102, and 103 to my 'UX Research' folder"

"Star all the articles I just found about design systems"

"Archive all bookmarks 200-210"
```

**Bulk Status Updates:**
```
"Mark bookmarks 50, 51, and 52 as fully read (progress 1.0)"

"Unarchive my last 10 archived articles"
```

All bulk operations execute requests in parallel for maximum efficiency and return detailed results including success count, failure count, and per-item status.

## Integration Ideas

### With Your Ghost Blog

Since you run a blog, you could:
1. Research articles from Instapaper
2. Have Claude synthesize insights
3. Draft blog posts informed by your reading
4. Save drafts back to Instapaper for review on Kindle

### For UX Research

1. Save research articles to specific folders
2. Use prompts to synthesize findings
3. Track reading progress on long reports
4. Highlight key insights for later reference


## Security Notes

- Your `.env` file contains sensitive credentials - never commit it to git
- The `.gitignore` file is configured to exclude `.env`
- API credentials are stored locally on your machine
- Claude Desktop launches the server locally - nothing is sent to external servers except Instapaper's official API

## License

MIT

## Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

## Resources

- [Instapaper API Documentation](https://www.instapaper.com/api)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## Changelog

### v1.2.0 (Latest)
- Added 5 new bulk operation tools with parallel processing:
  - `star_bookmarks_bulk` - Star multiple bookmarks at once
  - `unstar_bookmarks_bulk` - Remove stars from multiple bookmarks
  - `archive_bookmarks_bulk` - Archive multiple bookmarks in parallel
  - `unarchive_bookmarks_bulk` - Restore multiple bookmarks from archive
  - `update_read_progress_bulk` - Update progress for multiple articles
- Added `list_bookmarks` tool with advanced filtering and sync support
- Added `reorder_folders` tool for custom folder organization
- Enhanced bulk operation documentation with examples
- All bulk tools provide detailed success/failure statistics

### v1.1.0
- Added `get_article_content` tool for fetching individual article text
- Added `get_articles_content_bulk` tool for bulk article content retrieval
- Enhanced parallel processing for better performance
- Improved error handling in bulk operations

### v1.0.0
- Initial release
- Complete implementation of Instapaper API
- All tools, resources, and prompts
- OAuth 1.0 authentication
- Comprehensive error handling
