import type { Flashcard, QuizQuestion } from './types';

const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','can','shall',
  'in','on','at','to','for','of','with','by','from','this','that','these','those',
  'it','its','they','them','their','we','our','you','he','she','and','but','or',
  'not','also','just','only','very','each','every','all','some','any','more','less',
  'than','then','when','where','which','who','what','how','if','as','while',
  'such','there','here','into','about','through','during','before','after',
  'between','both','either','neither','nor','so','yet','because','since',
  'one','two','three','four','five','six','seven','eight','nine','ten',
  'use','used','using','make','made','take','taken','come','came','give','given',
  'get','got','put','set','let','new','old','long','many','much','well',
]);

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─── Text Parsing ────────────────────────────────────────────────────────────

/**
 * Split continuous prose text into individual sentences.
 * Avoids splitting on abbreviations and decimals by requiring uppercase after punctuation.
 */
function splitSentences(text: string): string[] {
  const result: string[] = [];
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
  for (const p of parts) {
    const s = p.trim();
    if (s.length >= 15 && /[a-zA-Z]{3,}/.test(s)) result.push(s);
  }
  return result;
}

/**
 * Generic heading labels that carry no useful content as a note.
 * Used to skip trivial section titles while still using them as boundaries.
 */
const GENERIC_HEADINGS = new Set([
  'introduction', 'conclusion', 'summary', 'overview', 'abstract',
  'references', 'bibliography', 'appendix', 'contents', 'preface',
  'foreword', 'acknowledgements', 'glossary', 'index', 'background',
  'discussion', 'results', 'methods', 'methodology', 'notes',
]);

/**
 * Detect section headings using text-pattern heuristics.
 * Matches: ALL CAPS, Title Case short lines, year-prefixed titles,
 * chapter/section markers — all without a sentence-ending period.
 */
