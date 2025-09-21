'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Settings, Check } from 'lucide-react';
import { STORAGE_KEYS, utils } from '@/lib/constants';

interface ApiKeyManagerProps {
  onApiKeyChange?: (hasKey: boolean) => void;
}

export default function ApiKeyManager({ onApiKeyChange }: ApiKeyManagerProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 从localStorage加载API Key
    const savedKey = utils.getFromStorage(STORAGE_KEYS.API_KEY, '');
    if (savedKey) {
      setApiKey(savedKey);
      onApiKeyChange?.(true);
    }
  }, [onApiKeyChange]);

  const handleSave = () => {
    if (!apiKey.trim()) {
      return;
    }

    utils.saveToStorage(STORAGE_KEYS.API_KEY, apiKey.trim());
    setShowSaved(true);
    onApiKeyChange?.(true);
    
    // 3秒后隐藏成功提示
    setTimeout(() => {
      setShowSaved(false);
    }, 3000);
  };

  const hasApiKey = Boolean(apiKey.trim());

  return (
    <div className="relative">
      {/* 设置按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${
          hasApiKey 
            ? 'text-primary hover:bg-blue-50' 
            : 'text-red-500 hover:bg-red-50 animate-pulse'
        }`}
        title={hasApiKey ? '管理API Key' : '请设置API Key'}
      >
        <Settings size={20} />
      </button>

      {/* 设置面板 */}
      {isOpen && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-border rounded-xl shadow-lg p-4 z-50">
          <h3 className="font-semibold text-lg mb-3">API Key 设置</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                DeepSeek API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="请输入您的 DeepSeek API Key"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setIsOpen(false)}
                className="btn-secondary px-3 py-1.5 text-sm"
              >
                取消
              </button>
              
              <button
                onClick={handleSave}
                disabled={!apiKey.trim() || showSaved}
                className="btn-primary px-3 py-1.5 text-sm flex items-center gap-1"
              >
                {showSaved ? (
                  <>
                    <Check size={14} />
                    已保存
                  </>
                ) : (
                  '保存'
                )}
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-text-secondary">
              API Key 仅保存在您的浏览器中，不会上传到服务器。
            </p>
          </div>
        </div>
      )}

      {/* 遮罩层 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}