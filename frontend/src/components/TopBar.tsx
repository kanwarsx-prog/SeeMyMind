import React from 'react';
import { UserCheck, Menu, ShieldCheck, Sparkles } from 'lucide-react';
import { Child } from '../types';

interface TopBarProps {
  title: string;
  subtitle: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  onOpenAIAudit?: () => void;
  onToggleCopilot?: () => void;
  isCopilotOpen?: boolean;
  pupils?: Child[];
  selectedChildId?: string;
  overviewLabel?: string;
  onSelectChild?: (childId: string) => void;
  onToggleMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  actionButton,
  onOpenAIAudit,
  onToggleCopilot,
  isCopilotOpen,
  pupils,
  selectedChildId,
  overviewLabel,
  onSelectChild,
  onToggleMobileMenu,
}) => {
  const hasPupilsSelector = Boolean(pupils && pupils.length > 1 && onSelectChild);

  return (
    <header className="sticky top-0 z-20 bg-topbar border-b border-borderMain px-3.5 sm:px-7 py-2.5 sm:py-3 shadow-xs transition-colors duration-200">
      {/* Top Primary Bar */}
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Side: Mobile Menu + Title & Subtitle + Desktop Pupil Selector */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-1.5 -ml-1 rounded-xl text-textHead hover:bg-cardSubtle flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
              title="Open menu"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-textHead" />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-semibold text-textHead tracking-tight truncate">{title}</h1>
            <p className="text-[11px] sm:text-xs text-textDim font-normal truncate">{subtitle}</p>
          </div>

          {/* Desktop/Tablet Pupil / Room Selector */}
          {hasPupilsSelector && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cardSubtle border border-borderMain flex-shrink-0">
              <UserCheck className="w-3.5 h-3.5 text-teal flex-shrink-0" />
              <select
                value={selectedChildId}
                onChange={(e) => onSelectChild!(e.target.value)}
                className="text-xs font-semibold text-textMain bg-transparent border-none focus:outline-none cursor-pointer max-w-[170px] lg:max-w-none truncate"
              >
                {overviewLabel && (
                  <option value="overview" className="bg-cardBg text-textMain font-bold">
                    {overviewLabel}
                  </option>
                )}
                {pupils!.map((p) => (
                  <option key={p.id} value={p.id} className="bg-cardBg text-textMain">
                    {p.full_name || `${p.first_name} ${p.last_name}`} ({p.year_group || 'SEND'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Side: Primary Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onToggleCopilot && (
            <button
              onClick={onToggleCopilot}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                isCopilotOpen
                  ? 'bg-teal text-white ring-2 ring-teal/30 shadow-sm'
                  : 'bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal dark:text-teal-300 border border-teal-200 dark:border-teal-800'
              }`}
              title="Ask NOYA"
            >
              <Sparkles className={`w-4 h-4 ${isCopilotOpen ? 'text-amber-300' : 'text-teal animate-pulse'}`} />
              <span>✨ Ask NOYA</span>
            </button>
          )}

          {onOpenAIAudit && (
            <button
              onClick={onOpenAIAudit}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Inspect NOYA AI Transparency & API Audit Logs"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="hidden md:inline font-bold">🛡️ AI Audit Log</span>
              <span className="md:hidden font-bold">AI Logs</span>
            </button>
          )}

          {actionButton && (
            <button
              onClick={actionButton.onClick}
              className="flex items-center gap-1.5 bg-teal hover:bg-teal-medium text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0"
            >
              {actionButton.icon}
              <span className="hidden sm:inline">{actionButton.label}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Pupil Selector Row: Only shown on small mobile screens (< sm) */}
      {hasPupilsSelector && (
        <div className="flex sm:hidden items-center gap-1.5 pt-2 mt-1.5 border-t border-borderMain/60">
          <div className="w-full flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cardSubtle border border-borderMain">
            <UserCheck className="w-3.5 h-3.5 text-teal flex-shrink-0" />
            <select
              value={selectedChildId}
              onChange={(e) => onSelectChild!(e.target.value)}
              className="w-full text-xs font-semibold text-textMain bg-transparent border-none focus:outline-none cursor-pointer truncate"
            >
              {overviewLabel && (
                <option value="overview" className="bg-cardBg text-textMain font-bold">
                  {overviewLabel}
                </option>
              )}
              {pupils!.map((p) => (
                <option key={p.id} value={p.id} className="bg-cardBg text-textMain">
                  {p.full_name || `${p.first_name} ${p.last_name}`} ({p.year_group || 'SEND'})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
};

