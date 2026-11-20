'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAudio } from '../../context/AudioContext';
import { useAuth } from '../../context/AuthContext';
import { AudioTrack } from '../../lib/api';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Music, 
  Sparkles, 
  Clock, 
  Radio, 
  ShieldCheck,
  Headphones,
  Waves,
  Bell,
  Activity,
  Trees,
  Wind
} from 'lucide-react';

export default function AudioLibraryPage() {
  const {
    tracks,
    currentTrack,
    isMusicPlaying,
    musicVolume,
    currentTime,
    duration,
    playMusic,
    pauseMusic,
    toggleMusic,
    setMusicVolume,
    selectTrack,
    seekMusic,
    nextTrack,
    previousTrack
  } = useAudio();

  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Soundscapes' },
    { id: 'nature', label: 'Ocean & Nature' },
    { id: 'ambient', label: 'Timers & Chimes' },
    { id: 'binaural', label: 'Binaural & Alpha Waves' },
    { id: 'solfeggio', label: 'Solfeggio Frequencies' },
  ];

  const filteredTracks = tracks.filter(t => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getArtworkComponent = (track: AudioTrack) => {
    if (track.id.includes('ocean-waves')) {
      return (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-900 text-ivory-100 flex items-center justify-center shadow-sm shrink-0">
          <Waves className="w-7 h-7 stroke-[1.75]" />
        </div>
      );
    }
    if (track.id.includes('alarm') || track.id.includes('timer')) {
      return (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-700 to-stone-800 text-ivory-100 flex items-center justify-center shadow-sm shrink-0">
          <Bell className="w-7 h-7 stroke-[1.75]" />
        </div>
      );
    }
    if (track.id.includes('binaural') || track.id.includes('alpha') || track.category === 'binaural') {
      return (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-950 text-ivory-100 flex items-center justify-center shadow-sm shrink-0">
          <Activity className="w-7 h-7 stroke-[1.75]" />
        </div>
      );
    }
    if (track.category === 'nature') {
      return (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest to-emerald-950 text-ivory-100 flex items-center justify-center shadow-sm shrink-0">
          <Trees className="w-7 h-7 stroke-[1.75]" />
        </div>
      );
    }
    return (
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sage-700 to-forest-dark text-ivory-100 flex items-center justify-center shadow-sm shrink-0">
        <Wind className="w-7 h-7 stroke-[1.75]" />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      
      {/* Header */}
      <div className="border-b border-sage-200/80 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-sage-100 text-forest px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-sage-200">
            <Headphones className="w-3.5 h-3.5 text-sage-700" />
            <span>Dedicated Audio Experience</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl text-forest font-medium">
            Serene Soundscapes
          </h1>
          <p className="text-sm text-earth-charcoal mt-1 max-w-xl">
            Independent listening sanctuary. Relax with our four approved high-fidelity recordings and harmonic frequencies without needing to start a structured exercise.
          </p>
        </div>

        <div className="text-xs text-earth-charcoal font-medium">
          <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-sage-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Single-instance active playback</span>
          </span>
        </div>
      </div>

      {/* Featured Active Player Card */}
      {currentTrack && (
        <div className="bg-forest text-ivory-100 rounded-4xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          {/* Subtle Ambient Background Artwork Lines */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none">
            <svg viewBox="0 0 300 300" className="w-full h-full">
              <circle cx="150" cy="150" r="120" stroke="#8BA892" strokeWidth="1.5" fill="none" />
              <circle cx="150" cy="150" r="90" stroke="#D87A56" strokeWidth="2" fill="none" />
              <circle cx="150" cy="150" r="60" stroke="#DFD3C3" strokeWidth="1" fill="none" />
            </svg>
          </div>

          <div className="relative z-10 max-w-xl space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-widest text-sage-300 bg-forest-card px-2.5 py-1 rounded-full border border-sage-700 font-semibold">
                {currentTrack.audio_type === 'mp3' ? 'APPROVED MASTER MP3' : 'PROCEDURAL SYNTH'}
              </span>
              <span className="text-xs bg-sage-800 text-sage-200 font-mono px-2.5 py-0.5 rounded-full font-medium capitalize">
                {currentTrack.category}
              </span>
              {currentTrack.frequency_hz && (
                <span className="text-xs bg-sage-800 text-sage-200 font-mono px-2.5 py-0.5 rounded-full font-medium">
                  {currentTrack.frequency_hz} Hz
                </span>
              )}
            </div>

            <div className="flex items-start gap-4">
              {getArtworkComponent(currentTrack)}
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-ivory-100 font-medium">
                  {currentTrack.title}
                </h2>
                <p className="text-xs sm:text-sm text-sage-200/90 mt-1 capitalize font-medium">
                  {currentTrack.artist} • {formatTime(currentTrack.duration_sec)} duration
                </p>
              </div>
            </div>

            {/* Scrubbable Playback Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-mono text-sage-300 font-medium">
                <span>{formatTime(currentTime)}</span>
                <span className="flex items-center gap-1.5">
                  {isMusicPlaying && (
                    <span className="flex items-center gap-0.5 mr-1">
                      <span className="w-1 h-2 bg-emerald-400 animate-pulse"></span>
                      <span className="w-1 h-3.5 bg-emerald-400 animate-pulse delay-75"></span>
                      <span className="w-1 h-2.5 bg-emerald-400 animate-pulse delay-150"></span>
                    </span>
                  )}
                  <span>{formatTime(duration || currentTrack.duration_sec || 0)}</span>
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={duration > 0 ? duration : currentTrack.duration_sec || 300}
                step="1"
                value={Math.min(currentTime, duration > 0 ? duration : currentTrack.duration_sec || 300)}
                onChange={(e) => seekMusic(parseFloat(e.target.value))}
                className="w-full accent-ivory-100 h-2 bg-sage-800 rounded-lg cursor-pointer"
                aria-label="Seek track position"
              />
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-4">
                <button
                  onClick={previousTrack}
                  className="w-10 h-10 rounded-full bg-forest-card hover:bg-forest-muted text-ivory-100 flex items-center justify-center transition-colors"
                  aria-label="Previous soundscape"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleMusic}
                  className="w-14 h-14 rounded-full bg-ivory-100 text-forest hover:bg-white flex items-center justify-center transition-all shadow-md hover:scale-105"
                  aria-label={isMusicPlaying ? "Pause soundscape" : "Play soundscape"}
                >
                  {isMusicPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={nextTrack}
                  className="w-10 h-10 rounded-full bg-forest-card hover:bg-forest-muted text-ivory-100 flex items-center justify-center transition-colors"
                  aria-label="Next soundscape"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2.5 sm:border-l sm:border-sage-700/60 sm:pl-4 max-w-xs w-full">
                <VolumeX className="w-4 h-4 text-sage-300 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseInt(e.target.value, 10))}
                  className="w-full accent-ivory-100 h-1.5 bg-sage-800 rounded-lg cursor-pointer"
                  aria-label="Music volume"
                />
                <Volume2 className="w-4 h-4 text-sage-200 shrink-0" />
                <span className="font-mono text-xs text-sage-300 w-8 text-right">{musicVolume}%</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Categories Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === cat.id
                ? 'bg-forest text-ivory-100 border-forest shadow-xs'
                : 'bg-white hover:bg-sage-50 text-earth-charcoal border-sage-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Playlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTracks.map((track) => {
          const isSelected = currentTrack?.id === track.id;
          const isCurrentlyActive = isSelected && isMusicPlaying;

          return (
            <div
              key={track.id}
              className={`rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                isSelected
                  ? 'bg-sage-100/90 border-sage-400 shadow-sm'
                  : 'bg-white border-sage-200/90 hover:border-sage-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start gap-4">
                {getArtworkComponent(track)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold border bg-white text-forest border-sage-200">
                      {track.audio_type === 'mp3' ? 'Approved MP3' : 'Procedural'}
                    </span>
                    <span className="text-xs font-mono font-medium text-earth-charcoal">
                      {formatTime(track.duration_sec)}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg sm:text-xl font-medium text-forest leading-snug line-clamp-2">
                    {track.title}
                  </h3>
                  <p className="text-xs text-earth-charcoal font-medium mt-1">
                    {track.artist}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-sage-200/60 flex items-center justify-between mt-5">
                <div className="flex items-center gap-2">
                  {isCurrentlyActive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                      <span className="flex items-center gap-0.5">
                        <span className="w-1 h-2 bg-emerald-700 animate-pulse"></span>
                        <span className="w-1 h-3 bg-emerald-700 animate-pulse delay-75"></span>
                        <span className="w-1 h-2 bg-emerald-700 animate-pulse delay-150"></span>
                      </span>
                      <span>Now Playing</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-earth-muted">
                      {track.category} soundscape
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    selectTrack(track);
                    if (!isCurrentlyActive) {
                      playMusic(track.id);
                    } else {
                      pauseMusic();
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    isCurrentlyActive
                      ? 'bg-forest text-ivory-100 shadow-xs'
                      : 'bg-sage-100 hover:bg-sage-200 text-forest'
                  }`}
                >
                  {isCurrentlyActive ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      <span>Play Track</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audio Safety & Quality Notice */}
      <div className="bg-sage-50/70 rounded-3xl p-5 border border-sage-200 text-center max-w-2xl mx-auto text-xs text-earth-charcoal leading-relaxed font-medium">
        <p>
          <Sparkles className="w-3.5 h-3.5 inline mr-1 text-sage-700" />
          Mastered audio assets and harmonic frequencies for everyday stress relief. Zero advertisements, zero third-party telemetry, and single-instance audio playback guaranteed.
        </p>
      </div>

    </div>
  );
}
