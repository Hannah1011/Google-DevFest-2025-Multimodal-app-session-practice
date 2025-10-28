import React, { useState } from 'react';
import { type DiaryEntry } from '../types';
import { Icon } from './Icon';

interface DiaryCardProps {
  entry: DiaryEntry;
}

export const DiaryCard: React.FC<DiaryCardProps> = ({ entry }) => {
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
      <div className="relative cursor-pointer" onClick={() => setShowOriginal(!showOriginal)}>
        <img
          src={showOriginal ? entry.originalPhotoUrl : entry.generatedImageUrl}
          alt={showOriginal ? "Original Photo" : "AI Generated Sketch"}
          className="w-full h-56 object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
          {showOriginal ? '원본 사진' : 'AI 스케치'} (클릭해서 전환)
        </div>
      </div>
      <div className="p-5">
        <p className="text-slate-600 font-kor leading-relaxed text-sm">{entry.generatedText}</p>
        
        <div className="mt-4 space-y-2">
            {entry.placeName && (
              <div className="flex items-center text-xs text-slate-500">
                <Icon name="location" className="w-4 h-4 mr-1.5 flex-shrink-0" />
                <span className="font-semibold truncate" title={entry.placeName}>{entry.placeName}</span>
              </div>
            )}
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer">음성 기록 보기</summary>
              <p className="mt-1 p-2 bg-slate-50 rounded font-kor">{entry.transcription}</p>
            </details>
        </div>
      </div>
    </div>
  );
};