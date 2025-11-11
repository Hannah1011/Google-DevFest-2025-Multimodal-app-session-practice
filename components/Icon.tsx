import React from 'react';

interface IconProps {
  name: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, className }) => {
  const icons: { [key: string]: React.ReactElement } = {
    logo: <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.354c-1.248 0-2.433-.374-3.433-1.074a8.053 8.053 0 01-5.133-7.58V6.375a1.5 1.5 0 012.25-1.3l9.666 5.582a1.5 1.5 0 010 2.598l-9.666 5.582a1.5 1.5 0 01-2.25-1.3v-1.93c0-1.579.932-3.003 2.343-3.642L12 9.563l2.82 1.628c1.41.64 2.343 2.063 2.343 3.642v1.93a1.5 1.5 0 01-2.25 1.3l-1.333-.77" />,
    photo: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />,
    mic: <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m12-9l-2.639 2.639M6 6l2.639 2.639m7.5-3.25a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6a.75.75 0 01.75-.75zM12 3a.75.75 0 01.75.75v6a.75.75 0 01-1.5 0v-6A.75.75 0 0112 3z" />,
    stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
    save: <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L3.36 15.002a2.25 2.25 0 002.15 2.848h13.984a2.25 2.25 0 002.15-2.848l-1.402-9.664a2.25 2.25 0 00-2.15-1.588H15M9 3.75v3.75m6 0V3.75m0 0a2.25 2.25 0 012.25 2.25v1.518c0 .937-.29 1.823-.815 2.541l-3.35 4.31a2.25 2.25 0 01-3.67 0L8.065 13.06c-.525-.718-.815-1.604-.815-2.541V6a2.25 2.25 0 012.25-2.25h3.375z" />,
    sparkles: <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.5 13.5h.008v.008h-.008v-.008z" />,
    empty: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
    location: <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />,
    close: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
    search: <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />,
    add: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />,
  };

  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      {icons[name] || <circle cx="12" cy="12" r="10" />}
    </svg>
  );
};