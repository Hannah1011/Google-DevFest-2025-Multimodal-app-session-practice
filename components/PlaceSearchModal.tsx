import React, { useState, useCallback } from 'react';
import { searchPlaces } from '../services/geminiService';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

interface PlaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlace: (placeName: string) => void;
}

interface PlaceResult {
  name: string;
  details: string;
}

export const PlaceSearchModal: React.FC<PlaceSearchModalProps> = ({ isOpen, onClose, onSelectPlace }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    setResults([]);
    try {
      const places = await searchPlaces(query);
      if (places.length === 0) {
        setError('검색 결과가 없습니다. 다른 키워드로 시도해보세요.');
      } else {
        setResults(places);
      }
    } catch (e) {
      console.error(e);
      setError('장소 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const handleSelect = (placeName: string) => {
    onSelectPlace(placeName);
    // Reset state for next time
    setQuery('');
    setResults([]);
    setError(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold font-kor">장소 검색</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <Icon name="close" className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="예: 서울역 스타벅스"
            className="flex-grow border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none"
            aria-label="장소 검색"
          />
          <button onClick={handleSearch} disabled={isSearching || !query.trim()} className="bg-slate-800 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-700 disabled:bg-slate-400 transition-colors">
            <Icon name="search" className="w-5 h-5" />
          </button>
        </div>

        <div className="min-h-[250px] max-h-[60vh] overflow-y-auto">
          {isSearching && (
            <div className="flex justify-center items-center h-full pt-10">
                <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {error && <p className="text-center text-red-500 mt-8">{error}</p>}
          <ul className="space-y-2">
            {results.map((place) => (
              <li key={place.name + place.details} onClick={() => handleSelect(place.name)} className="p-3 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors">
                <p className="font-semibold text-slate-800">{place.name}</p>
                <p className="text-sm text-slate-500 truncate">{place.details}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};