import React from 'react';
import { UserCheck, Menu, Sparkles } from 'lucide-react';
import { Child } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  title: string;
  subtitle: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  pupils?: Child[];
  selectedChildId?: string;
  overviewLabel?: string;
  onSelectChild?: (childId: string) => void;
  onToggleMobileMenu?: () => void;
  onOpenTour?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  subtitle,
  actionButton,
  pupils,
  selectedChildId,
  overviewLabel,
  onSelectChild,
  onToggleMobileMenu,
  onOpenTour,
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
                    Pupil: {p.full_name || `${p.first_name} ${p.last_name}`} ({p.year_group || 'SEND'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Side: Action Toolbar (Interactive Controls Only) */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          <ThemeToggle />

          {onOpenTour && (
            <button
              onClick={onOpenTour}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cardSubtle hover:bg-slate-200/70 dark:hover:bg-slate-800 text-textMain border border-borderMain text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-2xs"
              title="Open Guided Tour"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse flex-shrink-0" />
              <span className="hidden sm:inline">Tour</span>
            </button>
          )}

          {actionButton && (
            <>
              <div className="hidden sm:block h-5 w-px bg-borderMain mx-0.5" aria-hidden="true" />
              <button
                onClick={actionButton.onClick}
                className="flex items-center gap-1.5 bg-teal hover:bg-teal-medium text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              >
                {actionButton.icon}
                <span className="hidden sm:inline">{actionButton.label}</span>
              </button>
            </>
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

