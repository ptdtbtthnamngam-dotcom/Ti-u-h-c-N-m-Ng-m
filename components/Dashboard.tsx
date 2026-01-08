
import React from 'react';
import { Skill } from '../types';

interface DashboardProps {
  onNavigate: (view: 'quiz' | 'leaderboard' | 'chat') => void;
  onSelectSkill: (skill: Skill) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectSkill }) => {
  const skills = [
    { name: Skill.READING, icon: '📖', color: 'bg-green-100 text-green-700 border-green-200' },
    { name: Skill.WRITING, icon: '✏️', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { name: Skill.LISTENING, icon: '🎧', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { name: Skill.PRONUNCIATION, icon: '🗣️', color: 'bg-red-100 text-red-700 border-red-200' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="bg-indigo-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between overflow-hidden relative shadow-xl">
        <div className="z-10 text-center md:text-left">
          <h2 className="text-3xl font-bold mb-2">Hôm nay học gì nhỉ?</h2>
          <p className="text-indigo-100 opacity-90">Hãy chọn một kỹ năng để luyện tập hoặc thử sức với bài kiểm tra ngày!</p>
          <button 
            onClick={() => onNavigate('quiz')}
            className="mt-6 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold px-8 py-3 rounded-full transition-all shadow-lg"
          >
            Làm bài kiểm tra (10 điểm)
          </button>
        </div>
        <div className="hidden md:block opacity-20 transform translate-x-10">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
        </div>
      </div>

      {/* Skills Grid */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="mr-2">🚀</span> Kỹ năng cần luyện
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {skills.map((skill) => (
            <button
              key={skill.name}
              onClick={() => onSelectSkill(skill.name)}
              className={`${skill.color} p-6 rounded-2xl border-2 flex flex-col items-center justify-center space-y-3 hover:scale-105 transition-all shadow-sm active:scale-95`}
            >
              <span className="text-4xl">{skill.icon}</span>
              <span className="font-bold">{skill.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onClick={() => onNavigate('leaderboard')}
          className="bg-white p-6 rounded-2xl shadow-md border-2 border-transparent hover:border-blue-300 cursor-pointer transition-all flex items-center"
        >
          <div className="bg-blue-100 p-4 rounded-xl mr-4 text-blue-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
          <div>
            <h4 className="font-bold text-gray-800">Bảng xếp hạng</h4>
            <p className="text-sm text-gray-500">Xem thành tích của các bạn khác</p>
          </div>
        </div>
        <div 
          onClick={() => onNavigate('chat')}
          className="bg-white p-6 rounded-2xl shadow-md border-2 border-transparent hover:border-indigo-300 cursor-pointer transition-all flex items-center"
        >
          <div className="bg-indigo-100 p-4 rounded-xl mr-4 text-indigo-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          </div>
          <div>
            <h4 className="font-bold text-gray-800">Thầy giáo AI</h4>
            <p className="text-sm text-gray-500">Hỏi bất cứ điều gì về tiếng Anh</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
