import React, { useState, useEffect } from 'react';
import {
  Child,
  ChildEvent,
  TransitionLogDetail,
  DecompressionBridgeResponse,
  MedicationCorrelationResponse,
  ParentWinsGalleryItem,
  EveningCheckInCreate,
  CamhsClinicalDossierResponse,
  UserProfile,
} from '../types';
import { api } from '../api';
import { DecompressionBridgeCard } from '../components/DecompressionBridgeCard';
import { DailySupportLoopStrip } from '../components/DailySupportLoopStrip';
import { EveningCheckInModal } from '../components/EveningCheckInModal';
import { CamhsEvidenceDossierModal } from '../components/CamhsEvidenceDossierModal';
import {
  Heart,
  Send,
  CheckCircle2,
  Sparkles,
  Pill,
  Award,
  Copy,
  Check,
  Calendar,
  FileText,
  Moon,
  Sun,
  Clock,
  Edit3,
} from 'lucide-react';

export type ParentTabKey = 'today' | 'wins' | 'health' | 'bridge' | 'handover' | 'correlation';

interface ParentViewProps {
  child: Child;
  pupils?: Child[];
  onSelectChild?: (childId: string) => void;
  currentUser?: UserProfile | null;
  timeline: ChildEvent[];
  latestHandover?: TransitionLogDetail | null;
  onSubmitHandover: (data: any) => Promise<void>;
  onAskNoya?: (query?: string) => void;
  activeTab?: ParentTabKey;
  onTabChange?: (tab: 'today' | 'wins' | 'health') => void;
}

