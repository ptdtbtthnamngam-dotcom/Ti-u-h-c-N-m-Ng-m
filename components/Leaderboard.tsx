
import React from 'react';
import { Storage } from '../services/storage';

interface LeaderboardProps {
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const results = Storage.getLeaderboard();

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-blue-800 flex items-center">
          <span className="mr-2">🏆</span> Bảng Xếp Hạng
        </h2>
        <button onClick={onBack} className="text-gray-400 hover:text-blue-600">Quay lại</button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>Chưa có bảng xếp hạng nào. Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((res, idx) => (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                idx === 0 ? 'bg-yellow-50 border-yellow-200' : 
                idx === 1 ? 'bg-gray-50 border-gray-200' :
                idx === 2 ? 'bg-orange-50 border-orange-200' : 'bg-white border-transparent'
              }`}
            >
              <div className="flex items-center space-x-4">
                <span className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-white shadow-sm ${
                   idx === 0 ? 'bg-yellow-500' : 
                   idx === 1 ? 'bg-slate-400' :
                   idx === 2 ? 'bg-orange-500' : 'bg-blue-300'
                }`}>
                  {idx + 1}
                </span>
                <span className="font-bold text-gray-800">{res.studentName}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-blue-600 font-extrabold text-xl">{res.score}</span>
                <span className="text-gray-400 text-sm hidden sm:inline">{res.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
