import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Lock,
  Sparkles,
  ChevronDown,
  Printer,
  ShieldCheck,
  BatteryCharging,
  Layers,
  RotateCcw,
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
import { SensoryTokenModal } from './SensoryTokenModal';

const DEFAULT_CURRICULUM_UNITS: CurriculumUnit[] = [
  // Year 1
  {
    id: 'ks1-y1-maths-bonds20',
    subject: 'Mathematics',
    year_group: 'Year 1',
    key_stage: 'KS1',
    title: 'Number Bonds & Fact Families to 20',
    strand: 'Number & Addition',
    default_objective: 'Recall and use addition and subtraction facts to 20 with tens frames and double-sided counters.',
    source: 'National Curriculum (Oak)',
  },
  {
    id: 'ks1-y1-sci-seasons',
    subject: 'Science',
    year_group: 'Year 1',
    key_stage: 'KS1',
    title: 'Seasonal Changes: Weather & Day Length',
    strand: 'Earth & Space',
    default_objective: 'Observe and describe seasonal changes across Autumn, Winter, Spring, Summer.',
    source: 'National Curriculum (Oak)',
  },
  // Year 2
  {
    id: 'ks1-y2-maths-partitioning',
    subject: 'Mathematics',
    year_group: 'Year 2',
    key_stage: 'KS1',
    title: '2-Digit Place Value & Tens Partitioning',
    strand: 'Place Value',
    default_objective: 'Partition 2-digit numbers into tens and ones using base-10 apparatus and part-whole models.',
    source: 'National Curriculum (Oak)',
  },
  // Year 3
  {
    id: 'ks2-y3-maths-place-value',
    subject: 'Mathematics',
    year_group: 'Year 3',
    key_stage: 'KS2',
    title: 'Place Value & 3-Digit Addition',
    strand: 'Number & Operations',
    default_objective: 'Represent numbers up to 1,000 using base-10 blocks and place value counters.',
    source: 'National Curriculum (Oak)',
  },
  {
    id: 'ks2-y3-sci-magnets',
    subject: 'Science',
    year_group: 'Year 3',
    key_stage: 'KS2',
    title: 'Forces & Magnets: Attraction & Poles',
    strand: 'Physics',
    default_objective: 'Compare how things move on different surfaces and identify magnetic materials.',
    source: 'National Curriculum (Oak)',
  },
  // Year 4
  {
    id: 'ks2-y4-maths-multiplication',
    subject: 'Mathematics',
    year_group: 'Year 4',
    key_stage: 'KS2',
    title: 'Multiplication Tables & Factor Pairs',
    strand: 'Multiplication & Division',
    default_objective: 'Recall 12x12 times tables and use distributive law with array grids.',
    source: 'National Curriculum (Oak)',
  },
  {
    id: 'ks2-y4-eng-ironman',
    subject: 'English',
    year_group: 'Year 4',
    key_stage: 'KS2',
    title: 'The Iron Man — Figurative Personification',
    strand: 'Reading Comprehension',
    default_objective: 'Identify and analyse powerful verbs, similes, and mechanical metaphors in poetry.',
    source: 'National Curriculum (Oak)',
  },
  // Year 5
  {
    id: 'maths-graphs',
    subject: 'Mathematics',
    year_group: 'Year 5',
    key_stage: 'KS2',
    title: 'Straight Line Graphs & Gradients',
    strand: 'Geometry & Algebra',
    default_objective: 'Understand gradient as rate of change (steepness) and connect visual slope to y = mx + c.',
    source: 'National Curriculum (Oak)',
  },
  {
    id: 'maths-fractions',
    subject: 'Mathematics',
    year_group: 'Year 5',
    key_stage: 'KS2',
    title: 'Equivalent Fractions & Visual Bar Models',
    strand: 'Number & Fractions',
    default_objective: 'Recognise and show equivalent fractions using visual bar models and tactile counters.',
    source: 'National Curriculum (Oak)',
  },
  {
    id: 'english-highwayman',
    subject: 'English',
    year_group: 'Year 5',
    key_stage: 'KS2',
    title: 'The Highwayman — Narrative Inference',
    strand: 'Reading Comprehension',
    default_objective: 'Infer character motives and atmospheric tension from figurative language and sensory imagery.',
    source: 'National Curriculum (Oak)',
  },
  {
    id: 'science-circuits',
    subject: 'Science',
    year_group: 'Year 5',
    key_stage: 'KS2',
    title: 'Electrical Circuits & Switches',
    strand: 'Physics',
    default_objective: 'Investigate how varying switch states and cell count affects bulb brightness in series circuits.',
    source: 'National Curriculum (Oak)',
  },
  {
    id: 'computing-loops',
    subject: 'Computing',
    year_group: 'Year 5',
    key_stage: 'KS2',
    title: 'Algorithmic Loops & Game Design',
    strand: 'Computer Science',
    default_objective: 'Design game character movement loops and debug condition-triggered actions.',
    source: 'National Curriculum (Oak)',
  },
  {
    id: 'history-saxons',
    subject: 'History',
    year_group: 'Year 5',
    key_stage: 'KS2',
    title: 'Anglo-Saxon Settlements & Artifact Analysis',
    strand: 'Historical Enquiry',
    default_objective: 'Deduce daily life and cultural practices from archaeological evidence and physical artifacts.',
    source: 'National Curriculum (Oak)',
  },
  // Year 6
  {
    id: 'ks2-y6-maths-ratio',
    subject: 'Mathematics',
    year_group: 'Year 6',
    key_stage: 'KS2',
    title: 'Ratio, Proportion & Scale Factors',
    strand: 'Proportional Reasoning',
    default_objective: 'Solve problems involving relative sizes of two quantities using bar models.',
    source: 'National Curriculum (Oak)',
  },
  {
    id: 'ks2-y6-sci-light',
    subject: 'Science',
    year_group: 'Year 6',
    key_stage: 'KS2',
    title: 'Light, Reflection & Ray Optics',
    strand: 'Physics',
    default_objective: 'Demonstrate that light travels in straight lines and explains shadow shapes and periscopes.',
    source: 'National Curriculum (Oak)',
  },
  // Year 7
  {
    id: 'ks3-y7-maths-equations',
    subject: 'Mathematics',
    year_group: 'Year 7',
    key_stage: 'KS3',
    title: 'Algebraic Linear Equations & Balancing',
    strand: 'Algebra',
    default_objective: 'Solve linear equations with unknowns on both sides using balancing methods.',
    source: 'National Curriculum (Oak)',
  },
];

