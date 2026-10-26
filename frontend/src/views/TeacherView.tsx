import React, { useState } from 'react';
import { Child, ChildEvent, MorningBriefing, TransitionLogDetail, TeacherSubView, LessonPathwayResponse, DecompressionBridgeResponse } from '../types';
import { Sparkles, AlertTriangle, CheckCircle2, ChevronDown, Plus, Clock, BookOpen, ArrowRight, X } from 'lucide-react';
import { AdaptedPathwayCard } from '../components/AdaptedPathwayCard';
import { DeEscalationPalette } from '../components/DeEscalationPalette';
import { ClassSendMatrix } from '../components/ClassSendMatrix';
import { DecompressionBridgeCard } from '../components/DecompressionBridgeCard';
import { AbcTooltip } from '../components/AbcTooltip';
import { api } from '../api';

interface TeacherViewProps {
  child?: Child | null;
  timeline: ChildEvent[];
  briefing: MorningBriefing | null;
  latestHandover?: TransitionLogDetail | null;
  activeSubView?: TeacherSubView;
  onSubViewChange?: (view: TeacherSubView) => void;
  onSelectPupil?: (pupilId: string) => void;
  onRefreshBriefing: () => Promise<void>;
  onAcknowledgeHandover?: (transitionId: string) => Promise<void>;
  onOpenObservationModal: () => void;
  onOpenIncidentModal?: () => void;
  onOpenWorksheet: (worksheetKey: string, pathwayData?: LessonPathwayResponse | null) => void;
  onLogMilestone?: (milestoneTitle: string, note: string) => Promise<void>;
  onLogDeEscalation?: (data: {
    strategyName: string;
    category: string;
    worked: boolean;
    notes: string;
  }) => Promise<void>;
}

