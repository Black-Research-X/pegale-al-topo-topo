import React from 'react';
import type { HammerId } from '../types/game';

interface MalletCursorProps {
  x: number;
  y: number;
  isSwinging: boolean;
  hammerId: HammerId;
  visible: boolean;
}

export const MalletCursor: React.FC<MalletCursorProps> = ({
  x,
  y,
  isSwinging,
  hammerId,
  visible,
}) => {
  if (!visible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-transform will-change-transform"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-25%, -75%) ${isSwinging ? 'rotate(-55deg) scale(0.92)' : 'rotate(-10deg) scale(1)'}`,
        transformOrigin: '20% 80%',
        transition: isSwinging ? 'transform 60ms ease-in' : 'transform 120ms cubic-bezier(0.18, 0.89, 0.32, 1.28)',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-xl"
      >
        {/* HAMMER RENDERERS */}
        {hammerId === 'WOODEN' && (
          <g>
            {/* Wooden Handle */}
            <path
              d="M 30 75 L 55 42"
              stroke="#b45309"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M 30 75 L 55 42"
              stroke="#d97706"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Handle Grip wrap */}
            <line x1="28" y1="78" x2="34" y2="70" stroke="#78350f" strokeWidth="2.5" />
            <line x1="33" y1="72" x2="39" y2="64" stroke="#78350f" strokeWidth="2.5" />
            <line x1="38" y1="66" x2="44" y2="58" stroke="#78350f" strokeWidth="2.5" />

            {/* Wooden Head Barrel */}
            <rect
              x="42"
              y="18"
              width="44"
              height="28"
              rx="6"
              fill="#78350f"
              stroke="#451a03"
              strokeWidth="2.5"
              transform="rotate(38 64 32)"
            />
            {/* Ring bands */}
            <rect
              x="49"
              y="18"
              width="6"
              height="28"
              fill="#d97706"
              transform="rotate(38 64 32)"
            />
            <rect
              x="73"
              y="18"
              width="6"
              height="28"
              fill="#d97706"
              transform="rotate(38 64 32)"
            />
          </g>
        )}

        {hammerId === 'TOY' && (
          <g>
            {/* Bright Yellow Handle */}
            <path
              d="M 30 75 L 55 42"
              stroke="#fbbf24"
              strokeWidth="9"
              strokeLinecap="round"
            />
            {/* Squeaky Red Bellows Mallet Head */}
            <rect
              x="40"
              y="16"
              width="46"
              height="32"
              rx="8"
              fill="#ef4444"
              stroke="#b91c1c"
              strokeWidth="3"
              transform="rotate(38 63 32)"
            />
            {/* Squeaky ridges */}
            <line x1="48" y1="20" x2="48" y2="44" stroke="#fca5a5" strokeWidth="3" transform="rotate(38 63 32)" />
            <line x1="56" y1="20" x2="56" y2="44" stroke="#b91c1c" strokeWidth="3" transform="rotate(38 63 32)" />
            <line x1="64" y1="20" x2="64" y2="44" stroke="#fca5a5" strokeWidth="3" transform="rotate(38 63 32)" />
            <line x1="72" y1="20" x2="72" y2="44" stroke="#b91c1c" strokeWidth="3" transform="rotate(38 63 32)" />
          </g>
        )}

        {hammerId === 'GOLDEN' && (
          <g>
            {/* Rich Ruby & Gold Handle */}
            <path
              d="M 30 75 L 55 42"
              stroke="#991b1b"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M 30 75 L 55 42"
              stroke="#f59e0b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Gold Head */}
            <rect
              x="40"
              y="16"
              width="46"
              height="30"
              rx="6"
              fill="#fbbf24"
              stroke="#b45309"
              strokeWidth="2.5"
              transform="rotate(38 63 31)"
            />
            {/* Crown emblem on hammer */}
            <polygon
              points="60,26 57,32 63,32"
              fill="#dc2626"
            />
            <circle cx="63" cy="24" r="3" fill="#ef4444" />
          </g>
        )}

        {hammerId === 'CYBER' && (
          <g>
            {/* Dark Metallic Handle */}
            <path
              d="M 30 75 L 55 42"
              stroke="#0f172a"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Cyan Neon core */}
            <path
              d="M 30 75 L 55 42"
              stroke="#06b6d4"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Futuristic hammer block */}
            <rect
              x="40"
              y="16"
              width="46"
              height="30"
              rx="4"
              fill="#1e293b"
              stroke="#06b6d4"
              strokeWidth="3"
              transform="rotate(38 63 31)"
            />
            {/* Glowing neon center */}
            <line
              x1="46"
              y1="31"
              x2="78"
              y2="31"
              stroke="#a5f3fc"
              strokeWidth="4"
              strokeLinecap="round"
              transform="rotate(38 63 31)"
            />
          </g>
        )}

        {/* Slam Impact Wind Particles */}
        {isSwinging && (
          <g>
            <path
              d="M 22 45 Q 16 35 24 25"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M 28 55 Q 20 46 28 36"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.6"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
