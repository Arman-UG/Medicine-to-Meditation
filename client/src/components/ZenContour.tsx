'use client';

import React from 'react';

interface ZenContourProps {
  phase?: 'inhale' | 'hold' | 'exhale' | 'pause' | 'idle';
  progress?: number; // 0 to 1
  size?: number; // width & height in px
  className?: string;
  subText?: string;
}

export const ZenContour: React.FC<ZenContourProps> = ({
  phase = 'idle',
  progress = 0,
  size = 320,
  className = '',
  subText
}) => {
  // Determine scale factor based on breathing phase
  let scale = 1.0;
  if (phase === 'inhale') {
    scale = 0.95 + progress * 0.35; // Expands from 0.95 to 1.30
  } else if (phase === 'hold') {
    scale = 1.30; // Holds expanded
  } else if (phase === 'exhale') {
    scale = 1.30 - progress * 0.35; // Contracts from 1.30 to 0.95
  } else if (phase === 'pause') {
    scale = 0.95; // Resting stillness
  }

  // Generate 5 organic topographic contour paths
  // Using calibrated smooth cubic bezier points for the signature zen contour look in Reference 2
  const contours = [
    { scale: 0.52, opacity: 0.95, strokeWidth: 2.2 },
    { scale: 0.68, opacity: 0.75, strokeWidth: 1.8 },
    { scale: 0.84, opacity: 0.55, strokeWidth: 1.5 },
    { scale: 1.00, opacity: 0.40, strokeWidth: 1.2 },
    { scale: 1.18, opacity: 0.25, strokeWidth: 1.0 },
    { scale: 1.36, opacity: 0.15, strokeWidth: 0.8 },
  ];

  return (
    <div 
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Breathing visualization: ${phase} phase`}
    >
      <svg
        viewBox="0 0 300 300"
        className="w-full h-full overflow-visible transition-transform duration-700 ease-out"
        style={{
          transform: `scale(${scale})`,
          willChange: 'transform',
        }}
      >
        <defs>
          <radialGradient id="zenGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8BA892" stopOpacity="0.16" />
            <stop offset="60%" stopColor="#A3B899" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#FBFBF7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient center aura */}
        <circle cx="150" cy="150" r="130" fill="url(#zenGlow)" />

        {contours.map((c, idx) => (
          <path
            key={idx}
            d="M 150 72
               C 188 68, 222 92, 228 126
               C 234 162, 216 198, 192 222
               C 168 244, 132 248, 108 226
               C 82 202, 68 168, 76 134
               C 82 98, 114 74, 150 72 Z"
            fill="none"
            stroke="#1E352F"
            strokeWidth={c.strokeWidth}
            opacity={c.opacity}
            style={{
              transformOrigin: '150px 150px',
              transform: `scale(${c.scale})`,
              transition: 'all 0.6s ease-out'
            }}
          />
        ))}

        {/* Soft breathing center node */}
        <circle
          cx="150"
          cy="150"
          r={phase === 'hold' ? 14 : 10}
          fill="#1E352F"
          opacity={phase === 'hold' ? 0.9 : 0.6}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Floating Center Prompt */}
      {subText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="font-serif text-2xl tracking-wide text-forest font-medium drop-shadow-sm">
            {subText}
          </span>
        </div>
      )}
    </div>
  );
};
