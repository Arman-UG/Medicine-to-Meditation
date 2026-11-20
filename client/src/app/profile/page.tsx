'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { 
  User, 
  Sparkles, 
  CreditCard, 
  RefreshCw, 
  History, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshProfile, logout } = useAuth();
  const router = useRouter();

  const [profileData, setProfileData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingMode, setSavingMode] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/profile');
      return;
    }

    Promise.all([
      api.getProfile(),
      api.getUserHistory().catch(() => ({ history: [] }))
    ])
      .then(([prof, hist]) => {
        setProfileData(prof);
        setHistory(hist.history || []);
      })
      .catch(err => {
        console.error('Failed to load profile:', err);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleToggleRenewalMode = async (mode: 'manual' | 'autopay') => {
    setSavingMode(true);
    setMessage(null);
    try {
      await api.updateRenewalPreferences({
        preferred_mode: mode,
        autopay_consent: mode === 'autopay'
      });
      setMessage(`Renewal preference changed to ${mode.toUpperCase()}.`);
      await refreshProfile();
      const updated = await api.getProfile();
      setProfileData(updated);
    } catch (err: any) {
      setMessage(err.message || 'Failed to update renewal preference.');
    } finally {
      setSavingMode(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you wish to disable auto-renewal? Your benefits remain active until the end of your paid cycle.')) {
      return;
    }

    setSavingMode(true);
    try {
      const res = await api.cancelSubscription();
      setMessage(res.message);
      await refreshProfile();
      const updated = await api.getProfile();
      setProfileData(updated);
    } catch (err: any) {
      setMessage(err.message || 'Unable to cancel subscription.');
    } finally {
      setSavingMode(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-forest animate-spin" />
      </div>
    );
  }

  const sub = profileData?.subscription || user.subscription;
  const renewalPrefs = profileData?.renewal_preferences || { preferred_mode: 'manual', autopay_consent: false };
  const mandate = profileData?.active_mandate;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      
      {/* Profile Header */}
      <div className="bg-white/90 rounded-4xl p-6 sm:p-8 border border-sage-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-sage-100 text-forest flex items-center justify-center font-serif text-2xl font-semibold">
            {user.full_name[0]}
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-forest font-medium">
              {user.full_name}
            </h1>
            <p className="text-xs text-earth-muted">{user.email}</p>
            <span className="inline-block mt-1 text-[11px] font-mono text-sage-800 bg-sage-50 px-2.5 py-0.5 rounded-full border border-sage-200">
              Role: {user.role} • Stress Check-in: {user.stress_level || 'None specified'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="self-start sm:self-auto px-5 py-2 rounded-full border border-sage-200 text-xs font-semibold text-earth-muted hover:text-forest hover:bg-sage-50 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {message && (
        <div className="bg-sage-100 text-forest text-xs p-3.5 rounded-2xl border border-sage-200 text-center animate-in fade-in">
          {message}
        </div>
      )}

      {/* Membership & Renewal Section (Phase 2 & Phase 6) */}
      <section className="bg-white/90 rounded-4xl p-6 sm:p-8 border border-sage-200/80 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-sage-100 pb-4">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-forest" />
            <h2 className="font-serif text-xl sm:text-2xl text-forest font-medium">
              Medicine to Meditation Membership & Renewal
            </h2>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-mono font-medium ${
            sub?.status === 'active' 
              ? 'bg-sage-100 text-forest border border-sage-300' 
              : profileData?.user?.membership?.tier === 'trial_active' || user?.membership?.tier === 'trial_active'
              ? 'bg-amber-50 text-amber-900 border border-amber-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {sub?.status === 'active' 
              ? 'Subscribed (Pro)' 
              : profileData?.user?.membership?.label || user?.membership?.label || 'Free Trial'}
          </span>
        </div>

        {/* 72-Hour Free Trial Active Banner */}
        {(profileData?.user?.membership?.tier === 'trial_active' || user?.membership?.tier === 'trial_active') && sub?.status !== 'active' && (
          <div className="p-5 rounded-3xl bg-sage-50/90 border border-sage-200/80 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-forest block">
                  Active 72-Hour Free Trial
                </span>
                <p className="text-sm font-medium text-forest">
                  Enjoy unlimited access to all 6 relaxation practices and soundscapes.
                </p>
                <p className="text-xs text-earth-charcoal leading-relaxed">
                  Your trial ends on{' '}
                  <span className="font-semibold text-forest">
                    {new Date(profileData?.user?.membership?.trialExpiresAt || user?.membership?.trialExpiresAt || user?.trial_expires_at || Date.now()).toLocaleString()}
                  </span>
                  {' '}(approx. {profileData?.user?.membership?.hoursRemaining || user?.membership?.hoursRemaining || 72} hours remaining).
                </p>
              </div>
              <span className="shrink-0 px-3 py-1 bg-white text-forest text-xs font-mono rounded-full border border-sage-300 font-semibold shadow-xs">
                {profileData?.user?.membership?.hoursRemaining || user?.membership?.hoursRemaining || 72}h Left
              </span>
            </div>
            <div className="pt-2 border-t border-sage-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-earth-muted">
                No automatic charges when the trial ends. Continue your journey anytime for ₹99/month.
              </span>
              <Link
                href="/subscribe"
                className="inline-flex items-center gap-1.5 text-forest font-semibold hover:underline shrink-0"
              >
                <span>Pre-activate ₹99 Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Trial Expired Banner */}
        {(profileData?.user?.membership?.tier === 'trial_expired' || user?.membership?.tier === 'trial_expired') && sub?.status !== 'active' && (
          <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-3 text-xs">
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-medium text-amber-950">
                Your 3-Day Free Trial Has Ended
              </h3>
              <p className="text-amber-900 leading-relaxed">
                We hope your trial brought calm to your everyday life. To continue practicing your guided breathing routines and listening to ambient soundscapes, subscribe for ₹99/month.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-amber-800 text-[11px]">
                Secure Razorpay Dynamic UPI QR • No hidden fees
              </span>
              <Link
                href="/subscribe"
                className="inline-flex items-center gap-2 bg-forest text-ivory-100 hover:bg-forest-light px-5 py-2 rounded-full font-semibold shadow-xs"
              >
                <span>Activate for ₹99</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {sub?.status === 'active' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-ivory-50 p-4 rounded-3xl border border-sage-100 text-xs">
              <div>
                <span className="text-earth-muted block text-[11px]">Current Plan</span>
                <span className="font-semibold text-forest text-sm">{sub.plan_name}</span>
                <span className="text-earth-muted block text-[11px]">₹99 / month</span>
              </div>
              <div>
                <span className="text-earth-muted block text-[11px]">Valid Until</span>
                <span className="font-semibold text-forest text-sm">
                  {new Date(sub.current_period_end).toLocaleDateString()}
                </span>
                <span className="text-earth-muted block text-[11px]">Active</span>
              </div>
              <div>
                <span className="text-earth-muted block text-[11px]">Current Renewal Mode</span>
                <span className="font-semibold text-forest text-sm capitalize">
                  {sub.renewal_type === 'autopay' ? 'UPI AutoPay' : 'Manual Renewal'}
                </span>
                <span className="text-earth-muted block text-[11px]">
                  {sub.renewal_type === 'autopay' ? 'Auto-debits each month' : 'Requires manual checkout'}
                </span>
              </div>
            </div>

            {/* Toggle Renewal Preference Mode */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold text-forest uppercase tracking-wider font-mono">
                Update Renewal Settings
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={savingMode}
                  onClick={() => handleToggleRenewalMode('manual')}
                  className={`p-4 rounded-3xl text-left border transition-all ${
                    sub.renewal_type === 'manual'
                      ? 'bg-sage-100/80 border-sage-400 text-forest font-semibold'
                      : 'bg-white border-sage-200 text-earth-muted hover:bg-sage-50'
                  }`}
                >
                  <span className="block text-xs font-medium">A. Manual Monthly Renewal</span>
                  <span className="text-[11px] text-earth-muted mt-1 block">
                    No recurring deductions. You will manually scan a dynamic UPI QR to renew at each month end.
                  </span>
                </button>

                <button
                  type="button"
                  disabled={savingMode}
                  onClick={() => handleToggleRenewalMode('autopay')}
                  className={`p-4 rounded-3xl text-left border transition-all ${
                    sub.renewal_type === 'autopay'
                      ? 'bg-sage-100/80 border-sage-400 text-forest font-semibold'
                      : 'bg-white border-sage-200 text-earth-muted hover:bg-sage-50'
                  }`}
                >
                  <span className="block text-xs font-medium">B. UPI AutoPay Recurring Mandate</span>
                  <span className="text-[11px] text-earth-muted mt-1 block">
                    Automatically renews your subscription each month seamlessly without interruption.
                  </span>
                </button>
              </div>

              {mandate && (
                <div className="bg-sage-50 p-3 rounded-2xl border border-sage-200 text-xs text-forest flex items-center justify-between">
                  <div>
                    <span className="font-medium">Active Mandate Token:</span> {mandate.mandate_token}
                  </div>
                  <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded text-sage-800">
                    Status: {mandate.status}
                  </span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleCancelSubscription}
                  disabled={savingMode}
                  className="text-xs text-red-600 hover:text-red-700 underline underline-offset-4"
                >
                  Cancel Auto-Renewal & Revoke Mandate
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Activity History Section (Phase 6) */}
      <section className="bg-white/90 rounded-4xl p-6 sm:p-8 border border-sage-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sage-100 pb-3">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-forest" />
            <h2 className="font-serif text-xl sm:text-2xl text-forest font-medium">
              Recent Practice History
            </h2>
          </div>
          <span className="text-xs text-earth-muted font-mono">
            {history.length} {history.length === 1 ? 'Session' : 'Sessions'} Completed
          </span>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-earth-muted text-center py-8">
            No completed sessions recorded yet. Start any exercise from the dashboard to create your practice log.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sage-50/70 text-earth-charcoal font-medium border-b border-sage-100">
                <tr>
                  <th className="p-3">Activity Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {history.map((item, idx) => {
                  const dateObj = new Date(item.created_at);
                  const dateStr = dateObj.toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  const timeStr = dateObj.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const durationSec = Math.round(item.duration_completed_sec || 0);
                  const durationFormatted = durationSec >= 60 
                    ? `${Math.floor(durationSec / 60)}m ${durationSec % 60 ? `${durationSec % 60}s` : ''}`.trim()
                    : `${durationSec}s`;

                  return (
                    <tr key={idx} className="hover:bg-ivory-50 transition-colors">
                      <td className="p-3 font-semibold text-forest">
                        {item.activity_name}
                      </td>
                      <td className="p-3 capitalize text-earth-muted">
                        {item.category}
                      </td>
                      <td className="p-3 font-mono text-earth-charcoal">
                        {dateStr}
                      </td>
                      <td className="p-3 font-mono text-earth-muted">
                        {timeStr}
                      </td>
                      <td className="p-3 font-mono font-medium text-forest">
                        {durationFormatted}
                      </td>
                      <td className="p-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sage-100 text-forest font-medium text-[10px]">
                          <CheckCircle2 className="w-3 h-3 stroke-[2]" />
                          <span>Completed</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Privacy Note */}
        <div className="pt-4 border-t border-sage-100 text-[11px] text-earth-muted flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" />
          <span>
            <strong>Privacy & Integrity Notice:</strong> Your practice history stores strictly activity completion metadata (activity name, date, time, and duration). Audio recordings, microphone inputs, and biometric telemetry are strictly never recorded, streamed, or stored.
          </span>
        </div>
      </section>

    </div>
  );
}
