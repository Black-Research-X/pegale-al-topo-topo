export type MoleType = 'NORMAL' | 'GOLDEN' | 'BOMB' | 'NINJA' | 'HELMET' | 'FROZEN';

export type MoleState = 'HIDDEN' | 'EMERGING' | 'UP' | 'HIT' | 'RETREATING';

export type GameMode = 'TIME_ATTACK' | 'SURVIVAL' | 'FRENZY';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type HammerId = 'WOODEN' | 'TOY' | 'GOLDEN' | 'CYBER';

export interface HammerConfig {
  id: HammerId;
  name: string;
  description: string;
  headColor: string;
  handleColor: string;
  glowColor: string;
  soundType: 'whack' | 'squeak' | 'golden' | 'cyber';
  unlockedByDefault: boolean;
  requiredScore?: number;
}

export interface MoleData {
  id: number;
  index: number;
  type: MoleType;
  state: MoleState;
  hitsLeft: number;
  maxHits: number;
  emergeTimestamp: number;
  durationMs: number;
  keyLabel: string;
}

export interface FloatingTextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface ParticleItem {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  shape: 'circle' | 'star' | 'dirt';
}

export interface ScoreRecord {
  id: string;
  playerName: string;
  score: number;
  mode: GameMode;
  difficulty: Difficulty;
  accuracy: number;
  maxCombo: number;
  molesHit: number;
  date: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface GameStats {
  molesHitTotal: number;
  normalHits: number;
  goldenHits: number;
  ninjaHits: number;
  helmetHits: number;
  frozenHits: number;
  bombsAvoided: number;
  bombsHit: number;
  totalSwings: number;
  hits: number;
  misses: number;
  maxCombo: number;
}

export const HAMMERS: Record<HammerId, HammerConfig> = {
  WOODEN: {
    id: 'WOODEN',
    name: 'Mazo de Roble Clásico',
    description: 'El clásico y confiable mazo de madera de feria.',
    headColor: '#854d0e',
    handleColor: '#d97706',
    glowColor: 'rgba(180, 83, 9, 0.4)',
    soundType: 'whack',
    unlockedByDefault: true,
  },
  TOY: {
    id: 'TOY',
    name: 'Mazo de Goma Chillón',
    description: 'Chilla con cada golpe y da una sensación ultra divertida.',
    headColor: '#ef4444',
    handleColor: '#fbbf24',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    soundType: 'squeak',
    unlockedByDefault: true,
  },
  GOLDEN: {
    id: 'GOLDEN',
    name: 'Martillo Real de Oro',
    description: 'Forjado para los campeones del jardín. ¡Brilla con grandeza!',
    headColor: '#f59e0b',
    handleColor: '#78350f',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    soundType: 'golden',
    unlockedByDefault: false,
    requiredScore: 3000,
  },
  CYBER: {
    id: 'CYBER',
    name: 'Martillo Neón Sónico',
    description: 'Tecnología electro-sónica de impacto fulminante.',
    headColor: '#06b6d4',
    handleColor: '#1e293b',
    glowColor: 'rgba(6, 182, 212, 0.6)',
    soundType: 'cyber',
    unlockedByDefault: false,
    requiredScore: 6000,
  },
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'FIRST_HIT',
    title: '¡Primer Martillazo!',
    description: 'Golpea a tu primer topo con éxito.',
    icon: '🔨',
    unlocked: false,
  },
  {
    id: 'GOLD_HUNTER',
    title: 'Cazador de Oro',
    description: 'Atrapa a 3 topos dorados en una misma partida.',
    icon: '👑',
    unlocked: false,
  },
  {
    id: 'COMBO_KING',
    title: 'Racha de Fuego',
    description: 'Alcanza un combo x10 sin fallar ningún golpe.',
    icon: '🔥',
    unlocked: false,
  },
  {
    id: 'SHARPSHOOTER',
    title: 'Ojo de Halcón',
    description: 'Termina una partida con más del 85% de precisión.',
    icon: '🎯',
    unlocked: false,
  },
  {
    id: 'DEFUSER',
    title: 'Artificiero Experto',
    description: 'Juega una partida completa en Modo Supervivencia sin tocar dinamita.',
    icon: '💣',
    unlocked: false,
  },
  {
    id: 'SCORE_5000',
    title: 'Leyenda del Arcade',
    description: 'Consigue más de 5,000 puntos en cualquier modalidad.',
    icon: '🏆',
    unlocked: false,
  },
];
