import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  BookOpen,
  Target,
  Layers,
  ShieldCheck,
  Award,
  Download,
} from 'lucide-react';
import { ClassroomProvisionSummary, GraduatedResponseItem } from '../types';

interface ClassroomProvisionMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ClassroomProvisionSummary | null;
}

export const ClassroomProvisionMapModal: React.FC<ClassroomProvisionMapModalProps> = ({
  isOpen,
  onClose,
  summary,
}) => {
  const [activeView, setActiveView] = useState<'matrix' | 'apdr'>('matrix');
  const [selectedPupilIndex, setSelectedPupilIndex] = useState<number>(0);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !summary) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      'Pupil Name',
      'Support Tier',
      'Primary Need',
      'Identified Barrier (Assess)',
      'Classroom Differentiations (Do)',
      'Weekly TA Hours',
      'Assigned TA',
      'Empirical Review & Next Steps',
      'Status',
    ];
    const rows = summary.graduated_responses.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.support_tier.replace(/"/g, '""')}"`,
      `"${p.primary_need.replace(/"/g, '""')}"`,
      `"${p.assess_notes.replace(/"/g, '""')}"`,
      `"${p.do_provisions.join('; ').replace(/"/g, '""')}"`,
      `"${p.weekly_ta_hours}h/wk"`,
      `"${p.assigned_ta.replace(/"/g, '""')}"`,
      `"${(p.review_efficacy + ' | Next: ' + p.recommended_next_steps).replace(/"/g, '""')}"`,
      `"${p.review_outcome.replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Classroom_Provision_Map_${summary.room_name.replace(/\s+/g, '_')}_${summary.review_period.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedPupil: GraduatedResponseItem =
    summary.graduated_responses[selectedPupilIndex] || summary.graduated_responses[0];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-navy/80 backdrop-blur-sm print:p-0 print:bg-white print:static print:inset-auto animate-in fade-in duration-200"
    >
      {/* Container Card */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none print:m-0 print:max-w-none print:max-h-none print:bg-white print:text-black">
        
        {/* Pinned Action Toolbar (Screen Only) */}
        <div className="flex-shrink-0 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 sm:px-6 py-3.5 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
            <h2 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>Teacher Provision Map & Graduated Response Review</span>
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900 font-semibold">
              CoP 6.44–6.56
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Switcher */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveView('matrix')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'matrix'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Whole-Class Map
              </button>
              <button
                onClick={() => setActiveView('apdr')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'apdr'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Pupil APDR Cycle
              </button>
            </div>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 border border-slate-200 dark:border-slate-700"
              title="Export provision map table to CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95"
              title="Print or export as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center active:scale-95 border border-slate-200 dark:border-slate-700"
              title="Close window (Esc)"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Multi-Page Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 print:p-0 print:space-y-6 print:overflow-visible">
          
          {/* Institutional Crested Header Block */}
          <div className="border-b-2 border-teal-600 pb-6 print:pb-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 bg-teal-700 text-white text-[11px] font-black rounded tracking-widest uppercase">
                    {summary.school_name || "Inclusive Academy"}
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    SEND Code of Practice Chapter 6
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 dark:text-white print:text-black">
                  Classroom Provision Map & Graduated Response Review
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-300 print:text-slate-700">
                  Termly Assess-Plan-Do-Review (APDR) evaluation evaluating curriculum differentiation, individual target mastery, and dedicated TA deployment hours.
                </p>
              </div>

              <div className="sm:text-right space-y-0.5 text-xs text-slate-600 dark:text-slate-400 print:text-black font-mono">
                <div className="font-bold text-slate-800 dark:text-slate-200 print:text-black">{summary.room_name} · {summary.year_group}</div>
                <div>Class Teacher: {summary.class_teacher_name}</div>
                <div className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">{summary.review_period}</div>
              </div>
            </div>

            {/* Cohort Provision Summary Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 print:bg-white print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total SEND Learners</span>
                <div className="font-serif text-2xl font-bold text-teal-700 dark:text-teal-300 mt-0.5">{summary.total_send_pupils}</div>
                <div className="text-[10px] text-slate-500">{summary.room_name} Cohort</div>
              </div>

              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900 print:bg-white print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300">Statutory EHCPs</span>
                <div className="font-serif text-2xl font-bold text-purple-900 dark:text-purple-200 mt-0.5">{summary.ehcp_count}</div>
                <div className="text-[10px] text-purple-600 dark:text-purple-300">High Needs Funded</div>
              </div>

              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 print:bg-white print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300">SEN Support (K)</span>
                <div className="font-serif text-2xl font-bold text-blue-900 dark:text-blue-200 mt-0.5">{summary.sen_support_count}</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-300">Targeted Interventions</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 print:bg-white print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-400">Weekly TA Allocation</span>
                <div className="font-serif text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5">{summary.total_weekly_ta_hours}h</div>
                <div className="text-[10px] text-slate-500">Melissa Grant Assigned</div>
              </div>

              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900 print:bg-white print:border-slate-300">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Strategy Win Rate</span>
                <div className="font-serif text-2xl font-bold text-emerald-800 dark:text-emerald-200 mt-0.5">{summary.overall_class_win_rate}%</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-300">Class-Wide Resolution</div>
              </div>
            </div>
          </div>

          {/* VIEW 1: WHOLE-CLASSROOM PROVISION MAP TABLE */}
          {(activeView === 'matrix' || typeof window === 'undefined') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white print:text-black">
                    Whole-Classroom SEND Provision Matrix ({summary.room_name})
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  Assess · Plan · Do · Review Cycle
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 print:border-slate-300">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] print:bg-slate-100">
                    <tr>
                      <th className="py-3 px-3.5">Pupil & Support Tier</th>
                      <th className="py-3 px-3.5">Identified Barrier (Assess)</th>
                      <th className="py-3 px-3.5">Classroom Differentiations (Do)</th>
                      <th className="py-3 px-2 text-center">TA Support</th>
                      <th className="py-3 px-3.5">Empirical Review & Next Steps</th>
                      <th className="py-3 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-slate-300">
                    {summary.graduated_responses.map((pupil, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white print:text-black align-top">
                          <div className="text-sm">{pupil.name}</div>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                              pupil.support_tier.includes('EHCP')
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            {pupil.support_tier}
                          </span>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-1">
                            {pupil.primary_need}
                          </div>
                        </td>

                        <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 print:text-black align-top leading-relaxed text-[11px]">
                          {pupil.assess_notes}
                        </td>

                        <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 print:text-black align-top leading-relaxed text-[11px]">
                          <ul className="space-y-1">
                            {pupil.do_provisions.map((prov, pIdx) => (
                              <li key={pIdx} className="flex items-start gap-1.5">
                                <span className="text-teal-600 font-bold shrink-0">•</span>
                                <span>{prov}</span>
                              </li>
                            ))}
                          </ul>
                        </td>

                        <td className="py-3 px-2 text-center align-top whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black block">
                            {pupil.weekly_ta_hours}h / wk
                          </span>
                          <span className="text-[10px] text-slate-500 block">{pupil.assigned_ta.split(' ')[0]}</span>
                        </td>

                        <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 print:text-black align-top leading-relaxed text-[11px]">
                          <div>{pupil.review_efficacy}</div>
                          <div className="mt-1 font-semibold text-teal-700 dark:text-teal-300 text-[10px]">
                            Next: {pupil.recommended_next_steps}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center align-top whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              pupil.review_outcome === 'Target Met'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : pupil.review_outcome === 'Significant Progress'
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {pupil.review_outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: SINGLE PUPIL APDR CYCLE DEEP DIVE */}
          {(activeView === 'apdr' || typeof window === 'undefined') && (
            <div className="space-y-6">
              {/* Pupil Selector Pills (Screen Only) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Select Pupil:</span>
                {summary.graduated_responses.map((p, idx) => (
                  <button
                    key={p.pupil_id}
                    onClick={() => setSelectedPupilIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedPupilIndex === idx
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p.name} ({p.support_tier.split(' ')[0]})
                  </button>
                ))}
              </div>

              {/* Individual APDR Card */}
              <div className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 print:bg-white print:border-slate-300 print:p-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-serif font-black text-slate-900 dark:text-white print:text-black">
                        {selectedPupil.name} — Graduated Response Evaluation
                      </h3>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        {selectedPupil.support_tier}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Primary Need: {selectedPupil.primary_need} · Assigned Support: {selectedPupil.assigned_ta} ({selectedPupil.weekly_ta_hours}h weekly)
                    </p>
                  </div>

                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full self-start sm:self-auto ${
                      selectedPupil.review_outcome === 'Target Met'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : selectedPupil.review_outcome === 'Significant Progress'
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    Outcome: {selectedPupil.review_outcome}
                  </span>
                </div>

                {/* 4-Stage APDR Cycle Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Stage 1: ASSESS */}
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 shadow-2xs print:border-slate-300">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider text-[10px]">
                      <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center font-black">1</span>
                      <span>ASSESS (Barrier Identification)</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px] print:text-black">
                      {selectedPupil.assess_notes}
                    </p>
                  </div>

                  {/* Stage 2: PLAN */}
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 shadow-2xs print:border-slate-300">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider text-[10px]">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center font-black">2</span>
                      <span>PLAN (Target Outcomes)</span>
                    </div>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px] print:text-black">
                      {selectedPupil.plan_targets.map((tgt, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Target className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span>{tgt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Stage 3: DO */}
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 shadow-2xs print:border-slate-300">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                      <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center font-black">3</span>
                      <span>DO (Classroom Differentiation & Support)</span>
                    </div>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px] print:text-black">
                      {selectedPupil.do_provisions.map((prov, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold shrink-0">✓</span>
                          <span>{prov}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Stage 4: REVIEW */}
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 shadow-2xs print:border-slate-300">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center font-black">4</span>
                      <span>REVIEW (Empirical Efficacy & Impact)</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px] print:text-black">
                      {selectedPupil.review_efficacy}
                    </p>
                  </div>
                </div>

                {/* Breakthrough Milestones Banner */}
                {selectedPupil.breakthrough_milestones.length > 0 && (
                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>Termly Breakthrough Milestones Logged</span>
                    </div>
                    <ul className="space-y-1 text-emerald-900 dark:text-emerald-200 text-[11px]">
                      {selectedPupil.breakthrough_milestones.map((ms, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{ms}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Agreed Next Steps Box */}
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 print:border-slate-300">
                  <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400">
                    Agreed Next Steps for Next Term Cycle:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium text-[11px] print:text-black">
                    {selectedPupil.recommended_next_steps}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Statutory Sign-Off Block */}
          <div className="pt-6 border-t-2 border-slate-200 dark:border-slate-800 space-y-4 print:pt-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 print:bg-white print:border-slate-300 print:text-black flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>{summary.statutory_declaration}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <div className="p-3.5 border border-slate-300 dark:border-slate-700 rounded-xl h-24 flex flex-col justify-between print:border-slate-400">
                <span className="text-[9px] uppercase font-bold text-slate-400">
                  Classroom Teacher ({summary.class_teacher_name})
                </span>
                <div className="border-b border-dashed border-slate-400 my-auto" />
                <span className="text-[10px] text-slate-500">Date: ____________</span>
              </div>

              <div className="p-3.5 border border-slate-300 dark:border-slate-700 rounded-xl h-24 flex flex-col justify-between print:border-slate-400">
                <span className="text-[9px] uppercase font-bold text-slate-400">
                  Lead SENCO ({summary.school_name ? `Lead SENCO, ${summary.school_name}` : 'Lead SENCO, NASENCO'})
                </span>
                <div className="border-b border-dashed border-slate-400 my-auto" />
                <span className="text-[10px] text-slate-500">Date: ____________</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
