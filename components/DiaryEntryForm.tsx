import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import type { LiveServerMessage } from '@google/genai';
import { Icon } from './Icon';
import { PlaceSearchModal } from './PlaceSearchModal';
import { encode } from '../utils/audioUtils';

interface DiaryEntryFormProps {
  onSubmit: (photo: File, transcription: string, placeName?: string) => void;
  isLoading: boolean;
}

export const DiaryEntryForm: React.FC<DiaryEntryFormProps> = ({ onSubmit, isLoading }) => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const cleanupAudio = useCallback(() => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if(mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current.onaudioprocess = null;
        scriptProcessorRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setTranscription('');
      setIsRecording(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Zephyr'}},
          },
        },
        callbacks: {
          onopen: () => {
            console.log('Connection opened');
            
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }
            const audioContext = audioContextRef.current;

            mediaStreamSourceRef.current = audioContext.createMediaStreamSource(stream);
            scriptProcessorRef.current = audioContext.createScriptProcessor(4096, 1, 1);

            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                    int16[i] = inputData[i] * 32768;
                }
                const pcmBlob = {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: 'audio/pcm;rate=16000',
                };
                sessionPromiseRef.current?.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            };

            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContext.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            const text = message.serverContent?.inputTranscription?.text;
            if(text) {
              setTranscription(prev => prev + text);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Connection error', e);
            setIsRecording(false);
            cleanupAudio();
          },
          onclose: (e: CloseEvent) => {
            console.log('Connection closed');
            setIsRecording(false);
            cleanupAudio();
          },
        },
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert("마이크 접근 권한이 필요합니다.");
      setIsRecording(false);
    }
  }, [cleanupAudio]);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
    if (sessionPromiseRef.current) {
      try {
        const session = await sessionPromiseRef.current;
        session.close();
      } catch (e) {
        console.error("Error closing session", e);
      }
      sessionPromiseRef.current = null;
    }
    cleanupAudio();
  }, [cleanupAudio]);

  useEffect(() => {
    return () => {
        if(isRecording) {
            stopRecording();
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    }
  }, [isRecording, stopRecording]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (photo && transcription) {
      onSubmit(photo, transcription, selectedPlace || undefined);
      setPhoto(null);
      setPhotoPreview(null);
      setTranscription('');
      setSelectedPlace(null);
    }
  };

  return (
    <>
      <PlaceSearchModal
        isOpen={isPlaceModalOpen}
        onClose={() => setIsPlaceModalOpen(false)}
        onSelectPlace={(place) => {
          setSelectedPlace(place);
          setIsPlaceModalOpen(false);
        }}
      />
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-4 font-kor">오늘의 순간 기록하기</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-colors">
            <input type="file" id="photo-upload" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
            <label htmlFor="photo-upload" className="cursor-pointer">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
              ) : (
                <div className="flex flex-col items-center text-slate-500">
                  <Icon name="photo" className="w-12 h-12 mb-2" />
                  <span className="font-semibold">사진을 선택하세요</span>
                  <p className="text-sm">클릭 또는 드래그 앤 드롭</p>
                </div>
              )}
            </label>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <label className="font-semibold text-slate-700 font-kor">음성으로 순간 남기기</label>
               <button 
                type="button" 
                onClick={isRecording ? stopRecording : startRecording} 
                className={`p-3 rounded-full transition-colors flex-shrink-0 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-rose-500 hover:bg-rose-600'}`}
                aria-label={isRecording ? '음성 녹음 중지' : '음성 녹음 시작'}
              >
                  <Icon name={isRecording ? 'stop' : 'mic'} className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => setIsPlaceModalOpen(true)} 
                className="flex items-center gap-2 text-sm bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-lg hover:bg-slate-300 transition-colors w-full"
              >
                <Icon name="location" className="w-5 h-5 flex-shrink-0" />
                <span className="truncate text-left flex-grow">
                  {selectedPlace ? selectedPlace : '장소 추가 (선택 사항)'}
                </span>
              </button>
              {selectedPlace && (
                <button 
                  type="button" 
                  onClick={() => setSelectedPlace(null)} 
                  className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors flex-shrink-0"
                  aria-label="선택한 장소 삭제"
                >
                  <Icon name="close" className="w-4 h-4 text-slate-600" />
                </button>
              )}
            </div>
            
            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              disabled={isRecording}
              className="bg-slate-100 rounded-lg p-4 min-h-[120px] w-full text-slate-700 font-kor resize-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 outline-none transition-colors disabled:bg-slate-200 disabled:text-slate-500"
              placeholder={isRecording ? "음성 입력 중..." : "음성 녹음 버튼을 누르거나 직접 입력하세요."}
              rows={4}
              aria-label="일기 내용"
            />
          </div>

          <button type="submit" disabled={!photo || !transcription || isLoading} className="w-full bg-slate-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
              {isLoading ? '저장 중...' : '일기 저장하기'}
              <Icon name="save" className="w-5 h-5 ml-2" />
          </button>
        </form>
      </div>
    </>
  );
};