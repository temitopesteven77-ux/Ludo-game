import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, RotateCcw, Volume2, VolumeX, Shield, Play, Pause, Skull } from 'lucide-react';
import { PlayerColor, Token, Player } from '../types';
import { PLAYERS_CONFIG, TRACK_COORDS, isCoordSafe, isStartCoord } from '../utils/board';
import ThreeDDie from './ThreeDDie';

interface GameBoardProps {
  tokens: Token[];
  players: Record<PlayerColor, Player>;
  activePlayerColor: PlayerColor;
  playableTokens: number[];
  onTokenClick: (token: Token) => void;
  diceValue: number | null;
  isRolling: boolean;
  onRollClick: () => void;
  winner: PlayerColor | null;
  hasRolled: boolean;
  isPaused?: boolean;
  onResume?: () => void;
  killMode?: boolean;
  onKillToken?: (token: Token) => void;
  onToggleKillMode?: () => void;
}

export default function GameBoard({
  tokens,
  players,
  activePlayerColor,
  playableTokens,
  onTokenClick,
  diceValue,
  isRolling,
  onRollClick,
  winner,
  hasRolled,
  isPaused = false,
  onResume,
  killMode = false,
  onKillToken,
  onToggleKillMode
}: GameBoardProps) {

  // Helper to determine coordinates for a token
  const getTokenCoords = (token: Token): [number, number] => {
    const config = players[token.color];
    switch (token.state) {
      case 'base':
        return config.baseCoords[token.id];
      case 'track':
        return TRACK_COORDS[token.trackIndex!];
      case 'homerun':
        return config.homerunCoords[token.homerunIndex!];
      case 'home':
        // Offset final pieces slightly on the triangle to look beautiful without overlapping
        const [r, c] = config.homeCenterCoord;
        const offsets = [
          [-0.2, -0.2],
          [-0.2, 0.2],
          [0.2, -0.2],
          [0.2, 0.2]
        ];
        return [r + offsets[token.id][0], c + offsets[token.id][1]];
      default:
        return [0, 0];
    }
  };

  // Group tokens currently on board (not in home or base) to see if they stack
  const getStackedTokenLayout = (token: Token) => {
    if (token.state === 'base' || token.state === 'home') {
      return { scale: 1, dx: 0, dy: 0, count: 1 };
    }

    const tCoords = getTokenCoords(token);
    // Find all tokens sharing this coordinate
    const sharing = tokens.filter((t) => {
      if (t.state === 'base' || t.state === 'home') return false;
      const otherCoords = getTokenCoords(t);
      return otherCoords[0] === tCoords[0] && otherCoords[1] === tCoords[1];
    });

    const totalCount = sharing.length;
    if (totalCount <= 1) {
      return { scale: 1, dx: 0, dy: 0, count: 1 };
    }

    // Determine sorting index among sharing elements
    const indexInStack = sharing.findIndex((t) => t.color === token.color && t.id === token.id);
    const scale = totalCount === 2 ? 0.75 : totalCount === 3 ? 0.65 : 0.55;

    // Small offsets around the center of the cell (which is 0% to 100%)
    // dx and dy are defined in percentage offsets of a board cell (-25% to +25%)
    let dx = 0;
    let dy = 0;

    if (totalCount === 2) {
      dx = indexInStack === 0 ? -15 : 15;
      dy = indexInStack === 0 ? -15 : 15;
    } else if (totalCount === 3) {
      if (indexInStack === 0) { dx = 0; dy = -18; }
      else if (indexInStack === 1) { dx = -18; dy = 15; }
      else { dx = 18; dy = 15; }
    } else {
      // 4 tokens
      dx = indexInStack === 0 || indexInStack === 2 ? -18 : 18;
      dy = indexInStack === 0 || indexInStack === 1 ? -18 : 18;
    }

    return { scale, dx, dy, count: totalCount };
  };

  // Render cells in Ludo
  const renderBoardGrid = () => {
    const gridElements: ReactNode[] = [];

    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        // Skip base quadrants, center home quadrant, since they will be overlayed separately
        if (r < 6 && c < 6) continue; // Top Left Base
        if (r < 6 && c > 8) continue; // Top Right Base
        if (r > 8 && c < 6) continue; // Bottom Left Base
        if (r > 8 && c > 8) continue; // Bottom Right Base
        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) continue; // Center Home area

        // Draw track elements
        let cellBg = 'bg-slate-100 dark:bg-slate-800';
        let isSafe = isCoordSafe(r, c);
        const startInfo = isStartCoord(r, c);

        // Color coding for Home Run and starting cells
        // Green
        if (r === 7 && c >= 1 && c <= 5) cellBg = 'bg-emerald-400 dark:bg-emerald-950/60';
        else if (startInfo.isStart && startInfo.color === 'green') cellBg = 'bg-emerald-400 dark:bg-emerald-500/70 border-emerald-600';
        // Yellow
        else if (r >= 1 && r <= 5 && c === 7) cellBg = 'bg-amber-300 dark:bg-amber-950/60';
        else if (startInfo.isStart && startInfo.color === 'yellow') cellBg = 'bg-amber-300 dark:bg-amber-400/70 border-amber-500';
        // Blue
        else if (r === 7 && c >= 9 && c <= 13) cellBg = 'bg-blue-400 dark:bg-blue-950/60';
        else if (startInfo.isStart && startInfo.color === 'blue') cellBg = 'bg-blue-400 dark:bg-blue-500/70 border-blue-600';
        // Red
        else if (r >= 9 && r <= 13 && c === 7) cellBg = 'bg-red-400 dark:bg-red-950/60';
        else if (startInfo.isStart && startInfo.color === 'red') cellBg = 'bg-red-400 dark:bg-red-500/70 border-red-600';

        // Star safe spots
        const renderStar = isSafe && !startInfo.isStart;

        gridElements.push(
          <div
            key={`cell-${r}-${c}`}
            className={`border border-slate-300 dark:border-slate-700 aspect-square flex items-center justify-center transition-all duration-300 rounded ${cellBg}`}
            style={{
              gridRowStart: r + 1,
              gridColStart: c + 1,
            }}
          >
            {renderStar && (
              <Shield className="w-4 h-4 text-amber-500 animate-pulse fill-amber-500/20" />
            )}
            {startInfo.isStart && (
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800 dark:bg-slate-200" />
            )}
          </div>
        );
      }
    }

    return gridElements;
  };

  return (
    <div className="w-full relative shadow-inner bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl p-3 md:p-5">
      
      {/* Dynamic winner celebration banner */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90 text-white rounded-3xl p-6 text-center backdrop-blur-md"
          >
            <Trophy className="w-24 h-24 text-amber-400 animate-bounce mb-4" />
            <h2 className="text-4xl font-extrabold tracking-tight mb-2">
              🏆 {players[winner].displayName} Wins!
            </h2>
            <p className="text-slate-300 mb-6 max-w-sm">
              An spectacular performance! The {players[winner].displayName} team successfully brought all 4 tokens home!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl shadow-lg shadow-amber-500/30 transition-all transform hover:scale-105"
            >
              <RotateCcw className="w-5 h-5" /> Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kill Mode Active status header warning banner */}
      <AnimatePresence>
        {killMode && !winner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-4 left-4 right-4 z-40 bg-slate-950/95 border border-red-500/50 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between text-white shadow-xl pointer-events-auto"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
              <Skull className="w-5 h-5 text-red-500 fill-red-500/10 shrink-0" />
              <div className="text-left">
                <span className="text-[10px] font-black tracking-wider text-red-400 uppercase font-mono">Assassination Weapon Active</span>
                <p className="text-[11px] text-slate-300 leading-tight">Tap any target opponent piece on the track/rest zones to instantly return them to Base yard!</p>
              </div>
            </div>
            {onToggleKillMode && (
              <button
                onClick={onToggleKillMode}
                className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1.5 bg-red-900/30 hover:bg-red-800/50 active:scale-95 text-red-400 rounded-lg border border-red-500/30 font-mono transition-colors"
              >
                Cancel
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beautiful high-contrast Game Paused overlay */}
      <AnimatePresence>
        {isPaused && !winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/95 text-white rounded-3xl p-6 text-center backdrop-blur-md border border-slate-800"
          >
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-400/30 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
              <Pause className="w-8 h-8 text-indigo-400 fill-indigo-400/10" />
            </div>
            
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">
              Game Paused
            </h2>
            
            <p className="text-slate-400 mb-6 max-w-sm text-xs font-mono tracking-wide leading-relaxed">
              The turn timer, automation bots, and board interactions are frozen.
            </p>
            
            <button
              id="paused-overlay-resume-btn"
              onClick={onResume}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer select-none"
            >
              <Play className="w-4 h-4 fill-current text-white" /> Resume Match
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LUDO BOARD - Standard 15x15 Grid wrapper */}
      <div 
        id="ludo-board"
        className="relative w-full aspect-square bg-slate-50 dark:bg-slate-950 rounded-2xl border-4 border-slate-700 dark:border-slate-800 shadow-md p-0.5 md:p-1 grid grid-cols-15 grid-rows-15"
      >
        {/* Render base quadrants */}
        {/* GREEN base (Top-Left 6x6) */}
        <div 
          className="col-span-6 row-span-6 border-2 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-3 flex flex-col items-center justify-center relative overflow-hidden group"
          style={{ gridRowStart: 1, gridColumnStart: 1 }}
        >
          <div className="absolute inset-2 border-2 border-emerald-500 rounded-xl flex items-center justify-center bg-emerald-500/10">
            <div className="w-4/5 h-4/5 rounded-lg border-2 border-emerald-500/20 bg-emerald-500/20 flex flex-wrap p-2 gap-2 items-center justify-center">
              {[0, 1, 2, 3].map((num) => (
                <div key={num} className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-inner flex items-center justify-center" />
              ))}
            </div>
          </div>
          <span className="absolute bottom-2 left-3 font-semibold text-xs tracking-wider uppercase text-emerald-600 dark:text-emerald-400">Green Base</span>
        </div>

        {/* YELLOW base (Top-Right 6x6) */}
        <div 
          className="col-span-6 row-span-6 border-2 border-amber-400/30 bg-amber-50 dark:bg-amber-950/20 p-3 flex flex-col items-center justify-center relative overflow-hidden group"
          style={{ gridRowStart: 1, gridColumnStart: 10 }}
        >
          <div className="absolute inset-2 border-2 border-amber-400 rounded-xl flex items-center justify-center bg-amber-400/10">
            <div className="w-4/5 h-4/5 rounded-lg border-2 border-amber-400/20 bg-amber-400/20 flex flex-wrap p-2 gap-2 items-center justify-center">
              {[0, 1, 2, 3].map((num) => (
                <div key={num} className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-inner flex items-center justify-center" />
              ))}
            </div>
          </div>
          <span className="absolute bottom-2 right-3 font-semibold text-xs tracking-wider uppercase text-amber-600 dark:text-amber-400">Yellow Base</span>
        </div>

        {/* RED base (Bottom-Left 6x6) */}
        <div 
          className="col-span-6 row-span-6 border-2 border-red-500/30 bg-red-50 dark:bg-red-950/20 p-3 flex flex-col items-center justify-center relative overflow-hidden group"
          style={{ gridRowStart: 10, gridColumnStart: 1 }}
        >
          <div className="absolute inset-2 border-2 border-red-500 rounded-xl flex items-center justify-center bg-red-500/10">
            <div className="w-4/5 h-4/5 rounded-lg border-2 border-red-500/20 bg-red-500/20 flex flex-wrap p-2 gap-2 items-center justify-center">
              {[0, 1, 2, 3].map((num) => (
                <div key={num} className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-inner flex items-center justify-center" />
              ))}
            </div>
          </div>
          <span className="absolute top-2 left-3 font-semibold text-xs tracking-wider uppercase text-red-600 dark:text-red-400">Red Base</span>
        </div>

        {/* BLUE base (Bottom-Right 6x6) */}
        <div 
          className="col-span-6 row-span-6 border-2 border-blue-500/30 bg-blue-50 dark:bg-blue-950/20 p-3 flex flex-col items-center justify-center relative overflow-hidden group"
          style={{ gridRowStart: 10, gridColumnStart: 10 }}
        >
          <div className="absolute inset-2 border-2 border-blue-500 rounded-xl flex items-center justify-center bg-blue-500/10">
            <div className="w-4/5 h-4/5 rounded-lg border-2 border-blue-500/20 bg-blue-500/20 flex flex-wrap p-2 gap-2 items-center justify-center">
              {[0, 1, 2, 3].map((num) => (
                <div key={num} className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-inner flex items-center justify-center" />
              ))}
            </div>
          </div>
          <span className="absolute top-2 right-3 font-semibold text-xs tracking-wider uppercase text-blue-600 dark:text-blue-400">Blue Base</span>
        </div>

        {/* CENTER QUADRANT - Joining triangles with a minimalist spin-button */}
        <div 
          className="col-span-3 row-span-3 border-2 border-slate-700 dark:border-slate-600 bg-slate-800 dark:bg-slate-900 relative"
          style={{ gridRowStart: 7, gridColumnStart: 7 }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Green (Left) */}
            <polygon points="0,0 50,50 0,100" fill="#10b981" fillOpacity="0.85" />
            {/* Yellow (Top) */}
            <polygon points="0,0 100,0 50,50" fill="#fbbf24" fillOpacity="0.85" />
            {/* Blue (Right) */}
            <polygon points="100,0 100,100 50,50" fill="#3b82f6" fillOpacity="0.85" />
            {/* Red (Bottom) */}
            <polygon points="0,100 100,100 50,50" fill="#ef4444" fillOpacity="0.85" />
            
            {/* Outer center ring */}
            <circle cx="50" cy="50" r="16" fill="#1f2937" stroke="#e2e8f0" strokeWidth="2.5" />
          </svg>

          {/* Core Dice Roller & Turn Indicator strictly in middle of board */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              id={`dice-roll-button`}
              onClick={onRollClick}
              disabled={isRolling || hasRolled || !!winner || players[activePlayerColor].type === 'computer' || isPaused}
              className={`relative flex items-center justify-center transition-all scale-95 md:scale-100 hover:scale-110 active:scale-90 select-none cursor-pointer
                ${players[activePlayerColor].type === 'computer' || isPaused ? 'pointer-events-none' : ''}
              `}
              title={isPaused ? "Game Paused" : players[activePlayerColor].type === 'human' ? 'Roll Dice' : 'Computer is playing'}
            >
              <ThreeDDie
                value={diceValue}
                isRolling={isRolling}
                colorHex={players[activePlayerColor].bgHex}
                accentHex={players[activePlayerColor].accentHex}
                size={34}
                disabled={isRolling || hasRolled || !!winner || players[activePlayerColor].type === 'computer' || isPaused}
              />
            </button>
          </div>
        </div>

        {/* Track Grid Elements */}
        {renderBoardGrid()}

        {/* FLOATING INTERACTIVE TOKENS LAYER (Coordinates resolved in percentages) */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <AnimatePresence>
            {tokens.map((token) => {
              const [row, col] = getTokenCoords(token);
              const xPercent = col * (100 / 15);
              const yPercent = row * (100 / 15);
              const config = players[token.color];

              // Stack sizing calculations
              const { scale, dx, dy, count } = getStackedTokenLayout(token);
              
              const isOpponent = token.color !== activePlayerColor;
              const isKillable = killMode && isOpponent && (token.state === 'track' || token.state === 'homerun') && !winner;
              const isPlayable = playableTokens.includes(token.id) && activePlayerColor === token.color && !isRolling && !isPaused && !killMode;
              const isClickable = isPlayable || isKillable;

              return (
                <motion.div
                  key={`token-${token.color}-${token.id}`}
                  style={{
                    position: 'absolute',
                    width: `${100 / 15}%`,
                    height: `${100 / 15}%`,
                    left: `${xPercent}%`,
                    top: `${yPercent}%`,
                  }}
                  animate={{
                    left: `${xPercent}%`,
                    top: `${yPercent}%`,
                    x: `${dx}%`,
                    y: `${dy}%`,
                    scale: scale,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 180,
                    damping: 22,
                  }}
                  className="flex items-center justify-center p-0.5"
                >
                  <button
                    disabled={!isClickable}
                    onClick={() => {
                      if (isKillable && onKillToken) {
                        onKillToken(token);
                      } else if (isPlayable) {
                        onTokenClick(token);
                      }
                    }}
                    className={`
                      w-4/5 h-4/5 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform pointer-events-auto
                      ${token.color === 'red' ? 'bg-red-500 hover:bg-red-600' : ''}
                      ${token.color === 'green' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                      ${token.color === 'yellow' ? 'bg-amber-400 hover:bg-amber-500' : ''}
                      ${token.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                      ${isPlayable ? 'cursor-pointer active:scale-125 hover:scale-110 border-slate-800' : ''}
                      ${isKillable ? 'cursor-crosshair hover:scale-125 hover:rotate-12 border-red-600 ring-4 ring-rose-500/80 animate-bounce relative z-50' : 'border-slate-800'}
                      ${!isClickable ? 'cursor-default' : ''}
                    `}
                    style={{
                      borderColor: isKillable ? '#dc2626' : config.accentHex,
                      boxShadow: isPlayable 
                        ? `0 0 15px 4px ${config.bgHex}` 
                        : isKillable 
                          ? '0 0 20px 6px #f43f5e' 
                          : '0 3px 6px rgba(0,0,0,0.35)'
                    }}
                  >
                    {/* Interior decorative circle */}
                    <div className="w-3/5 h-3/5 rounded-full bg-white/35 flex items-center justify-center border border-white/20 select-none">
                      {isKillable ? (
                        <Skull className="w-3 h-3 text-red-600 fill-red-600/10 animate-pulse" />
                      ) : token.state === 'home' ? (
                        <Trophy className="w-3.5 h-3.5 text-white fill-amber-400 stroke-amber-500" />
                      ) : (
                        <span className="text-[10px] font-extrabold text-slate-900 pointer-events-none">
                          {token.id + 1}
                        </span>
                      )}
                    </div>

                    {/* Active shield badge icon overlay! */}
                    {token.shieldTurnsRemaining !== undefined && token.shieldTurnsRemaining > 0 && (
                      <span className="absolute -top-2.5 -right-2.5 p-0.5 rounded-full bg-slate-900 border border-emerald-400 text-emerald-400 shadow-md flex items-center justify-center animate-bounce pointer-events-none z-30">
                        <Shield className="w-2.5 h-2.5 fill-emerald-400/20" />
                      </span>
                    )}

                    {/* Highly polished target indicator glow for human play */}
                    {isPlayable && (
                      <span className="absolute -inset-1.5 rounded-full border border-dashed animate-spin border-white pointer-events-none opacity-80" />
                    )}
                    {isPlayable && (
                      <span className="absolute -inset-1 rounded-full border-2 border-slate-50 opacity-40 animate-ping pointer-events-none" />
                    )}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
