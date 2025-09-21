### **《AI 英語對話生成與朗讀應用》開發者級界面設計指南 (v2.0)**

  * **文檔版本**: 2.0 (開發者級)
  * **最後更新**: 2025年9月21日
  * **目標**: 為前端開發提供一份像素級、無歧義的實現藍圖。

-----

#### **1. 全局設計系統 (Global Design System)**

這部分定義了應用中所有可複用的視覺樣式，建議在 `tailwind.config.js` 或全局 CSS 中定義為 Tokens。

##### **1.1 色彩 (Colors)**

| 用途 | Token 名稱 | Hex 值 | TailwindCSS 應用 |
| :--- | :--- | :--- | :--- |
| 主色 (按鈕、重點) | `primary` | `#4A90E2` | `bg-primary`, `text-primary`, `border-primary` |
| 主色-懸浮 | `primary-hover` | `#357ABD` | `hover:bg-primary-hover` |
| 背景 | `background` | `#FFFFFF` | `bg-background` |
| 輔助背景 | `background-alt`| `#F7F7F8` | `bg-background-alt` |
| 邊框/分隔線 | `border` | `#EAEAEA` | `border-border` |
| 主文本 | `text-primary` | `#333333` | `text-text-primary` |
| 副文本 | `text-secondary`| `#666666` | `text-text-secondary` |
| 播放高亮 | `highlight` | `#FFF2E0` | `bg-highlight` |

##### **1.2 字体排印 (Typography)**

  * **字體**: `Inter`, `sans-serif`
  * **字號與樣式**:
      * **H1 (應用標題)**: `font-semibold text-2xl` (24px)
      * **H2 (模塊標題)**: `font-medium text-lg` (18px)
      * **Body (正文)**: `text-base` (16px)
      * **Label (標籤)**: `text-sm` (14px)

##### **1.3 佈局與間距 (Layout & Spacing)**

  * **基礎單位**: `4px`
  * **常用間距**:
      * `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-6` (24px)
      * `gap-2` (8px), `gap-4` (16px)
  * **佈局**:
      * **主佈局**: 左側導航 `w-64` (256px)，右側內容區 `flex-1`。

##### **1.4 元素樣式 (Elements)**

  * **圓角 (Border Radius)**:
      * **卡片/模塊**: `rounded-xl` (12px)
      * **按鈕/輸入框**: `rounded-lg` (8px)
  * **陰影 (Box Shadow)**:
      * **標準卡片**: `shadow-md` (`0 4px 6px -1px rgb(0 0 0 / 0.1), ...`)

-----

#### **2. 數據結構定義 (Data Structure - TypeScript)**

```typescript
// 描述單句對話
interface DialogueLine {
  id: string;
  speaker: 'A' | 'B';
  text: string;
  audioUrl?: string; // 音頻 URL，初始為空
  isLoadingAudio: boolean; // 是否正在加載此句音頻
}

// 描述一個完整的對話主題
interface Dialogue {
  id: string;
  title: string;
  lines: DialogueLine[];
  wordsUsed: string[];
  createdAt: string; // ISO Date String
}

// 描述一個可選的音色
interface VoiceOption {
  id: string; // 例如: 'BV040_streaming'
  name: string; // 例如: '美式女聲-Anna'
  gender: 'male' | 'female';
}
```

-----

#### **3. 組件化設計規範 (Component Specification)**

##### **3.1 `DialogueHistoryItem.tsx` (對話歷史條目)**

  * **用途**: 在左側導航欄顯示單個對話記錄。
  * **Props**:
      * `dialogue: { id: string, title: string }` (必選)
      * `isSelected: boolean` (必選)
      * `onClick: (id: string) => void` (必選)
  * **內部 State**: `isHovered: boolean`
  * **UI/Styling**:
      * 外層 `div` 使用 `p-3 rounded-lg cursor-pointer transition-colors group`。
      * 當 `isSelected` 為 `true` 時，添加 `bg-blue-100 text-primary font-semibold`。
      * 當 `isSelected` 為 `false` 時，`hover:bg-background-alt`。
      * 內部包含一個 `p` 標籤顯示 `dialogue.title`。
      * 包含兩個圖標 (`RenameIcon`, `DeleteIcon`)，默認 `opacity-0`，在 `group-hover:opacity-100` 時顯示。
  * **交互邏輯**:
      * 點擊整個組件時，調用 `props.onClick(props.dialogue.id)`。

##### **3.2 `PlayerControls.tsx` (置頂播放器)**

  * **用途**: 固定在對話頁面頂部的播放控制器。
  * **Props**:
      * `onPlayAll: () => void`
      * `onPause: () => void`
      * `isPlaying: boolean`
      * `playbackRate: number`
      * `onRateChange: (rate: number) => void`
      * `progress: number` (0-100)
  * **UI/Styling**:
      * 一個 `flex` 佈局的 `div`，`p-4 border-b bg-white/80 backdrop-blur-sm sticky top-0`。
      * 左側是大的播放/暫停按鈕。
      * 中間是進度條 `input[type=range]`。
      * 右側是語速選擇下拉菜單。
  * **交互邏輯**:
      * 點擊播放/暫停按鈕，調用 `onPlayAll` 或 `onPause`。
      * 語速下拉菜單 `onChange` 事件觸發 `onRateChange`。

