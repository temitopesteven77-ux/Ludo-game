import { Flame, Shield, Zap, Sparkles, Volume2, Play } from 'lucide-react';
import { PlayerColor, Player } from '../types';
import { audio } from '../utils/audio';

interface SoundPowerPanelProps {
  players: Record<PlayerColor, Player>;
  activePlayerColor: PlayerColor;
  onTriggerPower: (color: PlayerColor) => void;
  stepSoundType: 'chime' | 'bubble' | 'retro' | 'clack';
  onChangeStepSound: (type: 'chime' | 'bubble' | 'retro' | 'clack') => void;
  isRolling: boolean;
  isMoving: boolean;
  winner: PlayerColor | null;
  isPaused?: boolean;
}

export default function SoundPowerPanel({
  players,
  activePlayerColor,
  onTriggerPower,
  stepSoundType,
  onChangeStepSound,
  isRolling,
  isMoving,
  winner,
  isPaused = false
}: SoundPowerPanelProps) {

  // List of available step sounds
  const soundTypes = [
    { id: 'chime', label: 'Classic Chime', desc: 'Satisfying high frequency bell chime' },
    { id: 'bubble', label: 'Bubble Pop', desc: 'Warm organic bubbles popping' },
    { id: 'retro', label: '8-Bit Laser', desc: 'Nostalgic quick arcade pulse' },
    { id: 'clack', label: 'Heavy Clack', desc: 'Wood block physical strike' }
  ] as const;

  const testPlaySound = (id: 'chime' | 'bubble' | 'retro' | 'clack') => {
    audio.playWalk(id);
  };

  const getPowerIcon = (iconName: string, color: PlayerColor) => {
    const cls = color === 'red' ? 'text-red-500' : 
                color === 'green' ? 'text-emerald-500' :
                color === 'yellow' ? 'text-amber-500' : 'text-blue-500';
    switch (iconName) {
      case 'Flame': return <Flame className={`w-5 h-5 ${cls}`} />;
      case 'ShieldAlert': return <Shield className={`w-5 h-5 ${cls}`} />;
      case 'Zap': return <Zap className={`w-5 h-5 ${cls}`} />;
      case 'Sparkles': return <Sparkles className={`w-5 h-5 ${cls}`} />;
      default: return <Volume2 className={`w-5 h-5 ${cls}`} />;
    }
  };

  return (
    <div id="sound-power-panel" className="bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
      
      {/* SECTION 1: Step Sounds List */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Volume2 className="w-5 h-5 text-indigo-500 animate-pulse" />
          <h3 className="font-extrabold text-[14px] uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Step Sound Engine
          </h3>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-normal">
          Customize the synthesized walks. Press play to preview or click list items to select:
        </p>

        <div className="flex flex-col gap-2">
          {soundTypes.map((sound) => {
            const isActive = stepSoundType === sound.id;
            return (
              <div 
                key={sound.id}
                onClick={() => {
                  if (isPaused) return;
                  onChangeStepSound(sound.id);
                  testPlaySound(sound.id);
                }}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 group
                  ${isActive 
                    ? 'bg-indigo-50 border-indigo-400 dark:bg-indigo-950/20 dark:border-indigo-800' 
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }
                  ${isPaused ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
                `}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {sound.label}
                    </span>
                    {isActive && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    {sound.desc}
                  </p>
                </div>

                <button
                  disabled={isPaused}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPaused) return;
                    testPlaySound(sound.id);
                  }}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700 hover:scale-110 active:scale-90 transition-all text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 disabled:opacity-50 disabled:pointer-events-none"
                  title="Test Sound"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-slate-100 dark:bg-slate-800" />

      {/* SECTION 2: House Super Powers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-bounce" />
            <h3 className="font-extrabold text-[14px] uppercase tracking-wider text-slate-900 dark:text-slate-100">
              House Super Powers
            </h3>
          </div>
          <span className="text-[9px] font-mono font-bold uppercase rounded-lg bg-indigo-500/10 text-indigo-500 px-2 py-0.5 border border-indigo-500/20">
            One-Time Use
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-normal">
          Each legendary house possesses a special superpower capability to turn the tide. Activated during active turns.
        </p>

        <div className="grid grid-cols-1 gap-3">
          {(['red', 'green', 'yellow', 'blue'] as PlayerColor[]).map((col) => {
            const player = players[col];
            if (player.type === 'none') return null;

            const isPowerUsed = player.superPower.isUsed;
            const isActiveColor = activePlayerColor === col;
            const canTrigger = isActiveColor && !isPowerUsed && !isRolling && !isMoving && !winner && player.type === 'human' && !isPaused;

            return (
              <div 
                key={col}
                className={`p-3.5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between gap-3
                  ${isActiveColor 
                    ? 'border-indigo-400 dark:border-indigo-800 shadow-sm' 
                    : 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-850/60'
                  }
                `}
              >
                {/* Active highlight background glow */}
                {isActiveColor && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-50 to-indigo-500/10 dark:from-indigo-950/20 dark:to-transparent rounded-bl-full pointer-events-none" />
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800 shadow-sm">
                      {getPowerIcon(player.superPower.iconName, col)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {player.superPower.name}
                        </span>
                        <span className={`text-[8px] font-mono font-bold px-1 rounded uppercase tracking-wider border
                          ${isPowerUsed 
                            ? 'bg-red-50 text-red-500 border-red-200 dark:bg-red-950/20 dark:border-red-900/40' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40'
                          }
                        `}>
                          {isPowerUsed ? 'Spent' : 'Ready'}
                        </span>
                      </div>
                      <p className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500">
                        House {player.displayName} // {player.type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-350 leading-normal pl-0.5">
                  {player.superPower.description}
                </p>

                {/* Activation button */}
                <button
                  disabled={!canTrigger}
                  onClick={() => onTriggerPower(col)}
                  className={`w-full py-1.5 px-3 rounded-xl font-bold text-xs select-none transition-all duration-300 shadow-md flex items-center justify-center gap-1.5
                    ${canTrigger 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-600/20 hover:shadow-indigo-600/30 cursor-pointer animate-pulse'
                      : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-650 shadow-none cursor-not-allowed'
                    }
                  `}
                >
                  {isPowerUsed ? 'Power Spent' : isActiveColor && player.type === 'computer' ? 'AI Auto Power' : 'Tap to Trigger Power'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
