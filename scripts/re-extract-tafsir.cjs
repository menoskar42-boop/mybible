#!/usr/bin/env node
/**
 * Re-extracts ALL tafsir books (except مزامير) using a proper multiline CSV parser.
 * Writes correctly-quoted CSV parts to client/public/tafsir-parts/.
 */

const fs = require('fs');
const path = require('path');

const TAFSIR_DIR = path.join(__dirname, '../client/public/tafsir');
const PARTS_DIR = path.join(__dirname, '../client/public/tafsir-parts');
const MAX_BYTES = 44 * 1024 * 1024; // 44MB per part
const MIN_REAL_CHARS = 120; // threshold for "real commentary"

if (!fs.existsSync(PARTS_DIR)) fs.mkdirSync(PARTS_DIR, { recursive: true });

// ── Proper multiline CSV parser (same logic as server/tafsir-service.ts) ──────
function parseCSV(text) {
  const entries = [];
  const lines = text.split('\n');
  if (lines.length < 2) return entries;

  let i = 1;
  while (i < lines.length) {
    let line = lines[i];
    if (!line.trim()) { i++; continue; }

    let inQuotes = false;
    let fields = [];
    let current = '';

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
          current += '"'; j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current); current = '';
      } else {
        current += ch;
      }
    }

    // Collect continuation lines of a multiline quoted field
    while (inQuotes && i + 1 < lines.length) {
      i++;
      current += '\n' + lines[i];
      for (let j = 0; j < lines[i].length; j++) {
        if (lines[i][j] === '"') {
          if (j + 1 < lines[i].length && lines[i][j + 1] === '"') { j++; }
          else { inQuotes = !inQuotes; }
        }
      }
    }

    // Strip trailing lone closing quote that CSV exporters sometimes add
    fields.push(current.replace(/"$/, ''));
    i++;

    if (fields.length >= 4) {
      const chapter = parseInt(fields[1], 10);
      const verse = parseInt(fields[2], 10);
      if (!isNaN(chapter) && !isNaN(verse)) {
        entries.push({
          book: fields[0].trim(),
          chapter,
          verse,
          tafsir: fields[3].replace(/\r/g, '').trim(),
        });
      }
    }
  }
  return entries;
}

