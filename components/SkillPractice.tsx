
import React, { useState, useEffect } from 'react';
import { Skill } from '../types';
import { GeminiService } from '../services/geminiService';

interface SkillPracticeProps {
  skill: Skill;
  onBack: () => void;
}

const SkillPractice: React.FC<SkillPracticeProps> = ({ skill, onBack }) => {
  const [hint, setHint] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [topic] = useState("Daily Life");

  useEffect(() => {
    const fetchHint = async () => {
      const h = await GeminiService.getQuickHint(skill, topic);
      setHint(h);
    };
    fetchHint();
  }, [skill, topic]);

  const playAudio = async (text: string) => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      const buffer = await GeminiService.generateSpeech(text);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(buffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => setIsPlaying(false);
      source.start(0);
    } catch (err) {
      console.error(err);
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-blue-800">Luyện tập: {skill}</h2>
        <button onClick={onBack} className="text-gray-500 hover:text-blue-600">Quay lại</button>
      </div>

      {hint && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-xl">
          <p className="text-yellow-800 italic">💡 Mẹo nhỏ: {hint}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Practice Card 1 */}
        <div className="bg-white p-6 rounded-3xl shadow-md border-2 border-blue-50">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
             <span>📖</span> Bài tập 1: Từ vựng
          </h3>
          <p className="text-gray-600 mb-6">Nghe và đọc theo từ sau:</p>
          <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-2xl">
            <span className="text-2xl font-bold text-blue-600">Apple</span>
            <button 
              onClick={() => playAudio("Apple. A - P - P - L - E. Apple.")}
              disabled={isPlaying}
              className="bg-blue-100 p-2 rounded-full text-blue-600 hover:bg-blue-200"
            >
              {isPlaying ? '⏳' : '🔊'}
            </button>
          </div>
        </div>

        {/* Practice Card 2 */}
        <div className="bg-white p-6 rounded-3xl shadow-md border-2 border-blue-50">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
             <span>✏️</span> Bài tập 2: Dịch câu
          </h3>
          <p className="text-gray-600 mb-4">"I love studying English" nghĩa là gì?</p>
          <input 
            type="text" 
            placeholder="Nhập câu trả lời..." 
            className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-300 focus:outline-none"
          />
          <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl font-bold">Kiểm tra</button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-lg text-center space-y-4">
        <div className="text-5xl">🎁</div>
        <h3 className="text-xl font-bold">Hãy khám phá thêm!</h3>
        <p className="text-gray-500">Mỗi bài luyện tập giúp bạn tiến gần hơn tới huy hiệu Ngôi Sao.</p>
      </div>
    </div>
  );
};

export default SkillPractice;