function isHeadingLine(text: string): boolean {
  const t = text.trim();
  const words = t.split(/\s+/);

  // Length guard: headings are short
  if (words.length > 10 || t.length > 120) return false;
  // Must open with uppercase or digit
  if (!/^[A-Z\d"']/.test(t)) return false;
  // Prose sentence: ends with period/!/? after a lowercase letter → not a heading
  if (/[a-z][.!?]$/.test(t)) return false;

  // ALL CAPS (≥ 2 words): "KEY APPLICATIONS OF AI"
  if (words.length >= 2 && /^[A-Z][A-Z0-9\s:,&'"\-]*$/.test(t)) return true;

  // Year-prefixed: "2026 Trends", "2024 AI Report"
  if (/^\d{4}\s+[A-Z]/.test(t) && words.length <= 6) return true;

  // Explicit section markers: "Chapter 3", "Section 1.2"
  if (/^(chapter|section|part|unit)\s+[\d\w]+/i.test(t)) return true;

  // Title Case: ≥ 70 % of content words are capitalised, ≤ 8 words total
  const meaningful = words.filter(
    w => w.length > 3 &&
      !/^(and|the|of|in|on|at|for|with|to|a|an|or|but|nor|from|by|as)$/i.test(w),
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

/**
 * Parse raw text into clean string segments, correctly handling:
 *   - Section headings  → used as section boundaries; included if substantive
 *   - Numbered lists    → 1. item  /  1) item  /  (1) item
 *   - Lettered lists    → a. item  /  (a) item
 *   - Bullet points     → •  -  *  –  —  ►  →  ✓  ✗
 *   - Regular paragraphs (wrapped lines joined, then sentence-split)
 */
export function parseSegments(raw: string): string[] {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const segments: string[] = [];
  let paraBuffer: string[] = [];

  const flushPara = () => {
    if (!paraBuffer.length) return;
    const para = paraBuffer.join(' ').trim();
    paraBuffer = [];
    segments.push(...splitSentences(para));
  };

  for (const line of lines) {
    const t = line.trim();

    // Blank line → flush paragraph buffer (section or paragraph break)
    if (!t) { flushPara(); continue; }

    // ── Section heading → hard section boundary ──────────────────────────────
    if (isHeadingLine(t)) {
      flushPara();
      // Include as a segment only when it carries substantive content
      // (3+ words and not a generic label like "Conclusion" or "References")
      const words = t.split(/\s+/);
      if (words.length >= 3 && !GENERIC_HEADINGS.has(t.toLowerCase())) {
        segments.push(t);
      }
      continue;
    }

    // ── Numbered list: "1. text", "1) text", "(1) text", "12. text" ──────────
    const numMatch = t.match(/^\s*(?:\(?\d{1,3}[.)]\s*)(.+)/);
    if (numMatch) {
      const item = numMatch[1].trim();
      if (item.length >= 2 && /[a-zA-Z]/.test(item)) {
        flushPara();
        segments.push(item);
        continue;
      }
    }

    // ── Lettered list: "a. text", "A. text", "(a) text" ──────────────────────
    const letterMatch = t.match(/^\s*(?:\(?[a-zA-Z][.)]\s*)(.+)/);
    if (letterMatch && letterMatch[1].length > 3) {
      const item = letterMatch[1].trim();
      if (/[a-zA-Z]{2,}/.test(item)) {
        flushPara();
        segments.push(item);
        continue;
      }
    }

    // ── Bullet points: •  -  *  –  —  ►  ▸  →  ✓  ✗ ─────────────────────────
    const bulletMatch = t.match(/^\s*[•\-\*–—►▸→✓✗]\s+(.+)/);
    if (bulletMatch) {
      const item = bulletMatch[1].trim();
      if (item.length >= 2 && /[a-zA-Z]/.test(item)) {
        flushPara();
        segments.push(item);
        continue;
      }
    }

    // ── Regular prose line → accumulate into paragraph buffer ─────────────────
    paraBuffer.push(t);
  }

  flushPara();
  return segments;
}

// ─── Deduplication ───────────────────────────────────────────────────────────

function contentWords(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 4 && !STOP_WORDS.has(w))
  );
}

function jaccardSim(a: string, b: string): number {
  const wa = contentWords(a);
  const wb = contentWords(b);
  if (!wa.size || !wb.size) return 0;
  let shared = 0;
  wa.forEach(w => { if (wb.has(w)) shared++; });
  return shared / (wa.size + wb.size - shared);
}

function deduplicate(items: string[], threshold = 0.52): string[] {
  const kept: string[] = [];
  for (const item of items) {
    if (!kept.some(k => jaccardSim(k, item) >= threshold)) {
      kept.push(item);
    }
  }
  return kept;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function scoreSegment(seg: string, topKw: Set<string>): number {
  const words = seg.toLowerCase().split(/\s+/);
  const kwHits = words.filter(w => topKw.has(w)).length;
  const wc = words.length;
  // Prefer medium-length segments with high keyword density
  const lengthBonus = wc >= 3 && wc <= 40 ? 1 : wc < 3 ? 0.3 : 0.6;
  const density = kwHits / Math.max(1, wc);
  return density * 4 + lengthBonus * 0.5;
}

// ─── Main: extractNotes ──────────────────────────────────────────────────────

export function extractNotes(raw: string): string[] {
  const segments = parseSegments(raw);

  // Filter: must have meaningful letter content and at least 2 words
  const valid = segments.filter(s => {
    const letters = (s.match(/[a-zA-Z]/g) || []).length;
    const words = s.trim().split(/\s+/).length;
    return letters >= 5 && words >= 2;
  });

  if (valid.length === 0) return [];

  // Build top-keyword set for scoring
  const wordFreq: Record<string, number> = {};
  for (const seg of valid) {
    for (const w of contentWords(seg)) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  }
  const topKw = new Set(
    Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([w]) => w)
  );

  // Deduplicate, then score
  const deduped = deduplicate(valid);
  const scored = deduped
    .map(s => ({ s, score: scoreSegment(s, topKw) }))
    .sort((a, b) => b.score - a.score);

  // Return up to 6 notes (balances content richness with UI speed)
  const limit = Math.min(6, Math.max(3, scored.length));
  return scored.slice(0, limit).map(x => x.s);
}

// ─── Important Words ─────────────────────────────────────────────────────────

function getImportantWords(sentence: string, allText: string): string[] {
  const textFreq: Record<string, number> = {};
  for (const w of allText.toLowerCase().split(/\s+/)) {
    const clean = w.replace(/[^a-z]/g, '');
    if (clean.length >= 4) textFreq[clean] = (textFreq[clean] || 0) + 1;
  }
  const totalWords = Object.values(textFreq).reduce((s, n) => s + n, 0) || 1;

  return sentence
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z'-]/g, '').replace(/^'+|'+$/g, ''))
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w.toLowerCase()))
    .sort((a, b) => {
      const fa = textFreq[a.toLowerCase()] || 0;
      const fb = textFreq[b.toLowerCase()] || 0;
      // Higher score = less common (more unique) + longer word
      const scoreA = b.length * Math.log(totalWords / (fa + 1));
      const scoreB = a.length * Math.log(totalWords / (fb + 1));
      return scoreA - scoreB;
    });
}

// ─── generateFlashcards ──────────────────────────────────────────────────────

const CONCEPT_QUESTIONS = [
  (kp: string) => `What is meant by "${kp}"?`,
  (kp: string) => `How would you describe "${kp}"?`,
  (kp: string) => `What does "${kp}" refer to in this context?`,
  (kp: string) => `Explain the significance of "${kp}"`,
];

export function generateFlashcards(notes: string[]): Flashcard[] {
  const allText = notes.join(' ');
  return notes.map((note, i) => {
    const words = note.trim().split(/\s+/);
    const important = getImportantWords(note, allText);

    // For sentences of 6+ words: try fill-in-the-blank
    if (words.length >= 6 && important.length > 0) {
      for (const key of important.slice(0, 3)) {
        const blanked = note.replace(new RegExp(`\\b${key}\\b`, 'i'), '______');
        if (blanked !== note) {
          return {
            front: `Fill in the blank:\n"${blanked}"`,
            back: key,
          };
        }
      }
    }

    // Short items or fallback: concept recall question
    const keyPhrase = words.slice(0, Math.min(6, words.length)).join(' ');
    const template = CONCEPT_QUESTIONS[i % CONCEPT_QUESTIONS.length];
    return {
      front: template(keyPhrase),
      back: note,
    };
  });
}

// ─── generateQuiz ────────────────────────────────────────────────────────────

export function generateQuiz(notes: string[], fullText: string): QuizQuestion[] {
  return notes.map((note, i) => {
    const important = getImportantWords(note, fullText);

    // Type A: fill-in-the-blank
    if (important.length > 0) {
      for (const answerWord of important.slice(0, 3)) {
        const questionText = note.replace(new RegExp(`\\b${answerWord}\\b`, 'i'), '______');
        if (questionText === note) continue;

        // Build distractors from other notes' important words
        const distractors = notes
          .filter((_, j) => j !== i)
          .flatMap(n => getImportantWords(n, fullText))
          .reduce<string[]>((acc, w) => {
            if (w.toLowerCase() !== answerWord.toLowerCase() &&
                !acc.some(a => a.toLowerCase() === w.toLowerCase())) {
              acc.push(w);
            }
            return acc;
          }, [])
          .slice(0, 3);

        const fillers = ['Framework', 'Mechanism', 'Integration', 'Synthesis', 'Outcome', 'Analysis'];
        while (distractors.length < 3) {
          distractors.push(fillers[(i + distractors.length) % fillers.length]);
        }

        return {
          question: questionText,
          options: shuffle([answerWord, ...distractors.slice(0, 3)]),
          answer: answerWord,
        };
      }
    }

    // Type B: identify correct statement (uses full notes as options)
    const others = shuffle(notes.filter((_, j) => j !== i)).slice(0, 3);
    while (others.length < 3) others.push('None of the above apply here');

    return {
      question: 'Which of the following is stated in the material?',
      options: shuffle([note, ...others].slice(0, 4)),
      answer: note,
    };
  });
}
