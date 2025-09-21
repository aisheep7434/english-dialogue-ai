import { VoiceOption } from '@/types';

// 默认音色选项
export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'BV040_streaming', name: '美式女声-Anna', gender: 'female' },
  { id: 'BV002_streaming', name: '美式男声-John', gender: 'male' },
  { id: 'BV001_streaming', name: '英式女声-Emma', gender: 'female' },
  { id: 'BV003_streaming', name: '英式男声-James', gender: 'male' },
  { id: 'BV004_streaming', name: '澳式女声-Sophia', gender: 'female' },
  { id: 'BV005_streaming', name: '澳式男声-Oliver', gender: 'male' },
];

// 默认音色配置
export const DEFAULT_VOICE_CONFIG = {
  A: VOICE_OPTIONS[0], // 美式女声-Anna
  B: VOICE_OPTIONS[1], // 美式男声-John
};

// localStorage 键名
export const STORAGE_KEYS = {
  API_KEY: 'deepseek_api_key',
  VOICE_CONFIG: 'voice_config',
  DIALOGUES: 'dialogues',
};

// API 端点
export const API_ENDPOINTS = {
  GENERATE_DIALOGUE: '/api/generateDialogue',
  GENERATE_AUDIO: '/api/generateAudio',
};

// 语速选项
export const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5];

// 工具函数
export const utils = {
  // 生成唯一ID
  generateId: (): string => {
    return Math.random().toString(36).substr(2, 9);
  },

  // 从localStorage获取数据
  getFromStorage: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  // 保存数据到localStorage
  saveToStorage: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  // 处理单词列表
  processWords: (input: string): string[] => {
    return input
      .split(/[,\s]+/)
      .map(word => word.trim())
      .filter(word => word.length > 0)
      .filter((word, index, arr) => arr.indexOf(word) === index); // 去重
  },

  // 格式化时间
  formatTime: (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
};