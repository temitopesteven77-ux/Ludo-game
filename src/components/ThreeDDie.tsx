import { PlayerColor } from '../types';

interface ThreeDDieProps {
  value: number | null;
  isRolling: boolean;
  colorHex: string;
  accentHex: string;
  size?: number; // width and height of the die in px
  onClick?: () => void;
  disabled?: boolean;
}

export default function ThreeDDie({
  value,
  isRolling,
  colorHex,
  accentHex,
  size = 64,
  onClick,
  disabled = false
}: ThreeDDieProps) {
  const halfSize = size / 2;

  // Dot coordinates for a standard 100x100 face layout
  const dotPositions: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [25, 75], [75, 25], [75, 75]],
    5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
    6: [
      [25, 25], [25, 50], [25, 75],
      [75, 25], [75, 50], [75, 75]
    ]
  };

  const renderFaceDots = (faceNum: number, isDarkColor: boolean) => {
    const dots = dotPositions[faceNum] || [];
    // If yellow, use dark dots for accessibility; otherwise use white dots
    const fillHex = isDarkColor ? '#ffffff' : '#1e293b';

    return (
      <svg viewBox="0 0 100 100" className="w-full h-full p-2.5">
        {dots.map(([cx, cy], idx) => (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r="8.5"
            fill={fillHex}
            className="filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
          />
        ))}
      </svg>
    );
  };

  // Determine standard 3D rotation angles to face the viewer
  // We tilt the neutral/static state so the user sees it is a 3D block!
  const getRotationStyle = () => {
    if (isRolling) return {}; // CSS keyframes take over

    if (value === null) {
      // Isomorphic resting state to showcase 3D beauty before play begins
      return {
        transform: 'rotateX(-25deg) rotateY(35deg) rotateZ(0deg)'
      };
    }

    switch (value) {
      case 1: // Front
        return { transform: 'rotateX(360deg) rotateY(360deg) rotateZ(360deg)' };
      case 2: // Right
        return { transform: 'rotateX(360deg) rotateY(270deg) rotateZ(360deg)' };
      case 3: // Top
        return { transform: 'rotateX(450deg) rotateY(360deg) rotateZ(360deg)' };
      case 4: // Bottom
        return { transform: 'rotateX(270deg) rotateY(360deg) rotateZ(360deg)' };
      case 5: // Left
        return { transform: 'rotateX(360deg) rotateY(90deg) rotateZ(360deg)' };
      case 6: // Back
        return { transform: 'rotateX(360deg) rotateY(180deg) rotateZ(360deg)' };
      default:
        return { transform: 'rotateX(-25deg) rotateY(35deg)' };
    }
  };

  const isYellow = colorHex.toLowerCase() === '#fbbf24';
  const isDarkColor = !isYellow;

  return (
    <div 
      className={`relative select-none flex items-center justify-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95 transition-transform'}`}
      style={{
        width: `${size + 24}px`,
        height: `${size + 24}px`,
        perspective: '400px',
      }}
      onClick={() => {
        if (!disabled && !isRolling && onClick) {
          onClick();
        }
      }}
    >
      {/* Dynamic Keyframe style injector to animate rotation perfectly */}
      <style>{`
        @keyframes cube-wild-spin {
          0% {
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
          }
          15% {
            transform: rotateX(120deg) rotateY(180deg) rotateZ(45deg);
          }
          30% {
            transform: rotateX(240deg) rotateY(90deg) rotateZ(120deg);
          }
          45% {
            transform: rotateX(340deg) rotateY(270deg) rotateZ(190deg);
          }
          60% {
            transform: rotateX(460deg) rotateY(360deg) rotateZ(280deg);
          }
          75% {
            transform: rotateX(580deg) rotateY(480deg) rotateZ(320deg);
          }
          90% {
            transform: rotateX(680deg) rotateY(600deg) rotateZ(380deg);
          }
          100% {
            transform: rotateX(720deg) rotateY(720deg) rotateZ(720deg);
          }
        }
        .cube-3d-container {
          transition: transform 0.65s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .cube-face-shadow {
          box-shadow: inset 0 2px 8px rgba(255,255,255,0.25), inset 0 -2px 8px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15);
        }
        .cube-face-shadow-yellow {
          box-shadow: inset 0 2px 6px rgba(255,255,255,0.4), inset 0 -2px 6px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>

      {/* 3D Cube Container */}
      <div
        className={`cube-3d-container relative transform-gpu`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transformStyle: 'preserve-3d',
          animation: isRolling ? 'cube-wild-spin 0.8s infinite linear' : undefined,
          ...getRotationStyle()
        }}
      >
        {/* FACE 1: FRONT */}
        <div
          className={`absolute inset-0 rounded-2xl border-2 flex items-center justify-center ${isYellow ? 'cube-face-shadow-yellow' : 'cube-face-shadow'}`}
          style={{
            transform: `rotateY(0deg) translateZ(${halfSize}px)`,
            backgroundColor: colorHex,
            borderColor: accentHex,
            backfaceVisibility: 'hidden',
          }}
        >
          {renderFaceDots(1, isDarkColor)}
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/20" />
        </div>

        {/* FACE 6: BACK */}
        <div
          className={`absolute inset-0 rounded-2xl border-2 flex items-center justify-center ${isYellow ? 'cube-face-shadow-yellow' : 'cube-face-shadow'}`}
          style={{
            transform: `rotateY(180deg) translateZ(${halfSize}px)`,
            backgroundColor: colorHex,
            borderColor: accentHex,
            backfaceVisibility: 'hidden',
          }}
        >
          {renderFaceDots(6, isDarkColor)}
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/20" />
        </div>

        {/* FACE 2: RIGHT */}
        <div
          className={`absolute inset-0 rounded-2xl border-2 flex items-center justify-center ${isYellow ? 'cube-face-shadow-yellow' : 'cube-face-shadow'}`}
          style={{
            transform: `rotateY(90deg) translateZ(${halfSize}px)`,
            backgroundColor: colorHex,
            borderColor: accentHex,
            backfaceVisibility: 'hidden',
          }}
        >
          {renderFaceDots(2, isDarkColor)}
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/20" />
        </div>

        {/* FACE 5: LEFT */}
        <div
          className={`absolute inset-0 rounded-2xl border-2 flex items-center justify-center ${isYellow ? 'cube-face-shadow-yellow' : 'cube-face-shadow'}`}
          style={{
            transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
            backgroundColor: colorHex,
            borderColor: accentHex,
            backfaceVisibility: 'hidden',
          }}
        >
          {renderFaceDots(5, isDarkColor)}
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/20" />
        </div>

        {/* FACE 3: TOP */}
        <div
          className={`absolute inset-0 rounded-2xl border-2 flex items-center justify-center ${isYellow ? 'cube-face-shadow-yellow' : 'cube-face-shadow'}`}
          style={{
            transform: `rotateX(90deg) translateZ(${halfSize}px)`,
            backgroundColor: colorHex,
            borderColor: accentHex,
            backfaceVisibility: 'hidden',
          }}
        >
          {renderFaceDots(3, isDarkColor)}
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/20" />
        </div>

        {/* FACE 4: BOTTOM */}
        <div
          className={`absolute inset-0 rounded-2xl border-2 flex items-center justify-center ${isYellow ? 'cube-face-shadow-yellow' : 'cube-face-shadow'}`}
          style={{
            transform: `rotateX(-90deg) translateZ(${halfSize}px)`,
            backgroundColor: colorHex,
            borderColor: accentHex,
            backfaceVisibility: 'hidden',
          }}
        >
          {renderFaceDots(4, isDarkColor)}
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}
