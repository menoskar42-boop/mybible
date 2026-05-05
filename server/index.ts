import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import { registerRoutes } from "./routes";
import { registerGroupRoutes } from "./group-routes";
import { registerChurchRoutes } from "./church-routes";
import { registerChallengeRoutes } from "./challenge-routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { autoSeedIfNeeded } from "./auto-seed";
import { botSnapshotMiddleware } from "./bot-snapshot";
import { sitemapHandler, robotsHandler } from "./sitemap-generator";

const app = express();
const httpServer = createServer(app);

// Trust the proxy in production (Replit's reverse proxy)
app.set('trust proxy', 1);

// Detect if we're running behind Replit's HTTPS proxy
const isProduction = process.env.NODE_ENV === 'production';

// Setup PostgreSQL session store for production compatibility
const PgSession = connectPgSimple(session);
const pgPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(
  session({
    store: new PgSession({
      pool: pgPool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'bible-companion-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
    },
  })
);

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

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

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
  registerGroupRoutes(app);
  registerChurchRoutes(app);
  registerChallengeRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  app.get("/sitemap.xml", sitemapHandler);
  app.get("/robots.txt", robotsHandler);

  app.use(botSnapshotMiddleware);

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
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      
      // Run database seeding in the background after server starts
      console.log('[startup] Starting background database seed...');
      autoSeedIfNeeded()
        .then(() => {
          console.log('[startup] Background database seed complete');
        })
        .catch((error) => {
          console.error('[startup] Background database seed failed:', error);
        });
    },
  );
})();
