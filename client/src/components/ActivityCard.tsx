'use client';

import React from 'react';
import Link from 'next/link';
import { Activity } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Wind, Heart, Moon, Compass, Sparkles, Clock, ArrowRight, Play, Lock } from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
  variant?: 'featured' | 'standard';
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, variant = 'standard' }) => {
  const { user } = useAuth();
  const minutes = Math.ceil(activity.default_duration_sec / 60);

  const isLocked = user && user.role !== 'admin' && user.membership && !user.membership.hasAccess;

  // Category Icon & Tint selector
  const getCategoryMeta = () => {
    switch (activity.id) {
      case 'cyclic-sighing':
        return {
          icon: Wind,
          bg: 'bg-[#EAF1EB]', // Soft sage tint
          accent: 'text-sage-800',
          badge: 'Acute Stress Relief'
        };
      case 'box-breathing':
        return {
          icon: Compass,
          bg: 'bg-[#F3ECE4]', // Warm oat
          accent: 'text-[#584838]',
          badge: 'Balance & Focus'
        };
      case 'long-exhale':
        return {
          icon: Wind,
          bg: 'bg-[#EBF1EF]', // Soft mist
          accent: 'text-sage-900',
          badge: 'Parasympathetic Reset'
        };
      case 'seated-muscle-release':
        return {
          icon: Heart,
          bg: 'bg-[#ECE8F4]', // Soft lavender
          accent: 'text-[#4A415E]',
          badge: 'Desk Tension Release'
        };
      case 'grounding-54321':
        return {
          icon: Compass,
          bg: 'bg-[#ECEFE8]', // Pale matcha
          accent: 'text-sage-900',
          badge: 'Sensory Grounding'
        };
      case 'guided-body-scan':
      default:
        return {
          icon: Moon,
          bg: 'bg-[#EAE8F2]', // Soft dusk lavender
          accent: 'text-[#443C5C]',
          badge: 'Full Body Ease'
        };
    }
  };

  const meta = getCategoryMeta();
  const IconComponent = meta.icon;

  if (variant === 'featured') {
    return (
      <div className="relative overflow-hidden rounded-4xl bg-forest text-ivory-100 p-6 sm:p-8 shadow-md">
        {/* Soft background nature graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 pointer-events-none">
          <svg viewBox="0 0 400 300" className="w-full h-full object-cover">
            <path d="M 0 240 Q 150 180 300 220 T 400 150 L 400 300 L 0 300 Z" fill="#8BA892" />
            <path d="M 50 260 Q 200 210 350 240 T 400 200 L 400 300 L 0 300 Z" fill="#415A4D" opacity="0.6" />
            <circle cx="340" cy="80" r="30" fill="#F7F6F0" opacity="0.5" />
          </svg>
        </div>

        <div className="relative z-10 max-w-md space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-sans uppercase tracking-widest text-sage-200 font-bold bg-forest-card px-2.5 py-1 rounded-full border border-sage-700/60">
              DAILY FOCUS
            </span>
            <span className="text-xs text-sage-200 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>{minutes} min • Guided</span>
            </span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl text-ivory-100 font-medium leading-snug">
            {activity.name}
          </h3>

          <p className="text-xs sm:text-sm text-sage-100/90 leading-relaxed font-normal">
            {activity.description}
          </p>

          <div className="pt-4">
            <Link
              href={`/activity/${activity.slug}`}
              className="inline-flex items-center gap-2.5 bg-ivory-100 text-forest hover:bg-white px-6 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm hover:scale-[1.02]"
            >
              {isLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Subscribe to Practice</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Begin Practice</span>
                </>
              )}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border border-sage-200/90 flex flex-col justify-between ${meta.bg}`}>
      <div>
        {/* Header meta */}
        <div className="flex items-center justify-between mb-3.5">
          <div className={`w-10 h-10 rounded-2xl bg-white flex items-center justify-center ${meta.accent} shadow-xs`}>
            <IconComponent className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[11px] font-mono font-semibold text-forest bg-white/80 px-2.5 py-0.5 rounded-full border border-sage-200/50">
            {minutes} min
          </span>
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-forest/75 block mb-1">
          {meta.badge}
        </span>

        <h4 className="font-serif text-lg sm:text-xl font-semibold text-forest mb-2 leading-snug">
          {activity.name}
        </h4>

        <p className="text-xs text-earth-charcoal leading-relaxed mb-4 font-normal">
          {activity.description}
        </p>
      </div>

      <div className="pt-3 border-t border-black/5 flex items-center justify-between">
        <span className="text-xs text-forest/80 font-medium">
          {activity.category === 'breathing' ? 'Rhythmic Breath' : 'Guided Awareness'}
        </span>

        <Link
          href={`/activity/${activity.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:text-forest-dark bg-white hover:bg-ivory-100 px-4 py-1.5 rounded-full shadow-xs border border-sage-200 transition-colors"
        >
          {isLocked ? (
            <>
              <Lock className="w-3 h-3" />
              <span>Unlock</span>
            </>
          ) : (
            <>
              <span>Start</span>
              <ArrowRight className="w-3 h-3" />
            </>
          )}
        </Link>
      </div>
    </div>
  );
};
