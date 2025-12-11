# MCP Server for Figma Design Integration

This project includes an MCP (Model Context Protocol) server that allows AI assistants (like Cursor's AI) to directly interact with Figma designs.

## What is MCP?

MCP (Model Context Protocol) is a protocol that enables AI assistants to use external tools and services. With this MCP server, you can:

- Ask the AI to fetch Figma designs
- Download assets from Figma automatically
- Extract design information
- List downloaded assets

## Setup

### 1. Install Dependencies

The MCP SDK is already added to `package.json`. Install it:

```bash
npm install
```

### 2. Configure Environment

Make sure your `.env` file has the Figma access token:

```bash
FIGMA_ACCESS_TOKEN=your_token_here
```

### 3. Configure Cursor

The MCP server is configured in `.cursor/mcp.json`. Cursor should automatically detect it.

If you need to manually configure:

1. Open Cursor Settings
2. Go to "Features" → "Model Context Protocol"
3. Add a new server:
   - Name: `figma-design`
   - Command: `npm`
   - Args: `["run", "mcp:figma"]`
   - Environment: Set `FIGMA_ACCESS_TOKEN` to your token

## Available Tools

The MCP server provides these tools:

### 1. `fetch_figma_design`
Fetches information about a Figma design file.

**Example usage:**
```
"Fetch the Figma design from https://www.figma.com/design/Wnze1HBpIekqAg8DApbACq/Plattr--Copy-"
```

### 2. `download_figma_assets`
Downloads assets (images) from a specific node in a Figma design.

**Example usage:**
```
"Download the splash screen assets from https://www.figma.com/design/Wnze1HBpIekqAg8DApbACq/Plattr--Copy-?node-id=2001-1744"
```

**Parameters:**
- `figmaUrl` (required): The Figma URL with node-id
- `outputPrefix` (optional): File prefix (default: "figma")
- `format` (optional): Export format - "png", "jpg", "svg", or "pdf" (default: "png")
- `scale` (optional): Export scale 1-4 (default: 2)

### 3. `list_figma_assets`
Lists all downloaded Figma assets.

**Example usage:**
```
"List all Figma assets" or "Show me the splash screen assets"
```

### 4. `extract_figma_node_info`
Extracts file key and node ID from a Figma URL.

**Example usage:**
```
"Parse this Figma URL: https://www.figma.com/design/..."
```

## Usage Examples

### Example 1: Download Splash Screen Assets

You can ask the AI:

> "Download the splash screen design from this Figma URL: https://www.figma.com/design/Wnze1HBpIekqAg8DApbACq/Plattr--Copy-?node-id=2001-1744"

The AI will:
1. Extract the file key and node ID
2. Export the images from Figma
3. Download them to `attached_assets/`
4. Tell you the file names

### Example 2: Fetch Design Information

> "Get information about the Plattr design file"

The AI will fetch and show you:
- File name
- Document structure
- Number of components
- Number of styles

### Example 3: List Downloaded Assets

> "What Figma assets have been downloaded?"

The AI will list all files in `attached_assets/` that match the prefix.

## Testing the MCP Server

You can test the server directly:

```bash
npm run mcp:figma
```

The server runs on stdio and communicates via the MCP protocol.

## Troubleshooting

### "FIGMA_ACCESS_TOKEN not configured"
- Make sure your `.env` file has the token
- Restart Cursor after adding the token

### MCP Server not connecting
- Check that `npm run mcp:figma` works in your terminal
- Verify the `.cursor/mcp.json` configuration
- Restart Cursor

### "Invalid Figma URL"
- Make sure the URL includes `?node-id=...` for downloading assets
- URLs should be in format: `https://www.figma.com/design/{FILE_KEY}/...?node-id={NODE_ID}`

## Integration with Your Workflow

Once set up, you can:

1. **Share Figma URLs with AI**: Just paste a Figma URL and ask the AI to download assets
2. **Automatic Asset Management**: The AI can download and organize assets automatically
3. **Design-to-Code**: The AI can fetch design specs and implement them in your code

## Files

- `mcp-server/figma-server.ts` - The MCP server implementation
- `.cursor/mcp.json` - Cursor MCP configuration
- `server/figma.ts` - Core Figma API functions

## References

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Figma API Documentation](https://www.figma.com/developers/api)

