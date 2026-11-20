'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Leaf, Lock, Mail, User, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stressLevel, setStressLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register(fullName, email, password, stressLevel);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Unable to register. Please try again.');
    } finally {
      setLoading(false);
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
            Begin with Medicine to Meditation.
          </h1>
          <p className="text-xs text-earth-muted">
            Start your 3-day free trial. Instant access to all guided activities and soundscapes.
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
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-earth-muted absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-ivory-50 border border-sage-200 text-xs sm:text-sm text-forest placeholder:text-earth-muted/60 focus:outline-none focus:border-forest"
              />
            </div>
          </div>

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
                placeholder="alex@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-ivory-50 border border-sage-200 text-xs sm:text-sm text-forest placeholder:text-earth-muted/60 focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-forest block">
              Password (8+ characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-earth-muted absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-ivory-50 border border-sage-200 text-xs sm:text-sm text-forest placeholder:text-earth-muted/60 focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          {/* Optional Initial Stress Level */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-medium text-forest block">
              Current Everyday Stress (Optional)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['mild', 'moderate', 'high'] as const).map(lvl => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setStressLevel(stressLevel === lvl ? null : lvl)}
                  className={`py-2 px-3 rounded-2xl text-xs capitalize transition-all border ${
                    stressLevel === lvl
                      ? 'bg-forest text-ivory-100 border-forest font-semibold'
                      : 'bg-ivory-50 text-earth-muted border-sage-200 hover:bg-sage-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-earth-muted text-center">
              Optional self-reported check-in. Never required.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-forest hover:bg-forest-light text-ivory-100 text-xs sm:text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {loading ? <span>Creating peaceful space...</span> : <span>Create Account</span>}
          </button>
        </form>

        <p className="text-xs text-center text-earth-muted pt-2">
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-forest underline underline-offset-2">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
}
