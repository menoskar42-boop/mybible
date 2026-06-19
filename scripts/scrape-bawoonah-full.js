/**
 * Scrape بؤونة FULL TEXT from st-takla.org
 *
 * HOW TO USE:
 * 1. Open https://st-takla.org in your browser
 * 2. Press F12 → Console
 * 3. Paste this script and press Enter
 * 4. Wait ~5 minutes → file "bawoonah-full.json" downloads automatically
 */

(async () => {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const BASE = 'https://st-takla.org/Full-Free-Coptic-Books/Synaxarium-or-Synaxarion/10-Bawoonah';
  const results = [];

  function guessType(name) {
    if (/ملاك|ميخائيل|جبرائيل|رفائيل|غبريال/.test(name)) return 'ملاك';
    if (/رسول|بطرس|بولس|يوحنا الرسول|مرقس|متى|لوقا|يعقوب|تداوس|حنانيا|برنابا|كاربوس/.test(name)) return 'رسول';
    if (/نبي|إيليا|موسى|داود|أليشع|صموئيل|يشوع|يوحنا المعمدان/.test(name)) return 'نبي';
    if (/البابا|البطريرك/.test(name)) return 'بابا';
    if (/أسقف|مطران/.test(name)) return 'أسقف';
    if (/الشهيدة|استشهاد.*ة/.test(name)) return 'شهيدة';
    if (/شهيد|استشهاد/.test(name)) return 'شهيد';
    if (/راهبة/.test(name)) return 'راهبة';
    if (/راهب|ناسك|أنبا|سائح/.test(name)) return 'راهب';
    if (/عيد|تكريس|تذكار كنيسة|ظهور|افتتاح|عودة رفات|ميلاد يوحنا/.test(name)) return 'عيد';
    if (/قديسة/.test(name)) return 'قديسة';
    return 'قديس';
  }

  function parsePage(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const entries = [];

    // st-takla structure: each saint section starts with <h2 class="Tittle2"> or similar
    // followed by paragraphs of body text until the next heading

    // Try to find saint headings — st-takla uses various heading classes
    const allHeadings = [...doc.querySelectorAll('h2, h3, .Tittle2, .Title2, .title2, [class*="ittle"]')];

    // Filter to actual saint names (not page headers/footers)
    const saintHeadings = allHeadings.filter(h => {
      const txt = h.textContent.trim();
      // Skip navigation, page title, etc.
      if (txt.length < 5) return false;
      if (/^st-takla|^القديس بالإنجليزي|^Home|^Français|^البحث|^الصفحة الرئيسية/i.test(txt)) return false;
      return true;
    });

    if (saintHeadings.length > 0) {
      saintHeadings.forEach((h, i) => {
        const name = h.textContent.trim().replace(/^\d+[\-\.\s]+/, '').trim();
        if (!name || name.length < 3) return;

        // Collect ALL text from following siblings until next heading
        let fullText = '';
        let el = h.nextElementSibling;
        const nextHeading = saintHeadings[i + 1];

        while (el) {
          // Stop at next saint heading
          if (nextHeading && el === nextHeading) break;
          if (['H2', 'H3'].includes(el.tagName) && el !== h) {
            // Check if this is one of our saint headings
            const isNextSaint = saintHeadings.some(sh => sh === el);
            if (isNextSaint) break;
          }

          const tagName = el.tagName;
          // Include paragraphs, divs with text content
          if (['P', 'DIV', 'BLOCKQUOTE', 'SPAN'].includes(tagName)) {
            const txt = el.textContent.trim();
            if (txt.length > 5) {
              fullText += txt + '\n\n';
            }
          }
          el = el.nextElementSibling;
        }

        const cleanText = fullText
          .replace(/\n{3,}/g, '\n\n')  // max 2 newlines
          .trim();

        if (name.length > 3) {
          entries.push({
            name,
            description: cleanText || name,
            type: guessType(name)
          });
        }
      });
    }

    // Fallback: if no headings found, try <b> or <strong> in paragraphs
    if (entries.length === 0) {
      let currentName = '';
      let currentDesc = '';

      doc.querySelectorAll('p, h2, h3').forEach(el => {
        const bold = el.querySelector('b, strong');
        if (bold && bold.textContent.trim().length > 5) {
          // Save previous entry
          if (currentName) {
            entries.push({ name: currentName, description: currentDesc.trim(), type: guessType(currentName) });
          }
          currentName = bold.textContent.trim();
          currentDesc = el.textContent.replace(bold.textContent, '').trim() + '\n\n';
        } else if (currentName) {
          currentDesc += el.textContent.trim() + '\n\n';
        }
      });

      if (currentName) {
        entries.push({ name: currentName, description: currentDesc.trim(), type: guessType(currentName) });
      }
    }

    return entries;
  }

  console.log('🚀 Starting full-text بؤونة scrape from st-takla.org...');
  console.log('⏳ This will take about 5 minutes (30 pages × 10 seconds each)...');

  for (let day = 1; day <= 30; day++) {
    // Try zero-padded first (01, 02, ...), then non-padded (1, 2, ...)
    const dayPadded = String(day).padStart(2, '0');
    const urlPadded = `${BASE}/${dayPadded}-Bawoonah.html`;
    const urlPlain  = `${BASE}/${day}-Bawoonah.html`;

    let html = null;
    for (const url of [urlPadded, urlPlain]) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        // Decode as Windows-1256 (Arabic Windows encoding used by st-takla.org)
        const buffer = await res.arrayBuffer();
        const decoded = new TextDecoder('windows-1256').decode(buffer);
        // Verify it's the right page (not a 404 redirect)
        if (decoded.includes('no longer exists') || decoded.includes('غير متاح')) continue;
        html = decoded;
        break;
      } catch {}
    }

    if (!html) {
      console.warn(`⚠️  بؤونة ${day}: page not found`);
      results.push({ day, entries: [], error: 'page not found' });
      await delay(800);
      continue;
    }

    try {
      const entries = parsePage(html);
      results.push({ day, entries });

      const totalChars = entries.reduce((s, e) => s + e.description.length, 0);
      console.log(`✅ بؤونة ${day}: ${entries.length} تذكار | ${totalChars.toLocaleString()} حرف`);
    } catch (err) {
      console.warn(`⚠️  بؤونة ${day}: ${err.message}`);
      results.push({ day, entries: [], error: err.message });
    }

    await delay(800); // polite delay
  }

  // Download
  const output = { month: 10, monthName: 'بؤونه', days: results };
  const json = JSON.stringify(output, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bawoonah-full.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  const totalEntries = results.reduce((s, r) => s + r.entries.length, 0);
  const totalChars = results.reduce((s, r) => s + r.entries.reduce((ss, e) => ss + e.description.length, 0), 0);
  console.log(`\n✅ Done!`);
  console.log(`📊 ${results.length} days | ${totalEntries} entries | ${(totalChars / 1000).toFixed(0)}K characters`);
  console.log(`📥 File: bawoonah-full.json`);
})();
