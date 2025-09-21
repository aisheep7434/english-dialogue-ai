'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Play, Users } from 'lucide-react';
import { Dialogue } from '@/types';
import { STORAGE_KEYS, utils } from '@/lib/constants';

interface MultipleDialoguesPageProps {
  params: { ids: string };
}

export default function MultipleDialoguesPage({ params }: MultipleDialoguesPageProps) {
  const router = useRouter();
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDialogues();
  }, [params.ids]);

  const loadDialogues = () => {
    try {
      const dialogueIds = params.ids.split(',');
      const savedDialogues = utils.getFromStorage<Dialogue[]>(STORAGE_KEYS.DIALOGUES, []);
      const foundDialogues = savedDialogues.filter(d => dialogueIds.includes(d.id));
      setDialogues(foundDialogues);
    } catch (error) {
      console.error('Failed to load dialogues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogueClick = (id: string) => {
    router.push(`/dialogue/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              生成的对话主题
            </h1>
            <p className="text-sm text-text-secondary">
              共生成了 {dialogues.length} 个对话主题
            </p>
          </div>
        </div>
      </header>

      {/* 对话列表 */}
      <main className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-4 md:gap-6">
            {dialogues.map((dialogue, index) => (
              <div
                key={dialogue.id}
                className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleDialogueClick(dialogue.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold text-text-primary">
                        {dialogue.title}
                      </h2>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Users size={16} />
                        <span>{dialogue.lines.length} 句对话</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <MessageSquare size={16} />
                        <span>使用单词: {dialogue.wordsUsed.join(', ')}</span>
                      </div>
                    </div>

                    {/* 对话预览 */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <h4 className="text-sm font-medium text-text-secondary mb-2">对话预览:</h4>
                      <div className="space-y-1 text-sm">
                        {dialogue.lines.slice(0, 3).map((line, lineIndex) => (
                          <div key={line.id} className="flex gap-2">
                            <span className={`font-semibold ${
                              line.speaker === 'A' ? 'text-blue-600' : 'text-green-600'
                            }`}>
                              {line.speaker}:
                            </span>
                            <span className="text-text-primary">
                              {line.text.length > 60 ? line.text.slice(0, 60) + '...' : line.text}
                            </span>
                          </div>
                        ))}
                        {dialogue.lines.length > 3 && (
                          <div className="text-text-secondary text-xs">
                            ... 还有 {dialogue.lines.length - 3} 句对话
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDialogueClick(dialogue.id);
                    }}
                    className="btn-primary flex items-center gap-2 px-4 py-2"
                  >
                    <Play size={16} />
                    开始练习
                  </button>
                </div>
              </div>
            ))}
          </div>

          {dialogues.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare size={48} className="mx-auto text-text-secondary mb-4" />
              <p className="text-text-secondary mb-4">未找到对话内容</p>
              <button
                onClick={() => router.push('/')}
                className="btn-primary"
              >
                返回首页
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}