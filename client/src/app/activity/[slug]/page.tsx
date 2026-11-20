'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Activity } from '../../../lib/api';
import { useAudio } from '../../../context/AudioContext';
import { useAuth } from '../../../context/AuthContext';
import { BreathingArt } from '../../../components/BreathingArt';
import { 
  Play, 
  Pause, 
  Square, 
  ArrowLeft, 
  FastForward, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  Shield,
  Music,
  Lock,
  Clock
} from 'lucide-react';

export default function ActivityPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { user } = useAuth();
  const { 
    tracks,
    currentTrack,
    isMusicPlaying, 
    toggleMusic, 
    playMusic,
    pauseMusic,
    selectTrack,
    musicVolume,
    setMusicVolume,
    isVoiceEnabled, 
    toggleVoice, 
    voiceVolume,
    setVoiceVolume,
    guidanceMode,
    setGuidanceMode,
    speakInstruction, 
    stopVoice 
  } = useAudio();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Active step / breathing phase states
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [phaseSecondsRemaining, setPhaseSecondsRemaining] = useState<number>(4);
  const [currentPhaseName, setCurrentPhaseName] = useState<string>('Prepare');
  const [contourPhase, setContourPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause' | 'idle'>('idle');
  const [contourProgress, setContourProgress] = useState<number>(0);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState<number>(0);
  const [showDiscomfortPrompt, setShowDiscomfortPrompt] = useState<boolean>(false);
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false);

  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseDurationRef = useRef<number>(4);

  // Fetch activity definition
  useEffect(() => {
    if (!slug) return;
    api.getActivityBySlug(slug)
      .then(res => {
        setActivity(res.activity);
      })
      .catch(err => {
        console.error('Failed to load activity:', err);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopVoice();
    };
  }, []);

  // Check server-enforced trial / membership access
  const isAccessLocked = user && user.role !== 'admin' && user.membership && !user.membership.hasAccess;

  // Handle Rhythmic Breathing Cycle Tick
  const runRhythmCycle = () => {
    if (!activity) return;

    if (activity.category === 'breathing' && activity.rhythm_pattern) {
      const rhythm = activity.rhythm_pattern;

      // Handle Box Breathing (4-4-4-4)
      if (rhythm.inhale && rhythm.holdIn && rhythm.exhale && rhythm.holdOut) {
        handleBoxBreathingTick(rhythm);
      } 
      // Handle Cyclic Sighing (Inhale 1, Inhale 2, Exhale)
      else if (rhythm.inhale1 && rhythm.inhale2 && rhythm.exhale) {
        handleCyclicSighingTick(rhythm);
      }
      // Handle Long Exhale (Inhale 4, Hold 1, Exhale 8)
      else if (rhythm.inhale && rhythm.exhale) {
        handleLongExhaleTick(rhythm);
      }
    } else {
      // Step-based guided exercises (Muscle release, 5-4-3-2-1, Body scan)
      handleStepBasedTick();
    }
  };

  // 1. Box Breathing Sequence
  const handleBoxBreathingTick = (rhythm: any) => {
    if (contourPhase === 'idle' || contourPhase === 'pause') {
      setContourPhase('inhale');
      setCurrentPhaseName('Inhale Slowly');
      phaseDurationRef.current = rhythm.inhale;
      setPhaseSecondsRemaining(rhythm.inhale);
      speakInstruction('Inhale slowly through your nose. Expand your ribs.');
    } else if (contourPhase === 'inhale') {
      setContourPhase('hold');
      setCurrentPhaseName('Soft Hold');
      phaseDurationRef.current = rhythm.holdIn;
      setPhaseSecondsRemaining(rhythm.holdIn);
      speakInstruction('Gently hold. Keep your neck and shoulders soft.');
    } else if (contourPhase === 'hold') {
      setContourPhase('exhale');
      setCurrentPhaseName('Exhale Smoothly');
      phaseDurationRef.current = rhythm.exhale;
      setPhaseSecondsRemaining(rhythm.exhale);
      speakInstruction('Exhale smoothly, releasing all physical pressure.');
    } else if (contourPhase === 'exhale') {
      setContourPhase('pause');
      setCurrentPhaseName('Quiet Stillness');
      phaseDurationRef.current = rhythm.holdOut;
      setPhaseSecondsRemaining(rhythm.holdOut);
      speakInstruction('Rest in empty stillness.');
      setCurrentCycle(prev => prev + 1);
    }
  };

  // 2. Cyclic Sighing Sequence
  const handleCyclicSighingTick = (rhythm: any) => {
    if (contourPhase === 'idle' || contourPhase === 'exhale') {
      setContourPhase('inhale');
      setCurrentPhaseName('Deep Inhale');
      phaseDurationRef.current = rhythm.inhale1;
      setPhaseSecondsRemaining(rhythm.inhale1);
      speakInstruction('Deep breath in through your nose.');
    } else if (contourPhase === 'inhale') {
      setContourPhase('hold');
      setCurrentPhaseName('Second Sip of Air');
      phaseDurationRef.current = rhythm.inhale2;
      setPhaseSecondsRemaining(rhythm.inhale2);
      speakInstruction('Take a second quick sip of air to fully expand your chest.');
    } else if (contourPhase === 'hold') {
      setContourPhase('exhale');
      setCurrentPhaseName('Long Slow Sigh');
      phaseDurationRef.current = rhythm.exhale;
      setPhaseSecondsRemaining(rhythm.exhale);
      speakInstruction('Long, slow, peaceful sigh out through your mouth.');
      setCurrentCycle(prev => prev + 1);
    }
  };

  // 3. Long Exhale Sequence
  const handleLongExhaleTick = (rhythm: any) => {
    if (contourPhase === 'idle' || contourPhase === 'exhale') {
      setContourPhase('inhale');
      setCurrentPhaseName('Gentle Inhale');
      phaseDurationRef.current = rhythm.inhale;
      setPhaseSecondsRemaining(rhythm.inhale);
      speakInstruction('Inhale quietly through your nose.');
    } else if (contourPhase === 'inhale') {
      setContourPhase('hold');
      setCurrentPhaseName('Soft Pause');
      phaseDurationRef.current = rhythm.hold || 1;
      setPhaseSecondsRemaining(rhythm.hold || 1);
      speakInstruction('Soft momentary pause.');
    } else if (contourPhase === 'hold') {
      setContourPhase('exhale');
      setCurrentPhaseName('Extended Exhale (8s)');
      phaseDurationRef.current = rhythm.exhale;
      setPhaseSecondsRemaining(rhythm.exhale);
      speakInstruction('Release slowly through your lips. Twice as long.');
      setCurrentCycle(prev => prev + 1);
    }
  };

  // 4. Step-Based Sequence (Sensory Grounding, Muscle Release, Body Scan)
  const handleStepBasedTick = () => {
    if (!activity || !activity.step_instructions) return;
    const steps = activity.step_instructions;
    const nextIdx = currentStepIndex + 1;

    if (nextIdx < steps.length) {
      setCurrentStepIndex(nextIdx);
      const step = steps[nextIdx];
      setCurrentPhaseName(step.title);
      phaseDurationRef.current = Math.floor(activity.default_duration_sec / steps.length);
      setPhaseSecondsRemaining(phaseDurationRef.current);
      setContourPhase(nextIdx % 2 === 0 ? 'inhale' : 'exhale');
      speakInstruction(`${step.title}. ${step.instruction}`);
    } else {
      completeSession();
    }
  };

  // Main active timer interval
  useEffect(() => {
    if (!hasStarted || isPaused || isCompleted) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTotalSecondsElapsed(prev => prev + 1);

      setPhaseSecondsRemaining(prev => {
        if (prev <= 1) {
          runRhythmCycle();
          return phaseDurationRef.current;
        }
        return prev - 1;
      });

      // Update progress for breathing art smooth expansion
      setContourProgress(() => {
        const remaining = phaseSecondsRemaining;
        const total = phaseDurationRef.current || 4;
        return 1 - (remaining / total);
      });

      // Check for completion condition
      if (activity && totalSecondsElapsed >= activity.default_duration_sec) {
        completeSession();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasStarted, isPaused, isCompleted, contourPhase, phaseSecondsRemaining, activity]);

  const startSession = () => {
    setHasStarted(true);
    setIsPaused(false);
    setTotalSecondsElapsed(0);

    if (activity) {
      speakInstruction(`Welcome to ${activity.name}. Settle comfortably, soften your posture, and follow along with ease.`);
      runRhythmCycle();
    }
  };

  const pauseSession = () => {
    setIsPaused(true);
    stopVoice();
  };

  const resumeSession = () => {
    setIsPaused(false);
  };

  const skipBreathHold = () => {
    if (contourPhase === 'hold' || contourPhase === 'pause') {
      setPhaseSecondsRemaining(1);
    }
  };

  const completeSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsCompleted(true);
    stopVoice();
    speakInstruction('Session complete. Acknowledge how your body feels, and return to your day with gentle ease.');

    // Save session in backend if user logged in
    if (user && activity) {
      api.logCompletion({
        activity_id: activity.id,
        duration_completed_sec: totalSecondsElapsed || activity.default_duration_sec,
        completed: true,
        stress_level_before: user.stress_level
      }).catch(e => console.warn('Completion log skipped:', e));
    }
  };

  const exitSession = () => {
    stopVoice();
    router.push('/dashboard');
  };

  if (loading || !activity) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-forest border-t-transparent animate-spin" />
        <p className="font-serif text-lg text-forest font-semibold">Preparing peaceful space...</p>
      </div>
    );
  }

  // Access Lock Screen (Phase 2.2: 72-Hour Trial Expired)
  if (isAccessLocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8 stroke-[1.75]" />
        </div>
        <div className="space-y-2">
          <span className="text-xs uppercase font-mono tracking-widest text-amber-800 font-semibold bg-amber-100 px-3 py-1 rounded-full">
            Trial Concluded
          </span>
          <h2 className="font-serif text-3xl font-medium text-forest">
            Continue Your Guided Journey
          </h2>
          <p className="text-xs text-earth-charcoal leading-relaxed font-medium">
            Your 72-hour free trial has ended. Subscribe to Medicine to Meditation for just ₹99/month to continue unlimited guided practices and soothing soundscapes.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/subscribe"
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-forest text-ivory-100 hover:bg-forest-light text-xs font-semibold shadow-md transition-all"
          >
            Activate Membership (₹99)
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-white border border-sage-300 text-forest text-xs font-semibold hover:bg-sage-50 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Session Completion View
  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20 text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full bg-sage-200 text-forest mx-auto flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-10 h-10 stroke-[2]" />
        </div>

        <div className="space-y-3">
          <span className="text-xs uppercase tracking-widest text-sage-800 font-mono font-semibold">
            Practice Concluded
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-forest font-medium">
            Return to stillness.
          </h2>
          <p className="text-sm text-earth-charcoal max-w-md mx-auto leading-relaxed font-medium">
            You completed {activity.name}. Notice the drop in physical tension, the gentle rhythm in your chest, and the space created in your mind.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-sage-200 max-w-md mx-auto space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-earth-charcoal">
            <span className="font-medium">Practice Duration</span>
            <span className="font-mono font-bold text-forest">
              {Math.floor(totalSecondsElapsed / 60)}m {totalSecondsElapsed % 60}s
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-earth-charcoal">
            <span className="font-medium">Breathing Cycles Completed</span>
            <span className="font-mono font-bold text-forest">{currentCycle}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-earth-charcoal">
            <span className="font-medium">Guidance Mode</span>
            <span className="font-semibold text-forest capitalize">
              {guidanceMode === 'both' ? 'Spoken & Visual' : guidanceMode === 'spoken' ? 'Voice Only' : 'Visual Only'}
            </span>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => {
              setIsCompleted(false);
              setHasStarted(false);
              setContourPhase('idle');
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-full text-xs font-semibold bg-white border border-sage-300 text-forest hover:bg-sage-50 transition-colors"
          >
            Practice Again
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3 rounded-full text-xs font-semibold bg-forest text-ivory-100 hover:bg-forest-light transition-all shadow-sm"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Pre-Session Introduction View
  if (!hasStarted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Navigation header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-earth-charcoal hover:text-forest transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
            <span>Return to Activities</span>
          </Link>
          <span className="text-xs bg-sage-200 text-forest px-3.5 py-1 rounded-full font-mono font-semibold">
            {Math.ceil(activity.default_duration_sec / 60)} min session
          </span>
        </div>

        {/* Activity Title & Description */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h1 className="font-serif text-3xl sm:text-5xl text-forest font-medium">
            {activity.name}
          </h1>
          <p className="text-sm text-earth-charcoal leading-relaxed font-normal">
            {activity.description}
          </p>
        </div>

        {/* Phase 3: Visual Human Profile Breathing Illustration */}
        <div className="flex justify-center py-2">
          <BreathingArt
            phase="idle"
            size={280}
            subText="Ready"
          />
        </div>

        {/* What to Expect Chips */}
        {activity.what_to_expect && activity.what_to_expect.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-sage-200 max-w-lg mx-auto shadow-xs">
            <h4 className="text-xs font-mono uppercase tracking-wider text-earth-muted mb-3 text-center font-semibold">
              What to Expect
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {activity.what_to_expect.map((item, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-sage-100 text-forest px-3 py-1.5 rounded-full border border-sage-200 font-semibold"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={startSession}
            className="inline-flex items-center gap-3 bg-forest hover:bg-forest-light text-ivory-100 px-9 py-4 rounded-full text-sm font-semibold shadow-md transition-all hover:scale-[1.02]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Begin Guided Relaxation</span>
          </button>
        </div>

        {/* Medical disclaimer note */}
        <p className="text-xs text-earth-charcoal/80 text-center max-w-md mx-auto pt-6 border-t border-sage-200 font-medium">
          <Shield className="w-3.5 h-3.5 inline mr-1 text-sage-700" />
          Designed for everyday stress management. If you experience discomfort, pause or stop at any moment.
        </p>
      </div>
    );
  }

  // Active Guided Practice View
  const currentStep = activity.step_instructions[currentStepIndex] || activity.step_instructions[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Top Session Bar */}
      <div className="flex items-center justify-between border-b border-sage-200/80 pb-3">
        <button
          onClick={exitSession}
          className="inline-flex items-center gap-1.5 text-xs text-earth-charcoal hover:text-forest font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2]" />
          <span>Exit</span>
        </button>

        <div className="text-center">
          <span className="font-serif text-sm sm:text-base font-semibold text-forest block">
            {activity.name}
          </span>
          <span className="text-[11px] font-mono text-earth-charcoal font-medium">
            Cycle {currentCycle} • Elapsed {Math.floor(totalSecondsElapsed / 60)}:{(totalSecondsElapsed % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Sound & Guidance Mode Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAudioSettings(!showAudioSettings)}
            className="p-2 rounded-full border border-sage-300 bg-white hover:bg-sage-50 text-forest transition-colors shadow-xs"
            title="Audio & Soundscape settings"
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            onClick={toggleVoice}
            className={`p-2 rounded-full border transition-colors shadow-xs ${
              isVoiceEnabled ? 'bg-sage-200 text-forest border-sage-400' : 'bg-white text-earth-muted border-sage-200'
            }`}
            title={isVoiceEnabled ? "Voice guidance active" : "Voice muted"}
          >
            {isVoiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded In-Activity Audio Chooser (Phase 4.1 Requirement) */}
      {showAudioSettings && (
        <div className="bg-white p-5 rounded-3xl border border-sage-200 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-serif text-base font-medium text-forest">Soundscape & Guidance Setup</span>
            <button
              onClick={() => setShowAudioSettings(false)}
              className="text-xs text-earth-muted hover:text-forest font-medium"
            >
              Done
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Ambient Music Toggle & Vol */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-forest flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-sage-700" />
                  <span>Ambient Music</span>
                </span>
                <button
                  onClick={toggleMusic}
                  className={`px-2.5 py-0.5 rounded-full font-medium ${isMusicPlaying ? 'bg-sage-200 text-forest' : 'bg-earth-oat text-earth-muted'}`}
                >
                  {isMusicPlaying ? 'Playing' : 'Off'}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseInt(e.target.value, 10))}
                className="w-full accent-forest h-1.5 bg-sage-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Voice Guidance Vol & Mode */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-forest flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-sage-700" />
                  <span>Voice Volume</span>
                </span>
                <span className="font-mono text-[11px] text-earth-charcoal font-medium">{voiceVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={voiceVolume}
                disabled={!isVoiceEnabled}
                onChange={(e) => setVoiceVolume(parseInt(e.target.value, 10))}
                className="w-full accent-forest h-1.5 bg-sage-200 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          {/* Quick Soundscape Switcher */}
          <div className="pt-2 border-t border-sage-100">
            <span className="text-[11px] font-mono uppercase text-earth-muted block mb-2 font-semibold">Change Background Soundscape</span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {tracks.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    selectTrack(t);
                    if (!isMusicPlaying) playMusic(t.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all border ${
                    currentTrack?.id === t.id
                      ? 'bg-forest text-ivory-100 border-forest font-semibold'
                      : 'bg-ivory-50 text-earth-charcoal border-sage-200 hover:bg-sage-100'
                  }`}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Breathing Centerpiece: Human Line-Art Illustration (Phase 3) */}
      <div className="flex flex-col items-center justify-center py-4 sm:py-6 space-y-4">
        
        {/* Phase Name Banner */}
        <div className="text-center space-y-1">
          <span className="text-xs font-mono uppercase tracking-widest text-forest font-semibold bg-sage-200 px-3.5 py-1 rounded-full border border-sage-300">
            {contourPhase.toUpperCase()} • {phaseSecondsRemaining}s
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-forest font-medium pt-2">
            {currentPhaseName}
          </h2>
        </div>

        {/* Phase-Synchronized Human Profile Linework Illustration */}
        <BreathingArt
          phase={contourPhase}
          progress={contourProgress}
          size={360}
          secondsRemaining={phaseSecondsRemaining}
          phaseName={currentPhaseName}
        />

        {/* Current Spoken / Visual Instruction */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-sage-200 max-w-md text-center shadow-xs">
          <p className="text-xs sm:text-sm text-forest leading-relaxed font-sans font-medium">
            {currentStep.instruction}
          </p>
        </div>

      </div>

      {/* Primary Session Controls */}
      <div className="flex flex-col items-center space-y-4">
        
        <div className="flex items-center gap-4">
          {/* Skip Hold (Adaptable Breathing Requirement) */}
          {(contourPhase === 'hold' || contourPhase === 'pause') && (
            <button
              onClick={skipBreathHold}
              className="inline-flex items-center gap-1.5 text-xs text-forest hover:bg-sage-200 bg-sage-100 px-4 py-2 rounded-full border border-sage-300 font-semibold transition-colors shadow-xs"
              title="Skip or shorten breath hold"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Shorten Hold</span>
            </button>
          )}

          {/* Pause / Resume Button */}
          {isPaused ? (
            <button
              onClick={resumeSession}
              className="w-14 h-14 rounded-full bg-forest text-ivory-100 flex items-center justify-center hover:bg-forest-light transition-all shadow-md"
              aria-label="Resume relaxation practice"
            >
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </button>
          ) : (
            <button
              onClick={pauseSession}
              className="w-14 h-14 rounded-full bg-forest text-ivory-100 flex items-center justify-center hover:bg-forest-light transition-all shadow-md"
              aria-label="Pause relaxation practice"
            >
              <Pause className="w-6 h-6 fill-current" />
            </button>
          )}

          {/* Stop / Exit Control */}
          <button
            onClick={completeSession}
            className="w-11 h-11 rounded-full bg-white text-earth-charcoal hover:text-forest border border-sage-300 flex items-center justify-center transition-colors shadow-xs"
            title="Conclude activity early"
          >
            <Square className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Discomfort Stop & Safety Option (Phase 2 Requirement) */}
        <div className="pt-2">
          <button
            onClick={() => setShowDiscomfortPrompt(!showDiscomfortPrompt)}
            className="text-xs text-earth-charcoal hover:text-forest underline underline-offset-4 transition-colors font-medium"
          >
            Feeling uncomfortable or lightheaded?
          </button>

          {showDiscomfortPrompt && (
            <div className="mt-2 bg-ivory-200 p-4 rounded-2xl border border-sage-300 text-center max-w-sm text-xs text-forest space-y-2 animate-in fade-in shadow-xs">
              <p className="font-medium leading-relaxed">
                Relaxation practices should never cause physical strain. Please stop, sit comfortably, and let your breath settle naturally.
              </p>
              <button
                onClick={exitSession}
                className="bg-forest text-ivory-100 px-5 py-2 rounded-full text-xs font-semibold hover:bg-forest-light transition-colors shadow-xs"
              >
                Stop Exercise Now
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
