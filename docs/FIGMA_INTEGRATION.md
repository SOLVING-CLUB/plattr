# Figma Design Integration

This project includes tools to automatically download assets from Figma designs and add them to your server.

## Setup

### 1. Get Your Figma Access Token

1. Go to [Figma Account Settings](https://www.figma.com/settings)
2. Scroll to "Personal access tokens"
3. Click "Create a new personal access token"
4. Give it a name (e.g., "Plattr Development")
5. Copy the token

### 2. Add Token to Environment

Add your token to your `.env` file:

```bash
FIGMA_ACCESS_TOKEN=your_figma_token_here
```

## Usage

### Method 1: Command Line Script (Recommended)

Use the npm script to download assets directly:

```bash
npm run figma:download "https://www.figma.com/design/Wnze1HBpIekqAg8DApbACq/Plattr--Copy-?node-id=2001-1744"
```

Or set the URL as an environment variable:

```bash
FIGMA_URL="https://www.figma.com/design/..." npm run figma:download
```

### Method 2: API Endpoint

You can also use the server API endpoint:

```bash
curl -X POST http://localhost:3000/api/figma/download \
  -H "Content-Type: application/json" \
  -d '{
    "figmaUrl": "https://www.figma.com/design/Wnze1HBpIekqAg8DApbACq/Plattr--Copy-?node-id=2001-1744",
    "outputPrefix": "splash"
  }'
```

### Method 3: From Your Code

```typescript
import { downloadFigmaDesign } from './server/figma';

const files = await downloadFigmaDesign(
  'https://www.figma.com/design/...?node-id=2001-1744',
  process.env.FIGMA_ACCESS_TOKEN!,
  'splash'
);
```

## How It Works

1. **Extracts Information**: Parses the Figma URL to get the file key and node ID
2. **Fetches Design**: Uses Figma API to get design information
3. **Exports Images**: Exports the selected node as PNG images (2x scale)
4. **Downloads Assets**: Downloads images and saves them to `/attached_assets`
5. **Returns Paths**: Returns the file paths for use in your code

## Output

Downloaded files are saved to `attached_assets/` with the naming pattern:
- `{prefix}_{timestamp}.png`

Example: `figma_1763115419113.png`

## Using Downloaded Assets

After downloading, you can use the assets in your components:

```typescript
import splashImage from "@assets/figma_1763115419113.png";

// Use in your component
<img src={splashImage} alt="Splash" />
```

## Troubleshooting

### "FIGMA_ACCESS_TOKEN not configured"
- Make sure you've added the token to your `.env` file
- Restart your development server after adding the token

### "Invalid Figma URL"
- Make sure the URL includes the `node-id` parameter
- The URL should look like: `https://www.figma.com/design/...?node-id=2001-1744`

### "Figma API error: 401"
- Your access token may be invalid or expired
- Generate a new token from Figma settings

### "No node ID found in URL"
- Make sure your Figma URL includes `?node-id=...`
- You can get the node ID by:
  1. Selecting the frame/component in Figma
  2. Looking at the URL - it should have `?node-id=...` at the end

## Example: Downloading Splash Screen Assets

For the splash screen design you provided:

```bash
npm run figma:download "https://www.figma.com/design/Wnze1HBpIekqAg8DApbACq/Plattr--Copy-?node-id=2001-1744"
```

This will download the assets and save them to `attached_assets/`. Then update your `SplashScreen.tsx`:

```typescript
import splashImage from "@assets/figma_1763115419113.png";
import logoImage from "@assets/figma_1763119763730.png";
```

## References

- [Figma API Documentation](https://www.figma.com/developers/api)
- [Figma Personal Access Tokens](https://www.figma.com/developers/api#access-tokens)

