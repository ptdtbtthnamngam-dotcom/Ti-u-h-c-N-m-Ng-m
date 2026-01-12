
export interface User {
  name: string;
  lastQuizDate: string | null;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuizResult {
  studentName: string;
  score: number;
  date: string;
}

export enum Skill {
  READING = 'Reading',
  WRITING = 'Writing',
  LISTENING = 'Listening',
  PRONUNCIATION = 'Pronunciation'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  thinking?: string;
}

// --- New Interfaces for Practice Exercises ---

export interface BaseExercise {
  type: string;
  id: string; // Unique ID for the exercise
  prompt: string; // General prompt or instruction for the exercise
}

export interface VocabularyExercise extends BaseExercise {
  type: 'vocabulary';
  word: string; // The word to practice
  audioText: string; // Text to speak for pronunciation
  meaning: string; // Meaning in Vietnamese
}

export interface TranslationExercise extends BaseExercise {
  type: 'translation';
  englishSentence: string;
  vietnameseAnswer: string;
}

export interface ReadingComprehensionExercise extends BaseExercise {
  type: 'reading_comprehension';
  passage: string;
  question: string;
  options: string[];
  correctOptionIndex: number; // Index of the correct option
}

export interface FillInTheBlankExercise extends BaseExercise {
  type: 'fill_in_the_blank';
  sentenceWithBlank: string; // E.g., "The cat sat on the ____."
  blankAnswer: string; // E.g., "mat"
}

export interface ListeningComprehensionExercise extends BaseExercise {
  type: 'listening_comprehension';
  audioText: string; // The text to be spoken
  question: string; // Question about the audio
  options: string[];
  correctOptionIndex: number;
}

export interface PronunciationPracticeExercise extends BaseExercise {
  type: 'pronunciation_practice';
  phrase: string; // The phrase to be pronounced
  audioText: string; // Text to speak for pronunciation
}

export type PracticeExercise = 
  | VocabularyExercise
  | TranslationExercise
  | ReadingComprehensionExercise
  | FillInTheBlankExercise
  | ListeningComprehensionExercise
  | PronunciationPracticeExercise;
