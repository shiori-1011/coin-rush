'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { soundManager } from '@/lib/sound';
import { Coin, CoinType, FloatingText, Particle, Player, CharacterSkin } from '@/types/game';

interface CoinGameProps {
  skin: CharacterSkin;
  isGameActive: boolean;
  timeLeft: number;
  onScoreChange: (score: number, coinsCount: number) => void;
  onComboChange: (combo: number) => void;
  onTimeBonus: (bonusSeconds: number) => void;
  onGameOver: () => void;
  virtualDirection: { up: boolean; down: boolean; left: boolean; right: boolean };
  children?: React.ReactNode;
}

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

export const CoinGame: React.FC<CoinGameProps> = ({
  skin,
  isGameActive,
  timeLeft,
  onScoreChange,
  onComboChange,
  onTimeBonus,
  onGameOver,
  virtualDirection,
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ゲーム内部の可変状態（リフレッシュレート同期用ref）
  const stateRef = useRef({
    player: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      radius: 22,
      speed: 6.5,
      color: skin.color,
      faceEmoji: skin.emoji,
      facing: 'right' as 'left' | 'right',
      trail: [] as { x: number; y: number; alpha: number }[],
      isHurt: false,
      hurtTimer: 0,
    } as Player,
    coins: [] as Coin[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    keys: {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      s: false,
      a: false,
      d: false,
    },
    touchTarget: null as { x: number; y: number } | null,
    score: 0,
    coinsCollected: 0,
    combo: 1,
    comboTimer: 0,
    lastTime: 0,
    gridOffset: 0,
    stars: [] as { x: number; y: number; size: number; alpha: number; speed: number }[],
  });

  // 最新のPropsをuseEffectで安全に同期
  const isGameActiveRef = useRef(isGameActive);
  const timeLeftRef = useRef(timeLeft);
  const virtualDirectionRef = useRef(virtualDirection);

  useEffect(() => {
    isGameActiveRef.current = isGameActive;
  }, [isGameActive]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    virtualDirectionRef.current = virtualDirection;
  }, [virtualDirection]);

  // 初期化：星空背景
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.4 + 0.1,
      });
    }
    stateRef.current.stars = stars;
  }, []);

  // スキンの変更を反映
  useEffect(() => {
    stateRef.current.player.color = skin.color;
    stateRef.current.player.faceEmoji = skin.emoji;
  }, [skin]);

  // コイン生成ヘルパー
  const spawnCoin = useCallback((forceType?: CoinType) => {
    const margin = 50;
    const x = margin + Math.random() * (CANVAS_WIDTH - margin * 2);
    const y = margin + Math.random() * (CANVAS_HEIGHT - margin * 2);

    let type: CoinType = forceType || 'gold';
    if (!forceType) {
      const rand = Math.random();
      if (rand < 0.60) {
        type = 'gold'; // 60%
      } else if (rand < 0.80) {
        type = 'gem'; // 20%
      } else if (rand < 0.90) {
        type = 'time'; // 10%
      } else if (rand < 0.96) {
        type = 'star'; // 6%
      } else {
        type = 'spike'; // 4% (トゲ障害物)
      }
    }

    let value = 10;
    let radius = 16;
    let lifeTime: number | undefined;

    if (type === 'gem') {
      value = 30;
      radius = 18;
    } else if (type === 'star') {
      value = 50;
      radius = 20;
      lifeTime = 8000; // 8秒で消滅
    } else if (type === 'time') {
      value = 5; // +5秒
      radius = 18;
    } else if (type === 'spike') {
      value = -15;
      radius = 19;
      lifeTime = 12000;
    }

    const coin: Coin = {
      id: Math.random() + Date.now(),
      x,
      y,
      radius,
      type,
      value,
      pulsePhase: Math.random() * Math.PI * 2,
      lifeTime,
      maxLifeTime: lifeTime,
      vx: type === 'spike' ? (Math.random() - 0.5) * 1.5 : 0,
      vy: type === 'spike' ? (Math.random() - 0.5) * 1.5 : 0,
    };

    return coin;
  }, []);

  // パーティクル発生
  const createParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 4 + 2,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 25 + 20,
      });
    }
  };

  // ポップアップテキスト発生
  const createFloatingText = (x: number, y: number, text: string, color: string) => {
    stateRef.current.floatingTexts.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -2,
      scale: 1,
    });
  };

  // ゲームリセット / スタート時の初期化
  const resetGame = useCallback(() => {
    const state = stateRef.current;
    state.player.x = CANVAS_WIDTH / 2;
    state.player.y = CANVAS_HEIGHT / 2;
    state.player.trail = [];
    state.player.isHurt = false;
    state.player.hurtTimer = 0;
    state.score = 0;
    state.coinsCollected = 0;
    state.combo = 1;
    state.comboTimer = 0;
    state.particles = [];
    state.floatingTexts = [];
    state.touchTarget = null;

    // 初期コインの配置 (5個)
    const initialCoins: Coin[] = [];
    for (let i = 0; i < 5; i++) {
      initialCoins.push(spawnCoin(i === 0 ? 'gold' : undefined));
    }
    state.coins = initialCoins;
  }, [spawnCoin]);

  // ゲーム開始時の処理
  useEffect(() => {
    if (isGameActive) {
      resetGame();
      soundManager.playStart();
    }
  }, [isGameActive, resetGame]);

  // キーボードイベントリスナー
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      const k = e.key;
      if (k in stateRef.current.keys) {
        stateRef.current.keys[k as keyof typeof stateRef.current.keys] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key;
      if (k in stateRef.current.keys) {
        stateRef.current.keys[k as keyof typeof stateRef.current.keys] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // タッチ/マウスクリックでプレイヤーを追従させるイベント
  const handlePointerInteraction = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isGameActiveRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    stateRef.current.touchTarget = { x, y };
  };

  const handlePointerUp = () => {
    stateRef.current.touchTarget = null;
  };

  // メインループ
  useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      const state = stateRef.current;
      const canvas = canvasRef.current;

      if (!canvas) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(loop);
        return;
      }

      // デルタタイム算出
      if (!state.lastTime) state.lastTime = timestamp;
      const dt = Math.min((timestamp - state.lastTime) / 1000, 0.1);
      state.lastTime = timestamp;

      // 画面クリア＆背景グラデーション
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 背景の深宇宙グラデーション
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      bgGrad.addColorStop(0, '#0b0f19');
      bgGrad.addColorStop(0.5, '#111827');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 背景の星の移動と描画
      ctx.fillStyle = '#ffffff';
      state.stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > CANVAS_HEIGHT) {
          star.y = 0;
          star.x = Math.random() * CANVAS_WIDTH;
        }
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // サイバーグリッド線の描画
      state.gridOffset = (state.gridOffset + 0.3) % 40;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = state.gridOffset; y < CANVAS_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // ゲーム進行中のアップデート処理
      if (isGameActiveRef.current && timeLeftRef.current > 0) {
        const player = state.player;
        const keys = state.keys;
        const vpad = virtualDirectionRef.current;

        // キーボードまたはバーチャルパッドの入力合成
        let dx = 0;
        let dy = 0;

        if (keys.ArrowLeft || keys.a || vpad.left) dx -= 1;
        if (keys.ArrowRight || keys.d || vpad.right) dx += 1;
        if (keys.ArrowUp || keys.w || vpad.up) dy -= 1;
        if (keys.ArrowDown || keys.s || vpad.down) dy += 1;

        // タッチ/マウスクリック追従
        if (state.touchTarget && dx === 0 && dy === 0) {
          const distX = state.touchTarget.x - player.x;
          const distY = state.touchTarget.y - player.y;
          const dist = Math.sqrt(distX * distX + distY * distY);
          if (dist > 8) {
            dx = distX / dist;
            dy = distY / dist;
          } else {
            state.touchTarget = null;
          }
        }

        // 斜め移動の正規化
        if (dx !== 0 && dy !== 0 && !state.touchTarget) {
          const length = Math.sqrt(dx * dx + dy * dy);
          dx /= length;
          dy /= length;
        }

        // プレイヤー移動＆向きの判定
        if (dx < -0.1) player.facing = 'left';
        if (dx > 0.1) player.facing = 'right';

        const effectiveSpeed = player.isHurt ? player.speed * 0.5 : player.speed;
        player.x += dx * effectiveSpeed;
        player.y += dy * effectiveSpeed;

        // 画面端の制限
        player.x = Math.max(player.radius, Math.min(CANVAS_WIDTH - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(CANVAS_HEIGHT - player.radius, player.y));

        // トレイル（残像）の追加
        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
          player.trail.push({ x: player.x, y: player.y, alpha: 0.5 });
          if (player.trail.length > 7) {
            player.trail.shift();
          }
        } else if (player.trail.length > 0) {
          player.trail.shift();
        }

        // 被ダメージ状態の更新
        if (player.isHurt) {
          player.hurtTimer -= dt;
          if (player.hurtTimer <= 0) {
            player.isHurt = false;
          }
        }

        // コンボタイマーの減少
        if (state.combo > 1) {
          state.comboTimer -= dt;
          if (state.comboTimer <= 0) {
            state.combo = 1;
            onComboChange(1);
          }
        }

        // コインの出現数維持（常に最低4個、最大7個）
        if (state.coins.length < 5 && Math.random() < 0.04) {
          state.coins.push(spawnCoin());
        }

        // コインの更新と当たり判定
        for (let i = state.coins.length - 1; i >= 0; i--) {
          const coin = state.coins[i];
          coin.pulsePhase += dt * 4;

          // トゲの移動
          if (coin.type === 'spike' && coin.vx && coin.vy) {
            coin.x += coin.vx;
            coin.y += coin.vy;
            if (coin.x < 30 || coin.x > CANVAS_WIDTH - 30) coin.vx *= -1;
            if (coin.y < 30 || coin.y > CANVAS_HEIGHT - 30) coin.vy *= -1;
          }

          // 時間制限付きコインの減少
          if (coin.lifeTime !== undefined) {
            coin.lifeTime -= dt * 1000;
            if (coin.lifeTime <= 0) {
              state.coins.splice(i, 1);
              continue;
            }
          }

          // 当たり判定 (円と円の距離)
          const distSq = (player.x - coin.x) ** 2 + (player.y - coin.y) ** 2;
          const hitDist = player.radius + coin.radius;

          if (distSq <= hitDist * hitDist) {
            // トゲ（障害物）に当たった場合
            if (coin.type === 'spike') {
              soundManager.playHurt();
              createParticles(coin.x, coin.y, '#EF4444', 16);
              createFloatingText(coin.x, coin.y - 10, '-15 pt', '#EF4444');
              player.isHurt = true;
              player.hurtTimer = 0.8;
              state.combo = 1;
              onComboChange(1);
              state.score = Math.max(0, state.score - 15);
              onScoreChange(state.score, state.coinsCollected);
              state.coins.splice(i, 1);
              continue;
            }

            // コイン獲得！
            state.coinsCollected++;
            state.comboTimer = 2.5; // 2.5秒以内に次のコインを取ればコンボ継続
            const newCombo = Math.min(state.combo + 1, 5);
            state.combo = newCombo;
            onComboChange(newCombo);

            const addedScore = coin.value * newCombo;

            if (coin.type === 'gold') {
              soundManager.playCoin();
              createParticles(coin.x, coin.y, '#F59E0B', 14);
              createFloatingText(
                coin.x,
                coin.y - 10,
                newCombo > 1 ? `+${addedScore} (x${newCombo})` : `+${addedScore}`,
                '#FBBF24'
              );
            } else if (coin.type === 'gem') {
              soundManager.playSpecialCoin();
              createParticles(coin.x, coin.y, '#38BDF8', 18);
              createFloatingText(
                coin.x,
                coin.y - 10,
                `💎 +${addedScore}`,
                '#38BDF8'
              );
            } else if (coin.type === 'star') {
              soundManager.playSpecialCoin();
              createParticles(coin.x, coin.y, '#EC4899', 24);
              createFloatingText(
                coin.x,
                coin.y - 10,
                `⭐ FEVER +${addedScore}!`,
                '#F472B6'
              );
            } else if (coin.type === 'time') {
              soundManager.playTimeBonus();
              createParticles(coin.x, coin.y, '#10B981', 16);
              createFloatingText(coin.x, coin.y - 10, '+5秒 ⏱️', '#34D399');
              onTimeBonus(5);
            }

            state.score += addedScore;
            onScoreChange(state.score, state.coinsCollected);

            // コイン削除＆新コインを補充
            state.coins.splice(i, 1);
            state.coins.push(spawnCoin());
          }
        }
      }

      // コインの描画
      state.coins.forEach((coin) => {
        const pulse = Math.sin(coin.pulsePhase) * 2;
        const currentRadius = coin.radius + pulse;

        // グロー効果
        ctx.save();
        ctx.shadowBlur = 12;

        if (coin.type === 'gold') {
          ctx.shadowColor = '#F59E0B';
          // 外周リング
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#F59E0B';
          ctx.fill();

          // 内側ハイライト
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, currentRadius * 0.75, 0, Math.PI * 2);
          ctx.fillStyle = '#FDE047';
          ctx.fill();

          // コインのシンボル
          ctx.fillStyle = '#B45309';
          ctx.font = `bold ${Math.floor(currentRadius * 0.9)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('¥', coin.x, coin.y + 1);
        } else if (coin.type === 'gem') {
          ctx.shadowColor = '#06B6D4';
          // ダイヤ型を描画
          ctx.fillStyle = '#06B6D4';
          ctx.beginPath();
          ctx.moveTo(coin.x, coin.y - currentRadius * 1.1);
          ctx.lineTo(coin.x + currentRadius, coin.y);
          ctx.lineTo(coin.x, coin.y + currentRadius * 1.1);
          ctx.lineTo(coin.x - currentRadius, coin.y);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#E0F2FE';
          ctx.beginPath();
          ctx.moveTo(coin.x, coin.y - currentRadius * 0.6);
          ctx.lineTo(coin.x + currentRadius * 0.5, coin.y);
          ctx.lineTo(coin.x, coin.y + currentRadius * 0.6);
          ctx.lineTo(coin.x - currentRadius * 0.5, coin.y);
          ctx.closePath();
          ctx.fill();
        } else if (coin.type === 'star') {
          // レインボースター
          const rainbowColors = ['#F43F5E', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6'];
          const colorIndex = Math.floor((Date.now() / 200) % rainbowColors.length);
          ctx.shadowColor = rainbowColors[colorIndex];

          ctx.fillStyle = '#FDE047';
          ctx.beginPath();
          const spikes = 5;
          const outerRadius = currentRadius * 1.2;
          const innerRadius = currentRadius * 0.5;
          for (let s = 0; s < spikes * 2; s++) {
            const r = s % 2 === 0 ? outerRadius : innerRadius;
            const angle = (s * Math.PI) / spikes - Math.PI / 2;
            const sx = coin.x + Math.cos(angle) * r;
            const sy = coin.y + Math.sin(angle) * r;
            if (s === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath();
          ctx.fill();
        } else if (coin.type === 'time') {
          ctx.shadowColor = '#10B981';
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#10B981';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(coin.x, coin.y, currentRadius * 0.75, 0, Math.PI * 2);
          ctx.fillStyle = '#A7F3D0';
          ctx.fill();

          ctx.fillStyle = '#065F46';
          ctx.font = `bold ${Math.floor(currentRadius * 0.9)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⏳', coin.x, coin.y);
        } else if (coin.type === 'spike') {
          ctx.shadowColor = '#EF4444';
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#EF4444';
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${Math.floor(currentRadius)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💣', coin.x, coin.y);
        }

        // 残り時間バー（消滅するコイン用）
        if (coin.lifeTime !== undefined && coin.maxLifeTime !== undefined) {
          const ratio = coin.lifeTime / coin.maxLifeTime;
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(coin.x - 15, coin.y + currentRadius + 4, 30, 4);
          ctx.fillStyle = ratio > 0.3 ? '#34D399' : '#EF4444';
          ctx.fillRect(coin.x - 15, coin.y + currentRadius + 4, 30 * ratio, 4);
        }

        ctx.restore();
      });

      // プレイヤーのトレイル描画
      const player = state.player;
      player.trail.forEach((t, idx) => {
        const factor = (idx + 1) / player.trail.length;
        ctx.beginPath();
        ctx.arc(t.x, t.y, player.radius * factor * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = skin.secondaryColor;
        ctx.globalAlpha = 0.25 * factor;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // プレイヤー描画
      ctx.save();
      if (player.isHurt && Math.floor(Date.now() / 80) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      // プレイヤーの外周グロー
      ctx.shadowBlur = 18;
      ctx.shadowColor = skin.glowColor;

      // プレイヤー本体サークル
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = skin.color;
      ctx.fill();

      // 内側グラデーションハイライト
      const pGrad = ctx.createRadialGradient(
        player.x - player.radius * 0.3,
        player.y - player.radius * 0.3,
        player.radius * 0.1,
        player.x,
        player.y,
        player.radius
      );
      pGrad.addColorStop(0, '#ffffff');
      pGrad.addColorStop(0.3, skin.secondaryColor);
      pGrad.addColorStop(1, skin.color);
      ctx.fillStyle = pGrad;
      ctx.fill();

      // プレイヤーの顔 / 絵文字
      ctx.shadowBlur = 0;
      ctx.font = `${Math.floor(player.radius * 1.3)}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 向きに応じた反転
      if (player.facing === 'left') {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.scale(-1, 1);
        ctx.fillText(player.faceEmoji, 0, 1);
        ctx.restore();
      } else {
        ctx.fillText(player.faceEmoji, player.x, player.y + 1);
      }

      ctx.restore();

      // パーティクルの更新と描画
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;

        if (p.life >= p.maxLife) {
          state.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // フローティングテキストの更新と描画
      for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
        const ft = state.floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.02;

        if (ft.alpha <= 0) {
          state.floatingTexts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 18px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // ループ継続
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [spawnCoin, onScoreChange, onComboChange, onTimeBonus, skin]);

  // 残り時間が0になった時の紙吹雪＆サウンド
  useEffect(() => {
    if (timeLeft === 0 && isGameActive) {
      soundManager.playGameOver();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
      onGameOver();
    }
  }, [timeLeft, isGameActive, onGameOver]);

  return (
    <div className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.6)] backdrop-blur-md bg-slate-900">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full block cursor-crosshair touch-none"
        onPointerDown={handlePointerInteraction}
        onPointerMove={handlePointerInteraction}
        onPointerUp={handlePointerUp}
      />
      {children}
    </div>
  );
};
