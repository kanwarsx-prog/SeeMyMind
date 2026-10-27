import React, { useState } from 'react';
import {
  Sun,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ClipboardCheck,
  CircleDashed,
  Check,
} from 'lucide-react';
import { Child, TransitionLogDetail, DecompressionBridgeResponse } from '../types';

interface DailySupportLoopStripProps {
  child?: Child | null;
  latestHandover?: TransitionLogDetail | null;
  bridge?: DecompressionBridgeResponse | null;
  currentUserRole?: string;
  onAcknowledgeHandover?: () => Promise<void> | void;
  onOpenHomeTimeNote?: () => void;
  onOpenMorningCheckIn?: () => void;
}

export const DailySupportLoopStrip: React.FC<DailySupportLoopStripProps> = ({
  child,
  latestHandover,
  bridge,
  currentUserRole = 'teacher',
  onAcknowledgeHandover,
  onOpenHomeTimeNote,
  onOpenMorningCheckIn,
}) => {
  const [acknowledging, setAcknowledging] = useState(false);
  const [localAcknowledged, setLocalAcknowledged] = useState(false);

  const pupilName = child?.preferred_name || child?.first_name || 'Pupil';
  const isAcknowledged = localAcknowledged || Boolean(latestHandover?.acknowledged_by_staff);

  // Real date and time intelligence (zero hardcoding)
  const handoverDateRaw = latestHandover?.event_time || latestHandover?.created_at;
  const handoverDate = handoverDateRaw ? new Date(handoverDateRaw) : null;
  const isToday = handoverDate
    ? handoverDate.toDateString() === new Date().toDateString()
    : false;
  const formattedTime = handoverDate
    ? handoverDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;
  const formattedDay = handoverDate
    ? handoverDate.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
    : null;

  const handleAcknowledge = async () => {
    if (!onAcknowledgeHandover || acknowledging || isAcknowledged) return;
    try {
      setAcknowledging(true);
      await onAcknowledgeHandover();
      setLocalAcknowledged(true);
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    } finally {
      setAcknowledging(false);
    }
  };

  const recordedStrategies = bridge?.decompression_recipe || [];
  const hasRecordedSupport = recordedStrategies.length > 0;

  return (
    <div className="card overflow-hidden border-l-4 border-l-teal shadow-sm mb-5 bg-cardBg transition-all">
      {/* Top Header Row */}
      <div className="px-4 pt-4 sm:px-5 sm:pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-borderMain">
        <div className="flex items-start gap-3">
          <span className="text-base">🔁</span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300 mb-0.5">24-hour support loop</div>
            <h2 className="text-base sm:text-lg font-bold text-textHead tracking-tight flex items-center gap-2">
              <span>Today&apos;s Daily Loop</span>
              <span className="text-[10px] font-semibold text-teal px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800">
                Home · School · Home
              </span>
            </h2>
            <p className="text-xs text-textDim mt-0.5">
              The continuous 24-hour support circle keeping {pupilName}&apos;s home and classroom in sync.
            </p>
          </div>
        </div>

        {/* Loop health badge */}
        <div className="self-start sm:self-center flex items-center gap-2 text-[11px] font-semibold text-textDim rounded-full bg-cardSubtle border border-borderMain px-3 py-1.5">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isToday ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span>{isToday ? 'Active Loop for Today' : "Ready for Today's Check-In"}</span>
        </div>
      </div>

      {/* 4 Connected Stations Grid */}
      <div className="px-4 py-4 sm:px-5 sm:py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {/* ========================================================= */}
        {/* STATION 1: MORNING CHECK-IN (Home -> School)              */}
        {/* ========================================================= */}
        <div
          onClick={onOpenMorningCheckIn}
          className={`group p-4 rounded-2xl border transition-all min-h-[166px] flex flex-col ${
            latestHandover && isToday
              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
              : 'bg-cardSubtle border-borderMain'
          } ${onOpenMorningCheckIn ? 'cursor-pointer hover:shadow-xs' : ''}`}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-textHead">
              <Sun className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span><span className="block text-[10px] uppercase tracking-wider text-textDim font-semibold">Home → school</span>Morning Check-In</span>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                latestHandover && isToday
                  ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                  : 'bg-cardBg text-textDim border border-borderMain'
              }`}
            >
              {latestHandover && isToday
                ? `✓ Sent ${formattedTime || ''}`
                : latestHandover
                ? '⏳ Due Today'
                : '⏳ Awaiting'}
            </span>
          </div>

          <p className="text-xs text-textDim leading-relaxed mb-3">
            {latestHandover && isToday ? (
              <span>
                Mood: <strong className="text-textHead capitalize">{latestHandover.morning_mood || 'Calm'}</strong> · Sleep: <strong className="text-textHead">{latestHandover.sleep_quality || 'Good'}</strong>
              </span>
            ) : latestHandover ? (
              <span>
                No note sent yet today. Last note ({formattedDay}): Mood was <strong className="text-textHead capitalize">{latestHandover.morning_mood || 'Calm'}</strong>.
              </span>
            ) : (
              'No home note yet today. Standing classroom baselines active.'
            )}
          </p>

          <div className="mt-auto flex items-center gap-1.5 text-[10px] text-textDim pt-3 border-t border-borderMain/50">
            <span className="font-semibold text-amber-700 dark:text-amber-400">Home &rarr; School</span>
            {latestHandover && isToday && latestHandover.special_notes_for_day ? (
              <span className="truncate italic">· &ldquo;{latestHandover.special_notes_for_day}&rdquo;</span>
            ) : (
              <span className="truncate italic">· Tap to submit today&apos;s morning note</span>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* STATION 2: SCHOOL HEADS-UP (Classroom Receipt)            */}
        {/* ========================================================= */}
        <div
          className={`group p-4 rounded-2xl border transition-all min-h-[166px] flex flex-col ${
            isToday && isAcknowledged
              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
              : isToday && latestHandover
              ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 ring-1 ring-rose-300'
              : 'bg-cardSubtle border-borderMain'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-textHead">
              <CheckCircle2
                className={`w-3.5 h-3.5 flex-shrink-0 ${
                  isToday && isAcknowledged ? 'text-emerald-600 dark:text-emerald-400' : 'text-textDim'
                }`}
              />
              <span><span className="block text-[10px] uppercase tracking-wider text-textDim font-semibold">School receives</span>Heads-Up</span>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                isToday && isAcknowledged
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                  : isToday && latestHandover
                  ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 animate-pulse'
                  : 'bg-cardBg text-textDim border border-borderMain'
              }`}
            >
              {isToday && isAcknowledged
                ? '✓ Seen by Staff'
                : isToday && latestHandover
                ? 'Needs Check'
                : 'Baseline Active'}
            </span>
          </div>

          <p className="text-xs text-textDim leading-relaxed mb-3">
            {isToday && isAcknowledged ? (
              <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                Staff acknowledged today&apos;s note. Parent confirmed receipt.
              </span>
            ) : isToday && latestHandover ? (
              <span className="text-rose-700 dark:text-rose-300 font-medium">
                Today&apos;s morning note ready for teacher review before class.
              </span>
            ) : (
              'Classroom team ready. Baseline profile active until check-in.'
            )}
          </p>

          {/* Interactive Teacher Action Button */}
          {isToday && !isAcknowledged && latestHandover && (currentUserRole === 'teacher' || currentUserRole === 'ta' || currentUserRole === 'senco') ? (
            <button
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="w-full mt-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              <Check className="w-3 h-3" />
              <span>{acknowledging ? 'Confirming...' : 'Acknowledge Note'}</span>
            </button>
          ) : (
            <div className="mt-auto text-[10px] text-textDim pt-3 border-t border-borderMain/50 font-medium">
              {isToday && isAcknowledged ? '✓ Read receipt active' : 'Classroom arrival gate'}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* STATION 3: WHAT HELPED (In-Classroom Support)             */}
        {/* ========================================================= */}
        <div className={`group p-4 rounded-2xl border transition-all min-h-[166px] flex flex-col ${hasRecordedSupport ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60' : 'bg-cardSubtle border-borderMain'}`}>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-textHead">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <span><span className="block text-[10px] uppercase tracking-wider text-textDim font-semibold">Classroom evidence</span>What Helped</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cardBg text-textDim border border-borderMain">
              {hasRecordedSupport ? `${recordedStrategies.length} recorded` : 'No record yet'}
            </span>
          </div>

          <p className="text-xs text-textDim leading-relaxed mb-3">
            {hasRecordedSupport ? (
              <>Recorded support: <strong className="text-textHead">{recordedStrategies[0].title}</strong>. Only strategies logged as effective today are shown.</>
            ) : (
              <>No effective strategy has been recorded for today yet. Classroom staff can add one from the evidence log.</>
            )}
          </p>

          <div className="mt-auto text-[10px] text-textDim pt-3 border-t border-borderMain/50 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            {hasRecordedSupport ? 'Grounded in today’s evidence' : 'Ready for classroom logging'}
          </div>
        </div>

        {/* ========================================================= */}
        {/* STATION 4: HOME-TIME NOTE (School -> Home at 3:15 PM)     */}
        {/* ========================================================= */}
        <div
          onClick={onOpenHomeTimeNote}
          className={`group p-4 rounded-2xl border transition-all min-h-[166px] flex flex-col ${
            bridge
              ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/60'
              : 'bg-cardSubtle border-borderMain'
          } ${onOpenHomeTimeNote ? 'cursor-pointer hover:shadow-xs group' : ''}`}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-textHead">
              {bridge ? <ClipboardCheck className="w-3.5 h-3.5 text-teal" /> : <CircleDashed className="w-3.5 h-3.5 text-teal" />}
              <span><span className="block text-[10px] uppercase tracking-wider text-textDim font-semibold">School → home</span>Home-Time Note</span>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                bridge
                  ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200'
                  : 'bg-cardBg text-textDim border border-borderMain'
              }`}
            >
              {bridge ? 'Evidence ready' : 'Not prepared'}
            </span>
          </div>

          <p className="text-xs text-textDim leading-relaxed mb-3">
            {bridge ? (
              <span>
                Recorded support for pick-up: <strong className="text-textHead">{bridge.decompression_recipe?.[0]?.title || 'Review today’s evidence'}</strong>.
              </span>
            ) : (
              'Auto-prepared from afternoon notes ready for pick-up at the gates.'
            )}
          </p>

          <div className="mt-auto flex items-center justify-between text-[10px] text-teal pt-3 border-t border-borderMain/50 font-semibold">
            <span>School &rarr; Home</span>
            {onOpenHomeTimeNote && (
              <span className="flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                <span>View Note</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
