
import { User, QuizResult } from '../types';

const USER_KEY = 'english_star_user';
const LEADERBOARD_KEY = 'english_star_leaderboard';

export const Storage = {
  getUser: (): User | null => {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },
  saveUser: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getLeaderboard: (): QuizResult[] => {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveResult: (result: QuizResult) => {
    const results = Storage.getLeaderboard();
    results.push(result);
    // Sort high to low
    results.sort((a, b) => b.score - a.score);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(results));
  },
  canTakeQuiz: (user: User): boolean => {
    if (!user.lastQuizDate) return true;
    const today = new Date().toDateString();
    return user.lastQuizDate !== today;
  }
};
