
import React from 'react';
import { QuizQuestion } from '../types';

interface QuizReviewProps {
  questions: QuizQuestion[];
  studentAnswers: number[];
  onBack: () => void;
}

const QuizReview: React.FC<QuizReviewProps> = ({ questions, studentAnswers, onBack }) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 animate-fadeIn max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-blue-800 flex items-center">
          <span className="mr-2">📝</span> Xem lại bài kiểm tra
        </h2>
        <button onClick={onBack} className="text-gray-400 hover:text-blue-600">Quay lại</button>
      </div>

      <div className="space-y-8">
        {questions.map((q, qIndex) => {
          const studentAnswerIndex = studentAnswers[qIndex];
          const isCorrect = studentAnswerIndex === q.correctAnswer;

          return (
            <div key={q.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-lg font-bold text-blue-700 mb-4">
                Câu {qIndex + 1}: {q.question}
              </p>
              <div className="space-y-3 mb-4">
                {q.options.map((opt, optIndex) => {
                  const isStudentSelected = studentAnswerIndex === optIndex;
                  const isCorrectAnswer = q.correctAnswer === optIndex;

                  let optionClassName = "p-3 rounded-xl border text-left transition-all flex items-center";
                  if (isCorrectAnswer) {
                    optionClassName += " bg-green-100 border-green-300 text-green-800 font-medium";
                  } else if (isStudentSelected && !isCorrect) {
                    optionClassName += " bg-red-100 border-red-300 text-red-800 font-medium";
                  } else {
                    optionClassName += " bg-white border-gray-200 text-gray-700";
                  }

                  return (
                    <div key={optIndex} className={optionClassName}>
                      <span className="inline-block w-8 font-bold">{String.fromCharCode(65 + optIndex)}.&nbsp;</span>
                      <span className="flex-1">{opt}</span>
                      {isCorrectAnswer && <span className="ml-2 text-green-600">✔️</span>}
                      {isStudentSelected && !isCorrectAnswer && <span className="ml-2 text-red-600">❌</span>}
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <div className="p-4 mt-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-xl">
                  <p className="text-sm text-blue-900 font-bold">
                    💡 Giải thích: {q.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all">
          Hoàn thành xem lại
        </button>
      </div>
    </div>
  );
};

export default QuizReview;
