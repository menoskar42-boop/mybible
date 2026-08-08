#!/usr/bin/env node
/**
 * Splits all tafsir CSV files into parts under ~45MB each,
 * saves them to client/public/tafsir-parts/ with naming: bookname_lo_hi.csv
 * Already-split files (e.g. مزامير) are skipped.
 */

const fs = require('fs');
const path = require('path');

const TAFSIR_DIR = path.join(__dirname, '../client/public/tafsir');
const PARTS_DIR = path.join(__dirname, '../client/public/tafsir-parts');
const MAX_BYTES = 45 * 1024 * 1024; // 45MB per part

if (!fs.existsSync(PARTS_DIR)) fs.mkdirSync(PARTS_DIR, { recursive: true });

// Get already-split book names from tafsir-parts
const alreadySplit = new Set();
fs.readdirSync(PARTS_DIR).forEach(f => {
  const m = f.match(/^(.+)_\d+_\d+\.csv$/);
  if (m) alreadySplit.add(m[1]);
});

const csvFiles = fs.readdirSync(TAFSIR_DIR).filter(f => f.endsWith('.csv'));

let totalDone = 0;
let totalSkipped = 0;
let totalParts = 0;

for (const filename of csvFiles) {
  const bookName = filename.replace(/\.csv$/, '');

  if (alreadySplit.has(bookName)) {
    console.log(`⏭️  Skip (already split): ${bookName}`);
    totalSkipped++;
    continue;
  }

  const filePath = path.join(TAFSIR_DIR, filename);
  const stat = fs.statSync(filePath);
  const fileSizeMB = (stat.size / 1024 / 1024).toFixed(1);

  console.log(`\n📖 Processing: ${bookName} (${fileSizeMB}MB)`);

  // Read file and split by lines, grouping by chapter
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const header = lines[0];

  // Group raw lines by chapter number (parse chapter = second comma-field)
  const chapterLines = new Map();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    let chapter = null;
    // Handle quoted first field
    if (line.startsWith('"')) {
      let j = 1;
      while (j < line.length) {
        if (line[j] === '"') {
          if (j + 1 < line.length && line[j + 1] === '"') { j += 2; continue; }
          else { j++; break; }
        }
        j++;
      }
      // j now points past the closing quote; next char should be ','
      if (j < line.length && line[j] === ',') j++;
      // read chapter number
      const rest = line.slice(j);
      const comma2 = rest.indexOf(',');
      chapter = parseInt(comma2 === -1 ? rest : rest.slice(0, comma2), 10);
    } else {
      const parts = line.split(',');
      chapter = parseInt(parts[1], 10);
    }

    if (isNaN(chapter) || chapter < 1) continue;

    if (!chapterLines.has(chapter)) chapterLines.set(chapter, []);
    chapterLines.get(chapter).push(line);
  }

  const chapters = [...chapterLines.keys()].sort((a, b) => a - b);

  if (chapters.length === 0) {
    console.log(`  ⚠️  No chapters found, skipping.`);
    continue;
  }

  const minChapter = chapters[0];
  const maxChapter = chapters[chapters.length - 1];

  // If file is small enough, write as a single part
  if (stat.size <= MAX_BYTES) {
    const outName = `${bookName}_${minChapter}_${maxChapter}.csv`;
    const outPath = path.join(PARTS_DIR, outName);
    const outLines = [header];
    for (const ch of chapters) outLines.push(...chapterLines.get(ch));
    fs.writeFileSync(outPath, outLines.join('\n'), 'utf8');
    const outSize = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
    console.log(`  ✅ Single part: ${outName} (${outSize}MB)`);
    totalParts++;
    totalDone++;
    continue;
  }

  // Need to split — accumulate chapters until we approach MAX_BYTES
  let partStart = null;
  let partLines = [header];
  let partBytes = Buffer.byteLength(header, 'utf8') + 1;
  let partCount = 0;
  let prevChapter = null;

  const flushPart = (endChapter) => {
    const outName = `${bookName}_${partStart}_${endChapter}.csv`;
    const outPath = path.join(PARTS_DIR, outName);
    fs.writeFileSync(outPath, partLines.join('\n'), 'utf8');
    const outSize = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
    console.log(`  ✅ Part: ${outName} (${outSize}MB)`);
    partCount++;
    totalParts++;
  };

  for (const ch of chapters) {
    const chLines = chapterLines.get(ch);
    const chBytes = chLines.reduce((s, l) => s + Buffer.byteLength(l, 'utf8') + 1, 0);

    if (partStart === null) partStart = ch;

    if (partBytes + chBytes > MAX_BYTES && partLines.length > 1) {
      flushPart(prevChapter);
      partLines = [header];
      partBytes = Buffer.byteLength(header, 'utf8') + 1;
      partStart = ch;
    }

    partLines.push(...chLines);
    partBytes += chBytes;
    prevChapter = ch;
  }

  // Flush last part
  if (partLines.length > 1) flushPart(prevChapter);

  console.log(`  📦 Total parts for ${bookName}: ${partCount}`);
  totalDone++;
}

console.log(`\n✅ Done!`);
console.log(`   Processed: ${totalDone} books`);
console.log(`   Skipped (already split): ${totalSkipped} books`);
console.log(`   Total part files created: ${totalParts}`);
