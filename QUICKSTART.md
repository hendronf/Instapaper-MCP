# Quick Start Guide

Get up and running with the Instapaper MCP Server in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Instapaper account
- An Instapaper personal access token:
  1. Sign in and register an app at https://www.instapaper.com/developers/applications/create (created instantly)
  2. On the app's page, click **Generate access token** and copy it (shown only once)

## Installation

```bash
# 1. Navigate to the project directory
cd instapaper-mcp-server

# 2. Install dependencies
npm install

# 3. Create your .env file and set INSTAPAPER_ACCESS_TOKEN
cp .env.example .env
chmod 600 .env

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
      "args": ["/FULL/PATH/TO/instapaper-mcp-server/build/index.js"]
    }
  }
}
```

The server reads the token from the project's `.env`, so it doesn't need to be in this config.

## Restart Claude Desktop

Completely quit and reopen Claude Desktop.

## Or: Claude Code

```bash
claude mcp add -s user instapaper -- node /FULL/PATH/TO/instapaper-mcp-server/build/index.js
```

Then start a new Claude Code session.

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
- Check `.env` has `INSTAPAPER_ACCESS_TOKEN`
- Run `npm run build` to ensure it compiled successfully

**Authentication failing (401/403)?**
- Double-check the token in `.env`
- If it was lost or revoked, generate a new one on your app's page at https://www.instapaper.com/developers/applications

**Tools not appearing?**
- Restart Claude Desktop completely
- Check the build folder exists: `ls build/`
- View Claude Desktop logs for errors

## What You Can Do

### Save & Organize
- Add bookmarks with descriptions
- Create folders and organize articles
- Star important articles
- Tag articles, rename and merge tags
- Track reading progress

### Read & Research
- Access full article text, with author and publication date
- Search across your whole library
- Get reading recommendations
- Synthesize research on topics

### Workflows
- Weekly reading digests
- Archive old articles
- Organize backlog
- Extract highlights

See the main [README.md](README.md) for complete documentation.
