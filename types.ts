
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
