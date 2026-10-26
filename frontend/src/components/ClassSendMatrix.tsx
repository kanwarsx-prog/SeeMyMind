import React, { useState, useEffect } from 'react';
import { ClassroomMatrixData, ClassroomProvisionSummary, ClassroomPupilSummary } from '../types';
import { api } from '../api';
import {
  AlertTriangle,
  CheckCircle2,
  Printer,
  X,
  BookOpen,
  HeartHandshake,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { ClassroomProvisionMapModal } from './ClassroomProvisionMapModal';

interface ClassSendMatrixProps {
  onSelectPupil?: (pupilId: string) => void;
}

export const ClassSendMatrix: React.FC<ClassSendMatrixProps> = ({ onSelectPupil }) => {
  const [matrixData, setMatrixData] = useState<ClassroomMatrixData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSupplyModal, setShowSupplyModal] = useState<boolean>(false);
  const [provisionSummary, setProvisionSummary] = useState<ClassroomProvisionSummary | null>(null);
  const [showProvisionModal, setShowProvisionModal] = useState<boolean>(false);
  const [loadingProvision, setLoadingProvision] = useState<boolean>(false);

  const handleOpenProvisionMap = async () => {
    try {
      setLoadingProvision(true);
      const data = await api.getClassroomProvisionMap('Room 4');
      setProvisionSummary(data);
      setShowProvisionModal(true);
    } catch (err) {
      console.error('Failed to load classroom provision map:', err);
      alert('Failed to load classroom provision map: ' + err);
    } finally {
      setLoadingProvision(false);
    }
  };

  useEffect(() => {
    api.getClassMatrix('room-4')
      .then((data) => {
        setMatrixData(data);
      })
      .catch((err) => {
        console.error('Failed to load classroom matrix:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="card p-12 text-center text-gray-500 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin mx-auto" />
        <div className="text-xs font-semibold">Initializing Room 4 Landing Cockpit...</div>
      </div>
    );
  }

  const cohort = matrixData?.cohort || [];
  const cautionPupils = cohort.filter((p) => p.readiness_level === 'amber' || p.readiness_level === 'red');
  const greenPupils = cohort.filter((p) => p.readiness_level === 'green');
  const ehcpCount = matrixData?.ehcp_count ?? cohort.filter((p) => p.has_ehcp).length;

  const getSensoryIcon = (tool: string) => {
    const lower = tool.toLowerCase();
    if (lower.includes('headphone') || lower.includes('noise')) return '🎧';
    if (lower.includes('timer') || lower.includes('countdown')) return '⏱️';
    if (lower.includes('putty') || lower.includes('fidget') || lower.includes('tactile')) return '🧩';
    if (lower.includes('break') || lower.includes('movement') || lower.includes('stool')) return '🏃';
    if (lower.includes('whiteboard') || lower.includes('traffic')) return '🚦';
    if (lower.includes('visual') || lower.includes('symbol') || lower.includes('card')) return '🃏';
    if (lower.includes('water')) return '💧';
    return '✨';
  };

  const getPupilBattery = (pupil: ClassroomPupilSummary) => {
    if (pupil.readiness_level === 'amber' || pupil.readiness_level === 'red') {
      return {
        pct: 55,
        color: 'bg-amber-500',
        textColor: 'text-amber-700 dark:text-amber-300',
        zone: 'Amber Zone · Gentle Start',
        ring: 'ring-2 ring-amber-400 dark:ring-amber-500 ring-offset-2 dark:ring-offset-slate-900',
        badge: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800/50',
      };
    }
    return {
      pct: 85,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      zone: 'Green Zone · Regulated',
      ring: 'ring-2 ring-emerald-400 dark:ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800/50',
    };
  };

  return (
    <div className="space-y-4">
      {/* Visual Cockpit Header Bar */}
      <div className="card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-navy dark:text-white flex items-center gap-2">
              <span>{matrixData?.room_name || 'Room 4'} Teacher Cockpit</span>
            </h2>
            <span className="text-xs text-textDim dark:text-slate-400 font-medium">
              Year {matrixData?.year_group || '5'} · Lead: <strong>{matrixData?.lead_teacher || 'Ms Johnson'}</strong> · TA: <strong>{matrixData?.assigned_ta || 'Melissa Grant'}</strong>
            </span>
          </div>

          {/* Visual Status Counters Ribbon */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{greenPupils.length} Regulated</span>
            </span>

            {cautionPupils.length > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{cautionPupils.length} Gentle Support</span>
              </span>
            )}

            <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{ehcpCount} Statutory EHCPs</span>
            </span>

            <span className="px-2.5 py-1 rounded-xl bg-teal/10 dark:bg-teal-950/60 border border-teal/20 dark:border-teal-800/40 text-teal dark:text-teal-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <span>👥 {cohort.length} Total Cohort</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <button
            onClick={handleOpenProvisionMap}
            disabled={loadingProvision}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            title="SEND Code of Practice CoP 6.44-6.56 Termly Graduated Response Review"
          >
            {loadingProvision ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <BookOpen className="w-3.5 h-3.5 text-white" />
            )}
            <span>Termly Provision Map</span>
          </button>

          <button
            onClick={() => setShowSupplyModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-navy to-slate-800 hover:from-slate-800 hover:to-navy text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Open printable 60-second emergency supply pack"
          >
            <Printer className="w-3.5 h-3.5 text-mint" />
            <span>60s Supply Briefing</span>
          </button>
        </div>
      </div>

      {/* Morning Arrival Status Ribbon */}
      {cautionPupils.length > 0 ? (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <span className="font-semibold">
              Morning Attention:{' '}
              {cautionPupils.map((p) => `${p.preferred_name || p.name} (${p.readiness_status.replace(/⚠️|🥣|🙂|⚡/g, '').trim()})`).join(' · ')}
            </span>
          </div>
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
            Low-demand transition recommended
          </span>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs flex items-center justify-between text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Morning Scan Complete:</strong> All {cohort.length} SEND learners arrived in Green Regulation Zone.
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold hidden sm:inline">
            Zero active alerts 🟢
          </span>
        </div>
      )}

      {/* Visual Cohort Grid (Interactive Cockpit Tiles) */}
      {cohort.length === 0 ? (
        <div className="card p-12 text-center text-textDim dark:text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal/10 text-teal flex items-center justify-center mx-auto text-2xl font-bold">
            🏫
          </div>
          <h4 className="font-bold text-base text-navy dark:text-white">No Pupils in Classroom Register</h4>
          <p className="text-xs max-w-md mx-auto">
            There are currently no active SEND learners assigned to {matrixData?.room_name || 'this classroom'}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {cohort.map((pupil) => {
            const battery = getPupilBattery(pupil);
            const isCaution = pupil.readiness_level === 'amber' || pupil.readiness_level === 'red';

            return (
              <div
                key={pupil.id}
                onClick={() => onSelectPupil?.(pupil.id)}
                className={`card p-4 transition-all duration-150 cursor-pointer hover:shadow-md hover:-translate-y-0.5 border-l-4 space-y-3 group ${
                  isCaution
                    ? 'border-l-amber-500 bg-amber-50/15 dark:bg-amber-950/20 hover:border-amber-400'
                    : 'border-l-teal hover:border-teal/80'
                }`}
                title={`Click to view 1:1 details for ${pupil.name}`}
              >
                {/* Pupil Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base transition-all bg-cardSubtle text-navy dark:text-white border border-borderMain ${battery.ring}`}>
                      {pupil.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-navy dark:text-white group-hover:text-teal dark:group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
                        <span>{pupil.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-teal transition-opacity" />
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="text-[10.5px] font-semibold text-textDim dark:text-slate-400">
                          {pupil.primary_need}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border ${
                            pupil.has_ehcp
                              ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40'
                              : 'bg-teal/10 dark:bg-teal-950/60 text-teal dark:text-teal-300 border-teal/20 dark:border-teal-800/40'
                          }`}
                        >
                          {pupil.has_ehcp ? 'EHCP' : pupil.support_tier}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Regulation Badge */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${battery.badge}`}>
                    {battery.zone.split('·')[0].trim()}
                  </span>
                </div>

                {/* Visual Regulation / Energy Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-textDim dark:text-slate-400 font-medium truncate max-w-[200px]">
                      {pupil.readiness_status.replace(/⚠️|🥣|🙂|⚡/g, '').trim()}
                    </span>
                    <span className={`font-bold text-[11px] ${battery.textColor}`}>
                      {battery.pct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${battery.color}`}
                      style={{ width: `${battery.pct}%` }}
                    />
                  </div>
                </div>

                {/* Visual Sensory & Regulation Kit Chips */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400">
                    Live Sensory Tools
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pupil.sensory_calming_tools.slice(0, 3).map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-cardSubtle border border-borderMain text-textMain dark:text-white text-[10.5px] font-medium flex items-center gap-1 shadow-2xs"
                      >
                        <span>{getSensoryIcon(tool)}</span>
                        <span>{tool}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer: Buddy & Statutory TA Status */}
                <div className="pt-2 border-t border-borderMain flex items-center justify-between text-[11px] text-textDim dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5 text-teal dark:text-teal-300" />
                    <span>Buddy: <strong className="text-navy dark:text-white">{pupil.buddy_pairing || 'Jake'}</strong></span>
                  </span>
                  <span className="text-[10px] font-medium">
                    {pupil.has_ehcp ? '1:1 TA Active' : 'Universal Scaffolding'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Supply Teacher 60-Second Briefing Modal */}
      {showSupplyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-cardBg rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-borderMain p-4 sm:p-6 space-y-4 sm:space-y-6 text-textMain">
            <div className="flex items-center justify-between border-b border-borderMain pb-3 sm:pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-light dark:bg-amber-950/60 text-amber-dark dark:text-amber-300 border border-amber/20 dark:border-amber-800/40">
                  Emergency Cover Protocol
                </span>
                <h3 className="text-base sm:text-lg font-serif font-bold text-navy dark:text-white mt-1">
                  {matrixData?.room_name || "Classroom"} SEND: 60-Second Cover Briefing Sheet
                </h3>
                <p className="text-[11px] sm:text-xs text-textDim dark:text-slate-400">
                  {matrixData ? `${matrixData.year_group} · Lead Teacher: ${matrixData.lead_teacher} · TA: ${matrixData.assigned_ta}` : "Statutory classroom SEND cover details"}
                </p>
              </div>
              <button
                onClick={() => setShowSupplyModal(false)}
                className="w-8 h-8 rounded-full bg-cardSubtle hover:bg-slate-100 dark:hover:bg-[#1E324A] border border-borderMain flex items-center justify-center text-textDim hover:text-textMain cursor-pointer flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Important note for supply / cover teachers:</strong>
                SEND pupils in Room 4 thrive on predictable routines. Please follow the individual de-escalation tips below before calling on-call behavior support.
              </div>
            </div>

            {/* Print Grid of 4 pupils */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cohort.map((pupil) => (
                <div key={pupil.id} className="p-4 rounded-2xl border border-borderMain bg-cardSubtle space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-borderMain pb-2">
                    <span className="font-bold text-navy dark:text-white text-sm">{pupil.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cardBg border border-borderMain text-textMain dark:text-white font-bold">
                      {pupil.support_tier}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                      ⚠️ Never do:
                    </span>
                    <span className="text-textSub dark:text-slate-300">
                      {pupil.primary_triggers.join(', ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                      ✓ Immediate de-escalation:
                    </span>
                    <span className="text-textSub dark:text-slate-300">
                      {pupil.sensory_calming_tools.slice(0, 2).join(' · ')}
                    </span>
                  </div>

                  <div className="text-[11px] text-textDim dark:text-slate-400 pt-1 border-t border-borderMain">
                    Trusted classmate: <strong className="text-navy dark:text-white">{pupil.buddy_pairing}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-borderMain">
              <button
                onClick={() => setShowSupplyModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-textDim hover:text-textMain hover:bg-slate-100 dark:hover:bg-[#1E324A] cursor-pointer text-center"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl bg-teal hover:bg-teal-dark text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Whole-Classroom Provision Map & APDR Review Modal */}
      {showProvisionModal && (
        <ClassroomProvisionMapModal
          isOpen={showProvisionModal}
          onClose={() => setShowProvisionModal(false)}
          summary={provisionSummary}
        />
      )}
    </div>
  );
};