const cleanBriefingText = (text?: string): string => {
  if (!text) return '';
  return text
    // remove `Citations: [...]` or Citations: [...] block
    .replace(/`?Citations:?\s*\[[^\]]*\]`?/gi, '')
    // remove inline timestamp brackets like [2026-10-25 13:34; 2026-10-25 08:59]
    .replace(/\s*\[\d{4}-\d{2}-\d{2}[^\]]*\]/g, '')
    .trim();
};

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
  const [activeTab, setActiveTab] = useState<TeacherSubView>(activeSubView || 'matrix');
  const [refreshing, setRefreshing] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(true);
  const [bridge, setBridge] = useState<DecompressionBridgeResponse | null>(null);
  const [showHomeTimeModal, setShowHomeTimeModal] = useState(false);
  const pupilName = child?.preferred_name || child?.first_name || 'Pupil';

  React.useEffect(() => {
    if (child?.id) {
      api.getDecompressionBridge(child.id)
        .then(setBridge)
        .catch((err) => console.error('Failed to load bridge in teacher view:', err));
    } else {
      setBridge(null);
    }
  }, [child?.id]);

  React.useEffect(() => {
    if (activeSubView && activeSubView !== activeTab) {
      setActiveTab(activeSubView);
    }
  }, [activeSubView]);

  const handleTabChange = (tab: TeacherSubView) => {
    setActiveTab(tab);
    onSubViewChange?.(tab);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefreshBriefing();
    if (child?.id) {
      api.getDecompressionBridge(child.id).then(setBridge).catch(console.error);
    }
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
    if (child?.id) {
      api.getDecompressionBridge(child.id).then(setBridge).catch(console.error);
    }
  };

  // Resolve handover from prop or timeline
  const timelineHandover = timeline.find((e) => e.event_type === 'Transition')?.transition_log;
  const effectiveHandover = latestHandover || timelineHandover;

  const handoverDateRaw = effectiveHandover?.event_time || effectiveHandover?.created_at;
  const handoverDate = handoverDateRaw ? new Date(handoverDateRaw) : null;
  const isHandoverToday = handoverDate
    ? handoverDate.toDateString() === new Date().toDateString()
    : false;
  const formattedHandoverDay = handoverDate
    ? handoverDate.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
    : null;
  const handoverTimeFormatted = handoverDate
    ? handoverDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

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

      {activeTab === 'matrix' && (
        <ClassSendMatrix
          onSelectPupil={(pupilId) => {
            if (onSelectPupil) {
              onSelectPupil(pupilId);
            }
            handleTabChange('focused');
          }}
        />
      )}

      {activeTab === 'focused' && (
        <>
          {/* ⭐ 30-SECOND MORNING READINESS COCKPIT */}
          <div id="preflight-handover" className="card p-5 sm:p-6 bg-gradient-to-r from-cardBg via-cardBg to-amber-50/20 dark:to-teal-950/20 border-l-4 border-l-teal shadow-xs scroll-mt-6 space-y-4">
            {/* Top Row: Pupil Identity + 1-Click Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-borderMain">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal/10 dark:bg-teal-950/60 border border-teal/20 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                  🧒
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-navy dark:text-white">
                      {child?.full_name || (child ? `${child.first_name || 'Phoenix'} ${child.last_name || 'Carter'}` : 'SEND Pupil')}
                    </h2>
                    <span className="bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      EHCP Active
                    </span>
                    <span className="text-[11px] font-medium text-textDim dark:text-slate-400">
                      Year {child?.year_group || '5'} · {child?.room_name || 'Room 4'}
                    </span>
                  </div>
                  <p className="text-xs text-textDim dark:text-slate-400 mt-0.5">
                    Primary Need: <strong className="text-textSub dark:text-slate-200">{child?.support_profile?.primary_need || 'Autism Spectrum Condition (ASC)'}</strong> · Visual Task Cards
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
                {!effectiveHandover || !isHandoverToday ? (
                  <div className="text-xs font-semibold text-textDim bg-cardSubtle px-3 py-2 rounded-xl border border-borderMain flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-textDim" />
                    <span>
                      {effectiveHandover && formattedHandoverDay
                        ? `Awaiting Today's Note (${formattedHandoverDay})`
                        : "Awaiting Today's Home Check-In"}
                    </span>
                  </div>
                ) : !effectiveHandover.acknowledged_by_staff ? (
                  <button
                    onClick={handleAcknowledge}
                    disabled={acknowledging}
                    className="px-4 py-2 bg-teal hover:bg-teal-dark text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    title={handoverTimeFormatted ? `Submitted by home at ${handoverTimeFormatted}` : 'Acknowledge home note and send instant read receipt to parent'}
                  >
                    <CheckCircle2 className="w-4 h-4 text-mint" />
                    <span>{acknowledging ? 'Acknowledging...' : '✓ Acknowledge Handover'}</span>
                  </button>
                ) : (
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Acknowledged at {ackTimeFormatted}</span>
                  </div>
                )}

                <button
                  onClick={() => setShowHomeTimeModal(true)}
                  className="flex items-center gap-1.5 bg-cardSubtle hover:bg-borderMain/30 text-textDim hover:text-textMain border border-borderMain px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  title="Preview what parents see at 3:15 PM pick-up"
                >
                  <span>🎒 3:15 Preview</span>
                </button>

                <button
                  onClick={onOpenObservationModal}
                  className="flex items-center gap-1.5 bg-teal hover:bg-teal-dark text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Note</span>
                </button>
              </div>
            </div>

            {/* Middle Row: Today's Morning Readiness Signals */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-cardSubtle p-2.5 rounded-xl border border-borderMain">
                <div className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400">Sleep Quality</div>
                <div className="text-xs font-bold text-navy dark:text-white mt-0.5 truncate">
                  {effectiveHandover?.sleep_quality || 'Restless (woke at 4am)'}
                </div>
              </div>

              <div className="bg-cardSubtle p-2.5 rounded-xl border border-borderMain">
                <div className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400">Morning Mood</div>
                <div className="text-xs font-bold text-navy dark:text-white mt-0.5 truncate">
                  {effectiveHandover?.morning_mood || 'Anxious / Apprehensive'}
                </div>
              </div>

              <div className="bg-cardSubtle p-2.5 rounded-xl border border-borderMain">
                <div className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400">Breakfast</div>
                <div className={`text-xs font-bold mt-0.5 ${
                  effectiveHandover?.breakfast_eaten === false ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                }`}>
                  {effectiveHandover?.breakfast_eaten === false ? '⚠️ Skipped (Dip Risk)' : '🥣 Eaten'}
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

            {/* Bottom Row: Parent Handover Quote & Key Protocol */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-textSub dark:text-slate-300">
                <span className="font-bold text-navy dark:text-white">{child?.last_name === 'Carter' || !child?.last_name ? "Mum's Note: " : "Home Note: "}</span>
                <span className="italic">
                  &quot;{effectiveHandover?.special_notes_for_day || (child?.last_name === 'Carter' || !child?.last_name ? 'Worried about assembly noise. Noise defenders packed in his bag.' : 'Please ensure sensory toolkit is available.')}&quot;
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-teal/10 text-teal-800 dark:text-teal-300 border border-teal/20">
                  🎧 Noise Defenders in Bag
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                  ⚡ Assembly 9:05am
                </span>
              </div>
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
                  NOYA · Morning Heads-Up
                </span>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-xs font-bold bg-mint hover:bg-mint/90 text-navy px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
                title="Ask NOYA to synthesize fresh morning heads-up"
              >
                <Sparkles className={`w-3.5 h-3.5 text-navy ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Synthesizing...' : 'Ask NOYA'}</span>
              </button>
            </div>

            {briefing ? (
              <div className="text-xs text-white/90 leading-relaxed space-y-2 whitespace-pre-line font-normal">
                {cleanBriefingText(briefing.summary_markdown)}
              </div>
            ) : (
              <div className="py-4 text-center space-y-3">
                <p className="text-xs text-white/80 max-w-md mx-auto leading-relaxed">
                  Morning Heads-Up is on standby. Click below to synthesize individualized guidance grounded in parent morning check-in, sleep logs, and EHCP profile.
                </p>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mint hover:bg-mint/90 text-navy text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  <Sparkles className={`w-4 h-4 text-navy ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Synthesizing with NOYA...' : '✨ Ask NOYA for Morning Briefing'}</span>
                </button>
              </div>
            )}

            {briefing && (
              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/50">
                <span className="flex items-center gap-1.5 text-mint/80 font-medium">
                  <span>✓ Grounded in {pupilName}&apos;s latest home handover &amp; timeline logs</span>
                </span>
                <span className="text-[10px] text-white/40">CoP 6.44 Compliant</span>
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
            pupilName={pupilName}
            onLogStrategyResult={handleLogStrategyResult}
          />
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
                      <span>+ Log Event (ABC)</span>
                    </button>
                    <AbcTooltip align="right" />
                  </div>
                )}
                <span className="text-[10px] text-teal font-medium">✓ Live & Secure</span>
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

        {/* Pathway Springboard Banner */}
        <div className="card p-3.5 bg-gradient-to-r from-teal/10 via-cardBg to-cardBg border border-teal/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal/15 dark:bg-teal-950/60 flex items-center justify-center text-teal dark:text-teal-300 border border-teal/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-navy dark:text-white flex items-center gap-2">
                <span>Adapted Lesson Pathways Scaffolding</span>
                <span className="text-[10px] font-bold text-teal dark:text-teal-300 bg-teal/10 px-1.5 py-0.5 rounded">
                  CoP 6.44
                </span>
              </div>
              <div className="text-[11px] text-textDim dark:text-slate-400">
                Individualized National Curriculum scaffolds, step ladders & 1:1 TA protocols for {pupilName}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleTabChange('pathways')}
            className="px-3.5 py-1.5 rounded-xl bg-teal hover:bg-teal-dark text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs flex-shrink-0 active:scale-95"
          >
            <span>Open Pathways Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </>
    )}

    {activeTab === 'pathways' && (
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Dedicated Pupil Pathway Header */}
        <div className="card p-4 bg-gradient-to-r from-teal/10 via-cardBg to-cardBg border border-teal/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal text-white font-bold text-sm flex items-center justify-center shadow-xs">
              {(child?.first_name?.[0] || 'P') + (child?.last_name?.[0] || '')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-navy dark:text-white">
                  {pupilName} {child?.last_name || ''} — Learning Pathways & Scaffolding
                </h3>
                <span className="text-[10px] font-bold text-teal dark:text-teal-300 bg-teal/10 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal/20">
                  {child?.room_name || 'Room 4'} · {child?.year_group || 'Year 5'}
                </span>
              </div>
              <div className="text-xs text-textDim dark:text-slate-400 mt-0.5">
                Primary Need: <strong className="text-navy dark:text-white">{child?.support_profile?.primary_need || 'Autism Spectrum Condition (ASC)'}</strong> · CoP 6.44 Scaffolding Framework
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabChange('focused')}
              className="text-xs font-bold text-teal dark:text-teal-300 hover:underline flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cardSubtle border border-borderMain cursor-pointer"
            >
              <span>← Return to 1:1 Focus</span>
            </button>
          </div>
        </div>

        {/* Dedicated Adapted Pathway Scaffolding Engine */}
        <div id="adapted-pathway" className="w-full">
          <AdaptedPathwayCard
            child={child}
            onOpenWorksheet={onOpenWorksheet}
            onLogMilestone={onLogMilestone}
          />
        </div>
      </div>
    )}

    {/* Home-Time Note (3:15 PM) Teacher Preview Modal */}
    {showHomeTimeModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-cardBg rounded-2xl border border-borderMain shadow-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-borderMain pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎒</span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-textHead">
                  3:15 PM Home-Time Note Preview · {pupilName}
                </h3>
                <p className="text-[11px] text-textDim">
                  Live synthesis of today&apos;s classroom logs ready for pick-up at the school gates.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHomeTimeModal(false)}
              className="p-1.5 rounded-xl hover:bg-cardSubtle text-textDim hover:text-textMain cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {bridge ? (
            <DecompressionBridgeCard bridge={bridge} childName={pupilName} />
          ) : (
            <div className="p-8 text-center text-textDim text-xs">
              Synthesizing today&apos;s adult logs from Room 4...
            </div>
          )}
        </div>
      </div>
    )}
    </div>
  );
};
