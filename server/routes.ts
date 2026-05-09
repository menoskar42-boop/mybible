import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { ensureSessionUser, getCurrentUser, checkPremiumStatus, checkAiUsageLimit } from "./auth";
import { processAiQuery, enhanceSearchWithGroq } from "./ai-service";
import { insertHighlightedVerseSchema, insertUserReadingProgressSchema } from "@shared/schema";
import { seedRelationsIfNeeded, startBackgroundImport, getImportJobStatus, reseedEmotionsAndTopics, importAiEmotionVersesFromCsv, importAiEmotionExamplesFromCsv, appendAiEmotionExamples100k, seedCalendarDailyVerses } from "./auto-seed";
import { getBookIntro, getChapterTafsir, getVerseTafsir, listAvailableBooks } from "./tafsir-service";
import { fetchDaoudLameiRss, clearDaoudLameiCache } from "./daoud-lamei-service";
import { isTopicWorthy, extractKeywords, toSlug, buildTopicTitle } from "./seo-topics";
import { getVideoSeoById, getAllVideoSeoEntries } from "./video-seo-data";
import { fetchTodaySynaxarium } from "./orthodox-service";
import { recalculatePageScore } from "./metrics-service";
import { detectExitReason } from "./exit-intelligence";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 301 redirect: /bible?book=X&chapter=Y → /bible/X/Y (path-based canonical)
  app.get('/bible', (req, res, next) => {
    const { book, chapter } = req.query;
    if (typeof book === 'string' && book) {
      const encodedBook = encodeURIComponent(book);
      if (typeof chapter === 'string' && chapter) {
        return res.redirect(301, `/bible/${encodedBook}/${chapter}`);
      }
      return res.redirect(301, `/bible/${encodedBook}`);
    }
    next();
  });

  // Video SEO metadata endpoint
  app.get('/api/video-seo/:youtubeId', (req, res) => {
    const { youtubeId } = req.params;
    if (!youtubeId || !/^[A-Za-z0-9_\-]+$/.test(youtubeId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }
    const data = getVideoSeoById(youtubeId);
    res.set('Cache-Control', 'public, max-age=86400');
    res.json(data);
  });

  // Video SEO — list all indexed videos
  app.get('/api/video-seo', (_req, res) => {
    const videos = getAllVideoSeoEntries();
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(videos);
  });

  // ── Orthodox: Synaxarium proxy ──────────────────────────────────────────
  app.get('/api/orthodox/synaxarium', async (_req, res) => {
    try {
      const data = await fetchTodaySynaxarium();
      res.set('Cache-Control', 'public, max-age=21600');
      res.json(data);
    } catch (err) {
      console.error('[orthodox] Synaxarium route error:', err);
      res.status(500).json({ copticDate: '', entries: [] });
    }
  });

  // ── Exit Intelligence ─────────────────────────────────────────────────────

  // POST /api/exit — receive exit event, classify, store
  app.post('/api/exit', async (req, res) => {
    try {
      const { pageUrl, timeSpent, scrollDepth, lastClickedElement } = req.body;
      if (!pageUrl || typeof pageUrl !== 'string') {
        return res.status(400).json({ error: 'pageUrl required' });
      }

      const reason = detectExitReason({
        timeSpent: Number(timeSpent) || 0,
        scrollDepth: Number(scrollDepth) || 0,
        lastClickedElement: lastClickedElement || null,
      });

      await storage.insertExitEvent({
        pageUrl: pageUrl.slice(0, 500),
        timeSpent: Math.max(0, Number(timeSpent) || 0),
        scrollDepth: Math.min(100, Math.max(0, Number(scrollDepth) || 0)),
        lastClickedElement: lastClickedElement || null,
        exitReason: reason,
      });

      // Increment issue counter (async — don't block response)
      if (reason !== 'normal_exit') {
        storage.incrementPageIssue(pageUrl, reason).catch(() => {});
      }

      return res.status(204).send();
    } catch (err) {
      console.error('[exit] POST error:', err);
      return res.status(500).json({ error: 'internal error' });
    }
  });

  // GET /api/exit/issues?page=/bible — issues for a specific page
  app.get('/api/exit/issues', async (req, res) => {
    try {
      const page = String(req.query.page || '');
      if (!page) return res.json([]);
      const issues = await storage.getPageIssues(page);
      res.set('Cache-Control', 'public, max-age=600');
      res.json(issues);
    } catch (err) {
      console.error('[exit] issues error:', err);
      res.json([]);
    }
  });

  // GET /api/exit/dashboard — worst pages + top issues for admin panel
  app.get('/api/exit/dashboard', async (_req, res) => {
    try {
      const data = await storage.getExitDashboard();
      res.set('Cache-Control', 'public, max-age=120');
      res.json(data);
    } catch (err) {
      console.error('[exit] dashboard error:', err);
      res.json({ worstPages: [], topIssues: [] });
    }
  });

  // ── Behavioral SEO Metrics ────────────────────────────────────────────────

  // POST /api/metrics — receive page metric from frontend
  app.post('/api/metrics', async (req, res) => {
    try {
      const { pageUrl, timeSpent, scrollPercent, verseClicks, videoClicks, shareClicks } = req.body;

      if (!pageUrl || typeof pageUrl !== 'string') {
        return res.status(400).json({ error: 'pageUrl required' });
      }

      // Get session ID from session (anonymous or user)
      const sessionId: string = (req.session as any)?.id || req.headers['x-session-id'] as string || 'anon';

      await storage.insertPageMetric({
        pageUrl: pageUrl.slice(0, 500),
        sessionId,
        timeSpent: Math.max(0, Number(timeSpent) || 0),
        scrollPercent: Math.min(100, Math.max(0, Number(scrollPercent) || 0)),
        verseClicks: Math.max(0, Number(verseClicks) || 0),
        videoClicks: Math.max(0, Number(videoClicks) || 0),
        shareClicks: Math.max(0, Number(shareClicks) || 0),
      });

      // Async score recalculation — don't await to keep response fast
      recalculatePageScore(pageUrl).catch(() => {});

      return res.status(204).send();
    } catch (err) {
      console.error('[metrics] POST error:', err);
      return res.status(500).json({ error: 'internal error' });
    }
  });

  // GET /api/metrics/trending — top scoring pages for "الأكثر تفاعلاً"
  app.get('/api/metrics/trending', async (_req, res) => {
    try {
      const scores = await storage.getTopPageScores(8);
      res.set('Cache-Control', 'public, max-age=300'); // 5-min cache
      res.json(scores);
    } catch (err) {
      console.error('[metrics] trending error:', err);
      res.json([]);
    }
  });

  // GET /api/metrics/scores — full page scores list (for admin/debugging)
  app.get('/api/metrics/scores', async (_req, res) => {
    try {
      const scores = await storage.getTopPageScores(50);
      res.json(scores);
    } catch (err) {
      res.json([]);
    }
  });

  // Health check endpoint (no auth required)
  app.get('/api/health', async (_req, res) => {
    try {
      const books = await storage.getAllBooks();
      const emotions = await storage.getAllEmotions();
      res.json({
        status: 'ok',
        data: {
          booksCount: books.length,
          emotionsCount: emotions.length,
          seeded: books.length === 66 && emotions.length === 8
        }
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Database check failed' });
    }
  });

  // Manual seed endpoint for emotion_verses and topic_verses (no auth required)
  // Use ?force=true to clear and reseed
  app.get('/api/seed/relations', async (req, res) => {
    try {
      const force = req.query.force === 'true';
      const result = await seedRelationsIfNeeded(force);
      res.json({
        status: 'ok',
        message: result.message,
        emotionVersesAdded: result.emotionVersesAdded,
        topicVersesAdded: result.topicVersesAdded
      });
    } catch (error) {
      console.error('[seed/relations] Error:', error);
      res.status(500).json({ status: 'error', message: 'Seeding failed' });
    }
  });

  // Recovery endpoint: reimport Bible verses in BACKGROUND (no auth required)
  // Use ?force=true to clear existing verses and reimport
  // Returns immediately - check /api/seed/verses/status for progress
  app.get('/api/seed/verses', (req, res) => {
    const force = req.query.force === 'true';
    console.log(`[API] Starting background Bible verses reimport... (force=${force})`);
    const result = startBackgroundImport(force);
    res.json({
      status: result.started ? 'accepted' : 'error',
      message: result.message
    });
  });

  // Status endpoint for verse import job
  app.get('/api/seed/verses/status', (_req, res) => {
    const status = getImportJobStatus();
    res.json(status);
  });

  // Fix duplicate verses in bible_verses table
  app.get('/api/fix/duplicate-verses', async (_req, res) => {
    try {
      console.log('[API] Checking for duplicate verses...');
      
      // Find duplicates
      const duplicates = await storage.findDuplicateVerses();
      
      if (duplicates.length === 0) {
        res.json({
          status: 'ok',
          message: 'No duplicate verses found',
          duplicatesFixed: 0
        });
        return;
      }
      
      // Delete duplicates (keeping the first one)
      const deletedCount = await storage.deleteDuplicateVerses();
      
      res.json({
        status: 'ok',
        message: `Fixed ${deletedCount} duplicate verses`,
        duplicatesFixed: deletedCount,
        duplicatesFound: duplicates.length
      });
    } catch (error) {
      console.error('[API] Error fixing duplicates:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fix duplicates' });
    }
  });

  // Fix duplicate verses in emotion_verses table
  app.get('/api/fix/duplicate-emotion-verses', async (_req, res) => {
    try {
      console.log('[API] Checking for duplicate emotion verses...');
      
      const duplicates = await storage.findDuplicateEmotionVerses();
      
      if (duplicates.length === 0) {
        res.json({
          status: 'ok',
          message: 'No duplicate emotion verses found',
          duplicatesFixed: 0
        });
        return;
      }
      
      const deletedCount = await storage.deleteDuplicateEmotionVerses();
      
      res.json({
        status: 'ok',
        message: `Fixed ${deletedCount} duplicate emotion verses`,
        duplicatesFixed: deletedCount,
        duplicatesFound: duplicates.length
      });
    } catch (error) {
      console.error('[API] Error fixing emotion duplicates:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fix emotion duplicates' });
    }
  });

  // Fix duplicate verses in topic_verses table
  app.get('/api/fix/duplicate-topic-verses', async (_req, res) => {
    try {
      console.log('[API] Checking for duplicate topic verses...');
      
      const duplicates = await storage.findDuplicateTopicVerses();
      
      if (duplicates.length === 0) {
        res.json({
          status: 'ok',
          message: 'No duplicate topic verses found',
          duplicatesFixed: 0
        });
        return;
      }
      
      const deletedCount = await storage.deleteDuplicateTopicVerses();
      
      res.json({
        status: 'ok',
        message: `Fixed ${deletedCount} duplicate topic verses`,
        duplicatesFixed: deletedCount,
        duplicatesFound: duplicates.length
      });
    } catch (error) {
      console.error('[API] Error fixing topic duplicates:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fix topic duplicates' });
    }
  });

  // Reseed emotions and topics with correct data (for production fix)
  app.get('/api/seed/emotions', async (_req, res) => {
    try {
      console.log('[API] Reseeding emotions and topics...');
      const result = await reseedEmotionsAndTopics();
      res.json({
        status: 'ok',
        ...result
      });
    } catch (error) {
      console.error('[API] Error reseeding:', error);
      res.status(500).json({ status: 'error', message: 'Reseeding failed' });
    }
  });

  // Import AI emotion verses from CSV (for AI classification)
  app.get('/api/seed/ai-emotions', async (_req, res) => {
    try {
      console.log('[API] Importing AI emotion verses from CSV...');
      const result = await importAiEmotionVersesFromCsv();
      res.json({
        status: result.success ? 'ok' : 'error',
        ...result
      });
    } catch (error) {
      console.error('[API] Error importing AI emotions:', error);
      res.status(500).json({ status: 'error', message: 'Import failed' });
    }
  });

  // Get distinct AI emotions (for reference)
  app.get('/api/ai-emotions', async (_req, res) => {
    try {
      const emotions = await storage.getDistinctAiEmotions();
      res.json({ emotions, count: emotions.length });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch AI emotions' });
    }
  });

  // Import AI emotion examples from CSV (for semantic classification)
  app.get('/api/seed/ai-examples', async (_req, res) => {
    try {
      console.log('[API] Importing AI emotion examples from CSV...');
      const result = await importAiEmotionExamplesFromCsv();
      res.json({
        status: result.success ? 'ok' : 'error',
        ...result
      });
    } catch (error) {
      console.error('[API] Error importing AI examples:', error);
      res.status(500).json({ status: 'error', message: 'Import failed' });
    }
  });

  // Append 100k AI emotion examples from large CSV (without clearing existing data)
  app.get('/api/seed/ai-examples-100k', async (_req, res) => {
    try {
      console.log('[API] Appending 100k AI emotion examples from CSV...');
      res.setHeader('Content-Type', 'application/json');
      const result = await appendAiEmotionExamples100k();
      res.json({
        status: result.success ? 'ok' : 'error',
        ...result
      });
    } catch (error) {
      console.error('[API] Error appending AI examples:', error);
      res.status(500).json({ status: 'error', message: 'Import failed' });
    }
  });

  // Seed calendar daily verses from CSV
  app.get('/api/seed/calendar-verses', async (_req, res) => {
    try {
      console.log('[API] Importing calendar daily verses from CSV...');
      const result = await seedCalendarDailyVerses();
      res.json({
        status: result.success ? 'ok' : 'error',
        ...result
      });
    } catch (error) {
      console.error('[API] Error importing calendar verses:', error);
      res.status(500).json({ status: 'error', message: 'Import failed' });
    }
  });

  app.get('/api/tafsir/books', (_req, res) => {
    try {
      const books = listAvailableBooks();
      res.json({ books });
    } catch (error) {
      res.status(500).json({ message: 'Failed to list tafsir books' });
    }
  });

  app.get('/api/tafsir/book-intro/:csvName', (req, res) => {
    try {
      const csvName = decodeURIComponent(req.params.csvName);
      const intro = getBookIntro(csvName);
      res.json({ tafsir: intro });
    } catch (error) {
      console.error('[tafsir] book-intro error:', error);
      res.status(500).json({ message: 'Failed to fetch book intro' });
    }
  });

  app.get('/api/tafsir/chapter/:csvName/:chapter', (req, res) => {
    try {
      const csvName = decodeURIComponent(req.params.csvName);
      const chapter = parseInt(req.params.chapter, 10);
      const tafsir = getChapterTafsir(csvName, chapter);
      res.json({ tafsir });
    } catch (error) {
      console.error('[tafsir] chapter error:', error);
      res.status(500).json({ message: 'Failed to fetch chapter tafsir' });
    }
  });

  app.get('/api/tafsir/verse/:csvName/:chapter/:verse', (req, res) => {
    try {
      const csvName = decodeURIComponent(req.params.csvName);
      const chapter = parseInt(req.params.chapter, 10);
      const verse = parseInt(req.params.verse, 10);
      const tafsir = getVerseTafsir(csvName, chapter, verse);
      res.json({ tafsir });
    } catch (error) {
      console.error('[tafsir] verse error:', error);
      res.status(500).json({ message: 'Failed to fetch verse tafsir' });
    }
  });

  app.use('/api/*', ensureSessionUser);

  app.get('/api/user', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isPremium = await checkPremiumStatus(user);
      const usageCheck = await checkAiUsageLimit(user);

      res.json({
        id: user.id,
        isPremium,
        aiUsageRemaining: usageCheck.remaining,
        subscriptionExpiry: user.subscriptionExpiry,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.post('/api/user/premium', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      const updatedUser = await storage.updateUserPremiumStatus(user.id, true, expiryDate);

      res.json({
        success: true,
        isPremium: true,
        subscriptionExpiry: updatedUser.subscriptionExpiry,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update premium status' });
    }
  });

  // ── Viral Loop: Bot OG detection for /share/verse/:id ────────────────────
  const BOT_AGENTS = /facebookexternalhit|whatsapp|twitterbot|telegrambot|slackbot|discordbot|linkedinbot|googlebot|bingbot|applebot|ia_archiver/i;
  const SITE_URL_FULL = 'https://mybible.oscardevs.com';

  app.get('/share/verse/:id', async (req, res, next) => {
    const ua = req.headers['user-agent'] || '';
    if (!BOT_AGENTS.test(ua)) return next();

    const id = parseInt(req.params.id);
    if (isNaN(id)) return next();

    try {
      const verse = await storage.getVerseById(id);
      if (!verse) return next();
      const book = await storage.getBookById(verse.bookId);
      const bookName = book?.name || '';
      const ref = `${bookName} ${verse.chapter}:${verse.verse}`;
      const snippet = verse.text.length > 120 ? verse.text.slice(0, 120) + '...' : verse.text;
      const title = `"${snippet}" — ${ref}`;
      const description = `${verse.text} | اقرأ الكتاب المقدس بالعربية على الكتاب المقدس رفيقي`;
      const shareUrl = `${SITE_URL_FULL}/share/verse/${id}`;
      const ogImage = `${SITE_URL_FULL}/opengraph.jpg`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} | الكتاب المقدس رفيقي</title>
<meta name="description" content="${description}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="الكتاب المقدس رفيقي">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${shareUrl}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="ar_AR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${ogImage}">
<link rel="canonical" href="${shareUrl}">
<meta http-equiv="refresh" content="0; url=${shareUrl}">
</head>
<body>
<p>${verse.text}</p>
<p>${ref}</p>
<a href="${shareUrl}">اقرأ على الكتاب المقدس رفيقي</a>
</body>
</html>`);
    } catch {
      next();
    }
  });

  // ── Viral Loop: Verse by ID API ───────────────────────────────────────────
  app.get('/api/verse/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: 'Invalid verse ID' });
      const verse = await storage.getVerseById(id);
      if (!verse) return res.status(404).json({ message: 'Verse not found' });
      const book = await storage.getBookById(verse.bookId);
      res.json({ ...verse, bookName: book?.name || '' });
    } catch {
      res.status(500).json({ message: 'Failed to fetch verse' });
    }
  });

  app.get('/api/books', async (_req, res) => {
    try {
      const books = await storage.getAllBooks();
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch books' });
    }
  });

  app.get('/api/books/:testament', async (req, res) => {
    try {
      const testament = req.params.testament as 'old' | 'new';
      if (testament !== 'old' && testament !== 'new') {
        return res.status(400).json({ message: 'Invalid testament' });
      }

      const books = await storage.getBooksByTestament(testament);
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch books' });
    }
  });

  app.get('/api/verses/book/:bookId', async (req, res) => {
    try {
      const bookId = parseInt(req.params.bookId);
      const chapter = req.query.chapter ? parseInt(req.query.chapter as string) : undefined;

      const verses = await storage.getVersesByBook(bookId, chapter);
      res.json(verses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch verses' });
    }
  });

  app.get('/api/books/:bookId/chapters', async (req, res) => {
    try {
      const bookId = parseInt(req.params.bookId);
      const chapters = await storage.getChaptersForBook(bookId);
      res.json(chapters);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch chapters' });
    }
  });

  app.get('/api/verses/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: 'Query parameter required' });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const smart = req.query.smart !== 'false';
      
      if (smart) {
        const results = await storage.smartSearchVerses(query, limit);
        res.json(results);
      } else {
        const verses = await storage.searchVerses(query, limit);
        res.json(verses);
      }
    } catch (error) {
      console.error('[search] Error:', error);
      res.status(500).json({ message: 'Failed to search verses' });
    }
  });

  app.get('/api/search/smart', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: 'Query parameter required' });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
      const results = await storage.smartSearchVerses(query, limit);
      
      res.json({
        query,
        count: results.length,
        results
      });
    } catch (error) {
      console.error('[smart-search] Error:', error);
      res.status(500).json({ message: 'Failed to search verses' });
    }
  });

  // AI-Enhanced Search: algorithm first → Groq re-ranks + suggests additional verses from DB
  app.post('/api/search/ai-enhanced', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ message: 'Query required' });
      }

      const userId = (req.session as any)?.userId?.toString() || 'anonymous';

      // Step 1: Smart algorithm search
      let initialResults = await storage.smartSearchVerses(query.trim(), 20);

      // If no results, try stripping Arabic suffixes to find root word
      // e.g. "سلامي" → "سلام", "صلواتنا" → "صلوات"
      let effectiveQuery = query.trim();
      if (initialResults.length === 0) {
        const { expandQuery } = await import('./utils/smart-search');
        const { rootTokens } = expandQuery(query.trim());
        if (rootTokens.length > 0) {
          const rootQuery = rootTokens.join(' ');
          initialResults = await storage.smartSearchVerses(rootQuery, 20);
          if (initialResults.length > 0) effectiveQuery = rootQuery;
        }
      }

      if (initialResults.length === 0) {
        return res.json({ exactResults: [], semanticResults: [], results: [], enhanced: false });
      }

      // Step 2: Send to Groq for re-ranking + additional verse suggestions
      // Pass effectiveQuery so Groq sees the root word (e.g. "سلام" instead of "سلامي")
      const enhancement = await enhanceSearchWithGroq(
        effectiveQuery,
        initialResults.map(v => ({
          id: v.id,
          bookName: v.bookName || '',
          chapter: v.chapter,
          verse: v.verse,
          text: v.text,
        })),
        userId
      );

      if (!enhancement) {
        // Groq unavailable — return original algorithm results in both formats
        return res.json({ exactResults: initialResults, semanticResults: [], results: initialResults, enhanced: false });
      }

      // Step 3: Re-order based on AI ranking
      const byId = new Map(initialResults.map(v => [v.id, v]));
      const reranked: typeof initialResults = [];

      for (const id of enhancement.rankedIds) {
        const v = byId.get(id);
        if (v) reranked.push(v);
      }
      // Safety: add any not included by AI
      for (const v of initialResults) {
        if (!enhancement.rankedIds.includes(v.id)) reranked.push(v);
      }

      // Step 4: Fetch AI-suggested additional verses from DB (never trust AI text, only reference)
      const existingIds = new Set(reranked.map(v => v.id));
      const semanticResults: typeof initialResults = [];

      for (const ref of enhancement.additionalRefs.slice(0, 10)) {
        if (!ref.book || !ref.chapter || !ref.verse) continue;
        try {
          const found = await storage.getVerseByReference(ref.book, Number(ref.chapter), Number(ref.verse));
          if (found && !existingIds.has(found.id)) {
            semanticResults.push({
              ...found,
              bookName: ref.book,
              relevanceScore: 0.6,
              matchType: 'semantic' as const,
            });
            existingIds.add(found.id);
          }
        } catch {
          // Skip invalid references silently
        }
      }

      // ── Phase 5: Passive topic growth — auto-create topic page for this search ──
      if (isTopicWorthy(query)) {
        const slug = toSlug(query.trim());
        const title = buildTopicTitle(query.trim());
        const keywords = extractKeywords(query.trim());
        storage.upsertSeoTopic(title, slug, keywords).catch(() => {});
      }

      return res.json({
        exactResults: reranked,
        semanticResults,
        results: [...reranked, ...semanticResults],
        enhanced: true,
        topicSlug: isTopicWorthy(query) ? toSlug(query.trim()) : undefined,
      });
    } catch (error) {
      console.error('[ai-enhanced-search] Error:', error);
      res.status(500).json({ message: 'Search failed' });
    }
  });

  app.get('/api/daily-verse', async (_req, res) => {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      
      const calendarVerse = await storage.getCalendarDailyVerse(month, day);
      
      if (calendarVerse) {
        const refParts = calendarVerse.verseReference.match(/^(.+?)\s*(\d+):(\d+)$/);
        const bookName = refParts ? refParts[1] : calendarVerse.verseReference;
        const chapter = refParts ? parseInt(refParts[2]) : 1;
        const verseNum = refParts ? parseInt(refParts[3]) : 1;
        
        return res.json({
          id: calendarVerse.id,
          verseId: calendarVerse.id,
          date: today.toISOString().split('T')[0],
          verse: {
            id: calendarVerse.id,
            text: calendarVerse.verseText,
            chapter: chapter,
            verse: verseNum,
          },
          book: {
            name: bookName,
          },
          theme: calendarVerse.theme,
        });
      }
      
      return res.json(null);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch daily verse' });
    }
  });

  app.get('/api/reading-plans', async (_req, res) => {
    try {
      const plans = await storage.getAllReadingPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch reading plans' });
    }
  });

  app.get('/api/reading-plans/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.getReadingPlanById(id);

      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch reading plan' });
    }
  });

  app.get('/api/user/progress', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const progress = await storage.getAllUserProgress(user.id);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch progress' });
    }
  });

  app.post('/api/user/progress', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const validated = insertUserReadingProgressSchema.parse({
        ...req.body,
        userId: user.id,
      });

      const progress = await storage.createUserProgress(validated);
      res.json(progress);
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.put('/api/user/progress/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { currentDay, completedDays } = req.body;

      const progress = await storage.updateUserProgress(id, currentDay, completedDays);
      res.json(progress);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update progress' });
    }
  });

  app.get('/api/user/highlights', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const highlights = await storage.getUserHighlights(user.id);
      res.json(highlights);
    } catch (error) {
      console.error('Highlights fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch highlights' });
    }
  });

  app.post('/api/user/highlights', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const validated = insertHighlightedVerseSchema.parse({
        ...req.body,
        userId: user.id,
      });

      const highlight = await storage.createHighlight(validated);
      res.json(highlight);
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.delete('/api/user/highlights/:id', async (req, res) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const id = parseInt(req.params.id);
      await storage.deleteHighlight(id, user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete highlight' });
    }
  });

  app.get('/api/emotions', async (_req, res) => {
    try {
      const emotions = await storage.getAllEmotions();
      res.json(emotions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch emotions' });
    }
  });

  app.get('/api/emotions/:id/verses', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const verses = await storage.getVersesByEmotion(id);

      const flatVerses = verses.map((verse) => ({
        id: verse.id,
        bookName: verse.bookName,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.verseText,
      }));

      res.json(flatVerses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch emotion verses' });
    }
  });

  app.get('/api/topics', async (_req, res) => {
    try {
      const topics = await storage.getAllTopics();
      res.json(topics);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch topics' });
    }
  });

  app.get('/api/topics/:id/verses', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const verses = await storage.getVersesByTopic(id);

      const flatVerses = verses.map((verse) => ({
        id: verse.id,
        bookName: verse.bookName,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.verseText,
      }));

      res.json(flatVerses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch topic verses' });
    }
  });

  app.get('/api/child-stories', async (_req, res) => {
    try {
      const stories = await storage.getAllChildStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch stories' });
    }
  });

  app.get('/api/child-stories/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const story = await storage.getChildStoryById(id);

      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }

      res.json(story);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch story' });
    }
  });

  // AI Query endpoint - works with or without session for maximum compatibility
  app.post('/api/ai/query', async (req, res) => {
    try {
      console.log(`[AI-Route] Received AI query request, sessionID: ${req.sessionID?.substring(0, 8) || 'none'}...`);
      
      // Try to get user from session, but don't require it
      let user = await getCurrentUser(req);
      
      // If no user in session, create a temporary anonymous user object for the query
      if (!user) {
        console.log('[AI-Route] No user in session, using anonymous user for AI query');
        user = {
          id: 'anonymous',
          sessionId: req.sessionID || 'anonymous',
          isPremium: false,
          aiUsageCount: 0,
          aiUsageResetDate: new Date(),
          subscriptionExpiry: null,
          createdAt: new Date(),
        };
      } else {
        console.log(`[AI-Route] User found: ${user.id}`);
      }

      const { query } = req.body;
      console.log(`[AI-Route] Query: "${query?.substring(0, 50)}..."`);
      
      if (!query || typeof query !== 'string') {
        console.log('[AI-Route] Invalid query');
        return res.status(400).json({ message: 'Query is required' });
      }

      console.log('[AI-Route] Processing AI query...');
      const result = await processAiQuery(user, query);
      console.log(`[AI-Route] AI query result: success=${result.success}, emotion=${result.detectedEmotion}`);
      
      res.json(result);
    } catch (error) {
      console.error('[AI-Route] AI query failed:', error);
      res.status(500).json({ message: 'AI query failed' });
    }
  });

  // ── SEO Topic Pages ──────────────────────────────────────────────────────
  // GET /api/topics/:slug — fetch topic + verses + related topics
  app.get('/api/topics/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const topic = await storage.getSeoTopicBySlug(slug);
      if (!topic) return res.status(404).json({ message: 'Not found' });

      // Increment visit count (fire-and-forget)
      storage.incrementTopicVisit(slug).catch(() => {});

      // Fetch verses by keyword matching (no AI)
      const allVerses = await Promise.all(
        topic.keywords.slice(0, 4).map(kw => storage.smartSearchVerses(kw, 8))
      );
      // Deduplicate by id
      const seen = new Set<number>();
      const verses = allVerses.flat()
        .filter(v => { if (seen.has(v.id)) return false; seen.add(v.id); return true; })
        .slice(0, 20)
        .map(v => ({
          id: v.id,
          bookName: (v as any).bookName || '',
          chapter: v.chapter,
          verse: v.verse,
          text: v.text,
        }));

      // Related topics by shared keywords
      const related = await storage.getSimilarTopics(slug, topic.keywords, 6);

      res.json({
        topic: {
          id: topic.id,
          title: topic.title,
          slug: topic.slug,
          keywords: topic.keywords,
          visitCount: topic.visitCount,
        },
        verses,
        related: related.map(r => ({ title: r.title, slug: r.slug })),
      });
    } catch (err) {
      console.error('[Topics] GET error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // GET /api/topics — list popular topics
  app.get('/api/topics', async (_req, res) => {
    try {
      const topics = await storage.getPopularTopics(50);
      res.json(topics.map(t => ({ title: t.title, slug: t.slug, visitCount: t.visitCount })));
    } catch (err) {
      res.status(500).json([]);
    }
  });

  // ── SEO Intent + Internal Links API ─────────────────────────────────────
  app.post('/api/seo/context', async (req, res) => {
    try {
      const q = (req.query.q as string || req.body?.query || '').trim();
      const verses: Array<{ bookName: string; chapter: number; verse: number; text: string }> =
        Array.isArray(req.body?.verses) ? req.body.verses : [];

      if (!q) return res.json({ intent: 'general', title: '', links: [], faqSchema: null });

      const { detectIntent } = await import('./seo-intent');
      const { getInternalLinks } = await import('./internal-links');
      const { generateSearchTitle, generateFAQSchema } = await import('./seo-title');

      const intentResult = detectIntent(q);
      const links = getInternalLinks(q, 5);
      const title = generateSearchTitle(q);
      const faqSchema = verses.length > 0 ? generateFAQSchema(q, verses) : null;

      res.json({ intent: intentResult.intent, topics: intentResult.topics, title, links, faqSchema });
    } catch (err) {
      console.error('[SEO-Context] Error:', err);
      res.status(500).json({ intent: 'general', title: '', links: [], faqSchema: null });
    }
  });

  // ── SEO Engagement Tracking ──────────────────────────────────────────────
  app.post('/api/track', async (req, res) => {
    try {
      const sessionId = (req.session as any)?.userId || req.sessionID || 'anon';
      const { page, query, scrollDepth, timeOnPage, verseClicks } = req.body || {};
      if (!page) return res.json({ ok: false });
      await storage.trackEngagement({
        sessionId,
        page: String(page),
        query: query ? String(query) : undefined,
        scrollDepth: Number(scrollDepth) || 0,
        timeOnPage: Number(timeOnPage) || 0,
        verseClicks: Number(verseClicks) || 0,
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('[Track] Error:', err);
      res.json({ ok: false });
    }
  });

  // Daoud Lamei: serve RSS videos (channel + book playlist if available)
  app.get('/api/lessons/rss', async (req, res) => {
    try {
      const force = req.query.force === 'true';
      const book = req.query.book as string | undefined;
      if (force) clearDaoudLameiCache(book);
      const videos = await fetchDaoudLameiRss(book, force);
      res.json(videos);
    } catch (err) {
      console.error('[DaoudLamei RSS] Route error:', err);
      res.status(500).json([]);
    }
  });

  // ── Liturgy Presentation Session ──────────────────────────────────────────
  let liturgySession: Record<string, unknown> = {
    sessionId: 'main',
    liturgyType: 'basil',
    sectionKey: 'intro',
    slideIndex: 0,
    deaconOverride: null,
    updatedAt: Date.now(),
  };

  app.get('/api/liturgy-session', (_req, res) => {
    res.json(liturgySession);
  });

  app.post('/api/liturgy-session', (req, res) => {
    const { liturgyType, sectionKey, slideIndex, deaconOverride } = req.body ?? {};
    const patch: Record<string, unknown> = {};
    if (liturgyType !== undefined) patch.liturgyType = liturgyType;
    if (sectionKey !== undefined) patch.sectionKey = sectionKey;
    if (slideIndex !== undefined) patch.slideIndex = slideIndex;
    if (deaconOverride !== undefined) patch.deaconOverride = deaconOverride;
    liturgySession = { ...liturgySession, ...patch, updatedAt: Date.now() };
    res.json(liturgySession);
  });

  return httpServer;
}
