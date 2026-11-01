import React from 'react';
import type { MoleType, MoleState } from '../types/game';

interface MoleGraphicProps {
  type: MoleType;
  state: MoleState;
  hitsLeft: number;
  maxHits: number;
}

export const MoleGraphic: React.FC<MoleGraphicProps> = ({
  type,
  state,
  hitsLeft,
  maxHits,
}) => {
  const isHit = state === 'HIT';

  // Render Bomb
  if (type === 'BOMB') {
    return (
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-md">
          {/* Bomb Fuse */}
          <path
            d="M 50 30 Q 65 15 72 20"
            fill="none"
            stroke="#78350f"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Spark flame on fuse */}
          {!isHit && (
            <circle cx="72" cy="20" r="5" fill="#f59e0b" className="animate-ping" />
          )}
          <circle cx="72" cy="20" r="4" fill="#ef4444" />
          <circle cx="72" cy="20" r="2.5" fill="#fef08a" />

          {/* Bomb Cap */}
          <rect x="42" y="27" width="16" height="8" rx="2" fill="#475569" />

          {/* Bomb Sphere */}
          <circle cx="50" cy="58" r="32" fill="#1e293b" />
          <circle cx="40" cy="46" r="6" fill="#475569" opacity="0.6" />

          {/* Face on bomb */}
          {isHit ? (
            // Exploded / dazed eyes
            <g>
              <line x1="38" y1="52" x2="46" y2="60" stroke="#f87171" strokeWidth="3" strokeLinecap="round" />
              <line x1="46" y1="52" x2="38" y2="60" stroke="#f87171" strokeWidth="3" strokeLinecap="round" />
              <line x1="54" y1="52" x2="62" y2="60" stroke="#f87171" strokeWidth="3" strokeLinecap="round" />
              <line x1="62" y1="52" x2="54" y2="60" stroke="#f87171" strokeWidth="3" strokeLinecap="round" />
              <ellipse cx="50" cy="68" rx="6" ry="4" fill="#dc2626" />
            </g>
          ) : (
            <g>
              {/* Angry cute eyebrows */}
              <path d="M 36 50 L 46 54" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 64 50 L 54 54" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
              {/* Eyes */}
              <circle cx="42" cy="57" r="3" fill="#f8fafc" />
              <circle cx="58" cy="57" r="3" fill="#f8fafc" />
              {/* Smirk */}
              <path d="M 44 68 Q 50 72 56 68" fill="none" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {/* Skull / danger mark */}
          <text x="50" y="78" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ef4444">
            ¡BOOM!
          </text>
        </svg>
      </div>
    );
  }

  // Fur and detail colors based on Mole Type
  let furColor = '#92400e'; // Warm mole brown
  let bellyColor = '#d97706';
  let earInnerColor = '#f472b6';
  let noseColor = '#db2777';

  if (type === 'GOLDEN') {
    furColor = '#f59e0b';
    bellyColor = '#fef08a';
    earInnerColor = '#fcd34d';
    noseColor = '#b45309';
  } else if (type === 'NINJA') {
    furColor = '#3b0764';
    bellyColor = '#581c87';
    earInnerColor = '#9333ea';
    noseColor = '#4c1d95';
  } else if (type === 'FROZEN') {
    furColor = '#0284c7';
    bellyColor = '#bae6fd';
    earInnerColor = '#7dd3fc';
    noseColor = '#0369a1';
  } else if (type === 'HELMET') {
    furColor = '#78350f';
    bellyColor = '#b45309';
  }

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-75 ${
        isHit ? 'scale-90 rotate-3' : 'scale-100'
      }`}
    >
      <svg viewBox="0 0 120 120" className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 drop-shadow-md">
        {/* Glow for golden mole */}
        {type === 'GOLDEN' && !isHit && (
          <circle cx="60" cy="65" r="45" fill="none" stroke="#fde047" strokeWidth="4" opacity="0.4" className="animate-pulse" />
        )}

        {/* Frost shimmer for frozen mole */}
        {type === 'FROZEN' && !isHit && (
          <g opacity="0.6">
            <path d="M 25 35 L 35 45 M 35 35 L 25 45" stroke="#e0f2fe" strokeWidth="2" />
            <path d="M 85 30 L 95 40 M 95 30 L 85 40" stroke="#e0f2fe" strokeWidth="2" />
          </g>
        )}

        {/* Ears */}
        <circle cx="34" cy="46" r="13" fill={furColor} />
        <circle cx="34" cy="46" r="7" fill={earInnerColor} />
        <circle cx="86" cy="46" r="13" fill={furColor} />
        <circle cx="86" cy="46" r="7" fill={earInnerColor} />

        {/* Head & Body */}
        <ellipse cx="60" cy="72" rx="34" ry="38" fill={furColor} />
        <ellipse cx="60" cy="84" rx="20" ry="22" fill={bellyColor} opacity="0.5" />

        {/* Snout / Muzzle */}
        <ellipse cx="60" cy="70" rx="18" ry="12" fill="#fed7aa" />
        {/* Nose */}
        <ellipse cx="60" cy="66" rx="6.5" ry="5" fill={noseColor} />
        <ellipse cx="58" cy="64.5" rx="2" ry="1.2" fill="#fff" opacity="0.8" />

        {/* Front cute teeth */}
        <rect x="56" y="73" width="3.5" height="5.5" rx="1" fill="#ffffff" />
        <rect x="60.5" y="73" width="3.5" height="5.5" rx="1" fill="#ffffff" />

        {/* Whiskers */}
        <line x1="38" y1="69" x2="22" y2="67" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="38" y1="73" x2="24" y2="76" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="82" y1="69" x2="98" y2="67" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="82" y1="73" x2="96" y2="76" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />

        {/* Eyes & Expression */}
        {isHit ? (
          // Dazed Dizzy Eyes
          <g>
            {/* Left X eye */}
            <line x1="43" y1="50" x2="51" y2="58" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
            <line x1="51" y1="50" x2="43" y2="58" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
            {/* Right X eye */}
            <line x1="69" y1="50" x2="77" y2="58" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
            <line x1="77" y1="50" x2="69" y2="58" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
            {/* Dazed mouth */}
            <ellipse cx="60" cy="80" rx="5" ry="3" fill="#991b1b" />
            {/* Bump / lump on head */}
            <ellipse cx="68" cy="36" rx="6" ry="4" fill="#f87171" transform="rotate(15 68 36)" />
            {/* Circling dizzy stars */}
            <g className="animate-spin" style={{ transformOrigin: '60px 30px' }}>
              <polygon points="60,20 62,26 68,26 63,30 65,36 60,32 55,36 57,30 52,26 58,26" fill="#facc15" />
            </g>
          </g>
        ) : (
          // Happy / Alive Eyes
          <g>
            {/* Left Eye */}
            <ellipse cx="46" cy="54" rx="4.5" ry="5.5" fill="#1e293b" />
            <circle cx="44.5" cy="52" r="1.8" fill="#ffffff" />
            {/* Right Eye */}
            <ellipse cx="74" cy="54" rx="4.5" ry="5.5" fill="#1e293b" />
            <circle cx="72.5" cy="52" r="1.8" fill="#ffffff" />
            {/* Cute rosy cheeks */}
            <ellipse cx="38" cy="62" rx="4" ry="2.5" fill="#f43f5e" opacity="0.5" />
            <ellipse cx="82" cy="62" rx="4" ry="2.5" fill="#f43f5e" opacity="0.5" />
          </g>
        )}

        {/* Type Specific Accessories */}
        {/* 1. Golden Crown */}
        {type === 'GOLDEN' && (
          <g>
            <polygon points="46,38 42,20 52,28 60,16 68,28 78,20 74,38" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
            <circle cx="60" cy="18" r="2.5" fill="#dc2626" />
            <circle cx="42" cy="22" r="2" fill="#2563eb" />
            <circle cx="78" cy="22" r="2" fill="#16a34a" />
          </g>
        )}

        {/* 2. Construction Helmet */}
        {type === 'HELMET' && (
          <g>
            {hitsLeft === maxHits ? (
              // Full Helmet
              <g>
                <path d="M 32 44 Q 60 14 88 44 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
                <rect x="28" y="42" width="64" height="6" rx="3" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
                <rect x="56" y="22" width="8" height="20" rx="2" fill="#ca8a04" opacity="0.4" />
              </g>
            ) : (
              // Cracked / Broken Helmet knocked askew
              <g transform="rotate(-15 60 30)">
                <path d="M 34 42 Q 60 16 86 42 Z" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
                <path d="M 52 26 L 58 34 L 54 40" stroke="#78350f" strokeWidth="2" fill="none" />
                <rect x="30" y="40" width="60" height="5" rx="2.5" fill="#ca8a04" />
              </g>
            )}
          </g>
        )}

        {/* 3. Ninja Headband */}
        {type === 'NINJA' && (
          <g>
            <rect x="30" y="44" width="60" height="9" rx="2" fill="#dc2626" />
            {/* Flying headband tail */}
            <path d="M 90 48 Q 106 42 114 50" fill="none" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
            <path d="M 90 51 Q 104 56 112 64" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
            {/* Ninja forehead badge */}
            <circle cx="60" cy="48.5" r="3" fill="#f8fafc" />
          </g>
        )}

        {/* 4. Little Paws on Edge */}
        <ellipse cx="36" cy="98" rx="8" ry="6" fill="#fed7aa" stroke={furColor} strokeWidth="1.5" />
        <ellipse cx="84" cy="98" rx="8" ry="6" fill="#fed7aa" stroke={furColor} strokeWidth="1.5" />
      </svg>
    </div>
  );
};
