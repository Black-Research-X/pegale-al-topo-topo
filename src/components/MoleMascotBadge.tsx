import React, { useState } from 'react';
import moleBadgeImage from '../assets/images/mole_arcade_badge_1793567789459.jpg';

interface MoleMascotBadgeProps {
  className?: string;
}

export const MoleMascotBadge: React.FC<MoleMascotBadgeProps> = ({ className = 'w-24 h-24 sm:w-28 sm:h-28' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [triedPublic, setTriedPublic] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(moleBadgeImage);

  const handleError = () => {
    if (!triedPublic) {
      setTriedPublic(true);
      setCurrentSrc('/images/mole_arcade_badge.jpg');
    } else {
      setImgFailed(true);
    }
  };

  if (imgFailed) {
    // Beautiful SVG Mascot Fallback
    return (
      <div className={`${className} rounded-2xl bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 p-2 flex items-center justify-center border-2 border-amber-400 shadow-xl overflow-hidden relative`}>
        <div className="absolute inset-0 bg-radial from-amber-400/20 to-transparent" />
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow">
          {/* Ground mound */}
          <ellipse cx="50" cy="85" rx="38" ry="12" fill="#451a03" />
          <ellipse cx="50" cy="82" rx="30" ry="7" fill="#1c0d02" />
          {/* Mole head */}
          <circle cx="50" cy="52" r="26" fill="#92400e" />
          {/* Cap */}
          <path d="M 30 42 Q 50 20 70 42 Z" fill="#16a34a" />
          <rect x="26" y="40" width="48" height="6" rx="3" fill="#22c55e" />
          {/* Ears */}
          <circle cx="28" cy="48" r="7" fill="#92400e" />
          <circle cx="28" cy="48" r="4" fill="#f472b6" />
          <circle cx="72" cy="48" r="7" fill="#92400e" />
          <circle cx="72" cy="48" r="4" fill="#f472b6" />
          {/* Eyes */}
          <ellipse cx="42" cy="48" rx="4" ry="5.5" fill="#0f172a" />
          <circle cx="40.5" cy="46" r="1.5" fill="#ffffff" />
          <ellipse cx="58" cy="48" rx="4" ry="5.5" fill="#0f172a" />
          <circle cx="56.5" cy="46" r="1.5" fill="#ffffff" />
          {/* Muzzle and Nose */}
          <ellipse cx="50" cy="58" rx="14" ry="9" fill="#fed7aa" />
          <ellipse cx="50" cy="55" rx="5" ry="3.5" fill="#db2777" />
          {/* Teeth */}
          <rect x="47" y="60" width="3" height="4" rx="0.5" fill="#ffffff" />
          <rect x="50.5" y="60" width="3" height="4" rx="0.5" fill="#ffffff" />
          {/* Hammer held by mole */}
          <line x1="72" y1="65" x2="84" y2="35" stroke="#b45309" strokeWidth="4" strokeLinecap="round" />
          <rect x="76" y="28" width="16" height="10" rx="2" fill="#78350f" transform="rotate(-20 84 33)" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt="Mascota Pégale al Topo"
      referrerPolicy="no-referrer"
      onError={handleError}
      className={`${className} rounded-2xl object-cover border-2 border-amber-400 shadow-xl bg-amber-900`}
    />
  );
};
