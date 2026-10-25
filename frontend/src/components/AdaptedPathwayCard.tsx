import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Lock,
  ExternalLink,
  Sparkles,
  ChevronDown,
  Printer,
  ShieldCheck,
  RefreshCw,
  BatteryCharging,
  Layers,
} from 'lucide-react';
import {
  Child,
  PathwayStep,
  PeerAdaptation,
  CurriculumUnit,
  LessonPathwayResponse,
} from '../types';
import { api } from '../api';
import { VisualDeskStripModal } from './VisualDeskStripModal';

interface AdaptedPathwayCardProps {
  child?: Child | null;
  onOpenWorksheet: (worksheetKey: string) => void;
  onLogMilestone?: (milestoneTitle: string, note: string) => Promise<void>;
}

export const AdaptedPathwayCard: React.FC<AdaptedPathwayCardProps> = ({
  child,
  onOpenWorksheet,
  onLogMilestone,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [curriculumUnits, setCurriculumUnits] = useState<CurriculumUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('maths-graphs');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [loadingPathway, setLoadingPathway] = useState<boolean>(false);
  const [pathway, setPathway] = useState<LessonPathwayResponse | null>(null);

  const [steps, setSteps] = useState<PathwayStep[]>([
    {
      number: 1,
      title: '1. Real-world hook — the game level slope',
      description: '"A game character moves up a slope. How steep is it?" Draw on paper first.',
      status: 'done',
      badge: '✓ Completed',
      sensory_pause_after: false,
    },
    {
      number: 2,
      title: '2. Draw it — plot the slope visually',
      description: 'Plot coordinates on visual grid. No algebra equation yet. Feel the slope geometry.',
      status: 'active',
      badge: '→ In progress now',
      sensory_pause_after: true,
    },
    {
      number: 3,
      title: '3. Name the pattern — rise ÷ run',
      description: 'Label the triangle. Rise = how high (6). Run = how far (2). Gradient = 6 ÷ 2 = 3.',
      status: 'next',
      badge: 'Up next',
      sensory_pause_after: false,
    },
    {
      number: 4,
      title: '4. The equation emerges — y = mx + c',
      description: 'Only once gradient is felt intuitively. Algebra labels what he already understands.',
      status: 'locked',
      badge: 'Unlocks after step 3',
      sensory_pause_after: false,
    },
  ]);

  const [peerAdaptations, setPeerAdaptations] = useState<PeerAdaptation[]>([
    {
      initials: 'AW',
      name: 'Archie Watson — Dyslexia & Processing',
      need: 'Auditory step-by-step verbal walkthrough · minimal visual clutter',
      route: 'Verbal instruction strip',
      method: 'Auditory',
      color: 'bg-purple-50 text-purple-800 border border-purple-200',
    },
    {
      initials: 'RP',
      name: 'Riya Patel — ADHD & Anxiety',
      need: 'Short 10-minute chunked tasks with scheduled movement break at step 2',
      route: 'Kinesthetic chunking',
      method: 'Kinesthetic',
      color: 'bg-rose-50 text-rose-800 border border-rose-200',
    },
    {
      initials: 'AM',
      name: 'Aisha Musa — Autism & Selective Mutism',
      need: 'Written prompt cards only · non-verbal partner pairing with Jake O\'Brien',
      route: 'Written & partner work',
      method: 'Written',
      color: 'bg-amber-50 text-amber-900 border border-amber-200',
    },
  ]);

  const [taBriefing, setTaBriefing] = useState<string>(
    "Do NOT introduce the algebraic formula y = mx + c until Step 3 is verified. Offer the scheduled proactive sensory reset token at Step 2 after coordinate plotting."
  );
  const [rationale, setRationale] = useState<string>(
    "Phoenix is a visual-spatial learner with high pattern recognition capacity. Abstract notation (y = mx + c) triggers cognitive shutdown. Today's slope is framed as 'how fast does the game character move up a hill?' before any equation appears. Draw first, equation second."
  );

  const [loggingMilestone, setLoggingMilestone] = useState(false);
  const [milestoneLogged, setMilestoneLogged] = useState(false);
  const [showDeskStripModal, setShowDeskStripModal] = useState(false);

  // Load curriculum units on mount
  useEffect(() => {
    api.getCurriculumUnits()
      .then((units) => {
        if (units && units.length > 0) {
          setCurriculumUnits(units);
        }
      })
      .catch((err) => console.warn('Could not fetch curriculum units, using defaults:', err));
  }, []);

  const handleGenerate = async (topicToUse?: string, subjectToUse?: string, objectiveToUse?: string) => {
    if (!child?.id) return;

    let targetTopic = topicToUse;
    let targetSubject = subjectToUse || 'Mathematics';
    let targetObjective = objectiveToUse;

    if (!targetTopic) {
      if (isCustomMode) {
        if (!customTopic.trim()) return;
        targetTopic = customTopic.trim();
        targetSubject = 'Classroom Curriculum';
      } else {
        const found = curriculumUnits.find((u) => u.id === selectedUnitId);
        if (found) {
          targetTopic = found.title;
          targetSubject = found.subject;
          targetObjective = found.default_objective;
        } else {
          targetTopic = 'Straight Line Graphs & Gradients';
        }
      }
    }

    setLoadingPathway(true);
    try {
      const result = await api.generatePathway({
        child_id: child.id,
        subject: targetSubject,
        topic: targetTopic,
        learning_objective: targetObjective,
      });

      setPathway(result);
      setSteps(result.steps);
      setRationale(result.cognitive_rationale);
      setTaBriefing(result.ta_briefing);
      if (result.peer_adaptations && result.peer_adaptations.length > 0) {
        setPeerAdaptations(result.peer_adaptations);
      }
    } catch (err) {
      console.error('Pathway generation failed:', err);
    } finally {
      setLoadingPathway(false);
    }
  };

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    setIsCustomMode(false);
    const unit = curriculumUnits.find((u) => u.id === unitId);
    if (unit) {
      handleGenerate(unit.title, unit.subject, unit.default_objective);
    }
  };

  const handleAdvanceStep = () => {
    setSteps((prev) => {
      const activeIdx = prev.findIndex((s) => s.status === 'active');
      if (activeIdx === -1 || activeIdx >= prev.length - 1) return prev;
      return prev.map((s, idx) => {
        if (idx === activeIdx) return { ...s, status: 'done', badge: '✓ Completed' };
        if (idx === activeIdx + 1) return { ...s, status: 'active', badge: '→ In progress now' };
        return s;
      });
    });
  };

  const handleLogBreakthrough = async () => {
    if (!onLogMilestone) return;
    setLoggingMilestone(true);
    try {
      const activeStep = steps.find((s) => s.status === 'active') || steps[1] || steps[0];
      const activeTopic = pathway?.topic || 'Straight Line Graphs';
      const pupilName = child?.preferred_name || child?.first_name || 'Phoenix';

      await onLogMilestone(
        `${activeTopic} Breakthrough: ${activeStep.title}`,
        `${pupilName} completed ${activeStep.title} (${activeStep.description}) independently via the adapted cognitive pathway. Strategy validated in lesson.`
      );
      setMilestoneLogged(true);
      setTimeout(() => setMilestoneLogged(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingMilestone(false);
    }
  };

  const currentTopic = pathway?.topic || 'Straight Line Graphs & Gradients';
  const currentSubject = pathway?.subject || 'Maths';
  const pupilName = child?.preferred_name || child?.first_name || 'Phoenix';

  return (
    <div className="card overflow-hidden">
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-cardSubtle transition-colors border-b border-borderMain"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal/10 dark:bg-teal-950/60 flex items-center justify-center text-teal dark:text-teal-300 border border-teal/20">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-navy dark:text-white">
                📚 Adapted Session Pathways — This Lesson
              </h4>
              <span className="text-[10px] font-bold text-teal dark:text-teal-300 bg-teal/10 dark:bg-teal-950/60 border border-teal/20 px-2 py-0.5 rounded-md">
                CoP 6.44 Scaffolding
              </span>
            </div>
            <p className="text-[10px] text-textDim dark:text-slate-400 mt-0.5">
              {currentSubject} &bull; {currentTopic} &bull; {pupilName}&apos;s Cognitive Route
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-textDim dark:text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          
          {/* Lesson Topic Selector & Quick Ingestion Strip */}
          <div className="p-3 bg-cardSubtle rounded-2xl border border-borderMain space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal" />
                <span>Select Lesson Topic or Ingest Custom Objective:</span>
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    !isCustomMode
                      ? 'bg-teal text-white shadow-2xs'
                      : 'bg-cardBg text-textDim hover:text-navy dark:hover:text-white border border-borderMain'
                  }`}
                >
                  National Curriculum Units
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    isCustomMode
                      ? 'bg-teal text-white shadow-2xs'
                      : 'bg-cardBg text-textDim hover:text-navy dark:hover:text-white border border-borderMain'
                  }`}
                >
                  + Custom Topic
                </button>
              </div>
            </div>

            {!isCustomMode ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={selectedUnitId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl bg-cardBg text-textMain dark:text-white border border-borderMain focus:outline-none focus:border-teal font-medium"
                >
                  {curriculumUnits.length > 0 ? (
                    curriculumUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        [{u.subject}] {u.title} ({u.strand})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="maths-graphs">[Maths] Straight Line Graphs & Gradients (Geometry & Algebra)</option>
                      <option value="maths-fractions">[Maths] Equivalent Fractions & Visual Bar Models (Fractions)</option>
                      <option value="english-highwayman">[English] The Highwayman — Narrative Inference (Comprehension)</option>
                      <option value="science-circuits">[Science] Electrical Circuits & Switches (Physics)</option>
                    </>
                  )}
                </select>

                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={loadingPathway}
                  className="px-3.5 py-2 rounded-xl bg-teal hover:bg-teal-dark text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingPathway ? 'animate-spin' : ''}`} />
                  <span>{loadingPathway ? 'Synthesizing...' : '⚡ Re-Synthesize via NOYA'}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Science — States of matter & particle arrangements"
                  className="flex-1 text-xs px-3 py-2 rounded-xl bg-cardBg text-textMain dark:text-white border border-borderMain focus:outline-none focus:border-teal font-medium"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGenerate();
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={loadingPathway || !customTopic.trim()}
                  className="px-3.5 py-2 rounded-xl bg-teal hover:bg-teal-dark text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${loadingPathway ? 'animate-spin' : ''}`} />
                  <span>{loadingPathway ? 'Synthesizing...' : '⚡ Generate Adaptation'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Spotlight Rationale */}
          <div className="p-3.5 bg-gradient-to-r from-teal/10 via-teal/5 to-transparent dark:from-teal-950/40 dark:via-cardBg dark:to-transparent border-l-3 border-teal rounded-xl text-xs space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal dark:text-teal-300">
              Cognitive Profile & Scaffolding Rationale ({pupilName})
            </div>
            <p className="text-textSub dark:text-slate-300 leading-relaxed text-[11.5px]">
              {rationale}
            </p>
          </div>

          {/* Interactive 4-Step Pathway */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400">
                Lesson Pathway — {currentTopic}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAdvanceStep}
                  className="text-[10px] font-semibold text-teal dark:text-teal-300 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Advance Step</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {steps.map((st) => (
                <div key={st.number} className="space-y-1.5">
                  <div
                    className={`p-2.5 rounded-xl border flex items-start gap-3 transition-all ${
                      st.status === 'done'
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/40'
                        : st.status === 'active'
                        ? 'bg-amber-50/40 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/50 ring-2 ring-amber-200/50 dark:ring-amber-900/40'
                        : st.status === 'next'
                        ? 'bg-cardSubtle border-borderMain'
                        : 'bg-cardSubtle/50 border-borderMain opacity-60'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 ${
                        st.status === 'done'
                          ? 'bg-emerald-600 text-white'
                          : st.status === 'active'
                          ? 'bg-amber-dark text-white animate-pulse'
                          : st.status === 'next'
                          ? 'bg-cardSubtle text-textMain border border-borderMain'
                          : 'bg-cardSubtle text-textDim border border-borderMain'
                      }`}
                    >
                      {st.status === 'done' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : st.status === 'active' ? (
                        '→'
                      ) : st.status === 'locked' ? (
                        <Lock className="w-2.5 h-2.5" />
                      ) : (
                        st.number
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-navy dark:text-white truncate">
                          {st.title}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                            st.status === 'done'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                              : st.status === 'active'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/40'
                              : 'bg-cardSubtle text-textDim border border-borderMain'
                          }`}
                        >
                          {st.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-textSub dark:text-slate-300 mt-0.5 leading-snug">
                        {st.description}
                      </p>
                    </div>
                  </div>

                  {/* Scheduled Sensory Token Indicator */}
                  {st.sensory_pause_after && (
                    <div className="px-3 py-1.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-dashed border-amber-300 dark:border-amber-700/50 flex items-center justify-between text-[10px] text-amber-900 dark:text-amber-200">
                      <div className="flex items-center gap-1.5">
                        <BatteryCharging className="w-3.5 h-3.5 text-amber-600" />
                        <span className="font-semibold">Scheduled 2-Min Sensory / Movement Token</span>
                      </div>
                      <span className="text-[9px] font-mono opacity-80">Trigger before Step 3</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 60-Second TA Scaffolding Protocol */}
          <div className="p-3 bg-cardSubtle rounded-xl border border-borderMain text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-navy dark:text-white text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-teal" />
              <span>1:1 TA Scaffolding Briefing</span>
            </div>
            <p className="text-[11px] text-textSub dark:text-slate-300 leading-relaxed">
              {taBriefing}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-borderMain">
            <button
              onClick={() => {
                const lower = currentTopic.toLowerCase();
                if (lower.includes('fraction')) {
                  onOpenWorksheet('fractions');
                } else if (lower.includes('highwayman')) {
                  onOpenWorksheet('highwayman');
                } else {
                  onOpenWorksheet('graphs');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal hover:bg-teal-dark text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Interactive Worksheet</span>
            </button>

            <button
              onClick={() => setShowDeskStripModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cardSubtle hover:bg-slate-100 dark:hover:bg-slate-800 text-textMain dark:text-white border border-borderMain rounded-xl text-xs font-semibold shadow-2xs cursor-pointer active:scale-95 transition-all"
              title="Print physical visual task strip for pupil desk"
            >
              <Printer className="w-3.5 h-3.5 text-teal" />
              <span>Print Visual Desk Strip</span>
            </button>

            {onLogMilestone && (
              <button
                onClick={handleLogBreakthrough}
                disabled={loggingMilestone}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gold hover:bg-amber-500 text-navy dark:text-slate-900 rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loggingMilestone ? 'Saving...' : '⭐ Log Milestone Breakthrough'}</span>
              </button>
            )}

            {milestoneLogged && (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 animate-in fade-in">
                ✓ Milestone logged & shared to Mum&apos;s feed!
              </span>
            )}
          </div>

          {/* Parallel Peer Adaptations in Room 4 */}
          <div className="pt-2 border-t border-borderMain space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400 block">
              Other Room 4 Pupils — Parallel Adapted Routes
            </span>

            <div className="space-y-1.5">
              {peerAdaptations.map((p) => (
                <div
                  key={p.name}
                  className="p-2 bg-cardSubtle rounded-xl flex items-center justify-between gap-2 border border-borderMain text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${p.color}`}
                    >
                      {p.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-navy dark:text-white truncate text-[11px]">{p.name}</div>
                      <div className="text-[10px] text-textDim dark:text-slate-400 truncate">{p.need}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-cardBg border border-borderMain text-textMain dark:text-white flex-shrink-0">
                    {p.method}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Visual Desk Strip Modal */}
      {showDeskStripModal && (
        <VisualDeskStripModal
          isOpen={showDeskStripModal}
          onClose={() => setShowDeskStripModal(false)}
          pathway={
            pathway || {
              child_id: child?.id || 'demo-pupil',
              child_name: pupilName,
              subject: currentSubject,
              topic: currentTopic,
              learning_objective: 'Master key concepts via adapted cognitive ladder.',
              cognitive_rationale: rationale,
              steps: steps,
              ta_briefing: taBriefing,
              peer_adaptations: peerAdaptations,
              generated_at: new Date().toISOString(),
              model_used: 'noya-engine',
            }
          }
          child={child}
        />
      )}
    </div>
  );
};
