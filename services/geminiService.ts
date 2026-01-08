
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { QuizQuestion } from "../types";

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
        contents: [{ parts: [{ text: `Say clearly for a child: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
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
}
