'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Leaf, Lock, Mail, ArrowRight, Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Unable to sign in. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.forgotPassword(forgotEmail);
      setForgotMsg(res.message);
    } catch (err: any) {
      setForgotMsg(err.message);
    }
  };

  const fillTestCredentials = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setEmail('admin@calm.local');
      setPassword('CalmAdmin2026!');
    } else {
      setEmail('alex@calm.local');
      setPassword('UserAlex2026!');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white/90 rounded-4xl p-6 sm:p-8 border border-sage-200/80 shadow-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-sage-100 text-forest mx-auto flex items-center justify-center">
            <Leaf className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h1 className="font-serif text-3xl font-medium text-forest">
            Welcome back to Medicine to Meditation.
          </h1>
          <p className="text-xs text-earth-muted">
            Enter your details to resume your peaceful journey.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-2xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-forest block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-earth-muted absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-ivory-50 border border-sage-200 text-xs sm:text-sm text-forest placeholder:text-earth-muted/60 focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-forest block">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-[11px] text-sage-700 hover:text-forest"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-earth-muted absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-ivory-50 border border-sage-200 text-xs sm:text-sm text-forest placeholder:text-earth-muted/60 focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-forest hover:bg-forest-light text-ivory-100 text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <span>Signing in gently...</span> : <span>Sign In</span>}
          </button>
        </form>

        {/* Quick Demo Logins for Instant Testing */}
        <div className="pt-2 border-t border-sage-100 space-y-2">
          <p className="text-[11px] text-earth-muted text-center uppercase tracking-wider font-mono">
            Quick Test Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillTestCredentials('user')}
              className="p-2 rounded-xl bg-sage-50 hover:bg-sage-100 border border-sage-200 text-xs text-forest text-left transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-sage-600 shrink-0" />
              <div className="min-w-0">
                <span className="block font-semibold truncate text-[11px]">Alex (User)</span>
                <span className="text-[10px] text-earth-muted">Subscriber</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fillTestCredentials('admin')}
              className="p-2 rounded-xl bg-earth-oat hover:bg-earth-sand border border-sage-200 text-xs text-forest text-left transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sage-700 shrink-0" />
              <div className="min-w-0">
                <span className="block font-semibold truncate text-[11px]">Admin</span>
                <span className="text-[10px] text-earth-muted">All controls</span>
              </div>
            </button>
          </div>
        </div>

        <p className="text-xs text-center text-earth-muted pt-2">
          Do not have an account yet?{' '}
          <Link href="/register" className="font-semibold text-forest underline underline-offset-2">
            Create an account
          </Link>
        </p>

      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-sage-200">
            <h3 className="font-serif text-xl font-medium text-forest">Reset Password</h3>
            <p className="text-xs text-earth-muted">
              Enter your email to receive recovery instructions.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-ivory-50 border border-sage-200 text-xs text-forest focus:outline-none"
              />
              {forgotMsg && (
                <p className="text-xs text-sage-800 bg-sage-50 p-2 rounded-lg">{forgotMsg}</p>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="px-4 py-2 text-xs text-earth-muted hover:text-forest"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-forest text-ivory-100 rounded-full hover:bg-forest-light"
                >
                  Send Instructions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-forest animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

