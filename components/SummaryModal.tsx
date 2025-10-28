
import React from 'react';
import { type SummaryData } from '../types';
import { Icon } from './Icon';

interface SummaryModalProps {
  summaryData: SummaryData;
  onClose: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ summaryData, onClose }) => {
  const scoreColor = summaryData.score > 7 ? 'text-green-500' : summaryData.score > 4 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="text-center">
            <Icon name="sparkles" className="w-12 h-12 mx-auto text-rose-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2 font-kor">오늘 하루 요약</h2>
        </div>

        <p className="text-slate-600 my-6 font-kor leading-relaxed text-center">{summaryData.summary}</p>
        
        <div className="bg-slate-100 rounded-lg p-4 text-center">
            <h3 className="font-semibold text-slate-500 mb-2 font-kor">오늘의 감정 스코어</h3>
            <p className={`text-5xl font-bold ${scoreColor}`}>{summaryData.score}<span className="text-2xl text-slate-400">/10</span></p>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 bg-slate-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-700 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
};
