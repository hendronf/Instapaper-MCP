# Quick Start Guide

Get up and running with the Instapaper MCP Server in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Instapaper account
- Instapaper API credentials (request at https://www.instapaper.com/api)

## Installation

```bash
# 1. Navigate to the project directory
cd instapaper-mcp-server

# 2. Install dependencies
npm install

# 3. Create and configure your .env file
cp .env.example .env
# Edit .env with your API credentials

# 4. Build the server
npm run build
```

## Configure Claude Desktop

Find your config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration (replace the path with your actual path):

```json
{
  "mcpServers": {
    "instapaper": {
      "command": "node",
      "args": ["/FULL/PATH/TO/instapaper-mcp-server/build/index.js"],
      "env": {
        "INSTAPAPER_CONSUMER_KEY": "your_key",
        "INSTAPAPER_CONSUMER_SECRET": "your_secret",
        "INSTAPAPER_USERNAME": "your_email",
        "INSTAPAPER_PASSWORD": "your_password"
      }
    }
  }
}
```

## Restart Claude Desktop

Completely quit and reopen Claude Desktop.

## Test It Out

In Claude, try:

```
"What's in my Instapaper unread queue?"
```

or

```
"Save this article to Instapaper: https://example.com/great-article
Title: Interesting Read
Description: Notes from my research"
```

## Troubleshooting

**Server not connecting?**
- Verify the path in config is absolute (starts with `/` on Mac/Linux)
- Check `.env` file has correct credentials
- Run `npm run build` to ensure it compiled successfully

**Authentication failing?**
- Confirm you have API access from Instapaper
- Double-check username and password in `.env`
- Ensure consumer key/secret are correct

**Tools not appearing?**
- Restart Claude Desktop completely
- Check the build folder exists: `ls build/`
- View Claude Desktop logs for errors

## What You Can Do

### Save & Organize
- Add bookmarks with descriptions
- Create folders and organize articles
- Star important articles
- Track reading progress

### Read & Research
- Access full article text
- Search across your library
- Get reading recommendations
- Synthesize research on topics

### Workflows
- Weekly reading digests
- Archive old articles
- Organize backlog
- Extract highlights

See the main [README.md](README.md) for complete documentation.
