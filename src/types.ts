export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export type PlayerType = 'human' | 'computer' | 'none';

export interface SuperPower {
  id: string; // 'phoenix' | 'titan' | 'lightning' | 'hydra'
  name: string;
  description: string;
  isUsed: boolean;
  iconName: string;
}

export interface Player {
  color: PlayerColor;
  displayName: string;
  type: PlayerType;
  startTrackIndex: number;
  endTrackIndex: number;
  homerunCoords: [number, number][];
  safeTrackIndices: number[];
  baseCoords: [number, number][];
  homeCenterCoord: [number, number];
  colorClass: string;
  bgHex: string;
  accentHex: string;
  superPower: SuperPower;
}

export type TokenState = 'base' | 'track' | 'homerun' | 'home';

export interface Token {
  id: number; // 0, 1, 2, 3
  color: PlayerColor;
  state: TokenState;
  // If state is 'track', this is index in TRACK_COORDS (0 to 51)
  trackIndex: number | null;
  // If state is 'homerun', this is index in color's homerunCoords (0 to 4)
  homerunIndex: number | null;
  shieldTurnsRemaining?: number; // Token has an active shield protecting it from capture!
}

export interface GameLog {
  id: string;
  timestamp: string;
  color?: PlayerColor;
  text: string;
}

export interface GameStats {
  rolls: number;
  sixes: number;
  captures: number;
  homeRuns: number;
}
