export interface DiaryEntry {
  id: string;
  date: string;
  originalPhotoUrl: string;
  transcription: string;
  generatedText: string;
  generatedImageUrl: string;
  placeName?: string;
}

export interface SummaryData {
  summary: string;
  score: number;
}