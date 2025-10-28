
import React from 'react';

interface SpinnerProps {
    message?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      {message && <p className="mt-4 text-slate-600 font-semibold font-kor animate-pulse">{message}</p>}
    </div>
  );
};
