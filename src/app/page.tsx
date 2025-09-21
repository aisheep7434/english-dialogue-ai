'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Loader2, AlertCircle, Volume2, Play, Pause, Settings, ArrowRight } from 'lucide-react';
import ApiKeyManager from '@/components/ApiKeyManager';
import DialogueHistoryItem from '@/components/DialogueHistoryItem';
import DialogueLineComponent from '@/components/DialogueLineComponent';
import { Dialogue, VoiceConfig, PlayerState } from '@/types';
import { STORAGE_KEYS, API_ENDPOINTS, VOICE_OPTIONS, DEFAULT_VOICE_CONFIG, utils } from '@/lib/constants';

export default function HomePage() {
  const router = useRouter();
  const [words, setWords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [error, setError] = useState('');
  
  // 新增：当前显示的对话内容
  const [currentDialogues, setCurrentDialogues] = useState<Dialogue[]>([]);
  const [showGenerated, setShowGenerated] = useState(false);
  
  // 音色和播放器状态
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>(DEFAULT_VOICE_CONFIG);
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentLineId: null,
    rate: 1.0,
    progress: 0,
  });
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [hasGeneratedAudio, setHasGeneratedAudio] = useState(false);

  useEffect(() => {
    // 检查API Key
    const apiKey = utils.getFromStorage(STORAGE_KEYS.API_KEY, '');
    setHasApiKey(Boolean(apiKey));

    // 加载对话历史
    const savedDialogues = utils.getFromStorage<Dialogue[]>(STORAGE_KEYS.DIALOGUES, []);
    setDialogues(savedDialogues);
    
    // 加载音色配置
    const savedVoiceConfig = utils.getFromStorage<VoiceConfig>(STORAGE_KEYS.VOICE_CONFIG, DEFAULT_VOICE_CONFIG);
    setVoiceConfig(savedVoiceConfig);
  }, []);

  const handleGenerate = async () => {
    setError('');
    
    // 验证API Key
    if (!hasApiKey) {
      setError('请先在右上角设定您的 API Key');
      return;
    }

    // 处理输入的单词
    const processedWords = utils.processWords(words);
    if (processedWords.length < 2) {
      setError('请至少输入两个有效的单字');
      return;
    }

    setIsLoading(true);
    setShowGenerated(false);
    setCurrentDialogues([]);

    try {
      const apiKey = utils.getFromStorage(STORAGE_KEYS.API_KEY, '');
      
      const response = await fetch(API_ENDPOINTS.GENERATE_DIALOGUE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          words: processedWords,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成失败');
      }

      const newDialogues = data.dialogues || (data.dialogue ? [data.dialogue] : []);
      
      if (newDialogues.length === 0) {
        throw new Error('生成的对话为空');
      }
      
      // 保存所有对话到本地存储
      const updatedDialogues = [...newDialogues, ...dialogues];
      setDialogues(updatedDialogues);
      utils.saveToStorage(STORAGE_KEYS.DIALOGUES, updatedDialogues);

      // 在当前页面显示生成的对话
      setCurrentDialogues(newDialogues);
      setShowGenerated(true);
      setHasGeneratedAudio(false);
      
    } catch (error: any) {
      console.error('Generate dialogue error:', error);
      setError(error.message || '对话生成失败，请检查您的 API Key 或网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  // 生成语音功能
  const handleGenerateAudio = async () => {
    if (currentDialogues.length === 0) return;
    
    // 保存当前音色配置
    utils.saveToStorage(STORAGE_KEYS.VOICE_CONFIG, voiceConfig);
    setIsLoadingAudio(true);
    
    try {
      const apiKey = utils.getFromStorage(STORAGE_KEYS.API_KEY, '');
      const updatedDialogues = [...currentDialogues];
      
      // 为每个对话生成音频
      for (let dialogueIndex = 0; dialogueIndex < updatedDialogues.length; dialogueIndex++) {
        const dialogue = updatedDialogues[dialogueIndex];
        const linesToProcess = dialogue.lines.filter(line => !line.isTitle);
        
        // 限制并发数量，每次最多处理2个请求
        const batchSize = 2;
        
        for (let i = 0; i < linesToProcess.length; i += batchSize) {
          const batch = linesToProcess.slice(i, i + batchSize);
          
          const batchResults = await Promise.all(
            batch.map(async (line) => {
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

          // 更新对话中的对应行
          batchResults.forEach(updatedLine => {
            const lineIndex = dialogue.lines.findIndex(l => l.id === updatedLine.id);
            if (lineIndex !== -1) {
              dialogue.lines[lineIndex] = updatedLine;
            }
          });

          // 在批次之间添加延迟以避免配额限制
          if (i + batchSize < linesToProcess.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      setCurrentDialogues(updatedDialogues);
      
      // 更新本地存储中的对话
      const allDialogues = utils.getFromStorage<Dialogue[]>(STORAGE_KEYS.DIALOGUES, []);
      const updatedAllDialogues = allDialogues.map(d => {
        const updated = updatedDialogues.find(ud => ud.id === d.id);
        return updated || d;
      });
      utils.saveToStorage(STORAGE_KEYS.DIALOGUES, updatedAllDialogues);
      setDialogues(updatedAllDialogues);
      
      setHasGeneratedAudio(true);
      setIsVoicePanelOpen(false);
      
    } catch (error) {
      console.error('Failed to generate audio:', error);
    } finally {
      setIsLoadingAudio(false);
    }
  };
  
  // 返回输入界面
  const handleBackToInput = () => {
    setShowGenerated(false);
    setCurrentDialogues([]);
    setWords('');
    setError('');
    setHasGeneratedAudio(false);
  };
  
  // 跳转到对话详情页
  const handleViewDialogue = (dialogueId: string) => {
    router.push(`/dialogue/${dialogueId}`);
  };

  const handleRename = (id: string, newTitle: string) => {
    const updatedDialogues = dialogues.map(d => 
      d.id === id ? { ...d, title: newTitle } : d
    );
    setDialogues(updatedDialogues);
    utils.saveToStorage(STORAGE_KEYS.DIALOGUES, updatedDialogues);
  };

  const handleClearAllDialogues = () => {
    if (dialogues.length === 0) return;
    
    const confirmed = confirm(`确定要清空所有对话历史吗？共有 ${dialogues.length} 条记录，此操作不可恢复。`);
    
    if (confirmed) {
      setDialogues([]);
      utils.saveToStorage(STORAGE_KEYS.DIALOGUES, []);
    }
  };

  const handleDelete = (id: string) => {
    const updatedDialogues = dialogues.filter(d => d.id !== id);
    setDialogues(updatedDialogues);
    utils.saveToStorage(STORAGE_KEYS.DIALOGUES, updatedDialogues);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 左侧：对话记录 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <h1 className="font-bold text-lg text-gray-900">AI 对话生成</h1>
              <p className="text-sm text-gray-500">语音合成应用</p>
            </div>
            {/* 清空所有按钮 */}
            {dialogues.length > 0 && (
              <button
                onClick={handleClearAllDialogues}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title={`清空所有对话 (${dialogues.length})`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 对话历史列表 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
              对话记录
            </h2>
            
            {dialogues.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">暂无对话记录</p>
                <p className="text-xs mt-1">生成第一个对话开始体验吧！</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dialogues.map((dialogue) => (
                  <div
                    key={dialogue.id}
                    className="group p-4 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-100 hover:border-blue-200 cursor-pointer transition-all duration-200 relative"
                  >
                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('确定要删除这个对话吗？')) {
                          handleDelete(dialogue.id);
                        }
                      }}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="删除对话"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    
                    {/* 对话内容 */}
                    <div onClick={() => router.push(`/dialogue/${dialogue.id}`)}>
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-900 mb-2 line-clamp-2 pr-8">
                        {dialogue.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="bg-white px-2 py-1 rounded border">
                          {dialogue.lines.filter(l => !l.isTitle).length} 句对话
                        </span>
                        <span>
                          {new Date(dialogue.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {dialogue.wordsUsed.slice(0, 3).map((word, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {word}
                          </span>
                        ))}
                        {dialogue.wordsUsed.length > 3 && (
                          <span className="text-xs text-gray-400">+{dialogue.wordsUsed.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧：主工作区 */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">创建英语对话</h1>
            <p className="text-gray-600">输入文本内容，生成多角色对话并配置个性化音色</p>
          </div>
          
          {/* 设置图标 */}
          <div className="flex items-center gap-3">
            <ApiKeyManager onApiKeyChange={setHasApiKey} />
          </div>
        </header>

        {/* 主内容区 */}
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="w-full max-w-2xl">
            {/* 如果没有显示生成的内容，显示输入界面 */}
            {!showGenerated ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                {/* 图标和标题 */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={32} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    开始创建您的英语对话
                  </h2>
                  <p className="text-gray-600">
                    请输入单词，我来帮你合成对话内容
                  </p>
                </div>

                {/* 输入区域 */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      内容输入框
                    </label>
                    <textarea
                      value={words}
                      onChange={(e) => setWords(e.target.value)}
                      placeholder="请输入单词，我来帮你合成对话内容\n\n例如: coffee, meeting, schedule, weekend, presentation, deadline"
                      className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      💡 输入更多单词可生成更丰富的对话内容
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                      <AlertCircle size={20} />
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  )}

                  {/* 生成按钮 */}
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading || !words.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={24} className="animate-spin" />
                        <span className="text-lg">生成中...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare size={24} />
                        <span className="text-lg">生成</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 功能说明 */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4 text-center">核心功能</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 font-bold text-xs">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">文本到对话生成</p>
                        <p className="text-gray-600 text-xs mt-1">智能生成多角色对话内容</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-600 font-bold text-xs">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">分角色音频播放</p>
                        <p className="text-gray-600 text-xs mt-1">支持分段或连续播放</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 font-bold text-xs">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">独立音色分配</p>
                        <p className="text-gray-600 text-xs mt-1">为每个角色配置不同音色</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-orange-600 font-bold text-xs">4</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">即时重新合成</p>
                        <p className="text-gray-600 text-xs mt-1">一键重新生成音频</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* 显示生成的对话内容 */
              <div className="space-y-6">
                {/* 顶部控制栏 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBackToInput}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ArrowRight size={16} className="rotate-180" />
                        <span>返回输入</span>
                      </button>
                      <div className="text-sm text-gray-500">
                        生成了 {currentDialogues.length} 个对话主题
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsVoicePanelOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Volume2 size={16} />
                        <span>音色选择</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* 音频生成提示 */}
                  {!hasGeneratedAudio && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Volume2 size={20} className="text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">点击右上角"音色选择"来生成个性化语音</p>
                          <p className="text-sm text-blue-600">为角色A和B选择不同的音色，然后生成高质量语音对话</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 音频生成中 */}
                  {isLoadingAudio && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                      <Loader2 size={20} className="animate-spin text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800">正在生成个性化语音...</p>
                        <p className="text-sm text-blue-600">请稍候，我们正在为您合成高质量音频</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 对话内容显示 */}
                <div className="space-y-6">
                  {currentDialogues.map((dialogue, index) => (
                    <div key={dialogue.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      {/* 对话标题和元信息 */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{dialogue.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>使用单词: {dialogue.wordsUsed.join(', ')}</span>
                            <span>{dialogue.lines.filter(l => !l.isTitle).length} 句对话</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewDialogue(dialogue.id)}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <span>详细页面</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>

                      {/* 对话内容 */}
                      <div className="space-y-3">
                        {dialogue.lines.map((line) => (
                          <DialogueLineComponent
                            key={line.id}
                            line={line}
                            isHighlighted={false}
                            onPlaySingle={() => {}}
                            playbackRate={1.0}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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
                  <ArrowRight size={20} className="text-gray-600" />
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
                disabled={isLoadingAudio || currentDialogues.length === 0}
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