import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Figma API integration for downloading design assets
 * 
 * To use:
 * 1. Get your Figma Personal Access Token from: https://www.figma.com/developers/api#access-tokens
 * 2. Set FIGMA_ACCESS_TOKEN in your .env file
 * 3. Use the Figma file key from the URL: https://www.figma.com/file/{FILE_KEY}/...
 * 4. Use the node ID from the URL: ...?node-id={NODE_ID}
 */

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
}

export interface FigmaFileResponse {
  document: FigmaNode;
  components: Record<string, any>;
  styles: Record<string, any>;
}

export interface FigmaImageResponse {
  images: Record<string, string>;
  error?: boolean;
}

/**
 * Fetch Figma file data
 */
export async function fetchFigmaFile(
  fileKey: string,
  accessToken: string
): Promise<FigmaFileResponse> {
  const response = await fetch(
    `https://api.figma.com/v1/files/${fileKey}`,
    {
      headers: {
        'X-Figma-Token': accessToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Export images from Figma nodes
 */
export async function exportFigmaImages(
  fileKey: string,
  nodeIds: string[],
  accessToken: string,
  format: 'png' | 'jpg' | 'svg' | 'pdf' = 'png',
  scale: number = 2
): Promise<FigmaImageResponse> {
  const nodeIdsParam = nodeIds.join(',');
  const response = await fetch(
    `https://api.figma.com/v1/images/${fileKey}?ids=${nodeIdsParam}&format=${format}&scale=${scale}`,
    {
      headers: {
        'X-Figma-Token': accessToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Figma API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Download image from URL and save to attached_assets
 */
export async function downloadFigmaAsset(
  imageUrl: string,
  filename: string
): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const assetsDir = path.resolve(__dirname, '../attached_assets');
  
  // Ensure directory exists
  await fs.mkdir(assetsDir, { recursive: true });
  
  const filePath = path.join(assetsDir, filename);
  await fs.writeFile(filePath, Buffer.from(buffer));
  
  return filePath;
}

/**
 * Extract node IDs from Figma URL
 */
export function extractFigmaInfo(url: string): { fileKey: string; nodeId?: string } {
  // Extract file key: supports both /file/ and /design/ formats
  // https://www.figma.com/file/{FILE_KEY}/... or
  // https://www.figma.com/design/{FILE_KEY}/...
  const fileKeyMatch = url.match(/\/(?:file|design)\/([a-zA-Z0-9]+)/);
  if (!fileKeyMatch) {
    throw new Error('Invalid Figma URL: Could not extract file key. URL should contain /file/ or /design/');
  }
  
  const fileKey = fileKeyMatch[1];
  
  // Extract node ID: ...?node-id={NODE_ID}
  // Node IDs in URLs use dashes, but API needs colons
  const nodeIdMatch = url.match(/node-id=([^&]+)/);
  const nodeId = nodeIdMatch ? decodeURIComponent(nodeIdMatch[1].replace(/-/g, ':')) : undefined;
  
  return { fileKey, nodeId };
}

/**
 * Main function to download assets from Figma design
 */
export async function downloadFigmaDesign(
  figmaUrl: string,
  accessToken: string,
  outputPrefix: string = 'figma'
): Promise<string[]> {
  const { fileKey, nodeId } = extractFigmaInfo(figmaUrl);
  
  if (!nodeId) {
    throw new Error('No node ID found in URL. Please include ?node-id=... in the Figma URL');
  }
  
  // Export images
  const imageResponse = await exportFigmaImages(fileKey, [nodeId], accessToken, 'png', 2);
  
  if (imageResponse.error) {
    throw new Error('Failed to export images from Figma');
  }
  
  const downloadedFiles: string[] = [];
  
  // Download each image
  for (const [nodeId, imageUrl] of Object.entries(imageResponse.images)) {
    const timestamp = Date.now();
    const filename = `${outputPrefix}_${timestamp}.png`;
    const filePath = await downloadFigmaAsset(imageUrl, filename);
    downloadedFiles.push(filePath);
    console.log(`Downloaded: ${filename}`);
  }
  
  return downloadedFiles;
}

