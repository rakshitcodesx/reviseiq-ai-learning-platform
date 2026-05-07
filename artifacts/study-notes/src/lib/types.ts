export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface StudySession {
  id: string;
  timestamp: number;
  inputText: string;
  notes: string[];
  keywords: string[];
  difficulty: Difficulty;
  readingTimeMin: number;
  revisionTimeMin: number;
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
}
