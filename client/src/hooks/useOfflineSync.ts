import { useState, useCallback, useRef } from 'react';
import { getCSVFileName } from '@/lib/tafsir-csv-service';

export type SyncStatus = 'idle' | 'syncing' | 'done' | 'error';

export interface SyncProgress {
  done: number;
  total: number;
  currentBook: string;
}

const CACHE_NAME = 'mybible-static-v1';
const CONCURRENCY = 6;

async function runBatch<T>(items: T[], fn: (item: T) => Promise<void>, signal: AbortSignal) {
  let i = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) {
      if (signal.aborted) return;
      const item = items[i++];
      if (item !== undefined) await fn(item).catch(() => {});
    }
  });
  await Promise.all(workers);
}

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [progress, setProgress] = useState<SyncProgress>({ done: 0, total: 0, currentBook: '' });
  const abortRef = useRef<AbortController | null>(null);

  const startSync = useCallback(async () => {
    if (!('caches' in window)) {
      setStatus('error');
      return;
    }

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    setStatus('syncing');
    setProgress({ done: 0, total: 0, currentBook: '' });

    try {
      const cache = await caches.open(CACHE_NAME);

      // 1. Load all books
      const booksRes = await fetch('/api/books', { signal });
      if (!booksRes.ok) throw new Error();
      // Cache books list too
      await caches.open(CACHE_NAME).then(c => c.put('/api/books', booksRes.clone()));
      const books: { id: number; name: string; chaptersCount: number }[] = await booksRes.json();

      // 2. Build work list: every book × every chapter
      type WorkItem = { bookId: number; bookName: string; chapter: number; csvName: string | null };
      const workItems: WorkItem[] = [];
      for (const book of books) {
        const csvName = getCSVFileName(book.name);
        for (let ch = 1; ch <= book.chaptersCount; ch++) {
          workItems.push({ bookId: book.id, bookName: book.name, chapter: ch, csvName });
        }
      }

      // 3. Pre-fetch semi-static endpoints (daily readings, emotions, plans, trending)
      const staticEndpoints = [
        '/api/daily-readings',
        '/api/metrics/trending',
        '/api/reading-plans',
        '/api/emotions',
      ];
      for (const url of staticEndpoints) {
        if (signal.aborted) return;
        try { const r = await fetch(url, { signal }); if (r.ok) await cache.put(url, r); } catch {}
      }

      // Each book/chapter item = 2 fetches (verses + tafsir)
      const total = workItems.length * 2;
      let done = 0;
      setProgress({ done: 0, total, currentBook: '' });

      await runBatch(workItems, async (item) => {
        if (signal.aborted) return;
        setProgress(p => ({ ...p, done: p.done, currentBook: item.bookName }));

        // Verses
        const versesUrl = `/api/verses/book/${item.bookId}?chapter=${item.chapter}`;
        if (!(await cache.match(versesUrl))) {
          const r = await fetch(versesUrl, { signal });
          if (r.ok) await cache.put(versesUrl, r);
        }
        done++;
        setProgress({ done, total, currentBook: item.bookName });

        // Tafsir (if available)
        if (item.csvName) {
          const tafsirUrl = `/api/tafsir/chapter/${encodeURIComponent(item.csvName)}/${item.chapter}`;
          if (!(await cache.match(tafsirUrl))) {
            const r = await fetch(tafsirUrl, { signal });
            if (r.ok) await cache.put(tafsirUrl, r);
          }
        }
        done++;
        setProgress({ done, total, currentBook: item.bookName });
      }, signal);

      if (!signal.aborted) setStatus('done');
    } catch {
      if (!abortRef.current?.signal.aborted) setStatus('error');
    }
  }, []);

  const cancelSync = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
    setProgress({ done: 0, total: 0, currentBook: '' });
  }, []);

  return { status, progress, startSync, cancelSync };
}
