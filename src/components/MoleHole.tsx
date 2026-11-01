import React from 'react';
import type { MoleData } from '../types/game';
import { MoleGraphic } from './MoleGraphic';

interface MoleHoleProps {
  data: MoleData;
  onWhack: (index: number, e: React.MouseEvent | React.TouchEvent) => void;
  showKeyHint: boolean;
}

export const MoleHole: React.FC<MoleHoleProps> = ({
  data,
  onWhack,
  showKeyHint,
}) => {
  const isUp = data.state === 'UP' || data.state === 'EMERGING' || data.state === 'HIT';
  const isHit = data.state === 'HIT';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onWhack(data.index, e);
  };

  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    onWhack(data.index, e);
  };

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouch}
      className="relative flex items-center justify-center cursor-pointer select-none group touch-manipulation"
      style={{
        aspectRatio: '1 / 1',
      }}
    >
      {/* Keyboard Shortcut Indicator */}
      {showKeyHint && (
        <div className="absolute top-1 left-2 z-30 pointer-events-none">
          <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-950/70 text-amber-200 border border-amber-700/50 rounded shadow-xs">
            {data.keyLabel}
          </span>
        </div>
      )}

      {/* Mound Base Shadows & Outer Dirt Mound */}
      <div className="absolute inset-x-2 bottom-1 h-3/5 rounded-[50%] bg-gradient-to-b from-amber-950/80 via-stone-900 to-amber-950/90 shadow-lg border-b-4 border-amber-950" />

      {/* Deep Hole Cavity */}
      <div className="absolute inset-x-4 bottom-2.5 h-1/2 rounded-[50%] bg-black/90 shadow-inner overflow-hidden flex items-end justify-center">
        {/* Deep darkness inner gradient */}
        <div className="w-full h-full bg-gradient-to-t from-stone-950 to-amber-950/60" />
      </div>

      {/* Mole Emergence Clipping Window */}
      <div className="absolute inset-x-4 bottom-3 h-[85%] overflow-hidden flex items-end justify-center pointer-events-none z-10">
        <div
          className={`w-full h-full flex items-end justify-center transition-all ease-out ${
            isUp
              ? 'translate-y-0 opacity-100 duration-150'
              : 'translate-y-full opacity-40 duration-200'
          }`}
        >
          {data.state !== 'HIDDEN' && (
            <div className="w-full h-full flex items-end justify-center">
              <MoleGraphic
                type={data.type}
                state={data.state}
                hitsLeft={data.hitsLeft}
                maxHits={data.maxHits}
              />
            </div>
          )}
        </div>
      </div>

      {/* Front Dirt Lip & Grass Blades (Covers Mole Bottom realistically) */}
      <div className="absolute inset-x-3 bottom-0 h-2/5 pointer-events-none z-20 flex flex-col justify-end">
        {/* Dirt Rim */}
        <div className="w-full h-8 rounded-b-full rounded-t-2xl bg-gradient-to-b from-amber-800 to-amber-950 border-t border-amber-600/40 shadow-md relative overflow-hidden">
          {/* Subtle soil pebbles texture */}
          <div className="absolute top-1 left-3 w-1.5 h-1 rounded-full bg-amber-950/60" />
          <div className="absolute top-2 right-4 w-2 h-1.5 rounded-full bg-amber-900/80" />
          <div className="absolute bottom-1 left-8 w-1 h-1 rounded-full bg-amber-950/50" />
        </div>

        {/* Decorative Grass Tufts around the hole */}
        <div className="absolute -bottom-1 -left-1 text-emerald-600 opacity-90">
          <svg width="24" height="16" viewBox="0 0 24 16" fill="currentColor">
            <path d="M 2 16 Q 6 4 10 2 Q 8 10 12 16 Z" />
            <path d="M 8 16 Q 14 6 18 4 Q 14 11 16 16 Z" />
          </svg>
        </div>
        <div className="absolute -bottom-1 -right-1 text-emerald-600 opacity-90 scale-x-[-1]">
          <svg width="24" height="16" viewBox="0 0 24 16" fill="currentColor">
            <path d="M 2 16 Q 6 4 10 2 Q 8 10 12 16 Z" />
            <path d="M 8 16 Q 14 6 18 4 Q 14 11 16 16 Z" />
          </svg>
        </div>
      </div>

      {/* Hit Flash / Star Burst Ring */}
      {isHit && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center animate-ping opacity-60">
          <div className="w-16 h-16 rounded-full bg-amber-300/40 border border-amber-200" />
        </div>
      )}
    </div>
  );
};
