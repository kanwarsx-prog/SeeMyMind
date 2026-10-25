import React from 'react';
import { UserCheck, Menu, Sparkles } from 'lucide-react';
import { Child } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  title: string;
  subtitle: string;
  pills?: { label: string; color: 'red' | 'amber' | 'gold' | 'green' | 'teal' | 'purple' | 'indigo' }[];
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
  pills = [],
  actionButton,
  pupils,
  selectedChildId,
  overviewLabel,
  onSelectChild,
  onToggleMobileMenu,
  onOpenTour,
}) => {
  const pillColors = {
    red: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900',
    amber: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
    gold: 'bg-amber-50 text-[#7A5A00] border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900',
    teal: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-900',
    purple: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900',
    indigo: 'bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900',
  };

  return (
    <header className="sticky top-0 z-20 bg-topbar border-b border-borderMain px-3.5 sm:px-7 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 shadow-xs transition-colors duration-200">
      {/* Context Zone: Identity, Title, Subtitle, Dropdown, and Passive Badges */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3.5 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 -ml-1 rounded-xl text-textHead hover:bg-cardSubtle flex items-center justify-center cursor-pointer transition-colors flex-shrink-0"
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

        {pupils && pupils.length > 1 && onSelectChild && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cardSubtle border border-borderMain">
            <UserCheck className="w-3.5 h-3.5 text-teal flex-shrink-0" />
            <select
              value={selectedChildId}
              onChange={(e) => onSelectChild(e.target.value)}
              className="text-xs font-semibold text-textMain bg-transparent border-none focus:outline-none cursor-pointer max-w-[140px] sm:max-w-none truncate"
            >
              {overviewLabel && (
                <option value="overview" className="bg-cardBg text-textMain font-bold">
                  {overviewLabel}
                </option>
              )}
              {pupils.map((p) => (
                <option key={p.id} value={p.id} className="bg-cardBg text-textMain">
                  Pupil: {p.full_name || `${p.first_name} ${p.last_name}`} ({p.year_group || 'SEND'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Informational Context Badges (distinct tag styling, non-clickable) */}
        {pills.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 flex-wrap">
            {pills.map((p, idx) => (
              <span
                key={idx}
                className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md whitespace-nowrap select-none cursor-default border ${
                  pillColors[p.color]
                }`}
              >
                {p.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Toolbar: Strictly interactive controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        {/* Theme Mode Toggle (☀️ / 🌙) */}
        <ThemeToggle />

        {/* Tour Guided Walkthrough */}
        {onOpenTour && (
          <button
            onClick={onOpenTour}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cardSubtle hover:bg-slate-200/70 dark:hover:bg-slate-800 text-textMain border border-borderMain text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-2xs"
            title="Open Guided Tour"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse flex-shrink-0" />
            <span>Tour</span>
          </button>
        )}

        {/* Primary Action Button */}
        {actionButton && (
          <>
            <div className="h-5 w-px bg-borderMain mx-0.5" aria-hidden="true" />
            <button
              onClick={actionButton.onClick}
              className="flex items-center gap-1.5 bg-teal hover:bg-teal-medium text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
            >
              {actionButton.icon}
              <span>{actionButton.label}</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

