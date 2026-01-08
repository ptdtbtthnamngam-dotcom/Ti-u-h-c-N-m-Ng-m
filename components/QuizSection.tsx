
import React, { useState, useEffect } from 'react';
import { User, QuizQuestion } from '../types';
import { GeminiService } from '../services/geminiService';
import { Storage } from '../services/storage';

interface QuizSectionProps {
  user: User;
  // Update onComplete signature
  onComplete: (score: number, questionsCompleted: QuizQuestion[], answersCompleted: number[]) => void;
  onBack: () => void;
}

// Utility function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const QuizSection: React.FC<QuizSectionProps> = ({ user, onComplete, onBack }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Storage.canTakeQuiz(user)) {
      setError("Hôm nay bạn đã làm bài kiểm tra rồi! Hãy quay lại vào ngày mai nhé.");
      setLoading(false);
      return;
    }

    const loadQuiz = async () => {
      try {
        const generated = await GeminiService.generateQuiz("tổng hợp tiếng anh tiểu học");
        
        // Shuffle options for each question
        const shuffledQuestions = generated.slice(0, 20).map(q => {
          const correctOptionText = q.options[q.correctAnswer];
          const shuffledOptions = shuffleArray(q.options);
          const newCorrectAnswerIndex = shuffledOptions.findIndex(opt => opt === correctOptionText);
          return {
            ...q,
            options: shuffledOptions,
            correctAnswer: newCorrectAnswerIndex,
          };
        });

        setQuestions(shuffledQuestions);
        setLoading(false);
      } catch (err) {
        setError("Không thể tải bài kiểm tra. Hãy thử lại sau!");
        setLoading(false);
      }
    };

    loadQuiz();
  }, [user]);

  const handleSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate score: 0.5 pts per correct answer
      let correctCount = 0;
      questions.forEach((q, i) => {
        if (answers[i] === q.correctAnswer) correctCount++;
      });
      // Pass questions and answers for review
      onComplete(correctCount * 0.5, questions, answers);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      <p className="text-blue-600 font-bold">Thầy giáo đang chuẩn bị đề bài...</p>
    </div>
  );

  if (error) return (
    <div className="text-center p-8 bg-white rounded-3xl shadow-lg">
      <p className="text-red-500 text-lg font-bold mb-4">{error}</p>
      <button onClick={onBack} className="bg-blue-600 text-white px-6 py-2 rounded-xl">Quay lại</button>
    </div>
  );

  const currentQ = questions[currentIndex];

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl max-w-2xl mx-auto animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-bold text-blue-500 px-3 py-1 bg-blue-50 rounded-full">Câu {currentIndex + 1} / {questions.length}</span>
        <button onClick={onBack} className="text-gray-400 hover:text-red-500 transition-colors">Thoát</button>
      </div>

      <div className="mb-6 space-y-4">
        <h3 className="text-xl font-bold text-blue-700 leading-relaxed">
          {currentQ.question}
        </h3>

        {/* Removed explanation / hint section */}
      </div>

      <div className="grid grid-cols-1 gap-3 mb-8">
        {currentQ.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            className={`p-4 rounded-2xl border-2 text-left transition-all transform active:scale-[0.98] ${
              answers[currentIndex] === idx 
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg translate-x-1 animate-pulse-selection' 
                : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'
            }`}
          >
            <span className="inline-block w-8 font-bold">{String.fromCharCode(65 + idx)}.&nbsp;</span>
            {opt}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={answers[currentIndex] === undefined}
        className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg flex items-center justify-center space-x-2 ${
          answers[currentIndex] === undefined ? 'bg-gray-300' : 'bg-green-500 hover:bg-green-600 hover:-translate-y-1'
        }`}
      >
        <span>{currentIndex === questions.length - 1 ? 'Nộp bài' : 'Câu tiếp theo'}</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  );
};

export default QuizSection;