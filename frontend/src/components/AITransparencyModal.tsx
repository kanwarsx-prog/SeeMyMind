import React, { useEffect, useState } from 'react';
import {
  X,
  RefreshCw,
  ShieldCheck,
  Cpu,
  Zap,
  Terminal,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { AIRunAuditItem, Child } from '../types';
import { api } from '../api';

interface AITransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  child?: Child | null;
}

export const AITransparencyModal: React.FC<AITransparencyModalProps> = ({
  isOpen,
  onClose,
  child,
}) => {
  const [runs, setRuns] = useState<AIRunAuditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterToChild, setFilterToChild] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'prompt' | 'output'>('prompt');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch runs on modal open or filter change
  const fetchRuns = async () => {
    setLoading(true);
    setError(null);
    try {
      const childId = filterToChild && child?.id ? child.id : undefined;
      const data = await api.getAIAuditRuns(childId, 50);
      setRuns(data);
      if (data.length > 0 && !expandedRunId) {
        setExpandedRunId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load AI audit logs:', err);
      setError(err?.message || 'Could not connect to AI audit service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRuns();
    }
  }, [isOpen, filterToChild, child?.id]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Aggregated metrics
  const totalRuns = runs.length;
  const totalInputTokens = runs.reduce((acc, r) => acc + (r.input_tokens || 0), 0);
  const totalOutputTokens = runs.reduce((acc, r) => acc + (r.output_tokens || 0), 0);
  const totalTokens = totalInputTokens + totalOutputTokens;
  const aiGpt4oRuns = runs.filter((r) => r.model_name.includes('gpt-4o') || r.model_name.includes('noya')).length;
  const standardRuns = runs.filter((r) => r.model_name === 'curriculum-standard').length;

  const pupilName = child?.preferred_name || child?.first_name || 'Current Pupil';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-navy/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-navy text-white border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-mint/20 border border-mint/40 flex items-center justify-center text-mint">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>NOYA AI Transparency & API Audit Log</span>
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-mint/20 text-mint border border-mint/30 px-2 py-0.5 rounded-md">
                  Active Transparency Mode
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                Live inspection of all API input prompts, completions, token usage, and zero-token deterministic fallbacks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRuns}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh AI logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
              <span>Total API Logs</span>
              <Terminal className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {totalRuns}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Across all endpoints
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
              <span>Total Tokens</span>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {totalTokens.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              {totalInputTokens.toLocaleString()} in &bull; {totalOutputTokens.toLocaleString()} out
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
              <span>GPT-4o Runs</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1">
              {aiGpt4oRuns}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Manual opt-in triggers only
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
              <span>Zero-Token Scaffolds</span>
              <Layers className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-xl font-bold text-teal-700 dark:text-teal-300 mt-1">
              {standardRuns}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              100% token savings (£0.00)
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-2.5 bg-slate-100/80 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Filter:
            </span>
            <button
              onClick={() => setFilterToChild(false)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                !filterToChild
                  ? 'bg-navy dark:bg-white text-white dark:text-navy shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              All School Invocations
            </button>
            {child && (
              <button
                onClick={() => setFilterToChild(true)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterToChild
                    ? 'bg-navy dark:bg-white text-white dark:text-navy shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Only {pupilName}&apos;s Runs
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Showing latest {runs.length} audit entries
          </div>
        </div>

        {/* Scrollable Audit Log Entries */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-50/50 dark:bg-[#0b1222]">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-3 text-rose-800 dark:text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {runs.length === 0 && !loading && (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Terminal className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No AI Invocations Logged Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Trigger a manual action (like synthesizing a morning briefing or generating an adapted pathway) to inspect its exact API input prompt and raw output.
              </p>
            </div>
          )}

          {runs.map((run) => {
            const isExpanded = expandedRunId === run.id;
            const isGpt4o = run.model_name.includes('gpt-4o') || run.model_name.includes('noya');
            const isCurriculum = run.model_name === 'curriculum-standard';

            return (
              <div
                key={run.id}
                className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition-all overflow-hidden"
              >
                {/* Run Summary Header */}
                <div
                  onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                        isGpt4o
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : isCurriculum
                          ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {isGpt4o ? <Sparkles className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {run.prompt_type}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isGpt4o
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : isCurriculum
                              ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {run.model_name}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                          Role: {run.requester_role}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            run.status === 'Success'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(run.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}{' '}
                          &bull; {new Date(run.created_at).toLocaleDateString()}
                        </span>
                        <span>&bull;</span>
                        <span>Latency: {run.latency_ms}ms</span>
                        <span>&bull;</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {run.input_tokens + run.output_tokens > 0
                            ? `${(run.input_tokens + run.output_tokens).toLocaleString()} tokens (${run.input_tokens} in / ${run.output_tokens} out)`
                            : '0 tokens (Deterministic)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                      {isExpanded ? 'Hide Payload' : 'Inspect Prompt & Output'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Raw Input / Output Inspector */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-900 text-slate-100 p-4 space-y-3 font-mono text-xs">
                    {/* Tab Switcher */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('prompt')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'prompt'
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Raw Input Prompt ({run.input_tokens} tokens)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('output')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeTab === 'output'
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Raw Output Response ({run.output_tokens} tokens)
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const textToCopy =
                            activeTab === 'prompt'
                              ? run.input_prompt || ''
                              : run.output_text || '';
                          handleCopy(textToCopy, `${run.id}-${activeTab}`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedKey === `${run.id}-${activeTab}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Content</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Content Display */}
                    <div className="max-h-80 overflow-y-auto bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11.5px] leading-relaxed whitespace-pre-wrap select-all">
                      {activeTab === 'prompt' ? (
                        run.input_prompt ? (
                          run.input_prompt
                        ) : (
                          <span className="text-slate-500 italic">No input prompt recorded.</span>
                        )
                      ) : run.output_text ? (
                        run.output_text
                      ) : (
                        <span className="text-slate-500 italic">No output text recorded.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="flex-shrink-0 px-6 py-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>
              All prompts and responses are audited under SEND Code of Practice transparency & algorithmic accountability.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
