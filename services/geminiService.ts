import { GoogleGenAI } from "@google/genai";
import { ModelStatus } from "../types";

const apiKey = process.env.API_KEY || '';
// Initialize loosely; we will check for key presence before calling.
const ai = new GoogleGenAI({ apiKey });

export const analyzeRankState = async (rank: number, status: ModelStatus, lang: 'en' | 'zh' = 'en'): Promise<string> => {
  if (!apiKey) {
    return lang === 'zh' 
      ? "未找到 API 密钥。请设置 process.env.API_KEY 以启用 AI 分析。"
      : "API Key not found. Please set process.env.API_KEY to enable AI analysis.";
  }

  try {
    const prompt = `
      You are a senior AI Research Scientist specializing in Matrix Theory and Deep Learning Dynamics.
      
      Current Training State:
      - Rank Parameter (0-100): ${rank}
      - Status: ${status}
      - Target Audience Language: ${lang === 'zh' ? 'Chinese (Simplified)' : 'English'}

      Explain what is happening to the model's weight matrices mathematically and intuitively.
      
      Context:
      - Low Rank (<30): Manifold collapse, loss of expressivity, "The model is becoming a single repeated token".
      - Optimal Rank (30-70): Good generalization, stable eigenvalues.
      - High Rank (>70): Gradient explosion, numeric instability, VRAM OOM, "The weights are flying to infinity".

      Instructions:
      1. Respond primarily in ${lang === 'zh' ? 'Chinese' : 'English'}.
      2. Keep the response short (under 60 words).
      3. Be witty, technical, and slightly dramatic about the fate of the model.
      4. Use emojis suitable for the chaos or silence.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Fast response needed
      }
    });

    return response.text || (lang === 'zh' ? "分析失败。" : "Analysis failed.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return lang === 'zh' 
      ? "AI 目前过于不稳定，无法分析自身 (API 错误)。"
      : "The AI is too unstable to analyze itself right now (API Error).";
  }
};