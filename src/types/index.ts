// 描述单句对话
export interface DialogueLine {
  id: string;
  speaker: 'A' | 'B';
  text: string;
  audioUrl?: string; // 音频 URL，初始为空
  isLoadingAudio: boolean; // 是否正在加载此句音频
}

// 描述一个完整的对话主题
export interface Dialogue {
  id: string;
  title: string;
  lines: DialogueLine[];
  wordsUsed: string[];
  createdAt: string; // ISO Date String
}

// 描述一个可选的音色
export interface VoiceOption {
  id: string; // 例如: 'BV040_streaming'
  name: string; // 例如: '美式女声-Anna'
  gender: 'male' | 'female';
}

// 播放器状态
export interface PlayerState {
  isPlaying: boolean;
  currentLineId: string | null;
  rate: number;
  progress: number;
}

// 音色配置
export interface VoiceConfig {
  A: VoiceOption;
  B: VoiceOption;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 生成对话 API 响应
export interface GenerateDialogueResponse {
  dialogue: Dialogue;
}

// 生成音频 API 响应
export interface GenerateAudioResponse {
  url: string;
}

// 生成对话请求体
export interface GenerateDialogueRequest {
  words: string[];
}

// 生成音频请求体
export interface GenerateAudioRequest {
  text: string;
  voice: string;
}