import { useState, useCallback, useRef } from 'react';
import { getCSVFileName } from '@/lib/tafsir-csv-service';
import { dailyReadings, feasts, type ReadingRef, type DayLectionary } from '@/lib/coptic-lectionary';

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

function buildReadingTextUrl(ref: ReadingRef): string {
  const params = new URLSearchParams({
    bookName: ref.book,
    fromCh: String(ref.fromCh),
    fromVs: String(ref.fromVs),
    toCh:   String(ref.toCh),
    toVs:   String(ref.toVs),
  });
  return `/api/reading-text?${params}`;
}

function allLectionaryRefs(): ReadingRef[] {
  const refs: ReadingRef[] = [];
  const seen = new Set<string>();
  const add = (day: DayLectionary) => {
    for (const ref of [day.pauline, day.catholic, day.praxis, day.psalm, day.gospel]) {
      const key = buildReadingTextUrl(ref);
      if (!seen.has(key)) { seen.add(key); refs.push(ref); }
    }
  };
  for (const day of Object.values(dailyReadings)) add(day);
  for (const day of Object.values(feasts)) add(day);
  return refs;
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
      await cache.put('/api/books', booksRes.clone());
      const books: { id: number; name: string; chaptersCount: number }[] = await booksRes.json();

      // 2. Semi-static endpoints (fast, do first)
      for (const url of ['/api/daily-readings', '/api/metrics/trending', '/api/reading-plans', '/api/emotions']) {
        if (signal.aborted) return;
        try { const r = await fetch(url, { signal }); if (r.ok) await cache.put(url, r); } catch {}
      }

      // 3. All Kholagy / Orthodox reading-text URLs from the full-year lectionary
      const lectionaryRefs = allLectionaryRefs();
      setProgress({ done: 0, total: lectionaryRefs.length, currentBook: 'قراءات الخولاجي والقسم الأرثوذكسي' });
      let lDone = 0;
      await runBatch(lectionaryRefs, async (ref) => {
        if (signal.aborted) return;
        const url = buildReadingTextUrl(ref);
        if (!(await cache.match(url))) {
          try { const r = await fetch(url, { signal }); if (r.ok) await cache.put(url, r); } catch {}
        }
        lDone++;
        setProgress({ done: lDone, total: lectionaryRefs.length, currentBook: `قراءات الكتامارس (${ref.book})` });
      }, signal);

      if (signal.aborted) return;

      // 4. All Bible chapters (verses + tafsir) — the big batch
      type WorkItem = { bookId: number; bookName: string; chapter: number; csvName: string | null };
      const workItems: WorkItem[] = [];
      for (const book of books) {
        const csvName = getCSVFileName(book.name);
        for (let ch = 1; ch <= book.chaptersCount; ch++) {
          workItems.push({ bookId: book.id, bookName: book.name, chapter: ch, csvName });
        }
      }

      const total = workItems.length * 2;
      let done = 0;
      setProgress({ done: 0, total, currentBook: '' });

      await runBatch(workItems, async (item) => {
        if (signal.aborted) return;

        const versesUrl = `/api/verses/book/${item.bookId}?chapter=${item.chapter}`;
        if (!(await cache.match(versesUrl))) {
          try { const r = await fetch(versesUrl, { signal }); if (r.ok) await cache.put(versesUrl, r); } catch {}
        }
        done++;
        setProgress({ done, total, currentBook: item.bookName });

        if (item.csvName) {
          const tafsirUrl = `/api/tafsir/chapter/${encodeURIComponent(item.csvName)}/${item.chapter}`;
          if (!(await cache.match(tafsirUrl))) {
            try { const r = await fetch(tafsirUrl, { signal }); if (r.ok) await cache.put(tafsirUrl, r); } catch {}
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
