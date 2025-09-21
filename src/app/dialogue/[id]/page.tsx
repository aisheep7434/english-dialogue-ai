'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Volume2, Loader2, AlertCircle, Settings, Play, Pause, RotateCcw, Trash2 } from 'lucide-react';
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
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [hasGeneratedAudio, setHasGeneratedAudio] = useState(false);

  // 播放控制
  const playIntervalRef = useRef<NodeJS.Timeout>();
  const currentAudioRef = useRef<HTMLAudioElement>();

  useEffect(() => {
    loadDialogue();
    loadVoiceConfig();
  }, [params.id]);

  useEffect(() => {
    if (dialogue) {
      checkIfAudioExists();
    }
  }, [dialogue]);

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

  const checkIfAudioExists = () => {
    if (!dialogue) return;
    
    const hasAudio = dialogue.lines.some(line => !line.isTitle && line.audioUrl);
    setHasGeneratedAudio(hasAudio);
  };

  const loadAudioForAllLines = async (forceRegenerate = false, customVoiceConfig?: VoiceConfig) => {
    if (!dialogue) return;
    
    const apiKey = utils.getFromStorage(STORAGE_KEYS.API_KEY, '');
    if (!apiKey) {
      console.error('API Key is missing');
      return;
    }

    // 使用自定义的音色配置或当前的音色配置
    const currentVoiceConfig = customVoiceConfig || voiceConfig;

    setIsLoadingAudio(true);

    try {
      const linesToProcess = dialogue.lines.filter(line => {
        if (line.isTitle) return false;
        if (!forceRegenerate && line.audioUrl) return false;
        return true;
      });

      console.log(`Starting audio generation for ${linesToProcess.length} lines`);

      // 限制并发数量，每次最多处理2个请求
      const batchSize = 2;
      const updatedLinesMap = new Map<string, DialogueLine>();
      
      // 首先保留不需要处理的行
      dialogue.lines.forEach(line => {
        if (line.isTitle || (!forceRegenerate && line.audioUrl)) {
          updatedLinesMap.set(line.id, line);
        }
      });

      for (let i = 0; i < linesToProcess.length; i += batchSize) {
        const batch = linesToProcess.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(linesToProcess.length / batchSize)}`);
        
        const batchResults = await Promise.all(
          batch.map(async (line) => {
            const voice = line.speaker === 'A' ? currentVoiceConfig.A.id : currentVoiceConfig.B.id;
            
            console.log(`Generating audio for line ${line.id}: "${line.text}" with voice ${voice}`);
            
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
                console.log(`Successfully generated audio for line ${line.id}`);
                return { ...line, audioUrl: data.url, isLoadingAudio: false };
              } else {
                const errorText = await response.text();
                console.error('Failed to generate audio for line:', line.id, response.status, errorText);
                return { ...line, isLoadingAudio: false };
              }
            } catch (error) {
              console.error('Failed to generate audio for line:', line.id, error);
              return { ...line, isLoadingAudio: false };
            }
          })
        );

        // 更新结果
        batchResults.forEach(line => {
          updatedLinesMap.set(line.id, line);
        });

        // 在批次之间添加延迟以避免配额限制
        if (i + batchSize < linesToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒延迟
        }
      }

      // 按原始顺序重建lines数组
      const updatedLines = dialogue.lines.map(line => updatedLinesMap.get(line.id) || line);
      const updatedDialogue = { ...dialogue, lines: updatedLines };
      setDialogue(updatedDialogue);

      // 更新本地存储
      const savedDialogues = utils.getFromStorage<Dialogue[]>(STORAGE_KEYS.DIALOGUES, []);
      const updatedDialogues = savedDialogues.map(d => 
        d.id === params.id ? updatedDialogue : d
      );
      utils.saveToStorage(STORAGE_KEYS.DIALOGUES, updatedDialogues);

      // 检查是否所有音频都生成成功
      const audioGeneratedCount = updatedLines.filter(line => !line.isTitle && line.audioUrl).length;
      const totalLinesCount = updatedLines.filter(line => !line.isTitle).length;
      console.log(`Audio generation completed: ${audioGeneratedCount}/${totalLinesCount} lines`);

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

  const handleDeleteCurrentDialogue = () => {
    if (!dialogue) return;
    
    const confirmed = confirm(`确定要删除对话「${dialogue.title}」吗？此操作不可恢复。`);
    
    if (confirmed) {
      // 从本地存储中删除对话
      const savedDialogues = utils.getFromStorage<Dialogue[]>(STORAGE_KEYS.DIALOGUES, []);
      const updatedDialogues = savedDialogues.filter(d => d.id !== params.id);
      utils.saveToStorage(STORAGE_KEYS.DIALOGUES, updatedDialogues);
      
      // 返回主页
      router.push('/');
    }
  };

  const handleGenerateAudio = async () => {
    if (!dialogue) return;
    
    // 保存当前音色配置
    utils.saveToStorage(STORAGE_KEYS.VOICE_CONFIG, voiceConfig);
    
    console.log('Starting audio generation for all lines...');
    console.log('Voice config:', {
      A: voiceConfig.A.name + ' (' + voiceConfig.A.id + ')',
      B: voiceConfig.B.name + ' (' + voiceConfig.B.id + ')'
    });
    
    // 清除所有音频URL，强制重新生成
    const updatedLines = dialogue.lines.map(line => ({
      ...line,
      audioUrl: undefined, // 清除所有音频URL
      isLoadingAudio: false,
    }));
    
    const updatedDialogue = { ...dialogue, lines: updatedLines };
    setDialogue(updatedDialogue);
    
    // 强制重新生成所有音频，传入当前的音色配置
    await loadAudioForAllLines(true, voiceConfig);
    setHasGeneratedAudio(true);
    
    // 关闭音色面板
    setIsVoicePanelOpen(false);
  };

  const isAllAudioLoaded = dialogue?.lines.filter(line => !line.isTitle).every(line => line.audioUrl) ?? false;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !dialogue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {error || '对话不存在'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 主界面：对话音频页面 */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isVoicePanelOpen ? 'mr-80' : ''
      }`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  {dialogue.title}
                </h1>
                <p className="text-sm text-gray-500 truncate">
                  使用单词: {dialogue.wordsUsed.join(', ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsVoicePanelOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                <Volume2 size={16} />
                <span>音色选择</span>
              </button>
              
              <button
                onClick={handleDeleteCurrentDialogue}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex-shrink-0"
                title="删除当前对话"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">删除</span>
              </button>
            </div>
          </div>
        </header>

        {/* 播放控制栏 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 一键播放按钮 */}
              <button
                onClick={playerState.isPlaying ? handlePause : handlePlayAll}
                disabled={!isAllAudioLoaded || isLoadingAudio}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
              >
                {playerState.isPlaying ? (
                  <>
                    <Pause size={20} />
                    <span>暂停播放</span>
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    <span>一键播放</span>
                  </>
                )}
              </button>
              
              {/* 播放速度控制 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">播放速度:</span>
                <select
                  value={playerState.rate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                  className="px-3 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1.0}>1.0x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2.0}>2.0x</option>
                </select>
              </div>
            </div>
            
            {/* 播放进度 */}
            {playerState.isPlaying && (
              <div className="flex-1 mx-6">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${playerState.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 对话内容 */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* 音频生成提示 */}
            {!hasGeneratedAudio && !isLoadingAudio && (
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Volume2 size={32} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-900 mb-2">生成个性化语音</h3>
                  <p className="text-blue-700 mb-6">
                    点击右上角"音色选择"按钮，为每个角色选择专属音色，然后生成高质量语音对话。
                  </p>
                  <div className="flex justify-center gap-2 text-sm">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">多种英语音色</span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">男声女声可选</span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">即时生成</span>
                  </div>
                </div>
              </div>
            )}

            {/* 音频生成中 */}
            {isLoadingAudio && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">正在生成个性化语音...</p>
                  <p className="text-sm text-blue-600">请稍候，我们正在为您合成高质量音频</p>
                </div>
              </div>
            )}

            {/* 对话分段列表 */}
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
              <div className="text-center py-16">
                <AlertCircle size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-xl font-medium text-gray-500 mb-2">此对话暂无内容</p>
                <p className="text-gray-400">请返回主页重新生成对话</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 右侧音色设置面板 */}
      {isVoicePanelOpen && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsVoicePanelOpen(false)}
          />
          
          {/* 音色设置面板 */}
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col">
            {/* 面板头部 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">音色设置</h2>
                  <p className="text-sm text-gray-500 mt-1">为每个角色选择专属音色</p>
                </div>
                <button
                  onClick={() => setIsVoicePanelOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* 音色配置区 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* 角色 A 音色配置 */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-blue-600">A</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">角色 A 音色</h3>
                      <p className="text-xs text-gray-500">选择第一个说话者的声音</p>
                    </div>
                  </div>
                  <select 
                    value={voiceConfig.A.id}
                    onChange={(e) => {
                      const selectedVoice = VOICE_OPTIONS.find(v => v.id === e.target.value);
                      if (selectedVoice) {
                        setVoiceConfig(prev => ({ ...prev, A: selectedVoice }));
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {VOICE_OPTIONS.map(voice => (
                      <option key={voice.id} value={voice.id}>{voice.name}</option>
                    ))}
                  </select>
                </div>

                {/* 角色 B 音色配置 */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-purple-600">B</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">角色 B 音色</h3>
                      <p className="text-xs text-gray-500">选择第二个说话者的声音</p>
                    </div>
                  </div>
                  <select 
                    value={voiceConfig.B.id}
                    onChange={(e) => {
                      const selectedVoice = VOICE_OPTIONS.find(v => v.id === e.target.value);
                      if (selectedVoice) {
                        setVoiceConfig(prev => ({ ...prev, B: selectedVoice }));
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {VOICE_OPTIONS.map(voice => (
                      <option key={voice.id} value={voice.id}>{voice.name}</option>
                    ))}
                  </select>
                </div>

                {/* 音色预览 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">当前选择预览</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">角色 A:</span>
                      <span className="font-medium text-blue-600">{voiceConfig.A.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">角色 B:</span>
                      <span className="font-medium text-purple-600">{voiceConfig.B.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 面板底部 - 生成语音按钮 */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handleGenerateAudio}
                disabled={isLoadingAudio}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-lg"
              >
                {isLoadingAudio ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={20} />
                    <span>生成语音</span>
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-3">
                根据配置重新合成整个对话的音频
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}