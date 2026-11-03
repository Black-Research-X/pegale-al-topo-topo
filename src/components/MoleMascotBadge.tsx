import React, { useState } from 'react';
import { moleBadgeBase64 } from '../assets/images/moleBadgeBase64';

interface MoleMascotBadgeProps {
  className?: string;
}

export const MoleMascotBadge: React.FC<MoleMascotBadgeProps> = ({
  className = 'w-24 h-24 sm:w-28 sm:h-28',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // Highly polished SVG Mascot Fallback
    return (
      <div
        className={`${className} rounded-2xl bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 p-2 flex items-center justify-center border-2 border-amber-400 shadow-xl overflow-hidden relative select-none`}
      >
        <div className="absolute inset-0 bg-radial from-amber-400/25 to-transparent pointer-events-none" />
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
          {/* Ground mound */}
          <ellipse cx="50" cy="85" rx="38" ry="12" fill="#451a03" />
          <ellipse cx="50" cy="82" rx="30" ry="7" fill="#1c0d02" />
          {/* Mole head */}
          <circle cx="50" cy="52" r="26" fill="#92400e" />
          {/* Cap */}
          <path d="M 30 42 Q 50 20 70 42 Z" fill="#16a34a" />
          <rect x="26" y="40" width="48" height="6" rx="3" fill="#22c55e" />
          {/* Cap logo */}
          <text x="50" y="37" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">M</text>
          {/* Ears */}
          <circle cx="28" cy="48" r="7" fill="#92400e" />
          <circle cx="28" cy="48" r="4" fill="#f472b6" />
          <circle cx="72" cy="48" r="7" fill="#92400e" />
          <circle cx="72" cy="48" r="4" fill="#f472b6" />
          {/* Eyes */}
          <ellipse cx="42" cy="48" rx="4.5" ry="6" fill="#0f172a" />
          <circle cx="40.5" cy="46" r="1.8" fill="#ffffff" />
          <ellipse cx="58" cy="48" rx="4.5" ry="6" fill="#0f172a" />
          <circle cx="56.5" cy="46" r="1.8" fill="#ffffff" />
          {/* Rosy cheeks */}
          <ellipse cx="34" cy="56" rx="4" ry="2.5" fill="#f43f5e" opacity="0.6" />
          <ellipse cx="66" cy="56" rx="4" ry="2.5" fill="#f43f5e" opacity="0.6" />
          {/* Muzzle and Nose */}
          <ellipse cx="50" cy="58" rx="14" ry="9" fill="#fed7aa" />
          <ellipse cx="50" cy="54" rx="5.5" ry="4" fill="#db2777" />
          <ellipse cx="48.5" cy="53" rx="1.5" ry="1" fill="#ffffff" opacity="0.8" />
          {/* Teeth */}
          <rect x="47" y="60.5" width="3" height="4.5" rx="0.5" fill="#ffffff" />
          <rect x="50.5" y="60.5" width="3" height="4.5" rx="0.5" fill="#ffffff" />
          {/* Cute smile */}
          <path d="M 43 59 Q 50 66 57 59" fill="none" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
          {/* Tiny Mallet held by mole */}
          <line x1="72" y1="68" x2="84" y2="36" stroke="#b45309" strokeWidth="4.5" strokeLinecap="round" />
          <rect x="76" y="28" width="18" height="12" rx="3" fill="#78350f" stroke="#451a03" strokeWidth="1.5" transform="rotate(-18 85 34)" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={moleBadgeBase64}
      alt="Mascota Pégale al Topo"
      onError={() => setHasError(true)}
      className={`${className} rounded-2xl object-cover border-2 border-amber-400 shadow-xl bg-amber-900 block`}
    />
  );
};
