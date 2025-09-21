# 🎭 AI英语对话生成与语音合成应用

一个基于AI的英语对话生成工具，支持多角色语音合成和个性化音色配置。通过输入英语单词，自动生成真实自然的英语对话，并为不同角色配置专属音色，实现高质量的语音播放体验。

## ✨ 核心特性

### 🤖 智能对话生成
- **AI驱动**：基于DeepSeek Reasoner模型，生成地道自然的英语对话
- **单词驱动**：输入英语单词，自动构建包含这些词汇的对话场景
- **多主题支持**：根据词汇内容智能生成多个相关对话主题
- **生活化场景**：专注于日常交流场景，贴近实际使用

### 🎵 个性化语音合成
- **双角色配音**：为对话中的A、B角色分别配置不同音色
- **12种音色选择**：涵盖男声、女声，不同风格和口音
- **批量音频生成**：一键为整个对话生成高质量MP3音频
- **智能并发控制**：优化API调用，确保稳定的音频生成

### 🎯 用户体验优化
- **无跳转生成**：在当前页面直接显示生成的对话内容
- **实时音频播放**：支持单句播放和连续播放
- **播放速度调节**：0.5x到2.0x的播放速度选择
- **对话历史管理**：自动保存历史记录，支持删除和重命名

### 🎨 现代化界面
- **响应式设计**：适配桌面和移动设备
- **左右分栏布局**：左侧历史记录，右侧主工作区
- **滑出式面板**：优雅的音色配置界面
- **实时状态反馈**：清晰的加载状态和进度提示

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- DeepSeek API Key
- 火山引擎 TTS API 权限

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/aisheep7434/english-dialogue-ai.git
cd english-dialogue-ai
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **配置环境变量**
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入你的API密钥：
```env
# AI对话生成API Key (DeepSeek)
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 火山引擎TTS配置
VOLCANO_APPID=6832718077
VOLCANO_ACCESS_TOKEN=your_volcano_access_token_here
VOLCANO_CLUSTER=volcano_tts
VOLCANO_HOST=openspeech.bytedance.com
```

4. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

5. **访问应用**

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📖 使用指南

### 基本使用流程

1. **输入单词**
   - 在主页输入框中输入英语单词（至少2个）
   - 支持逗号、空格分隔
   - 例如：`coffee, meeting, schedule, weekend`

2. **生成对话**
   - 点击"生成"按钮
   - AI将在当前页面生成包含这些单词的对话
   - 可能生成一个或多个相关对话主题

3. **配置音色**
   - 点击"音色选择"按钮
   - 为角色A和角色B选择不同的音色
   - 12种音色可选：慵懒女声、活力男声等

4. **生成语音**
   - 在音色面板中点击"生成语音"按钮
   - 系统将为所有对话语句生成音频
   - 支持批量处理，自动控制并发

5. **播放体验**
   - 使用"一键播放"连续播放整个对话
   - 点击单句的播放按钮播放特定语句
   - 调节播放速度（0.5x - 2.0x）

### 高级功能

- **对话管理**：在左侧历史记录中查看、删除、重命名历史对话
- **详细页面**：点击"详细页面"按钮获得完整的播放控制体验
- **数据持久化**：所有对话和配置自动保存到本地存储

## 🛠️ 技术架构

### 技术栈

- **前端框架**：Next.js 14 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **图标**：Lucide React
- **状态管理**：React Hooks
- **数据存储**：localStorage

### API服务

- **对话生成**：DeepSeek Reasoner API
- **语音合成**：火山引擎 TTS API
- **音频格式**：MP3 (Base64编码)

### 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   ├── generateDialogue/ # 对话生成API
│   │   └── generateAudio/    # 音频生成API
│   ├── dialogue/[id]/     # 对话详情页
│   ├── dialogues/[ids]/   # 多对话展示页
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx          # 主页
├── components/            # React组件
│   ├── ApiKeyManager.tsx      # API密钥管理
│   ├── DialogueHistoryItem.tsx # 对话历史项
│   ├── DialogueLineComponent.tsx # 对话行组件
│   ├── PlayerControls.tsx      # 播放控制
│   └── VoiceSelectionPanel.tsx # 音色选择面板
├── lib/
│   └── constants.ts       # 常量配置
└── types/
    └── index.ts          # TypeScript类型定义
```

## 🎨 支持的音色

项目集成了12种高质量英语音色：

### 女声音色
- **慵懒女声 - Ava** (BV511_streaming)
- **议论女声 - Alicia** (BV505_streaming)
- **情感女声 - Lawrence** (BV138_streaming)
- **美式女声 - Amelia** (BV027_streaming)
- **讲述女声 - Amanda** (BV502_streaming)
- **活力女声 - Ariana** (BV503_streaming)
- **天才少女** (BV421_streaming)
- **天真萌娃 - Lily** (BV506_streaming)
- **亲切女声 - Anna** (BV040_streaming)

### 男声音色
- **活力男声 - Jackson** (BV504_streaming)
- **Stefan** (BV702_streaming)
- **澳洲男声 - Henry** (BV516_streaming)

## 🔧 配置说明

### API密钥获取

1. **DeepSeek API Key**
   - 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
   - 注册账号并获取API Key
   - 确保有足够的API调用余额

2. **火山引擎 TTS API**
   - 访问 [火山引擎控制台](https://console.volcengine.com/)
   - 开通语音技术服务
   - 获取APP ID和Access Token

### 环境变量详解

```env
# 必需 - DeepSeek API密钥，用于AI对话生成
DEEPSEEK_API_KEY=sk-xxx

# 必需 - 火山引擎应用ID
VOLCANO_APPID=6832718077

# 必需 - 火山引擎访问令牌
VOLCANO_ACCESS_TOKEN=xxx

# 可选 - 火山引擎集群配置（默认值可用）
VOLCANO_CLUSTER=volcano_tts
VOLCANO_HOST=openspeech.bytedance.com
```

## 📦 部署指南

### Vercel部署（推荐）

1. **连接GitHub仓库**
   - 在Vercel中导入GitHub仓库
   - 选择Next.js框架预设

2. **配置环境变量**
   - 在Vercel项目设置中添加环境变量
   - 添加上述所有必需的API密钥

3. **部署**
   - Vercel将自动构建和部署
   - 每次push到main分支都会自动重新部署

### 手动部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 开发流程

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add some amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交Pull Request

### 代码规范

- 使用TypeScript编写类型安全的代码
- 遵循ESLint和Prettier配置
- 组件名使用PascalCase
- 文件名使用camelCase
- 提交信息使用英文，格式：`type: description`

## 📄 许可证

本项目采用MIT许可证。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [DeepSeek](https://www.deepseek.com/) - 提供强大的AI对话生成能力
- [火山引擎](https://www.volcengine.com/) - 提供高质量的TTS语音合成服务
- [Next.js](https://nextjs.org/) - 现代化的React框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架
- [Lucide](https://lucide.dev/) - 精美的图标库

## 📞 联系我们

如果你有任何问题或建议，欢迎：

- 提交 [GitHub Issue](https://github.com/aisheep7434/english-dialogue-ai/issues)
- 发起 [Discussion](https://github.com/aisheep7434/english-dialogue-ai/discussions)

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！