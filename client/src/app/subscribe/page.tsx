'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { 
  Sparkles, 
  Check, 
  ShieldCheck, 
  QrCode, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  Clock
} from 'lucide-react';

export default function SubscribePage() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();

  const [renewalMode, setRenewalMode] = useState<'manual' | 'autopay'>('manual');
  const [autoPayConsent, setAutoPayConsent] = useState<boolean>(false);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(false);
  const [activeOrder, setActiveOrder] = useState<{
    orderId: string;
    razorpayOrderId: string;
    amount: number;
    qrImage: string;
    upiPayload: string;
    expiresAt: string;
  } | null>(null);

  const [pollingStatus, setPollingStatus] = useState<string>('idle'); // idle, waiting_payment, success, expired, failed
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Active subscription check
  const isCurrentlySubscribed = user?.subscription?.status === 'active';

  // Initiate QR Generation
  const handleInitiatePayment = async () => {
    if (!user) {
      router.push('/login?redirect=/subscribe');
      return;
    }

    if (renewalMode === 'autopay' && !autoPayConsent) {
      setErrorMessage('Please confirm authorization for monthly recurring renewal.');
      return;
    }

    setLoadingOrder(true);
    setErrorMessage(null);

    try {
      const res = await api.createQROrder({
        renewal_mode: renewalMode
      });
      setActiveOrder(res);
      setPollingStatus('waiting_payment');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to generate UPI QR code. Please try again.');
    } finally {
      setLoadingOrder(false);
    }
  };

  // Poll order status every 3 seconds while waiting
  useEffect(() => {
    if (!activeOrder || pollingStatus !== 'waiting_payment') return;

    const interval = setInterval(async () => {
      try {
        const res = await api.getOrderStatus(activeOrder.orderId);
        if (res.isPaid || res.subscriptionActive) {
          setPollingStatus('success');
          clearInterval(interval);
          await refreshProfile();
        } else if (res.order.status === 'expired') {
          setPollingStatus('expired');
          clearInterval(interval);
        }
      } catch (err) {
        console.warn('Status poll error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeOrder, pollingStatus]);

  // Dev/Sandbox verification trigger
  const handleSimulatePayment = async () => {
    if (!activeOrder) return;
    setSimulating(true);
    setErrorMessage(null);

    try {
      await api.simulateSandboxPayment(activeOrder.orderId);
      // Status poller will immediately catch this and trigger success
      const statusRes = await api.getOrderStatus(activeOrder.orderId);
      if (statusRes.isPaid || statusRes.subscriptionActive) {
        setPollingStatus('success');
        await refreshProfile();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Simulation error.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-forest bg-sage-100 px-3 py-1 rounded-full font-semibold border border-sage-200">
          MEDICINE TO MEDITATION MEMBERSHIP
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl text-forest font-medium">
          Peace of mind for ₹99.
        </h1>
        <p className="text-sm text-earth-charcoal leading-relaxed">
          One modest monthly fee for unrestricted access to all 6 relaxation practices, serene audio frequencies, and guided voice tracks.
        </p>
      </div>

      {isCurrentlySubscribed && (
        <div className="bg-sage-100/80 border border-sage-300 rounded-3xl p-6 text-center max-w-lg mx-auto space-y-2">
          <div className="w-10 h-10 rounded-full bg-forest text-ivory-100 mx-auto flex items-center justify-center">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
          <h3 className="font-serif text-xl font-medium text-forest">You have an Active Membership</h3>
          <p className="text-xs text-earth-muted">
            Valid until {user?.subscription?.current_period_end ? new Date(user.subscription.current_period_end).toLocaleDateString() : 'Active'} • Renewal: {user?.subscription?.renewal_type}
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-block bg-forest text-ivory-100 hover:bg-forest-light px-6 py-2 rounded-full text-xs font-semibold transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Main Subscription Card & Checkout Flow */}
      {!isCurrentlySubscribed && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Plan Details (Left 6 cols) */}
          <div className="md:col-span-6 bg-white/90 rounded-4xl p-6 sm:p-8 border border-sage-200 shadow-sm space-y-6">
            <div className="flex items-baseline justify-between border-b border-sage-100 pb-5">
              <div>
                <h3 className="font-serif text-2xl text-forest font-medium">Monthly Unlimited</h3>
                <p className="text-xs text-earth-muted mt-0.5">Simple 30-day continuous calm</p>
              </div>
              <div className="text-right">
                <span className="font-serif text-3xl font-semibold text-forest">₹99</span>
                <span className="text-xs text-earth-muted block">/ month</span>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs text-earth-charcoal">
              <li className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-sage-100 text-forest flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <span>Full access to all 6 guided relaxation exercises</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-sage-100 text-forest flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <span>All 6 ambient & solfeggio audio frequencies</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-sage-100 text-forest flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <span>Dual-channel spoken voice guidance & independent volumes</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-sage-100 text-forest flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <span>Zero advertisements, trackers, or commercial clutter</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-sage-100 text-forest flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <span>Flexible renewal: Choose manual or auto-renewal</span>
              </li>
            </ul>

            {/* Renewal Preference Chooser (Phase 6 Requirement) */}
            <div className="pt-4 border-t border-sage-100 space-y-3">
              <label className="text-xs font-semibold text-forest block">
                Select Renewal Mode
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRenewalMode('manual');
                    setAutoPayConsent(false);
                  }}
                  className={`p-3 rounded-2xl text-left border text-xs transition-all ${
                    renewalMode === 'manual'
                      ? 'bg-sage-100/90 border-sage-400 font-semibold text-forest'
                      : 'bg-white border-sage-100 text-earth-muted hover:bg-sage-50'
                  }`}
                >
                  <span className="block font-medium">Manual Renewal</span>
                  <span className="text-[10px] text-earth-muted">Pay ₹99 for 30 days only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRenewalMode('autopay')}
                  className={`p-3 rounded-2xl text-left border text-xs transition-all ${
                    renewalMode === 'autopay'
                      ? 'bg-sage-100/90 border-sage-400 font-semibold text-forest'
                      : 'bg-white border-sage-100 text-earth-muted hover:bg-sage-50'
                  }`}
                >
                  <span className="block font-medium">UPI AutoPay</span>
                  <span className="text-[10px] text-earth-muted">Monthly recurring debit</span>
                </button>
              </div>

              {renewalMode === 'autopay' && (
                <div className="bg-ivory-200/80 p-3 rounded-2xl border border-sage-200 space-y-2 animate-in fade-in">
                  <label className="flex items-start gap-2 text-xs text-forest cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPayConsent}
                      onChange={(e) => setAutoPayConsent(e.target.checked)}
                      className="mt-0.5 accent-forest rounded"
                    />
                    <span className="text-[11px] leading-relaxed">
                      I authorize a monthly recurring mandate of ₹99 via UPI AutoPay. I understand I can pause or revoke this authorization anytime in my account settings.
                    </span>
                  </label>
                </div>
              )}
            </div>

            {!activeOrder && (
              <button
                onClick={handleInitiatePayment}
                disabled={loadingOrder}
                className="w-full py-4 rounded-full bg-forest hover:bg-forest-light text-ivory-100 text-xs sm:text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingOrder ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating Dynamic UPI QR...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Proceed to Dynamic UPI QR (₹99)</span>
                  </>
                )}
              </button>
            )}

            {errorMessage && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 text-center">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Dynamic UPI QR Display & Polling (Right 6 cols) */}
          <div className="md:col-span-6 bg-white/90 rounded-4xl p-6 sm:p-8 border border-sage-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            
            {activeOrder && pollingStatus === 'waiting_payment' && (
              <div className="space-y-4 w-full flex flex-col items-center animate-in fade-in duration-300">
                <div className="inline-flex items-center gap-1.5 text-xs text-sage-800 bg-sage-100 px-3 py-1 rounded-full font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Valid for 15 minutes • Order #{activeOrder.razorpayOrderId.slice(-8)}</span>
                </div>

                <div className="p-3 bg-white rounded-3xl border-2 border-sage-200 shadow-sm">
                  <Image
                    src={activeOrder.qrImage}
                    alt="Razorpay Dynamic UPI QR Code"
                    width={220}
                    height={220}
                    className="rounded-2xl"
                  />
                </div>

                <div className="space-y-1">
                  <p className="font-serif text-lg font-medium text-forest">
                    Scan with any UPI App
                  </p>
                  <p className="text-xs text-earth-muted">
                    Google Pay • PhonePe • Paytm • BHIM • CRED
                  </p>
                  <p className="font-mono text-xs text-sage-700 font-semibold pt-1">
                    Amount: ₹99.00 INR
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-earth-muted pt-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-forest" />
                  <span>Awaiting verified payment confirmation...</span>
                </div>

                {/* Sandbox / Development Simulation Option (Phase 9 requirement) */}
                <div className="pt-4 border-t border-sage-100 w-full">
                  <button
                    onClick={handleSimulatePayment}
                    disabled={simulating}
                    className="w-full py-2.5 px-4 rounded-full bg-sage-100 hover:bg-sage-200 text-forest text-xs font-semibold border border-sage-300 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Simulate Verified Sandbox Payment</span>
                  </button>
                  <p className="text-[10px] text-earth-muted mt-1.5">
                    Triggers authentic HMAC-SHA256 webhook verification for dev testing.
                  </p>
                </div>
              </div>
            )}

            {pollingStatus === 'success' && (
              <div className="space-y-4 py-8 animate-in fade-in duration-500">
                <div className="w-16 h-16 rounded-full bg-sage-100 text-forest mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 stroke-[1.75]" />
                </div>
                <h3 className="font-serif text-2xl font-medium text-forest">
                  Payment Verified!
                </h3>
                <p className="text-xs text-earth-muted max-w-xs mx-auto leading-relaxed">
                  Your ₹99 subscription is now active. All relaxation activities and soundscapes are unlocked.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-forest text-ivory-100 hover:bg-forest-light px-6 py-3 rounded-full text-xs font-semibold transition-all shadow-sm"
                >
                  <span>Begin Relaxation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {!activeOrder && (
              <div className="py-12 space-y-4 text-earth-muted">
                <div className="w-16 h-16 rounded-3xl bg-sage-50 text-sage-400 mx-auto flex items-center justify-center border border-sage-100">
                  <QrCode className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <p className="font-serif text-lg text-forest">Dynamic UPI QR Code</p>
                  <p className="text-xs max-w-xs mx-auto">
                    Click "Proceed to Dynamic UPI QR" to generate a secure, real-time Razorpay payment QR.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Trust & Guarantee Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-center text-xs text-earth-muted">
        <div className="flex flex-col items-center p-4 bg-white/60 rounded-2xl border border-sage-100">
          <ShieldCheck className="w-5 h-5 text-sage-600 mb-2" />
          <span className="font-medium text-forest">HMAC-SHA256 Verified</span>
          <span className="text-[11px] mt-0.5">Secure server-side validation</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-white/60 rounded-2xl border border-sage-100">
          <RefreshCw className="w-5 h-5 text-sage-600 mb-2" />
          <span className="font-medium text-forest">Cancel Anytime</span>
          <span className="text-[11px] mt-0.5">Pause or revoke in settings with one click</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-white/60 rounded-2xl border border-sage-100">
          <Sparkles className="w-5 h-5 text-sage-600 mb-2" />
          <span className="font-medium text-forest">100% Ad-Free Experience</span>
          <span className="text-[11px] mt-0.5">Pure calm without marketing noise</span>
        </div>
      </div>

    </div>
  );
}
