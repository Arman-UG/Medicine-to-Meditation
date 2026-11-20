'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Wind, Heart, Compass, Shield, Sparkles, Clock, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-sage-200/80 text-forest px-4 py-1.5 rounded-full text-xs font-semibold border border-sage-300 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-sage-700" />
              <span>Medicine to Meditation • 72-Hour Free Trial Available</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-forest font-medium tracking-tight leading-[1.12]">
              From daily pressure to quiet presence.
            </h1>

            <p className="text-base sm:text-lg text-earth-charcoal max-w-xl leading-relaxed font-normal">
              A serene, non-clinical sanctuary for everyday mental breathing space. Choose an activity, follow mindful visual or spoken guidance, and return to your life centered and refreshed.
            </p>

            {/* Core Philosophy Pillar */}
            <div className="flex items-center gap-3 py-1 text-xs uppercase tracking-widest text-forest/75 font-mono font-semibold">
              <span>Open</span>
              <span className="text-sage-500">•</span>
              <span>Choose</span>
              <span className="text-sage-500">•</span>
              <span>Relax</span>
              <span className="text-sage-500">•</span>
              <span>Return</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="inline-flex items-center justify-center gap-2.5 bg-forest hover:bg-forest-light text-ivory-100 px-7 py-3.5 rounded-full text-sm font-semibold transition-all shadow-md hover:scale-[1.01]"
              >
                <span>{user ? "Open Dashboard" : "Start 72-Hour Free Trial"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-sage-50 text-forest px-6 py-3.5 rounded-full text-sm font-semibold border border-sage-300 transition-colors shadow-xs"
              >
                <span>Browse 6 Activities</span>
              </Link>

              <Link
                href="/audio"
                className="inline-flex items-center justify-center gap-2 bg-sage-100 hover:bg-sage-200 text-forest px-5 py-3.5 rounded-full text-sm font-semibold border border-sage-200 transition-colors shadow-xs"
              >
                <Music className="w-4 h-4 text-forest" />
                <span>Audio Library</span>
              </Link>
            </div>

            {!user && (
              <p className="text-xs text-earth-charcoal flex items-center gap-1.5 pt-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-sage-700" />
                <span>Instant 3-day full access upon registration • No commitment required</span>
              </p>
            )}
          </div>

          {/* Right Visual Image Card (Misty Lake) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-4xl overflow-hidden shadow-xl border-4 border-white/90 aspect-[4/5] max-w-md mx-auto">
              <Image
                src="/assets/misty_lake.jpg"
                alt="Tranquil misty lake and green mountains"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/20 to-transparent flex flex-col justify-end p-6 text-white">
                <span className="text-[11px] uppercase tracking-wider text-sage-200 font-mono font-medium">
                  Peaceful Presence
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-medium text-white">
                  Still waters. Clear mind.
                </h3>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* The 6 Core Activities Feature Strip */}
      <section className="bg-sage-50/80 border-y border-sage-200/80 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl text-forest font-semibold mb-2">
              Six simple ways to restore ease
            </h2>
            <p className="text-xs sm:text-sm text-earth-charcoal font-medium">
              Designed to be completed in 3 to 8 comfortable minutes whenever pressure builds up.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-sage-200 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-sage-100 text-forest flex items-center justify-center mb-3">
                <Wind className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-forest">Cyclic & Box Breathing</h3>
              <p className="text-xs text-earth-charcoal leading-relaxed">
                Scientifically tested breath retention and double sighs to quickly lower elevated heart rates.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-sage-200 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-earth-oat text-forest flex items-center justify-center mb-3">
                <Heart className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-forest">Seated Muscle Release</h3>
              <p className="text-xs text-earth-charcoal leading-relaxed">
                Release clenched jaw muscles, drop tight shoulders, and soften posture strain directly at your desk.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-sage-200 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-earth-lavender text-forest flex items-center justify-center mb-3">
                <Compass className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-forest">5-4-3-2-1 Sensory Grounding</h3>
              <p className="text-xs text-earth-charcoal leading-relaxed">
                Anchors racing or spiraling thoughts by systematically returning attention to immediate physical senses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Membership & Disclaimer */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sage-200 shadow-sm max-w-xl mx-auto space-y-3">
          <span className="text-xs font-mono font-semibold text-forest bg-sage-100 px-3 py-1 rounded-full uppercase tracking-wider border border-sage-200">
            Transparent Pricing
          </span>
          <h3 className="font-serif text-3xl font-semibold text-forest">
            ₹99 / month
          </h3>
          <p className="text-xs text-earth-charcoal leading-relaxed">
            Unlimited access to all guided activities, harmonic soundscapes, and spoken guidance after your 72-hour free trial. No hidden fees. Cancel anytime.
          </p>
          <div className="pt-2">
            <Link
              href="/subscribe"
              className="inline-block bg-forest text-ivory-100 hover:bg-forest-light px-7 py-3 rounded-full text-xs font-semibold transition-all shadow-sm"
            >
              Join Medicine to Meditation
            </Link>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="max-w-2xl mx-auto text-center text-xs text-earth-charcoal/90 leading-relaxed pt-4 border-t border-sage-200 font-medium">
          <p>
            <Shield className="w-3.5 h-3.5 inline mr-1 text-sage-700" />
            <strong>Notice:</strong> Guided breathing and grounding activities provided in Medicine to Meditation are created for everyday stress relief and mental breathing space. They do not constitute psychiatric evaluation, clinical diagnosis, or medical treatment.
          </p>
        </div>
      </section>
    </div>
  );
}
