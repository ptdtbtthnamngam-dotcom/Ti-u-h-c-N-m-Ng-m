
import React, { useState, useEffect } from 'react';
import { User, Skill, QuizQuestion } from './types';
import { Storage } from './services/storage';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import QuizSection from './components/QuizSection';
import SkillPractice from './components/SkillPractice';
import Leaderboard from './components/Leaderboard';
import ChatBot from './components/ChatBot';
import QuizReview from './components/QuizReview'; // NEW IMPORT

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  // Update view type
  const [view, setView] = useState<'home' | 'quiz' | 'practice' | 'leaderboard' | 'chat' | 'quizReview'>('home');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  // NEW STATE FOR QUIZ REVIEW
  const [reviewedQuestions, setReviewedQuestions] = useState<QuizQuestion[] | null>(null);
  const [studentQuizAnswers, setStudentQuizAnswers] = useState<number[] | null>(null);


  useEffect(() => {
    const savedUser = Storage.getUser();
    if (savedUser) setUser(savedUser);
  }, []);

  const handleRegister = (name: string) => {
    const newUser = { name, lastQuizDate: null };
    setUser(newUser);
    Storage.saveUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('english_star_user');
    setUser(null);
    setView('home');
    // Clear review data on logout
    setReviewedQuestions(null);
    setStudentQuizAnswers(null);
  };

  if (!user) {
    return <Landing onRegister={handleRegister} />;
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-20 md:pb-0">
      {/* Navigation Header */}
      <nav className="bg-white shadow-md p-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="bg-yellow-400 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-blue-600 hidden sm:inline">English Star</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-gray-700 font-medium">Chào, <span className="text-blue-600">{user.name}</span>!</span>
          <button 
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500"
          >
            Đăng xuất
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {view === 'home' && (
          <Dashboard 
            onNavigate={(v) => {
              setView(v);
              // Clear review data when navigating away from review or quiz
              setReviewedQuestions(null);
              setStudentQuizAnswers(null);
            }} 
            onSelectSkill={(s) => {
              setSelectedSkill(s);
              setView('practice');
              setReviewedQuestions(null);
              setStudentQuizAnswers(null);
            }}
          />
        )}
        {view === 'quiz' && (
          <QuizSection 
            user={user} 
            // Update onComplete signature
            onComplete={(score, questionsCompleted, answersCompleted) => {
              const updatedUser = { ...user, lastQuizDate: new Date().toDateString() };
              setUser(updatedUser);
              Storage.saveUser(updatedUser);
              Storage.saveResult({ studentName: user.name, score, date: new Date().toLocaleDateString() });
              
              setReviewedQuestions(questionsCompleted); // NEW
              setStudentQuizAnswers(answersCompleted); // NEW
              setView('quizReview'); // Change to quizReview view after quiz
            }} 
            onBack={() => setView('home')}
          />
        )}
        {view === 'practice' && selectedSkill && (
          <SkillPractice 
            skill={selectedSkill} 
            onBack={() => setView('home')} 
          />
        )}
        {view === 'leaderboard' && (
          <Leaderboard onBack={() => setView('home')} />
        )}
        {view === 'chat' && (
          <ChatBot onBack={() => setView('home')} />
        )}
        {/* NEW QUIZ REVIEW VIEW */}
        {view === 'quizReview' && reviewedQuestions && studentQuizAnswers && (
          <QuizReview
            questions={reviewedQuestions}
            studentAnswers={studentQuizAnswers}
            onBack={() => {
              setView('home');
              setReviewedQuestions(null);
              setStudentQuizAnswers(null);
            }}
          />
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 md:hidden">
        <button onClick={() => setView('home')} className={`flex flex-col items-center ${view === 'home' ? 'text-blue-600' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          <span className="text-xs">Trang chủ</span>
        </button>
        <button onClick={() => setView('chat')} className={`flex flex-col items-center ${view === 'chat' ? 'text-blue-600' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          <span className="text-xs">Chat AI</span>
        </button>
        <button onClick={() => setView('leaderboard')} className={`flex flex-col items-center ${view === 'leaderboard' ? 'text-blue-600' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          <span className="text-xs">Bảng điểm</span>
        </button>
      </div>
    </div>
  );
};

export default App;
