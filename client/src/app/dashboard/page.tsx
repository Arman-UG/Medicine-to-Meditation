'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { api, Activity } from '../../lib/api';
import { ActivityCard } from '../../components/ActivityCard';
import { StressSelector } from '../../components/StressSelector';
import { Shield, Sparkles, RefreshCw, Clock, AlertTriangle, ArrowRight, Music } from 'lucide-react';

export default function DashboardPage() {
  const { user, updateStress } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStress, setSelectedStress] = useState<string | null>(user?.stress_level || null);

  useEffect(() => {
    if (user?.stress_level) {
      setSelectedStress(user.stress_level);
    }
  }, [user]);

  useEffect(() => {
    api.getActivities()
      .then(res => {
        setActivities(res.activities);
      })
      .catch(err => {
        console.error('Failed to load activities:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStressChange = (lvl: string | null) => {
    setSelectedStress(lvl);
    if (user) {
      updateStress(lvl);
    }
  };

  const membership = user?.membership;
  const isSubscribed = membership?.tier === 'subscribed' || user?.subscription?.status === 'active';
  const isTrialActive = membership?.tier === 'trial_active';
  const isTrialExpired = membership?.tier === 'trial_expired';
  const isSubExpired = membership?.tier === 'subscription_expired';

  // Filter activities based on optional self-reported stress level
  const filteredActivities = activities.filter(act => {
    if (!selectedStress) return true;
    if (selectedStress === 'high') {
      return act.id === 'cyclic-sighing' || act.id === 'long-exhale' || act.id === 'grounding-54321';
    }
    if (selectedStress === 'moderate') {
      return act.id === 'box-breathing' || act.id === 'seated-muscle-release' || act.id === 'cyclic-sighing';
    }
    if (selectedStress === 'mild') {
      return act.id === 'guided-body-scan' || act.id === 'box-breathing' || act.id === 'seated-muscle-release';
    }
    return true;
  });

  const featuredActivity = activities.find(a => a.id === 'cyclic-sighing') || activities[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10">
      
      {/* Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sage-200/80 pb-5">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-forest font-medium">
            {user ? `Peace be with you, ${user.full_name.split(' ')[0]}` : 'Welcome to Medicine to Meditation'}
          </h1>
          <p className="text-xs sm:text-sm text-earth-charcoal mt-1 font-medium">
            Open a practice. Follow your breath. Return with a clear mind.
          </p>
        </div>

        {isSubscribed && (
          <div className="inline-flex items-center gap-1.5 self-start sm:self-auto bg-sage-200 text-forest text-xs px-3.5 py-1.5 rounded-full border border-sage-300 font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-sage-700" />
            <span>Medicine to Meditation Pro</span>
          </div>
        )}
      </div>

      {/* Trial / Membership Status Notification Banner (Phase 2) */}
      {isTrialActive && (
        <div className="bg-sage-100/90 border border-sage-300 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-sage-200 text-forest flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-forest">
                {membership?.label}
              </p>
              <p className="text-[11px] text-earth-charcoal font-medium">
                You have full, unrestricted access to all 6 guided activities and the Audio Library.
              </p>
            </div>
          </div>
          <Link
            href="/subscribe"
            className="self-stretch sm:self-auto px-4 py-2 bg-forest text-ivory-100 hover:bg-forest-light text-xs font-semibold rounded-full transition-all text-center shrink-0 shadow-xs"
          >
            Lock in ₹99/mo Plan
          </Link>
        </div>
      )}

      {(isTrialExpired || isSubExpired) && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-amber-950">
                {isSubExpired ? 'Subscription Expired' : '72-Hour Free Trial Concluded'}
              </p>
              <p className="text-[11px] text-earth-charcoal font-medium">
                Activate your monthly subscription to unlock all 6 relaxation practices and soundscapes.
              </p>
            </div>
          </div>
          <Link
            href="/subscribe"
            className="self-stretch sm:self-auto px-5 py-2 bg-forest text-ivory-100 hover:bg-forest-light text-xs font-semibold rounded-full transition-all text-center shrink-0 shadow-xs"
          >
            Subscribe for ₹99
          </Link>
        </div>
      )}

      {/* Featured Daily Focus Card */}
      {featuredActivity && (
        <ActivityCard activity={featuredActivity} variant="featured" />
      )}

      {/* Optional Self-Reported Stress Selector */}
      <div className="bg-white p-5 rounded-3xl border border-sage-200 shadow-xs">
        <StressSelector
          selectedLevel={selectedStress}
          onSelect={handleStressChange}
        />
      </div>

      {/* Activity Library */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl text-forest font-medium">
              Activity Library
            </h2>
            <p className="text-xs text-earth-charcoal font-medium">
              {filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'} tailored to this moment
            </p>
          </div>

          {selectedStress && (
            <button
              onClick={() => handleStressChange(null)}
              className="text-xs text-forest hover:text-forest-dark flex items-center gap-1 font-semibold transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Show all 6</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-sage-100/60 animate-pulse border border-sage-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredActivities.map(activity => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </section>

      {/* Medical Disclaimer Banner */}
      <div className="bg-sage-50 rounded-2xl p-4 border border-sage-200 text-center max-w-3xl mx-auto">
        <p className="text-xs text-earth-charcoal leading-relaxed font-medium">
          <Shield className="w-3.5 h-3.5 inline mr-1 text-sage-700" />
          <strong>Medical Notice:</strong> These self-guided relaxation activities in Medicine to Meditation are non-clinical wellness exercises designed to support everyday calm. They are not intended to diagnose, treat, or cure medical conditions. Stop any exercise immediately if you feel lightheaded.
        </p>
      </div>

    </div>
  );
}
