import React, { useState, useCallback, useEffect } from 'react';
import { searchPlaces } from '../services/geminiService';
import { Icon } from './Icon';

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
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);

  useEffect(() => {
    // Reset component state when it's closed from the parent
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setIsSearching(false);
      setError(null);
      setSearchedQuery(null);
    }
  }, [isOpen]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearchedQuery(query.trim());
    setIsSearching(true);
    setError(null);
    setResults([]);
    try {
      const places = await searchPlaces(query);
      if (places.length === 0) {
        setError('검색 결과가 없습니다. 직접 추가하거나 다른 키워드로 시도해보세요.');
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
            className="flex-grow bg-slate-100 text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-colors"
            aria-label="장소 검색"
          />
          <button onClick={handleSearch} disabled={isSearching || !query.trim()} className="flex-shrink-0 bg-rose-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-600 disabled:bg-rose-300 transition-colors">
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
            {searchedQuery && !isSearching && (
              <li
                key="custom-add"
                onClick={() => handleSelect(searchedQuery)}
                className="p-3 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors border border-dashed border-slate-300"
              >
                <p className="font-semibold text-slate-700 flex items-center">
                  <Icon name="add" className="w-5 h-5 mr-2 text-rose-500" />
                  <span>'{searchedQuery}'(으)로 장소 추가</span>
                </p>
              </li>
            )}
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