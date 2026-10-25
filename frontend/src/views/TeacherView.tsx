import React, { useState } from 'react';
import { Child, ChildEvent, MorningBriefing, TransitionLogDetail } from '../types';
import { Sparkles, RefreshCw, AlertTriangle, CheckCircle2, ChevronDown, Plus, Clock } from 'lucide-react';
import { AdaptedPathwayCard } from '../components/AdaptedPathwayCard';
import { DeEscalationPalette } from '../components/DeEscalationPalette';
import { ClassSendMatrix } from '../components/ClassSendMatrix';
import { AbcTooltip } from '../components/AbcTooltip';

interface TeacherViewProps {
  child?: Child | null;
  timeline: ChildEvent[];
  briefing: MorningBriefing | null;
  latestHandover?: TransitionLogDetail | null;
  activeSubView?: 'focused' | 'matrix';
  onSubViewChange?: (view: 'focused' | 'matrix') => void;
  onSelectPupil?: (pupilId: string) => void;
  onRefreshBriefing: () => Promise<void>;
  onAcknowledgeHandover?: (transitionId: string) => Promise<void>;
  onOpenObservationModal: () => void;
  onOpenIncidentModal?: () => void;
  onOpenWorksheet: (worksheetKey: string) => void;
  onLogMilestone?: (milestoneTitle: string, note: string) => Promise<void>;
  onLogDeEscalation?: (data: {
    strategyName: string;
    category: string;
    worked: boolean;
    notes: string;
  }) => Promise<void>;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  child,
  timeline,
  briefing,
  latestHandover,
  activeSubView,
  onSubViewChange,
  onSelectPupil,
  onRefreshBriefing,
  onAcknowledgeHandover,
  onOpenObservationModal,
  onOpenIncidentModal,
  onOpenWorksheet,
  onLogMilestone,
  onLogDeEscalation,
}) => {
  const [activeTab, setActiveTab] = useState<'focused' | 'matrix'>(activeSubView || 'matrix');
  const [refreshing, setRefreshing] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(true);

  React.useEffect(() => {
    if (activeSubView && activeSubView !== activeTab) {
      setActiveTab(activeSubView);
    }
  }, [activeSubView]);

  const handleTabChange = (tab: 'focused' | 'matrix') => {
    setActiveTab(tab);
    onSubViewChange?.(tab);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefreshBriefing();
    setRefreshing(false);
  };

  const handleLogStrategyResult = async (data: {
    strategyName: string;
    category: string;
    worked: boolean;
    notes: string;
  }) => {
    if (onLogDeEscalation) {
      await onLogDeEscalation(data);
    } else if (onLogMilestone && data.worked) {
      await onLogMilestone(`De-Escalation Success: ${data.strategyName}`, data.notes);
    }
  };

  // Resolve handover from prop or timeline
  const timelineHandover = timeline.find((e) => e.event_type === 'Transition')?.transition_log;
  const effectiveHandover = latestHandover || timelineHandover;

  const handleAcknowledge = async () => {
    if (!effectiveHandover || !onAcknowledgeHandover) return;
    setAcknowledging(true);
    try {
      await onAcknowledgeHandover(effectiveHandover.id);
    } catch (err) {
      console.error(err);
    } finally {
      setAcknowledging(false);
    }
  };

  const ackTimeFormatted = effectiveHandover?.acknowledged_at
    ? new Date(effectiveHandover.acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '8:48am';

  return (
    <div className="space-y-6">
      {/* Top Level View Switcher: Classroom Hub vs 1:1 Support Focus */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-cardBg p-1.5 sm:p-2 rounded-2xl border border-borderMain shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => handleTabChange('matrix')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial ${
              activeTab === 'matrix'
                ? 'bg-teal text-white shadow-xs'
                : 'text-textDim hover:text-textMain hover:bg-cardSubtle'
            }`}
          >
            <span>🏫</span>
            <span>{child?.room_name || 'Room 4'} Classroom Hub</span>
          </button>

          <button
            onClick={() => handleTabChange('focused')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial ${
              activeTab === 'focused'
                ? 'bg-teal text-white shadow-xs'
                : 'text-textDim hover:text-textMain hover:bg-cardSubtle'
            }`}
          >
            <span>🧒</span>
            <span>
              {activeTab === 'focused'
                ? `${child?.preferred_name || child?.first_name || 'Pupil'} (1:1 Focus)`
                : '1:1 Pupil Focus'}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-textDim font-medium px-3 hidden sm:block">
          {activeTab === 'matrix' ? 'Whole-class differentiated adaptations' : 'Personalized EHCP interventions'}
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <ClassSendMatrix
          onSelectPupil={(pupilId) => {
            if (onSelectPupil) {
              onSelectPupil(pupilId);
            }
            handleTabChange('focused');
          }}
        />
      ) : (
        <>
          {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="stat-card border border-gray-100 border-l-4 border-l-rose-500">
          <div className="font-serif text-2xl font-bold text-rose-700">
            {effectiveHandover?.morning_mood || 'Anxious'}
          </div>
          <div className="text-[11px] text-gray-600 mt-0.5 leading-snug">
            Sleep: {effectiveHandover?.sleep_quality || 'Restless (woke at 4am)'}
          </div>
        </div>

        <div className="stat-card border border-gray-100 border-l-4 border-l-amber-500">
          <div className="font-serif text-2xl font-bold text-amber-800">3</div>
          <div className="text-[11px] text-gray-600 mt-0.5 leading-snug">
            Active alerts needing attention today
          </div>
        </div>

        <div className="stat-card border border-gray-100 border-l-4 border-l-emerald-600">
          <div className="font-serif text-2xl font-bold text-emerald-800">92%</div>
          <div className="text-[11px] text-gray-600 mt-0.5 leading-snug">
            Strategy effectiveness this week
          </div>
        </div>

        <div className="stat-card border border-gray-100 border-l-4 border-l-teal">
          <div className="font-serif text-2xl font-bold text-teal-800">{child?.year_group || "Year 5"}</div>
          <div className="text-[11px] text-gray-600 mt-0.5 leading-snug">
            {child?.room_name || "Room 4"} · Differentiated Cohort
          </div>
        </div>
      </div>

      {/* Pupil Profile Banner */}
      <div className="card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-purple-600">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
            🧒
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-serif font-bold text-navy">{child?.full_name || (child ? `${child.first_name || 'Phoenix'} ${child.last_name || 'Carter'}` : 'SEND Pupil')}</h2>
              <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                EHCP Active
              </span>
            </div>
            <p className="text-xs text-gray-700 mt-0.5 font-medium">
              Year {child?.year_group || '5'} · {child?.support_profile?.primary_need || 'Autism Spectrum Condition'} · Communication: Visual Task Cards
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Emergency Contact: {child?.last_name === 'Carter' || !child?.last_name ? 'Mum (Dana Carter) · 07700 900123' : `Parent/Guardian · ${child?.first_name || 'Pupil'}'s Contact`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
            ⚡ Assembly Alert 9:05am
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
            🎧 Noise Defenders
          </span>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
            effectiveHandover?.breakfast_eaten === false
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-amber-50 text-amber-900 border border-amber-200'
          }`}>
            {effectiveHandover?.breakfast_eaten === false ? '🍽 Skipped Breakfast' : '🥣 Breakfast Eaten'}
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
            💊 Meds Taken (Week 1)
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
            🎮 Goal: Game Designer
          </span>
          <button
            onClick={onOpenObservationModal}
            className="flex items-center gap-1.5 ml-2 bg-teal hover:bg-teal-medium text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Observation</span>
          </button>
        </div>
      </div>

      {/* ⭐ PRE-FLIGHT MORNING HANDOVER & OPERATIONAL RISK CARD */}
      <div id="preflight-handover" className={`card p-5 border-l-4 transition-all scroll-mt-6 ${
        !effectiveHandover
          ? 'border-l-slate-300 bg-cardSubtle'
          : effectiveHandover.acknowledged_by_staff
            ? 'border-l-emerald-600 bg-cardBg'
            : 'border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-borderMain">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              !effectiveHandover
                ? 'bg-cardSubtle text-textDim'
                : effectiveHandover.acknowledged_by_staff
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-navy dark:text-white">
                  Pre-Flight Morning Handover · {child?.last_name === 'Carter' || !child?.last_name ? 'Dana Carter (Mum)' : `${child?.preferred_name || child?.first_name || 'Pupil'}'s Home Handover`}
                </h3>
                {!effectiveHandover ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cardSubtle text-textDim border border-borderMain">
                    ⏳ Awaiting Home Submission
                  </span>
                ) : effectiveHandover.acknowledged_by_staff ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                    ✓ Read Receipt Delivered
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50 shadow-2xs">
                    🔔 Needs Teacher Acknowledgment
                  </span>
                )}
              </div>
              <p className="text-[11px] text-textDim dark:text-slate-400">
                {effectiveHandover
                  ? 'Submitted at 8:47am · Direct home-to-classroom loop'
                  : 'No morning transition log received yet today · Standing sensory baselines active'}
              </p>
            </div>
          </div>

          {!effectiveHandover ? (
            <div className="w-full sm:w-auto text-xs font-semibold text-textDim bg-cardSubtle px-3 py-2 sm:py-1.5 rounded-xl border border-borderMain flex items-center justify-center sm:justify-start gap-1.5 flex-shrink-0">
              <Clock className="w-4 h-4 text-textDim" />
              <span>Awaiting Parent Log</span>
            </div>
          ) : !effectiveHandover.acknowledged_by_staff ? (
            <button
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-teal hover:bg-teal-dark text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 flex-shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 text-mint" />
              <span>{acknowledging ? 'Acknowledging...' : '✓ Acknowledge Handover — Notify Home'}</span>
            </button>
          ) : (
            <div className="w-full sm:w-auto text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 sm:py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center sm:justify-start gap-1.5 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Acknowledged by Ms Johnson at {ackTimeFormatted}</span>
            </div>
          )}
        </div>

        {/* Handover Data Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-borderMain">
          <div className="bg-cardSubtle p-2.5 rounded-xl border border-borderMain">
            <div className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400">Sleep Quality</div>
            <div className="text-xs font-bold text-navy dark:text-white mt-0.5">
              {effectiveHandover?.sleep_quality || 'Restless (woke at 4am)'}
            </div>
          </div>
          <div className="bg-cardSubtle p-2.5 rounded-xl border border-borderMain">
            <div className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400">Morning Mood</div>
            <div className="text-xs font-bold text-navy dark:text-white mt-0.5">
              {effectiveHandover?.morning_mood || 'Anxious / Apprehensive'}
            </div>
          </div>
          <div className="bg-cardSubtle p-2.5 rounded-xl border border-borderMain">
            <div className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400">Breakfast Status</div>
            <div className={`text-xs font-bold mt-0.5 ${
              effectiveHandover?.breakfast_eaten === false ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
            }`}>
              {effectiveHandover?.breakfast_eaten === false ? '⚠️ Skipped (Dip Risk)' : '🥣 Breakfast Eaten'}
            </div>
          </div>
          <div className="bg-cardSubtle p-2.5 rounded-xl border border-borderMain">
            <div className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400">Medication</div>
            <div className={`text-xs font-bold mt-0.5 ${
              effectiveHandover?.medication_given ? 'text-teal dark:text-teal-300' : 'text-amber-800 dark:text-amber-300'
            }`}>
              {effectiveHandover?.medication_given ? '💊 Taken at 8:30am' : '⚠️ Not Taken'}
            </div>
          </div>
        </div>

        {/* Parent Notes & Status Note */}
        <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="text-textSub dark:text-slate-300">
            <span className="font-bold text-navy dark:text-white">{child?.last_name === 'Carter' || !child?.last_name ? "Mum's Note: " : "Home Note: "}</span>
            <span className="italic">
              "{effectiveHandover?.special_notes_for_day || (child?.last_name === 'Carter' || !child?.last_name ? 'Worried about assembly noise. Noise defenders packed in his bag.' : 'Please ensure sensory toolkit is available during transition.')}"
            </span>
          </div>

          {!effectiveHandover ? (
            <div className="text-[11px] text-textDim bg-cardSubtle px-2.5 py-1 rounded-lg border border-borderMain flex-shrink-0">
              Standing instruction: Offer sensory movement break at 10:00am
            </div>
          ) : !effectiveHandover.acknowledged_by_staff ? (
            <div className="text-[11px] text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/40 flex-shrink-0 font-medium">
              💡 {child?.last_name === 'Carter' || !child?.last_name ? "Dana's" : "Parent's"} app will update with a read receipt instantly when acknowledged
            </div>
          ) : (
            <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex-shrink-0">
              ✓ {child?.last_name === 'Carter' || !child?.last_name ? "Dana's" : "Parent's"} app shows: "Read by Ms Johnson at {ackTimeFormatted}"
            </div>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: NOYA AI & Alerts */}
        <div className="lg:col-span-7 space-y-5">
          {/* NOYA Intelligence Insight Block */}
          <div className="noya-block relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-mint/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-mint" />
                </div>
                <span className="font-serif text-sm font-semibold text-white tracking-wide">
                  NOYA · Morning Transition Intelligence
                </span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-[11px] font-medium text-white/70 hover:text-white bg-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Synthesizing...' : 'Re-generate'}</span>
              </button>
            </div>

            <div className="text-xs text-white/90 leading-relaxed space-y-2 whitespace-pre-line font-normal">
              {briefing ? (
                briefing.summary_markdown
              ) : (
                <p>Loading real-time arrival intelligence from Supabase...</p>
              )}
            </div>

            {briefing && briefing.citations && briefing.citations.length > 0 && (
              <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center gap-2 text-[10px] text-white/50">
                <span className="font-bold uppercase tracking-wider text-white/70">Verified Citations:</span>
                <span className="truncate">{briefing.citations.map((c) => c.citation_text).join(' · ')}</span>
              </div>
            )}
          </div>

          {/* Today's Alerts Card */}
          <div className="card overflow-hidden">
            <div
              onClick={() => setAlertsOpen(!alertsOpen)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-dark" />
                <div>
                  <h4 className="text-xs font-bold text-navy">Today's Support Alerts</h4>
                  <p className="text-[10px] text-gray-500">Live signals synced from parent handover & sensory profile</p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${alertsOpen ? 'rotate-180' : ''}`} />
            </div>

            {alertsOpen && (
              <div className="p-4 space-y-2.5 divide-y divide-gray-100 text-xs">
                <div className="pt-2 first:pt-0 flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-coral-dark mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-navy">9:05am Whole-School Assembly:</span> Sensory load is peak in the main hall. Noise defenders should be offered at classroom door before moving to the hall. Buddy pairing with Jake O'Brien active.
                  </div>
                </div>
                <div className="pt-2.5 flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-dark mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-navy">Restless Night (4:00am wake-up):</span> Dana reported disturbed sleep. Potential attention dip around 10:00am. Provide a 5-min movement pause if fidgeting escalates.
                  </div>
                </div>
                <div className="pt-2.5 flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-navy">Science Win Yesterday:</span> Demonstrated leadership in water density practical with Visual Task Cards. Strategy validated!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real-Time Sensory De-Escalation Palette */}
          <DeEscalationPalette
            pupilName={child?.preferred_name || child?.first_name || 'Phoenix'}
            onLogStrategyResult={handleLogStrategyResult}
          />

          {/* Adapted Learning Pathway — This Lesson */}
          <div id="adapted-pathway" className="scroll-mt-6">
            <AdaptedPathwayCard
              child={child}
              onOpenWorksheet={onOpenWorksheet}
              onLogMilestone={onLogMilestone}
            />
          </div>
        </div>

        {/* Right Column: Live Timeline of Events */}
        <div className="lg:col-span-5 space-y-4">
          <div id="daily-evidence-timeline" className="card p-4 scroll-mt-6">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Live Pupil Timeline</h3>
              <div className="flex items-center gap-2">
                {onOpenIncidentModal && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={onOpenIncidentModal}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 rounded-lg hover:bg-rose-100 cursor-pointer transition-all"
                    >
                      <span>+ Log ABC</span>
                    </button>
                    <AbcTooltip align="right" />
                  </div>
                )}
                <span className="text-[10px] text-gray-400">Synced to Supabase</span>
              </div>
            </div>

            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {timeline.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-4 text-center">No events logged yet.</p>
              ) : (
                timeline.map((evt) => (
                  <div key={evt.id} className="p-3 rounded-xl bg-cardSubtle border border-borderMain space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-navy dark:text-white">{evt.title}</span>
                      <span className="text-textDim dark:text-slate-400 text-[10px]">
                        {new Date(evt.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-textSub dark:text-slate-300 leading-relaxed">{evt.summary}</p>
                    <div className="flex items-center justify-between text-[10px] text-textDim dark:text-slate-400 pt-1 border-t border-borderMain mt-1.5">
                      <span>By {evt.reporter_name || evt.reporter_type}</span>
                      {evt.observation?.strategy_worked !== undefined && (
                        <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Strategy Worked</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
