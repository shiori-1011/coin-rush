'use client';

import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { 
  Trophy, 
  Clock, 
  Coins, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Play, 
  Flame, 
  Sparkles, 
  Share2, 
  Check, 
  Gamepad2,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import { CoinGame } from '@/components/CoinGame';
import { VirtualPad } from '@/components/VirtualPad';
import { soundManager } from '@/lib/sound';
import { SKINS } from '@/lib/skins';
import { CharacterSkin, GameStatus } from '@/types/game';

const INITIAL_TIME = 60;

// localStorage同期用ヘルパー (React 19 / SSR対応)
const subscribeHighScore = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('coinrush_highscore_update', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('coinrush_highscore_update', callback);
  };
};

const getHighScoreSnapshot = () => {
  if (typeof window === 'undefined') return '0';
  try {
    return localStorage.getItem('coin_rush_highscore') || '0';
  } catch {
    return '0';
  }
};

const getHighScoreServerSnapshot = () => '0';

export default function Home() {
  const [gameState, setGameState] = useState<GameStatus>('ready');
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_TIME);
  const [score, setScore] = useState<number>(0);
  const [coinsCount, setCoinsCount] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [maxCombo, setMaxCombo] = useState<number>(1);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedSkin, setSelectedSkin] = useState<CharacterSkin>(SKINS[0]);
  const [showMobileControls, setShowMobileControls] = useState<boolean>(true);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [virtualDir, setVirtualDir] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  // ハイスコアを同期
  const highScoreRaw = useSyncExternalStore(
    subscribeHighScore,
    getHighScoreSnapshot,
    getHighScoreServerSnapshot
  );
  const highScore = parseInt(highScoreRaw, 10) || 0;

  // サウンド切り替え
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
  };

  // タイマー進行
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        if (prev <= 6 && prev > 1) {
          soundManager.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // ゲームスタート
  const startGame = () => {
    setGameState('playing');
    setTimeLeft(INITIAL_TIME);
    setScore(0);
    setCoinsCount(0);
    setCombo(1);
    setMaxCombo(1);
    setIsNewRecord(false);
    setCopiedShare(false);
  };

  // ゲームオーバーハンドラ
  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    if (score > highScore) {
      setIsNewRecord(true);
      try {
        localStorage.setItem('coin_rush_highscore', score.toString());
        window.dispatchEvent(new Event('coinrush_highscore_update'));
      } catch {
        // ignore
      }
    }
  }, [score, highScore]);

  // スコア更新
  const handleScoreChange = useCallback((newScore: number, newCoinsCount: number) => {
    setScore(newScore);
    setCoinsCount(newCoinsCount);
  }, []);

  // コンボ更新
  const handleComboChange = useCallback((newCombo: number) => {
    setCombo(newCombo);
    setMaxCombo((prev) => Math.max(prev, newCombo));
  }, []);

  // タイムボーナス
  const handleTimeBonus = useCallback((bonusSeconds: number) => {
    setTimeLeft((prev) => Math.min(prev + bonusSeconds, 99));
  }, []);

  // ランク計算
  const getRank = (finalScore: number) => {
    if (finalScore >= 800) return { rank: 'S', title: '神業コレクター！👑', color: 'text-amber-400' };
    if (finalScore >= 500) return { rank: 'A', title: 'コインマスター！🌟', color: 'text-purple-400' };
    if (finalScore >= 250) return { rank: 'B', title: 'コインハンター！🔥', color: 'text-blue-400' };
    return { rank: 'C', title: '駆け出しコレクター！🌱', color: 'text-emerald-400' };
  };

  // 結果のシェア
  const handleShare = async () => {
    const rankInfo = getRank(score);
    const text = `🪙 COIN RUSH (コインラッシュ) でスコア ${score}点 (ランク${rankInfo.rank}) を達成！獲得コイン: ${coinsCount}枚 / 最大コンボ: x${maxCombo}！ #CoinRush #Nextjs`;
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'COIN RUSH スコア結果',
          text,
          url: window.location.href,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      // ignore
    }
  };

  // タイマーのプログレス割合
  const timeProgress = (timeLeft / INITIAL_TIME) * 100;

  return (
    <main className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center p-3 sm:p-6 overflow-x-hidden bg-slate-950">
      {/* 鮮やかな背景アニメーションオーブ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-[120px] animate-orb-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-purple-600/15 blur-[140px] animate-orb-2" />
        <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-[100px] animate-orb-3" />
      </div>

      {/* 画面中央に配置されるゲームコンソールカード */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-2.5 sm:gap-3 my-auto">
        {/* ヘッダー＆HUD */}
        <header className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                <span className="text-lg sm:text-xl">🪙</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
                  COIN RUSH
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">コイン集めゲーム</p>
              </div>
            </div>

            {/* 右上ユーティリティ */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSound}
                type="button"
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
                aria-label={soundEnabled ? 'サウンドをミュート' : 'サウンドをオン'}
                title={soundEnabled ? 'ミュート' : 'サウンドON'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />}
              </button>

              <button
                onClick={() => setShowMobileControls(!showMobileControls)}
                type="button"
                className={`p-2 sm:p-2.5 rounded-xl border transition-all shadow-md active:scale-95 sm:hidden ${
                  showMobileControls 
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-300' 
                    : 'bg-slate-800/80 border-white/10 text-slate-400'
                }`}
                title="十字キー表示切替"
              >
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* ゲームHUDバー */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-2 sm:p-3 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl">
            {/* 残り時間 */}
            <div className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-slate-800/50 border border-white/5 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] sm:text-xs font-semibold mb-0.5">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
                <span>残り時間</span>
              </div>
              <div className={`text-lg sm:text-2xl font-black transition-all ${
                timeLeft <= 10 ? 'text-red-400 scale-110 animate-pulse' : 'text-cyan-300'
              }`}>
                {timeLeft} <span className="text-[10px] sm:text-xs font-normal text-slate-400">秒</span>
              </div>
              {/* 時間ゲージバー */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
                <div
                  className={`h-full transition-all duration-300 ${
                    timeLeft <= 10 ? 'bg-red-500' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${timeProgress}%` }}
                />
              </div>
            </div>

            {/* 現在スコア */}
            <div className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 relative">
              <div className="flex items-center gap-1.5 text-amber-300 text-[11px] sm:text-xs font-semibold mb-0.5">
                <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                <span>スコア</span>
              </div>
              <div className="text-xl sm:text-3xl font-black text-amber-400 tracking-tight drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                {score}
              </div>
              {combo > 1 && (
                <div className="absolute -top-1.5 right-1.5 flex items-center gap-0.5 text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-red-500 to-amber-500 text-white animate-bounce shadow-md">
                  <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                  x{combo}
                </div>
              )}
            </div>

            {/* ハイスコア */}
            <div className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-slate-800/50 border border-white/5">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] sm:text-xs font-semibold mb-0.5">
                <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" />
                <span>ハイスコア</span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-yellow-300/90">
                {highScore}
              </div>
            </div>
          </div>
        </header>

        {/* ゲームフィールドエリア（中央・Canvasとオーバーレイが完全同サイズで重なる） */}
        <div className="w-full relative">
          <CoinGame
            skin={selectedSkin}
            isGameActive={gameState === 'playing'}
            timeLeft={timeLeft}
            onScoreChange={handleScoreChange}
            onComboChange={handleComboChange}
            onTimeBonus={handleTimeBonus}
            onGameOver={handleGameOver}
            virtualDirection={virtualDir}
          >
            {/* スタート画面オーバーレイ */}
            {gameState === 'ready' && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center z-20 animate-in fade-in zoom-in-95 duration-300">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold mb-2 sm:mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  60秒コイン集めチャレンジ！
                </div>
                
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-1 sm:mb-2">
                  コインラッシュ！
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-3 sm:mb-5 leading-relaxed">
                  キャラクターを動かしてコインを集めよう！<br />
                  テンポよく取るとコンボで高得点！トゲには要注意💣
                </p>

                {/* スキン選択 */}
                <div className="mb-3 sm:mb-5 w-full max-w-sm">
                  <p className="text-[11px] sm:text-xs text-slate-400 font-bold mb-1.5">キャラクターを選択</p>
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                    {SKINS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSkin(s)}
                        className={`flex flex-col items-center p-1.5 sm:p-2 rounded-xl sm:rounded-2xl transition-all ${
                          selectedSkin.id === s.id
                            ? 'bg-amber-400/20 border-2 border-amber-400 scale-105 sm:scale-110 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                            : 'bg-slate-800/60 border border-white/10 hover:bg-slate-700/60 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <span className="text-xl sm:text-2xl mb-0.5">{s.emoji}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-300">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* スタートボタン */}
                <button
                  onClick={startGame}
                  className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_auto] text-slate-950 font-black text-base sm:text-lg shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:shadow-[0_0_45px_rgba(245,158,11,0.8)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 animate-pulse-glow"
                >
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-1.5 fill-current" />
                  ゲームスタート！
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1 transition-transform group-hover:translate-x-1" />
                </button>

                {/* 操作説明ヒント */}
                <div className="mt-3 sm:mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs text-slate-400">
                  <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-lg border border-white/5">
                    <Gamepad2 className="w-3.5 h-3.5 text-amber-400" /> 矢印キー または WASD
                  </span>
                  <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-lg border border-white/5">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> 画面タップ / 十字キー
                  </span>
                </div>
              </div>
            )}

            {/* ゲームオーバー / リザルト画面オーバーレイ */}
            {gameState === 'gameover' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center z-20 animate-in zoom-in-95 fade-in duration-300">
                {isNewRecord && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-xs font-black mb-2 sm:mb-3 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-bounce">
                    <Trophy className="w-3.5 h-3.5" />
                    NEW RECORD! 自己最高新記録！
                  </div>
                )}

                <h2 className="text-2xl sm:text-4xl font-black text-white mb-1">
                  TIME UP!
                </h2>
                <p className={`text-sm sm:text-base font-bold mb-3 ${getRank(score).color}`}>
                  ランク {getRank(score).rank} : {getRank(score).title}
                </p>

                {/* スコアカード */}
                <div className="w-full max-w-xs sm:max-w-sm rounded-2xl bg-slate-900/90 border border-white/10 p-3 sm:p-4 mb-4 shadow-xl">
                  <div className="text-[11px] sm:text-xs text-slate-400 mb-0.5">最終スコア</div>
                  <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight mb-2 sm:mb-3 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">
                    {score}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/10 pt-2.5">
                    <div className="flex flex-col items-center p-1.5 sm:p-2 rounded-xl bg-slate-800/50">
                      <span className="text-[11px] text-slate-400">集めたコイン</span>
                      <span className="text-xs sm:text-sm font-bold text-white mt-0.5">{coinsCount} 枚</span>
                    </div>
                    <div className="flex flex-col items-center p-1.5 sm:p-2 rounded-xl bg-slate-800/50">
                      <span className="text-[11px] text-slate-400">最大コンボ</span>
                      <span className="text-xs sm:text-sm font-bold text-amber-300 mt-0.5">x{maxCombo} 連続</span>
                    </div>
                  </div>
                </div>

                {/* ボタン群 */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xs sm:max-w-sm">
                  <button
                    onClick={startGame}
                    className="w-full inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm sm:text-base shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:shadow-[0_0_35px_rgba(245,158,11,0.8)] transition-all active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" />
                    もう一度遊ぶ！
                  </button>

                  <button
                    onClick={handleShare}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-white/10 transition-all active:scale-95"
                  >
                    {copiedShare ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
                        コピー完了！
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4 mr-1.5 text-cyan-400" />
                        結果をシェア
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </CoinGame>
        </div>

        {/* フッター＆モバイル用コントローラー */}
        <footer className="w-full flex flex-col items-center gap-1.5 sm:gap-2 mt-1">
          {/* モバイル十字キー（スマホまたは表示時のみ） */}
          {showMobileControls && (
            <div className="flex flex-col items-center sm:hidden my-1">
              <VirtualPad
                onDirectionChange={setVirtualDir}
                currentDirection={virtualDir}
              />
            </div>
          )}

          {/* コインの種類ガイド */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-400 bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
            <span className="flex items-center gap-1">
              <span className="text-amber-400 font-bold">🪙 ゴールド</span> +10pt
            </span>
            <span className="flex items-center gap-1">
              <span className="text-cyan-400 font-bold">💎 ダイヤ</span> +30pt
            </span>
            <span className="flex items-center gap-1">
              <span className="text-pink-400 font-bold">⭐ フィーバー</span> +50pt
            </span>
            <span className="flex items-center gap-1">
              <span className="text-emerald-400 font-bold">⏱️ 時計</span> +5秒
            </span>
            <span className="flex items-center gap-1">
              <span className="text-red-400 font-bold">💣 トゲ</span> -15pt
            </span>
          </div>

          <p className="text-[9px] sm:text-[10px] text-slate-500 text-center">
            Created with Next.js & Tailwind CSS • 矢印キー / WASD / 画面タップ / 十字キーで操作可能
          </p>
        </footer>
      </div>
    </main>
  );
}
