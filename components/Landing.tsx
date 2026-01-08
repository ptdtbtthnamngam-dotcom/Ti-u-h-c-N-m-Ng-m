
import React, { useState } from 'react';

interface LandingProps {
  onRegister: (name: string) => void;
}

const Landing: React.FC<LandingProps> = ({ onRegister }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onRegister(name.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-600 p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-6 transform hover:scale-[1.02] transition-transform duration-300">
        <div className="inline-block bg-yellow-400 p-4 rounded-full shadow-lg">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-extrabold text-blue-800">Chào mừng bạn!</h1>
        <p className="text-gray-600">Hãy nhập tên của mình để bắt đầu hành trình chinh phục tiếng Anh nhé!</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên của bạn là gì?"
            className="w-full px-6 py-4 rounded-xl border-2 border-blue-100 focus:border-blue-500 focus:outline-none text-lg transition-all"
            required
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transform hover:-translate-y-1 transition-all active:scale-95"
          >
            Bắt đầu ngay
          </button>
        </form>
      </div>
    </div>
  );
};

export default Landing;
