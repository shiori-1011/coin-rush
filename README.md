# 🪙 COIN RUSH (コインラッシュ)

Next.js と Tailwind CSS で構築された、ブラウザで遊べる爽快コイン集めゲームです。
PCのキーボード操作はもちろん、スマートフォンのタッチ操作やバーチャルパッドにも完全対応しています。

---

## 🎮 ゲームの特徴

- **直感的な操作性**:
  - キーボードの矢印キー（`↑` `↓` `←` `→`）または `W` `A` `S` `D`
  - 画面タップ / マウスドラッグ追従
  - スマホ用バーチャル十字キー（D-Pad）
- **多彩なコイン・アイテム**:
  - 🪙 **ゴールドコイン**: 基本のコイン（+10 pt）
  - 💎 **ダイヤジェム**: レアコイン（+30 pt）
  - ⭐ **フィーバースター**: 制限時間で消える高得点スター（+50 pt）
  - ⏱️ **時計アイテム**: 残り時間を5秒延長（+5秒）
  - 💣 **トゲ・障害物**: 触れると減点（-15 pt）& 一時的にスピードダウン
- **コンボシステム**: テンポよく連続でコインを集めると倍率がアップ（最大 x5 倍）！
- **サウンドエンジン（Web Audio API）**: 外部音声ファイル不要の軽量・ゼロ遅延シンセサウンド。ミュート切り替えも可能。
- **リッチな演出**: 鮮やかなアニメーション背景、パーティクル拡散エフェクト、ゲーム終了時の紙吹雪演出（Canvas Confetti）。
- **スキン選択**: にゃんこ🐱、うさぎ🐰、ロボット🤖、エイリアン👾、きつね🦊から選択可能。
- **ハイスコア保存**: ブラウザの localStorage に自動保存。

---

## 🚀 起動方法（ローカル環境）

### 1. 依存関係のインストール（初回のみ）
```bash
npm install
```

### 2. 開発サーバーの起動
```bash
npm run dev
```

起動後、ブラウザで [http://localhost:3000](http://localhost:3000) を開いてゲームをプレイできます。

### 3. プロダクションビルドの確認
```bash
npm run build
npm run start
```

---

## 🌐 Vercelへのデプロイ方法

本プロジェクトは Next.js 標準構成のため、Vercel へ数ステップでデプロイできます。

### 方法1: GitHub と Vercel を連携してデプロイ（推奨）

1. **GitHubにリポジトリを作成してプッシュする**:
   ```bash
   git init
   git add .
   git commit -m "feat: complete Coin Rush game"
   git branch -M main
   git remote add origin https://github.com/<あなたのユーザー名>/<リポジトリ名>.git
   git push -u origin main
   ```
2. **Vercelにアクセス**:
   - [https://vercel.com/](https://vercel.com/) にログイン
   - ダッシュボードの「**Add New...**」→「**Project**」をクリック
3. **リポジトリをインポート**:
   - 作成した GitHub リポジトリを選択
   - Framework Preset が `Next.js` になっていることを確認
4. **「Deploy」ボタンをクリック**:
   - 約1分でビルドが完了し、公開URL（`https://xxx.vercel.app`）が発行されます！

### 方法2: Vercel CLI を使って直接デプロイ

```bash
# Vercel CLI をインストール
npm i -g vercel

# ログイン
vercel login

# デプロイ実行
vercel

# 本番環境へデプロイ
vercel --prod
```

---

## 🛠️ 使用技術

- **フレームワーク**: Next.js (App Router, Turbopack)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4
- **アイコン**: Lucide React
- **エフェクト**: Canvas-confetti, HTML5 Canvas 2D
- **オーディオ**: Web Audio API (Synthesizer)
