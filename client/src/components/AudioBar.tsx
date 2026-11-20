'use client';

import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { 
  Play, 
  Pause, 
  SkipBack,
  SkipForward,
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Music, 
  ChevronUp, 
  ChevronDown, 
  Sparkles 
} from 'lucide-react';

export const AudioBar: React.FC = () => {
  const {
    tracks,
    currentTrack,
    isMusicPlaying,
    musicVolume,
    currentTime,
    duration,
    toggleMusic,
    setMusicVolume,
    selectTrack,
    seekMusic,
    nextTrack,
    previousTrack,
    isVoiceEnabled,
    voiceVolume,
    guidanceMode,
    setGuidanceMode,
    setVoiceVolume,
    toggleVoice,
  } = useAudio();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-2xl">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-sage-200/90 shadow-lg px-4 py-2.5 sm:px-6 sm:py-3 transition-all duration-300">
        
        {/* Main Bar */}
        <div className="flex items-center justify-between gap-3">
          
          {/* Track Info & Category */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={toggleMusic}
              className="w-10 h-10 rounded-full bg-forest text-ivory-100 flex items-center justify-center shrink-0 hover:bg-forest-light transition-all shadow-sm"
              aria-label={isMusicPlaying ? "Pause ambient soundscape" : "Play ambient soundscape"}
            >
              {isMusicPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-forest truncate font-serif">
                  {currentTrack ? currentTrack.title : 'Serene Soundscape'}
                </p>
                {currentTrack?.audio_type === 'mp3' && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-medium">
                    MP3
                  </span>
                )}
                {currentTrack?.frequency_hz && (
                  <span className="text-[10px] bg-sage-100 text-sage-800 px-1.5 py-0.2 rounded font-mono font-medium">
                    {currentTrack.frequency_hz}Hz
                  </span>
                )}
              </div>
              <p className="text-[11px] text-earth-charcoal truncate font-medium">
                {isMusicPlaying 
                  ? `Playing • ${formatTime(currentTime)} / ${formatTime(duration || currentTrack?.duration_sec || 0)}` 
                  : 'Audio is optional • Tap to enable'}
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Quick Skip Buttons */}
            <button
              onClick={previousTrack}
              className="w-7 h-7 rounded-full bg-ivory-200 hover:bg-sage-100 text-forest flex items-center justify-center transition-colors hidden sm:flex"
              aria-label="Previous track"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={nextTrack}
              className="w-7 h-7 rounded-full bg-ivory-200 hover:bg-sage-100 text-forest flex items-center justify-center transition-colors hidden sm:flex"
              aria-label="Next track"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Voice Guidance Toggle */}
            <button
              onClick={toggleVoice}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                isVoiceEnabled
                  ? 'bg-sage-100 text-forest border border-sage-300'
                  : 'bg-ivory-200 text-earth-muted border border-sage-100 hover:text-forest'
              }`}
              title={isVoiceEnabled ? 'Voice instructions active' : 'Voice instructions muted'}
            >
              {isVoiceEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isVoiceEnabled ? 'Voice On' : 'Voice Off'}</span>
            </button>

            {/* Expand / Detailed Settings Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 rounded-full bg-ivory-200 hover:bg-sage-100 text-forest flex items-center justify-center transition-colors"
              aria-label="Toggle audio controls"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Drawer: Timeline Scrubbing, Volume Sliders & Track Chooser */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-sage-100 space-y-4 animate-in fade-in duration-200">
            
            {/* Scrubbable Timeline in Drawer */}
            <div className="space-y-1 bg-ivory-100/90 p-3 rounded-2xl border border-sage-100">
              <div className="flex items-center justify-between text-[11px] font-mono text-earth-charcoal font-medium">
                <span>{formatTime(currentTime)}</span>
                <span className="text-forest font-semibold truncate max-w-xs px-2">
                  {currentTrack?.title}
                </span>
                <span>{formatTime(duration || currentTrack?.duration_sec || 0)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration > 0 ? duration : currentTrack?.duration_sec || 300}
                step="1"
                value={Math.min(currentTime, duration > 0 ? duration : currentTrack?.duration_sec || 300)}
                onChange={(e) => seekMusic(parseFloat(e.target.value))}
                className="w-full accent-forest h-1.5 bg-sage-200 rounded-lg cursor-pointer"
                aria-label="Seek track"
              />
            </div>

            {/* Independent Volume Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-ivory-100/80 p-3 rounded-2xl">
              {/* Music Volume */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 text-forest font-medium">
                  <span className="flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-sage-600" />
                    <span>Background Music Volume</span>
                  </span>
                  <span className="font-mono text-[11px] text-earth-charcoal font-semibold">{musicVolume}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <VolumeX className="w-3.5 h-3.5 text-earth-muted" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(parseInt(e.target.value, 10))}
                    className="w-full accent-forest h-1.5 bg-sage-200 rounded-lg cursor-pointer"
                  />
                  <Volume2 className="w-3.5 h-3.5 text-forest" />
                </div>
              </div>

              {/* Spoken Voice Guidance Volume */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 text-forest font-medium">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-sage-600" />
                    <span>Spoken Voice Guidance</span>
                  </span>
                  <span className="font-mono text-[11px] text-earth-charcoal font-semibold">{voiceVolume}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <VolumeX className="w-3.5 h-3.5 text-earth-muted" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={voiceVolume}
                    disabled={!isVoiceEnabled}
                    onChange={(e) => setVoiceVolume(parseInt(e.target.value, 10))}
                    className="w-full accent-forest h-1.5 bg-sage-200 rounded-lg cursor-pointer disabled:opacity-40"
                  />
                  <Volume2 className="w-3.5 h-3.5 text-forest" />
                </div>
              </div>
            </div>

            {/* Guidance Mode Selector */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-earth-charcoal font-medium">Guidance Mode:</span>
              <div className="flex items-center gap-1.5 bg-sage-50 p-1 rounded-full border border-sage-200">
                {(['both', 'spoken', 'visual'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setGuidanceMode(mode)}
                    className={`px-3 py-1 rounded-full capitalize transition-all ${
                      guidanceMode === mode
                        ? 'bg-forest text-ivory-100 font-semibold shadow-xs'
                        : 'text-earth-charcoal hover:text-forest'
                    }`}
                  >
                    {mode === 'both' ? 'Spoken & Visual' : mode === 'spoken' ? 'Voice Only' : 'Visual Only'}
                  </button>
                ))}
              </div>
            </div>

            {/* Track Selector List */}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-earth-charcoal font-semibold mb-2">
                Available Soundscapes ({tracks.length} Tracks)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {tracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => selectTrack(track)}
                    className={`p-2.5 rounded-xl text-left transition-all border flex items-center justify-between ${
                      currentTrack?.id === track.id
                        ? 'bg-sage-100/90 border-sage-300 text-forest'
                        : 'bg-white border-sage-100 text-earth-charcoal hover:bg-sage-50/60'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-serif font-medium truncate">{track.title}</p>
                        {track.audio_type === 'mp3' && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-mono">MP3</span>
                        )}
                      </div>
                      <p className="text-[10px] text-earth-charcoal capitalize">
                        {track.category} • {formatTime(track.duration_sec)}
                      </p>
                    </div>
                    {currentTrack?.id === track.id && (
                      <Sparkles className="w-3.5 h-3.5 text-forest shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
