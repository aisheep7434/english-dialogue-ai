

### **《AI 英語對話生成與朗讀應用》PRD 產品需求文檔 (v3.2 - 終極版)**

  * **文檔版本**: 3.2
  * **狀態**: **已與 v2.0 設計指南完全同步，可作為開發與測試的最終依據**
  * **變更日誌 (v3.1 -\> v3.2)**:
      * **[重大新增]** 在功能模組 F-02 (對話生成) 中，加入了用於調用大語言模型的詳細 AI 提示詞 (Prompt) 規格。

-----

#### **1. 項目概述**

##### **1.1 項目願景 (Project Vision)**

打造一款極致簡潔、高度客製化的 AI 英語對話學習工具，讓每位學習者都能透過自己感興趣的單字，生成貼近真實生活、可反覆聆聽的沉浸式學習材料。

##### **1.2 目標用戶畫像 (User Personas)**

  * **Persona 1: 自主學習者 (Emily)**

      * **背景**: 大學生或職場新人，有一定英語基礎，希望提升口語和聽力的自然度。
      * **痛點**: 教科書對話過於死板，找不到大量圍繞特定主題或單字的真實對話材料。
      * **期望**: 能快速生成與「工作面試」、「週末計畫」、「點咖啡」等主題相關的對話，並能選擇不同口音來練習聽力。

  * **Persona 2: 開源開發者 (David)**

      * **背景**: 前端開發者，對 AI/TTS 技術感興趣。
      * **痛點**: 想尋找一個小而美的開源項目來學習 Next.js 和 AI API 整合的最佳實踐。
      * **期望**: 項目架構清晰，易於部署和二次開發，API Key 等敏感資訊由用戶端管理，安全性高。

-----

#### **2. 功能規格詳解 (Detailed Functional Specifications)**

##### **功能模組 F-01: API Key 管理**

  * **用戶故事**: 作為一名用戶，我希望能安全地輸入並儲存我的個人 DeepSeek API Key，以便應用程式可以代表我發起請求，同時確保我的金鑰不會被伺服器儲存。
  * **業務規則**:
    1.  API Key **必須且僅能**儲存在用戶瀏覽器的 `localStorage` 中。
    2.  API Key 在傳輸至後端 `/api` 路由時，必須放置在 `Authorization` Header 中。
    3.  輸入框應為 `password` 類型，以隱藏金鑰內容。
  * **驗收條件 (Acceptance Criteria)**:
      * **AC-01.1 (成功保存)**:
          * **鑒於 (Given)** 用戶在主界面，API Key 輸入框為空。
          * **當 (When)** 用戶輸入一串有效的字元並點擊「保存」按鈕。
          * **那麼 (Then)** 該字元應被存入 `localStorage` 的 `deepseek_api_key` 條目中，按鈕旁應顯示短暫的成功提示（如「已保存 ✓」），且按鈕變為非激活狀態。
      * **AC-01.2 (更新保存)**:
          * **鑒於 (Given)** `localStorage` 中已存在一個 API Key。
          * **當 (When)** 用戶在輸入框中輸入新的金鑰並點擊「保存」。
          * **那麼 (Then)** `localStorage` 中的值應被成功覆蓋，並顯示成功提示。
  * **錯誤處理**:
      * **ERR-AK-01 (空輸入)**: 當用戶未輸入任何內容就點擊「保存」時，按鈕無響應或輸入框邊框變紅，提示「API Key 不能為空」。

-----

