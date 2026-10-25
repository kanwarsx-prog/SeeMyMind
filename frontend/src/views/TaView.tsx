import React, { useState } from 'react';
import { Child, ChildEvent } from '../types';
import { Plus, Sparkles, Clock, CheckCircle2, MessageSquare, TrendingUp, BatteryCharging } from 'lucide-react';
import { SensoryTokenModal } from '../components/SensoryTokenModal';


interface TaViewProps {
  child: Child;
  timeline: ChildEvent[];
  onOpenObservationModal: () => void;
  onDirectLog?: (data: any) => Promise<void>;
  onOpenWorksheet?: (worksheetKey: string) => void;
}

export const TaView: React.FC<TaViewProps> = ({ child, timeline, onOpenObservationModal, onDirectLog, onOpenWorksheet }) => {
  const [selectedPupil, setSelectedPupil] = useState('Phoenix');
  const [logType, setLogType] = useState('⭐ Learning win');
  const [logNotes, setLogNotes] = useState('');
  const [logging, setLogging] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);
  const [showSensoryModal, setShowSensoryModal] = useState<boolean>(false);
  const [sensoryPupil, setSensoryPupil] = useState<string>('Phoenix');
  const [sensoryLoggedSuccess, setSensoryLoggedSuccess] = useState<string | null>(null);

  const getPupilObject = (name: string): Child => {
    if (name === 'Riya') {
      return {
        ...child,
        first_name: 'Riya',
        preferred_name: 'Riya',
        full_name: 'Riya Patel',
        support_profile: {
          ...child.support_profile,
          id: 'sp-riya',
          child_id: 'riya-patel',
          primary_need: 'ADHD & Performance Anxiety',
          has_ehcp: false,
        },
      };
    }
    if (name === 'Jake') {
      return {
        ...child,
        first_name: 'Jake',
        preferred_name: 'Jake',
        full_name: "Jake O'Brien",
        support_profile: {
          ...child.support_profile,
          id: 'sp-jake',
          child_id: 'jake-obrien',
          primary_need: 'ADHD & Motor Restlessness',
          has_ehcp: false,
        },
      };
    }
    return child; // Phoenix
  };

  const handleLaunchSensoryReset = (pupilName: string) => {
    setSensoryPupil(pupilName);
    setShowSensoryModal(true);
  };

  const handleCompleteSensoryReset = async () => {
    if (onDirectLog) {
      try {
        await onDirectLog({
          title: `Proactive Sensory Reset (2-Min Token): ${sensoryPupil}`,
          summary: `Melissa Grant (TA) administered scheduled 2-minute proactive sensory/movement pause for ${sensoryPupil} before Step 3. Pupil successfully regulated to green zone ready for independent work.`,
          event_type: 'Observation',
          reporter_type: 'Teaching Assistant',
          reporter_name: 'Melissa Grant',
          significance: 'Notable Win',
          visibility: 'Shared',
          observation: {
            activity_context: 'Classroom Support (Step 2 to Step 3 Transition)',
            strategy_used: 'Proactive 2-Minute Sensory Token (CoP 6.44)',
            strategy_worked: true,
            notes: `Administered 2-min regulation break for ${sensoryPupil}. Pupil returned to calm, focused state without escalation.`,
          },
        });
        setSensoryLoggedSuccess(`Proactive 2-min reset logged for ${sensoryPupil} and synced with Ms Johnson!`);
        setTimeout(() => setSensoryLoggedSuccess(null), 5000);
      } catch (err) {
        console.error('Failed to log sensory reset:', err);
      }
    }
  };

  const handleQuickLog = async () => {
    if (!logNotes.trim()) return;
    setLogging(true);
    try {
      if (onDirectLog) {
        await onDirectLog({
          title: `TA Note (${selectedPupil}): ${logType}`,
          summary: logNotes,
          event_type: 'Observation',
          reporter_type: 'Teaching Assistant',
          reporter_name: 'Melissa Grant',
          significance: logType.includes('Learning') ? 'Notable Win' : 'Routine Note',
          visibility: 'Shared',
          observation: {
            activity_context: 'Classroom Support',
            strategy_used: '1-to-1 Support Protocol',
            strategy_worked: !logType.includes('Struggling') && !logType.includes('Incident'),
            notes: logNotes,
          },
        });
        setLogNotes('');
        setLoggedSuccess(true);
        setTimeout(() => setLoggedSuccess(false), 4000);
      } else {
        onOpenObservationModal();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TA Header */}
      <div id="ta-support-hub" className="card p-5 border-l-4 border-l-green scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-green-light dark:bg-emerald-950/60 flex items-center justify-center font-bold text-green dark:text-emerald-300 text-base shadow-xs">
              MG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-navy dark:text-white">Melissa Grant · Teaching Assistant Support</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-light dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-green/20 dark:border-emerald-800/40">
                  Year 5 Room 4
                </span>
              </div>
              <p className="text-xs text-textDim dark:text-slate-400">1-to-1 Key Worker for {child.full_name || 'Pupil'}</p>
            </div>
          </div>
          <button
            onClick={onOpenObservationModal}
            className="flex items-center gap-1.5 bg-green hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Detailed Observation</span>
          </button>
        </div>
      </div>

      {/* NOYA Briefing for TA */}
      <div className="noya-block">
        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-white/10">
          <Sparkles className="w-3.5 h-3.5 text-mint" />
          <span className="font-serif text-xs font-semibold text-white tracking-wide">
            NOYA · Your Morning Briefing for Phoenix
          </span>
        </div>
        <p className="text-xs text-white/90 leading-relaxed font-normal">
          Phoenix: skipped breakfast at home, took methylphenidate at 8:30am. <strong className="text-mint">Position yourself near the classroom door for arrival at 8:55am</strong>. Offer noise defenders before he reaches the main corridor. Dip window is 10:00–10:30am — water and crackers need to be ready. Today's maths uses a game design hook for gradient slopes — he should engage strongly once it clicks.
        </p>
      </div>

      {/* 1-Tap In-Classroom Regulation Hub for TA */}
      <div className="card p-4 sm:p-5 bg-gradient-to-br from-amber-50/70 via-cardBg to-amber-50/30 dark:from-amber-950/20 dark:via-cardBg dark:to-cardBg border border-amber-200/80 dark:border-amber-800/40 space-y-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-800/40 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
              <BatteryCharging className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-navy dark:text-white">
                  1-Tap Proactive Sensory / Movement Reset
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                  CoP 6.44 Provision
                </span>
              </div>
              <p className="text-[11px] text-textDim dark:text-slate-400">
                Trigger at the table between Step 2 modeling and Step 3 independent work — frees the classroom teacher from 1:1 screen management.
              </p>
            </div>
          </div>
        </div>

        {sensoryLoggedSuccess && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in zoom-in-95">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{sensoryLoggedSuccess}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-textDim dark:text-slate-400 uppercase tracking-wider">
              Pupil at table:
            </span>
            {[
              { name: 'Phoenix', need: 'ASC · Low Sensory' },
              { name: 'Riya', need: 'Anxiety · Grounding' },
              { name: 'Jake', need: 'ADHD · Movement' },
            ].map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setSensoryPupil(p.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  sensoryPupil === p.name
                    ? 'bg-amber-600 text-white shadow-xs font-bold ring-2 ring-amber-300 dark:ring-amber-700'
                    : 'bg-cardSubtle border border-borderMain text-textDim hover:text-textMain'
                }`}
              >
                <span>{p.name}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-md ${
                  sensoryPupil === p.name
                    ? 'bg-amber-700 text-amber-100'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {p.need.split(' · ')[0]}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleLaunchSensoryReset(sensoryPupil)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow active:scale-95 transition-all cursor-pointer flex-shrink-0"
          >
            <BatteryCharging className="w-4 h-4" />
            <span>Launch 2-Min Reset for {sensoryPupil} →</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Assigned Pupils & Quick Log */}
        <div className="lg:col-span-6 space-y-5">
          {/* Today's Assigned Pupils */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-borderMain pb-2">
              <div>
                <h3 className="text-sm font-bold text-navy dark:text-white">Today's Assigned Pupils</h3>
                <p className="text-[10px] text-textDim dark:text-slate-400">Priority order · with immediate operational actions</p>
              </div>
              <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded-md">
                3 Pupils
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-coral-50/50 dark:bg-coral-950/20 border border-coral-200/60 dark:border-coral-900/40 rounded-xl flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-coral-dark text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    PC
                  </div>
                  <div>
                    <div className="font-bold text-navy dark:text-white">Phoenix Carter — High Priority</div>
                    <div className="text-[11px] text-textSub dark:text-slate-300 mt-0.5 leading-snug">
                      Skipped breakfast · medication dip 10–10:30am · headphones at door · game design maths today
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded-md">
                    Act Now
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLaunchSensoryReset('Phoenix')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    title="Launch 2-minute regulation token for Phoenix"
                  >
                    <BatteryCharging className="w-2.5 h-2.5" />
                    <span>2-Min Reset</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 rounded-xl flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-dark text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    RP
                  </div>
                  <div>
                    <div className="font-bold text-navy dark:text-white">Riya Patel — Watch</div>
                    <div className="text-[11px] text-textSub dark:text-slate-300 mt-0.5 leading-snug">
                      Movement break at step 2 of maths pathway · monitor lunch transition for masking
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-bold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 rounded-md">
                    Watch
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLaunchSensoryReset('Riya')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    title="Launch 2-minute regulation token for Riya"
                  >
                    <BatteryCharging className="w-2.5 h-2.5" />
                    <span>2-Min Reset</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 rounded-xl flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    JO
                  </div>
                  <div>
                    <div className="font-bold text-navy dark:text-white">Jake O'Brien — Stable</div>
                    <div className="text-[11px] text-textSub dark:text-slate-300 mt-0.5 leading-snug">
                      Buddy pairing with Phoenix in assembly · settled this week · 82% maths pathway progress
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-1 rounded-md flex-shrink-0">
                  Stable
                </span>
              </div>
            </div>
          </div>

          {/* Quick Log (<45 seconds) */}
          <div id="ta-quick-log" className="card p-5 space-y-3.5 scroll-mt-6">
            <div className="flex items-center justify-between border-b border-borderMain pb-2">
              <div>
                <h3 className="text-sm font-bold text-navy dark:text-white">Fast Micro-Log (&lt; 45s)</h3>
                <p className="text-[10px] text-textDim dark:text-slate-400">Syncs immediately to Ms Johnson & SENCO timeline</p>
              </div>
              <span className="text-[10px] font-bold text-teal dark:text-teal-300 bg-mint-pale dark:bg-teal-950/50 border border-teal/20 dark:border-teal-800/40 px-2 py-0.5 rounded-md">
                Live Sync
              </span>
            </div>

            {loggedSuccess && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs animate-in zoom-in-95">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Micro-log saved to timeline and synced with Ms Johnson!</span>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-textDim dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Select Pupil
              </label>
              <div className="flex gap-2">
                {['Phoenix', 'Riya', 'Jake'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedPupil(name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedPupil === name
                        ? 'bg-teal text-white shadow-xs font-bold'
                        : 'bg-cardSubtle border border-borderMain text-textDim hover:text-textMain hover:bg-slate-100 dark:hover:bg-[#1E324A]'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-textDim dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                What happened?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['😄 Positive', '😐 Mixed', '😟 Struggling', '⭐ Learning win', '🔴 Incident'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setLogType(tag)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      logType === tag
                        ? 'bg-teal text-white shadow-xs font-bold'
                        : 'bg-cardSubtle border border-borderMain text-textDim hover:text-textMain hover:bg-slate-100 dark:hover:bg-[#1E324A]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <textarea
                rows={2}
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                placeholder="e.g. Phoenix drew gradient triangle independently at 10:45 — unprompted. Game design framing worked."
                className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-none focus:border-teal placeholder:text-textDim"
              />
            </div>

            <button
              onClick={handleQuickLog}
              disabled={logging || !logNotes.trim()}
              className="w-full py-2 px-4 bg-teal hover:bg-teal-medium disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{logging ? 'Saving...' : 'Log Now'}</span>
            </button>
          </div>

          {/* Recent Classroom Notes */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-borderMain pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-navy dark:text-white">Recent Classroom Notes for {child.preferred_name || 'Phoenix'}</h3>
              </div>
              <span className="text-[10px] text-textDim dark:text-slate-400">Classroom Feed</span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {timeline.slice(0, 3).map((evt) => (
                <div key={evt.id} className="p-2.5 bg-cardSubtle rounded-xl text-xs space-y-1 border border-borderMain">
                  <div className="flex justify-between font-bold text-navy dark:text-white">
                    <span>{evt.title}</span>
                    <span className="text-textDim dark:text-slate-400 text-[10px]">
                      {new Date(evt.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-textSub dark:text-slate-300 text-[11px] leading-relaxed">{evt.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: High-Risk Schedule Flagged */}
        <div className="lg:col-span-6 space-y-5">
          {/* Today's Schedule — High-Risk Moments Flagged (Prototype v2) */}
          <div id="ta-high-risk-schedule" className="card p-5 space-y-3 scroll-mt-6">
            <div className="flex items-center justify-between border-b border-borderMain pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-coral-dark dark:text-coral-light" />
                <div>
                  <h3 className="text-sm font-bold text-navy dark:text-white">Today's Schedule — High-Risk Moments</h3>
                  <p className="text-[10px] text-textDim dark:text-slate-400">What to watch · When · What to do</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded-md">
                SEND Protocol
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-coral-50/40 dark:bg-coral-950/20 border border-coral-200/60 dark:border-coral-900/40 flex items-start gap-3">
                <span className="font-mono font-bold text-rose-700 dark:text-rose-300 text-xs bg-cardBg px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/40 shadow-2xs flex-shrink-0">
                  8:55am
                </span>
                <div>
                  <div className="font-bold text-navy dark:text-white flex items-center gap-1.5">
                    <span>⚡ Door Arrival</span>
                    <span className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 px-1.5 py-0.5 rounded">Critical</span>
                  </div>
                  <p className="text-textSub dark:text-slate-300 mt-1 leading-relaxed text-[11px]">
                    Position at classroom door. Offer Phoenix headphones <em>before</em> he reaches the hall. Don't wait until he is already in the crowd noise.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-3">
                <span className="font-mono font-bold text-amber-800 dark:text-amber-300 text-xs bg-cardBg px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-900/40 shadow-2xs flex-shrink-0">
                  9:05am
                </span>
                <div>
                  <div className="font-bold text-navy dark:text-white">Assembly</div>
                  <p className="text-textSub dark:text-slate-300 mt-1 leading-relaxed text-[11px]">
                    Stay close to Phoenix. Watch for covering ears, rocking. Exit route: quiet corridor, chair outside room 4. Jake O'Brien is his buddy — keep them seated together.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-mint-pale/50 dark:bg-teal-950/20 border border-mint/40 dark:border-teal-900/40 flex items-start gap-3">
                <span className="font-mono font-bold text-teal dark:text-teal-300 text-xs bg-cardBg px-2 py-1 rounded-lg border border-borderMain shadow-2xs flex-shrink-0">
                  9:45am
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-navy dark:text-white">Maths — Adapted Visual Path Active</div>
                    {onOpenWorksheet && (
                      <button
                        type="button"
                        onClick={() => onOpenWorksheet('graphs')}
                        className="text-[10px] font-bold text-teal dark:text-teal-300 hover:underline cursor-pointer"
                      >
                        Open Worksheet →
                      </button>
                    )}
                  </div>
                  <p className="text-textSub dark:text-slate-300 mt-1 leading-relaxed text-[11px]">
                    Phoenix doing visual-spatial gradient route (game design hook). Riya needs movement break at step 2. Archie needs verbal walkthrough support.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLaunchSensoryReset('Riya')}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                    >
                      <BatteryCharging className="w-3 h-3" />
                      <span>Trigger Step 2 Break for Riya →</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLaunchSensoryReset('Phoenix')}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800 flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                    >
                      <BatteryCharging className="w-3 h-3" />
                      <span>Phoenix Reset →</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-coral-50/40 dark:bg-coral-950/20 border border-coral-200/60 dark:border-coral-900/40 flex items-start gap-3">
                <span className="font-mono font-bold text-rose-700 dark:text-rose-300 text-xs bg-cardBg px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/40 shadow-2xs flex-shrink-0">
                  10:00am
                </span>
                <div>
                  <div className="font-bold text-navy dark:text-white flex items-center gap-1.5">
                    <span>⚡ Medication Dip Window</span>
                    <span className="text-[10px] text-rose-800 dark:text-rose-300 font-semibold bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 px-1.5 py-0.5 rounded">Risk</span>
                  </div>
                  <p className="text-textSub dark:text-slate-300 mt-1 leading-relaxed text-[11px]">
                    Have crackers and water ready for Phoenix before 10am. Do not wait for him to ask. Signs: sweating, fidgeting, tummy pain. Do not interpret restlessness as defiance.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cardSubtle border border-borderMain flex items-start gap-3">
                <span className="font-mono font-bold text-textDim dark:text-slate-400 text-xs bg-cardBg px-2 py-1 rounded-lg border border-borderMain shadow-2xs flex-shrink-0">
                  12:00pm
                </span>
                <div>
                  <div className="font-bold text-navy dark:text-white">Lunch Transition</div>
                  <p className="text-textSub dark:text-slate-300 mt-1 leading-relaxed text-[11px]">
                    Monitor Riya at transition — 2 incidents at lunch this week. Watch for masking in classroom vs distress at unstructured times.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 flex items-start gap-3">
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-xs bg-cardBg px-2 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-900/40 shadow-2xs flex-shrink-0">
                  3:20pm
                </span>
                <div>
                  <div className="font-bold text-navy dark:text-white">Home Time & Parent Sync</div>
                  <p className="text-textSub dark:text-slate-300 mt-1 leading-relaxed text-[11px]">
                    Brief parent handover for Phoenix. Day summary auto-sent to Dana Carter. Confirm any wins from maths practical.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Frontline Strategy Efficacy Analytics Card */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-borderMain pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-navy dark:text-white">Frontline Strategy Efficacy (Room 4)</h3>
                  <p className="text-[10px] text-textDim dark:text-slate-400">Proven de-escalation win rates from classroom micro-logs</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-md font-mono">
                91.4% Avg
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-cardSubtle border border-borderMain flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-textMain dark:text-white flex items-center gap-1.5">
                    <span>🏃 Purposeful Movement / Errand</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-bold">94%</span>
                  </div>
                  <p className="text-[10px] text-textDim dark:text-slate-400">Pairs with Jake · 4m avg reset · Best for motor restlessness</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">✓ Primary</span>
              </div>

              <div className="p-2.5 rounded-xl bg-cardSubtle border border-borderMain flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-textMain dark:text-white flex items-center gap-1.5">
                    <span>🎧 Acoustic Shelter + Sand Timer</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-bold">93%</span>
                  </div>
                  <p className="text-[10px] text-textDim dark:text-slate-400">Blue sand timer · Pause questions · Pre-empt corridor noise</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">✓ Sensory</span>
              </div>

              <div className="p-2.5 rounded-xl bg-cardSubtle border border-borderMain flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-textMain dark:text-white flex items-center gap-1.5">
                    <span>🎮 Visual-Spatial Task Shift</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-bold">91%</span>
                  </div>
                  <p className="text-[10px] text-textDim dark:text-slate-400">Swaps abstract equations for Game Slope coordinate cards</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">✓ Learning</span>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <span>⚠️ Direct Verbal Demands / Questioning</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 font-bold">33%</span>
                  </div>
                  <p className="text-[10px] text-rose-700 dark:text-rose-400">Escalates fight-or-flight when dysregulated — use visual cards instead</p>
                </div>
                <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300">Avoid</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Sensory / Movement Reset Modal for TA */}
      {showSensoryModal && (
        <SensoryTokenModal
          isOpen={showSensoryModal}
          onClose={() => setShowSensoryModal(false)}
          child={getPupilObject(sensoryPupil)}
          onCompleteReset={handleCompleteSensoryReset}
          targetStepNumber={3}
        />
      )}
    </div>
  );
};
