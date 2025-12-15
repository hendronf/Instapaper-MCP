# Instapaper MCP Server

A comprehensive Model Context Protocol (MCP) server for Instapaper integration. This server allows Claude and other MCP clients to interact with your Instapaper account - reading, saving, organizing, and analyzing your articles.

## Features

### 🛠️ Tools (Actions)

**Content Management:**
- `add_bookmark` - Save articles with title, description, and folder
- `delete_bookmark` - Remove articles
- `archive_bookmark` - Move articles to archive
- `unarchive_bookmark` - Restore from archive
- `star_bookmark` - Mark as important
- `unstar_bookmark` - Remove star
- `move_bookmark` - Organize into folders
- `update_read_progress` - Track reading progress

**Folder Management:**
- `list_folders` - View all folders
- `create_folder` - Create new folders
- `delete_folder` - Remove folders

**Highlights:**
- `add_highlight` - Save important passages
- `list_highlights` - View highlights for an article
- `delete_highlight` - Remove highlights

**Search:**
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

Once configured, you can interact with Instapaper through Claude:

### Save Articles

```
"Save this article to Instapaper: https://example.com/article
Title: Great UX Patterns
Description: Research on mobile navigation patterns"
```

### Organize Your Reading

```
"What's in my unread Instapaper queue?"

"Create a folder called 'UX Research' and move all articles about user research into it"
```

### Research Workflows

```
"Find all my Instapaper articles about AI in design and create a synthesis of the key insights"

"What should I read next based on my starred articles?"
```

### Analysis

```
"Analyze my reading patterns - what topics am I saving most?"

"Give me a weekly digest of my unread articles, organized by topic"
```

### Content Pipeline

```
"I just finished analyzing this design challenge. Save a summary to Instapaper so I can read it on my Kindle later."
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

### Bulk Content Analysis

```
"Get the content from bookmarks 123, 124, and 125 and identify common themes"

"Fetch all articles in my 'AI Research' folder and analyze them for recent developments"
```

The bulk content tool fetches multiple articles in parallel for faster processing.

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

### v1.1.0 (Latest)
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