##### **功能模組 F-02: 對話生成**

  * **用戶故事**: 作為一名英語學習者，我想要輸入一組英文單字，並立即獲得一段包含這些單字的、自然的、上下文連貫的對話，以便我能學習這些單字的實際用法。

  * **業務規則**:

    1.  用戶輸入的單字列表，需通過逗號或空格進行分隔。
    2.  提交前，前端需對單字進行 trim（去除前後空格）和去重處理。
    3.  有效單字數量必須大於等於 2 個。
    4.  發起生成請求前，必須校驗 `localStorage` 中是否存在 API Key。

  * **驗收條件**:

      * **AC-02.1 (成功生成並跳轉)**:
          * **鑒於** 用戶已保存了有效的 API Key，並輸入了至少 2 個單字。
          * **當** 用戶點擊「生成對話」按鈕。
          * **那麼** 界面應顯示全局加載動畫，後端 `/api/generateDialogue` 接口被調用，成功返回後，一個新的對話條目出現在左側導航欄，且頁面自動跳轉至該新對話的播放頁。
      * **AC-02.2 (缺少 API Key)**:
          * **鑒於** 用戶未保存 API Key。
          * **當** 用戶點擊「生成對話」。
          * **那麼** 應彈出一個提示（Toast 或 Modal），內容為「請先在右上角設定您的 API Key」。請求不會被發出。
      * **AC-02.3 (API 請求失敗)**:
          * **鑒於** 後端調用 DeepSeek API 時發生錯誤（例如，金鑰無效、網路超時）。
          * **當** 前端正在等待響應。
          * **那麼** 應停止加載動畫，並顯示一個錯誤提示，內容為「對話生成失敗，請檢查您的 API Key 或網路連線」。

  * **錯誤處理**:

      * **ERR-DG-01 (輸入驗證失敗)**: 當輸入的有效單字少於 2 個時，點擊按鈕應在輸入框下方顯示錯誤提示「請至少輸入兩個有效的單字」。

  * **AI 提示詞 (Prompt) 詳解**:

    > 後端在調用 DeepSeek API 時，**必須**使用以下經過精心設計的提示詞結構，以確保生成對話的質量、自然度及格式的準確性。在將用戶輸入的單詞列表傳遞給 AI 之前，需將其格式化並插入到提示詞的指定位置。

    > 

    > -----

    > ## Persona & Role

    > You are an expert English dialogue writer and a creative ESL teacher. Your core mission is to create dialogues that sound **genuinely authentic and natural**, as if they were spoken by native speakers in a real, everyday situation.

    > **Guiding Principles:**

    > 1.  **Everyday Authenticity:** Your dialogues must mirror real, casual conversations found in **everyday life**. Focus on common situations like making plans, grocery shopping, talking about hobbies, ordering food, or discussing a recent movie. This means you **must use common contractions** (e.g., `I'm`, `it's`, `don't`, `you've`) and simple conversational fillers (e.g., `Oh`, `Well`, `Hmm`, `You know`) to make the speech sound fluid and real.
    > 2.  **Simple & Accessible:** The language must be simple, clear, and easy for **beginner-to-intermediate learners** to understand. Avoid complex grammar, obscure idioms, or overly formal language. The goal is for learners to easily grasp the context and vocabulary in a common, everyday setting.
    > 3.  **Natural Flow:** Conversations should have a logical, natural flow. A good dialogue involves questions, answers, reactions, and follow-up comments. It shouldn't just be two people stating facts; it must feel like a **genuine, interactive chat**.

    > ## Task

    > Your task is to take a list of English words and create one or more **short, authentic, and easy-to-understand dialogues** that use every single word from the list. The final output must be a valid JSON array, strictly following the format specified below.

    > ## Workflow & Rules

    > 1.  **Analyze and Group:** Analyze the entire list of words.
    > 2.  **Identify Themes:** Group the words into logical, **everyday themes** if they cannot all fit into a single, natural conversation. Creating multiple dialogues is encouraged.
    > 3.  **Create a Title:** For each dialogue, create a short, descriptive title that reflects its everyday situation (e.g., "Catching Up with a Friend," "Planning a Weekend Trip").
    > 4.  **Write Lifelike Dialogue:** For each theme, write a dialogue between two people (e.g., A and B). The conversation **must be set in a common, everyday situation** (e.g., at a café, at home, on the phone). It should have a natural back-and-forth rhythm with questions, answers, and reactions, just like a real chat between friends or family.
    > 5.  **Integrate Words Naturally:** Weave the provided words into the dialogue seamlessly. The words should not feel forced or out of place.
    > 6.  **Ensure Simplicity:** All surrounding language (words not on the provided list) must be common, everyday English suitable for learners.
    > 7.  **Guarantee Completeness:** You MUST use every single word from the original list exactly as provided.
    > 8.  **Format Correctly (Crucial):** Your entire output must be a single, valid JSON array. Do not include any text or explanations outside of the JSON structure.

    > ## Output Format Specification

    > Your final output MUST be a single, valid JSON array `[...]`.

    >   * Each dialogue must be a separate JSON object `{...}` inside the array.
    >   * Each object must contain these three exact keys:
    >     1.  `"Dialogue title"`: A string for the dialogue's title.
    >     2.  `"Dialogue content"`: A single string containing the full conversation. You **must** use `\n` to separate lines for different speakers (e.g., `"A: Hey, what's up?\nB: Oh, not much. Just getting some coffee."`).
    >     3.  `"Words Used"`: A JSON array of strings, listing the words from the input that were used in that specific dialogue.

    > ### Example JSON Structure:

    > ```json
    > [
    >     {
    >         "Dialogue title": "Title for Dialogue 1",
    >         "Dialogue content": "A: This is the first line.\nB: This is the second line.",
    >         "Words Used": ["word_a", "word_b", "word_c"]
    >     },
    >     {
    >         "Dialogue title": "Title for Dialogue 2",
    >         "Dialogue content": "A: Another conversation starts here.\nB: And it ends here.",
    >         "Words Used": ["word_d", "word_e", "word_f"]
    >     }
    > ]
    > ```

