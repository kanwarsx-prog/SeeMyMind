import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, Sparkles } from 'lucide-react';

interface AbcTooltipProps {
  variant?: 'icon' | 'badge' | 'banner';
  align?: 'left' | 'right';
  className?: string;
}

export const AbcTooltip: React.FC<AbcTooltipProps> = ({
  variant = 'icon',
  align = 'left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (variant === 'banner') {
    return (
      <div className={`p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 text-navy ${className}`}>
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-teal shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs">
            <div className="font-bold text-navy flex items-center gap-1.5">
              <span>What is an ABC Incident Log?</span>
              <span className="text-[10px] bg-teal/10 text-teal px-1.5 py-0.5 rounded-full font-medium">
                SEND Practice
              </span>
            </div>
            <p className="text-gray-600 leading-relaxed text-[11px]">
              A non-punitive, evidence-based framework used by schools and Educational Psychologists to understand behaviour as communication:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded-lg bg-white border border-blue-100">
                <span className="font-bold text-amber-700 block">A · Trigger</span>
                <span className="text-gray-500">What happened right before? (Noise, sudden change, demand).</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-blue-100">
                <span className="font-bold text-rose-700 block">B · Reaction</span>
                <span className="text-gray-500">Observable response (covering ears, crying, leaving room).</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-blue-100">
                <span className="font-bold text-emerald-700 block">C · Support Given</span>
                <span className="text-gray-500">How staff helped (ear defenders, quiet space, outcome).</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {variant === 'badge' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 text-teal text-[10px] font-bold border border-blue-200/60 cursor-pointer transition-colors"
          aria-expanded={isOpen}
          aria-label="What is ABC incident logging?"
        >
          <span>ABC Framework</span>
          <HelpCircle className="w-3 h-3 text-teal" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-full text-gray-400 hover:text-navy hover:bg-gray-100 transition-colors cursor-pointer inline-flex items-center justify-center"
          aria-expanded={isOpen}
          aria-label="Learn about ABC incident logging"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Tooltip Popover */}
      {isOpen && (
        <div
          role="tooltip"
          className={`absolute z-50 bottom-full mb-2 w-76 sm:w-80 p-3.5 bg-white rounded-2xl shadow-xl border border-gray-200/80 text-left transition-all animate-in fade-in zoom-in-95 ${
            align === 'right' ? 'right-0' : 'left-0 sm:left-auto sm:-translate-x-1/4'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal" />
              <span className="font-bold text-xs text-navy">What is an ABC Incident?</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-teal bg-teal/10 px-1.5 py-0.5 rounded-md">
              SEND Standard
            </span>
          </div>

          <p className="text-[11px] text-gray-600 mb-2.5 leading-snug">
            Used by UK schools and Educational Psychologists to analyze distress without assigning blame:
          </p>

          {/* 3 Step Breakdown */}
          <div className="space-y-1.5 text-[11px]">
            <div className="p-1.5 rounded-lg bg-amber-50/80 border border-amber-200/60 flex items-start gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900 font-bold text-[10px] shrink-0">
                A
              </span>
              <div>
                <strong className="text-amber-950 font-semibold">Trigger: </strong>
                <span className="text-gray-600">What happened right before (noise, sudden shift, demand).</span>
              </div>
            </div>

            <div className="p-1.5 rounded-lg bg-rose-50/80 border border-rose-200/60 flex items-start gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-rose-200/70 text-rose-900 font-bold text-[10px] shrink-0">
                B
              </span>
              <div>
                <strong className="text-rose-950 font-semibold">Reaction: </strong>
                <span className="text-gray-600">Factual description of what the pupil did or expressed.</span>
              </div>
            </div>

            <div className="p-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200/60 flex items-start gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-emerald-200/70 text-emerald-900 font-bold text-[10px] shrink-0">
                C
              </span>
              <div>
                <strong className="text-emerald-950 font-semibold">Support Given: </strong>
                <span className="text-gray-600">How staff helped the pupil settle, and the outcome.</span>
              </div>
            </div>
          </div>

          {/* Golden Rule Note */}
          <div className="mt-2.5 pt-2 border-t border-gray-100 text-[10px] text-gray-500 leading-tight">
            💡 <strong className="text-navy font-semibold">Key Principle:</strong> Behaviour is communication. ABC data pinpoints environmental patterns for statutory EHCP evidence.
          </div>
        </div>
      )}
    </div>
  );
};
