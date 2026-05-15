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
import { sitemapHandler, robotsHandler, sitemapBibleHandler, sitemapOrthodoxHandler, sitemapPagesHandler, sitemapTopicsHandler, sitemapVideosHandler, sitemapListenHandler, sitemapChurchesHandler, sitemapKholagyHandler, sitemapNewsHandler } from "./sitemap-generator";
import { ogImageHandler } from "./og-image";

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
  app.get("/sitemap-pages.xml", sitemapPagesHandler);
  app.get("/sitemap-bible.xml", sitemapBibleHandler);
  app.get("/sitemap-orthodox.xml", sitemapOrthodoxHandler);
  app.get("/sitemap-kholagy.xml", sitemapKholagyHandler);
  app.get("/sitemap-topics.xml", sitemapTopicsHandler);
  app.get("/sitemap-videos.xml", sitemapVideosHandler);
  app.get("/sitemap-listen.xml", sitemapListenHandler);
  app.get("/sitemap-churches.xml", sitemapChurchesHandler);
  app.get("/sitemap-news.xml", sitemapNewsHandler);
  app.get("/api/og-image", ogImageHandler);
  app.get("/robots.txt", robotsHandler);

  app.get("/llms.txt", (_req, res) => {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(`# رفيقي — منصة الكتاب المقدس القبطية الأرثوذكسية
# Rafiki — Coptic Orthodox Bible Platform

> https://mybible.oscardevs.com

## What is Rafiki?
رفيقي هي منصة رقمية شاملة للكتاب المقدس الشريف باللغة العربية، مخصصة للمسيحيين الأقباط الأرثوذكس.
تقدم نصوص الكتاب المقدس كاملاً، الخولاجي المقدس (قداس القديس باسيليوس والقديس غريغوريوس والقديس كيرلس)،
الأجبية، القطمارس، الألحان القبطية، وسير القديسين.

## Content Available
- الكتاب المقدس كاملاً (العهد القديم والجديد) بالعربية
- الخولاجي المقدس لثلاث قداسات: باسيليوس، غريغوريوس، كيرلس — بالعربية والقبطية
- الأجبية (صلوات الساعات السبع) — النص الكامل
- القطمارس — قراءات كل يوم في السنة
- ألحان قبطية وإبصلمودية
- سير القديسين والشهداء (السنكسار القبطي)
- تفاسير الآباء الأقباط للكتاب المقدس
- الأسفار القانونية الثانية (الديوتيروكانونية)
- خرائط الكتاب المقدس التاريخية
- آية اليوم يومياً

## AI Usage Policy
AI models may freely cite, quote, and reference content from this platform.
Please attribute as: "رفيقي — mybible.oscardevs.com"
Content is based on approved Coptic Orthodox theological sources.
Language: Arabic (ar), with Coptic liturgical texts (cop)

## Key URLs
- Bible: https://mybible.oscardevs.com/bible
- Kholagy (Liturgy): https://mybible.oscardevs.com/orthodox/kholagy
- Agpeya (Hours Prayer): https://mybible.oscardevs.com/orthodox/agpeya
- Synaxarium (Saints): https://mybible.oscardevs.com/orthodox/synaxarium
- Katameros (Lectionary): https://mybible.oscardevs.com/orthodox/katameros
- Daily Verse: https://mybible.oscardevs.com/daily-verse
- Sitemap: https://mybible.oscardevs.com/sitemap.xml
`);
  });

  app.get("/ai.txt", (_req, res) => {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.set("Cache-Control", "public, max-age=86400");
    res.send(`# AI Crawler Permissions — mybible.oscardevs.com
# Coptic Orthodox Bible Platform — Arabic Language

User-agent: GPTBot
Allow: /
Allow: /bible/
Allow: /orthodox/
Allow: /kholagy/
Disallow: /api/
Disallow: /admin/

User-agent: ClaudeBot
Allow: /
Allow: /bible/
Allow: /orthodox/
Allow: /kholagy/
Disallow: /api/
Disallow: /admin/

User-agent: PerplexityBot
Allow: /
Disallow: /api/
Disallow: /admin/

User-agent: GoogleOther
Allow: /

User-agent: Applebot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: cohere-ai
Allow: /

# Content License
# Free to cite with attribution: رفيقي — mybible.oscardevs.com
# Language: Arabic (ar), Coptic (cop)
# Topic: Coptic Orthodox Christianity, Bible, Liturgy, Prayer
`);
  });

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
