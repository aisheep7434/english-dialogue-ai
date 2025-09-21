'use client';

import { useState } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { DialogueLine } from '@/types';

interface DialogueLineComponentProps {
  line: DialogueLine;
  isHighlighted: boolean;
  onPlaySingle: (lineId: string) => void;
  playbackRate: number;
}

export default function DialogueLineComponent({
  line,
  isHighlighted,
  onPlaySingle,
  playbackRate,
}: DialogueLineComponentProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = async () => {
    if (!line.audioUrl || line.isLoadingAudio) return;
    
    setIsPlaying(true);
    onPlaySingle(line.id);
    
    // 播放音频
    try {
      const audio = new Audio(line.audioUrl);
      audio.playbackRate = playbackRate;
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsPlaying(false);
    }
  };

  const speakerColor = line.speaker === 'A' ? 'text-blue-600' : 'text-green-600';
  const speakerBg = line.speaker === 'A' ? 'bg-blue-50' : 'bg-green-50';

  return (
    <div
      className={`p-3 lg:p-4 rounded-lg border transition-all duration-300 ${
        isHighlighted
          ? 'bg-highlight border-yellow-300 shadow-md'
          : 'bg-white border-border hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-2 lg:gap-3">
        {/* Speaker Badge */}
        <div className={`${speakerBg} ${speakerColor} px-2 py-1 rounded-full text-xs lg:text-sm font-semibold flex-shrink-0`}>
          {line.speaker}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-text-primary leading-relaxed text-sm lg:text-base">{line.text}</p>
        </div>

        {/* Play Button */}
        <button
          onClick={handlePlayClick}
          disabled={!line.audioUrl || line.isLoadingAudio || isPlaying}
          className="flex-shrink-0 p-1.5 lg:p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="播放这一句"
        >
          {line.isLoadingAudio ? (
            <Loader2 size={16} className="lg:w-[18px] lg:h-[18px] animate-spin text-text-secondary" />
          ) : isPlaying ? (
            <Pause size={16} className="lg:w-[18px] lg:h-[18px] text-primary" />
          ) : (
            <Play size={16} className="lg:w-[18px] lg:h-[18px] text-text-secondary" />
          )}
        </button>
      </div>
    </div>
  );
}