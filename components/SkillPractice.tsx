
import React, { useState, useEffect } from 'react';
import { Skill, PracticeExercise, VocabularyExercise, TranslationExercise, ReadingComprehensionExercise, FillInTheBlankExercise, ListeningComprehensionExercise, PronunciationPracticeExercise } from '../types';
import { GeminiService } from '../services/geminiService';

interface SkillPracticeProps {
  skill: Skill;
  onBack: () => void;
}

const SkillPractice: React.FC<SkillPracticeProps> = ({ skill, onBack }) => {
  const [hint, setHint] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [topic] = useState("Daily Life"); // Default topic, can be made dynamic later

  const [exercises, setExercises] = useState<PracticeExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userInputs, setUserInputs] = useState<Record<string, string | number | null>>({}); // Stores user answers by exercise ID
  const [feedback, setFeedback] = useState<Record<string, { message: string; isCorrect: boolean | null }>>({}); // Stores feedback by exercise ID
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [exerciseError, setExerciseError] = useState<string | null>(null);

  const currentExercise = exercises[currentExerciseIndex];
  const currentFeedback = feedback[currentExercise?.id || ''] || null;

  // Audio decoding functions (moved here to be self-contained for audio logic)
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const playAudio = async (text: string) => {
    if (isPlayingAudio || !text) return;
    setIsPlayingAudio(true);
    try {
      const buffer = await GeminiService.generateSpeech(text);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 }); // Match sample rate
      
      const audioBuffer = await decodeAudioData(
        new Uint8Array(buffer),
        audioContext,
        24000,
        1,
      );
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => setIsPlayingAudio(false);
      source.start(0);
    } catch (err) {
      console.error("Error playing audio:", err);
      setIsPlayingAudio(false);
    }
  };

  // Fetch hint and exercises
  useEffect(() => {
    const loadContent = async () => {
      setLoadingExercises(true);
      setExerciseError(null);
      try {
        const h = await GeminiService.getQuickHint(skill, topic);
        setHint(h);

        const generatedExercises = await GeminiService.generatePracticeExercises(skill, topic);
        if (generatedExercises.length === 0) {
          setExerciseError("Không thể tải bài tập. Hãy thử lại sau!");
        } else {
          setExercises(generatedExercises);
          setUserInputs({}); // Reset inputs for new exercises
          setFeedback({}); // Reset feedback
        }
      } catch (err: any) {
        console.error("Failed to load skill practice content:", err);
        setExerciseError(`Lỗi khi tải bài tập: ${err.message || 'Không xác định'}. Vui lòng thử lại.`);
      } finally {
        setLoadingExercises(false);
      }
    };

    loadContent();
  }, [skill, topic]);

  const normalizeText = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"") // Remove punctuation
      .replace(/\s{2,}/g," "); // Replace multiple spaces with single space
  };

  const handleUserInput = (exerciseId: string, value: string | number | null) => {
    setUserInputs(prev => ({ ...prev, [exerciseId]: value }));
    // Clear feedback when user types
    setFeedback(prev => {
      const newFeedback = { ...prev };
      if (newFeedback[exerciseId]) {
        delete newFeedback[exerciseId];
      }
      return newFeedback;
    });
  };

  const handleCheckAnswer = (exercise: PracticeExercise) => {
    const userInput = userInputs[exercise.id];
    let isCorrect = false;
    let message = '';

    switch (exercise.type) {
      case 'vocabulary':
        const vocabEx = exercise as VocabularyExercise;
        isCorrect = normalizeText(userInput as string) === normalizeText(vocabEx.meaning);
        message = isCorrect 
          ? "Đúng rồi! Tuyệt vời!" 
          : `Chưa đúng. Đáp án là: "${vocabEx.meaning}"`;
        break;
      case 'translation':
        const transEx = exercise as TranslationExercise;
        isCorrect = normalizeText(userInput as string) === normalizeText(transEx.vietnameseAnswer);
        message = isCorrect 
          ? "Đúng rồi! Tuyệt vời!" 
          : `Chưa đúng. Đáp án chính xác là: "${transEx.vietnameseAnswer}"`;
        break;
      case 'reading_comprehension':
      case 'listening_comprehension':
        const multiChoiceEx = exercise as ReadingComprehensionExercise | ListeningComprehensionExercise;
        isCorrect = userInput === multiChoiceEx.correctOptionIndex;
        message = isCorrect 
          ? "Chính xác! Bạn thật giỏi." 
          : `Chưa đúng. Đáp án là: "${multiChoiceEx.options[multiChoiceEx.correctOptionIndex]}"`;
        break;
      case 'fill_in_the_blank':
        const blankEx = exercise as FillInTheBlankExercise;
        isCorrect = normalizeText(userInput as string) === normalizeText(blankEx.blankAnswer);
        message = isCorrect 
          ? "Hoàn hảo! Bạn điền đúng rồi." 
          : `Chưa đúng. Đáp án là: "${blankEx.blankAnswer}"`;
        break;
      case 'pronunciation_practice':
        // For pronunciation, we just confirm they tried. Actual assessment requires advanced STT.
        isCorrect = true; // Assume correct if they attempt
        message = "Rất tốt! Hãy cố gắng luyện tập thêm nhé.";
        break;
      default:
        message = "Loại bài tập không xác định.";
        isCorrect = false;
        break;
    }
    setFeedback(prev => ({ ...prev, [exercise.id]: { message, isCorrect } }));
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      // All exercises completed
      alert("Bạn đã hoàn thành tất cả bài tập cho kỹ năng này!");
      onBack(); // Go back to dashboard
    }
  };

  const renderExerciseContent = (exercise: PracticeExercise) => {
    const currentInput = userInputs[exercise.id];
    const currentFeedbackState = feedback[exercise.id];

    // Helper for common input/check pattern
    const renderTextInputControl = (
      placeholder: string,
      correctAnswerDisplay: string
    ) => (
      <>
        <input
          type="text"
          placeholder={placeholder}
          className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-300 focus:outline-none"
          value={(currentInput as string) || ''}
          onChange={(e) => handleUserInput(exercise.id, e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleCheckAnswer(exercise);
            }
          }}
          disabled={!!currentFeedbackState} // Disable input after check
        />
        {!currentFeedbackState && (
          <button
            onClick={() => handleCheckAnswer(exercise)}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            disabled={!currentInput}
          >
            Kiểm tra
          </button>
        )}
        {currentFeedbackState && (
          <div className={`mt-3 p-3 rounded-xl ${currentFeedbackState.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="font-medium">{currentFeedbackState.message}</p>
          </div>
        )}
      </>
    );

    // Helper for common multiple choice pattern
    const renderMultipleChoiceControl = (options: string[], correctOptionIndex: number) => (
      <>
        <div className="grid grid-cols-1 gap-3 mb-4">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleUserInput(exercise.id, idx)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                currentInput === idx
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'
              }`}
              disabled={!!currentFeedbackState} // Disable buttons after check
            >
              <span className="inline-block w-8 font-bold">{String.fromCharCode(65 + idx)}.&nbsp;</span>
              {opt}
            </button>
          ))}
        </div>
        {!currentFeedbackState && (
          <button
            onClick={() => handleCheckAnswer(exercise)}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            disabled={currentInput === null || currentInput === undefined}
          >
            Kiểm tra
          </button>
        )}
        {currentFeedbackState && (
          <div className={`mt-3 p-3 rounded-xl ${currentFeedbackState.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="font-medium">{currentFeedbackState.message}</p>
          </div>
        )}
      </>
    );

    switch (exercise.type) {
      case 'vocabulary':
        const vocabEx = exercise as VocabularyExercise;
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-2xl">
              <span className="text-2xl font-bold text-blue-600">{vocabEx.word}</span>
              <button 
                onClick={() => playAudio(vocabEx.audioText)}
                disabled={isPlayingAudio}
                className="bg-blue-100 p-2 rounded-full text-blue-600 hover:bg-blue-200"
              >
                {isPlayingAudio ? '⏳' : '🔊'}
              </button>
            </div>
            <p className="text-gray-600">Nghĩa của từ này là gì?</p>
            {renderTextInputControl("Nhập nghĩa tiếng Việt...", vocabEx.meaning)}
          </div>
        );
      case 'translation':
        const transEx = exercise as TranslationExercise;
        return (
          <div className="space-y-4">
            <p className="text-gray-600">"{transEx.englishSentence}" nghĩa là gì?</p>
            {renderTextInputControl("Nhập câu dịch tiếng Việt...", transEx.vietnameseAnswer)}
          </div>
        );
      case 'reading_comprehension':
        const readEx = exercise as ReadingComprehensionExercise;
        return (
          <div className="space-y-4">
            <p className="text-gray-700 bg-blue-50 p-4 rounded-xl border border-blue-100 leading-relaxed">{readEx.passage}</p>
            <p className="text-gray-600 font-medium">{readEx.question}</p>
            {renderMultipleChoiceControl(readEx.options, readEx.correctOptionIndex)}
          </div>
        );
      case 'fill_in_the_blank':
        const fillEx = exercise as FillInTheBlankExercise;
        // Replace ____ with a visible input placeholder for UX
        const sentenceParts = fillEx.sentenceWithBlank.split('____');
        return (
          <div className="space-y-4">
            <p className="text-gray-600">
              {sentenceParts[0]}
              <input
                type="text"
                className="inline-block w-24 mx-2 p-1 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none text-blue-700 font-bold text-center"
                placeholder="____"
                value={(currentInput as string) || ''}
                onChange={(e) => handleUserInput(exercise.id, e.target.value)}
                disabled={!!currentFeedbackState}
              />
              {sentenceParts[1]}
            </p>
            {!currentFeedbackState && (
              <button
                onClick={() => handleCheckAnswer(exercise)}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                disabled={!currentInput}
              >
                Kiểm tra
              </button>
            )}
            {currentFeedbackState && (
              <div className={`mt-3 p-3 rounded-xl ${currentFeedbackState.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <p className="font-medium">{currentFeedbackState.message}</p>
              </div>
            )}
          </div>
        );
      case 'listening_comprehension':
        const listenEx = exercise as ListeningComprehensionExercise;
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-2xl">
              <span className="text-lg font-bold text-gray-700">Nghe và trả lời:</span>
              <button 
                onClick={() => playAudio(listenEx.audioText)}
                disabled={isPlayingAudio}
                className="bg-blue-100 p-2 rounded-full text-blue-600 hover:bg-blue-200"
              >
                {isPlayingAudio ? '⏳' : '🔊'}
              </button>
            </div>
            <p className="text-gray-600 font-medium">{listenEx.question}</p>
            {renderMultipleChoiceControl(listenEx.options, listenEx.correctOptionIndex)}
          </div>
        );
      case 'pronunciation_practice':
        const pronEx = exercise as PronunciationPracticeExercise;
        return (
          <div className="space-y-4 text-center">
            <p className="text-gray-600 mb-4">Hãy nghe và lặp lại thật to câu sau:</p>
            <div className="flex items-center justify-center space-x-4 bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <span className="text-2xl font-bold text-blue-700">{pronEx.phrase}</span>
              <button 
                onClick={() => playAudio(pronEx.audioText)}
                disabled={isPlayingAudio}
                className="bg-blue-100 p-2 rounded-full text-blue-600 hover:bg-blue-200"
              >
                {isPlayingAudio ? '⏳' : '🔊'}
              </button>
            </div>
            {/* For actual pronunciation assessment, a microphone input and STT API would be needed */}
            {/* For now, we provide a "I repeated it" button for the student to self-assess */}
            {!currentFeedbackState && (
              <button
                onClick={() => handleCheckAnswer(exercise)} // This acts as a confirmation for practice
                className="mt-4 w-full bg-green-500 text-white py-2 rounded-xl font-bold hover:bg-green-600 transition-colors"
              >
                Em đã lặp lại!
              </button>
            )}
            {currentFeedbackState && (
              <div className={`mt-3 p-3 rounded-xl ${currentFeedbackState.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <p className="font-medium">{currentFeedbackState.message}</p>
              </div>
            )}
          </div>
        );
      default:
        return <p className="text-red-500">Loại bài tập không hỗ trợ.</p>;
    }
  };

  if (loadingExercises) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      <p className="text-blue-600 font-bold">Thầy giáo đang chuẩn bị bài tập cho em...</p>
    </div>
  );

  if (exerciseError || exercises.length === 0) return (
    <div className="text-center p-8 bg-white rounded-3xl shadow-lg">
      <p className="text-red-500 text-lg font-bold mb-4">{exerciseError || "Không có bài tập nào được tạo. Vui lòng thử lại sau."}</p>
      <button onClick={onBack} className="bg-blue-600 text-white px-6 py-2 rounded-xl">Quay lại</button>
    </div>
  );

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

      <div className="bg-white p-6 rounded-3xl shadow-md border-2 border-blue-50">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📚</span> Bài tập {currentExerciseIndex + 1} / {exercises.length}
        </h3>
        {currentExercise && (
          <>
            <p className="text-gray-700 mb-6 leading-relaxed">{currentExercise.prompt}</p>
            {renderExerciseContent(currentExercise)}
            <button
              onClick={handleNextExercise}
              className={`mt-6 w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center space-x-2 ${
                !feedback[currentExercise.id] ? 'bg-gray-300' : 'bg-green-500 hover:bg-green-600'
              }`}
              disabled={!feedback[currentExercise.id]} // Only enable if current exercise has feedback
            >
              <span>{currentExerciseIndex === exercises.length - 1 ? 'Hoàn thành' : 'Bài tiếp theo'}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </>
        )}
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