interface AdaptedPathwayCardProps {
  child?: Child | null;
  onOpenWorksheet: (worksheetKey: string, pathwayData?: LessonPathwayResponse | null) => void;
  onLogMilestone?: (milestoneTitle: string, note: string) => Promise<void>;
}

export const AdaptedPathwayCard: React.FC<AdaptedPathwayCardProps> = ({
  child,
  onOpenWorksheet,
  onLogMilestone,
}) => {
  const pupilName = child?.preferred_name || child?.first_name || 'Pupil';

  const [isOpen, setIsOpen] = useState(true);
  const [curriculumUnits, setCurriculumUnits] = useState<CurriculumUnit[]>(DEFAULT_CURRICULUM_UNITS);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('maths-graphs');
  const [selectedYearGroup, setSelectedYearGroup] = useState<string>(child?.year_group || 'Year 5');
  const [selectedSubject, setSelectedSubject] = useState<string>('All Subjects');
  const [availableYearGroups, setAvailableYearGroups] = useState<string[]>([
    'Year 1',
    'Year 2',
    'Year 3',
    'Year 4',
    'Year 5',
    'Year 6',
    'Year 7',
    'Year 8',
    'Year 9',
  ]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([
    'Mathematics',
    'English',
    'Science',
    'Geography',
    'History',
    'Computing',
  ]);
  const [isSyncingOak, setIsSyncingOak] = useState<boolean>(false);
  const [oakSyncStatus, setOakSyncStatus] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [loadingPathway, setLoadingPathway] = useState<boolean>(false);
  const [pathway, setPathway] = useState<LessonPathwayResponse | null>(null);

  const [steps, setSteps] = useState<PathwayStep[]>([
    {
      number: 1,
      title: '1. Real-world hook — the game level slope',
      description: '"A game character moves up a slope. How steep is it?" Draw on paper first.',
      status: 'active',
      badge: '→ Step 1 (Start Here)',
      sensory_pause_after: false,
    },
    {
      number: 2,
      title: '2. Draw it — plot the slope visually',
      description: 'Plot coordinates on visual grid. No algebra equation yet. Feel the slope geometry.',
      status: 'next',
      badge: 'Step 2',
      sensory_pause_after: true,
    },
    {
      number: 3,
      title: '3. Name the pattern — rise ÷ run',
      description: 'Label the triangle. Rise = how high (6). Run = how far (2). Gradient = 6 ÷ 2 = 3.',
      status: 'locked',
      badge: 'Step 3',
      sensory_pause_after: false,
    },
    {
      number: 4,
      title: '4. The equation emerges — y = mx + c',
      description: 'Only once gradient is felt intuitively. Algebra labels what they already understand.',
      status: 'locked',
      badge: 'Step 4',
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
    `${pupilName} is a visual-spatial learner with high pattern recognition capacity. Abstract notation (y = mx + c) triggers cognitive shutdown. Today's slope is framed as 'how fast does the game character move up a hill?' before any equation appears. Draw first, equation second.`
  );

  const [loggingMilestone, setLoggingMilestone] = useState(false);
  const [milestoneLogged, setMilestoneLogged] = useState(false);
  const [showDeskStripModal, setShowDeskStripModal] = useState(false);
  const [showSensoryModal, setShowSensoryModal] = useState(false);

  const handleGenerate = async (
    topicToUse?: string,
    subjectToUse?: string,
    objectiveToUse?: string,
    useAi: boolean = false
  ) => {
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
        use_ai: useAi,
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

  const loadUnits = async (year: string, subject: string, autoGenerate: boolean = false) => {
    try {
      const units = await api.getCurriculumUnits(year, subject);
      if (units && units.length > 0) {
        setCurriculumUnits(units);
        const match = units.find((u) => u.id === selectedUnitId);
        const nextUnit = match || units[0];
        if (!match) {
          setSelectedUnitId(nextUnit.id);
        }
        if (autoGenerate) {
          handleGenerate(nextUnit.title, nextUnit.subject, nextUnit.default_objective, false);
        }
      } else {
        setCurriculumUnits([]);
      }
    } catch (err) {
      console.warn('Could not fetch curriculum units:', err);
    }
  };

  // Load curriculum metadata and initial units on mount
  useEffect(() => {
    api.getCurriculumMetadata()
      .then((meta) => {
        if (meta.year_groups && meta.year_groups.length > 0) {
          setAvailableYearGroups(meta.year_groups);
        }
        if (meta.subjects && meta.subjects.length > 0) {
          setAvailableSubjects(meta.subjects);
        }
      })
      .catch((err) => console.warn('Could not fetch curriculum metadata:', err));

    const initialYear = child?.year_group || 'Year 5';
    setSelectedYearGroup(initialYear);
    loadUnits(initialYear, 'All Subjects', false);
  }, []);

  // Re-generate pathway deterministically when pupil changes (zero token overhead)
  useEffect(() => {
    if (child?.id) {
      const pupilYear = child.year_group || 'Year 5';
      setSelectedYearGroup(pupilYear);
      setRationale(
        `${pupilName} is a visual-spatial learner with high pattern recognition capacity. Abstract notation triggers cognitive shutdown. Loading individualized scaffolding pathway...`
      );
      loadUnits(pupilYear, selectedSubject, true);
    }
  }, [child?.id, child?.year_group]);

  const handleYearGroupChange = (newYear: string) => {
    setSelectedYearGroup(newYear);
    loadUnits(newYear, selectedSubject, true);
  };

  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
    loadUnits(selectedYearGroup, newSubject, true);
  };

  const handleSyncOak = async () => {
    setIsSyncingOak(true);
    setOakSyncStatus(null);
    try {
      const res = await api.syncOakCurriculum();
      setOakSyncStatus(res.message || `Loaded ${res.units_count} units from Oak National Academy.`);
      const meta = await api.getCurriculumMetadata();
      if (meta.year_groups?.length) setAvailableYearGroups(meta.year_groups);
      if (meta.subjects?.length) setAvailableSubjects(meta.subjects);
      await loadUnits(selectedYearGroup, selectedSubject, false);
    } catch (err: any) {
      setOakSyncStatus(`Oak sync note: using cached curriculum (${err.message || 'offline mode'})`);
    } finally {
      setIsSyncingOak(false);
      setTimeout(() => setOakSyncStatus(null), 6000);
    }
  };

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    setIsCustomMode(false);
    const unit = curriculumUnits.find((u) => u.id === unitId);
    if (unit) {
      // Deterministic scaffolding: zero tokens, instant response
      handleGenerate(unit.title, unit.subject, unit.default_objective, false);
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

  const handleResetSteps = () => {
    setSteps((prev) =>
      prev.map((s) => ({
        ...s,
        status: s.number === 1 ? 'active' : (s.number === 2 ? 'next' : 'locked'),
        badge: s.number === 1 ? '→ Step 1 (Start Here)' : `Step ${s.number}`,
      }))
    );
  };

  const handleCompleteSensoryReset = async () => {
    if (onLogMilestone) {
      try {
        await onLogMilestone(
          'Proactive Regulation: 2-Min Sensory Reset Token',
          `Administered scheduled 2-minute proactive sensory/movement pause before Step 3 for ${pupilName}. Pupil successfully regulated and transitioned into Step 3 in green zone.`
        );
      } catch (err) {
        console.error(err);
      }
    }
    setSteps((prev) =>
      prev.map((s) => {
        if (s.number <= 2) {
          return { ...s, status: 'done', badge: '✓ Completed' };
        }
        if (s.number === 3) {
          return { ...s, status: 'active', badge: '→ In progress now' };
        }
        return s;
      })
    );
  };

  const handleLogBreakthrough = async () => {
    if (!onLogMilestone) return;
    setLoggingMilestone(true);
    try {
      const activeStep = steps.find((s) => s.status === 'active') || steps[1] || steps[0];
      const activeTopic = pathway?.topic || 'Straight Line Graphs';

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
              {pathway?.model_used && (pathway.model_used.includes('gpt') || pathway.model_used.includes('noya')) ? (
                <span className="text-[10px] font-bold text-teal dark:text-mint bg-mint-p/80 dark:bg-teal-900/40 border border-teal/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-teal animate-pulse" />
                  <span>⚡ NOYA Adapted</span>
                </span>
              ) : pathway?.model_used?.includes('ai-unavailable') ? (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1" title="Standard deterministic scaffold loaded.">
                  <span>⚠️ Standard Scaffold</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-md">
                  ✓ Standard Scaffold (0 Tokens)
                </span>
              )}
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

            {!isCustomMode && (
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-borderMain/50">
                {/* Year Group Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-textDim dark:text-slate-400">Year:</span>
                  <select
                    value={selectedYearGroup}
                    onChange={(e) => handleYearGroupChange(e.target.value)}
                    className="text-[11px] font-medium px-2 py-1 rounded-lg bg-cardBg text-navy dark:text-white border border-borderMain focus:outline-none focus:border-teal cursor-pointer"
                  >
                    <option value="All Years">All Years</option>
                    {availableYearGroups.map((yg) => (
                      <option key={yg} value={yg}>
                        {yg} {child?.year_group === yg ? `(${pupilName}'s Year)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-textDim dark:text-slate-400">Subject:</span>
                  <select
                    value={selectedSubject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="text-[11px] font-medium px-2 py-1 rounded-lg bg-cardBg text-navy dark:text-white border border-borderMain focus:outline-none focus:border-teal cursor-pointer"
                  >
                    <option value="All Subjects">All Subjects</option>
                    {availableSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit Count & Oak Academy Sync */}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] text-textDim dark:text-slate-400 font-medium">
                    {curriculumUnits.length} {curriculumUnits.length === 1 ? 'unit' : 'units'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSyncOak}
                    disabled={isSyncingOak}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-teal/10 hover:bg-teal/20 text-teal dark:text-teal-300 border border-teal/20 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Ingest / refresh curriculum units from Oak National Academy API"
                  >
                    <RotateCcw className={`w-2.5 h-2.5 ${isSyncingOak ? 'animate-spin' : ''}`} />
                    <span>{isSyncingOak ? 'Syncing...' : 'Oak National API'}</span>
                  </button>
                </div>
              </div>
            )}

            {oakSyncStatus && (
              <div className="text-[11px] px-3 py-1.5 rounded-xl bg-teal/10 text-teal-800 dark:text-teal-200 border border-teal/20 flex items-center justify-between">
                <span>{oakSyncStatus}</span>
                <button
                  type="button"
                  onClick={() => setOakSyncStatus(null)}
                  className="text-textDim hover:text-navy dark:hover:text-white ml-2 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {!isCustomMode ? (
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                <select
                  value={selectedUnitId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="flex-1 min-w-0 w-full text-xs px-3 py-2.5 rounded-xl bg-cardBg text-textMain dark:text-white border border-borderMain focus:outline-none focus:border-teal font-medium truncate"
                >
                  {curriculumUnits.length > 0 ? (
                    curriculumUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        [{u.year_group} · {u.subject}] {u.title} ({u.strand})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No curriculum units match current filters
                    </option>
                  )}
                </select>

                <button
                  type="button"
                  onClick={() => handleGenerate(undefined, undefined, undefined, true)}
                  disabled={loadingPathway}
                  className="w-full md:w-auto flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                  title="Synthesise bespoke scaffolding ladder using NOYA"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${loadingPathway ? 'animate-spin' : ''}`} />
                  <span>{loadingPathway ? '⚡ NOYA is synthesising (~5-8s)...' : '⚡ NOYA'}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Science — States of matter & particle arrangements"
                  className="flex-1 min-w-0 w-full text-xs px-3 py-2.5 rounded-xl bg-cardBg text-textMain dark:text-white border border-borderMain focus:outline-none focus:border-teal font-medium"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGenerate(undefined, undefined, undefined, true);
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleGenerate(undefined, undefined, undefined, true)}
                  disabled={loadingPathway || !customTopic.trim()}
                  className="w-full md:w-auto flex-shrink-0 whitespace-nowrap px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                  title="Synthesise bespoke scaffolding ladder using NOYA"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${loadingPathway ? 'animate-spin' : ''}`} />
                  <span>{loadingPathway ? '⚡ NOYA is synthesising (~5-8s)...' : '⚡ NOYA'}</span>
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
                  onClick={handleResetSteps}
                  className="text-[10px] font-semibold text-textDim hover:text-textMain dark:hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded border border-borderMain/60 hover:bg-cardSubtle transition-all cursor-pointer"
                  title="Reset pathway back to Step 1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset to Step 1</span>
                </button>
                <button
                  type="button"
                  onClick={handleAdvanceStep}
                  className="text-[10px] font-semibold text-teal dark:text-teal-300 hover:underline cursor-pointer flex items-center gap-1"
                  title="Mark current active step complete and advance"
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

                  {/* Scheduled Sensory Token Indicator - Interactive Trigger */}
                  {st.sensory_pause_after && (
                    <div
                      onClick={() => setShowSensoryModal(true)}
                      className="px-3 py-2 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100/90 dark:hover:bg-amber-900/60 rounded-xl border border-dashed border-amber-400 dark:border-amber-700/70 flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-200 cursor-pointer transition-all shadow-xs hover:shadow group select-none"
                      title="Click to launch interactive 2-minute countdown timer and co-regulation guidance"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <BatteryCharging className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                        <div>
                          <span className="font-bold">Scheduled 2-Min Sensory / Movement Token</span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 block sm:inline sm:ml-2 opacity-90">
                            Proactive break before Step 3
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-200/80 dark:bg-amber-800 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                          <span>⚡ Start 2-Min Timer</span>
                          <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
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
            {(() => {
              const lower = currentTopic.toLowerCase();
              const isSimAvailable =
                selectedUnitId === 'maths-graphs' ||
                selectedUnitId === 'maths-fractions' ||
                selectedUnitId === 'english-highwayman' ||
                lower.includes('graph') ||
                lower.includes('slope') ||
                lower.includes('fraction') ||
                lower.includes('highwayman');
              const simKey = lower.includes('fraction')
                ? 'fractions'
                : lower.includes('highwayman')
                ? 'highwayman'
                : 'graphs';

              const activePathwayObj: LessonPathwayResponse = pathway
                ? pathway
                : {
                    child_id: child?.id || '',
                    child_name: pupilName,
                    subject: currentSubject,
                    topic: currentTopic,
                    learning_objective: `Master ${currentTopic} via adapted visual scaffolding`,
                    cognitive_rationale: rationale,
                    steps: steps,
                    ta_briefing: taBriefing,
                    peer_adaptations: peerAdaptations,
                    generated_at: new Date().toISOString(),
                    model_used: 'standard-scaffold',
                  };

              return (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenWorksheet('dynamic', activePathwayObj)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal hover:bg-teal-dark text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                    title="Open full adapted pupil worksheet for this topic"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open Adapted Worksheet</span>
                  </button>

                  {isSimAvailable && (
                    <button
                      type="button"
                      onClick={() => onOpenWorksheet(simKey, activePathwayObj)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-mint-p hover:bg-mint-l text-teal dark:bg-teal-900/40 dark:hover:bg-teal-900/60 dark:text-mint border border-teal/20 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer active:scale-95 transition-all"
                      title="Launch interactive visual simulation sandbox"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal dark:text-mint" />
                      <span>🎮 Interactive Simulation</span>
                    </button>
                  )}
                </>
              );
            })()}

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
          <div className="pt-3 border-t border-borderMain space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-textDim dark:text-slate-400 block">
              Other Room 4 Pupils — Parallel Adapted Routes
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {peerAdaptations.map((p) => (
                <div
                  key={p.name}
                  className="p-2.5 bg-cardSubtle rounded-xl flex items-center justify-between gap-2 border border-borderMain text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${p.color}`}
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

      {/* Sensory Token Regulation Modal */}
      {showSensoryModal && (
        <SensoryTokenModal
          isOpen={showSensoryModal}
          onClose={() => setShowSensoryModal(false)}
          child={child}
          onCompleteReset={handleCompleteSensoryReset}
          targetStepNumber={3}
        />
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