-----

##### **功能模組 F-03: 對話播放與控制**

  * **用戶故事**: 作為一名學習者，我希望能方便地播放整段或單句對話，並在播放時清晰地看到當前正在朗讀的句子，同時可以控制播放速度以適應我的聽力水平。
  * **業務規則**:
    1.  進入對話頁面時，應使用用戶儲存在 `localStorage` 的音色偏好（若無則使用系統默認值）自動為每一句對話請求音頻。
    2.  在所有音頻加載完成前，全局「一鍵播放」按鈕應為禁用狀態。
    3.  播放時，當前句子必須有視覺高亮，且列表應自動滾動以保持當前句子在視窗中央。
  * **驗收條件**:
      * **AC-03.1 (自動加載與播放)**:
          * **鑒於** 用戶進入一個新的對話頁面。
          * **當** 所有句子的音頻都成功加載完畢。
          * **那麼** 「一鍵播放」按鈕變為可用狀態，用戶點擊後，對話應從第一句開始按順序播放，高亮和滾動效果正常。
      * **AC-03.2 (語速控制)**:
          * **鑒於** 對話正在播放中。
          * **當** 用戶在置頂播放器中將語速從 `1.0x` 切換到 `0.75x`。
          * **那麼** 當前及後續播放的音頻 `playbackRate` 應立即變為 0.75。
      * **AC-03.3 (單句播放)**:
          * **鑒於** 對話處於暫停狀態。
          * **當** 用戶點擊第二句對話旁的播放圖標。
          * **那麼** 應只播放第二句的音頻，全局播放器進度條不更新。

-----

##### **功能模組 F-04: 音色客製化**

  * **用戶故事**: 作為一名學習者，我希望能為對話中的兩個不同角色（A 和 B）分別指定不同的口音和性別的聲音，以便模擬更真實的對話場景並進行針對性聽力練習。
  * **業務規則**:
    1.  音色選擇交互必須遵循已確認的「方案 B：A/B 狀態切換模式」。
    2.  用戶的音色選擇偏好必須儲存在 `localStorage` 中，以便在生成新對話時作為默認值。
    3.  只有當用戶在面板中做出實際更改後，「應用音色」按鈕才可點擊。
  * **驗收條件**:
      * **AC-04.1 (成功更換音色)**:
          * **鑒於** 用戶打開了音色選擇面板，並為 A 或 B 選擇了一個不同於當前的音色。
          * **當** 用戶點擊已激活的「應用音色」按鈕。
          * **那麼** 面板關閉，頁面顯示加載狀態，系統使用新的音色配置重新請求所有句子的音頻，完成後加載狀態消失。
      * **AC-04.2 (無更改時的狀態)**:
          * **鑒於** 用戶打開了音色選擇面板，但沒有更改任何音色。
          * **當** 用戶進行任意操作。
          * **那麼** 「應用音色」按鈕始終保持禁用（灰色）狀態。

-----

##### **功能模組 F-05: 音頻生成 (後端)**

  * **接口定義**: `/api/generateAudio`
  * **請求方法**: `POST`
  * **請求體 (Body)**: `{ "text": "string", "voice": "string" }`
  * **成功響應 (200 OK)**: `{ "url": "string" }` (音頻文件的公開訪問路徑)
  * **失敗響應 (4xx/5xx)**: `{ "error": "string" }` (錯誤信息)
  * **後端實現參考**:
      * *請參考 v3.1 版本中提供的詳細 Python 程式碼範例。*

-----

#### **3. 非功能性需求 (Non-Functional Requirements)**

  * **性能 (Performance)**:
      * **P-01**: 頁面首次加載時間（LCP）應在 2.5 秒以內。
      * **P-02**: DeepSeek API 生成對話的響應時間應在 10 秒以內，超時需向用戶顯示提示。
      * **P-03**: TTS 音頻生成響應時間應在 3 秒以內。
  * **安全性 (Security)**:
      * **S-01**: 嚴禁在伺服器端日誌或數據庫中記錄用戶的 API Key。
      * **S-02**: 所有與外部 API 的通訊應通過後端 API 路由代理，避免在前端暴露服務方的金鑰。
  * **可用性 (Usability)**:
      * **U-01**: 應用需支持 RWD 響應式設計，在移動設備上應有良好的操作體驗。
      * **U-02**: 所有交互元素（按鈕、輸入框）都應支持鍵盤操作（Tab, Enter）。