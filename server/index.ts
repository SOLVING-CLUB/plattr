import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

// Verify environment variables are loaded
if (!process.env.RAZORPAY_KEY_ID) {
  console.warn("[Server] WARNING: RAZORPAY_KEY_ID is not set in environment variables");
  console.warn("[Server] Make sure your .env file is in the project root and contains RAZORPAY_KEY_ID");
} else {
  console.log("[Server] ✓ RAZORPAY_KEY_ID is configured");
}

if (!process.env.RAZORPAY_KEY_SECRET) {
  console.warn("[Server] WARNING: RAZORPAY_KEY_SECRET is not set in environment variables");
} else {
  console.log("[Server] ✓ RAZORPAY_KEY_SECRET is configured");
}

// Check Firebase configuration for notifications
if (!process.env.FIREBASE_PROJECT_ID) {
  console.warn("[Server] WARNING: FIREBASE_PROJECT_ID is not set. Push notifications may not work.");
  console.warn("[Server] Set FIREBASE_PROJECT_ID=plattr-cf2ce in your .env file");
} else {
  console.log("[Server] ✓ FIREBASE_PROJECT_ID is configured:", process.env.FIREBASE_PROJECT_ID);
}

// Check if Firebase credentials are available (optional - will use Application Default Credentials if not set)
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.log("[Server] ✓ Firebase service account credentials found");
} else {
  console.log("[Server] ℹ Firebase will use Application Default Credentials (if available)");
}

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
      port,
    "0.0.0.0",
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
