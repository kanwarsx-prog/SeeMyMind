import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { api } from '../api';
import {
  SchoolAnalyticsOverview,
  IncidentHeatmapResponse,
  TriggersReportResponse,
  StrategyEfficacyResponse,
  ProvisionAuditResponse,
  SenInformationReportResponse,
} from '../types';
import { SenInformationReportModal } from './SenInformationReportModal';

interface AnalyticsReportsDashboardProps {
  onAskNoya?: (query: string) => void;
}

export const AnalyticsReportsDashboard: React.FC<AnalyticsReportsDashboardProps> = ({ onAskNoya }) => {
  const [overview, setOverview] = useState<SchoolAnalyticsOverview | null>(null);
  const [heatmap, setHeatmap] = useState<IncidentHeatmapResponse | null>(null);
  const [triggersReport, setTriggersReport] = useState<TriggersReportResponse | null>(null);
  const [strategyReport, setStrategyReport] = useState<StrategyEfficacyResponse | null>(null);
  const [provisionAudit, setProvisionAudit] = useState<ProvisionAuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingCsv, setDownloadingCsv] = useState<string | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>('sensory_acoustic');
  const [senReport, setSenReport] = useState<SenInformationReportResponse | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  const handleOpenReportModal = async () => {
    try {
      setLoadingReport(true);
      const data = await api.getSenInformationReport();
      setSenReport(data);
      setIsReportModalOpen(true);
    } catch (err) {
      console.error('Failed to load Statutory SEN Information Report:', err);
      alert('Failed to generate Statutory SEN Information Report: ' + err);
    } finally {
      setLoadingReport(false);
    }
  };

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      const [ov, hm, tr, st, pa] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getIncidentHeatmap(),
        api.getTriggerFrequencies(),
        api.getStrategyWinRates(),
        api.getProvisionAudit(),
      ]);
      setOverview(ov);
      setHeatmap(hm);
      setTriggersReport(tr);
      setStrategyReport(st);
      setProvisionAudit(pa);
    } catch (err) {
      console.error('Failed to load analytics suite:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async (reportType: 'provision' | 'strategies' | 'triggers') => {
    try {
      setDownloadingCsv(reportType);
      await api.downloadAnalyticsCsv(reportType);
    } catch (err) {
      alert(`Failed to download CSV: ${err}`);
    } finally {
      setDownloadingCsv(null);
    }
  };

  if (loading) {
    return (
      <div className="card p-10 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-3 border-teal border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-textDim dark:text-slate-400">
          Synthesizing multi-month longitudinal SEND data and provision metrics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header & 1-Click Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-cardBg p-5 rounded-2xl border border-borderMain shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-navy dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal" />
              <span>SEND Operational Reports & Evidence Analytics</span>
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal/10 text-teal dark:text-teal-300 font-semibold border border-teal/20">
              Live recorded data
            </span>
          </div>
          <p className="text-xs text-textDim dark:text-slate-400 mt-1">
            Live school evidence with clear gaps where records are incomplete.
          </p>
        </div>

        {/* Actions: Statutory Report & CSV Exports */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {onAskNoya && (
            <button
              onClick={() => onAskNoya('Audit these live school analytics. Explain which patterns are supported by recorded evidence, which data is missing, and what the SENCO should verify next. Do not invent trends or recommendations.')}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-teal-200"
              title="Ask NOYA to interpret the recorded analytics and identify gaps"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explain with NOYA</span>
            </button>
          )}
          <button
            onClick={handleOpenReportModal}
            disabled={loadingReport}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-navy hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow disabled:opacity-60"
            title="Prepare a draft statutory report preview for human review"
          >
            {loadingReport ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-teal" />
            )}
            <span>{loadingReport ? 'Compiling Pack...' : 'Draft Statutory Report'}</span>
          </button>

          <button
            onClick={() => handleExportCsv('provision')}
            disabled={downloadingCsv !== null}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-cardSubtle hover:bg-slate-200 dark:hover:bg-slate-800 text-textMain text-xs font-bold border border-borderMain transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-teal" />
            <span>{downloadingCsv === 'provision' ? 'Exporting...' : 'Provision CSV'}</span>
          </button>

          <button
            onClick={() => handleExportCsv('strategies')}
            disabled={downloadingCsv !== null}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-cardSubtle hover:bg-slate-200 dark:hover:bg-slate-800 text-textMain text-xs font-bold border border-borderMain transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{downloadingCsv === 'strategies' ? 'Exporting...' : 'Strategies CSV'}</span>
          </button>

          <button
            onClick={() => handleExportCsv('triggers')}
            disabled={downloadingCsv !== null}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-cardSubtle hover:bg-slate-200 dark:hover:bg-slate-800 text-textMain text-xs font-bold border border-borderMain transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>{downloadingCsv === 'triggers' ? 'Exporting...' : 'Triggers CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: De-escalation Success Rate */}
        <div className="bg-cardBg p-4 rounded-xl border border-borderMain border-l-4 border-l-emerald-500 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-textDim dark:text-slate-400 uppercase tracking-wider">
              De-Escalation Success
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
              {overview && overview.de_escalation_observation_count > 0
                ? `${overview.overall_de_escalation_win_rate}%`
                : 'Not recorded'}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/40">
              {overview && overview.de_escalation_observation_count > 0
                ? `${overview.de_escalation_observation_count} measured`
                : 'No observations'}
            </span>
          </div>
          <p className="text-[11px] text-textSub dark:text-slate-400 leading-tight">
              {strategyReport?.strategies.reduce((total, strategy) => total + strategy.successful_resolutions, 0) || 0} successful recorded outcomes.
          </p>
        </div>

        {/* Card 2: High Needs Provision Delivery */}
        <div className="bg-cardBg p-4 rounded-xl border border-borderMain border-l-4 border-l-teal shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-textDim dark:text-slate-400 uppercase tracking-wider">
              Provision Delivery Rate
            </span>
            <ShieldCheck className="w-4 h-4 text-teal" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal dark:text-teal-300">
              {provisionAudit && provisionAudit.total_allocated_ta_hours > 0
                ? `${overview?.provision_delivery_rate}%`
                : 'Not recorded'}
            </span>
            <span className="text-[10px] font-semibold text-textDim dark:text-slate-400">
              {provisionAudit ? `${provisionAudit.total_delivered_ta_hours.toFixed(1)}h / ${provisionAudit.total_allocated_ta_hours.toFixed(1)}h` : 'Not recorded'}
            </span>
          </div>
          <p className="text-[11px] text-textSub dark:text-slate-400 leading-tight">
            {provisionAudit && provisionAudit.total_allocated_ta_hours > 0
              ? `Recorded TA allocation and delivery across ${provisionAudit.bands.reduce((total, band) => total + band.pupil_count, 0)} pupil allocations.`
              : 'No TA allocation records are available.'}
          </p>
        </div>

        {/* Card 3: Peak Vulnerability Window */}
        <div className="bg-cardBg p-4 rounded-xl border border-borderMain border-l-4 border-l-amber-500 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-textDim dark:text-slate-400 uppercase tracking-wider">
              Peak Sensory Risk
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-amber-900 dark:text-amber-300 truncate">
              {overview?.peak_vulnerability_window || 'Not recorded'}
            </span>
          </div>
          <p className="text-[11px] text-textSub dark:text-slate-400 leading-tight">
            {overview && overview.peak_vulnerability_count > 0
              ? `${overview.peak_vulnerability_count} recorded incident${overview.peak_vulnerability_count === 1 ? '' : 's'} at this peak time.`
              : 'No incident timings are recorded.'}
          </p>
        </div>

        {/* Card 4: Annual Review Compliance */}
        <div className="bg-cardBg p-4 rounded-xl border border-borderMain border-l-4 border-l-purple-500 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-textDim dark:text-slate-400 uppercase tracking-wider">
              Statutory Compliance
            </span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-800 dark:text-purple-300">
              {overview && overview.annual_reviews_recorded > 0
                ? `${overview.annual_reviews_on_track_rate}%`
                : 'Not recorded'}
            </span>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-900/40">
              {overview && overview.annual_reviews_recorded > 0
                ? `${overview.annual_reviews_on_track} of ${overview.annual_reviews_recorded} on track`
                : 'No review dates'}
            </span>
          </div>
          <p className="text-[11px] text-textSub dark:text-slate-400 leading-tight">
            {overview && overview.annual_reviews_missing > 0
              ? `${overview.annual_reviews_missing} active pupil${overview.annual_reviews_missing === 1 ? '' : 's'} have no review date recorded.`
              : 'Based on recorded annual review dates.'}
          </p>
        </div>
      </div>

      {/* SECTION 1: 5-Day x 7-Period Incident Heatmap */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-borderMain pb-3">
          <div>
            <h3 className="text-sm font-bold text-navy dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal" />
              <span>Time-of-Day Stress & Incident Heatmap (Whole School)</span>
            </h3>
            <p className="text-xs text-textDim dark:text-slate-400 mt-0.5">
              Recorded incident timings by weekday and school-day window.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-textDim dark:text-slate-400 font-semibold">Intensity:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-cardSubtle border border-borderMain" />
              <span className="text-textDim">0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/50" />
              <span className="text-textDim">1-2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-orange-200 dark:bg-orange-950/60 border border-orange-400 dark:border-orange-800/60" />
              <span className="text-textDim">3-4</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-300 dark:bg-rose-900/80 border border-rose-500" />
              <span className="text-textDim font-bold">5+</span>
            </div>
          </div>
        </div>

        {/* Heatmap Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-borderMain text-textDim dark:text-slate-400 font-bold">
                <th className="py-2.5 px-3 text-left w-56">Period & Time Window</th>
                {heatmap?.days.map((day) => (
                  <th key={day} className="py-2.5 px-3 text-center">
                    {day}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-center font-bold text-textMain dark:text-white">
                  Period Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderMain/60">
              {heatmap?.periods.map((period) => (
                <tr key={period.period_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-textMain dark:text-white">{period.period_label}</div>
                    <div className="text-[10px] text-textDim dark:text-slate-400 font-mono">{period.time_window}</div>
                  </td>
                  {heatmap.day_keys.map((dKey) => {
                    const count = period.incident_counts[dKey] || 0;
                    let cellClass = 'bg-cardSubtle text-textDim border-borderMain/50';
                    if (count >= 4) {
                      cellClass = 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-bold border-rose-300 dark:border-rose-900/80 ring-1 ring-rose-400/30';
                    } else if (count >= 3) {
                      cellClass = 'bg-orange-100 dark:bg-orange-950/50 text-orange-900 dark:text-orange-200 font-bold border-orange-300 dark:border-orange-900/60';
                    } else if (count >= 1) {
                      cellClass = 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-900/40';
                    }

                    return (
                      <td key={dKey} className="py-2.5 px-2 text-center">
                        <div
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs transition-all ${cellClass}`}
                          title={`${period.period_label} on ${dKey.toUpperCase()}: ${count} incident(s)`}
                        >
                          {count}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-navy dark:text-white bg-cardSubtle px-2.5 py-1 rounded-md border border-borderMain">
                      {period.total_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tactical Recommendation Banner */}
        <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
          <div className="text-xs text-teal-950 dark:text-teal-200 leading-relaxed">
            <strong className="font-bold">Recorded pattern:</strong>{' '}
            {heatmap?.total_incidents
              ? `${heatmap.total_incidents} incidents are recorded. The highest recorded window is ${heatmap.peak_window}. Use NOYA to explore the evidence before changing staffing.`
              : 'No incidents are recorded for this school, so no operational pattern can be inferred yet.'}
          </div>
        </div>
      </div>

      {/* SECTION 2: Triggers Frequency vs Strategy Win-Rates (Split Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Antecedent Triggers Breakdown */}
        <div className="lg:col-span-6 card p-5 space-y-4">
          <div className="border-b border-borderMain pb-2">
            <h3 className="text-sm font-bold text-navy dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Classroom Triggers Breakdown</span>
            </h3>
            <p className="text-xs text-textDim dark:text-slate-400 mt-0.5">
              {triggersReport?.total_recorded_triggers || 0} trigger records grouped from incident antecedents.
            </p>
          </div>

          <div className="space-y-3">
            {triggersReport?.triggers.map((trigger) => {
              const isSelected = selectedTrigger === trigger.category;
              return (
                <div
                  key={trigger.category}
                  onClick={() => setSelectedTrigger(trigger.category)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal/50 shadow-xs'
                      : 'bg-cardSubtle border-borderMain hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-textMain dark:text-white">
                      {trigger.label}
                    </span>
                    <span className="font-mono text-xs font-bold text-teal dark:text-teal-300">
                      {trigger.percentage}% ({trigger.count})
                    </span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="bg-teal h-full rounded-full transition-all duration-500"
                      style={{ width: `${trigger.percentage}%` }}
                    />
                  </div>

                  {/* Expandable Evidence Examples */}
                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-borderMain text-[11px] text-textSub dark:text-slate-300 space-y-1">
                      <div className="font-bold text-textDim dark:text-slate-400 uppercase text-[9px] tracking-wider">
                        Documented Classroom Triggers:
                      </div>
                      {trigger.primary_antecedent_examples.map((ex, i) => (
                        <div key={i} className="flex items-start gap-1.5 leading-snug">
                          <span className="text-teal font-bold">•</span>
                          <span>{ex}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: De-Escalation Strategy Win-Rate Leaderboard */}
        <div className="lg:col-span-6 card p-5 space-y-4">
          <div className="border-b border-borderMain pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-navy dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Calming Strategies Success Rate</span>
              </h3>
              <p className="text-xs text-textDim dark:text-slate-400 mt-0.5">
                Strategies ranked by how well they helped pupils settle and refocus in class.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              {strategyReport?.overall_win_rate}% Overall Helpful
            </span>
          </div>

          <div className="space-y-3">
            {strategyReport?.strategies.map((strat) => {
              const isHigh = strat.win_rate_percentage >= 85;
              const isLow = strat.win_rate_percentage < 50;

              return (
                <div
                  key={strat.strategy_id}
                  className={`p-3 rounded-xl border ${
                    isLow
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                      : 'bg-cardSubtle border-borderMain'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <div className="font-bold text-xs text-textMain dark:text-white flex items-center gap-1.5">
                        <span>{strat.title}</span>
                        {isLow && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold">
                            ⚠️ Ineffective
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-textDim dark:text-slate-400 font-medium">
                        {strat.category} · {strat.avg_recovery_minutes ? `Avg recovery ${strat.avg_recovery_minutes} mins` : 'Recovery time not recorded'}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-xs font-black font-mono ${
                          isLow
                            ? 'text-rose-700 dark:text-rose-300'
                            : 'text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {strat.win_rate_percentage}%
                      </span>
                      <div className="text-[9px] text-textDim dark:text-slate-400">
                        {strat.successful_resolutions}/{strat.total_attempts} wins
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow ? 'bg-rose-500' : isHigh ? 'bg-emerald-600' : 'bg-teal'
                      }`}
                      style={{ width: `${strat.win_rate_percentage}%` }}
                    />
                  </div>

                  {/* Recommended indicators */}
                  <div className="text-[10px] text-textSub dark:text-slate-300 leading-snug">
                    <span className="font-semibold text-textDim">Best for: </span>
                    {strat.recommended_for.join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: Statutory Provision & High Needs Funding Compliance Audit */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-borderMain pb-3">
          <div>
            <h3 className="text-sm font-bold text-navy dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal" />
              <span>Recorded Provision & Allocation Audit</span>
            </h3>
            <p className="text-xs text-textDim dark:text-slate-400 mt-0.5">
              Comparing legally mandated 1:1 TA hours against logged classroom delivery across High Needs funding tiers.
            </p>
          </div>
          <button
            onClick={() => handleExportCsv('provision')}
            className="px-3 py-1.5 rounded-lg bg-teal hover:bg-teal-dark text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Official Local Authority Audit (.CSV)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-borderMain text-textDim dark:text-slate-400 font-bold bg-cardSubtle/60">
                <th className="py-2.5 px-3 text-left">Funding Tier / Band</th>
                <th className="py-2.5 px-3 text-center">Annual / Pupil</th>
                <th className="py-2.5 px-3 text-center">Pupil Count</th>
                <th className="py-2.5 px-3 text-center">Total Annual Spend</th>
                <th className="py-2.5 px-3 text-center">Weekly Allocated TA</th>
                <th className="py-2.5 px-3 text-center">Weekly Delivered TA</th>
                <th className="py-2.5 px-3 text-center">Delivery Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderMain/60">
              {provisionAudit?.bands.map((band) => (
                <tr key={band.band} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-textMain dark:text-white">
                    {band.band}
                  </td>
                  <td className="py-2.5 px-3 text-center text-textDim dark:text-slate-400 font-mono">
                    {band.annual_amount_per_pupil}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-navy dark:text-white">
                    {band.pupil_count}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-teal dark:text-teal-300 font-mono">
                    {band.total_funding}
                  </td>
                  <td className="py-2.5 px-3 text-center text-textSub dark:text-slate-300">
                    {band.weekly_ta_hours_allocated}h
                  </td>
                  <td className="py-2.5 px-3 text-center text-textSub dark:text-slate-300">
                    {band.weekly_ta_hours_delivered}h
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                      {band.delivery_compliance_percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-borderMain font-bold bg-cardSubtle/80 text-textMain dark:text-white">
                <td className="py-2.5 px-3">School-Wide Total</td>
                <td className="py-2.5 px-3 text-center text-textDim">-</td>
                <td className="py-2.5 px-3 text-center">{overview?.total_send_pupils || 0} Pupils</td>
                <td className="py-2.5 px-3 text-center text-teal dark:text-teal-300 font-mono">
                  {provisionAudit?.total_high_needs_funding}
                </td>
                <td className="py-2.5 px-3 text-center">{provisionAudit?.total_allocated_ta_hours}h</td>
                <td className="py-2.5 px-3 text-center">{provisionAudit?.total_delivered_ta_hours}h</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="font-black text-emerald-700 dark:text-emerald-300 font-mono">
                    {provisionAudit?.overall_compliance_rate}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Statutory SEN Information Report & Governor Pack Modal */}
      {isReportModalOpen && (
        <SenInformationReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          report={senReport}
        />
      )}
    </div>
  );
};
