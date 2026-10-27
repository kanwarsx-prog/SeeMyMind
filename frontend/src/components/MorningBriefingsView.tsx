import React, { useState, useEffect } from 'react';
import { ClassroomMatrixData, DecompressionBridgeResponse } from '../types';
import { api } from '../api';
import { CheckCircle2, Plus, ArrowRight, X, Sun } from 'lucide-react';
import { DecompressionBridgeCard } from './DecompressionBridgeCard';

interface MorningBriefingsViewProps {
  onSelectPupil: (pupilId: string) => void;
  onOpenObservationModal?: () => void;
  roomName?: string;
}

export const MorningBriefingsView: React.FC<MorningBriefingsViewProps> = ({
  onSelectPupil,
  onOpenObservationModal,
  roomName,
}) => {
  const [matrixData, setMatrixData] = useState<ClassroomMatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledgedMap, setAcknowledgedMap] = useState<Record<string, { acknowledged: boolean; time: string }>>({});
  const [previewPupil, setPreviewPupil] = useState<{ id: string; name: string } | null>(null);
  const [previewBridge, setPreviewBridge] = useState<DecompressionBridgeResponse | null>(null);
  const [loadingBridge, setLoadingBridge] = useState(false);

  useEffect(() => {
    if (!roomName) {
      setLoading(false);
      return;
    }
    api.getClassMatrix(roomName)
      .then((data) => {
        setMatrixData(data);
        const initialAck: Record<string, { acknowledged: boolean; time: string }> = {};
        data.cohort.forEach((p) => {
          if (p.handover) {
            initialAck[p.id] = {
              acknowledged: p.handover.acknowledged_by_staff,
              time: p.handover.acknowledged_at || '08:48 AM',
            };
          }
        });
        setAcknowledgedMap(initialAck);
      })
      .catch((err) => console.error('Failed to load morning briefings cohort:', err))
      .finally(() => setLoading(false));
  }, [roomName]);

  const handleAcknowledge = async (pupilId: string, handoverId?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAcknowledgedMap((prev) => ({
      ...prev,
      [pupilId]: { acknowledged: true, time: nowTime },
    }));

    if (handoverId && !handoverId.startsWith('mock-')) {
      try {
        await api.acknowledgeTransition(handoverId);
      } catch (err) {
        console.error('Failed to acknowledge transition on backend:', err);
      }
    }
  };

  const handleOpen315Preview = (pupilId: string, pupilName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewPupil({ id: pupilId, name: pupilName });
    setLoadingBridge(true);
    api.getDecompressionBridge(pupilId)
      .then((data) => setPreviewBridge(data))
      .catch((err) => {
        console.error('Failed to load decompression bridge for preview:', err);
        setPreviewBridge(null);
      })
      .finally(() => setLoadingBridge(false));
  };

  if (loading) {
    return (
      <div className="card p-12 text-center text-gray-500 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin mx-auto" />
        <div className="text-xs font-semibold">Loading morning briefings...</div>
      </div>
    );
  }

  const cohort = matrixData?.cohort || [];
  const unacknowledgedCount = cohort.filter((p) => {
    const ack = acknowledgedMap[p.id]?.acknowledged ?? p.handover?.acknowledged_by_staff ?? true;
    return !ack;
  }).length;

  return (
    <div className="space-y-5">
      {/* Visual Header */}
      <div className="card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-navy dark:text-white flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <span>{matrixData?.room_name || roomName || 'Classroom'} Morning Arrival Briefings</span>
            </h2>
            <span className="text-xs text-textDim dark:text-slate-400 font-medium">
              {matrixData?.year_group?.startsWith('Year') ? matrixData.year_group : `Year ${matrixData?.year_group || '5'}`} · Lead: <strong>{matrixData?.lead_teacher || 'Ms Clara Johnson'}</strong> · TA: <strong>{matrixData?.assigned_ta || 'Melissa Grant'}</strong>
            </span>
          </div>
          <p className="text-xs text-textDim dark:text-slate-400 mt-1">
            Pre-flight arrival signals from home for all classroom pupils. Click any pupil card to open their complete individual profile.
          </p>

          {/* Quick Status Chips */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-xl bg-teal/10 dark:bg-teal-950/60 border border-teal/20 dark:border-teal-800/40 text-teal dark:text-teal-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <span>👥 {cohort.length} Cohort Notes</span>
            </span>

            {unacknowledgedCount > 0 ? (
              <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{unacknowledgedCount} Awaiting Acknowledgment</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>All Notes Acknowledged</span>
              </span>
            )}
          </div>
        </div>

        {onOpenObservationModal && (
          <button
            onClick={onOpenObservationModal}
            className="flex items-center gap-1.5 bg-teal hover:bg-teal-dark text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Classroom Note</span>
          </button>
        )}
      </div>

      {/* Grid of Pupil Morning Briefing Cards */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5">
        {cohort.map((pupil) => {
          const handover = pupil.handover;
          const isAckState = acknowledgedMap[pupil.id]?.acknowledged ?? handover?.acknowledged_by_staff ?? true;
          const ackTime = acknowledgedMap[pupil.id]?.time || handover?.acknowledged_at || '08:48 AM';
          const isCaution = pupil.readiness_level === 'amber' || pupil.readiness_level === 'red' || !isAckState;

          return (
            <div
              key={pupil.id}
              onClick={() => onSelectPupil(pupil.id)}
              className={`card p-5 sm:p-6 bg-gradient-to-r from-cardBg via-cardBg to-amber-50/15 dark:to-teal-950/20 border-l-4 ${
                isCaution ? 'border-l-amber-500' : 'border-l-teal'
              } shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group space-y-4 hover:border-teal/40`}
            >
              {/* Top Row: Pupil Identity + Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-borderMain">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal/10 dark:bg-teal-950/60 border border-teal/20 flex items-center justify-center text-2xl shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform">
                    {pupil.name.includes('Phoenix') ? '🧒' : pupil.name.includes('Archie') ? '👦' : pupil.name.includes('Riya') ? '👧' : '🧒'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-serif font-bold text-navy dark:text-white group-hover:text-teal transition-colors">
                        {pupil.name}
                      </h3>
                      {pupil.has_ehcp ? (
                        <span className="bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          EHCP Active
                        </span>
                      ) : (
                        <span className="bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          SEN Support (K)
                        </span>
                      )}
                      <span className="text-[11px] font-medium text-textDim dark:text-slate-400">
                        {pupil.year_group || 'Year group not set'} · {matrixData?.room_name || roomName || 'Classroom'}
                      </span>
                    </div>
                    <p className="text-xs text-textDim dark:text-slate-400 mt-0.5">
                      Primary Need: <strong className="text-textSub dark:text-slate-200">{pupil.primary_need}</strong> · {pupil.sensory_calming_tools.slice(0, 2).join(' · ')}
                    </p>
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
                  {!isAckState ? (
                    <button
                      onClick={(e) => handleAcknowledge(pupil.id, handover?.id, e)}
                      className="px-3.5 py-1.5 bg-teal hover:bg-teal-dark text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title="Acknowledge home note and send instant receipt to parent"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-mint" />
                      <span>✓ Acknowledge Handover</span>
                    </button>
                  ) : (
                    <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Acknowledged at {ackTime}</span>
                    </div>
                  )}

                  <button
                    onClick={(e) => handleOpen315Preview(pupil.id, pupil.name, e)}
                    className="flex items-center gap-1.5 bg-cardSubtle hover:bg-borderMain/30 text-textDim hover:text-textMain border border-borderMain px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                    title="Preview what parents see at 3:15 PM pick-up"
                  >
                    <span>🎒 3:15 Preview</span>
                  </button>

                  <div className="text-xs font-bold text-teal flex items-center gap-1 pl-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Pupil Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Middle Row: Today's Morning Readiness Signals (The 4 Visual Tiles) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-cardSubtle p-2.5 rounded-xl border border-borderMain">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400">Sleep Quality</div>
                  <div className="text-xs font-bold text-navy dark:text-white mt-0.5 truncate">
                    {handover?.sleep_quality || 'Solid 8.5 hrs uninterrupted'}
                  </div>
                </div>

                <div className="bg-cardSubtle p-2.5 rounded-xl border border-borderMain">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400">Morning Mood</div>
                  <div className="text-xs font-bold text-navy dark:text-white mt-0.5 truncate">
                    {handover?.morning_mood || 'Calm & Focused'}
                  </div>
                </div>

                <div className="bg-cardSubtle p-2.5 rounded-xl border border-borderMain">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400">Breakfast</div>
                  <div className={`text-xs font-bold mt-0.5 ${
                    handover?.breakfast_eaten === false ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {handover?.breakfast_eaten === false ? '⚠️ Skipped (Dip Risk)' : '🥣 Eaten'}
                  </div>
                </div>

                <div className="bg-cardSubtle p-2.5 rounded-xl border border-borderMain">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400">Medication</div>
                  <div className={`text-xs font-bold mt-0.5 ${
                    handover?.medication_given ? 'text-teal dark:text-teal-300' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {handover?.medication_given ? '💊 Taken at 8:30am' : 'None Required'}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Parent Handover Quote & Key Protocol */}
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-textSub dark:text-slate-300">
                  <span className="font-bold text-navy dark:text-white">
                    {pupil.name.includes('Phoenix') ? "Mum's Note: " : "Home Note: "}
                  </span>
                  <span className="italic">
                    &quot;{handover?.special_notes_for_day || (pupil.name.includes('Phoenix') ? 'lost his soft toy yesterday; please give him one' : 'Smooth morning routine at home; ready for school.')}&quot;
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
                  {handover?.alerts && handover.alerts.length > 0 ? (
                    handover.alerts.map((alert, idx) => (
                      <span
                        key={idx}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                          alert.includes('Assembly')
                            ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                            : 'bg-teal/10 text-teal-800 dark:text-teal-300 border border-teal/20'
                        }`}
                      >
                        {alert.includes('Noise') ? '🎧 ' : alert.includes('Assembly') ? '⚡ ' : '✨ '}
                        {alert}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-cardSubtle text-textDim border border-borderMain">
                      Buddy: <strong className="text-navy dark:text-white">{pupil.buddy_pairing || 'Assigned peer'}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3:15 Home-Time Modal Preview */}
      {previewPupil && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-cardBg rounded-2xl border border-borderMain shadow-2xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-borderMain pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎒</span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-textHead">
                    3:15 PM Home-Time Note Preview · {previewPupil.name}
                  </h3>
                  <p className="text-[11px] text-textDim">
                    Live synthesis of today&apos;s classroom logs ready for pick-up at the school gates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreviewPupil(null);
                  setPreviewBridge(null);
                }}
                className="p-1.5 rounded-xl hover:bg-cardSubtle text-textDim hover:text-textMain cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingBridge ? (
              <div className="p-8 text-center text-textDim text-xs space-y-2">
                <div className="w-6 h-6 rounded-full border-2 border-teal border-t-transparent animate-spin mx-auto" />
                <div>Synthesizing today&apos;s adult logs from {roomName || 'the classroom'}...</div>
              </div>
            ) : previewBridge ? (
              <DecompressionBridgeCard bridge={previewBridge} childName={previewPupil.name} />
            ) : (
              <div className="p-8 text-center text-textDim text-xs">
                No active decompression logs available for {previewPupil.name}.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
