import type { Flashcard, QuizQuestion } from './types';

const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','have','has','had',
  'do','does','did','will','would','could','should','may','might','in','on',
  'at','to','for','of','with','by','from','this','that','these','those','it',
  'its','they','them','their','we','you','he','she','and','but','or','not',
  'also','just','only','very','such','each','every','all','some','any','than',
  'then','when','where','which','who','what','how','if','as','while','because',
]);

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function getImportantWords(sentence: string, fullText: string): string[] {
  const textWords = fullText.toLowerCase().split(/\s+/);
  return sentence
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z]/g, ''))
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w.toLowerCase()))
    .sort((a, b) => {
      const freqA = textWords.filter(w => w === a.toLowerCase()).length;
      const freqB = textWords.filter(w => w === b.toLowerCase()).length;
      return (freqB * b.length) - (freqA * a.length);
    });
}

export function extractNotes(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .slice(0, 3);
}

export function generateFlashcards(notes: string[]): Flashcard[] {
  const questionStarters = [
    'What is described by',
    'How would you explain',
    'What does the text say about',
  ];

  return notes.map((note, i) => {
    const words = note.split(/\s+/);
    const keyPhrase = words.slice(0, Math.min(5, Math.ceil(words.length * 0.35))).join(' ');
    const front = `${questionStarters[i % questionStarters.length]}: "${keyPhrase}..."?`;
    return { front, back: note };
  });
}

export function generateQuiz(notes: string[], fullText: string): QuizQuestion[] {
  return notes.map(note => {
    const important = getImportantWords(note, fullText);

    if (important.length === 0) {
      const otherNotes = notes.filter(n => n !== note);
      return {
        question: 'Which of the following is stated in the notes?',
        options: shuffle([note, ...otherNotes].slice(0, 4)),
        answer: note,
      };
    }

    const answerWord = important[0];

    const distractors: string[] = notes
      .filter(n => n !== note)
      .flatMap(n => getImportantWords(n, fullText))
      .filter(w => w.toLowerCase() !== answerWord.toLowerCase())
      .slice(0, 3);

    const fillers = ['Element', 'Process', 'System', 'Structure', 'Function', 'Method'];
    while (distractors.length < 3) {
      distractors.push(fillers[distractors.length % fillers.length]);
    }

    const questionText = note.replace(
      new RegExp(`\\b${answerWord}\\b`, 'i'),
      '______'
    );

    return {
      question: questionText,
      options: shuffle([answerWord, ...distractors.slice(0, 3)]),
      answer: answerWord,
    };
  });
}
