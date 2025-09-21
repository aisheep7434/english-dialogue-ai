'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Volume2, Loader2, AlertCircle } from 'lucide-react';
import PlayerControls from '@/components/PlayerControls';
import VoiceSelectionPanel from '@/components/VoiceSelectionPanel';
import DialogueLineComponent from '@/components/DialogueLineComponent';
import { Dialogue, PlayerState, VoiceConfig, DialogueLine } from '@/types';
import { STORAGE_KEYS, API_ENDPOINTS, VOICE_OPTIONS, DEFAULT_VOICE_CONFIG, utils } from '@/lib/constants';

interface DialoguePageProps {
  params: { id: string };
}

export default function DialoguePage({ params }: DialoguePageProps) {
  const router = useRouter();
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 播放器状态
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentLineId: null,
    rate: 1.0,
    progress: 0,
  });

  // 音色配置
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(DEFAULT_VOICE_CONFIG);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // 播放控制
  const playIntervalRef = useRef<NodeJS.Timeout>();
  const currentAudioRef = useRef<HTMLAudioElement>();

  useEffect(() => {
    loadDialogue();
    loadVoiceConfig();
  }, [params.id]);

  useEffect(() => {
    if (dialogue) {
      loadAudioForAllLines();
    }
  }, [dialogue, voiceConfig]);

  const loadDialogue = () => {
    const savedDialogues = utils.getFromStorage<Dialogue[]>(STORAGE_KEYS.DIALOGUES, []);
    const foundDialogue = savedDialogues.find(d => d.id === params.id);
    
    if (foundDialogue) {
      setDialogue(foundDialogue);
    } else {
      setError('对话不存在');
    }
    setLoading(false);
  };

  const loadVoiceConfig = () => {
    const savedConfig = utils.getFromStorage<VoiceConfig>(STORAGE_KEYS.VOICE_CONFIG, DEFAULT_VOICE_CONFIG);
    setVoiceConfig(savedConfig);
  };

  const loadAudioForAllLines = async () => {
    if (!dialogue) return;
    
    const apiKey = utils.getFromStorage(STORAGE_KEYS.API_KEY, '');
    if (!apiKey) return;

    setIsLoadingAudio(true);

    try {
      const updatedLines = await Promise.all(
        dialogue.lines.map(async (line) => {
          if (line.audioUrl || line.isTitle) return line; // 已有音频或是标题行，跳过

          const voice = line.speaker === 'A' ? voiceConfig.A.id : voiceConfig.B.id;
          
          try {
            const response = await fetch(API_ENDPOINTS.GENERATE_AUDIO, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                text: line.text,
                voice: voice,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              return { ...line, audioUrl: data.url, isLoadingAudio: false };
            } else {
              return { ...line, isLoadingAudio: false };
            }
          } catch (error) {
            console.error('Failed to generate audio for line:', line.id, error);
            return { ...line, isLoadingAudio: false };
          }
        })
      );

      const updatedDialogue = { ...dialogue, lines: updatedLines };
      setDialogue(updatedDialogue);

      // 更新本地存储
      const savedDialogues = utils.getFromStorage<Dialogue[]>(STORAGE_KEYS.DIALOGUES, []);
      const updatedDialogues = savedDialogues.map(d => 
        d.id === params.id ? updatedDialogue : d
      );
      utils.saveToStorage(STORAGE_KEYS.DIALOGUES, updatedDialogues);

    } catch (error) {
      console.error('Failed to load audio:', error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handlePlayAll = async () => {
    if (!dialogue || playerState.isPlaying) return;

    const linesWithAudio = dialogue.lines.filter(line => line.audioUrl && !line.isTitle);
    if (linesWithAudio.length === 0) return;

    setPlayerState(prev => ({ ...prev, isPlaying: true }));

    let currentIndex = 0;
    const playNext = async () => {
      if (currentIndex >= linesWithAudio.length) {
        setPlayerState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          currentLineId: null, 
          progress: 100 
        }));
        return;
      }

      const currentLine = linesWithAudio[currentIndex];
      setPlayerState(prev => ({ 
        ...prev, 
        currentLineId: currentLine.id,
        progress: (currentIndex / linesWithAudio.length) * 100
      }));

      try {
        const audio = new Audio(currentLine.audioUrl);
        audio.playbackRate = playerState.rate;
        currentAudioRef.current = audio;

        audio.onended = () => {
          currentIndex++;
          setTimeout(playNext, 500); // 0.5秒间隔
        };

        audio.onerror = () => {
          currentIndex++;
          setTimeout(playNext, 500);
        };

        await audio.play();
      } catch (error) {
        console.error('Failed to play audio:', error);
        currentIndex++;
        setTimeout(playNext, 500);
      }
    };

    playNext();
  };

  const handlePause = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
    setPlayerState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentLineId: null 
    }));
  };

  const handleRateChange = (rate: number) => {
    setPlayerState(prev => ({ ...prev, rate }));
    if (currentAudioRef.current) {
      currentAudioRef.current.playbackRate = rate;
    }
  };

  const handlePlaySingle = (lineId: string) => {
    // 单句播放不影响全局播放状态
  };

  const handleApplyVoices = (newVoices: VoiceConfig) => {
    setVoiceConfig(newVoices);
    utils.saveToStorage(STORAGE_KEYS.VOICE_CONFIG, newVoices);
    
    // 清除所有音频URL，触发重新生成
    if (dialogue) {
      const updatedLines = dialogue.lines.map(line => ({
        ...line,
        audioUrl: line.isTitle ? undefined : undefined, // 标题行不需要音频
        isLoadingAudio: false,
      }));
      setDialogue({ ...dialogue, lines: updatedLines });
    }
  };

  const isAllAudioLoaded = dialogue?.lines.filter(line => !line.isTitle).every(line => line.audioUrl) ?? false;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !dialogue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-lg font-medium text-text-primary mb-2">
            {error || '对话不存在'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg lg:text-xl font-semibold text-text-primary truncate">
                {dialogue.title}
              </h1>
              <p className="text-xs lg:text-sm text-text-secondary truncate">
                使用单词: {dialogue.wordsUsed.join(', ')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPanelOpen(true)}
            className="btn-secondary flex items-center gap-2 flex-shrink-0 px-2 lg:px-4 py-2"
          >
            <Volume2 size={16} />
            <span className="hidden sm:inline">音色设置</span>
          </button>
        </div>
      </header>

      {/* 播放控制器 */}
      <PlayerControls
        onPlayAll={handlePlayAll}
        onPause={handlePause}
        isPlaying={playerState.isPlaying}
        playbackRate={playerState.rate}
        onRateChange={handleRateChange}
        progress={playerState.progress}
        isDisabled={!isAllAudioLoaded || isLoadingAudio}
      />

      {/* 对话内容 */}
      <main className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          {isLoadingAudio && (
            <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <Loader2 size={20} className="animate-spin text-blue-600" />
              <span className="text-blue-800 text-sm lg:text-base">正在生成音频，请稍候...</span>
            </div>
          )}

          <div className="space-y-4">
            {dialogue.lines.map((line) => (
              <DialogueLineComponent
                key={line.id}
                line={line}
                isHighlighted={playerState.currentLineId === line.id}
                onPlaySingle={handlePlaySingle}
                playbackRate={playerState.rate}
              />
            ))}
          </div>

          {dialogue.lines.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle size={48} className="mx-auto text-text-secondary mb-4" />
              <p className="text-text-secondary">此对话暂无内容</p>
            </div>
          )}
        </div>
      </main>

      {/* 音色选择面板 */}
      {isPanelOpen && (
        <VoiceSelectionPanel
          currentVoices={voiceConfig}
          voiceOptions={VOICE_OPTIONS}
          onApply={handleApplyVoices}
          onClose={() => setIsPanelOpen(false)}
        />
      )}
    </div>
  );
}