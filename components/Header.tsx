
import React from 'react';
import { Icon } from './Icon';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-center text-center">
        <Icon name="logo" className="w-10 h-10 text-rose-500 mr-3" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">My Daily Sketch</h1>
          <p className="text-sm md:text-base text-slate-500 font-kor">AI 기반 비주얼 다이어리</p>
        </div>
      </div>
    </header>
  );
};
