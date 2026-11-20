'use client';

import React from 'react';

interface StressSelectorProps {
  selectedLevel: string | null;
  onSelect: (level: string | null) => void;
}

export const StressSelector: React.FC<StressSelectorProps> = ({ selectedLevel, onSelect }) => {
  const levels = [
    { id: null, label: 'All Activities', hint: 'Browse all practices' },
    { id: 'mild', label: 'Mild Pressure', hint: 'Gentle resets & steady rhythm' },
    { id: 'moderate', label: 'Moderate Stress', hint: 'Grounding & intentional balance' },
    { id: 'high', label: 'High Tension', hint: 'Immediate physiological sighs & vagus stimulation' },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-serif font-medium text-forest">
            How are you feeling right now?
          </h3>
          <p className="text-xs text-earth-muted">
            Optional self-reported preference • Filter activities suited for this moment
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {levels.map((lvl) => {
          const isSelected = selectedLevel === lvl.id;
          return (
            <button
              key={lvl.label}
              onClick={() => onSelect(lvl.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                isSelected
                  ? 'bg-forest text-ivory-100 border-forest shadow-sm'
                  : 'bg-white/80 hover:bg-sage-50 text-earth-charcoal border-sage-200/80'
              }`}
            >
              <span>{lvl.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
