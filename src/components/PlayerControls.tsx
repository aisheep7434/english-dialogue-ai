'use client';

import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { PLAYBACK_RATES } from '@/lib/constants';

interface PlayerControlsProps {
  onPlayAll: () => void;
  onPause: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  isPlaying: boolean;
  playbackRate: number;
  onRateChange: (rate: number) => void;
  progress: number; // 0-100
  isDisabled?: boolean;
}

export default function PlayerControls({
  onPlayAll,
  onPause,
  onPrevious,
  onNext,
  isPlaying,
  playbackRate,
  onRateChange,
  progress,
  isDisabled = false,
}: PlayerControlsProps) {
  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlayAll();
    }
  };

  return (
    <div className="p-3 lg:p-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-3 lg:gap-4">
        {/* 控制按钮组 */}
        <div className="flex items-center gap-1 lg:gap-2">
          {onPrevious && (
            <button
              onClick={onPrevious}
              disabled={isDisabled}
              className="p-1.5 lg:p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="上一句"
            >
              <SkipBack size={18} className="lg:w-5 lg:h-5" />
            </button>
          )}
          
          <button
            onClick={handlePlayPause}
            disabled={isDisabled}
            className="p-2 lg:p-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            title={isPlaying ? '暂停' : '播放全部'}
          >
            {isPlaying ? <Pause size={20} className="lg:w-6 lg:h-6" /> : <Play size={20} className="lg:w-6 lg:h-6" />}
          </button>

          {onNext && (
            <button
              onClick={onNext}
              disabled={isDisabled}
              className="p-1.5 lg:p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="下一句"
            >
              <SkipForward size={18} className="lg:w-5 lg:h-5" />
            </button>
          )}
        </div>

        {/* 进度条 */}
        <div className="flex-1 mx-2 lg:mx-4">
          <div className="w-full bg-gray-200 rounded-full h-1.5 lg:h-2">
            <div
              className="bg-primary h-1.5 lg:h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 语速控制 */}
        <div className="flex items-center gap-1 lg:gap-2">
          <span className="text-xs lg:text-sm text-text-secondary whitespace-nowrap hidden sm:inline">语速:</span>
          <select
            value={playbackRate}
            onChange={(e) => onRateChange(Number(e.target.value))}
            disabled={isDisabled}
            className="px-1.5 lg:px-2 py-1 border border-border rounded text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {PLAYBACK_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate}x
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}