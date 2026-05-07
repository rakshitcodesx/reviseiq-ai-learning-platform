import type { Difficulty } from './types';

const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall','can',
  'in','on','at','to','for','of','with','by','from','up','about','into','through',
  'during','before','after','above','below','between','this','that','these','those',
  'it','its','they','them','their','we','our','you','your','he','she','his','her',
  'i','my','me','and','but','or','nor','so','yet','both','either','neither','not',
  'no','also','just','only','very','quite','rather','such','each','every','all',
  'some','any','most','other','than','then','when','where','which','who','what',
  'how','why','if','as','while','although','because','since','unless','until',
  'there','here','now','more','less','one','two','three','four','five','six',
  'use','used','using','make','made','take','taken','come','came','give','given',
  'get','got','put','set','let','new','old','many','much','well','even','then',
]);

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

export function analyzeDifficulty(text: string): Difficulty {
  // Strip list markers for better sentence/word counts
  const cleaned = text
    .replace(/^\s*\d+[.)]\s+/gm, ' ')
    .replace(/^\s*[•\-\*–—►▸→✓✗]\s+/gm, ' ');

  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const words = cleaned.split(/\s+/).filter(w => /[a-zA-Z]/.test(w));
  if (sentences.length === 0 || words.length === 0) return 'Beginner';

  const avgWordsPerSentence = words.length / sentences.length;
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch-Kincaid Grade Level
  const grade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  if (grade < 8) return 'Beginner';
  if (grade < 13) return 'Intermediate';
  return 'Advanced';
}

export function getReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getRevisionTime(text: string): number {
  return Math.max(2, Math.ceil(getReadingTime(text) * 2.5));
}

export function extractKeywords(text: string, limit = 10): string[] {
  // Strip list markers so "1." or "•" don't pollute word extraction
  const cleaned = text
    .replace(/^\s*\d+[.)]\s+/gm, ' ')
    .replace(/^\s*[•\-\*–—►▸→✓✗]\s+/gm, ' ')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const allWords = cleaned.split(/\s+/).filter(w => w.length >= 4 && !STOP_WORDS.has(w));
  if (allWords.length === 0) return [];

  // Term frequency for single words
  const tf: Record<string, number> = {};
  for (const w of allWords) tf[w] = (tf[w] || 0) + 1;

  // Bigram frequency (adjacent content words only)
  const bf: Record<string, number> = {};
  for (let i = 0; i < allWords.length - 1; i++) {
    if (!STOP_WORDS.has(allWords[i]) && !STOP_WORDS.has(allWords[i + 1])) {
      const bigram = `${allWords[i]} ${allWords[i + 1]}`;
      bf[bigram] = (bf[bigram] || 0) + 1;
    }
  }

  const total = allWords.length;

  // Score single words: TF × log(word-length) — rewards specific, longer terms
  const singles: Array<[string, number]> = Object.entries(tf).map(([w, f]) => [
    w,
    (f / total) * 1000 * Math.log(w.length + 2),
  ]);

  // Score bigrams: boosted over unigrams (phrases carry more meaning), only if freq ≥ 2
  const bigrams: Array<[string, number]> = Object.entries(bf)
    .filter(([, f]) => f >= 2)
    .map(([b, f]) => [
      b,
      (f / (total - 1)) * 1000 * Math.log(b.length + 2) * 1.8,
    ]);

  // Merge and sort by score
  const all = [...singles, ...bigrams].sort((a, b) => b[1] - a[1]);

  // Pick top N, skip a term if it is fully contained in an already-selected phrase
  const result: string[] = [];
  for (const [term] of all) {
    const alreadyCovered = result.some(
      r =>
        r.toLowerCase().includes(term.toLowerCase()) ||
        term.toLowerCase().includes(r.toLowerCase())
    );
    if (!alreadyCovered) {
      const display = term
        .split(' ')
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
      result.push(display);
    }
    if (result.length >= limit) break;
  }

  return result;
}
