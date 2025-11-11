import { GoogleGenAI, Type, Modality } from "@google/genai";
import { type DiaryEntry } from '../types';
import { enqueue } from './apiQueue';

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
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
      }
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
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const prompt = `Google Maps 툴을 사용하여 다음 검색어와 정확히 일치하는 장소를 찾아주세요. 검색어를 해석하지 말고 문자 그대로 사용하세요. 검색어: "${query}"`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
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
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const prompt = placeName
            ? `다음 음성 기록과 장소("${placeName}") 정보를 바탕으로 짧고 감성적인 일기 텍스트를 작성해 주세요. 무조건 음성 기록에 쓰인 내용 바탕으로 텍스트를 작성해야합니다. 친구에게 말하듯이 친근한 어조를 사용하고, 장소에 대한 내용을 자연스럽게 포함해 3문장으로 출력하세요. 무조건 내용만 출력해주세요. \n\n음성 기록: "${transcription}"`
            : `다음 음성 기록을 바탕으로 짧고 감성적인 일기 텍스트를 작성해 주세요. 친구에게 말하듯이 친근한 어조를 사용해서 3문장만 출력하세요.
            음성 기록: "${transcription}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    }));
}

export function generateSketch(photoBase64: string, mimeType: string, transcription: string): Promise<string> {
    return enqueue(() => withRetry(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const prompt = `이 이미지는 내 일상의 한 장면이야. 이 사진의 전체적인 구도와 주요 피사체는 70% 정도 유지해줘. 여기에 내가 남긴 아래 음성 기록의 감정과 내용을 30% 정도 반영해서 하나의 예술적인 스케치로 재창조해줘. 예를 들어, 음성 기록이 '오늘 정말 신나는 하루였어!'라면, 그림에 활기차고 밝은 느낌을 더해주는 식이야. 따뜻하고 감성적인 손그림 스타일로 완성해줘.\n\n음성 기록: "${transcription}"`;

        const imagePart = {
            inlineData: {
                data: photoBase64,
                mimeType: mimeType,
            },
        };
        
        const textPart = {
            text: prompt
        };

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [imagePart, textPart] },
          config: {
              responseModalities: [Modality.IMAGE],
          },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        
        throw new Error("Image generation failed, no image data returned in the response.");
    }));
}

export function summarizeDay(entries: DiaryEntry[]): Promise<{ summary: string; score: number }> {
    return enqueue(() => withRetry(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
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