import React from 'react';
import { DiaryCard } from './DiaryCard';
import { type DiaryEntry } from '../types';
import { Icon } from './Icon';

interface DiaryListProps {
  entries: DiaryEntry[];
  onSummarize: () => void;
}

export const DiaryList: React.FC<DiaryListProps> = ({ entries, onSummarize }) => {
  const groupedEntries = entries.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, DiaryEntry[]>);

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const hasTodayEntries = Object.keys(groupedEntries).includes(today);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-kor">나의 기록들</h2>
        {hasTodayEntries && (
          <button onClick={onSummarize} className="bg-rose-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-600 transition-colors flex items-center text-sm">
            <Icon name="sparkles" className="w-5 h-5 mr-2" />
            오늘 하루 요약
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <Icon name="empty" className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-kor">아직 작성된 일기가 없어요.</p>
          <p className="text-slate-400 font-kor text-sm">첫 번째 순간을 기록해보세요!</p>
        </div>
      ) : (
        // FIX: Use Object.keys to iterate over grouped entries to avoid type inference issues with Object.entries.
        Object.keys(groupedEntries).map((date) => (
          <div key={date}>
            <h3 className="text-lg font-semibold text-slate-600 mb-4 pb-2 border-b-2 border-slate-200 font-kor">{date}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedEntries[date].map(entry => (
                <DiaryCard key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};