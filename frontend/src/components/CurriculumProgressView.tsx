import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Sparkles,
  Printer,
  Search,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { Child, PupilCurriculumProgressResponse } from '../types';
import { api } from '../api';

interface CurriculumProgressViewProps {
  child?: Child | null;
  onSelectUnitToScaffold?: (unitTitle: string, subject: string, objective: string) => void;
}

export const CurriculumProgressView: React.FC<CurriculumProgressViewProps> = ({
  child,
  onSelectUnitToScaffold,
}) => {
  const [progressData, setProgressData] = useState<PupilCurriculumProgressResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [updatingUnitId, setUpdatingUnitId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pupilName = child?.preferred_name || child?.first_name || 'Pupil';
  const yearGroup = child?.year_group || 'Year 5';

  const loadProgress = async () => {
    if (!child?.id) return;
    try {
      setLoading(true);
      const data = await api.getPupilCurriculumProgress(child.id, yearGroup);
      setProgressData(data);
    } catch (err) {
      console.error('Failed to load curriculum progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [child?.id, yearGroup]);

  const handleStatusChange = async (unitId: string, newStatus: string) => {
    if (!child?.id) return;
    setUpdatingUnitId(unitId);
    try {
      await api.updatePupilUnitProgress(child.id, unitId, newStatus);
      // Optimistically update local state
      setProgressData((prev) => {
        if (!prev) return prev;
        const updatedUnits = prev.units.map((u) => {
          if (u.unit_id === unitId) {
            return {
              ...u,
              status: newStatus as any,
              last_scaffolded_at: newStatus === 'mastered' ? new Date().toISOString().split('T')[0] : u.last_scaffolded_at,
            };
          }
          return u;
        });

        // Recalculate totals
        const completed = updatedUnits.filter((u) => u.status === 'mastered').length;
        const inProg = updatedUnits.filter((u) => u.status === 'in_progress').length;
        const total = updatedUnits.length;
        const overallPct = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

        // Recalculate subjects
        const subjects = Array.from(new Set(updatedUnits.map((u) => u.subject)));
        const updatedSubjects = subjects.map((s) => {
          const sUnits = updatedUnits.filter((u) => u.subject === s);
          const sComp = sUnits.filter((u) => u.status === 'mastered').length;
          const sProg = sUnits.filter((u) => u.status === 'in_progress').length;
          return {
            subject: s,
            total_units: sUnits.length,
            completed_units: sComp,
            in_progress_units: sProg,
            percentage: sUnits.length > 0 ? Math.round((sComp / sUnits.length) * 1000) / 10 : 0,
          };
        });

        return {
          ...prev,
          units: updatedUnits,
          total_completed_units: completed,
          total_in_progress_units: inProg,
          coverage_percentage: overallPct,
          subjects_breakdown: updatedSubjects,
        };
      });

      setToastMessage(`Updated unit status to ${newStatus.replace('_', ' ')}!`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update unit progress:', err);
      alert('Failed to update progress: ' + err);
    } finally {
      setUpdatingUnitId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="card p-10 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-3 border-teal border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-textDim dark:text-slate-400">
          Compiling National Curriculum progress & coverage metrics for {pupilName}...
        </p>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="card p-8 text-center text-textDim space-y-2">
        <p className="text-xs font-semibold">No curriculum progress data available.</p>
        <button
          type="button"
          onClick={loadProgress}
          className="px-3 py-1.5 rounded-xl bg-teal text-white text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  // Filter units
  const filteredUnits = progressData.units.filter((u) => {
    const matchesSubject = selectedSubjectFilter === 'All' || u.subject === selectedSubjectFilter;
    const matchesStatus =
      selectedStatusFilter === 'All' ||
      (selectedStatusFilter === 'Mastered' && u.status === 'mastered') ||
      (selectedStatusFilter === 'In Progress' && u.status === 'in_progress') ||
      (selectedStatusFilter === 'Not Started' && u.status === 'not_started');
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      u.title.toLowerCase().includes(query) ||
      u.strand.toLowerCase().includes(query) ||
      u.subject.toLowerCase().includes(query) ||
      u.default_objective.toLowerCase().includes(query);

    return matchesSubject && matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-5 print:space-y-4">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3 bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Statutory Progress Meter */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50/80 via-cardBg to-indigo-50/40 dark:from-teal-950/20 dark:via-cardBg dark:to-cardBg border border-teal-200/70 dark:border-teal-900/40 space-y-4 shadow-xs print:border-slate-800 print:bg-white print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-borderMain pb-3 print:border-black">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-teal/10 text-teal dark:text-teal-300 border border-teal/20 print:border-black print:text-black">
                Statutory National Curriculum Tracking
              </span>
              <span className="text-[10px] text-textDim dark:text-slate-400 font-semibold print:text-black">
                {progressData.year_group} Cohort
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-navy dark:text-white print:text-black mt-1">
              Curriculum Mastery & Coverage Report - {progressData.child_name}
            </h2>
            <p className="text-xs text-textDim dark:text-slate-400 print:text-slate-700">
              Primary Need: <strong className="text-textMain dark:text-slate-200 print:text-black">{progressData.primary_need}</strong> &bull; Adapted Access via NOYA
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden flex-shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cardSubtle hover:bg-slate-200 dark:hover:bg-slate-800 text-textMain dark:text-white border border-borderMain rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Print curriculum report for parent consultation or SENCO annual review"
            >
              <Printer className="w-3.5 h-3.5 text-teal" />
              <span>Print Report</span>
            </button>
            <button
              type="button"
              onClick={loadProgress}
              className="p-2 rounded-xl bg-cardSubtle hover:bg-slate-200 dark:hover:bg-slate-800 text-textDim hover:text-textMain border border-borderMain transition-all cursor-pointer"
              title="Refresh progress data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Overall KPI Progress Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-cardBg border border-borderMain flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase text-textDim dark:text-slate-400">Total Statutory Units</span>
            <div className="text-2xl font-black text-navy dark:text-white my-0.5 print:text-black">
              {progressData.total_statutory_units}
            </div>
            <span className="text-[10px] text-textDim">{progressData.year_group} Core Curriculum</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">✓ Mastered / Covered</span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 my-0.5 print:text-black">
              {progressData.total_completed_units}
            </div>
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 font-semibold">
              {progressData.coverage_percentage}% of full curriculum
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">→ Active / In Progress</span>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300 my-0.5 print:text-black">
              {progressData.total_in_progress_units}
            </div>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-400 font-semibold">
              Active classroom ladders
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-cardBg border border-borderMain flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase text-textDim dark:text-slate-400">○ Units Remaining</span>
            <div className="text-2xl font-black text-textDim dark:text-slate-300 my-0.5 print:text-black">
              {progressData.total_statutory_units - progressData.total_completed_units - progressData.total_in_progress_units}
            </div>
            <span className="text-[10px] text-textDim">Scheduled for upcoming terms</span>
          </div>
        </div>

        {/* Overall Visual Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-navy dark:text-white print:text-black">
            <span>Overall Curriculum Access Completion</span>
            <span className="font-mono">{progressData.coverage_percentage}%</span>
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-borderMain">
            <div
              className="h-full bg-gradient-to-r from-teal to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressData.coverage_percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Subject Coverage Breakdown Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-textDim dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal" />
            <span>Subject-by-Subject Coverage</span>
          </h3>
          <span className="text-[10px] text-textDim print:hidden">Click any subject card to filter table below</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {progressData.subjects_breakdown.map((sb) => {
            const isSelected = selectedSubjectFilter === sb.subject;
            return (
              <button
                key={sb.subject}
                type="button"
                onClick={() => setSelectedSubjectFilter(isSelected ? 'All' : sb.subject)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-teal text-white border-teal shadow-xs ring-2 ring-teal/30'
                    : 'bg-cardBg hover:bg-cardSubtle border-borderMain text-navy dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold truncate">{sb.subject}</span>
                  <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-teal-100' : 'text-teal'}`}>
                    {sb.percentage}%
                  </span>
                </div>
                <div className="text-[10px] opacity-80 mb-2">
                  {sb.completed_units} / {sb.total_units} units
                </div>
                <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isSelected ? 'bg-white' : 'bg-teal'}`}
                    style={{ width: `${sb.percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Strengths & Diagnostic Summary Card */}
      <div className="p-4 bg-mint-pale/40 dark:bg-teal-950/20 rounded-2xl border border-mint/40 dark:border-teal-900/40 text-xs space-y-2 print:border-slate-800">
        <div className="flex items-center gap-2 font-bold text-teal-900 dark:text-teal-200">
          <Sparkles className="w-4 h-4 text-teal" />
          <span>Cognitive Profile Learning Synthesis</span>
        </div>
        <p className="text-[11px] text-textSub dark:text-slate-300 leading-relaxed font-sans">
          {progressData.strengths_summary}
        </p>

        {progressData.next_recommended_units.length > 0 && (
          <div className="pt-2 border-t border-teal-200/50 dark:border-teal-900/50 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="font-bold text-teal-900 dark:text-teal-200">Recommended Units Next:</span>
            {progressData.next_recommended_units.map((unitTitle) => (
              <span
                key={unitTitle}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40 font-medium"
              >
                {unitTitle}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Unit Directory & Filters */}
      <div className="card p-4 space-y-3.5 print:p-0 print:border-none print:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-borderMain pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-teal" />
              <span>National Curriculum Unit Directory</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cardSubtle border border-borderMain font-mono font-bold text-textDim">
              {filteredUnits.length} of {progressData.units.length}
            </span>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative flex-1 sm:w-56 min-w-[160px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-textDim" />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-cardSubtle rounded-xl border border-borderMain focus:outline-none focus:border-teal"
              />
            </div>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-cardSubtle text-textMain border border-borderMain cursor-pointer font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Mastered">✓ Mastered ({progressData.total_completed_units})</option>
              <option value="In Progress">→ In Progress ({progressData.total_in_progress_units})</option>
              <option value="Not Started">○ Not Started</option>
            </select>
          </div>
        </div>

        {/* Units List */}
        <div className="space-y-2">
          {filteredUnits.length === 0 ? (
            <div className="py-8 text-center text-xs text-textDim">
              No curriculum units match current search or filters.
            </div>
          ) : (
            filteredUnits.map((u) => {
              const isMastered = u.status === 'mastered';
              const isInProgress = u.status === 'in_progress';
              const isUpdating = updatingUnitId === u.unit_id;

              return (
                <div
                  key={u.unit_id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isMastered
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40'
                      : isInProgress
                      ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40'
                      : 'bg-cardSubtle/60 border-borderMain'
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cardBg border border-borderMain text-textMain dark:text-slate-200">
                        {u.subject}
                      </span>
                      <span className="text-[10px] text-textDim dark:text-slate-400 font-medium">
                        {u.strand}
                      </span>
                      {isMastered && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          ✓ Mastered
                        </span>
                      )}
                      {isInProgress && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                          → In Progress
                        </span>
                      )}
                      {u.accommodations_used?.map((acc) => (
                        <span
                          key={acc}
                          className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200/50"
                        >
                          {acc}
                        </span>
                      ))}
                    </div>

                    <h4 className="text-xs font-bold text-navy dark:text-white">
                      {u.title}
                    </h4>

                    <p className="text-[11px] text-textSub dark:text-slate-300 leading-snug font-sans">
                      {u.default_objective}
                    </p>
                  </div>

                  {/* Actions: Status Toggle & Scaffold Button */}
                  <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-borderMain/50">
                    {/* Status Dropdown */}
                    <select
                      value={u.status}
                      disabled={isUpdating}
                      onChange={(e) => handleStatusChange(u.unit_id, e.target.value)}
                      className="text-[11px] font-bold px-2 py-1.5 rounded-lg bg-cardBg text-textMain border border-borderMain cursor-pointer focus:outline-none focus:border-teal disabled:opacity-50"
                    >
                      <option value="not_started">○ Not Started</option>
                      <option value="in_progress">→ In Progress</option>
                      <option value="mastered">✓ Mastered</option>
                    </select>

                    {/* Scaffold Button */}
                    {onSelectUnitToScaffold && (
                      <button
                        type="button"
                        onClick={() => onSelectUnitToScaffold(u.title, u.subject, u.default_objective)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal hover:bg-teal-dark text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        title="Load this unit into the 4-step scaffolding ladder"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Scaffold →</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
