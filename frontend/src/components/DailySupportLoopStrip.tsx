import React, { useState } from 'react';
import {
  Sun,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BatteryCharging,
  BatteryWarning,
  Battery,
  Check,
  Clock,
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

  const getEnergyIcon = (pct?: number) => {
    if (pct === undefined || pct === null) return <Clock className="w-3.5 h-3.5 text-teal" />;
    if (pct < 35) return <BatteryWarning className="w-3.5 h-3.5 text-rose-500" />;
    if (pct < 65) return <Battery className="w-3.5 h-3.5 text-amber-500" />;
    return <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />;
  };

  return (
    <div className="card p-4 sm:p-5 border-l-4 border-l-teal shadow-xs mb-5 bg-cardBg transition-all">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-borderMain">
        <div className="flex items-center gap-2">
          <span className="text-base">🔁</span>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-textHead tracking-tight flex items-center gap-2">
              <span>Today&apos;s Daily Loop</span>
              <span className="text-[10px] font-semibold text-teal px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800">
                Home · School · Home
              </span>
            </h2>
            <p className="text-[11px] text-textDim">
              The continuous 24-hour support circle keeping {pupilName}&apos;s home and classroom in sync.
            </p>
          </div>
        </div>

        {/* Loop health badge */}
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-textDim">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isToday ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span>{isToday ? 'Active Loop for Today' : "Ready for Today's Check-In"}</span>
        </div>
      </div>

      {/* 4 Connected Stations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {/* ========================================================= */}
        {/* STATION 1: MORNING CHECK-IN (Home -> School)              */}
        {/* ========================================================= */}
        <div
          onClick={onOpenMorningCheckIn}
          className={`p-3 rounded-xl border transition-all ${
            latestHandover && isToday
              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
              : 'bg-cardSubtle border-borderMain'
          } ${onOpenMorningCheckIn ? 'cursor-pointer hover:shadow-xs' : ''}`}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-textHead">
              <Sun className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>1. Morning Check-In</span>
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

          <p className="text-[11px] text-textDim leading-snug mb-2">
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

          <div className="flex items-center gap-1.5 text-[10px] text-textDim pt-1 border-t border-borderMain/50">
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
          className={`p-3 rounded-xl border transition-all ${
            isToday && isAcknowledged
              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
              : isToday && latestHandover
              ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 ring-1 ring-rose-300'
              : 'bg-cardSubtle border-borderMain'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-textHead">
              <CheckCircle2
                className={`w-3.5 h-3.5 flex-shrink-0 ${
                  isToday && isAcknowledged ? 'text-emerald-600 dark:text-emerald-400' : 'text-textDim'
                }`}
              />
              <span>2. School Heads-Up</span>
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

          <p className="text-[11px] text-textDim leading-snug mb-2">
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
            <div className="text-[10px] text-textDim pt-1 border-t border-borderMain/50 font-medium">
              {isToday && isAcknowledged ? '✓ Read receipt active' : 'Classroom arrival gate'}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* STATION 3: WHAT HELPED (In-Classroom Support)             */}
        {/* ========================================================= */}
        <div className="p-3 rounded-xl border bg-cardSubtle border-borderMain transition-all">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-textHead">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <span>3. What Helped</span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Active In-Class
            </span>
          </div>

          <p className="text-[11px] text-textDim leading-snug mb-2">
            Proven calming tool: <strong className="text-textHead">Quiet Headphones</strong> (92% win rate). Visual step ladder active in Maths.
          </p>

          <div className="text-[10px] text-textDim pt-1 border-t border-borderMain/50 font-medium">
            1:1 Support &bull; Quick strategy logging
          </div>
        </div>

        {/* ========================================================= */}
        {/* STATION 4: HOME-TIME NOTE (School -> Home at 3:15 PM)     */}
        {/* ========================================================= */}
        <div
          onClick={onOpenHomeTimeNote}
          className={`p-3 rounded-xl border transition-all ${
            bridge
              ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/60'
              : 'bg-cardSubtle border-borderMain'
          } ${onOpenHomeTimeNote ? 'cursor-pointer hover:shadow-xs group' : ''}`}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-textHead">
              {getEnergyIcon(bridge?.battery_percentage)}
              <span>4. Home-Time Note</span>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                bridge
                  ? 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200'
                  : 'bg-cardBg text-textDim border border-borderMain'
              }`}
            >
              {bridge ? `${bridge.battery_percentage}% Energy` : 'Ready 3:15 PM'}
            </span>
          </div>

          <p className="text-[11px] text-textDim leading-snug mb-2">
            {bridge ? (
              <span>
                Pick-up advice: <strong className="text-textHead">{bridge.decompression_recipe?.[0]?.title || '10-15m quiet buffer'}</strong> before asking about school.
              </span>
            ) : (
              'Auto-prepared from afternoon notes ready for pick-up at the gates.'
            )}
          </p>

          <div className="flex items-center justify-between text-[10px] text-teal pt-1 border-t border-borderMain/50 font-semibold">
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
