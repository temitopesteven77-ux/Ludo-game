import { useState, useEffect } from 'react';
import { PlayerColor, Token, Player, GameLog, GameStats, PlayerType } from './types';
import { PLAYERS_CONFIG, COLOR_ORDER, isCoordSafe } from './utils/board';
import { audio } from './utils/audio';
import GameBoard from './components/GameBoard';
import GameControls from './components/GameControls';
import GameLogs from './components/GameLogs';
import SoundPowerPanel from './components/SoundPowerPanel';
import GoogleFormsManager from './components/GoogleFormsManager';
import { Shield, Sparkles, Trophy, HelpCircle, Gamepad2, Info } from 'lucide-react';

export default function App() {
  // Game Setup & Status
  const [players, setPlayers] = useState<Record<PlayerColor, Player>>(PLAYERS_CONFIG);
  const [activePlayerColor, setActivePlayerColor] = useState<PlayerColor>('red');
  const [winner, setWinner] = useState<PlayerColor | null>(null);

  // Sound enablement state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Tokens (16 pieces across 4 colors)
  const [tokens, setTokens] = useState<Token[]>(() => {
    const initial: Token[] = [];
    COLOR_ORDER.forEach((color) => {
      for (let i = 0; i < 4; i++) {
        initial.push({
          id: i,
          color,
          state: 'base',
          trackIndex: null,
          homerunIndex: null,
        });
      }
    });
    return initial;
  });

  // Dice states
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [playableTokens, setPlayableTokens] = useState<number[]>([]);

  // Locks to prevent conflicting actions during stepping animations
  const [isMoving, setIsMoving] = useState<boolean>(false);

  // Turn time tracking state (30 seconds limit)
  const [timeLeft, setTimeLeft] = useState<number>(30);

  // Game active paused status
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Sandbox instant-kill weapon state
  const [killMode, setKillMode] = useState<boolean>(false);

  // Super Power State variables
  const [electricStormActive, setElectricStormActive] = useState<boolean>(false);
  const [activePowerUpAnimation, setActivePowerUpAnimation] = useState<{ color: PlayerColor; name: string } | null>(null);

  // Audio configuration state
  const [stepSoundType, setStepSoundTypeState] = useState<'chime' | 'bubble' | 'retro' | 'clack'>('chime');

  // Chronology / Game logs
  const [logs, setLogs] = useState<GameLog[]>([]);

  // Score stats tracking
  const [stats, setStats] = useState<Record<PlayerColor, GameStats>>({
    red: { rolls: 0, sixes: 0, captures: 0, homeRuns: 0 },
    green: { rolls: 0, sixes: 0, captures: 0, homeRuns: 0 },
    yellow: { rolls: 0, sixes: 0, captures: 0, homeRuns: 0 },
    blue: { rolls: 0, sixes: 0, captures: 0, homeRuns: 0 },
  });

  // Helper: Retrieve steps taken by a token
  const getTokenSteps = (token: Token, startTrackIndex: number): number => {
    if (token.state === 'base') return 0;
    if (token.state === 'home') return 57;
    if (token.state === 'homerun') return 52 + token.homerunIndex!;
    // On track:
    const diff = (token.trackIndex! - startTrackIndex + 52) % 52;
    return diff + 1;
  };

  // Helper: Get next step state for step-by-step hops
  const getNextLocationOfToken = (token: Token, startTrackIndex: number): Partial<Token> => {
    if (token.state === 'base') {
      return { state: 'track', trackIndex: startTrackIndex, homerunIndex: null };
    }
    if (token.state === 'track') {
      const steps = getTokenSteps(token, startTrackIndex);
      if (steps < 51) {
        return { state: 'track', trackIndex: (token.trackIndex! + 1) % 52, homerunIndex: null };
      } else {
        // Enters home run
        return { state: 'homerun', trackIndex: null, homerunIndex: 0 };
      }
    }
    if (token.state === 'homerun') {
      if (token.homerunIndex! < 4) {
        return { state: 'homerun', trackIndex: null, homerunIndex: token.homerunIndex! + 1 };
      } else {
        return { state: 'home', trackIndex: null, homerunIndex: null };
      }
    }
    return {};
  };

  // Initialize Audio engine sound permission state
  useEffect(() => {
    audio.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  // Handle when turn time runs out for a human player
  const handleTimeout = () => {
    const activePlayer = players[activePlayerColor];
    if (activePlayer.type !== 'human' || winner || isMoving || isRolling) return;

    if (!hasRolled) {
      addLog(activePlayerColor, '⏱️ Turn time has run out! Auto-rolling the die.');
      handleRollDice();
    } else {
      const playable = getPlayableTokensForColor(activePlayerColor, diceValue || 0);
      if (playable.length > 0) {
        // Find a random playable token
        const randomToken = playable[Math.floor(Math.random() * playable.length)];
        addLog(activePlayerColor, `⏱️ Turn time has run out! Moving token ${randomToken.id + 1} automatically.`);
        handleTokenClick(randomToken);
      } else {
        addLog(activePlayerColor, '⏱️ Turn time has run out! No legal moves possible. Passing turn.');
        passTurn();
      }
    }
  };

  // Turn countdown timer for human players
  useEffect(() => {
    if (winner || isMoving || players[activePlayerColor].type !== 'human' || isPaused) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Trigger timeout action
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activePlayerColor, players, winner, isMoving, hasRolled, isRolling, tokens, diceValue, playableTokens, isPaused]);

  // Reset timer on active color changes
  useEffect(() => {
    setTimeLeft(30);
  }, [activePlayerColor]);

  // Log helper
  const addLog = (color: PlayerColor | undefined, text: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(3),
        timestamp,
        color,
        text,
      },
    ]);
  };

  // Start feed log on launch
  useEffect(() => {
    addLog(undefined, 'Welcome to Ludo! Red player goes first.');
  }, []);

  // Update Player slots (Human, Bot, disabled Slot)
  const handleUpdatePlayerType = (color: PlayerColor, type: PlayerType) => {
    // Prevent switching active player type while gameplay is running
    if (isMoving || isRolling) return;

    // Validate we don't end up with 0 active players
    const simulatedPlayers = { ...players, [color]: { ...players[color], type } };
    const activeCount = (Object.values(simulatedPlayers) as Player[]).filter((p) => p.type !== 'none').length;
    if (activeCount < 1) {
      addLog(color, 'Failed to disable slot: Must have at least 1 player active.');
      return;
    }

    setPlayers((prev) => ({
      ...prev,
      [color]: { ...prev[color], type },
    }));

    addLog(color, `Slot role updated to: ${type.toUpperCase()}`);

    // If active player is none, we should immediately slide turn to next active
    if (color === activePlayerColor && type === 'none') {
      passTurn(simulatedPlayers);
    }
  };

  // Trigger a dynamic house superpower
  const triggerSuperPower = (color: PlayerColor) => {
    if (winner || isMoving || isRolling) return;
    const player = players[color];
    if (player.superPower.isUsed) return;

    if (color === 'red') {
      const baseToken = tokens.find((t) => t.color === 'red' && t.state === 'base');
      if (!baseToken) {
        addLog('red', 'Phoenix Strike offline: All red tokens are already free!');
        return;
      }
      setTokens((prev) => prev.map((t) => {
        if (t.color === 'red' && t.id === baseToken.id) {
          return { ...t, state: 'track', trackIndex: players.red.startTrackIndex, homerunIndex: null };
        }
        return t;
      }));
      audio.playVictory();
      addLog('red', `🔥 Phoenix Strike activated! Token ${baseToken.id + 1} resurrected from the fiery ashes straight onto the track!`);
    } 
    else if (color === 'green') {
      const greenTrackTokens = tokens.filter((t) => t.color === 'green' && (t.state === 'track' || t.state === 'homerun'));
      if (greenTrackTokens.length === 0) {
        addLog('green', 'Titan Grip offline: You need at least one active track token to wrap with titanium shields!');
        return;
      }
      setTokens((prev) => prev.map((t) => {
        if (t.color === 'green' && (t.state === 'track' || t.state === 'homerun')) {
          return { ...t, shieldTurnsRemaining: 2 };
        }
        return t;
      }));
      audio.playWalk('clack');
      addLog('green', '🛡️ Titan Grip activated! Green track pieces are surrounded by heavy crystal shields protecting them from capture for 2 turns!');
    } 
    else if (color === 'yellow') {
      setElectricStormActive(true);
      audio.playWalk('retro');
      addLog('yellow', '⚡ Electric Storm activated! High electromagnetic voltage will add a +2 speed boost to Yellow\'s next dice roll!');
    } 
    else if (color === 'blue') {
      const activeBlueTokens = tokens.filter((t) => t.color === 'blue' && (t.state === 'track' || t.state === 'homerun'));
      if (activeBlueTokens.length === 0) {
        addLog('blue', 'Hydra Surge offline: You need at least one active piece to propel forward!');
        return;
      }
      const targetToken = activeBlueTokens[0];
      const config = players.blue;
      let curr = { ...targetToken };
      for (let k = 0; k < 3; k++) {
        const nextProps = getNextLocationOfToken(curr, config.startTrackIndex);
        curr = { ...curr, ...nextProps };
      }
      setTokens((prev) => prev.map((t) => {
        if (t.color === 'blue' && t.id === targetToken.id) {
          return curr;
        }
        return t;
      }));
      audio.playHome();
      addLog('blue', `🌊 Hydra Surge activated! Strong ocean tides propelled blue Token ${targetToken.id + 1} forward 3 spaces!`);
    }

    setPlayers((prev) => ({
      ...prev,
      [color]: {
        ...prev[color],
        superPower: {
          ...prev[color].superPower,
          isUsed: true
        }
      }
    }));

    setActivePowerUpAnimation({ color, name: player.superPower.name });
    setTimeout(() => {
      setActivePowerUpAnimation(null);
    }, 2500);
  };

  // Turn slider
  const passTurn = (currentPlayers = players) => {
    setPlayableTokens([]);
    setDiceValue(null);
    setHasRolled(false);
    setTimeLeft(30);

    // Decrement shields on active player's tokens
    setTokens((prev) => prev.map((t) => {
      if (t.color === activePlayerColor && t.shieldTurnsRemaining && t.shieldTurnsRemaining > 0) {
        const nextTurns = t.shieldTurnsRemaining - 1;
        if (nextTurns === 0) {
          addLog(activePlayerColor, `🛡️ Titan Shield expired on token ${t.id + 1}!`);
        }
        return { ...t, shieldTurnsRemaining: nextTurns };
      }
      return t;
    }));

    const currentIndex = COLOR_ORDER.indexOf(activePlayerColor);
    let nextColor = activePlayerColor;

    for (let i = 1; i <= 4; i++) {
      const candidate = COLOR_ORDER[(currentIndex + i) % 4];
      if (currentPlayers[candidate].type !== 'none') {
        nextColor = candidate;
        break;
      }
    }

    setActivePlayerColor(nextColor);
  };

  // Get subset of active player's tokens that can legally move for this roll
  const getPlayableTokensForColor = (color: PlayerColor, roll: number, currentTokens = tokens): Token[] => {
    const playerTokens = currentTokens.filter((t) => t.color === color);
    const config = players[color];

    return playerTokens.filter((token) => {
      // Home pieces are done
      if (token.state === 'home') return false;

      // Base pieces can only escape if player rolled a 6
      if (token.state === 'base') {
        return roll === 6;
      }

      // Track & homerun pieces must not overshoot final coordinate
      const steps = getTokenSteps(token, config.startTrackIndex);
      return steps + roll <= 57;
    });
  };

  // Roll action
  const handleRollDice = () => {
    if (isRolling || hasRolled || isMoving || !!winner) return;

    setIsRolling(true);
    setDiceValue(null);
    audio.playDiceRoll();

    // Fast random die interval animation
    let rollCounter = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rollCounter++;
      if (rollCounter > 6) {
        clearInterval(interval);
        finalizeRoll();
      }
    }, 55);
  };

  const finalizeRoll = () => {
    let rolledVal = Math.floor(Math.random() * 6) + 1;
    let boostApplied = false;
    if (electricStormActive && activePlayerColor === 'yellow') {
      rolledVal = Math.min(6, rolledVal + 2);
      setElectricStormActive(false);
      boostApplied = true;
    }

    setDiceValue(rolledVal);
    setIsRolling(false);
    setHasRolled(true);

    const config = players[activePlayerColor];
    if (boostApplied) {
      addLog(activePlayerColor, `rolled a ${rolledVal} (with +2 Electric Storm speed boost!)`);
    } else {
      addLog(activePlayerColor, `rolled a ${rolledVal}!`);
    }

    // Record stats
    setStats((prev) => ({
      ...prev,
      [activePlayerColor]: {
        ...prev[activePlayerColor],
        rolls: prev[activePlayerColor].rolls + 1,
        sixes: rolledVal === 6 ? prev[activePlayerColor].sixes + 1 : prev[activePlayerColor].sixes,
      },
    }));

    // Check consecutive sixes rule
    let newConsecutiveSixes = 0;
    if (rolledVal === 6) {
      newConsecutiveSixes = consecutiveSixes + 1;
      setConsecutiveSixes(newConsecutiveSixes);
    } else {
      setConsecutiveSixes(0);
    }

    if (newConsecutiveSixes === 3) {
      addLog(activePlayerColor, '❌ Rolled three 6s in a row! Turn forfeited.');
      setConsecutiveSixes(0);
      setTimeout(() => {
        passTurn();
      }, 1500);
      return;
    }

    // Resolve playable options
    const playable = getPlayableTokensForColor(activePlayerColor, rolledVal);
    if (playable.length === 0) {
      addLog(activePlayerColor, 'No legal moves possible. Pass turn.');
      setTimeout(() => {
        passTurn();
      }, 1500);
    } else {
      // Mark IDs of playable pieces for rendering feedback glows
      setPlayableTokens(playable.map((t) => t.id));
      setTimeLeft(30);
    }
  };

  // Step-by-step path locomotion!
  const handleTokenClick = async (clickedToken: Token) => {
    if (isMoving || isRolling || !diceValue) return;

    // Verify it is actually playable
    const playable = getPlayableTokensForColor(activePlayerColor, diceValue);
    if (!playable.some((t) => t.id === clickedToken.id)) return;

    setIsMoving(true);
    setPlayableTokens([]); // clear highlight glows

    const config = players[activePlayerColor];
    let currentTokenState = { ...clickedToken };
    const stepsToMove = diceValue;

    // Keep copies for visual stepping iterations
    let finalTokensList = [...tokens];

    // Determine lock steps
    for (let step = 1; step <= stepsToMove; step++) {
      const nextProps = getNextLocationOfToken(currentTokenState, config.startTrackIndex);
      
      currentTokenState = {
        ...currentTokenState,
        ...nextProps,
      };

      // Play walk pop chime
      audio.playWalk();

      // Update state for visual locomotion hop
      finalTokensList = finalTokensList.map((t) => {
        if (t.color === currentTokenState.color && t.id === currentTokenState.id) {
          return currentTokenState;
        }
        return t;
      });

      setTokens(finalTokensList);

      // Animation delay
      await new Promise((resolve) => setTimeout(resolve, 180));
    }

    // Locomotion finished! Perform capture validations
    let earnedExtraRoll = diceValue === 6;
    let didCapture = false;

    if (currentTokenState.state === 'track') {
      const targetTrackIndex = currentTokenState.trackIndex!;
      
      // Is landing cell a safe coordinate?
      const isDestinationCellSafe = config.safeTrackIndices.includes(targetTrackIndex) || isCoordSafe(
        config.homerunCoords[0]?.[0] || 0, // Fallback safe checks
        config.homerunCoords[0]?.[1] || 0
      );

      // If cell isn't safe, we scan for other sitting opponent pieces
      if (!config.safeTrackIndices.includes(targetTrackIndex)) {
        const opponentTokens = finalTokensList.filter(
          (t) => t.color !== activePlayerColor && t.state === 'track' && t.trackIndex === targetTrackIndex && !(t.shieldTurnsRemaining && t.shieldTurnsRemaining > 0)
        );

        if (opponentTokens.length > 0) {
          didCapture = true;
          earnedExtraRoll = true;

          // Smash opponent tokens back to base!
          finalTokensList = finalTokensList.map((t) => {
            const isOpponentSitting = opponentTokens.some((op) => op.color === t.color && op.id === t.id);
            if (isOpponentSitting) {
              addLog(t.color, `Token ${t.id + 1} captured by ${config.displayName}! Returned to base yard.`);
              return {
                ...t,
                state: 'base',
                trackIndex: null,
                homerunIndex: null,
              };
            }
            return t;
          });

          audio.playCapture();
          setTokens(finalTokensList);

          // Track stats capture
          setStats((prev) => ({
            ...prev,
            [activePlayerColor]: {
              ...prev[activePlayerColor],
              captures: prev[activePlayerColor].captures + opponentTokens.length,
            },
          }));
        }
      }
    }

    // Check if token landed exactly in home
    if (currentTokenState.state === 'home') {
      earnedExtraRoll = true;
      audio.playHome();
      addLog(activePlayerColor, `🎉 Brought token ${clickedToken.id + 1} safely HOME! Excellent!`);

      // Update color statistics
      setStats((prev) => {
        const currentHomeRuns = finalTokensList.filter((t) => t.color === activePlayerColor && t.state === 'home').length;
        return {
          ...prev,
          [activePlayerColor]: {
            ...prev[activePlayerColor],
            homeRuns: currentHomeRuns,
          },
        };
      });

      // Victory validation
      const allHome = finalTokensList.filter((t) => t.color === activePlayerColor && t.state === 'home').length === 4;
      if (allHome) {
        setWinner(activePlayerColor);
        audio.playVictory();
        addLog(activePlayerColor, `🏆 WINS THE GAME! ALL 4 TOKENS BROUGHT HOME!`);
        setIsMoving(false);
        return;
      }
    }

    // Logic completion
    setIsMoving(false);

    // If rolled a 6 or got a captured/home landing, keep turn but reset consecutive count. Otherwise pass turn
    if (earnedExtraRoll) {
      if (didCapture) {
        addLog(activePlayerColor, 'Earned another bonus roll for capturing an opponent!');
      } else if (currentTokenState.state === 'home') {
        addLog(activePlayerColor, 'Earned another bonus roll for bringing a token home!');
      } else {
        addLog(activePlayerColor, 'Bonus roll for rolling a 6!');
      }
      setPlayableTokens([]);
      setDiceValue(null);
      setHasRolled(false);
    } else {
      passTurn();
    }
  };

  // Instant Kill Sandbox Action
  const handleKillToken = (targetToken: Token) => {
    if (winner || isMoving || isPaused) return;

    setTokens((prev) => prev.map((t) => {
      if (t.color === targetToken.color && t.id === targetToken.id) {
        addLog(activePlayerColor, `☠️ Instant Kill Activated! House ${players[activePlayerColor].displayName} assassinated target Token ${targetToken.id + 1} (${players[targetToken.color].displayName}) and returned them to Base yard!`);
        return {
          ...t,
          state: 'base',
          trackIndex: null,
          homerunIndex: null,
          shieldTurnsRemaining: 0 // bypasses shield barriers
        };
      }
      return t;
    }));

    audio.playCapture();

    // Increment capture scoreboard statistic
    setStats((prev) => ({
      ...prev,
      [activePlayerColor]: {
        ...prev[activePlayerColor],
        captures: prev[activePlayerColor].captures + 1,
      },
    }));

    // Turn off kill mode after strike is complete
    setKillMode(false);
  };

  // Computer Smart bot choice engine
  const getComputerMove = (
    color: PlayerColor,
    roll: number,
    playable: Token[],
    allTokens: Token[]
  ): Token | null => {
    if (playable.length === 0) return null;
    if (playable.length === 1) return playable[0];

    let bestChoice = playable[0];
    let maxScore = -99999;

    playable.forEach((token) => {
      let score = 0;
      const config = players[color];
      const currentSteps = getTokenSteps(token, config.startTrackIndex);
      const nextSteps = currentSteps + roll;

      // Rule 1: Prioritize landing directly Home! (highest goal)
      if (nextSteps === 57) {
        score += 1000;
      }

      // Rule 2: Prioritize landing captures! (extremely fun & dynamic)
      if (token.state === 'track') {
        const nextTrackIndex = (token.trackIndex! + roll) % 52;
        const entersHomeStretch = currentSteps + roll > 51;

        if (!entersHomeStretch && !config.safeTrackIndices.includes(nextTrackIndex)) {
          const opponentsOnCell = allTokens.some(
            (t) => t.color !== color && t.state === 'track' && t.trackIndex === nextTrackIndex
          );
          if (opponentsOnCell) {
            score += 850;
          }
        }
      }

      // Rule 3: Prioritize escaping a vulnerable cell
      // Check if any opponent piece was 1 to 6 spaces behind us on track!
      if (token.state === 'track') {
        const isVulnerable = allTokens.some((t) => {
          if (t.color === color || t.state !== 'track') return false;
          const delta = (token.trackIndex! - t.trackIndex! + 52) % 52;
          return delta > 0 && delta <= 6;
        });
        if (isVulnerable) {
          score += 150;
        }
      }

      // Rule 4: Getting out from base yard
      if (token.state === 'base' && roll === 6) {
        score += 500;
      }

      // Rule 5: Land on a safe star block
      if (token.state === 'track') {
        const destination = (token.trackIndex! + roll) % 52;
        if (config.safeTrackIndices.includes(destination)) {
          score += 70;
        }
      }

      // Rule 6: Lean towards progressing advanced tokens
      score += currentSteps * 2.5;

      // Small noise variance for a more natural choice
      score += Math.random() * 6;

      if (score > maxScore) {
        maxScore = score;
        bestChoice = token;
      }
    });

    return bestChoice;
  };

  // Bot Turn Automation loop
  useEffect(() => {
    if (winner || isPaused) return;
    const activePlayer = players[activePlayerColor];
    if (activePlayer.type === 'computer') {
      // Bot Super Power activation logic (with a 15% probability per bot turn if appropriate criteria matches)
      if (!activePlayer.superPower.isUsed && !isRolling && !isMoving && Math.random() < 0.15) {
        if (activePlayerColor === 'green') {
          const trackTokens = tokens.filter(t => t.color === 'green' && (t.state === 'track' || t.state === 'homerun'));
          if (trackTokens.length > 0) {
            triggerSuperPower('green');
            return;
          }
        } else if (activePlayerColor === 'yellow') {
          triggerSuperPower('yellow');
          return;
        } else if (activePlayerColor === 'blue') {
          const trackTokens = tokens.filter(t => t.color === 'blue' && (t.state === 'track' || t.state === 'homerun'));
          if (trackTokens.length > 0) {
            triggerSuperPower('blue');
            return;
          }
        } else if (activePlayerColor === 'red') {
          const baseTokens = tokens.filter(t => t.color === 'red' && t.state === 'base');
          if (baseTokens.length > 0) {
            triggerSuperPower('red');
            return;
          }
        }
      }

      // Step A: Roll the dice after small breathing space
      if (!hasRolled && !isRolling && !isMoving) {
        const rollTimer = setTimeout(() => {
          handleRollDice();
        }, 1200);
        return () => clearTimeout(rollTimer);
      }

      // Step B: Resolve move choices after roll finishes
      if (hasRolled && !isRolling && !isMoving) {
        const playable = getPlayableTokensForColor(activePlayerColor, diceValue!);
        if (playable.length === 0) {
          // No moves possible, delay a tiny bit and let bot pass turn
          const noMoveTimer = setTimeout(() => {
            passTurn();
          }, 1200);
          return () => clearTimeout(noMoveTimer);
        } else {
          // Invoke smart scoring choice
          const chosenToken = getComputerMove(activePlayerColor, diceValue!, playable, tokens);
          if (chosenToken) {
            const botMoveTimer = setTimeout(() => {
              handleTokenClick(chosenToken);
            }, 1000);
            return () => clearTimeout(botMoveTimer);
          } else {
            // Safety fallback
            passTurn();
          }
        }
      }
    }
  }, [activePlayerColor, players, hasRolled, isRolling, isMoving, winner, diceValue, tokens, isPaused]);

  // Restart trigger
  const handleRestart = () => {
    setWinner(null);
    setDiceValue(null);
    setIsRolling(false);
    setHasRolled(false);
    setConsecutiveSixes(0);
    setPlayableTokens([]);
    setIsMoving(false);
    setActivePlayerColor('red');
    setTimeLeft(30);
    setIsPaused(false);
    setKillMode(false);
    setElectricStormActive(false);

    // Reset players superpower spent states and preserve roles
    setPlayers((prev) => {
      const reset: Record<PlayerColor, Player> = JSON.parse(JSON.stringify(PLAYERS_CONFIG));
      COLOR_ORDER.forEach((c) => {
        reset[c].type = prev[c].type;
      });
      return reset;
    });

    setStats({
      red: { rolls: 0, sixes: 0, captures: 0, homeRuns: 0 },
      green: { rolls: 0, sixes: 0, captures: 0, homeRuns: 0 },
      yellow: { rolls: 0, sixes: 0, captures: 0, homeRuns: 0 },
      blue: { rolls: 0, sixes: 0, captures: 0, homeRuns: 0 },
    });
    setTokens(() => {
      const initial: Token[] = [];
      COLOR_ORDER.forEach((color) => {
        for (let i = 0; i < 4; i++) {
          initial.push({
            id: i,
            color,
            state: 'base',
            trackIndex: null,
            homerunIndex: null,
          });
        }
      });
      return initial;
    });
    setLogs([]);
    addLog(undefined, 'Game rebooted successfully. Red player goes first.');
    audio.playWalk();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans p-4 md:p-8 text-slate-800 dark:text-slate-100 flex flex-col items-center">
      
      {/* Visual Navigation Brand Line */}
      <div className="w-full max-w-6xl flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white font-black">
            L
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Ludo</h1>
            <p className="text-[10px] font-mono text-indigo-505 dark:text-slate-400">v1.2 // Sandbox</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500">
          <Gamepad2 className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span>Local Pass & Play // Smart Bots</span>
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Playable Grid Center (col spans 7) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <GameBoard
            tokens={tokens}
            players={players}
            activePlayerColor={activePlayerColor}
            playableTokens={playableTokens}
            onTokenClick={handleTokenClick}
            diceValue={diceValue}
            isRolling={isRolling}
            onRollClick={handleRollDice}
            winner={winner}
            hasRolled={hasRolled}
            isPaused={isPaused}
            onResume={() => setIsPaused(false)}
            killMode={killMode}
            onKillToken={handleKillToken}
            onToggleKillMode={() => setKillMode((prev) => !prev)}
          />

          {/* Quick instructions helper tip card Tip */}
          <div className="mt-4 w-full bg-slate-100 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-700 dark:text-slate-300">Quick Rules:</span> Roll a <span className="font-extrabold text-indigo-500">6</span> to escape the Base yard and land on the starting tile. Roll 6, landing on Home, or successfully capturing opponent tokens rewards an extra bonus roll! Standard star block icons represent safe zones.
            </div>
          </div>
        </div>

        {/* Dashboard Grid Center (col spans 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <GameControls
            players={players}
            activePlayerColor={activePlayerColor}
            onUpdatePlayerType={handleUpdatePlayerType}
            onRestart={handleRestart}
            stats={stats}
            diceValue={diceValue}
            isRolling={isRolling}
            onRollClick={handleRollDice}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((prev) => !prev)}
            consecutiveSixes={consecutiveSixes}
            timeLeft={timeLeft}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused((p) => !p)}
            killMode={killMode}
            onToggleKillMode={() => setKillMode((prev) => !prev)}
          />

          <SoundPowerPanel
            players={players}
            activePlayerColor={activePlayerColor}
            onTriggerPower={triggerSuperPower}
            stepSoundType={stepSoundType}
            onChangeStepSound={(id) => {
              setStepSoundTypeState(id);
              audio.setStepSoundType(id);
            }}
            isRolling={isRolling}
            isMoving={isMoving}
            winner={winner}
            isPaused={isPaused}
          />

          <GameLogs
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        </div>

      </main>

      {/* Google Forms Utility Hub */}
      <section className="w-full max-w-6xl mt-8">
        <GoogleFormsManager />
      </section>

    </div>
  );
}
