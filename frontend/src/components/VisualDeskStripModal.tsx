import React, { useEffect } from 'react';
import { X, Printer, ShieldCheck, Sparkles, BatteryCharging } from 'lucide-react';
import { LessonPathwayResponse, Child } from '../types';

interface VisualDeskStripModalProps {
  isOpen: boolean;
  onClose: () => void;
  pathway: LessonPathwayResponse | null;
  child?: Child | null;
}

export const VisualDeskStripModal: React.FC<VisualDeskStripModalProps> = ({
  isOpen,
  onClose,
  pathway,
  child,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !pathway) return null;

  const handlePrint = () => {
    window.print();
  };

  const pupilName = child?.preferred_name || child?.first_name || pathway.child_name || 'Pupil';
  const fullPupilName = child?.full_name || (child ? `${child.first_name} ${child.last_name}` : pathway.child_name);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-navy/80 backdrop-blur-sm print:p-0 print:bg-white print:static print:inset-auto animate-in fade-in duration-200"
    >
      {/* Container Card */}
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none print:m-0 print:max-w-none print:max-h-none print:bg-white print:text-black">
        
        {/* Pinned Action Toolbar (Screen Only) */}
        <div className="flex-shrink-0 z-20 flex items-center justify-between px-5 sm:px-6 py-3.5 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
            <h2 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Printable Visual Desk Strip & Sensory Token</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Desk Strip</span>
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

        {/* Scrollable Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 print:p-0 print:space-y-4 print:overflow-visible">
          
          {/* Header Strip for Desk Placement */}
          <div className="border-b-2 border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-slate-800 print:bg-slate-100 rounded border border-slate-300">
                  {child?.room_name || "Room 4"} · Inclusive Academy
                </span>
                <span className="text-[10px] text-slate-500 font-semibold print:text-black">
                  SEND Tier 2/3 Provision
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-serif text-slate-900 dark:text-white print:text-black mt-1">
                Visual Task Strip — {pathway.topic}
              </h1>
              <div className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-700 font-medium">
                Pupil: <strong>{fullPupilName}</strong> ({child?.year_group || 'Year 5'}) &bull; Subject: <strong>{pathway.subject}</strong>
              </div>
            </div>

            <div className="text-right hidden sm:block print:block">
              <div className="text-[10px] font-mono uppercase text-slate-400">Class Checklist</div>
              <div className="text-xs font-bold text-teal-700 dark:text-teal-400 print:text-black">Dry-Wipe Ready</div>
            </div>
          </div>

          {/* Cognitive Route Rationale (Screen Only) */}
          <div className="p-3 bg-teal-50/60 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-900 text-xs text-slate-700 dark:text-slate-300 print:hidden">
            <span className="font-bold text-teal-800 dark:text-teal-300 block mb-0.5 text-[11px]">
              Cognitive Profile Access Route:
            </span>
            <p className="text-[11px] leading-relaxed">{pathway.cognitive_rationale}</p>
          </div>

          {/* 4-Step Visual Progress Ladder (Print-Optimized) */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 print:text-black flex items-center gap-1.5">
              <span>Step-by-Step Task Ladder</span>
              <span className="text-[10px] font-normal lowercase">(tick each circle as you finish)</span>
            </div>

            <div className="space-y-2.5">
              {pathway.steps.map((st) => (
                <div key={st.number} className="space-y-2">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-slate-300 dark:border-slate-700 print:border-slate-800 print:bg-white flex items-start gap-3.5">
                    {/* Checkbox Target */}
                    <div className="w-7 h-7 rounded-full border-2 border-slate-400 print:border-slate-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 bg-white print:bg-white text-slate-700 print:text-black">
                      {st.number}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black">
                          {st.title}
                        </h3>
                        <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 print:bg-slate-100 border border-slate-200 dark:border-slate-700 print:border-slate-400 text-slate-600 dark:text-slate-300 print:text-black flex-shrink-0">
                          {st.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 print:text-slate-800 mt-1 leading-relaxed font-sans">
                        {st.description}
                      </p>
                    </div>

                    {/* Dry-Wipe Box */}
                    <div className="w-6 h-6 rounded-lg border-2 border-dashed border-slate-400 print:border-slate-700 flex items-center justify-center text-[9px] text-slate-400 print:text-slate-500 flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                  </div>

                  {/* Scheduled Sensory Reset Token (Between Step 2 and 3) */}
                  {st.sensory_pause_after && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 print:border-slate-800 print:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-200 dark:bg-amber-900/60 print:bg-slate-200 flex items-center justify-center font-bold text-amber-800 dark:text-amber-200 print:text-black text-xs">
                          <BatteryCharging className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-amber-900 dark:text-amber-200 print:text-black text-[11px]">
                            Proactive 2-Minute Sensory Token
                          </div>
                          <div className="text-[10px] text-amber-700 dark:text-amber-300 print:text-slate-600">
                            Pause &bull; Sip water &bull; Deep pressure movement or noise-defender break before Step 3
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200/80 dark:bg-amber-900/60 print:bg-slate-200 text-amber-900 dark:text-amber-200 print:text-black rounded">
                        TA Verified [ ]
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 1:1 Teaching Assistant Quick Protocol */}
          <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 print:border-slate-400 print:bg-white text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 print:text-black text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>1:1 TA Scaffolding Protocol ({pupilName})</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 print:text-slate-800 leading-relaxed">
              {pathway.ta_briefing}
            </p>
          </div>

          {/* Cut-Out Sensory Break Token (Print Footer) */}
          <div className="pt-3 border-t-2 border-dashed border-slate-300 print:border-slate-400 flex items-center justify-between text-[10px] text-slate-400 print:text-slate-600">
            <span>✂ Cut along dashed line to place on desk</span>
            <span>Generated via SeeMyMind &bull; SEND Code of Practice CoP 6.44-6.56</span>
          </div>

        </div>
      </div>
    </div>
  );
};
