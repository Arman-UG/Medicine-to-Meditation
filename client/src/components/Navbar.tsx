'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Leaf, User as UserIcon, ShieldCheck, Sparkles, LogOut, ChevronDown, Music, Clock, AlertTriangle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, updateStress } = useAuth();
  const pathname = usePathname();
  const [showStressMenu, setShowStressMenu] = useState(false);

  // Time-aware peaceful greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const membership = user?.membership;
  const isSubscribed = membership?.tier === 'subscribed' || user?.subscription?.status === 'active';
  const isTrialActive = membership?.tier === 'trial_active';
  const isTrialExpired = membership?.tier === 'trial_expired';
  const isSubExpired = membership?.tier === 'subscription_expired';

  return (
    <header className="sticky top-0 z-40 bg-ivory-100/95 backdrop-blur-md border-b border-sage-200/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand / Logo: Medicine to Meditation */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-sage-200/90 flex items-center justify-center text-forest group-hover:bg-sage-300 transition-colors shadow-xs">
            <Leaf className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <span className="font-serif text-lg sm:text-2xl tracking-wide text-forest font-semibold block leading-tight">
              Medicine to Meditation
            </span>
            <span className="text-[10px] tracking-widest uppercase text-earth-muted font-sans font-medium hidden sm:block">
              Open • Choose • Relax • Return
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-earth-charcoal">
          <Link
            href="/dashboard"
            className={`transition-colors hover:text-forest ${pathname === '/dashboard' ? 'text-forest underline underline-offset-8 decoration-2 decoration-sage-500' : ''}`}
          >
            Activities
          </Link>
          <Link
            href="/audio"
            className={`transition-colors hover:text-forest flex items-center gap-1.5 ${pathname === '/audio' ? 'text-forest underline underline-offset-8 decoration-2 decoration-sage-500' : ''}`}
          >
            <Music className="w-3.5 h-3.5 text-sage-700" />
            <span>Audio Library</span>
          </Link>
          <Link
            href="/subscribe"
            className={`transition-colors hover:text-forest flex items-center gap-1.5 ${pathname === '/subscribe' ? 'text-forest underline underline-offset-8 decoration-2 decoration-sage-500' : ''}`}
          >
            <span>Membership</span>
            <span className="text-[11px] bg-sage-200 text-forest px-2 py-0.5 rounded-full font-mono font-medium">
              ₹99/mo
            </span>
          </Link>
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`transition-colors text-sage-800 hover:text-forest flex items-center gap-1 font-semibold ${pathname === '/admin' ? 'text-forest underline underline-offset-8 decoration-2 decoration-sage-500' : ''}`}
            >
              <ShieldCheck className="w-4 h-4 text-forest" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* Right Section: User & Membership Indicator */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Optional Stress Level Pill */}
              <div className="relative">
                <button
                  onClick={() => setShowStressMenu(!showStressMenu)}
                  className="hidden lg:flex items-center gap-1.5 text-xs bg-white hover:bg-sage-50 text-forest font-medium px-3 py-1.5 rounded-full border border-sage-300 transition-colors shadow-xs"
                  title="Update self-reported stress level"
                >
                  <span className="w-2 h-2 rounded-full bg-sage-600"></span>
                  <span className="capitalize">{user.stress_level ? `${user.stress_level} Stress` : 'Stress Check-in'}</span>
                  <ChevronDown className="w-3 h-3 text-earth-muted" />
                </button>

                {showStressMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-sage-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    <p className="px-4 py-1 text-[11px] uppercase tracking-wider text-earth-muted font-semibold">Self-Reported State</p>
                    {(['mild', 'moderate', 'high'] as const).map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => {
                          updateStress(lvl);
                          setShowStressMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-sage-50 capitalize transition-colors flex items-center justify-between ${user.stress_level === lvl ? 'font-semibold text-forest bg-sage-100/70' : 'text-earth-charcoal font-medium'}`}
                      >
                        <span>{lvl} Stress</span>
                        {user.stress_level === lvl && <span className="w-1.5 h-1.5 rounded-full bg-forest"></span>}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        updateStress(null);
                        setShowStressMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-earth-muted hover:bg-sage-50 transition-colors border-t border-sage-100 mt-1 font-medium"
                    >
                      Clear preference
                    </button>
                  </div>
                )}
              </div>

              {/* Authoritative Membership & Trial Indicator (Phase 2.4) */}
              <Link
                href="/subscribe"
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                  isSubscribed
                    ? 'bg-sage-200 text-forest border border-sage-400'
                    : isTrialActive
                    ? 'bg-sage-100 text-forest border border-sage-300'
                    : isTrialExpired || isSubExpired
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                    : 'bg-forest text-ivory-100 hover:bg-forest-light'
                }`}
                title={
                  isSubscribed 
                    ? 'Active Paid Membership' 
                    : isTrialActive 
                    ? `72-Hour Free Trial (${membership?.hoursRemaining}h remaining)` 
                    : 'Membership Inactive — Click to Subscribe'
                }
              >
                {isSubscribed ? (
                  <>
                    <Sparkles className="w-3 h-3 text-sage-700" />
                    <span>Subscribed</span>
                  </>
                ) : isTrialActive ? (
                  <>
                    <Clock className="w-3 h-3 text-sage-700" />
                    <span className="hidden sm:inline">{membership?.label || 'Free Trial Active'}</span>
                    <span className="sm:hidden">Trial Active</span>
                  </>
                ) : isTrialExpired ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                    <span>Trial Expired • ₹99</span>
                  </>
                ) : isSubExpired ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                    <span>Sub Expired • ₹99</span>
                  </>
                ) : (
                  <span>Subscribe ₹99</span>
                )}
              </Link>

              {/* Profile Link */}
              <Link
                href="/profile"
                className="w-9 h-9 rounded-full bg-earth-oat hover:bg-earth-sand flex items-center justify-center text-forest transition-colors shadow-xs"
                title={`${getGreeting()}, ${user.full_name}`}
              >
                <UserIcon className="w-4 h-4 stroke-[2]" />
              </Link>

              {/* Sign out */}
              <button
                onClick={logout}
                className="text-earth-muted hover:text-forest p-1.5 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-semibold text-forest hover:text-forest-dark px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-forest text-ivory-100 hover:bg-forest-light px-4 py-2 rounded-full transition-all shadow-sm"
              >
                Free Trial
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
