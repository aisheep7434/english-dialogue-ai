# AI 英语对话生成与朗读应用

一款极致简洁、高度客制化的 AI 英语对话学习工具，让学习者通过自己感兴趣的单词，生成贴近真实生活、可反复聆听的沉浸式学习材料。

## ✨ 特性

### 🎯 核心功能
- **智能对话生成**: 基于DeepSeek AI，根据用户输入的单词生成自然、地道的英语对话
- **多音色朗读**: 支持美式、英式、澳式等多种口音的男女声
- **灵活播放控制**: 支持全局播放、单句重复、语速调节等功能
- **本地数据管理**: 所有数据存储在浏览器本地，隐私安全

### 📱 用户体验
- **响应式设计**: 完美适配桌面端和移动端
- **简洁界面**: 直观的操作流程，专注学习体验
- **实时反馈**: 音频生成状态、播放进度等实时显示

### 🔐 安全特性
- **客户端API Key管理**: API密钥仅存储在用户浏览器中
- **无服务端存储**: 不收集或存储用户的任何个人数据

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd english-dialogue-ai
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

4. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 配置API Key

1. 注册 [DeepSeek](https://platform.deepseek.com/) 账户
2. 获取API Key
3. 在应用右上角点击设置图标
4. 输入并保存您的API Key

## 📖 使用指南

### 生成对话
1. 在主页输入框中输入想学习的英文单词（至少2个）
2. 单词之间用逗号或空格分隔
3. 点击"生成对话"按钮
4. 等待AI生成完成后自动跳转到播放页面

### 播放控制
- **一键播放**: 按顺序播放整段对话
- **单句播放**: 点击每句旁边的播放按钮
- **语速调节**: 支持0.5x - 1.5x倍速播放
- **音色切换**: 为A、B角色选择不同的声音

### 历史管理
- 所有生成的对话会自动保存到本地
- 支持重命名和删除对话记录
- 移动端显示最近的3个对话快捷入口

## 🛠️ 技术架构

### 前端技术栈
- **Next.js 14**: React全栈框架，使用App Router
- **TypeScript**: 类型安全的JavaScript
- **Tailwind CSS**: 原子化CSS框架
- **Lucide React**: 现代图标库

### 后端API
- **Next.js API Routes**: 服务端API处理
- **DeepSeek API**: AI对话生成
- **本地存储**: 浏览器localStorage

### 响应式设计
- 移动优先的设计理念
- 完整的移动端适配
- 桌面端增强功能

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   ├── generateDialogue/
│   │   └── generateAudio/
│   ├── dialogue/[id]/     # 对话播放页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx          # 主页
├── components/            # React组件
│   ├── ApiKeyManager.tsx
│   ├── DialogueHistoryItem.tsx
│   ├── DialogueLineComponent.tsx
│   ├── PlayerControls.tsx
│   └── VoiceSelectionPanel.tsx
├── lib/                   # 工具函数和常量
│   └── constants.ts
└── types/                 # TypeScript类型定义
    └── index.ts
```

## 🔧 配置说明

### 支持的音色
- **美式英语**: Anna(女), John(男)
- **英式英语**: Emma(女), James(男) 
- **澳式英语**: Sophia(女), Oliver(男)

### 本地存储键名
- `deepseek_api_key`: DeepSeek API密钥
- `voice_config`: 音色配置
- `dialogues`: 对话历史记录

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [DeepSeek](https://platform.deepseek.com/) - 提供AI对话生成能力
- [Next.js](https://nextjs.org/) - 优秀的React框架
- [Tailwind CSS](https://tailwindcss.com/) - 高效的CSS框架
- [Lucide](https://lucide.dev/) - 美观的图标库

## 📞 支持

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](https://github.com/your-username/english-dialogue-ai/issues)
- 发送邮件至: your-email@example.com

---

⭐ 如果这个项目对您有帮助，请给我们一个Star！