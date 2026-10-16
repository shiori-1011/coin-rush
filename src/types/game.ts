export type CoinType = 'gold' | 'gem' | 'star' | 'time' | 'spike';

export interface Coin {
  id: number;
  x: number;
  y: number;
  radius: number;
  type: CoinType;
  value: number;
  pulsePhase: number;
  lifeTime?: number; // 特定のボーナスコインが消えるまでの時間
  maxLifeTime?: number;
  vx?: number;
  vy?: number;
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  speed: number;
  color: string;
  faceEmoji: string;
  facing: 'left' | 'right';
  trail: { x: number; y: number; alpha: number }[];
  isHurt: boolean;
  hurtTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  scale: number;
}

export type GameStatus = 'ready' | 'playing' | 'paused' | 'gameover';

export interface CharacterSkin {
  id: string;
  name: string;
  emoji: string;
  color: string;
  secondaryColor: string;
  glowColor: string;
}
