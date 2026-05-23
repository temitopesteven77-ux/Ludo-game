import { Player, PlayerColor } from '../types';

export const TRACK_COORDS: [number, number][] = [
  // Left arm top row: index 0 to 5
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Top arm left col: index 6 to 11
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  // Top arm cap: index 12
  [0, 7],
  // Top arm right col: index 13 to 18
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // Right arm top row: index 19 to 24
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  // Right arm cap: index 25
  [7, 14],
  // Right arm bottom row: index 26 to 31
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // Bottom arm right col: index 32 to 37
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  // Bottom arm cap: index 38
  [14, 7],
  // Bottom arm left col: index 39 to 44
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Left arm bottom row: index 45 to 50
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  // Left arm cap: index 51
  [7, 0]
];

// Helper to determine starting coordinates inside base for token 0,1,2,3
export const BASE_COORDS: Record<PlayerColor, [number, number][]> = {
  green: [
    [1.5, 1.5], [1.5, 3.5],
    [3.5, 1.5], [3.5, 3.5]
  ],
  yellow: [
    [1.5, 10.5], [1.5, 12.5],
    [3.5, 10.5], [3.5, 12.5]
  ],
  blue: [
    [10.5, 10.5], [10.5, 12.5],
    [12.5, 10.5], [12.5, 12.5]
  ],
  red: [
    [10.5, 1.5], [10.5, 3.5],
    [12.5, 1.5], [12.5, 3.5]
  ]
};

// Players definitions with starting coordinates, colors, tracks, homerun and center goals
export const PLAYERS_CONFIG: Record<PlayerColor, Player> = {
  green: {
    color: 'green',
    displayName: 'Green',
    type: 'computer',
    startTrackIndex: 2, // starts at (6, 2)
    endTrackIndex: 0,   // enters homerun at (6, 0) next step
    safeTrackIndices: [2, 10, 15, 23, 28, 36, 41, 49],
    baseCoords: BASE_COORDS.green,
    homerunCoords: [
      [7, 1], [7, 2], [7, 3], [7, 4], [7, 5]
    ],
    homeCenterCoord: [7, 5.8],
    colorClass: 'bg-emerald-500 border-emerald-700 text-emerald-900 shadow-emerald-500/30',
    bgHex: '#10b981', // emerald-500
    accentHex: '#047857', // emerald-700
    superPower: {
      id: 'titan',
      name: 'Titan Grip',
      description: 'Activates iron shield! Protects all your track tokens from capture for 2 turns.',
      isUsed: false,
      iconName: 'ShieldAlert'
    }
  },
  yellow: {
    color: 'yellow',
    displayName: 'Yellow',
    type: 'computer',
    startTrackIndex: 15, // starts at (2, 8)
    endTrackIndex: 13,   // enters homerun at (0, 8) next step
    safeTrackIndices: [2, 10, 15, 23, 28, 36, 41, 49],
    baseCoords: BASE_COORDS.yellow,
    homerunCoords: [
      [1, 7], [2, 7], [3, 7], [4, 7], [5, 7]
    ],
    homeCenterCoord: [5.8, 7],
    colorClass: 'bg-amber-400 border-amber-600 text-amber-950 shadow-amber-400/30',
    bgHex: '#fbbf24', // amber-400
    accentHex: '#d97706', // amber-600
    superPower: {
      id: 'lightning',
      name: 'Electric Storm',
      description: 'Lightning speed! Instantly charges your die with +2 bonus value on your next roll.',
      isUsed: false,
      iconName: 'Zap'
    }
  },
  blue: {
    color: 'blue',
    displayName: 'Blue',
    type: 'computer',
    startTrackIndex: 28, // starts at (8, 12)
    endTrackIndex: 26,   // enters homerun at (8, 14) next step
    safeTrackIndices: [2, 10, 15, 23, 28, 36, 41, 49],
    baseCoords: BASE_COORDS.blue,
    homerunCoords: [
      [7, 13], [7, 12], [7, 11], [7, 10], [7, 9]
    ],
    homeCenterCoord: [7, 8.2],
    colorClass: 'bg-blue-500 border-blue-700 text-blue-900 shadow-blue-500/30',
    bgHex: '#3b82f6', // blue-500
    accentHex: '#1d4ed8', // blue-700
    superPower: {
      id: 'hydra',
      name: 'Hydra Surge',
      description: 'Tidewater surge! Allows you to launch an additional free action-packed dice roll!',
      isUsed: false,
      iconName: 'Sparkles'
    }
  },
  red: {
    color: 'red',
    displayName: 'Red',
    type: 'human',
    startTrackIndex: 41, // starts at (12, 6)
    endTrackIndex: 39,   // enters homerun at (14, 6) next step
    safeTrackIndices: [2, 10, 15, 23, 28, 36, 41, 49],
    baseCoords: BASE_COORDS.red,
    homerunCoords: [
      [13, 7], [12, 7], [11, 7], [10, 7], [9, 7]
    ],
    homeCenterCoord: [8.2, 7],
    colorClass: 'bg-red-500 border-red-700 text-red-900 shadow-red-500/30',
    bgHex: '#ef4444', // red-500
    accentHex: '#b91c1c', // red-700
    superPower: {
      id: 'phoenix',
      name: 'Phoenix Strike',
      description: 'Fiery rebirth! Instantly frees a trapped token from your base yard straight onto the track.',
      isUsed: false,
      iconName: 'Flame'
    }
  }
};

export const COLOR_ORDER: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

// Helper to check if a coordination is a safe cell
export function isCoordSafe(row: number, col: number): boolean {
  // Safe track indices translate to specific coordinate points:
  const safeCoords = [
    [6, 2], [1, 6], [2, 8], [6, 13],
    [8, 12], [13, 8], [12, 6], [8, 1]
  ];
  return safeCoords.some(([r, c]) => r === row && c === col);
}

// Check if a cell is a main starting cell for any color
export function isStartCoord(row: number, col: number): { isStart: boolean; color?: PlayerColor } {
  if (row === 12 && col === 6) return { isStart: true, color: 'red' };
  if (row === 6 && col === 2) return { isStart: true, color: 'green' };
  if (row === 2 && col === 8) return { isStart: true, color: 'yellow' };
  if (row === 8 && col === 12) return { isStart: true, color: 'blue' };
  return { isStart: false };
}