export const ParentView: React.FC<ParentViewProps> = ({
  child,
  pupils,
  onSelectChild,
  currentUser,
  timeline,
  latestHandover,
  onSubmitHandover,
  onAskNoya,
  activeTab: propActiveTab,
  onTabChange,
}) => {
  const normalizeTab = (tab?: string): 'today' | 'wins' | 'health' => {
    if (tab === 'wins') return 'wins';
    if (tab === 'correlation' || tab === 'health') return 'health';
    return 'today';
  };

  const [activeTab, setActiveTab] = useState<'today' | 'wins' | 'health'>(
    normalizeTab(propActiveTab)
  );
  const [showMorningEdit, setShowMorningEdit] = useState(false);
  const [showSharedMoments, setShowSharedMoments] = useState(false);

  useEffect(() => {
    if (propActiveTab) {
      const normalized = normalizeTab(propActiveTab);
      if (normalized !== activeTab) {
        setActiveTab(normalized);
      }
    }
  }, [propActiveTab]);

  const handleTabSelect = (tab: 'today' | 'wins' | 'health') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Decompression bridge data
  const [bridge, setBridge] = useState<DecompressionBridgeResponse | null>(null);
  const [bridgeLoading, setBridgeLoading] = useState(false);

  // Medication correlation data
  const [correlation, setCorrelation] = useState<MedicationCorrelationResponse | null>(null);
  const [corrLoading, setCorrLoading] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Wins gallery data
  const [wins, setWins] = useState<ParentWinsGalleryItem[]>([]);
  const [winsLoading, setWinsLoading] = useState(false);

  // Evening modal
  const [eveningModalOpen, setEveningModalOpen] = useState(false);

  // CAMHS Clinical Dossier state
  const [camhsDossier, setCamhsDossier] = useState<CamhsClinicalDossierResponse | null>(null);
  const [camhsModalOpen, setCamhsModalOpen] = useState(false);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const handleOpenCamhsModal = async () => {
    if (!child.id) return;
    try {
      setLoadingDossier(true);
      const data = await api.getCamhsClinicalDossier(child.id);
      setCamhsDossier(data);
      setCamhsModalOpen(true);
    } catch (err) {
      console.error('Failed to load CAMHS dossier:', err);
      alert('Failed to generate clinical dossier: ' + err);
    } finally {
      setLoadingDossier(false);
    }
  };

  // Morning handover form state
  const [sleep, setSleep] = useState('Restless (woke in night)');
  const [mood, setMood] = useState('Anxious');
  const [breakfast, setBreakfast] = useState(false);
  const [meds, setMeds] = useState(true);
  const [notes, setNotes] = useState('Worried about assembly noise. Noise defenders packed in his bag.');
  const [submitted, setSubmitted] = useState(false);
  const [submittingHandover, setSubmittingHandover] = useState(false);

  // Fallback to timeline if latestHandover prop is null
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

  const childName = child.first_name || 'Phoenix';

  useEffect(() => {
    if (!child.id) return;

    // Load Decompression Bridge
    setBridgeLoading(true);
    api.getDecompressionBridge(child.id)
      .then(setBridge)
      .catch((err) => console.error('Error fetching decompression bridge:', err))
      .finally(() => setBridgeLoading(false));

    // Load Correlation Digest
    setCorrLoading(true);
    api.getMedicationCorrelation(child.id)
      .then(setCorrelation)
      .catch((err) => console.error('Error fetching correlation digest:', err))
      .finally(() => setCorrLoading(false));

    // Load Wins Gallery
    setWinsLoading(true);
    api.getWinsGallery(child.id)
      .then(setWins)
      .catch((err) => console.error('Error fetching wins gallery:', err))
      .finally(() => setWinsLoading(false));
  }, [child.id]);

  const handleSubmitMorningHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingHandover(true);
    try {
      await onSubmitHandover({
        sleep_quality: sleep,
        morning_mood: mood,
        breakfast_eaten: breakfast,
        medication_given: meds,
        special_notes_for_day: notes,
      });
      setSubmitted(true);
      setShowMorningEdit(false);
      // Refresh decompression bridge with new morning data
      if (child.id) {
        api.getDecompressionBridge(child.id).then(setBridge).catch(console.error);
      }
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to send handover to school.');
    } finally {
      setSubmittingHandover(false);
    }
  };

  const handleEveningSubmit = async (data: EveningCheckInCreate) => {
    if (!child.id) return;
    await api.submitEveningHandover(child.id, data);
    // Refresh bridge
    api.getDecompressionBridge(child.id).then(setBridge).catch(console.error);
  };

  const handleCopyPediatricianSummary = () => {
    if (!correlation) return;
    navigator.clipboard.writeText(correlation.pediatrician_summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  const ackTime = effectiveHandover?.acknowledged_at
    ? new Date(effectiveHandover.acknowledged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '8:48am';

  const renderMorningForm = () => (
    submitted ? (
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs animate-in zoom-in-95">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <div>
          <div className="font-bold">Handover Sent to Room 4!</div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
            Ms Johnson and TA Melissa have received {childName}&apos;s morning signals.
          </div>
        </div>
      </div>
    ) : (
      <form onSubmit={handleSubmitMorningHandover} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-navy dark:text-white mb-1">
              How did {childName} sleep?
            </label>
            <select
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-none focus:border-teal"
            >
              <option>Good (8+ hours restful)</option>
              <option>Restless (woke in night at 4am)</option>
              <option>Poor (&lt; 6 hours / troubled)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy dark:text-white mb-1">
              Morning mood at breakfast
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-none focus:border-teal"
            >
              <option>Calm &amp; Happy</option>
              <option>Anxious / Apprehensive</option>
              <option>Frustrated / Overwhelmed</option>
              <option>Tired &amp; Low Energy</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 py-0.5">
          <label className="flex items-center gap-2 text-xs text-textMain p-2 bg-cardSubtle rounded-xl border border-borderMain cursor-pointer hover:bg-cardBg transition-colors">
            <input
              type="checkbox"
              checked={breakfast}
              onChange={(e) => setBreakfast(e.target.checked)}
              className="rounded text-teal focus:ring-teal"
            />
            <span className="font-medium">Breakfast Eaten</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-textMain p-2 bg-cardSubtle rounded-xl border border-borderMain cursor-pointer hover:bg-cardBg transition-colors">
            <input
              type="checkbox"
              checked={meds}
              onChange={(e) => setMeds(e.target.checked)}
              className="rounded text-teal focus:ring-teal"
            />
            <span className="font-medium">Medication Taken</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy dark:text-white mb-1">
            Special notes for today (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Nervous about assembly noise; noise defenders in his bag..."
            className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-none focus:border-teal"
          />
        </div>

        <button
          type="submit"
          disabled={submittingHandover}
          className="w-full sm:w-auto px-5 py-2.5 bg-teal hover:bg-teal-dark text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{submittingHandover ? 'Sending Handover...' : 'Send Morning Note to School'}</span>
        </button>
      </form>
    )
  );

  const sharedEvents = timeline.filter((event) => event.visibility === 'Shared');
  const todayKey = new Date().toDateString();

  const formatEventDate = (eventTime: string) => new Date(eventTime).toLocaleDateString([], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-10">
      {/* 1. Sibling Switcher Ribbon for Multi-Child Families */}
      {pupils && pupils.length > 1 && (
        <div className="card p-2.5 sm:p-3 bg-cardBg border border-borderMain flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs uppercase tracking-wider text-textDim font-bold flex items-center gap-1">
              <span>👨‍👩‍👧‍👦</span>
              <span>Your Children:</span>
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {pupils.map((p) => {
              const isSelected = p.id === child.id;
              const displayName = p.preferred_name || p.first_name || p.full_name;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectChild?.(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                    isSelected
                      ? 'bg-teal text-white shadow-2xs'
                      : 'bg-cardSubtle hover:bg-borderMain/30 text-textMain border border-borderMain'
                  }`}
                  aria-pressed={isSelected}
                  title={`Switch view to ${displayName}`}
                >
                  <span>🧒 {displayName} {p.last_name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-cardBg text-textDim'}`}>
                    {p.year_group || 'SEND'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Calm Parent Header */}
      <div className="card p-4 sm:p-5 bg-gradient-to-r from-teal-50/50 via-cardBg to-amber-50/30 dark:from-teal-950/20 dark:via-cardBg dark:to-amber-950/15 border-l-4 border-l-teal shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">👩‍👦</span>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-navy dark:text-white">
                Welcome, {currentUser?.full_name?.split(' ')[0] || 'Dana'}
              </h2>
              <span className="text-xs text-textDim dark:text-slate-400">·</span>
              <span className="text-xs font-semibold text-textSub dark:text-slate-300">
                {childName}&apos;s Inclusion Loop
              </span>
            </div>
            <p className="text-xs text-textDim dark:text-slate-400 mt-0.5">
              Direct connection with {child.room_name || 'Room 4'} · Zero screen demands or tests on {childName}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setEveningModalOpen(true)}
              className="py-2 px-3.5 bg-cardSubtle hover:bg-cardBg text-textMain border border-borderMain hover:border-teal rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-2xs"
            >
              <Moon className="w-3.5 h-3.5 text-amber-500" />
              <span>Evening Check-In</span>
            </button>
            <div className="text-[11px] text-textDim hidden md:block">
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Streamlined 3-Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-borderMain scrollbar-none">
        <button
          onClick={() => handleTabSelect('today')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer min-h-[42px] ${
            activeTab === 'today'
              ? 'bg-teal text-white shadow-xs font-bold'
              : 'bg-cardBg text-textDim hover:text-textMain hover:bg-cardSubtle border border-borderMain font-semibold'
          }`}
        >
          <Sun className={`w-4 h-4 ${activeTab === 'today' ? 'text-white' : 'text-amber-500'}`} />
          <span>Today&apos;s Daily Loop</span>
          {bridge && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              activeTab === 'today' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200'
            }`}>
              {bridge.battery_percentage}% Battery
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabSelect('wins')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer min-h-[42px] ${
            activeTab === 'wins'
              ? 'bg-teal text-white shadow-xs font-bold'
              : 'bg-cardBg text-textDim hover:text-textMain hover:bg-cardSubtle border border-borderMain font-semibold'
          }`}
        >
          <Award className={`w-4 h-4 ${activeTab === 'wins' ? 'text-white' : 'text-gold'}`} />
          <span>Wins &amp; Strengths</span>
          {wins.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === 'wins' ? 'bg-amber-300 text-teal-950' : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
            }`}>
              {wins.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabSelect('health')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer min-h-[42px] ${
            activeTab === 'health'
              ? 'bg-teal text-white shadow-xs font-bold'
              : 'bg-cardBg text-textDim hover:text-textMain hover:bg-cardSubtle border border-borderMain font-semibold'
          }`}
        >
          <Pill className={`w-4 h-4 ${activeTab === 'health' ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />
          <span>Health &amp; Doctor Reports</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: TODAY'S LIVE DAILY LOOP (MORNING + 3:15PM BRIDGE)  */}
      {/* ======================================================== */}
      {activeTab === 'today' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Today's 4-Stage Support Loop Strip */}
          <DailySupportLoopStrip
            child={child}
            latestHandover={effectiveHandover}
            bridge={bridge}
            currentUserRole="parent"
            onOpenHomeTimeNote={() => {
              const el = document.getElementById('home-time-bridge');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenMorningCheckIn={() => {
              const el = document.getElementById('morning-checkin-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Morning Handover Status / Form */}
          <div id="morning-checkin-section">
            {isHandoverToday && effectiveHandover?.acknowledged_by_staff ? (
              /* Acknowledged by Teacher */
              <div className="card p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-cardBg to-emerald-50/20 dark:from-emerald-950/30 dark:via-cardBg dark:to-teal-950/20 border-l-4 border-l-emerald-600 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-navy dark:text-white">
                          Morning Handover Read by Ms Johnson at {ackTime}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                          ✓ Welcomed in Room 4
                        </span>
                      </div>
                      <p className="text-xs text-textSub dark:text-slate-300 mt-1 leading-relaxed">
                        Ms Johnson acknowledged {childName}&apos;s sleep and mood notes. Noise defenders are ready on his desk for assembly.
                      </p>
                      <div className="mt-2 text-[11px] text-textDim flex flex-wrap items-center gap-2">
                        <span>Mood: <strong className="text-textMain capitalize">{effectiveHandover.morning_mood}</strong></span>
                        <span>·</span>
                        <span>Sleep: <strong className="text-textMain capitalize">{effectiveHandover.sleep_quality}</strong></span>
                        <span>·</span>
                        <span>Breakfast: <strong className="text-textMain">{effectiveHandover.breakfast_eaten !== false ? 'Eaten' : 'Skipped'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowMorningEdit(!showMorningEdit)}
                    className="self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-cardSubtle hover:bg-borderMain/30 text-textDim hover:text-textMain border border-borderMain transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{showMorningEdit ? 'Hide Form' : 'Update Note'}</span>
                  </button>
                </div>

                {showMorningEdit && (
                  <div className="mt-4 pt-4 border-t border-borderMain animate-in fade-in duration-150">
                    {renderMorningForm()}
                  </div>
                )}
              </div>
            ) : isHandoverToday && effectiveHandover ? (
              /* Delivered, awaiting read */
              <div className="card p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-cardBg to-amber-50/20 dark:from-amber-950/30 dark:via-cardBg dark:to-amber-950/15 border-l-4 border-l-amber-500 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-navy dark:text-white">
                          Morning Handover Sent · Awaiting Teacher Registration Check-In
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-300">
                          Delivered to School
                        </span>
                      </div>
                      <p className="text-xs text-textSub dark:text-slate-300 mt-1 leading-relaxed">
                        Notes delivered to Room 4. You will see an instant confirmation receipt here the second Ms Johnson opens her morning briefing.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowMorningEdit(!showMorningEdit)}
                    className="self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-cardSubtle hover:bg-borderMain/30 text-textDim hover:text-textMain border border-borderMain transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{showMorningEdit ? 'Hide Form' : 'Update Note'}</span>
                  </button>
                </div>

                {showMorningEdit && (
                  <div className="mt-4 pt-4 border-t border-borderMain animate-in fade-in duration-150">
                    {renderMorningForm()}
                  </div>
                )}
              </div>
            ) : (
              /* Handover Due: Show clear 20-second form */
              <div className="card p-5 bg-gradient-to-r from-amber-50/60 via-cardBg to-teal-50/20 dark:from-amber-950/20 dark:via-cardBg dark:to-teal-950/15 border-l-4 border-l-amber-500 shadow-2xs">
                <div className="flex items-start gap-3 mb-3 pb-3 border-b border-borderMain">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 flex-shrink-0">
                    <Sun className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-navy dark:text-white">
                      Today&apos;s Morning Check-In (Due for Registration)
                    </h3>
                    <p className="text-xs text-textDim dark:text-slate-400 mt-0.5">
                      Takes under 20 seconds. Helps Ms Johnson and TA Melissa prepare before {childName} walks in.
                    </p>
                    {effectiveHandover && formattedHandoverDay && (
                      <p className="text-[11px] text-textDim dark:text-slate-400 mt-1">
                        Last note ({formattedHandoverDay}): {effectiveHandover.morning_mood} · Sleep: {effectiveHandover.sleep_quality}
                      </p>
                    )}
                  </div>
                </div>
                {renderMorningForm()}
              </div>
            )}
          </div>

          {/* 3:15 PM Home-Time Pick-Up Bridge */}
          <div id="home-time-bridge">
            {bridgeLoading ? (
              <div className="card p-12 text-center text-textDim space-y-2">
                <div className="w-8 h-8 border-3 border-teal border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Synthesizing adult observations from Room 4...</p>
              </div>
            ) : bridge ? (
              <DecompressionBridgeCard
                bridge={bridge}
                childName={childName}
                onAskNoya={() => onAskNoya?.(`Explain today's recorded support evidence for ${childName}. Only use cited home handover, classroom observation, incident, and approved support-profile records. Do not invent clinical or dietary advice.`)}
              />
            ) : (
              <div className="card p-8 text-center text-gray-500">
                <p className="text-xs">Home-time tips will appear as classroom notes arrive.</p>
              </div>
            )}
          </div>

          {/* Shared Classroom Observations from Today */}
          <div className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSharedMoments((current) => !current)}
              className="w-full p-5 flex items-center justify-between gap-3 text-left hover:bg-cardSubtle/60 transition-colors cursor-pointer"
              aria-expanded={showSharedMoments}
            >
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-coral-dark" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy dark:text-white">
                    Shared Moments from {child.room_name || 'Room 4'}
                  </h3>
                  <p className="text-[10px] text-textDim mt-1">{sharedEvents.length} shared records · today&apos;s activity and earlier context</p>
                </div>
              </div>
              <span className="flex items-center gap-2 text-[10px] font-semibold text-teal dark:text-mint whitespace-nowrap">
                {showSharedMoments ? 'Hide records' : 'Show records'}
                <span className={`text-base leading-none transition-transform ${showSharedMoments ? 'rotate-180' : ''}`}>⌄</span>
              </span>
            </button>

            {showSharedMoments && <div className="px-5 pb-5 space-y-3 border-t border-borderMain pt-4">
              {timeline.filter((e) => e.visibility === 'Shared').length === 0 ? (
                <p className="text-xs text-textDim italic py-4 text-center">
                  No shared notes logged yet today. School is in session.
                </p>
              ) : (
                timeline
                  .filter((e) => e.visibility === 'Shared')
                  .map((evt) => (
                    <div key={evt.id} className="p-3.5 rounded-xl bg-cardSubtle border border-borderMain space-y-1">
                      <div className="flex items-start justify-between gap-3 text-xs">
                        <span className="font-bold text-navy dark:text-white">{evt.title}</span>
                        <span className="text-textDim dark:text-slate-400 text-[10px] text-right whitespace-nowrap">
                          <span className={`block font-semibold ${new Date(evt.event_time).toDateString() === todayKey ? 'text-emerald-700 dark:text-emerald-300' : 'text-textDim'}`}>
                            {new Date(evt.event_time).toDateString() === todayKey ? 'Today' : formatEventDate(evt.event_time)}
                          </span>
                          {new Date(evt.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-textSub dark:text-slate-300 leading-relaxed">{evt.summary}</p>
                      {evt.observation?.strengths_observed && (
                        <div className="text-[11px] text-teal dark:text-mint font-medium pt-0.5">
                          🌟 Strengths noticed: {evt.observation.strengths_observed}
                        </div>
                      )}
                      <div className="text-[10px] text-textDim dark:text-slate-400 pt-1 flex items-center justify-between">
                        <span>Logged by {evt.reporter_name || evt.reporter_type}</span>
                        {evt.status === 'Acknowledged' && (
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">✓ Acknowledged</span>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: HEALTH & DOCTOR REPORTS (MEDS & CAMHS DOSSIER)   */}
      {/* ======================================================== */}
      {activeTab === 'health' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {corrLoading ? (
            <div className="card p-12 text-center text-textDim space-y-2">
              <div className="w-8 h-8 border-3 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Analyzing 30-day medication and routine correlations...</p>
            </div>
          ) : correlation ? (
            <div className="space-y-6">
              {/* Hero Medication Card */}
              <div className="p-6 rounded-2xl shadow-sm border border-borderMain bg-gradient-to-br from-indigo-50/60 via-cardBg to-teal-50/40 dark:from-[#142234] dark:via-[#1B2F44] dark:to-[#142234] text-textMain dark:text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-borderMain dark:border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-400/20 px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-transparent">
                        Daily Routine & Medication
                      </span>
                      <span className="text-xs text-textDim dark:text-white/60">30 School Days Analyzed</span>
                    </div>
                    <h2 className="text-xl font-serif font-bold text-navy dark:text-white mt-1.5">
                      {correlation.medication_name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleOpenCamhsModal}
                      disabled={loadingDossier}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-xs font-bold text-white rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow disabled:opacity-60"
                      title="Compile comprehensive evidence report for doctor or clinical review"
                    >
                      {loadingDossier ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-blue-200" />
                      )}
                      <span>{loadingDossier ? 'Preparing Report...' : 'Doctor / Clinic Report'}</span>
                    </button>

                    <button
                      onClick={handleCopyPediatricianSummary}
                      className="px-3.5 py-2 bg-cardBg dark:bg-white/10 hover:bg-cardSubtle dark:hover:bg-white/20 active:scale-95 text-xs text-textMain dark:text-white rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-borderMain dark:border-white/10 shadow-2xs"
                    >
                      {copiedSummary ? <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-600 dark:text-amber-300" />}
                      <span>{copiedSummary ? 'Copied' : 'Share with Doctor'}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-cardBg dark:bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-borderMain dark:border-white/10 shadow-2xs">
                    <div className="text-textDim dark:text-white/60 text-[10px] uppercase font-semibold">Morning Window</div>
                    <div className="text-sm font-bold text-teal dark:text-teal-300 mt-0.5">{correlation.morning_window}</div>
                    <div className="text-[10px] text-textDim dark:text-white/50 mt-0.5">Taken with breakfast</div>
                  </div>

                  <div className="bg-cardBg dark:bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-borderMain dark:border-white/10 shadow-2xs">
                    <div className="text-textDim dark:text-white/60 text-[10px] uppercase font-semibold">Mid-Morning Energy Dip</div>
                    <div className="text-sm font-bold text-amber-dark dark:text-amber-300 mt-0.5">{correlation.dip_window}</div>
                    <div className="text-[10px] text-textDim dark:text-white/50 mt-0.5">10:00am snack helps keep energy steady</div>
                  </div>

                  <div className="bg-cardBg dark:bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-borderMain dark:border-white/10 shadow-2xs">
                    <div className="text-textDim dark:text-white/60 text-[10px] uppercase font-semibold">Home & School In Sync</div>
                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">100% Matched</div>
                    <div className="text-[10px] text-textDim dark:text-white/50 mt-0.5">Home Handover + School Notes</div>
                  </div>
                </div>
              </div>

              {/* Correlation Insights Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-navy dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-dark dark:text-amber-400" />
                    <span>What Helps & What Drains Energy</span>
                  </h3>
                  <span className="text-[10px] text-textDim dark:text-slate-400">Cross-referenced from classroom and morning check-in notes</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {correlation.correlation_insights.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        item.status === 'positive'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40'
                          : item.status === 'warning'
                          ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40'
                          : 'bg-cardSubtle border-borderMain'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          item.status === 'positive'
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-300'
                        }`}>
                          {item.confidence}
                        </span>
                        <span className="text-xs font-bold text-navy dark:text-white">{item.incident_rate}</span>
                      </div>
                      <h4 className="text-xs font-bold text-navy dark:text-white">{item.factor}</h4>
                      <p className="text-xs text-textSub dark:text-slate-300 mt-1 leading-relaxed">{item.effect}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ready-to-Share Pediatrician Summary Box */}
              <div className="card p-5 bg-cardSubtle border border-borderMain space-y-3">
                <div className="flex items-center justify-between border-b border-borderMain pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal dark:text-teal-300" />
                    <h3 className="text-xs font-bold text-navy dark:text-white uppercase tracking-wider">
                      Doctor & Clinic Summary (Ready to Share)
                    </h3>
                  </div>
                  <button
                    onClick={handleCopyPediatricianSummary}
                    className="text-xs font-bold text-teal dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSummary ? 'Copied!' : 'Copy to Clipboard'}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-textMain dark:text-slate-200 bg-cardBg p-4 rounded-xl border border-borderMain whitespace-pre-wrap leading-relaxed">
                  {correlation.pediatrician_summary}
                </pre>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-borderMain">
                  <span className="text-[11px] text-textDim dark:text-slate-400">
                    Need the complete formal report with official school letterhead, medication graph, and signature blocks?
                  </span>
                  <button
                    onClick={handleOpenCamhsModal}
                    disabled={loadingDossier}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open Full Printable Clinical Dossier (A4)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-textDim text-center py-8">No correlation data available.</p>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: WINS & STRENGTHS SAFE SPACE                      */}
      {/* ======================================================== */}
      {activeTab === 'wins' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="card p-6 bg-gradient-to-r from-amber-50 via-cardBg to-mint/20 dark:from-amber-950/20 dark:via-cardBg dark:to-teal-950/20 border-l-4 border-l-gold">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-gold flex-shrink-0 mt-0.5">
                <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-navy dark:text-white">
                  Focusing on Strengths: Celebrating {childName}'s Brilliance
                </h3>
                <p className="text-xs text-textSub dark:text-slate-300 mt-1 leading-relaxed">
                  School updates can often feel like an endless stream of incident reports and challenges. This space is dedicated purely to {childName}'s genuine breakthroughs, strengths, and moments of joy observed today.
                </p>
              </div>
            </div>
          </div>

          {winsLoading ? (
            <div className="card p-12 text-center text-textDim space-y-2">
              <div className="w-8 h-8 border-3 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Gathering teacher praise and milestone celebrations...</p>
            </div>
          ) : wins.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wins.map((win) => (
                <div
                  key={win.id}
                  className="card p-5 border border-borderMain shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-900 dark:text-amber-200 px-2.5 py-1 rounded-full bg-amber-100/70 dark:bg-amber-900/50 text-[11px]">
                        {win.celebration_badge}
                      </span>
                      <span className="text-[10px] text-textDim dark:text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {win.date}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-navy dark:text-white">{win.title}</h4>
                    <p className="text-xs text-textSub dark:text-slate-300 leading-relaxed">{win.description}</p>

                    {/* Teacher quote */}
                    <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 text-xs italic text-teal-900 dark:text-teal-200 leading-relaxed">
                      "{win.teacher_quote}"
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="pt-2 border-t border-borderMain flex flex-wrap gap-1.5">
                    {win.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-cardSubtle border border-borderMain text-textDim dark:text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-textDim text-center py-8">No wins recorded yet.</p>
          )}
        </div>
      )}

      {/* 20-Second Evening Check-In Modal */}
      <EveningCheckInModal
        childId={child.id}
        childName={childName}
        isOpen={eveningModalOpen}
        onClose={() => setEveningModalOpen(false)}
        onSubmit={handleEveningSubmit}
      />

      {/* Formal CAMHS & Pediatrician Clinical Dossier Modal */}
      {camhsModalOpen && (
        <CamhsEvidenceDossierModal
          isOpen={camhsModalOpen}
          onClose={() => setCamhsModalOpen(false)}
          dossier={camhsDossier}
        />
      )}
    </div>
  );
};
