import React from 'react';
import type { FloatingTextItem, ParticleItem } from '../types/game';

interface FloatingEffectsProps {
  floatingTexts: FloatingTextItem[];
  particles: ParticleItem[];
}

export const FloatingEffects: React.FC<FloatingEffectsProps> = ({
  floatingTexts,
  particles,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {/* Floating Score Badges */}
      {floatingTexts.map((item) => (
        <div
          key={item.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 font-extrabold select-none animate-bounce"
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
            color: item.color,
            fontSize: item.size === 'lg' ? '1.75rem' : item.size === 'sm' ? '1.1rem' : '1.4rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 12px rgba(255,255,255,0.4)',
            transition: 'all 0.5s ease-out',
          }}
        >
          {item.text}
        </div>
      ))}

      {/* Particle Bursts */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.shape !== 'star' ? p.color : undefined,
            borderRadius: p.shape === 'circle' ? '9999px' : '2px',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {p.shape === 'star' && (
            <svg viewBox="0 0 24 24" className="w-full h-full" fill={p.color}>
              <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
};
