import { GoogleGenAI, Type } from "@google/genai";
import { type DiaryEntry } from '../types';
import { enqueue } from './apiQueue';

let ai: GoogleGenAI;

function getAi() {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

/**
 * Retries a function with exponential backoff if it fails with a retriable server error.
 * @param fn The async function to execute.
 * @param retries The maximum number of retries.
 * @param delay The initial delay in milliseconds.
 * @returns The result of the function if it succeeds.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 5, delay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.toString().toLowerCase();
      // Check for retriable server errors like 503.
      if (errorMessage.includes('503') || errorMessage.includes('unavailable') || errorMessage.includes('overloaded')) {
        if (i < retries - 1) {
          const waitTime = delay * Math.pow(2, i);
          console.warn(`Model is overloaded. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
          await new Promise(res => setTimeout(res, waitTime));
        }
      } else {
        // Not a retriable error, rethrow immediately.
        throw error;
      }
    }
  }
  // If all retries fail, throw the last captured error.
  console.error('All retry attempts failed for a retriable error.');
  throw lastError;
}


export function searchPlaces(query: string): Promise<{name: string, details: string}[]> {
    return enqueue(() => withRetry(async () => {
        const ai = getAi();
        const prompt = `다음 검색어와 일치하거나 비슷한 장소를 찾아주세요. 장소 이름은 반드시 한국어로 제공해주세요. 예를 들어, 숙명여대를 쳤으면, 'Sookmyung Women's University'가 아닌 숙명여자대학교로 이름이 나오도록 해주세요. 검색어: "${query}"`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: prompt,
          config: {
            tools: [{googleMaps: {}}],
          },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (!groundingChunks) return [];

        // FIX: Add a type predicate to the filter to help TypeScript with type inference.
        const places = groundingChunks
          .filter((c: any): c is { maps: { title: string, uri?: string, placeAnswerSources?: { reviewSnippets?: { text: string }[] }[] } } => c.maps && c.maps.title)
          .map(c => {
              const details = c.maps?.placeAnswerSources?.[0]?.reviewSnippets?.[0]?.text || c.maps?.uri || '';
              return {
                  name: c.maps.title,
                  details: details.substring(0, 100)
              };
          });
        
        // Deduplicate places by name
        const uniquePlaces = Array.from(new Map(places.map(p => [p.name, p])).values());
        return uniquePlaces;
    }));
}


export function generateDiaryEntry(transcription: string, placeName?: string): Promise<string> {
    return enqueue(() => withRetry(async () => {
        const ai = getAi();
        const prompt = placeName
            ? `다음 음성 기록과 장소("${placeName}") 정보를 바탕으로 짧고 감성적인 일기 텍스트를 작성해 주세요. 무조건 음성 기록에 쓰인 내용 바탕으로 텍스트를 작성해야합니다. 친구에게 말하듯이 친근한 어조를 사용하고, 장소에 대한 내용을 자연스럽게 포함해 3문장으로 출력하세요. 무조건 내용만 출력해주세요. \n\n음성 기록: "${transcription}"`
            : `다음 음성 기록을 바탕으로 짧고 감성적인 일기 텍스트를 작성해 주세요. 친구에게 말하듯이 친근한 어조를 사용해서 3문장만 출력하세요.
            음성 기록: "${transcription}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });

        return response.text;
    }));
}


export function createImagePrompt(transcription: string): Promise<string> {
    return enqueue(() => withRetry(async () => {
        const ai = getAi();
        const prompt = `다음 텍스트를 기반으로, 따뜻하고 감성적인 느낌의 손그림 스타일 이미지를 생성할 수 있는 상세한 프롬프트를 영어로 작성해줘. 피사체, 배경, 분위기, 색감, 그림 스타일을 구체적으로 묘사해야 해. 프롬프트는 "A lovely, heartwarming hand-drawn sketch of..." 로 시작해야 해.\n\n"${transcription}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    }));
}

export function generateSketch(prompt: string): Promise<string> {
    return enqueue(() => withRetry(async () => {
        const ai = getAi();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: "16:9"
            }
        });

        if (response.generatedImages.length === 0) {
            throw new Error("Image generation failed, no images returned.");
        }
        return response.generatedImages[0].image.imageBytes;
    }));
}

export function summarizeDay(entries: DiaryEntry[]): Promise<{ summary: string; score: number }> {
    return enqueue(() => withRetry(async () => {
        const ai = getAi();
        const allEntriesText = entries.map(e => `[${e.placeName || '어딘가에서'}] ${e.generatedText}`).join('\n---\n');
        const prompt = `다음은 오늘 하루 동안 작성된 여러 개의 일기 내용입니다. 이 모든 내용을 종합하여 오늘 하루를 한두 문장으로 요약하고, 전반적인 감정을 10점 만점의 '감정 스코어'로 표현해 주세요. 응답은 반드시 지정된 JSON 형식이어야 합니다:\n\n일기 내용:\n${allEntriesText}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: {
                            type: Type.STRING,
                            description: '오늘 하루 전체에 대한 요약.'
                        },
                        score: {
                            type: Type.INTEGER,
                            description: '1에서 10 사이의 감정 점수.'
                        }
                    },
                    required: ['summary', 'score'],
                }
            }
        });

        const parsed = JSON.parse(response.text);
        return parsed;
    }));
}