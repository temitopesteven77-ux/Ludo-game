import { PlayerColor, Player, PlayerType, GameStats } from '../types';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Shield, User, Monitor, EyeOff, Trophy, Flame, Skull } from 'lucide-react';
import { audio } from '../utils/audio';
import { useState } from 'react';
import ThreeDDie from './ThreeDDie';

interface GameControlsProps {
  players: Record<PlayerColor, Player>;
  activePlayerColor: PlayerColor;
  onUpdatePlayerType: (color: PlayerColor, type: PlayerType) => void;
  onRestart: () => void;
  stats: Record<PlayerColor, GameStats>;
  diceValue: number | null;
  isRolling: boolean;
  onRollClick: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  consecutiveSixes: number;
  timeLeft: number;
  isPaused: boolean;
  onTogglePause: () => void;
  killMode?: boolean;
  onToggleKillMode?: () => void;
}

export default function GameControls({
  players,
  activePlayerColor,
  onUpdatePlayerType,
  onRestart,
  stats,
  diceValue,
  isRolling,
  onRollClick,
  soundEnabled,
  onToggleSound,
  consecutiveSixes,
  timeLeft,
  isPaused,
  onTogglePause,
  killMode = false,
  onToggleKillMode
}: GameControlsProps) {

  // Visual Die Dot Mapping based on die value (1 to 6)
  const getDieDots = (num: number) => {
    switch (num) {
      case 1: return [[50, 50]];
      case 2: return [[25, 25], [75, 75]];
      case 3: return [[25, 25], [50, 50], [75, 75]];
      case 4: return [[25, 25], [25, 75], [75, 25], [75, 75]];
      case 5: return [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]];
      case 6: return [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]];
      default: return [];
    }
  };

  return (
    <div className="flex flex-col gap-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-lg">
      
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Ludo</h1>
          <p className="text-xs text-slate-500 font-mono">Modern Classic Digital Board</p>
        </div>
        
        {/* Dynamic sounds, pause/resume, and restart buttons */}
        <div className="flex gap-2">
          <button
            id="sound-toggle-btn"
            onClick={onToggleSound}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
            title={soundEnabled ? "Mute audio" : "Unmute audio"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-500" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>
          <button
            id="pause-game-btn"
            onClick={onTogglePause}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isPaused 
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md animate-pulse' 
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300'
            }`}
            title={isPaused ? "Resume Game" : "Pause Game"}
          >
            {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            id="kill-mode-toggle-btn"
            onClick={onToggleKillMode}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              killMode 
                ? 'bg-rose-500 hover:bg-rose-600 border-rose-400 text-white shadow-md animate-pulse' 
                : 'bg-slate-100 hover:bg-rose-50 border-transparent dark:bg-slate-800 dark:hover:bg-rose-950/20 text-slate-600 dark:text-slate-300 hover:text-rose-600'
            }`}
            title={killMode ? "Cancel Assassination" : "Sandbox Kill Weapon (Assassination)"}
          >
            <Skull className="w-5 h-5" />
          </button>
          <button
            id="restart-game-btn"
            onClick={onRestart}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
            title="Reset Game"
          >
            <RotateCcw className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Large visual Dice dashboard widget for tactile rolls */}
      <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-900 flex flex-col items-center justify-center gap-4 relative overflow-hidden group">
        <div className="absolute top-2 left-3 font-mono text-[10px] text-slate-400 uppercase tracking-widest">Interactive Roller</div>
        
        {/* Playable instructions popup */}
        {players[activePlayerColor].type === 'human' && (
          <div className="absolute top-2 right-3 flex items-center gap-1 text-[10px] text-emerald-500 animate-pulse font-mono tracking-widest">
            <span>YOUR TURN</span>
          </div>
        )}

        {/* Dynamic 3D CSS dice projection */}
        <button
          id="dashboard-roll-die-btn"
          disabled={isRolling || players[activePlayerColor].type === 'computer' || isPaused}
          onClick={onRollClick}
          className={`relative cursor-pointer outline-none transition-all flex items-center justify-center select-none
            ${players[activePlayerColor].type === 'computer' || isPaused ? 'pointer-events-none' : ''}
          `}
        >
          <ThreeDDie
            value={diceValue}
            isRolling={isRolling}
            colorHex={players[activePlayerColor].bgHex}
            accentHex={players[activePlayerColor].accentHex}
            size={64}
            disabled={isRolling || players[activePlayerColor].type === 'computer' || isPaused}
          />
        </button>

        {/* Rolling Status label */}
        <div className="text-center">
          <p className="text-xs text-slate-400 font-mono mb-1">
            Current turn: <span className="font-bold underline uppercase" style={{ color: players[activePlayerColor].bgHex }}>{players[activePlayerColor].displayName}</span>
          </p>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {isRolling ? (
              <span className="text-indigo-500 font-mono">Rolling Virtual Die...</span>
            ) : diceValue ? (
              <span>Rolled a <span className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">{diceValue}</span></span>
            ) : (
              <span className="text-slate-500">Click to Roll</span>
            )}
          </h3>

          {/* Consecutive sixes alarm warning! */}
          {consecutiveSixes > 0 && (
            <div className="mt-2 flex items-center justify-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 rounded-full font-mono animate-pulse">
              <Flame className="w-3.5 h-3.5 fill-amber-500/10" />
              <span>Consecutive Sixes: {consecutiveSixes}</span>
            </div>
          )}

          {/* Fully styled turn timer bar for human players */}
          {players[activePlayerColor].type === 'human' && (
            <div className="w-48 mt-4 mx-auto animate-fade-in">
              <div className="flex justify-between items-center mb-1 text-[10px] font-mono font-bold">
                <span className={timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-slate-400'}>
                  {timeLeft <= 10 ? '🚨 TIME LOW' : '⏱️ TIMER LIMIT'}
                </span>
                <span className={timeLeft <= 10 ? 'text-red-500 font-extrabold text-[11px] animate-bounce' : 'text-slate-600 dark:text-slate-300 font-bold'}>
                  {timeLeft}s
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                    timeLeft <= 10 
                      ? 'bg-red-500' 
                      : timeLeft <= 18 
                        ? 'bg-amber-400' 
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Players Setup Area */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">Players configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(players) as PlayerColor[]).map((color) => {
            const player = players[color];
            const isActive = color === activePlayerColor;
            const cardStats = stats[color];

            const colorsMap = {
              red: 'hover:border-red-400 bg-red-500/5',
              green: 'hover:border-emerald-400 bg-emerald-500/5',
              yellow: 'hover:border-amber-400 bg-amber-500/5',
              blue: 'hover:border-blue-400 bg-blue-500/5'
            };

            return (
              <div
                key={color}
                className={`flex flex-col border border-slate-100 dark:border-slate-800/80 p-3 rounded-2xl transition-all ${colorsMap[color]}
                  ${isActive ? 'ring-2' : ''}
                `}
                style={{
                  ringColor: player.bgHex,
                  borderColor: isActive ? player.bgHex : undefined
                }}
              >
                {/* Header line with Indicator */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border shadow-sm" style={{ backgroundColor: player.bgHex, borderColor: player.accentHex }} />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{player.displayName}</span>
                  </div>
                  
                  {/* Active Indicator Label */}
                  {isActive && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-800 dark:bg-slate-200 text-slate-100 dark:text-slate-900 font-mono tracking-wider uppercase">Active</span>
                  )}
                </div>

                {/* Switcher Controls of type: human / computer / none */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 max-w-full">
                  <button
                    disabled={isPaused}
                    onClick={() => !isPaused && onUpdatePlayerType(color, 'human')}
                    className={`flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer select-none
                      ${player.type === 'human'
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-400 hover:text-slate-600'
                      }
                      ${isPaused ? 'opacity-40 pointer-events-none cursor-not-allowed' : ''}
                    `}
                    title="Play manually"
                  >
                    <User className="w-3 h-3" />
                    <span>User</span>
                  </button>

                  <button
                    disabled={isPaused}
                    onClick={() => !isPaused && onUpdatePlayerType(color, 'computer')}
                    className={`flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer select-none
                      ${player.type === 'computer'
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-400 hover:text-slate-600'
                      }
                      ${isPaused ? 'opacity-40 pointer-events-none cursor-not-allowed' : ''}
                    `}
                    title="Assign smart bot"
                  >
                    <Monitor className="w-3 h-3" />
                    <span>Bot</span>
                  </button>

                  <button
                    disabled={isPaused}
                    onClick={() => !isPaused && onUpdatePlayerType(color, 'none')}
                    className={`flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer select-none
                      ${player.type === 'none'
                        ? 'bg-slate-200 dark:bg-slate-850 text-slate-900 dark:text-white border-2 border-slate-400'
                        : 'text-slate-400 hover:text-slate-600'
                      }
                      ${isPaused ? 'opacity-40 pointer-events-none cursor-not-allowed' : ''}
                    `}
                    title="Disable player slot"
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Off</span>
                  </button>
                </div>

                {/* Score Stats sub-panel */}
                <div className="grid grid-cols-3 gap-1 grid-flow-row mt-2 text-[10px] font-mono text-slate-500">
                  <div className="text-center bg-slate-50/50 dark:bg-slate-950 p-1 rounded">
                    <span className="block text-slate-400 font-bold mb-0.5">Sixes</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">{cardStats.sixes}</span>
                  </div>
                  <div className="text-center bg-slate-50/50 dark:bg-slate-950 p-1 rounded">
                    <span className="block text-slate-400 font-bold mb-0.5">Captures</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">{cardStats.captures}</span>
                  </div>
                  <div className="text-center bg-slate-50/50 dark:bg-slate-950 p-1 rounded">
                    <span className="block text-slate-400 font-bold mb-0.5">Home</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">{cardStats.homeRuns}/4</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
