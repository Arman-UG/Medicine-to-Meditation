'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { calmAudio } from '../lib/audioEngine';
import { calmVoice } from '../lib/voiceEngine';
import { api, AudioTrack } from '../lib/api';

interface AudioContextType {
  tracks: AudioTrack[];
  currentTrack: AudioTrack | null;
  isMusicPlaying: boolean;
  musicVolume: number;
  currentTime: number;
  duration: number;
  playMusic: (trackId?: string) => void;
  pauseMusic: () => void;
  toggleMusic: () => void;
  setMusicVolume: (val: number) => void;
  selectTrack: (track: AudioTrack) => void;
  seekMusic: (time: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  
  // Voice Guidance
  isVoiceEnabled: boolean;
  voiceVolume: number;
  guidanceMode: 'both' | 'spoken' | 'visual';
  setGuidanceMode: (mode: 'both' | 'spoken' | 'visual') => void;
  setVoiceVolume: (val: number) => void;
  toggleVoice: () => void;
  speakInstruction: (text: string) => void;
  stopVoice: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [musicVolume, setMusicVolumeState] = useState<number>(50);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const [guidanceMode, setGuidanceMode] = useState<'both' | 'spoken' | 'visual'>('both');
  const [voiceVolume, setVoiceVolumeState] = useState<number>(85);

  useEffect(() => {
    // Fetch tracklist from backend
    api.getAudioTracks()
      .then(res => {
        setTracks(res.tracks);
        if (res.tracks.length > 0) {
          setCurrentTrack(res.tracks[0]);
          setDuration(res.tracks[0].duration_sec || 0);
        }
      })
      .catch(err => console.warn('Could not load audio tracks:', err));

    // Listen to real-time audio progress and playback state from audio engine
    if (calmAudio) {
      const unsubProgress = calmAudio.onProgress((cur, dur) => {
        setCurrentTime(cur);
        if (dur > 0) setDuration(dur);
      });

      const unsubState = calmAudio.onStateChange((playing) => {
        setIsMusicPlaying(playing);
      });

      return () => {
        unsubProgress();
        unsubState();
      };
    }
  }, []);

  const playMusic = (trackId?: string) => {
    if (!calmAudio) return;
    const targetId = trackId || currentTrack?.id || tracks[0]?.id;
    if (!targetId) return;

    const found = tracks.find(t => t.id === targetId) || currentTrack;
    if (found) {
      setCurrentTrack(found);
      setDuration(found.duration_sec || 0);
      calmAudio.playTrack(found.id, found.file_url, found.duration_sec);
    } else {
      calmAudio.playTrack(targetId, null);
    }
  };

  const pauseMusic = () => {
    if (!calmAudio) return;
    calmAudio.pause();
  };

  const toggleMusic = () => {
    if (isMusicPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  };

  const setMusicVolume = (val: number) => {
    setMusicVolumeState(val);
    if (calmAudio) {
      calmAudio.setVolume(val / 100);
    }
  };

  const selectTrack = (track: AudioTrack) => {
    setCurrentTrack(track);
    setDuration(track.duration_sec || 0);
    setCurrentTime(0);

    if (isMusicPlaying && calmAudio) {
      calmAudio.playTrack(track.id, track.file_url, track.duration_sec);
    }
  };

  const seekMusic = (time: number) => {
    if (calmAudio) {
      calmAudio.seek(time);
      setCurrentTime(time);
    }
  };

  const nextTrack = () => {
    if (!tracks.length) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    const nextTrk = tracks[nextIndex];
    selectTrack(nextTrk);
    if (isMusicPlaying && calmAudio) {
      calmAudio.playTrack(nextTrk.id, nextTrk.file_url, nextTrk.duration_sec);
    }
  };

  const previousTrack = () => {
    if (!tracks.length) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    const prevTrk = tracks[prevIndex];
    selectTrack(prevTrk);
    if (isMusicPlaying && calmAudio) {
      calmAudio.playTrack(prevTrk.id, prevTrk.file_url, prevTrk.duration_sec);
    }
  };

  // Voice Guidance controls
  const isVoiceEnabled = guidanceMode === 'both' || guidanceMode === 'spoken';

  const toggleVoice = () => {
    if (isVoiceEnabled) {
      setGuidanceMode('visual');
      calmVoice?.setEnabled(false);
    } else {
      setGuidanceMode('both');
      calmVoice?.setEnabled(true);
    }
  };

  const setVoiceVolume = (val: number) => {
    setVoiceVolumeState(val);
    calmVoice?.setVolume(val / 100);
  };

  const speakInstruction = (text: string) => {
    if (guidanceMode === 'visual') return;
    calmVoice?.speak(text);
  };

  const stopVoice = () => {
    calmVoice?.cancel();
  };

  return (
    <AudioContext.Provider
      value={{
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
        previousTrack,
        isVoiceEnabled,
        voiceVolume,
        guidanceMode,
        setGuidanceMode,
        setVoiceVolume,
        toggleVoice,
        speakInstruction,
        stopVoice,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
