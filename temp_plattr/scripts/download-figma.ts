#!/usr/bin/env tsx
/**
 * Script to download assets from Figma designs
 * 
 * Usage:
 *   npm run figma:download <FIGMA_URL>
 * 
 * Or set environment variables:
 *   FIGMA_ACCESS_TOKEN=your_token
 *   FIGMA_URL=https://www.figma.com/design/...
 * 
 * Get your Figma token from: https://www.figma.com/developers/api#access-tokens
 */

import "dotenv/config";
import { downloadFigmaDesign, extractFigmaInfo, fetchFigmaFile } from "../server/figma.js";

async function main() {
  const figmaUrl = process.argv[2] || process.env.FIGMA_URL;
  const accessToken = process.env.FIGMA_ACCESS_TOKEN;
  
  if (!figmaUrl) {
    console.error('❌ Error: Figma URL required');
    console.log('\nUsage:');
    console.log('  npm run figma:download <FIGMA_URL>');
    console.log('\nOr set FIGMA_URL environment variable');
    console.log('\nExample:');
    console.log('  npm run figma:download "https://www.figma.com/design/...?node-id=2001-1744"');
    process.exit(1);
  }
  
  if (!accessToken) {
    console.error('❌ Error: FIGMA_ACCESS_TOKEN not set');
    console.log('\nGet your token from: https://www.figma.com/developers/api#access-tokens');
    console.log('Then add it to your .env file:');
    console.log('  FIGMA_ACCESS_TOKEN=your_token_here');
    process.exit(1);
  }
  
  try {
    console.log('📥 Fetching Figma design...');
    const { fileKey, nodeId } = extractFigmaInfo(figmaUrl);
    console.log(`   File Key: ${fileKey}`);
    if (nodeId) {
      console.log(`   Node ID: ${nodeId}`);
    }
    
    // Fetch file info
    const fileData = await fetchFigmaFile(fileKey, accessToken);
    console.log(`   File Name: ${fileData.document.name}`);
    
    // Download assets
    console.log('\n📦 Downloading assets...');
    const downloadedFiles = await downloadFigmaDesign(figmaUrl, accessToken, 'figma');
    
    console.log(`\n✅ Successfully downloaded ${downloadedFiles.length} file(s):`);
    downloadedFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    
    console.log('\n💡 Tip: Update your components to use these new assets!');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('401')) {
      console.log('\n💡 Your Figma access token may be invalid or expired.');
    }
    process.exit(1);
  }
}

main();

