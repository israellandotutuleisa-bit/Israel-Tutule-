export type ScenarioId = 'benfica' | 'talatona' | 'kinaxixi' | 'ilha';

export interface ScenarioConfig {
  id: ScenarioId;
  name: string;
  subtitle: string;
  distanceThreshold: number; // in meters to unlock/switch
  skyGradient: [string, string];
  groundColor: string;
  roadColor: string;
  laneLineColor: string;
  kerbColor: string;
  horizonColor: string;
  buildingPalette: string[];
  features: string[]; // e.g. "Poeira & Asfalto Quente", "Prédios Espelhados & Palmeiras", etc.
  ambientNote: string;
}

export type ObstacleType = 'candongueiro' | 'buraco' | 'policia' | 'contas';

export type PowerUpType = 'shield' | 'turbo' | 'multiplier';

export interface ActivePowerUp {
  type: PowerUpType;
  duration: number; // remaining seconds
  totalDuration: number;
}

export interface PlayerCharacter {
  id: string;
  name: string;
  nickname: string;
  description: string;
  price: number;
  unlocked: boolean;
  colorScheme: {
    shirt: string;
    pants: string;
    hat: string;
    skin: string;
    accent: string;
    glasses?: string;
  };
  specialBonus: string;
}

export interface Obstacle {
  id: number;
  type: ObstacleType;
  lane: -1 | 0 | 1; // Left, Middle, Right
  z: number; // Distance ahead on the track (e.g. 20 to 500)
  speed: number; // Some candongueiros drive toward the player
  width: number;
  height: number;
  hit: boolean;
  canJumpOver: boolean;
  canSlideUnder: boolean;
  nameTag?: string; // e.g. "FATURA DA LUZ", "MULTA 5000 Kz"
}

export interface CollectibleItem {
  id: number;
  type: 'kwanza' | PowerUpType;
  lane: -1 | 0 | 1;
  z: number;
  yOffset?: number;
  collected: boolean;
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
  text?: string;
}

export interface GameState {
  score: number;
  distance: number; // in meters
  kwanzas: number; // run currency
  totalKwanzas: number; // saved wallet
  speed: number; // road scrolling speed
  lane: -1 | 0 | 1;
  targetLane: -1 | 0 | 1;
  laneTransition: number; // -1 to 1 interpolation
  isJumping: boolean;
  jumpY: number; // vertical height offset
  isSliding: boolean;
  slideProgress: number; // 0 to 1
  activePowerUps: { [key in PowerUpType]?: ActivePowerUp };
  currentScenario: ScenarioId;
  scenarioDistance: number;
  health: number;
  maxHealth: number;
  shieldActive: boolean;
  multiplier: number;
  isTurbo: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  deathReason: string;
  showArrived: boolean;
}

export interface HighScoreRecord {
  score: number;
  distance: number;
  date: string;
  character: string;
  scenario: string;
}
