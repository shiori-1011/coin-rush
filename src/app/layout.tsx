import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "コインラッシュ！(COIN RUSH) - ブラウザで遊べる爽快コイン集めゲーム",
  description: "矢印キーやスマホのタッチ操作でキャラクターを動かして、制限時間内にコインをたくさん集めよう！",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