// ── Proper CSV serializer ──────────────────────────────────────────────────────
function escapeCSV(value) {
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCSVLine(book, chapter, verse, tafsir) {
  return [book, chapter, verse, tafsir].map(escapeCSV).join(',');
}

const CSV_HEADER = 'book,chapter,verse,tafsir';

// ── Delete existing part files for a book ────────────────────────────────────
function deleteExistingParts(bookName) {
  const existing = fs.readdirSync(PARTS_DIR)
    .filter(f => f.startsWith(`${bookName}_`) && f.endsWith('.csv'));
  existing.forEach(f => fs.unlinkSync(path.join(PARTS_DIR, f)));
  return existing.length;
}

// ── Write parts for a book given its entries ──────────────────────────────────
function writeParts(bookName, entries) {
  if (entries.length === 0) return [];

  // Group serialized lines by chapter
  const chapterMap = new Map();
  for (const e of entries) {
    if (!chapterMap.has(e.chapter)) chapterMap.set(e.chapter, []);
    chapterMap.get(e.chapter).push(toCSVLine(e.book, e.chapter, e.verse, e.tafsir));
  }

  const chapters = [...chapterMap.keys()].sort((a, b) => a - b);
  const parts = [];

  let partStart = null;
  let partLines = [CSV_HEADER];
  let partBytes = Buffer.byteLength(CSV_HEADER, 'utf8') + 1;
  let prevChapter = null;

  const flush = (endCh) => {
    const outName = `${bookName}_${partStart}_${endCh}.csv`;
    const outPath = path.join(PARTS_DIR, outName);
    fs.writeFileSync(outPath, partLines.join('\n'), 'utf8');
    const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
    parts.push({ name: outName, sizeMB });
  };

  for (const ch of chapters) {
    const chLines = chapterMap.get(ch);
    const chBytes = chLines.reduce((s, l) => s + Buffer.byteLength(l, 'utf8') + 1, 0);

    if (partStart === null) partStart = ch;

    if (partBytes + chBytes > MAX_BYTES && partLines.length > 1) {
      flush(prevChapter);
      partLines = [CSV_HEADER];
      partBytes = Buffer.byteLength(CSV_HEADER, 'utf8') + 1;
      partStart = ch;
    }

    partLines.push(...chLines);
    partBytes += chBytes;
    prevChapter = ch;
  }

  if (partLines.length > 1) flush(prevChapter);
  return parts;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const csvFiles = fs.readdirSync(TAFSIR_DIR).filter(f => f.endsWith('.csv'));
const SKIP = new Set(['مزامير']);

const report = [];
let totalBooks = 0;
let totalFailed = 0;

for (const filename of csvFiles) {
  const bookName = filename.replace(/\.csv$/, '');
  if (SKIP.has(bookName)) {
    console.log(`⏭️  Skip: ${bookName}`);
    continue;
  }

  const filePath = path.join(TAFSIR_DIR, filename);
  const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(1);
  process.stdout.write(`\n📖 ${bookName} (${sizeMB}MB) ... `);

  let entries;
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    entries = parseCSV(text);
  } catch (err) {
    console.log(`❌ Read error: ${err.message}`);
    report.push({ book: bookName, status: 'READ_ERROR', real: 0, total: 0, error: err.message });
    totalFailed++;
    continue;
  }

  if (entries.length === 0) {
    console.log(`⚠️  No entries parsed`);
    report.push({ book: bookName, status: 'NO_ENTRIES', real: 0, total: 0 });
    totalFailed++;
    continue;
  }

  // Count chapters and real commentary
  const chapterSet = new Set(entries.map(e => e.chapter));
  const realChapters = new Set(
    entries
      .filter(e => e.tafsir.length >= MIN_REAL_CHARS)
      .map(e => e.chapter)
  );

  // Remove old parts and write new ones
  const deleted = deleteExistingParts(bookName);
  const parts = writeParts(bookName, entries);

  const partsStr = parts.map(p => `${p.name}(${p.sizeMB}MB)`).join(', ');
  console.log(`✅ ${realChapters.size}/${chapterSet.size} real chapters | ${parts.length} part(s) | deleted ${deleted} old`);
  if (parts.length > 0) console.log(`   ${partsStr}`);

  report.push({
    book: bookName,
    status: realChapters.size > 0 ? 'OK' : 'TITLES_ONLY',
    real: realChapters.size,
    total: chapterSet.size,
    parts: parts.length,
  });
  totalBooks++;
}

// ── Report ────────────────────────────────────────────────────────────────────
console.log('\n\n══════════════════════════════════════════════════');
console.log('📊 REPORT');
console.log('══════════════════════════════════════════════════');

const ok = report.filter(r => r.status === 'OK');
const titlesOnly = report.filter(r => r.status === 'TITLES_ONLY');
const errors = report.filter(r => !['OK', 'TITLES_ONLY'].includes(r.status));

console.log(`\n✅ OK (${ok.length}):`);
ok.forEach(r => console.log(`  ${r.book}: ${r.real}/${r.total} إصحاح فيه شرح فعلي`));

if (titlesOnly.length > 0) {
  console.log(`\n⚠️  عناوين فقط (${titlesOnly.length}):`);
  titlesOnly.forEach(r => console.log(`  ${r.book}: ${r.real}/${r.total}`));
}

if (errors.length > 0) {
  console.log(`\n❌ أخطاء (${errors.length}):`);
  errors.forEach(r => console.log(`  ${r.book}: ${r.status} ${r.error || ''}`));
}

console.log(`\nالإجمالي: ${totalBooks} سفر مُعالج، ${totalFailed} فشل`);
console.log('══════════════════════════════════════════════════\n');
