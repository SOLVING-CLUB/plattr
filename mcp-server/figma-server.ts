#!/usr/bin/env node
/**
 * MCP Server for Figma Design Integration
 * 
 * This MCP server provides tools to:
 * - Fetch Figma designs
 * - Download assets from Figma
 * - Extract design information
 * 
 * Usage: Run this as an MCP server that can be connected to Cursor/Claude
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import "dotenv/config";
import {
  downloadFigmaDesign,
  extractFigmaInfo,
  fetchFigmaFile,
  exportFigmaImages,
  downloadFigmaAsset,
} from "../server/figma.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

// Define MCP tools
const tools: Tool[] = [
  {
    name: "fetch_figma_design",
    description:
      "Fetches information about a Figma design file. Returns the file structure, components, and styles.",
    inputSchema: {
      type: "object",
      properties: {
        figmaUrl: {
          type: "string",
          description:
            "The Figma URL (supports both /file/ and /design/ formats). Example: https://www.figma.com/design/Wnze1HBpIekqAg8DApbACq/Plattr--Copy-",
        },
      },
      required: ["figmaUrl"],
    },
  },
  {
    name: "download_figma_assets",
    description:
      "Downloads assets (images) from a specific node in a Figma design. Saves them to the attached_assets folder.",
    inputSchema: {
      type: "object",
      properties: {
        figmaUrl: {
          type: "string",
          description:
            "The Figma URL with node-id parameter. Example: https://www.figma.com/design/Wnze1HBpIekqAg8DApbACq/Plattr--Copy-?node-id=2001-1744",
        },
        outputPrefix: {
          type: "string",
          description:
            "Prefix for downloaded files (default: 'figma'). Files will be named: {prefix}_{timestamp}.png",
          default: "figma",
        },
        format: {
          type: "string",
          enum: ["png", "jpg", "svg", "pdf"],
          description: "Export format (default: png)",
          default: "png",
        },
        scale: {
          type: "number",
          description: "Export scale/quality (1, 2, 3, or 4). Default: 2",
          default: 2,
        },
      },
      required: ["figmaUrl"],
    },
  },
  {
    name: "list_figma_assets",
    description:
      "Lists all downloaded Figma assets in the attached_assets folder.",
    inputSchema: {
      type: "object",
      properties: {
        prefix: {
          type: "string",
          description: "Filter by prefix (e.g., 'figma', 'splash')",
        },
      },
    },
  },
  {
    name: "extract_figma_node_info",
    description:
      "Extracts file key and node ID from a Figma URL. Useful for understanding the structure of a Figma URL.",
    inputSchema: {
      type: "object",
      properties: {
        figmaUrl: {
          type: "string",
          description: "The Figma URL to parse",
        },
      },
      required: ["figmaUrl"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "figma-design-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!FIGMA_ACCESS_TOKEN) {
    throw new Error(
      "FIGMA_ACCESS_TOKEN not configured. Please set it in your .env file."
    );
  }

  try {
    switch (name) {
      case "fetch_figma_design": {
        const { figmaUrl } = args as { figmaUrl: string };
        const { fileKey } = extractFigmaInfo(figmaUrl);
        const fileData = await fetchFigmaFile(fileKey, FIGMA_ACCESS_TOKEN);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  fileKey,
                  fileName: fileData.document.name,
                  document: fileData.document,
                  components: Object.keys(fileData.components || {}).length,
                  styles: Object.keys(fileData.styles || {}).length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "download_figma_assets": {
        const {
          figmaUrl,
          outputPrefix = "figma",
          format = "png",
          scale = 2,
        } = args as {
          figmaUrl: string;
          outputPrefix?: string;
          format?: "png" | "jpg" | "svg" | "pdf";
          scale?: number;
        };

        const { fileKey, nodeId } = extractFigmaInfo(figmaUrl);

        if (!nodeId) {
          throw new Error(
            "No node ID found in URL. Please include ?node-id=... in the Figma URL"
          );
        }

        // Export images
        const imageResponse = await exportFigmaImages(
          fileKey,
          [nodeId],
          FIGMA_ACCESS_TOKEN,
          format,
          scale
        );

        if (imageResponse.error) {
          throw new Error("Failed to export images from Figma");
        }

        const downloadedFiles: string[] = [];

        // Download each image
        for (const [nodeId, imageUrl] of Object.entries(imageResponse.images)) {
          const timestamp = Date.now();
          const filename = `${outputPrefix}_${timestamp}.${format}`;
          const filePath = await downloadFigmaAsset(imageUrl, filename);
          downloadedFiles.push(filePath);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Downloaded ${downloadedFiles.length} file(s)`,
                  files: downloadedFiles.map((file) => path.basename(file)),
                  filePaths: downloadedFiles,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_figma_assets": {
        const { prefix } = (args as { prefix?: string }) || {};
        const assetsDir = path.resolve(__dirname, "../attached_assets");

        try {
          const files = await fs.readdir(assetsDir);
          const filteredFiles = prefix
            ? files.filter((file) => file.startsWith(prefix))
            : files;

          const fileInfo = await Promise.all(
            filteredFiles.map(async (file) => {
              const filePath = path.join(assetsDir, file);
              const stats = await fs.stat(filePath);
              return {
                name: file,
                size: stats.size,
                modified: stats.mtime.toISOString(),
              };
            })
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    count: fileInfo.length,
                    files: fileInfo,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error: any) {
          throw new Error(`Failed to list assets: ${error.message}`);
        }
      }

      case "extract_figma_node_info": {
        const { figmaUrl } = args as { figmaUrl: string };
        const info = extractFigmaInfo(figmaUrl);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  fileKey: info.fileKey,
                  nodeId: info.nodeId,
                  apiNodeId: info.nodeId?.replace(/-/g, ":"),
                  explanation: info.nodeId
                    ? "Node ID found. You can use this URL to download assets."
                    : "No node ID found. Add ?node-id=... to download specific nodes.",
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
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Figma MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

