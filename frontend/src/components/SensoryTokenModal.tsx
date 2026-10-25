import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  BatteryCharging,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Heart,
  Volume2,
  Activity,
  Plus,
} from 'lucide-react';
import { Child } from '../types';

interface SensoryTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  child?: Child | null;
  onCompleteReset?: () => Promise<void> | void;
  targetStepNumber?: number;
}

export const SensoryTokenModal: React.FC<SensoryTokenModalProps> = ({
  isOpen,
  onClose,
  child,
  onCompleteReset,
  targetStepNumber = 3,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(120); // 2 minutes = 120s
  const [isRunning, setIsRunning] = useState<boolean>(true); // Auto-starts when opened
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<boolean>(false);

  const pupilName = child?.preferred_name || child?.first_name || 'Pupil';
  const needText = child?.support_profile?.primary_need || 'Sensory & Executive Function Regulation';
  const needLower = needText.toLowerCase();

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset timer on open
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(120);
      setIsRunning(true);
      setSuccessNotice(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Timer interval
  useEffect(() => {
    if (!isOpen || !isRunning) return;

    if (timeLeft <= 0) {
      setIsRunning(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isRunning, timeLeft]);

  // 4-4-4-4 Box breathing cycle (16 seconds total cycle)
  useEffect(() => {
    if (!isOpen || !isRunning) return;

    const cycle = (120 - timeLeft) % 16;
    if (cycle < 4) {
      setBreathingPhase('Inhale');
    } else if (cycle < 8) {
      setBreathingPhase('Hold');
    } else if (cycle < 12) {
      setBreathingPhase('Exhale');
    } else {
      setBreathingPhase('Rest');
    }
  }, [isOpen, isRunning, timeLeft]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.max(0, Math.min(100, ((120 - timeLeft) / 120) * 100));

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setTimeLeft(120);
    setIsRunning(false);
  };

  const handleAdd30s = () => {
    setTimeLeft((prev) => prev + 30);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      if (onCompleteReset) {
        await onCompleteReset();
      }
      setSuccessNotice(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to complete sensory reset:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine pupil neurotype strategies
  const isAsc = needLower.includes('autism') || needLower.includes('asc') || needLower.includes('asd');
  const isAdhd = needLower.includes('adhd') || needLower.includes('add') || needLower.includes('hyperactive');
  const isAnxiety = needLower.includes('anxiety') || needLower.includes('mutism') || needLower.includes('emotional');

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-navy/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50/60 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BatteryCharging className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Scheduled 2-Min Sensory / Movement Token
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                  CoP 6.44 Proactive Break
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Proactive regulation pause between Step 2 & Step {targetStepNumber} for <span className="font-semibold text-slate-700 dark:text-slate-200">{pupilName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Visual Timer Display Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border border-amber-200/80 dark:border-amber-800/40 text-center relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col items-center justify-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nervous System Reset Timer</span>
              </span>

              {/* Digital Countdown */}
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white my-1">
                {formattedTime}
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-3 mb-2 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Breathing Pacer Cue */}
              <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-300">
                <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>Box Breathing Pacer:</span>
                <span className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                  {breathingPhase} ({((120 - timeLeft) % 4) + 1}/4)
                </span>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleToggleTimer}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm active:scale-95 ${
                    isRunning
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Timer</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Resume Timer</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95 transition-all"
                  title="Reset to 2 minutes"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset (2:00)</span>
                </button>

                <button
                  type="button"
                  onClick={handleAdd30s}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95 transition-all"
                  title="Add 30 seconds"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+30s</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pupil-Tailored Co-Regulation Strategies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Evidence-Based TA Protocols for {pupilName}</span>
              </h3>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Need: <span className="text-slate-700 dark:text-slate-200">{needText}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isAsc ? (
                <>
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <Volume2 className="w-4 h-4 text-teal-600" />
                      <span>1. Sensory Deprivation / Ear Defenders</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Offer noise-cancelling headphones or dim workspace desk lamp. Cut auditory classroom demands.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <Activity className="w-4 h-4 text-amber-600" />
                      <span>2. Tactile Resistance Fidget</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Provide sensory putty, textured palm strip, or allow head-down rest with zero conversation.
                    </p>
                  </div>
                </>
              ) : isAdhd ? (
                <>
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <Activity className="w-4 h-4 text-amber-600" />
                      <span>1. Proprioceptive Heavy Work</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      5 wall push-ups, chair dips, or resistance band knee stretches to discharge motor overflow.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <Volume2 className="w-4 h-4 text-teal-600" />
                      <span>2. Visual Chunking Reassurance</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Show that Step {targetStepNumber} is chunked into 2 small prompts: "Only 6 minutes and then we wrap up."
                    </p>
                  </div>
                </>
              ) : isAnxiety ? (
                <>
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>1. 5-4-3-2-1 Sensory Grounding</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Spot 3 calm objects in the room, touch the cool desk surface, and take a sip of cool water.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <span>2. Zero-Judgment Reassurance</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      "You solved Step 2 cleanly. In Step {targetStepNumber}, mistakes are expected and we will write the frame together."
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <Activity className="w-4 h-4 text-teal-600" />
                      <span>1. Postural Shift & Water Sip</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Stretch shoulders, shake out pencil grip tension, and take a cool sip of water.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>2. Eye Rest from Screen & Paper</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Gaze across the room or close eyes for 30 seconds to restore visual working memory.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SEND Code of Practice Context Note */}
          <div className="p-3.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/40 text-[11px] text-teal-900 dark:text-teal-200 leading-relaxed flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Why this token is essential (CoP 6.44):</span> High-intensity visual and cognitive modeling (Step 2) expends rapid working memory. A scheduled 2-minute regulation token resets the autonomic nervous system into the green zone, preventing task refusal or sensory meltdown before independent practice (Step {targetStepNumber}).
            </div>
          </div>
        </div>

        {/* Modal Footer / Action CTA */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {successNotice ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Reset Logged to Timeline & Step {targetStepNumber} Unlocked!</span>
              </span>
            ) : (
              <span>Ready to resume learning in green zone</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95 transition-all"
            >
              Dismiss
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleComplete}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer active:scale-95 transition-all shadow-sm hover:shadow disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Logging...' : `✓ Complete & Advance to Step ${targetStepNumber}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
