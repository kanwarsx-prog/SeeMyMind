import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  Sparkles,
  Sliders,
  BookOpen,
  CheckSquare,
  Square,
  ShieldCheck,
  BatteryCharging,
  Compass,
} from 'lucide-react';
import { LessonPathwayResponse, PathwayStep } from '../types';

interface WorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWorksheet?: string;
  pathwayData?: LessonPathwayResponse | null;
  childName?: string;
  onCompleteStep?: (worksheetTitle: string, details: string) => Promise<void>;
}

export const WorksheetModal: React.FC<WorksheetModalProps> = ({
  isOpen,
  onClose,
  initialWorksheet = 'graphs',
  pathwayData,
  childName = 'Phoenix',
  onCompleteStep,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialWorksheet);

  // Maths Graphs state
  const [rise, setRise] = useState<number>(6);
  const [run, setRun] = useState<number>(2);
  const [savedNote, setSavedNote] = useState<string>('For every 1 step right, the game character jumps 3 blocks up! Gradient = 3.');
  const [stepCompleted, setStepCompleted] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Fractions state
  const [fractionDenominator, setFractionDenominator] = useState<number>(4);
  const [fractionNumerator, setFractionNumerator] = useState<number>(3);

  // Dynamic Pathway Worksheet state
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({ 1: true });
  const [pupilNotes, setPupilNotes] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    if (initialWorksheet === 'dynamic' || (!['graphs', 'highwayman', 'fractions'].includes(initialWorksheet) && pathwayData)) {
      setActiveTab('dynamic');
    } else if (['graphs', 'highwayman', 'fractions'].includes(initialWorksheet)) {
      setActiveTab(initialWorksheet);
    } else if (pathwayData) {
      setActiveTab('dynamic');
    } else {
      setActiveTab('graphs');
    }

    if (pathwayData) {
      setPupilNotes(
        `${childName}'s findings: Connected the visual concepts to concrete real-world models with zero cognitive fatigue.`
      );
    }
  }, [isOpen, initialWorksheet, pathwayData, childName]);

  if (!isOpen) return null;

  const gradient = run > 0 ? (rise / run).toFixed(1).replace(/\.0$/, '') : '0';

  const toggleStep = (stepNumber: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const handleSaveProgress = async () => {
    if (!onCompleteStep) return;
    setSaving(true);
    try {
      if (activeTab === 'graphs') {
        await onCompleteStep(
          'Maths Worksheet Milestone: Visual Gradient Calculated',
          `${childName} calculated gradient = ${gradient} (Rise ${rise} ÷ Run ${run}) independently using the game slope simulation.`
        );
      } else if (activeTab === 'highwayman') {
        await onCompleteStep(
          'English Worksheet Milestone: Visual Inference Completed',
          `${childName} completed the Ghost Galleon visual scene deduction for The Highwayman.`
        );
      } else if (activeTab === 'fractions') {
        await onCompleteStep(
          'Fractions Milestone: Bar Model Visualisation',
          `${childName} matched ${fractionNumerator}/${fractionDenominator} using the interactive fraction bar.`
        );
      } else {
        const topicTitle = pathwayData?.topic || 'Adapted Lesson';
        const checkedCount = Object.values(checkedSteps).filter(Boolean).length;
        const totalSteps = pathwayData?.steps?.length || 4;
        await onCompleteStep(
          `${topicTitle} Milestone: Adapted Pathway Completed`,
          `${childName} completed the chunked visual pathway for ${topicTitle} (${checkedCount}/${totalSteps} steps completed). Notes: "${pupilNotes}"`
        );
      }
      setStepCompleted(true);
      setTimeout(() => setStepCompleted(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const topicLower = (pathwayData?.topic || '').toLowerCase();
  const isRainforest =
    topicLower.includes('rain') ||
    topicLower.includes('forest') ||
    topicLower.includes('geography') ||
    topicLower.includes('biome') ||
    topicLower.includes('ecosystem');
  const isCircuits =
    topicLower.includes('circuit') ||
    topicLower.includes('electricity') ||
    topicLower.includes('conductor');
  const isSaxons =
    topicLower.includes('saxon') ||
    topicLower.includes('history') ||
    topicLower.includes('settlement') ||
    topicLower.includes('artifact');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-navy/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100">
        {/* Modal Top Bar */}
        <div className="bg-navy px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between text-white flex-shrink-0 print:bg-slate-900">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <h2 className="font-serif text-base sm:text-lg font-bold text-white">
                {activeTab === 'dynamic' && pathwayData
                  ? `${pathwayData.subject ? `${pathwayData.subject} - ` : ''}${pathwayData.topic}`
                  : activeTab === 'graphs'
                  ? 'Maths - Straight Line Graphs'
                  : activeTab === 'highwayman'
                  ? 'English - The Highwayman Inference'
                  : 'Maths - Fractions Visual Mastery'}
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-white/70 mt-0.5">
              Adapted visual-spatial route for {childName} · SEND Graduated Provision
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              title="Close window (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2 flex-shrink-0 overflow-x-auto print:hidden">
          {pathwayData && (
            <button
              type="button"
              onClick={() => setActiveTab('dynamic')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'dynamic'
                  ? 'bg-teal text-white shadow-xs'
                  : 'text-gray-600 hover:text-navy hover:bg-gray-200/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>📄 {pathwayData.topic} (Adapted Worksheet)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('graphs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'graphs'
                ? 'bg-teal text-white shadow-xs'
                : 'text-gray-600 hover:text-navy hover:bg-gray-200/60'
            }`}
          >
            <span>📐 Maths: Graphs Sim</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fractions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'fractions'
                ? 'bg-amber-dark text-white shadow-xs'
                : 'text-gray-600 hover:text-navy hover:bg-gray-200/60'
            }`}
          >
            <span>🍕 Fractions Sim</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('highwayman')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'highwayman'
                ? 'bg-purple-dark text-white shadow-xs'
                : 'text-gray-600 hover:text-navy hover:bg-gray-200/60'
            }`}
          >
            <span>📖 Highwayman Sim</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 print:p-6 print:overflow-visible">
          {/* TAB 1: DYNAMIC ADAPTED WORKSHEET FOR ANY TOPIC */}
          {activeTab === 'dynamic' && pathwayData && (
            <div className="space-y-5">
              {/* Objective & Rationale Banner */}
              <div className="p-4 bg-mint-pale/50 border border-mint rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-teal">
                  <Sparkles className="w-4 h-4 text-teal" />
                  <span>Curriculum Objective:</span>
                  <span className="text-navy font-semibold">{pathwayData.learning_objective}</span>
                </div>
                <p className="text-xs text-navy/80 leading-relaxed">
                  <strong className="text-teal font-semibold">Adapted Scaffolding Route: </strong>
                  {pathwayData.cognitive_rationale}
                </p>
              </div>

              {/* 4-Step Scaffolding Progression Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-navy">
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-teal" />
                    <span>Step-by-Step Task Ladder (Tick off as you complete each stage):</span>
                  </span>
                  <span className="text-[11px] font-normal text-gray-500">
                    {Object.values(checkedSteps).filter(Boolean).length} of {pathwayData.steps?.length || 4} steps complete
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {pathwayData.steps?.map((step: PathwayStep) => {
                    const isChecked = !!checkedSteps[step.number];
                    return (
                      <div key={step.number} className="space-y-2">
                        <div
                          onClick={() => toggleStep(step.number)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            isChecked
                              ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/20'
                              : 'bg-white border-gray-200 hover:border-teal/50'
                          }`}
                        >
                          <div className="mt-0.5 flex-shrink-0 text-teal">
                            {isChecked ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4
                                className={`text-xs font-bold ${
                                  isChecked ? 'line-through text-gray-500' : 'text-navy'
                                }`}
                              >
                                {step.title}
                              </h4>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                  isChecked
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {isChecked ? '✓ Done' : step.badge || `Step ${step.number}`}
                              </span>
                            </div>
                            <p
                              className={`text-[11px] leading-relaxed mt-1 ${
                                isChecked ? 'text-gray-400' : 'text-gray-700'
                              }`}
                            >
                              {step.description}
                            </p>
                          </div>
                        </div>

                        {/* Sensory Pause Reminder if configured after this step */}
                        {step.sensory_pause_after && (
                          <div className="mx-2 p-2.5 bg-mint-pale/80 border border-teal/30 rounded-xl flex items-center gap-2 text-xs text-teal font-medium">
                            <BatteryCharging className="w-4 h-4 text-teal flex-shrink-0" />
                            <span>
                              <strong>2-Minute Sensory Token Pause: </strong>
                              Stretch, drink water, or take 5 deep breaths before moving to Step {step.number + 1}.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subject Visual Anchor Diagram */}
              {isRainforest && (
                <div className="card p-4 space-y-3 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/20 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-mint flex items-center gap-1.5">
                      <span>🌿 Visual Diagram: 4 Layers of the Tropical Rainforest Biome</span>
                    </span>
                    <span className="text-[10px] text-white/60">Draw or label on your desk sheet</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div className="p-3 bg-white/10 rounded-xl space-y-1 border border-white/15">
                      <div className="font-bold text-amber-300">🦅 1. Emergent (40m+)</div>
                      <p className="text-[10px] text-white/80 leading-relaxed">
                        Giant trees above canopy. High sunlight & wind. Harpy eagles, bats, butterflies.
                      </p>
                    </div>

                    <div className="p-3 bg-white/15 rounded-xl space-y-1 border border-emerald-400/30">
                      <div className="font-bold text-emerald-300">🐒 2. Canopy (30m)</div>
                      <p className="text-[10px] text-white/80 leading-relaxed">
                        Dense roof of leaves. 90% of all rainforest life! Spider monkeys, toucans, orchids.
                      </p>
                    </div>

                    <div className="p-3 bg-white/10 rounded-xl space-y-1 border border-white/15">
                      <div className="font-bold text-teal-300">🐆 3. Understory (15m)</div>
                      <p className="text-[10px] text-white/80 leading-relaxed">
                        Filtered light, large broad leaves. Jaguars, tree frogs, snakes, mosses.
                      </p>
                    </div>

                    <div className="p-3 bg-white/10 rounded-xl space-y-1 border border-white/15">
                      <div className="font-bold text-amber-200">🐜 4. Forest Floor (0m)</div>
                      <p className="text-[10px] text-white/80 leading-relaxed">
                        Dark, humid, rapid fungi decomposition. Anteaters, tapirs, leaf-cutter ants.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isCircuits && (
                <div className="card p-4 space-y-3 bg-[#1A2E3B] text-white rounded-2xl shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/20 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <span>⚡ Visual Diagram: Continuous Electrical Circuit Loop</span>
                    </span>
                    <span className="text-[10px] text-white/60">Closed loop required for electron flow</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                    <div className="p-3 bg-white/10 rounded-xl space-y-1 border border-amber-400/30">
                      <div className="font-bold text-amber-300">🔋 Power Source (Cell/Battery)</div>
                      <p className="text-[10px] text-white/80 leading-relaxed">
                        Provides potential difference (voltage) that pushes electrons along the copper path.
                      </p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-xl space-y-1 border border-white/15">
                      <div className="font-bold text-mint">🔌 Control (Switch)</div>
                      <p className="text-[10px] text-white/80 leading-relaxed">
                        Open = break in circuit (current stops). Closed = complete bridge (current flows).
                      </p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-xl space-y-1 border border-amber-400/30">
                      <div className="font-bold text-amber-300">💡 Output (Bulb / Lamp)</div>
                      <p className="text-[10px] text-white/80 leading-relaxed">
                        Converts electrical energy into visible light and thermal energy when loop is complete.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isSaxons && (
                <div className="card p-4 space-y-3 bg-amber-950 text-amber-100 rounded-2xl shadow-inner border border-amber-800">
                  <div className="flex items-center justify-between border-b border-amber-800/60 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      📜 Historical Artifact & Settlement Evidence Deduction
                    </span>
                    <span className="text-[10px] text-amber-300/70">Visual evidence before writing</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                    <div className="p-3 bg-black/30 rounded-xl space-y-1 border border-amber-700/40">
                      <div className="font-bold text-amber-300">🪙 1. The Physical Clue</div>
                      <p className="text-[10px] text-amber-200/80 leading-relaxed">
                        Intricate gilt-bronze brooches and clay loom weights unearthed near the river bank.
                      </p>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl space-y-1 border border-amber-700/40">
                      <div className="font-bold text-amber-300">🏠 2. Settlement Geography</div>
                      <p className="text-[10px] text-amber-200/80 leading-relaxed">
                        Close to fresh drinking water and fertile floodplains, surrounded by timber woodlands.
                      </p>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl space-y-1 border border-amber-700/40">
                      <div className="font-bold text-amber-300">💡 3. What We Deduce</div>
                      <p className="text-[10px] text-amber-200/80 leading-relaxed">
                        Skilled metalworkers and weavers living in self-reliant farming and trading hamlets.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!isRainforest && !isCircuits && !isSaxons && (
                <div className="card p-4 space-y-2.5 bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-teal" />
                      <span>Visual Scaffolding & Concept Sketchpad</span>
                    </span>
                    <span className="text-[10px] text-gray-500">Draw first · notation second</span>
                  </div>
                  <div className="h-28 rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-center p-3">
                    <span className="text-2xl mb-1">🎨✏️</span>
                    <span className="text-xs font-semibold text-gray-600">
                      Draw your diagram, mind-map, or visual cue for {pathwayData.topic} here
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      Visualizing the core relationship removes working memory friction
                    </span>
                  </div>
                </div>
              )}

              {/* Pupil Reflection / Scribe Field */}
              <div className="card p-4 space-y-2">
                <label className="text-xs font-bold text-navy block">
                  {childName}'s Working Notes & Explanation (In their own words or TA scribe):
                </label>
                <textarea
                  rows={2}
                  value={pupilNotes}
                  onChange={(e) => setPupilNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal"
                  placeholder="e.g. Phoenix explained that the emergent layer gets the most sunlight, so the trees grow super tall..."
                />
              </div>

              {/* 1:1 TA Briefing Callout */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-gray-600">
                <ShieldCheck className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-navy">1:1 TA Support Protocol: </span>
                  {pathwayData.ta_briefing}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'graphs' && (
            <div className="space-y-5">
              {/* Adaptation Note */}
              <div className="p-3 bg-mint-pale/60 border border-mint rounded-2xl flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                <div className="text-xs text-navy/80 leading-relaxed">
                  <span className="font-bold text-teal">Adapted Methodology: </span>
                  Rather than starting with abstract $y = mx + c$, Phoenix interacts with a game slope. He visualizes the character ascending a platform. <strong>Draw first, equation second.</strong>
                </div>
              </div>

              {/* Interactive Game Level Slope Visualizer */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* SVG Visual Canvas */}
                <div className="md:col-span-7 bg-[#1A2E3B] rounded-2xl p-4 flex flex-col items-center justify-center text-white relative shadow-inner min-h-[260px]">
                  <div className="absolute top-3 left-3 text-[10px] text-white/50 uppercase tracking-widest font-mono">
                    Game Level Slope Simulator · Grid (X, Y)
                  </div>

                  {/* SVG Coordinate Grid & Character Slope */}
                  <svg viewBox="0 0 300 200" className="w-full h-48 max-w-[340px]">
                    {/* Grid Lines */}
                    <defs>
                      <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="300" height="200" fill="url(#grid)" />

                    {/* Axes */}
                    <line x1="40" y1="170" x2="280" y2="170" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                    <line x1="40" y1="170" x2="40" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />

                    {/* Slope Triangle */}
                    {/* (40, 170) to (40 + run*25, 170) to (40 + run*25, 170 - rise*15) */}
                    {(() => {
                      const startX = 40;
                      const startY = 170;
                      const endX = Math.min(270, startX + run * 30);
                      const endY = Math.max(30, startY - rise * 15);
                      return (
                        <g>
                          {/* Triangle Area */}
                          <polygon
                            points={`${startX},${startY} ${endX},${startY} ${endX},${endY}`}
                            fill="rgba(158, 207, 196, 0.2)"
                            stroke="rgba(158, 207, 196, 0.4)"
                            strokeDasharray="4 2"
                          />
                          {/* Run line (horizontal) */}
                          <line x1={startX} y1={startY} x2={endX} y2={startY} stroke="#F5C77E" strokeWidth="3" />
                          <text x={(startX + endX) / 2} y={startY + 15} fill="#F5C77E" fontSize="11" textAnchor="middle" fontWeight="bold">
                            Run: {run}
                          </text>

                          {/* Rise line (vertical) */}
                          <line x1={endX} y1={startY} x2={endX} y2={endY} stroke="#F4A89A" strokeWidth="3" />
                          <text x={endX + 15} y={(startY + endY) / 2 + 4} fill="#F4A89A" fontSize="11" textAnchor="start" fontWeight="bold">
                            Rise: {rise}
                          </text>

                          {/* Hypotenuse / Slope */}
                          <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="#9ECFC4" strokeWidth="4" strokeLinecap="round" />

                          {/* Game Character Emoji at Top of Slope */}
                          <text x={endX - 8} y={endY - 6} fontSize="18">
                            🧗
                          </text>
                          <text x={startX - 10} y={startY + 4} fontSize="12" fill="white">
                            (0,0)
                          </text>
                        </g>
                      );
                    })()}
                  </svg>

                  <div className="mt-2 text-center text-xs font-mono text-mint">
                    Gradient = Rise ÷ Run = {rise} ÷ {run} = <strong className="text-white text-sm">{gradient}</strong>
                  </div>
                </div>

                {/* Controls & Math Breakdown */}
                <div className="md:col-span-5 space-y-4">
                  <div className="card p-4 space-y-3 bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
                      <Sliders className="w-3.5 h-3.5 text-teal" />
                      <span>Adjust Game Slope Parameters</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Rise (Vertical Height): <strong>{rise} blocks</strong></span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={rise}
                        onChange={(e) => setRise(Number(e.target.value))}
                        className="w-full accent-teal cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Run (Horizontal Distance): <strong>{run} blocks</strong></span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="6"
                        value={run}
                        onChange={(e) => setRun(Number(e.target.value))}
                        className="w-full accent-amber-dark cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Mathematical Emergence Box */}
                  <div className="card p-4 space-y-2 border-l-4 border-l-teal bg-white">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-teal">
                      The Algebraic Rule Emerges
                    </div>
                    <div className="text-sm font-bold text-navy">
                      Formula: y = {gradient}x
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      Because the line starts at (0,0) and rises by {gradient} for every 1 step along, we write <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-teal">y = {gradient}x</code>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pupil Response / Notes Field */}
              <div className="card p-4 space-y-2">
                <label className="text-xs font-bold text-navy block">
                  Phoenix's Visual Explanation in His Own Words:
                </label>
                <textarea
                  rows={2}
                  value={savedNote}
                  onChange={(e) => setSavedNote(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal"
                />
              </div>
            </div>
          )}

          {activeTab === 'highwayman' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-light/30 border border-purple-light rounded-2xl flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-purple-dark flex-shrink-0 mt-0.5" />
                <div className="text-xs text-navy/80 leading-relaxed">
                  <span className="font-bold text-purple-dark">Detective Method: </span>
                  Instead of writing long paragraphs, draw the metaphor scene first to unlock inference.
                </div>
              </div>

              {/* Text Clue Excerpt */}
              <div className="p-4 bg-gray-900 text-white rounded-2xl space-y-2 font-serif italic text-sm">
                <p>"The wind was a torrent of darkness among the gusty trees,</p>
                <p>The moon was a ghostly galleon tossed upon cloudy seas..."</p>
                <div className="text-[10px] text-white/50 font-sans not-italic pt-1">- Alfred Noyes, The Highwayman</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-4 space-y-2 border-dashed border-2 border-gray-300 bg-gray-50/50 flex flex-col items-center justify-center text-center min-h-[160px]">
                  <span className="text-3xl">⛵☁️</span>
                  <div className="text-xs font-bold text-navy">Visual Scene Anchor</div>
                  <p className="text-[11px] text-gray-500">
                    A ship bouncing on stormy waves of dark clouds in the night sky.
                  </p>
                </div>

                <div className="card p-4 space-y-2">
                  <div className="text-xs font-bold text-navy">Detective Deduction:</div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong>Question:</strong> What mood does the poet create?
                  </p>
                  <p className="text-xs text-teal font-medium bg-mint-pale/50 p-2.5 rounded-xl border border-mint/40">
                    "Ominous, eerie, and restless - the clouds look like turbulent sea waves, making the scene feel dangerous before the highwayman arrives."
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fractions' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-light/30 border border-amber/50 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-dark flex-shrink-0 mt-0.5" />
                <div className="text-xs text-navy/80 leading-relaxed">
                  <span className="font-bold text-amber-dark">Home Practice (Visual Mastery): </span>
                  Bar models and pizza slices help visualize fractions without numerical confusion.
                </div>
              </div>

              <div className="card p-5 space-y-4 bg-gray-50 border border-gray-200">
                <div className="text-xs font-bold text-navy">Visual Fraction Bar ({fractionNumerator}/{fractionDenominator})</div>

                {/* Interactive Bar */}
                <div className="h-10 w-full bg-white rounded-xl border border-gray-300 overflow-hidden flex">
                  {Array.from({ length: fractionDenominator }).map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setFractionNumerator(i + 1)}
                      className={`flex-1 border-r border-gray-200 last:border-r-0 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                        i < fractionNumerator
                          ? 'bg-amber-dark text-white'
                          : 'bg-white text-gray-400 hover:bg-amber-50'
                      }`}
                    >
                      1/{fractionDenominator}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-600">
                  <span>Change Parts:</span>
                  {[2, 3, 4, 6, 8].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setFractionDenominator(d);
                        setFractionNumerator(Math.min(fractionNumerator, d));
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold ${
                        fractionDenominator === d ? 'bg-navy text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {d}ths
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-gray-500 text-center sm:text-left">
            {stepCompleted ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1 justify-center sm:justify-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Progress saved to {childName}'s timeline & shared with parents!</span>
              </span>
            ) : (
              <span>Completing steps automatically updates {childName}'s strengths profile.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleSaveProgress}
              disabled={saving}
              className="flex-1 sm:flex-none px-4 py-2 bg-teal hover:bg-teal-medium text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-mint" />
              <span>{saving ? 'Saving...' : 'Mark Step Complete & Log Win'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
