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
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
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
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}
