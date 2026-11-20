'use client';

import React from 'react';

interface BreathingArtProps {
  phase?: 'inhale' | 'hold' | 'exhale' | 'pause' | 'idle';
  progress?: number; // 0 to 1
  size?: number;
  className?: string;
  subText?: string;
  phaseName?: string;
  secondsRemaining?: number;
}

export const BreathingArt: React.FC<BreathingArtProps> = ({
  phase = 'idle',
  progress = 0,
  size = 380,
  className = '',
  subText,
  phaseName,
  secondsRemaining
}) => {
  // Expansion and flowing breath offsets synchronized with the exercise timer
  let breathExpansion = 0; // 0 (settled) to 1 (fully expanded)
  let breathOpacity = 0.5;

  if (phase === 'inhale') {
    breathExpansion = Math.min(1, Math.max(0, progress));
    breathOpacity = 0.45 + breathExpansion * 0.55;
  } else if (phase === 'hold') {
    breathExpansion = 1.0;
    breathOpacity = 0.95;
  } else if (phase === 'exhale') {
    breathExpansion = Math.max(0, 1.0 - progress);
    breathOpacity = 0.95 - (1.0 - breathExpansion) * 0.5;
  } else {
    // pause / idle / rest
    breathExpansion = 0.05;
    breathOpacity = 0.35;
  }

  // Calculate dynamic coordinates for the flowing dark teal breath ribbons
  const flowOffset1 = breathExpansion * 42;
  const flowOffset2 = breathExpansion * 65;
  const flowOffset3 = breathExpansion * 88;
  const auraScale = 0.92 + breathExpansion * 0.18;

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      style={{ width: size, minHeight: size }}
      role="img"
      aria-label={`Human profile breathing visualization: ${phase} phase`}
    >
      <svg
        viewBox="0 0 440 440"
        className="w-full h-full overflow-visible transition-transform duration-700 ease-out"
      >
        <defs>
          {/* Muted Terracotta Aura Gradient */}
          <radialGradient id="terracottaAura" cx="45%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#D87A56" stopOpacity="0.88" />
            <stop offset="70%" stopColor="#C86A4B" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#B65A3D" stopOpacity="0.45" />
          </radialGradient>

          {/* Soft Beige / Ochre Secondary Shape Gradient */}
          <linearGradient id="ochreShape" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E9DFD1" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#DFD3C3" stopOpacity="0.75" />
          </linearGradient>

          {/* Gentle Breath Wave Gradient */}
          <linearGradient id="breathTeal" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E352F" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#2A5C54" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4A857B" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* 1. Warm Abstract Background Forms (Artistic Boho / Modernist Aesthetics) */}
        {/* Soft Ochre / Sand Secondary Organic Shape */}
        <path
          d="M 120 130
             C 100 80, 160 50, 220 70
             C 275 88, 305 140, 295 195
             C 285 250, 230 280, 180 270
             C 130 260, 140 180, 120 130 Z"
          fill="url(#ochreShape)"
          className="transition-transform duration-1000 ease-out"
          style={{
            transformOrigin: '200px 170px',
            transform: `scale(${1.0 + breathExpansion * 0.04})`,
          }}
        />

        {/* Muted Terracotta Sun / Aura Circle */}
        <circle
          cx="245"
          cy="195"
          r="86"
          fill="url(#terracottaAura)"
          className="transition-transform duration-700 ease-out"
          style={{
            transformOrigin: '245px 195px',
            transform: `scale(${auraScale})`,
          }}
        />

        {/* Subtle Zen Accent Ring */}
        <circle
          cx="245"
          cy="195"
          r="108"
          fill="none"
          stroke="#C86A4B"
          strokeWidth="1.2"
          strokeDasharray="4 6"
          opacity={0.35 + breathExpansion * 0.25}
        />

        {/* 2. Flowing Dark Teal Breath Wave Ribbons (Synchronized Breathing Lines) */}
        {/* Upper flowing stream from breath zone */}
        <path
          d={`M 268 226 
              C ${295 + flowOffset1 * 0.4} ${215 - flowOffset1 * 0.3}, 
                ${330 + flowOffset1 * 0.8} ${195 - flowOffset1 * 0.5}, 
                ${380 + flowOffset1} ${205 - flowOffset1 * 0.3}`}
          fill="none"
          stroke="#204E4A"
          strokeWidth={2.4 + breathExpansion * 1.2}
          strokeLinecap="round"
          opacity={breathOpacity}
          className="transition-all duration-300 ease-out"
        />

        {/* Center core breath wave ribbon */}
        <path
          d={`M 266 235 
              C ${300 + flowOffset2 * 0.5} ${238 + flowOffset2 * 0.1}, 
                ${345 + flowOffset2 * 0.8} ${220 - flowOffset2 * 0.3}, 
                ${400 + flowOffset2} ${240 + flowOffset2 * 0.2}`}
          fill="none"
          stroke="#1E352F"
          strokeWidth={3.0 + breathExpansion * 1.5}
          strokeLinecap="round"
          opacity={breathOpacity}
          className="transition-all duration-300 ease-out"
        />

        {/* Lower expanding breath wave ribbon */}
        <path
          d={`M 262 245 
              C ${290 + flowOffset3 * 0.4} ${265 + flowOffset3 * 0.3}, 
                ${330 + flowOffset3 * 0.7} ${285 + flowOffset3 * 0.4}, 
                ${385 + flowOffset3} ${275 + flowOffset3 * 0.2}`}
          fill="none"
          stroke="#2A5C54"
          strokeWidth={2.0 + breathExpansion * 1.0}
          strokeLinecap="round"
          opacity={breathOpacity * 0.85}
          className="transition-all duration-300 ease-out"
        />

        {/* Soft undulating harmonic ripples during hold/pause */}
        {phase === 'hold' && (
          <circle
            cx="272"
            cy="234"
            r="16"
            fill="none"
            stroke="#D87A56"
            strokeWidth="1.5"
            className="animate-ping opacity-30"
          />
        )}

        {/* 3. Minimalist Continuous-Line Human Profile (Facing Right in Peaceful Contemplation) */}
        {/* Continuous elegant contour of forehead, nose, lips, chin, jawline and throat */}
        <path
          d="M 160 330
             C 170 310, 182 295, 185 275
             C 188 255, 186 240, 178 220
             C 170 200, 172 170, 180 148
             C 190 120, 215 95, 240 102
             C 255 106, 264 120, 262 140
             C 260 156, 256 166, 258 178
             C 260 186, 268 198, 274 205
             C 278 210, 280 216, 274 220
             C 268 224, 264 225, 268 230
             C 272 235, 273 240, 267 244
             C 260 248, 254 250, 260 258
             C 265 265, 260 274, 246 278
             C 228 284, 215 282, 204 294
             C 192 308, 188 322, 184 340 Z"
          fill="none"
          stroke="#1E352F"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-xs"
        />

        {/* Serene Closed Eye Linework (Calm Expression) */}
        <path
          d="M 234 165 C 242 172, 250 172, 256 166"
          fill="none"
          stroke="#1E352F"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Gentle Eyebrow Curve */}
        <path
          d="M 230 154 C 240 150, 252 153, 258 158"
          fill="none"
          stroke="#1E352F"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Soft Restful Lip Line */}
        <path
          d="M 264 236 C 268 237, 273 236, 276 235"
          fill="none"
          stroke="#1E352F"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Relaxed Ear Line */}
        <path
          d="M 194 192 C 188 198, 188 214, 196 220 C 199 223, 198 228, 194 231"
          fill="none"
          stroke="#1E352F"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.65"
        />
      </svg>

      {/* Floating Center / Bottom Information Prompt */}
      {subText && (
        <div className="mt-2 text-center pointer-events-none">
          <span className="font-serif text-2xl sm:text-3xl tracking-wide text-forest font-semibold drop-shadow-xs block">
            {subText}
          </span>
          {phaseName && (
            <span className="text-xs uppercase tracking-widest font-mono text-sage-800 font-medium">
              {phaseName} {secondsRemaining !== undefined ? `• ${secondsRemaining}s` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
