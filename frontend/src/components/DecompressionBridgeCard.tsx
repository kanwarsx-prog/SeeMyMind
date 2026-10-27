import React, { useState } from 'react';
import { DecompressionBridgeResponse } from '../types';
import {
  Battery,
  BatteryWarning,
  BatteryCharging,
  Eye,
  Sparkles,
  VolumeX,
  Coffee,
  Gamepad2,
  Copy,
  Check,
  AlertTriangle,
  HeartHandshake,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

interface DecompressionBridgeCardProps {
  bridge: DecompressionBridgeResponse;
  childName?: string;
  onAskNoya?: () => void;
}

export const DecompressionBridgeCard: React.FC<DecompressionBridgeCardProps> = ({
  bridge,
  childName = 'Phoenix',
  onAskNoya,
}) => {
  const [copied, setCopied] = useState(false);
  const [showClues, setShowClues] = useState(false);

  const getBatteryIcon = (pct: number) => {
    if (pct < 35) return <BatteryWarning className="w-6 h-6 text-rose-500 animate-pulse" />;
    if (pct < 65) return <Battery className="w-6 h-6 text-amber-500" />;
    return <BatteryCharging className="w-6 h-6 text-emerald-500" />;
  };

  const getBatteryGradient = (pct: number) => {
    if (pct < 35) return 'from-rose-500 via-rose-400 to-amber-400';
    if (pct < 65) return 'from-amber-500 via-yellow-400 to-emerald-400';
    return 'from-emerald-500 to-teal-400';
  };

  const getStepIcon = (iconType: string) => {
    switch (iconType) {
      case 'Door':
        return <HeartHandshake className="w-5 h-5 text-indigo-500" />;
      case 'VolumeX':
        return <VolumeX className="w-5 h-5 text-purple-500" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-amber-500" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-teal-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-gold" />;
    }
  };

  const handleCopyRecipe = () => {
    const text = `Home-Time Note for ${childName} (${bridge.battery_percentage}% Energy Level):\n` +
      bridge.decompression_recipe.map(r => `• Step ${r.step} (${r.subtitle}): ${r.title} - ${r.description}`).join('\n') +
      `\n\nTips: ${bridge.recommended_evening_activities.join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* 1. Afternoon Energy Level & Pick-Up Hero Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-teal-50/80 via-cardBg to-slate-50 dark:from-[#142234] dark:via-[#1B2F44] dark:to-[#142234] text-textMain dark:text-white shadow-xs relative overflow-hidden border border-teal-100 dark:border-borderMain">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-borderMain dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-500/20 px-2.5 py-0.5 rounded-full border border-teal-200/50 dark:border-transparent">
                Home-Time Note (3:15 PM)
              </span>
              <span className="text-[11px] text-textDim dark:text-white/60">Pick-Up &amp; Evening Guide</span>
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-navy dark:text-white mt-1">
              {childName}&apos;s Afternoon Energy Level
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyRecipe}
              className="px-3 py-1.5 bg-cardBg dark:bg-white/10 hover:bg-cardSubtle dark:hover:bg-white/20 active:scale-95 text-xs text-textMain dark:text-white rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-borderMain dark:border-white/10 shadow-2xs"
              title="Copy home-time note to share with family"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />}
              <span>{copied ? 'Copied Note!' : 'Share Note'}</span>
            </button>
          </div>
        </div>

        {/* Sensory Battery Visual Gauge */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2 text-textHead dark:text-white/90">
                {getBatteryIcon(bridge.battery_percentage)}
                <span className="font-bold text-sm tracking-wide">
                  {bridge.battery_status}
                </span>
              </div>
              <span className="text-base font-bold text-navy dark:text-white font-mono">
                {bridge.battery_percentage}%
              </span>
            </div>

            {/* Glowing Battery Progress Bar */}
            <div className="w-full bg-slate-200/80 dark:bg-white/15 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-white/20 shadow-inner">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getBatteryGradient(
                  bridge.battery_percentage
                )} transition-all duration-1000 shadow-sm`}
                style={{ width: `${bridge.battery_percentage}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-textDim dark:text-white/50 pt-0.5 font-medium">
              <span>0% Needs Quiet</span>
              <span>50% Steady</span>
              <span>100% Calm &amp; Content</span>
            </div>
          </div>

          {/* Masking Decoder summary */}
          <div className="md:col-span-5 bg-cardSubtle dark:bg-white/10 backdrop-blur-md rounded-xl p-3 border border-borderMain dark:border-white/10 shadow-2xs">
            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
              <span>{bridge.masking_level}</span>
            </div>
            <p className="text-[11px] text-textSub dark:text-white/80 leading-relaxed">
              Based on today&apos;s teacher notes. Zero pressure or tests on {childName}.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Evidence-led home-time guidance */}
      <div className="card p-5 space-y-4 border border-teal/20 bg-gradient-to-b from-cardBg to-mint/5 dark:from-cardBg dark:to-cardBg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-borderMain pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-dark dark:text-amber-300" />
              <h3 className="text-sm font-bold text-navy dark:text-white">Recorded Support Signals</h3>
            </div>
            <p className="text-xs text-textDim dark:text-slate-300 mt-0.5">
              What today&apos;s records support for {childName}. This is not a clinical prescription.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal/10 dark:bg-teal-500/20 text-teal-dark dark:text-teal-300">
              {bridge.guidance_confidence}
            </span>
            {onAskNoya && (
              <button
                type="button"
                onClick={onAskNoya}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal text-white text-[10px] font-bold hover:bg-teal-dark transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Explain with NOYA
              </button>
            )}
          </div>
        </div>

        {bridge.decompression_recipe.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {bridge.decompression_recipe.map((step) => (
            <div
              key={step.step}
              className="p-3.5 rounded-xl bg-cardBg dark:bg-cardBg border border-borderMain shadow-2xs hover:border-teal/40 transition-all flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-cardSubtle border border-borderMain flex items-center justify-center flex-shrink-0 mt-0.5">
                {getStepIcon(step.icon_type)}
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal dark:text-teal-300">
                    Step {step.step} · {step.subtitle}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-cardSubtle border border-borderMain text-textDim dark:text-slate-300">
                    {step.tag}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-navy dark:text-white">{step.title}</h4>
                <p className="text-xs text-textSub dark:text-slate-300 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        ) : (
          <div className="p-4 rounded-xl bg-cardSubtle border border-borderMain text-xs text-textDim">
            No pupil-specific support step has been recorded as effective today. Ask NOYA to explain the available evidence, or wait for a staff or home note.
          </div>
        )}

        {/* Recorded strategy options */}
        {bridge.recommended_evening_activities.length > 0 && <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 text-xs space-y-1.5">
          <div className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5 text-xs">
            <span>✨ Screen-Free Recovery Ideas</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-teal-800 dark:text-teal-300 text-[11px]">
            {bridge.recommended_evening_activities.map((act, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                <span>{act}</span>
              </div>
            ))}
          </div>
        </div>}

        {bridge.guidance_basis.length > 0 && (
          <div className="text-[10px] text-textDim border-t border-borderMain pt-2">
            Based on: {bridge.guidance_basis.join(' · ')}
          </div>
        )}
      </div>

      {/* 3. Progressive Disclosure: Classroom Clues & Energy Details */}
      <div className="card overflow-hidden border border-borderMain shadow-2xs">
        <button
          type="button"
          onClick={() => setShowClues(!showClues)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-cardSubtle transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal/10 dark:bg-teal-950/60 flex items-center justify-center text-teal dark:text-teal-300 flex-shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-navy dark:text-white flex items-center gap-2">
                <span>Classroom Observation Clues &amp; Energy Drivers</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300">
                  {bridge.adult_observation_clues?.length || 0} Notes
                </span>
              </div>
              <p className="text-[11px] text-textDim dark:text-slate-400 mt-0.5">
                What staff noticed today and factors influencing {childName}&apos;s battery
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-textDim transition-transform duration-200 ${
              showClues ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showClues && (
          <div className="p-4 sm:p-5 pt-1 border-t border-borderMain space-y-4 animate-in fade-in duration-150">
            {/* Hidden Classroom Masking Decoder */}
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <h4 className="text-xs font-bold text-navy dark:text-white flex items-center gap-2">
                <span>Holding It Together at School</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                  Masking Decoder
                </span>
              </h4>
              <p className="text-xs text-textSub dark:text-slate-300 mt-1 leading-relaxed">
                {bridge.masking_explanation}
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="bg-rose-50/70 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/40">
                  <div className="text-[10px] font-bold text-rose-800 dark:text-rose-300 mb-1">
                    ⚡ What Drained Energy Today
                  </div>
                  <ul className="space-y-0.5 text-[11px] text-rose-700 dark:text-rose-200 list-disc list-inside">
                    {bridge.draining_factors.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                  <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                    🌱 What Helped Today
                  </div>
                  <ul className="space-y-0.5 text-[11px] text-emerald-700 dark:text-emerald-200 list-disc list-inside">
                    {bridge.recharging_factors.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Adult Observation Clues */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-navy dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal" />
                  <span>Observations from School &amp; Home</span>
                </span>
                <span className="text-[10px] text-textDim dark:text-slate-400">Teacher &amp; parent notes</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {bridge.adult_observation_clues.map((clue, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-cardSubtle border border-borderMain flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-navy dark:text-white">{clue.source}</span>
                        <span className="text-textDim dark:text-slate-400 text-[10px]">{clue.time}</span>
                      </div>
                      <div className="text-[10px] uppercase font-bold text-teal dark:text-teal-300 tracking-wide mb-1">
                        {clue.role} · {clue.marker_type}
                      </div>
                      <p className="text-xs text-textSub dark:text-slate-300 leading-relaxed italic">
                        &quot;{clue.observation}&quot;
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-borderMain text-[10px] text-textDim flex items-center justify-between">
                      <span>Significance:</span>
                      <span className="font-semibold text-textMain dark:text-white">{clue.significance}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
