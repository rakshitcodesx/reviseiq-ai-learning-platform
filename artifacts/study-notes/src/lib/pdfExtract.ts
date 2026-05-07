import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PosItem {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function isTextItem(
  item: unknown,
): item is { str: string; transform: number[]; width: number; height: number } {
  return (
    typeof item === 'object' &&
    item !== null &&
    'str' in item &&
    'transform' in item
  );
}

/**
 * Detect whether a line is a section heading.
 * Uses font-size ratio first, then falls back to text-pattern rules.
 */
function looksLikeHeading(text: string, lineH: number, bodyH: number): boolean {
  // Font is meaningfully larger than body text → heading
  if (bodyH > 0 && lineH > bodyH * 1.15) return true;

  const t = text.trim();
  const words = t.split(/\s+/);

  // Too long or too short to be a heading
  if (words.length > 10 || t.length > 120) return false;
  // Must open with uppercase or digit
  if (!/^[A-Z\d"']/.test(t)) return false;
  // If it ends with a period after a lowercase letter → prose sentence, not heading
  if (/[a-z][.!?]$/.test(t)) return false;

  // ALL CAPS (≥ 2 words): "KEY APPLICATIONS", "CHAPTER 1"
  if (words.length >= 2 && /^[A-Z][A-Z0-9\s:,&'"\-]*$/.test(t)) return true;

  // Year-prefixed heading: "2026 Trends", "2024 AI Report"
  if (/^\d{4}\s+[A-Z]/.test(t) && words.length <= 6) return true;

  // Explicit section markers
  if (/^(chapter|section|part|unit)\s+[\d\w]+/i.test(t)) return true;

  // Title Case: majority of content words are capitalised, line ≤ 8 words
  const meaningful = words.filter(
    w => w.length > 3 && !/^(and|the|of|in|on|at|for|with|to|a|an|or|but|nor)$/i.test(w),
  );
  const capped = meaningful.filter(w => /^[A-Z]/.test(w));
  if (
    meaningful.length >= 2 &&
    capped.length >= Math.ceil(meaningful.length * 0.7) &&
    words.length <= 8
  ) {
    return true;
  }

  return false;
}

/** Fix common PDF extraction artefacts */
function normalizePDFText(text: string): string {
  return (
    text
      // Rejoin hyphenated line-breaks: "learn-\ning" → "learning"
      .replace(/(\w)-\n(\w)/g, '$1$2')
      // Common PDF ligatures
      .replace(/ﬁ/g, 'fi')
      .replace(/ﬂ/g, 'fl')
      .replace(/ﬀ/g, 'ff')
      .replace(/ﬃ/g, 'ffi')
      .replace(/ﬄ/g, 'ffl')
      .replace(/ﬆ/g, 'st')
      // Null bytes and non-printable control characters (keep \n, \t)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      // Collapse horizontal whitespace within a line (preserve newlines)
      .replace(/[ \t]+/g, ' ')
      // Collapse 3+ consecutive blank lines → 2
      .replace(/\n{3,}/g, '\n\n')
      // Remove lines that are pure whitespace
      .replace(/\n +\n/g, '\n\n')
      .trim()
  );
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // ── 1. Collect positioned items ──────────────────────────────────────────
    const items: PosItem[] = [];
    for (const raw of content.items) {
      if (!isTextItem(raw) || !raw.str.trim()) continue;
      const h = raw.height > 0 ? raw.height : Math.abs(raw.transform[3]);
      items.push({
        str: raw.str,
        x: raw.transform[4],
        y: raw.transform[5],
        // Use reported width; fall back to rough estimate
        w: raw.width > 0 ? raw.width : raw.str.length * h * 0.55,
        h,
      });
    }

    if (items.length === 0) continue;

    // ── 2. Determine body font size (modal height, ignoring tiny artifacts) ──
    const validHeights = items
      .filter(it => it.h >= 4)
      .map(it => Math.round(it.h * 2) / 2);
    const hFreq: Record<string, number> = {};
    for (const h of validHeights) hFreq[h] = (hFreq[h] || 0) + 1;
    const bodyH =
      validHeights.length > 0
        ? parseFloat(Object.entries(hFreq).sort((a, b) => b[1] - a[1])[0][0])
        : 10;

    // ── 3. Group items into visual lines by Y proximity ───────────────────────
    // PDF Y-axis: 0 = bottom of page → sort descending to get top-to-bottom order
    const sorted = [...items].sort((a, b) => b.y - a.y);
    const yThreshold = bodyH * 0.45;

    const lines: PosItem[][] = [];
    for (const item of sorted) {
      const existing = lines.find(
        line => Math.abs(line[0].y - item.y) <= yThreshold,
      );
      if (existing) {
        existing.push(item);
      } else {
        lines.push([item]);
      }
    }

    // Sort items within each line left-to-right
    for (const line of lines) line.sort((a, b) => a.x - b.x);

    // ── 4. Reconstruct text with structural spacing ───────────────────────────
    const outputLines: string[] = [];
    let prevY: number | null = null;
    let prevH = bodyH;

    for (const line of lines) {
      const lineY = line[0].y;
      const lineMaxH = Math.max(...line.map(it => it.h)) || bodyH;

      // ── Assemble line text, inserting spaces for horizontal gaps ──
      let lineText = '';
      for (let i = 0; i < line.length; i++) {
        const item = line[i];
        if (i > 0) {
          const prev = line[i - 1];
          const gap = item.x - (prev.x + prev.w);
          // Only add separator for genuine gaps (avoid double-spaces from kerning)
          if (gap > lineMaxH * 0.15) {
            lineText += gap > lineMaxH * 2.5 ? '   ' : ' ';
          }
        }
        lineText += item.str;
      }

      lineText = lineText.replace(/[ \t]+/g, ' ').trim();
      if (!lineText) continue;

      // ── Insert vertical spacing based on gap from previous line ──
      if (prevY !== null) {
        const gap = prevY - lineY; // positive = downward on page
        if (gap > prevH * 2.8) {
          // Large gap → section/column break → blank line
          outputLines.push('');
        }
        // Smaller gaps: just a new line (handled by separate push below)
      }

      // ── Classify line and format output ──
      const isHeading = looksLikeHeading(lineText, lineMaxH, bodyH);

      if (isHeading) {
        // Ensure a blank line separates this heading from any preceding content
        if (outputLines.length > 0 && outputLines[outputLines.length - 1] !== '') {
          outputLines.push('');
        }
        outputLines.push(lineText);
        // Blank line after heading so content is clearly separated from it
        outputLines.push('');
      } else {
        outputLines.push(lineText);
      }

      prevY = lineY;
      prevH = lineMaxH;
    }

    pageTexts.push(outputLines.join('\n'));
  }

  const combined = pageTexts.join('\n\n');
  return normalizePDFText(combined).trim();
}
