import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 英语对话生成与朗读应用',
  description: '通过AI生成个性化英语对话，提升口语和听力水平',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}