##### **3.3 `VoiceSelectionPanel.tsx` (音色選擇面板)**

  * **用途**: 實現音色選擇的 **方案 B**。

  * **Props**:

      * `currentVoices: { A: VoiceOption, B: VoiceOption }`
      * `voiceOptions: VoiceOption[]`
      * `onApply: (newVoices: { A: VoiceOption, B: VoiceOption }) => void`
      * `onClose: () => void`

  * **內部 State**:

      * `activeSpeaker: 'A' | 'B'` (默認 'A')
      * `selectedVoices: { A: VoiceOption, B: VoiceOption }` (初始值為 `props.currentVoices`)

  * **UI/Styling**:

      * **切換欄**: 兩個按鈕，`activeSpeaker` 狀態的按鈕有 `bg-primary text-white` 樣式。按鈕文字動態顯示，如 `A: ${selectedVoices.A.name}`。
      * **列表**: 遍歷 `props.voiceOptions`。當某個 `option.id === selectedVoices[activeSpeaker].id` 時，該列表項背景高亮並顯示 `✓` 圖標。
      * **應用按鈕**: `disabled={JSON.stringify(props.currentVoices) === JSON.stringify(selectedVoices)}`。激活時為 `bg-primary`。

  * **交互邏輯 (偽代碼)**:

    ```javascript
    function handleSpeakerTabClick(speaker) {
      setActiveSpeaker(speaker);
    }

    function handleVoiceOptionClick(voice) {
      setSelectedVoices(prev => ({ ...prev, [activeSpeaker]: voice }));
    }

    function handleApplyClick() {
      props.onApply(selectedVoices);
      props.onClose();
    }
    ```

-----

#### **4. 頁面與核心流程實現**

##### **4.1 主界面 (`/`)**

  * **頁面 State**:
      * `dialogueList: Dialogue[]`
      * `isLoading: boolean`
      * `apiKey: string` (從 `localStorage` 讀取)
  * **核心邏輯**:
    1.  **掛載時 (`useEffect`)**: 從後端 API 獲取對話列表，更新 `dialogueList`。
    2.  **生成對話 (`handleGenerate`)**:
          * 設置 `isLoading = true`。
          * 調用 `POST /api/generateDialogue`，請求體為 `{ words: [...] }`，Header 包含 `Authorization: Bearer ${apiKey}`。
          * 成功後:
              * 將返回的新對話添加到 `dialogueList`。
              * 使用 Next.js 的 `router.push('/dialogue/' + newDialogue.id)` 進行頁面跳轉。
          * 失敗後: 顯示錯誤提示 (Toast)。
          * 最後設置 `isLoading = false`。

##### **4.2 對話音頻頁面 (`/dialogue/[id]`)**

  * **頁面 State**:
      * `dialogue: Dialogue | null`
      * `playerState: { isPlaying: boolean, currentLineId: string | null, rate: number, progress: number }`
      * `voiceConfig: { A: VoiceOption, B: VoiceOption }` (從 `localStorage` 或默認值讀取)
      * `isPanelOpen: boolean`
  * **核心邏輯**:
    1.  **數據獲取**: 根據 `id` 從後端獲取對話詳情，更新 `dialogue` state。
    2.  **音頻自動加載**:
          * `useEffect` 監聽 `dialogue` 的變化。
          * 遍歷 `dialogue.lines`，如果 `audioUrl` 為空，則調用 `POST /api/generateAudio`。
          * 請求體為 `{ text: line.text, voice: line.speaker === 'A' ? voiceConfig.A.id : voiceConfig.B.id }`。
          * 獲取到 `url` 後，更新 `dialogue` state 中對應 line 的 `audioUrl` 和 `isLoadingAudio`。
    3.  **播放控制**:
          * `onPlayAll` 函數會設置一個 `setInterval` 來依次播放每句音頻，並更新 `playerState` 中的 `currentLineId` 和 `progress`。
          * 正在播放的 `DialogueLine` 組件，根據 `playerState.currentLineId === line.id` 來決定是否高亮。
    4.  **音色更換 (`handleApplyVoices`)**:
          * 接收 `VoiceSelectionPanel` 傳來的新 `newVoices`。
          * 更新 `voiceConfig` state，並將其保存到 `localStorage`。
          * 將 `dialogue` 中所有 `lines` 的 `audioUrl` 設為 `undefined`，這會觸發第2步的 `useEffect`，用新的音色重新生成全部音頻。
