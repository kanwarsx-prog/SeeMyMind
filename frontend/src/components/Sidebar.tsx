import React, { useState } from 'react';
import { RoleView, UserProfile } from '../types';
import { ThemeToggle } from './ThemeToggle';
import {
  Sparkles,
  GraduationCap,
  ShieldCheck,
  HeartHandshake,
  User,
  Users,
  LogOut,
  Repeat,
  FileText,
  Clock,
  BookOpen,
  Award,
  Sun,
  Layers,
  Pill,
  X,
  Building2,
  BarChart3,
  Target,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: any;
  action?: () => void;
}

interface PersonaInfo {
  av: string;
  name: string;
  roleTitle: string;
  sub: string;
  bg: string;
  icon: any;
  navItems: NavItem[];
}

interface SidebarProps {
  activeView: RoleView;
  currentUser?: UserProfile | null;
  activeNavId?: string;
  onSelectNav?: (navId: string) => void;
  onLogout: () => void;
  onSwitchPersona: () => void;
  onRegisterChild?: () => void;
  onOpenWorksheet?: (key: string) => void;
  onOpenObservationModal?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isSidebarHidden?: boolean;
  onToggleSidebar?: () => void;
  onOpenTour?: () => void;
  onOpenAIAudit?: () => void;
  teacherRoom?: string;
  teacherYearGroup?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  currentUser,
  activeNavId,
  onSelectNav,
  onLogout,
  onSwitchPersona,
  onRegisterChild,
  onOpenWorksheet,
  onOpenObservationModal,
  isMobileOpen = false,
  onCloseMobile,
  isSidebarHidden = false,
  onToggleSidebar,
  onOpenTour,
  onOpenAIAudit,
  teacherRoom,
  teacherYearGroup,
}) => {
  const scrollTo = (id: string) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const personaDict: Record<RoleView, PersonaInfo> = {
    teacher: {
      av: 'MJ',
      name: currentUser?.full_name || 'Ms Clara Johnson',
      roleTitle: 'Classroom Teacher',
      sub: `${teacherYearGroup ? `${teacherYearGroup} · ` : ''}${teacherRoom || 'Classroom'}`,
      bg: '#5E4D9A',
      icon: GraduationCap,
      navItems: [
        {
          id: 'room4-matrix',
          label: `${teacherRoom || 'Classroom'} Overview`,
          icon: Layers,
          action: () => {
            onSelectNav?.('room4-matrix');
          },
        },
        {
          id: 'morning-briefings',
          label: 'Morning Briefings',
          icon: Sun,
          action: () => {
            onSelectNav?.('morning-briefings');
          },
        },
        {
          id: 'lesson-pathways',
          label: 'Adapted Lesson Pathways',
          icon: BookOpen,
          action: () => {
            onSelectNav?.('lesson-pathways');
          },
        },
        {
          id: 'provision-map',
          label: 'Termly Provision Map',
          icon: Target,
          action: () => {
            onSelectNav?.('provision-map');
          },
        },
        {
          id: 'supply-briefing',
          label: '60s Supply Briefing',
          icon: Printer,
          action: () => {
            onSelectNav?.('supply-briefing');
          },
        },
        {
          id: 'evidence-logs',
          label: 'Daily Evidence Logs',
          icon: FileText,
          action: () => {
            onSelectNav?.('evidence-logs');
            if (onOpenObservationModal) {
              onOpenObservationModal();
            } else {
              scrollTo('daily-evidence-timeline');
            }
          },
        },
      ],
    },
    senco: {
      av: 'MO',
      name: currentUser?.full_name || 'Amara Okafor',
      roleTitle: 'SENCO & Inclusion Lead',
      sub: 'Whole School SEND',
      bg: '#2A6B62',
      icon: ShieldCheck,
      navItems: [
        {
          id: 'provision_map',
          label: 'Inclusion & Caseload',
          icon: Layers,
          action: () => {
            onSelectNav?.('provision_map');
          },
        },
        {
          id: 'staff_team',
          label: 'Staff & Team Directory',
          icon: Users,
          action: () => {
            onSelectNav?.('staff_team');
          },
        },
        {
          id: 'register_pupil',
          label: '+ Register SEND Pupil',
          icon: FileText,
          action: () => {
            onSelectNav?.('register_pupil');
            onRegisterChild?.();
          },
        },
        {
          id: 'review_pack',
          label: 'Statutory EHCP Plans',
          icon: BookOpen,
          action: () => {
            onSelectNav?.('review_pack');
          },
        },
        {
          id: 'assistant',
          label: 'NOYA Longitudinal Query',
          icon: Sparkles,
          action: () => {
            onSelectNav?.('assistant');
          },
        },
        {
          id: 'reports_analytics',
          label: 'Reports & Analytics',
          icon: BarChart3,
          action: () => {
            onSelectNav?.('reports_analytics');
          },
        },
      ],
    },
    parent: {
      av: 'DC',
      name: currentUser?.full_name || 'Dana Carter',
      roleTitle: 'Parent & Guardian',
      sub: "Phoenix's Home Hub",
      bg: '#B87A2A',
      icon: HeartHandshake,
      navItems: [
        {
          id: 'today',
          label: "Today's Daily Loop",
          icon: Sun,
          action: () => {
            onSelectNav?.('today');
          },
        },
        {
          id: 'wins',
          label: 'Wins & Strengths',
          icon: Award,
          action: () => {
            onSelectNav?.('wins');
          },
        },
        {
          id: 'health',
          label: 'Health & Doctor Reports',
          icon: Pill,
          action: () => {
            onSelectNav?.('health');
          },
        },
      ],
    },
    child: {
      av: currentUser?.avatar_emoji || '🧒',
      name: currentUser?.full_name || 'Phoenix Carter',
      roleTitle: 'Pupil Voice',
      sub: currentUser?.school_name || 'Pupil Voice',
      bg: '#C5503E',
      icon: User,
      navItems: [
        {
          id: 'child-checkin',
          label: 'My Mood Check-In',
          icon: Sun,
          action: () => {
            onSelectNav?.('child-checkin');
            scrollTo('child-mood-checkin');
          },
        },
        {
          id: 'child-wins',
          label: 'My Star Wins',
          icon: Award,
          action: () => {
            onSelectNav?.('child-wins');
            scrollTo('child-star-wins');
          },
        },
        {
          id: 'child-worksheets',
          label: 'Interactive Worksheets',
          icon: BookOpen,
          action: () => {
            onSelectNav?.('child-worksheets');
            onOpenWorksheet?.('graphs');
          },
        },
      ],
    },
    ta: {
      av: 'MG',
      name: currentUser?.full_name || 'Melissa Grant',
      roleTitle: 'Teaching Assistant',
      sub: '1-to-1 Support Focus',
      bg: '#4CAF82',
      icon: Users,
      navItems: [
        {
          id: 'ta-hub',
          label: '1-to-1 Support Hub',
          icon: Layers,
          action: () => {
            onSelectNav?.('ta-hub');
            scrollTo('ta-support-hub');
          },
        },
        {
          id: 'ta-schedule',
          label: 'Key Transition Times',
          icon: Clock,
          action: () => {
            onSelectNav?.('ta-schedule');
            scrollTo('ta-high-risk-schedule');
          },
        },
        {
          id: 'ta-micrologs',
          label: 'Quick Classroom Notes',
          icon: FileText,
          action: () => {
            onSelectNav?.('ta-micrologs');
            if (onOpenObservationModal) {
              onOpenObservationModal();
            } else {
              scrollTo('ta-quick-log');
            }
          },
        },
      ],
    },
    parentplus: {
      av: 'DC',
      name: currentUser?.full_name || 'Dana Carter',
      roleTitle: 'Parent Plus (Post-16)',
      sub: 'Future Goals & Support',
      bg: '#E8B84B',
      icon: Award,
      navItems: [
        {
          id: 'post16-hub',
          label: 'Post-16 Careers Hub',
          icon: Layers,
          action: () => {
            onSelectNav?.('post16-hub');
          },
        },
      ],
    },
    admin: {
      av: 'AV',
      name: currentUser?.full_name || 'Dr. Alistair Vance',
      roleTitle: 'Admin',
      sub: 'Platform & School Governance',
      bg: '#3B4261',
      icon: Building2,
      navItems: [
        {
          id: 'schools',
          label: 'School Multi-Tenancy Hub',
          icon: Building2,
          action: () => {
            onSelectNav?.('schools');
          },
        },
        {
          id: 'staff',
          label: 'Staff & SENCO Directory',
          icon: Users,
          action: () => {
            onSelectNav?.('staff');
          },
        },
        {
          id: 'delegation',
          label: 'Responsibility Delegation',
          icon: ShieldCheck,
          action: () => {
            onSelectNav?.('delegation');
          },
        },
        {
          id: 'audit',
          label: 'Security & Audit Logs',
          icon: FileText,
          action: () => {
            onSelectNav?.('audit');
          },
        },
      ],
    },
  };

  const personaMeta = personaDict[activeView] || personaDict.teacher;
  const RoleIcon = personaMeta.icon;
  const [teacherMoreOpen, setTeacherMoreOpen] = useState(false);
  const teacherPrimaryIds = ['room4-matrix', 'morning-briefings', 'evidence-logs'];
  const primaryNavItems = activeView === 'teacher'
    ? personaMeta.navItems.filter((item) => teacherPrimaryIds.includes(item.id))
    : personaMeta.navItems;
  const secondaryNavItems = activeView === 'teacher'
    ? personaMeta.navItems.filter((item) => !teacherPrimaryIds.includes(item.id))
    : [];

  // Active check helper
  const isItemActive = (item: NavItem, idx: number) => {
    if (activeNavId) {
      return activeNavId === item.id;
    }
    return idx === 0;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(20rem,calc(100vw-1.5rem))] lg:w-64 bg-sidebarBg text-sidebarPrimary h-screen max-h-screen flex flex-col justify-between border-r border-sidebarBorder rounded-r-3xl lg:rounded-none shadow-2xl select-none transform transition-transform duration-300 ease-out lg:z-30 pb-[env(safe-area-inset-bottom)] ${
          isMobileOpen ? 'translate-x-0' : isSidebarHidden ? 'lg:-translate-x-full -translate-x-full' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header - pinned at top */}
        <div className="flex-shrink-0 p-3.5 sm:p-4 border-b border-sidebarBorder flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-coral via-amber to-mint flex items-center justify-center p-0.5 shadow-sm">
              <div className="w-full h-full bg-sidebarBg rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-teal dark:text-mint" />
              </div>
            </div>
            <div>
              <div className="font-serif font-bold text-base tracking-wide text-sidebarPrimary">See My Mind</div>
              <div className="text-[10px] text-sidebarMuted tracking-wider uppercase font-medium">
                {currentUser?.school_name || "SEND Inclusive Education"}
              </div>
            </div>
          </div>

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white flex items-center justify-center cursor-pointer transition-colors touch-manipulation"
              title="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Middle Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {/* Current Authenticated Persona Banner */}
          <div className="p-3 mx-3 mt-3 rounded-2xl bg-sidebarBadge border border-sidebarBorder">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: personaMeta.bg }}
              >
                {personaMeta.av}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-sidebarPrimary truncate">{personaMeta.name}</div>
                <div className="text-[10px] text-teal dark:text-mint flex items-center gap-1 font-semibold truncate">
                  <RoleIcon className="w-3 h-3 flex-shrink-0" />
                  <span>{personaMeta.roleTitle}</span>
                </div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-sidebarBorder flex items-center justify-between text-[10px] text-sidebarMuted">
              <span>{personaMeta.sub}</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold text-[9px]">
                Active Role
              </span>
            </div>
          </div>

          {/* Role-Locked Navigation Items */}
          <div className="px-3 py-2">
            <div className="text-[10px] font-bold tracking-widest text-sidebarMuted uppercase px-3 mb-2">
              {personaMeta.roleTitle} Workspace
            </div>

            <div className="space-y-1">
              {primaryNavItems.map((item, idx) => {
                const ItemIcon = item.icon;
                const active = isItemActive(item, idx);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action?.();
                      onCloseMobile?.();
                    }}
                    className={`w-full min-h-11 flex items-center gap-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer touch-manipulation ${
                      active
                        ? 'bg-sidebarActive text-sidebarActiveText shadow-sm font-bold'
                        : 'text-sidebarSecondary hover:text-sidebarPrimary hover:bg-sidebarHover'
                    }`}
                  >
                    <ItemIcon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-teal dark:text-mint'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              {activeView === 'teacher' && secondaryNavItems.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setTeacherMoreOpen((open) => !open)}
                    className="w-full min-h-11 flex items-center justify-between gap-2.5 px-3 rounded-xl text-xs font-semibold text-sidebarSecondary hover:text-sidebarPrimary hover:bg-sidebarHover transition-all cursor-pointer touch-manipulation"
                    aria-expanded={teacherMoreOpen}
                  >
                    <span className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-teal dark:text-mint flex-shrink-0" />
                      <span>More classroom tools</span>
                    </span>
                    {teacherMoreOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {teacherMoreOpen && (
                    <div className="ml-3 pl-2 border-l border-sidebarBorder space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {secondaryNavItems.map((item, idx) => {
                        const ItemIcon = item.icon;
                        const active = isItemActive(item, idx);
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              item.action?.();
                              onCloseMobile?.();
                            }}
                            className={`w-full min-h-10 flex items-center gap-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer touch-manipulation ${
                              active
                                ? 'bg-sidebarActive text-sidebarActiveText shadow-sm font-bold'
                                : 'text-sidebarSecondary hover:text-sidebarPrimary hover:bg-sidebarHover'
                            }`}
                          >
                            <ItemIcon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-white' : 'text-teal dark:text-mint'}`} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer: User Profile & Session Logout - pinned at bottom */}
        <div className="flex-shrink-0 p-2.5 sm:p-3 border-t border-sidebarBorder bg-black/[0.03] dark:bg-black/30 space-y-1.5">
          {/* Utilities: Theme & Tour in a clean 2-column grid */}
          <div className="grid grid-cols-2 gap-1.5">
            <ThemeToggle className="w-full justify-center" />
            {onOpenTour && (
              <button
                onClick={() => {
                  onOpenTour();
                  onCloseMobile?.();
                }}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-cardSubtle hover:bg-slate-200/70 dark:hover:bg-slate-800 text-textMain border border-borderMain text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Open Guided Tour"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse flex-shrink-0" />
                <span>Tour</span>
              </button>
            )}
          </div>

          {onOpenAIAudit && (
            <button
              onClick={() => {
                onOpenAIAudit();
                onCloseMobile?.();
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-cardSubtle hover:bg-purple-50 dark:hover:bg-purple-950/40 text-textDim hover:text-purple-700 dark:hover:text-purple-300 text-xs font-semibold transition-all cursor-pointer border border-borderMain hover:border-purple-200 dark:hover:border-purple-800/50 shadow-2xs active:scale-95"
              title="Inspect NOYA AI Transparency & API Audit Logs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <span>AI Audit Log</span>
            </button>
          )}

          <button
            onClick={() => {
              onSwitchPersona();
              onCloseMobile?.();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/70 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white/90 text-xs font-semibold transition-all cursor-pointer border border-slate-300/70 dark:border-white/10 shadow-2xs"
            title="Switch to another persona for testing"
          >
            <Repeat className="w-3.5 h-3.5 text-amber-600 dark:text-amber flex-shrink-0" />
            <span>Switch Account</span>
          </button>

          <button
            onClick={() => {
              onLogout();
              onCloseMobile?.();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 text-xs font-semibold transition-all cursor-pointer border border-rose-300/70 dark:border-rose-500/20"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>Sign Out</span>
          </button>

          {/* Cloud Sync Status Indicator */}
          <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-sidebarMuted select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span>Cloud Sync: Live · Supabase EU-West-1</span>
          </div>
        </div>
      </aside>
      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`hidden lg:flex fixed top-1/2 -translate-y-1/2 z-[60] w-7 h-14 items-center justify-center bg-sidebarBg text-sidebarPrimary border border-sidebarBorder shadow-lg transition-[left,border-radius] duration-300 hover:bg-sidebarHover focus:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
            isSidebarHidden ? 'left-0 rounded-r-xl' : 'left-64 -translate-x-1/2 rounded-xl'
          }`}
          title={isSidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
          aria-label={isSidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
          aria-pressed={isSidebarHidden}
        >
          {isSidebarHidden ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}
    </>
  );
};
