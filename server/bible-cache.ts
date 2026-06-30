// In-memory cache for STATIC Bible content (books, verses, chapters).
//
// The Bible text never changes, yet it was previously read from Postgres on
// every page view — keeping the database constantly awake. This module loads
// each piece of static content from the DB exactly once per process and serves
// all subsequent reads from memory, so the database can scale to zero while the
// app is idle. IDs are preserved exactly (loaded from the DB), so features that
// reference bible_verses.id (highlights, daily verse, …) keep working.
//
// Memory footprint: the full Arabic Bible is ~5 MB — negligible.

import type { BibleBook, BibleVerse } from "@shared/schema";
import { storage } from "./storage";

class BibleContentCache {
  private allBooks: BibleBook[] | null = null;
  private allBooksPromise: Promise<BibleBook[]> | null = null;

  private versesByBook = new Map<number, BibleVerse[]>();
  private versesByBookPromise = new Map<number, Promise<BibleVerse[]>>();

  /** All books, ordered by bookOrder. Loaded from DB once. */
  async getAllBooks(): Promise<BibleBook[]> {
    if (this.allBooks) return this.allBooks;
    if (!this.allBooksPromise) {
      this.allBooksPromise = storage.getAllBooks()
        .then((books) => { this.allBooks = books; return books; })
        .catch((err) => { this.allBooksPromise = null; throw err; });
    }
    return this.allBooksPromise;
  }

  async getBooksByTestament(testament: "old" | "new"): Promise<BibleBook[]> {
    const all = await this.getAllBooks();
    return all.filter((b) => b.testament === testament);
  }

  async getBookById(id: number): Promise<BibleBook | undefined> {
    const all = await this.getAllBooks();
    return all.find((b) => b.id === id);
  }

  /** Exact-name lookup (mirrors storage.getBookByName). */
  async getBookByName(name: string): Promise<BibleBook | undefined> {
    const all = await this.getAllBooks();
    return all.find((b) => b.name === name);
  }

  /** Every verse of a book (all chapters), loaded from DB once and memoized. */
  private async getAllVersesForBook(bookId: number): Promise<BibleVerse[]> {
    const cached = this.versesByBook.get(bookId);
    if (cached) return cached;
    let pending = this.versesByBookPromise.get(bookId);
    if (!pending) {
      pending = storage.getVersesByBook(bookId)
        .then((verses) => { this.versesByBook.set(bookId, verses); return verses; })
        .catch((err) => { this.versesByBookPromise.delete(bookId); throw err; });
      this.versesByBookPromise.set(bookId, pending);
    }
    return pending;
  }

  async getVersesByBook(bookId: number, chapter?: number): Promise<BibleVerse[]> {
    const all = await this.getAllVersesForBook(bookId);
    if (chapter === undefined) return all;
    return all.filter((v) => v.chapter === chapter);
  }

  async getChaptersForBook(bookId: number): Promise<number[]> {
    const all = await this.getAllVersesForBook(bookId);
    const chapters = new Set<number>();
    for (const v of all) chapters.add(v.chapter);
    return Array.from(chapters).sort((a, b) => a - b);
  }
}

export const bibleCache = new BibleContentCache();

/** One day; the Bible text is immutable so clients/CDN can cache aggressively. */
export function setStaticCacheHeaders(res: { setHeader: (k: string, v: string) => void }) {
  res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
}
