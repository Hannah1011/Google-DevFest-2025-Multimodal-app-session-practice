import React, { useState, useCallback } from 'react';
import { DiaryEntryForm } from './components/DiaryEntryForm';
import { DiaryList } from './components/DiaryList';
import { Header } from './components/Header';
import { SummaryModal } from './components/SummaryModal';
import { Spinner } from './components/Spinner';
import { type DiaryEntry, type SummaryData } from './types';
import { generateDiaryEntry, createImagePrompt, generateSketch, summarizeDay } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';

const App: React.FC = () => {
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  const handleCreateEntry = useCallback(async (photo: File, transcription: string, placeName?: string) => {
    if (!photo || !transcription.trim()) {
      setError('사진과 음성 기록을 모두 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      setLoadingMessage('음성 기록으로 일기 및 스케치 프롬프트 생성 중...');
      const diaryPromise = generateDiaryEntry(transcription, placeName);
      const imagePromptPromise = createImagePrompt(transcription);
      
      const [{ generatedText }, imagePrompt] = await Promise.all([diaryPromise, imagePromptPromise]);

      setLoadingMessage('AI 스케치를 그리는 중... (최대 1분 소요)');
      const generatedImageBase64 = await generateSketch(imagePrompt);
      const generatedImageUrl = `data:image/jpeg;base64,${generatedImageBase64}`;

      const photoUrl = await fileToBase64(photo);

      const newEntry: DiaryEntry = {
        id: new Date().toISOString(),
        date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
        originalPhotoUrl: photoUrl,
        transcription,
        generatedText,
        generatedImageUrl,
        placeName,
      };

      setDiaryEntries(prevEntries => [newEntry, ...prevEntries]);
    } catch (err) {
      console.error(err);
      setError('일기 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleSummarizeToday = useCallback(async () => {
    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    const todayEntries = diaryEntries.filter(entry => entry.date === today);

    if (todayEntries.length === 0) {
      setError('오늘 작성된 일기가 없습니다.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('오늘 하루를 요약하는 중...');
    setError(null);
    
    try {
      const summary = await summarizeDay(todayEntries);
      setSummaryData(summary);
    } catch (err) {
      console.error(err);
      setError('요약 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [diaryEntries]);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {isLoading && <Spinner message={loadingMessage} />}
      {summaryData && <SummaryModal summaryData={summaryData} onClose={() => setSummaryData(null)} />}
      <Header />
      <main className="container mx-auto p-4 md:p-8 max-w-5xl">
        <DiaryEntryForm onSubmit={handleCreateEntry} isLoading={isLoading} />
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative my-4" role="alert">
            <strong className="font-bold">오류: </strong>
            <span className="block sm:inline">{error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </span>
          </div>
        )}
        <DiaryList entries={diaryEntries} onSummarize={handleSummarizeToday} />
      </main>
    </div>
  );
};

export default App;