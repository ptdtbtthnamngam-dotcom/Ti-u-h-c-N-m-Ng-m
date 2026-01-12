
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { QuizQuestion, Skill, PracticeExercise } from "../types";

// Helper to check for the specific 404 error
const isNotFoundError = (error: any) => {
  const message = error?.message || String(error);
  return message.includes("Requested entity was not found") || message.includes("404");
};

// Helper to handle the key selection logic
const handleApiError = async (error: any) => {
  if (isNotFoundError(error)) {
    console.error("Model not found or API key restricted. Opening key selector...", error);
    if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
    }
  }
  throw error;
};

export class GeminiService {
  private static getAI() {
    // Always create a new instance to ensure it uses the most up-to-date API key from the environment
    return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  }

  static async getQuickHint(skill: string, topic: string): Promise<string> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `Give a very short, encouraging 1-sentence tip in Vietnamese for a primary student learning ${skill} about ${topic}.`,
      });
      return response.text || "Hãy cố gắng lên nhé!";
    } catch (error) {
      console.warn("Hint generation failed, falling back to default.", error);
      try {
        await handleApiError(error);
      } catch (e) {
        // Silently fail for hints as they are non-critical UI decorations
      }
      return "Hãy cố gắng lên nhé!";
    }
  }

  static async generateQuiz(topic: string): Promise<QuizQuestion[]> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Tạo một bài kiểm tra tiếng Anh tiểu học gồm 20 câu hỏi trắc nghiệm về chủ đề: ${topic}. 
        Mỗi câu hỏi có 4 lựa chọn. Trả về định dạng JSON mảng các đối tượng có: id, question, options (mảng 4 chuỗi), correctAnswer (0-3), explanation (một gợi ý ngắn gọn giúp học sinh suy nghĩ về câu trả lời đúng mà không trực tiếp tiết lộ đáp án, giải thích khái niệm hoặc quy tắc liên quan).
        Sử dụng thông tin cập nhật nếu cần.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["id", "question", "options", "correctAnswer"]
            }
          }
        }
      });
      const text = response.text || "[]";
      return JSON.parse(text);
    } catch (error) {
      return await handleApiError(error);
    }
  }

  static async getChatResponse(history: { role: 'user' | 'model', parts: { text: string }[] }[]): Promise<string> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: history,
        config: {
          systemInstruction: "Bạn là một giáo viên tiếng Anh tiểu học vui vẻ, kiên nhẫn và tận tâm. Hãy giải đáp các thắc mắc của học sinh bằng tiếng Việt và tiếng Anh đơn giản.",
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });
      return response.text || "Thầy chưa hiểu ý em lắm, em nói lại được không?";
    } catch (error) {
      return await handleApiError(error);
    }
  }

  static async generateSpeech(text: string): Promise<ArrayBuffer> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Speak clearly for a child, at a moderate pace: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Using a friendly voice
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio generated");
      
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      return await handleApiError(error);
    }
  }

  static async generatePracticeExercises(skill: Skill, topic: string = "general topics"): Promise<PracticeExercise[]> {
    try {
      const ai = this.getAI();
      let prompt = `Tạo ra một MẢNG JSON gồm 6 bài tập tiếng Anh ĐA DẠNG và RIÊNG BIỆT dành cho học sinh tiểu học, tập trung vào kỹ năng "${skill}" với chủ đề "${topic}".
      
      Mỗi đối tượng bài tập trong mảng JSON PHẢI có các thuộc tính sau:
      - 'type': (string) Loại bài tập (ví dụ: 'vocabulary', 'translation', 'reading_comprehension', 'fill_in_the_blank', 'listening_comprehension', 'pronunciation_practice').
      - 'id': (string) Một ID duy nhất cho bài tập (ví dụ: "vocab-1", "reading-2").
      - 'prompt': (string) Hướng dẫn hoặc mô tả bài tập bằng tiếng Việt.

      Dựa trên 'type' của bài tập, hãy bao gồm TẤT CẢ các thuộc tính cần thiết khác như sau:
      - Nếu type là 'vocabulary': PHẢI có 'word' (string, từ tiếng Anh), 'audioText' (string, văn bản tiếng Anh để chuyển thành giọng nói, giống 'word'), và 'meaning' (string, nghĩa tiếng Việt).
      - Nếu type là 'translation': PHẢI có 'englishSentence' (string, câu tiếng Anh để dịch) và 'vietnameseAnswer' (string, câu dịch tiếng Việt chính xác).
      - Nếu type là 'reading_comprehension': PHẢI có 'passage' (string, một đoạn văn ngắn), 'question' (string, câu hỏi về đoạn văn), 'options' (mảng 4 string là các lựa chọn), và 'correctOptionIndex' (số nguyên 0-3 chỉ mục của đáp án đúng).
      - Nếu type là 'fill_in_the_blank': PHẢI có 'sentenceWithBlank' (string, câu có chỗ trống, dùng '____' để đánh dấu chỗ trống), và 'blankAnswer' (string, từ điền vào chỗ trống).
      - Nếu type là 'listening_comprehension': PHẢI có 'audioText' (string, văn bản tiếng Anh để chuyển thành giọng nói), 'question' (string, câu hỏi về nội dung nghe), 'options' (mảng 4 string là các lựa chọn), và 'correctOptionIndex' (số nguyên 0-3 chỉ mục của đáp án đúng).
      - Nếu type là 'pronunciation_practice': PHẢI có 'phrase' (string, cụm từ/câu tiếng Anh để luyện phát âm) và 'audioText' (string, văn bản tiếng Anh để chuyển thành giọng nói, giống 'phrase').

      Đảm bảo rằng 'audioText' luôn được cung cấp và là nội dung tiếng Anh cho các bài tập 'vocabulary', 'listening_comprehension', và 'pronunciation_practice'.

      Dưới đây là một ví dụ định dạng JSON cho bài tập 'vocabulary':
      ```json
      [
        {
          "type": "vocabulary",
          "id": "vocab-example-1",
          "prompt": "Nghe từ và chọn nghĩa đúng.",
          "word": "Apple",
          "audioText": "Apple",
          "meaning": "Quả táo"
        },
        {
          "type": "translation",
          "id": "trans-example-1",
          "prompt": "Dịch câu sau sang tiếng Việt.",
          "englishSentence": "The cat is sleeping.",
          "vietnameseAnswer": "Con mèo đang ngủ."
        }
      ]
      ```

      Sử dụng thông tin cập nhật nếu cần, nhưng đảm bảo nội dung phù hợp và đơn giản cho trẻ em.
      Định dạng JSON cuối cùng PHẢI hợp lệ và tuân thủ chặt chẽ các kiểu dữ liệu và thuộc tính đã mô tả.
      `;
      
      const comprehensiveResponseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            id: { type: Type.STRING },
            prompt: { type: Type.STRING },
            // VocabularyExercise fields
            word: { type: Type.STRING },
            audioText: { type: Type.STRING },
            meaning: { type: Type.STRING }, // Line 150 from the original file (if adjusted for prompt length)
            // TranslationExercise fields
            englishSentence: { type: Type.STRING },
            vietnameseAnswer: { type: Type.STRING },
            // ReadingComprehensionExercise fields
            passage: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctOptionIndex: { type: Type.INTEGER },
            // FillInTheBlankExercise fields
            sentenceWithBlank: { type: Type.STRING },
            blankAnswer: { type: Type.STRING },
            // PronunciationPracticeExercise fields
            phrase: { type: Type.STRING },
          },
          required: ["type", "id", "prompt"], // Base required properties for all exercises
        },
      };

      switch (skill) {
        case Skill.READING:
          prompt += ` Các loại bài tập ưu tiên là: 'reading_comprehension' (đoạn văn ngắn, câu hỏi trắc nghiệm) và 'fill_in_the_blank' (điền từ vào chỗ trống).`;
          break;
        case Skill.WRITING:
          prompt += ` Các loại bài tập ưu tiên là: 'translation' (dịch câu từ Anh sang Việt) và 'fill_in_the_blank' (điền từ vào chỗ trống).`;
          break;
        case Skill.LISTENING:
          prompt += ` Các loại bài tập ưu tiên là: 'listening_comprehension' (nghe một đoạn văn ngắn và trả lời trắc nghiệm về nội dung), 'vocabulary' (nghe từ và đoán nghĩa hoặc chính tả).`;
          break;
        case Skill.PRONUNCIATION:
          prompt += ` Các loại bài tập ưu tiên là: 'pronunciation_practice' (nghe và lặp lại một cụm từ/câu), 'vocabulary' (nghe từ và lặp lại).`;
          break;
        default:
          throw new Error("Invalid skill for practice exercises.");
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Pro model for more complex exercise generation
        contents: prompt,
        config: {
          // Removed tools: [{ googleSearch: {} }] to avoid potential conflicts with responseSchema
          responseMimeType: "application/json",
          responseSchema: comprehensiveResponseSchema,
        }
      });
      
      // Fix: Explicitly ensure response.text is a primitive string to avoid potential String object issues
      const rawResponseText = response.text;
      const text: string = (rawResponseText !== undefined ? rawResponseText : "[]"); // Corrected line 131 from error report
      const jsonString = text.replace(/```json\n([\s\S]*?)\n```/, '$1').trim();

      let parsedData: any;
      try {
        parsedData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error("Failed to parse JSON from model response:", parseError);
        throw new Error("Invalid JSON response from model.");
      }
      
      // Fix: Add runtime check to ensure parsed data is an array before casting,
      // addressing potential 'callable array' errors if the model output is malformed.
      if (!Array.isArray(parsedData)) {
        console.error("Model did not return an array of exercises as expected:", parsedData);
        throw new Error("Expected an array of exercises, but received a different format from the model.");
      }

      return parsedData as PracticeExercise[];
    } catch (error) {
      console.error("Error generating practice exercises:", error);
      return await handleApiError(error); // Re-throw after handling
    }
  }
}
