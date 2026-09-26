import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoiceNotePlayerProps {
  audioUrl: string;
  durationSec?: number;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ audioUrl, durationSec = 3 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationSec);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(Math.round(audio.currentTime));
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
    }
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5 bg-[#0a2f1e] border-2 border-black rounded-lg p-2 max-w-[240px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-[#FFB443] border-2 border-black flex items-center justify-center text-black shrink-0 active:scale-95 transition-transform"
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-[11px] font-bold text-[#FFD43F] mb-1">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-[#2BD97F]" />
            Voice Note
          </span>
          <span>{isPlaying ? `${currentTime}s` : `${totalDuration}s`}</span>
        </div>
        <div className="w-full bg-[#051a10] border border-black h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-[#2BD97F] h-full transition-all duration-150"
            style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
