import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Only apply Vite middleware to non-API routes
  // This ensures API routes are handled by Express before Vite intercepts them
  const viteMiddlewareWrapper = (req: any, res: any, next: any) => {
    if (req.path && req.path.startsWith("/api/")) {
      // Skip Vite middleware for API routes - let Express handle them
      return next();
    }
    // Apply Vite middleware for all other routes
    return vite.middlewares(req, res, next);
  };

  app.use(viteMiddlewareWrapper);

  // Catch-all route for serving the React app (must be last, after all API routes)
  // Use app.use() without a path to catch all remaining routes
  app.use(async (req, res, next) => {
    const url = req.originalUrl;

    // Skip Vite handling for API routes - let them be handled by Express routes
    if (url.startsWith("/api/")) {
      return next();
    }

    // Skip if already handled (e.g., by Vite middleware or if response was sent)
    if (res.headersSent) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
