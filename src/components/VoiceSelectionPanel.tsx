'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { VoiceOption, VoiceConfig } from '@/types';

interface VoiceSelectionPanelProps {
  currentVoices: VoiceConfig;
  voiceOptions: VoiceOption[];
  onApply: (newVoices: VoiceConfig) => void;
  onClose: () => void;
}

export default function VoiceSelectionPanel({
  currentVoices,
  voiceOptions,
  onApply,
  onClose,
}: VoiceSelectionPanelProps) {
  const [activeSpeaker, setActiveSpeaker] = useState<'A' | 'B'>('A');
  const [selectedVoices, setSelectedVoices] = useState<VoiceConfig>(currentVoices);

  const hasChanges = JSON.stringify(currentVoices) !== JSON.stringify(selectedVoices);

  const handleSpeakerTabClick = (speaker: 'A' | 'B') => {
    setActiveSpeaker(speaker);
  };

  const handleVoiceOptionClick = (voice: VoiceOption) => {
    setSelectedVoices(prev => ({
      ...prev,
      [activeSpeaker]: voice,
    }));
  };

  const handleApplyClick = () => {
    onApply(selectedVoices);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">选择音色</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Speaker Tabs */}
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSpeakerTabClick('A')}
              className={`p-2 lg:p-3 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                activeSpeaker === 'A'
                  ? 'bg-primary text-white'
                  : 'bg-background-alt text-text-primary hover:bg-gray-200'
              }`}
            >
              <span className="truncate">A: {selectedVoices.A.name}</span>
            </button>
            <button
              onClick={() => handleSpeakerTabClick('B')}
              className={`p-2 lg:p-3 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                activeSpeaker === 'B'
                  ? 'bg-primary text-white'
                  : 'bg-background-alt text-text-primary hover:bg-gray-200'
              }`}
            >
              <span className="truncate">B: {selectedVoices.B.name}</span>
            </button>
          </div>
        </div>

        {/* Voice Options List */}
        <div className="max-h-80 overflow-y-auto">
          {voiceOptions.map((voice) => {
            const isSelected = selectedVoices[activeSpeaker].id === voice.id;
            
            return (
              <button
                key={voice.id}
                onClick={() => handleVoiceOptionClick(voice)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                  isSelected ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-text-primary text-sm lg:text-base">{voice.name}</div>
                    <div className="text-xs lg:text-sm text-text-secondary">
                      {voice.gender === 'male' ? '男声' : '女声'}
                    </div>
                  </div>
                  {isSelected && (
                    <Check size={18} className="text-primary flex-shrink-0 lg:w-5 lg:h-5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            onClick={handleApplyClick}
            disabled={!hasChanges}
            className="btn-primary"
          >
            应用音色
          </button>
        </div>
      </div>
    </div>
  );
}