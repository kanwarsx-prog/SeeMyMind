import React, { useState, useEffect } from 'react';
import { ClassroomMatrixData, ClassroomProvisionSummary } from '../types';
import { api } from '../api';
import { Sparkles, AlertTriangle, CheckCircle2, Printer, X, BookOpen, HeartHandshake } from 'lucide-react';
import { ClassroomProvisionMapModal } from './ClassroomProvisionMapModal';

interface ClassSendMatrixProps {
  onSelectPupil?: (pupilId: string) => void;
}

export const ClassSendMatrix: React.FC<ClassSendMatrixProps> = ({ onSelectPupil }) => {
  const [matrixData, setMatrixData] = useState<ClassroomMatrixData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSubject, setSelectedSubject] = useState<'all' | 'maths' | 'english' | 'science' | 'assembly'>('all');
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

  const subjects = [
    { key: 'all', label: 'All-Day General' },
    { key: 'maths', label: '📐 Maths (Slopes & Numbers)' },
    { key: 'english', label: '📖 English (Inference & Reading)' },
    { key: 'science', label: '🔬 Science (Practicals & Labs)' },
    { key: 'assembly', label: '⚡ Assembly & PE (High Acoustic)' },
  ];

  if (loading) {
    return (
      <div className="card p-12 text-center text-gray-500 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin mx-auto" />
        <div className="text-xs font-semibold">Loading Room 4 SEND Matrix...</div>
      </div>
    );
  }

  const cohort = matrixData?.cohort || [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cardBg p-3.5 sm:p-4 rounded-2xl border border-borderMain shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-navy dark:text-white flex items-center gap-2">
              <span>{matrixData?.room_name || 'Room 4'} SEND Classroom Matrix</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal/10 text-teal dark:text-teal-300 font-semibold border border-teal/20">
                {cohort.length} Pupils
              </span>
            </h2>
          </div>
          <p className="text-xs text-textDim dark:text-slate-400 mt-0.5">
            Differentiated adaptations, sensory triggers, and arrival intelligence for all {cohort.length} pupils.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            onClick={handleOpenProvisionMap}
            disabled={loadingProvision}
            className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer flex-shrink-0 disabled:opacity-60"
            title="SEND Code of Practice CoP 6.44-6.56 Termly Graduated Response Review"
          >
            {loadingProvision ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <BookOpen className="w-4 h-4 text-white" />
            )}
            <span>Termly Provision Map & APDR</span>
          </button>

          <button
            onClick={() => setShowSupplyModal(true)}
            className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl bg-gradient-to-r from-navy to-slate-800 hover:from-slate-800 hover:to-navy text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer flex-shrink-0"
          >
            <Printer className="w-4 h-4 text-mint" />
            <span>60s Supply Teacher Briefing</span>
          </button>
        </div>
      </div>

      {/* Cohort Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="stat-card border-teal">
          <div className="font-serif text-2xl font-bold text-teal dark:text-teal-300">
            {matrixData?.total_send_count ?? cohort.length}
          </div>
          <div className="text-[11px] text-textDim dark:text-slate-400 mt-0.5">
            SEND Learners in {matrixData?.room_name || 'Classroom'}
          </div>
        </div>
        <div className="stat-card border-purple-dark dark:border-purple-500">
          <div className="font-serif text-2xl font-bold text-purple-dark dark:text-purple-300">
            {matrixData?.ehcp_count ?? cohort.filter((p) => p.has_ehcp).length}
          </div>
          <div className="text-[11px] text-textDim dark:text-slate-400 mt-0.5">Statutory EHCPs Active</div>
        </div>
        <div className="stat-card border-amber-dark dark:border-amber-500">
          <div className="font-serif text-2xl font-bold text-amber-dark dark:text-amber-300">
            {cohort.filter((p) => p.readiness_level === 'amber').length}
          </div>
          <div className="text-[11px] text-textDim dark:text-slate-400 mt-0.5">
            Arrival Caution Alerts ({cohort.filter((p) => p.readiness_level === 'amber').map((p) => p.preferred_name || p.name.split(' ')[0]).join(', ') || 'None 🟢'})
          </div>
        </div>
        <div className="stat-card border-emerald-600 dark:border-emerald-500">
          <div className="font-serif text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {matrixData?.assigned_ta ? '1-to-1 TA' : 'Class TA'}
          </div>
          <div className="text-[11px] text-textDim dark:text-slate-400 mt-0.5">
            {matrixData?.assigned_ta ? `${matrixData.assigned_ta} Assigned` : 'Shared TA Support'}
          </div>
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-navy dark:text-white px-2 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-teal dark:text-teal-300" />
          <span>Lesson Focus Filter:</span>
        </span>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {subjects.map((s) => (
            <button
              key={s.key}
              onClick={() => setSelectedSubject(s.key as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                selectedSubject === s.key
                  ? 'bg-teal text-white shadow-xs font-bold'
                  : 'bg-cardSubtle border border-borderMain text-textDim hover:text-textMain hover:bg-slate-100 dark:hover:bg-[#1E324A]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {cohort.length === 0 ? (
        <div className="card p-12 text-center text-textDim dark:text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal/10 text-teal flex items-center justify-center mx-auto text-2xl font-bold">
            🏫
          </div>
          <h4 className="font-bold text-base text-navy dark:text-white">No Pupils in Classroom Register</h4>
          <p className="text-xs max-w-md mx-auto">
            There are currently no active SEND learners assigned to {matrixData?.room_name || "this classroom"}.
          </p>
        </div>
      ) : (
        /* Matrix Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cohort.map((pupil) => {
            const subjectAccommodation =
              selectedSubject !== 'all'
                ? pupil.subject_accommodations[selectedSubject] || pupil.subject_accommodations.maths
                : null;

            return (
              <div
                key={pupil.id}
                className={`card p-5 border-l-4 transition-all space-y-4 ${
                  pupil.readiness_level === 'amber'
                    ? 'border-l-amber-500 bg-amber-50/15 dark:bg-amber-950/20'
                    : 'border-l-teal'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-borderMain">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-teal/10 dark:bg-teal-950/60 flex items-center justify-center font-bold text-teal dark:text-teal-300 text-base border border-teal/20">
                      {pupil.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-navy dark:text-white">{pupil.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          pupil.has_ehcp
                            ? 'bg-purple-light dark:bg-purple-950/60 text-purple-dark dark:text-purple-300 border-purple-200 dark:border-purple-800/40'
                            : 'bg-teal/10 dark:bg-teal-950/60 text-teal dark:text-teal-300 border-teal/20 dark:border-teal-800/40'
                        }`}>
                          {pupil.support_tier}
                        </span>
                      </div>
                      <div className="text-[11px] text-textDim dark:text-slate-400 mt-0.5">
                        {pupil.primary_need} · {pupil.year_group}
                      </div>
                    </div>
                  </div>

                  {onSelectPupil && (
                    <button
                      onClick={() => onSelectPupil(pupil.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal/10 hover:bg-teal text-teal hover:text-white dark:bg-teal-950/60 dark:text-teal-300 dark:hover:bg-teal border border-teal/20 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                      title={`Open 1:1 Focus for ${pupil.name}`}
                    >
                      <span>1:1 Focus</span>
                      <span>→</span>
                    </button>
                  )}
                </div>

              {/* Today's Readiness Banner */}
              <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                pupil.readiness_level === 'amber'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
              }`}>
                {pupil.readiness_level === 'amber' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                )}
                <div>
                  <span className="font-bold">Today&apos;s Readiness: </span>
                  <span>{pupil.readiness_status}</span>
                </div>
              </div>

              {/* Dynamic Subject Accommodation (when filtered) */}
              {subjectAccommodation && (
                <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal/20 dark:border-teal-800/40 text-xs space-y-1">
                  <div className="font-bold text-teal dark:text-teal-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-teal dark:text-teal-300" />
                    <span>{selectedSubject.toUpperCase()} Adaptation Active:</span>
                  </div>
                  <p className="text-textSub dark:text-slate-300 leading-relaxed">{subjectAccommodation}</p>
                </div>
              )}

              {/* Triggers & Calming Tools */}
              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400 mb-1">
                    Primary Triggers to Avoid
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pupil.primary_triggers.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-[11px] font-medium"
                      >
                        ⚡ {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400 mb-1">
                    Validated Calming Equipment & Strategies
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pupil.sensory_calming_tools.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-cardSubtle border border-borderMain text-textMain dark:text-white text-[11px] font-medium"
                      >
                        ✓ {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Buddy & TA Note */}
              <div className="pt-2.5 border-t border-borderMain flex items-center justify-between text-[11px] text-textDim dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <HeartHandshake className="w-3.5 h-3.5 text-teal dark:text-teal-300" />
                  <span>Peer Buddy: <strong className="text-navy dark:text-white">{pupil.buddy_pairing || 'Jake'}</strong></span>
                </span>
                <span className="text-[10px] text-textDim dark:text-slate-400">
                  {pupil.has_ehcp ? 'TA Support Active' : 'Universal Support'}
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
