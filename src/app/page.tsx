'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import ApiKeyManager from '@/components/ApiKeyManager';
import DialogueHistoryItem from '@/components/DialogueHistoryItem';
import { Dialogue } from '@/types';
import { STORAGE_KEYS, API_ENDPOINTS, utils } from '@/lib/constants';

export default function HomePage() {
  const router = useRouter();
  const [words, setWords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // 检查API Key
    const apiKey = utils.getFromStorage(STORAGE_KEYS.API_KEY, '');
    setHasApiKey(Boolean(apiKey));

    // 加载对话历史
    const savedDialogues = utils.getFromStorage<Dialogue[]>(STORAGE_KEYS.DIALOGUES, []);
    setDialogues(savedDialogues);
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

      const newDialogue = data.dialogue;
      
      // 保存对话到本地存储
      const updatedDialogues = [newDialogue, ...dialogues];
      setDialogues(updatedDialogues);
      utils.saveToStorage(STORAGE_KEYS.DIALOGUES, updatedDialogues);

      // 跳转到对话页面
      router.push(`/dialogue/${newDialogue.id}`);
      
    } catch (error: any) {
      console.error('Generate dialogue error:', error);
      setError(error.message || '对话生成失败，请检查您的 API Key 或网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogueClick = (id: string) => {
    router.push(`/dialogue/${id}`);
  };

  const handleRename = (id: string, newTitle: string) => {
    const updatedDialogues = dialogues.map(d => 
      d.id === id ? { ...d, title: newTitle } : d
    );
    setDialogues(updatedDialogues);
    utils.saveToStorage(STORAGE_KEYS.DIALOGUES, updatedDialogues);
  };

  const handleDelete = (id: string) => {
    const updatedDialogues = dialogues.filter(d => d.id !== id);
    setDialogues(updatedDialogues);
    utils.saveToStorage(STORAGE_KEYS.DIALOGUES, updatedDialogues);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* 左侧导航栏 */}
      <div className="w-full lg:w-64 bg-white border-r-0 lg:border-r border-b lg:border-b-0 border-border flex flex-col max-h-48 lg:max-h-none overflow-y-auto lg:overflow-visible">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-primary" size={24} />
            <h1 className="font-semibold text-lg text-text-primary">AI 英语对话</h1>
          </div>
        </div>

        {/* 对话历史 */}
        <div className="flex-1 overflow-y-auto p-4 hidden lg:block">
          <h2 className="font-medium text-text-secondary mb-3 text-sm uppercase tracking-wide">
            对话历史
          </h2>
          
          {dialogues.length === 0 ? (
            <div className="text-center text-text-secondary py-8">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">还没有对话记录</p>
              <p className="text-xs mt-1">生成第一个对话开始学习吧！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dialogues.map((dialogue) => (
                <DialogueHistoryItem
                  key={dialogue.id}
                  dialogue={dialogue}
                  isSelected={false}
                  onClick={handleDialogueClick}
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* 移动端对话历史 */}
        <div className="p-4 lg:hidden">
          {dialogues.length > 0 && (
            <>
              <h3 className="font-medium text-text-secondary mb-2 text-sm">最近对话</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dialogues.slice(0, 3).map((dialogue) => (
                  <button
                    key={dialogue.id}
                    onClick={() => handleDialogueClick(dialogue.id)}
                    className="flex-shrink-0 px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm hover:bg-primary/20 transition-colors"
                  >
                    {dialogue.title}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 右侧主内容 */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-border p-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl lg:text-2xl font-semibold text-text-primary">生成英语对话</h1>
            <p className="text-text-secondary mt-1 text-sm lg:text-base hidden sm:block">输入您想学习的单词，AI将为您生成自然的对话</p>
          </div>
          
          <ApiKeyManager onApiKeyChange={setHasApiKey} />
        </header>

        {/* 主内容区 */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="card p-4 lg:p-8">
              <div className="text-center mb-6 lg:mb-8">
                <MessageSquare size={40} className="mx-auto text-primary mb-4 lg:w-12 lg:h-12" />
                <h2 className="text-lg lg:text-xl font-semibold text-text-primary mb-2">
                  开始创建您的英语对话
                </h2>
                <p className="text-text-secondary text-sm lg:text-base">
                  输入 2 个或更多英文单词，用逗号或空格分隔
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    英文单词
                  </label>
                  <textarea
                    value={words}
                    onChange={(e) => setWords(e.target.value)}
                    placeholder="例如: coffee, meeting, schedule, weekend"
                    className="input-field h-24 resize-none"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    建议输入 3-8 个单词以获得最佳效果
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !words.trim()}
                  className="btn-primary w-full py-3 text-base lg:text-lg font-medium flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      生成中...
                    </>
                  ) : (
                    '生成对话'
                  )}
                </button>
              </div>

              {/* 使用说明 */}
              <div className="mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-border">
                <h3 className="font-medium text-text-primary mb-3 text-sm lg:text-base">使用说明：</h3>
                <ul className="space-y-2 text-xs lg:text-sm text-text-secondary">
                  <li>• 输入您想学习的英文单词，用逗号或空格分隔</li>
                  <li>• AI 会创建包含这些单词的自然对话</li>
                  <li>• 生成的对话支持多种音色朗读</li>
                  <li>• 可调节播放速度，适应不同学习节奏</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}