import React, { useState, useEffect } from 'react';
import {
  RoleView,
  Child,
  ChildEvent,
  MorningBriefing,
  IncidentSubmission,
  TransitionLogDetail,
  EmailPreview,
  UserProfile,
} from './types';
import { api, setApiRole } from './api';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ObservationModal } from './components/ObservationModal';
import { IncidentModal } from './components/IncidentModal';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { WorksheetModal } from './components/WorksheetModal';
import { RegisterChildModal } from './components/RegisterChildModal';
import { ParentOnboardingModal } from './components/ParentOnboardingModal';
import { InvitationNotificationBanner } from './components/InvitationNotificationBanner';
import { LoginView } from './views/LoginView';
import { TeacherView } from './views/TeacherView';
import { ParentView } from './views/ParentView';
import { SencoView, SencoTab } from './views/SencoView';
import { ChildView } from './views/ChildView';
import { TaView } from './views/TaView';
import { ParentPlusView } from './views/ParentPlusView';
import { AdminView } from './views/AdminView';
import { PersonaTourModal } from './components/PersonaTourModal';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Plus } from 'lucide-react';

const AppContent: React.FC = () => {
  const { syncUserTheme } = useTheme();
  // Authentication & Session State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Active Persona View (Locked to currentUser.role)
  const [activeView, setActiveView] = useState<RoleView>('senco');
  const [pupils, setPupils] = useState<Child[]>([]);
  const [child, setChild] = useState<Child | null>(null);
  const [timeline, setTimeline] = useState<ChildEvent[]>([]);
  const [briefing, setBriefing] = useState<MorningBriefing | null>(null);
  const [latestHandover, setLatestHandover] = useState<TransitionLogDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isWorksheetModalOpen, setIsWorksheetModalOpen] = useState(false);
  const [activeWorksheet, setActiveWorksheet] = useState('graphs');
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);

  // Sub-Navigation state per persona
  const [activeNavId, setActiveNavId] = useState<string>('');
  const [teacherSubView, setTeacherSubView] = useState<'focused' | 'matrix'>('matrix');
  const [parentSubTab, setParentSubTab] = useState<'bridge' | 'handover' | 'correlation' | 'wins'>('bridge');
  const [sencoSubTab, setSencoSubTab] = useState<SencoTab>('provision_map');
  const [adminSubTab, setAdminSubTab] = useState<'schools' | 'staff' | 'delegation' | 'audit'>('schools');

  // Registration & Onboarding state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isParentOnboardingOpen, setIsParentOnboardingOpen] = useState(false);
  const [onboardingToken, setOnboardingToken] = useState<string | null>(null);
  const [latestInvitation, setLatestInvitation] = useState<EmailPreview | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check existing session token on startup
  // Check existing session token or onboarding link on startup
  useEffect(() => {
    // 1. Detect onboarding token from URL query params
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    if (token) {
      setOnboardingToken(token);
      setIsParentOnboardingOpen(true);
      setAuthChecking(false);
      return;
    }

    async function checkSession() {
      try {
        const user = await api.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          if (user.theme_preference) syncUserTheme(user.theme_preference);
          setActiveView(user.role as RoleView);
          setApiRole(user.role === 'parentplus' ? 'parent' : user.role);
          initNavForRole(user.role as RoleView);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkSession();
  }, []);

  const initNavForRole = (view: RoleView) => {
    if (view === 'teacher') setActiveNavId('room4-matrix');
    else if (view === 'senco') setActiveNavId('provision_map');
    else if (view === 'parent') setActiveNavId('bridge');
    else if (view === 'child') setActiveNavId('child-checkin');
    else if (view === 'ta') setActiveNavId('ta-hub');
    else if (view === 'admin') setActiveNavId('schools');
  };

  // Sync API role when active view changes
  const handleViewChange = (view: RoleView) => {
    setActiveView(view);
    const backendRole = view === 'parentplus' ? 'parent' : view;
    setApiRole(backendRole);
    if (view === 'teacher') {
      setTeacherSubView('matrix');
    }
    initNavForRole(view);
  };

  const handleSelectNav = (navId: string) => {
    setActiveNavId(navId);

    if (activeView === 'teacher') {
      if (navId === 'room4-matrix') {
        setTeacherSubView('matrix');
      } else {
        setTeacherSubView('focused');
      }
    }

    if (activeView === 'senco') {
      if (navId === 'provision_map') setSencoSubTab('provision_map');
      if (navId === 'staff_team') setSencoSubTab('staff_team');
      if (navId === 'review_pack') setSencoSubTab('review_pack');
      if (navId === 'assistant') setSencoSubTab('assistant');
      if (navId === 'reports_analytics') setSencoSubTab('reports_analytics');
    }

    if (activeView === 'parent') {
      if (navId === 'bridge') setParentSubTab('bridge');
      if (navId === 'handover') setParentSubTab('handover');
      if (navId === 'correlation') setParentSubTab('correlation');
      if (navId === 'wins') setParentSubTab('wins');
    }

    if (activeView === 'admin') {
      if (navId === 'schools') setAdminSubTab('schools');
      if (navId === 'staff') setAdminSubTab('staff');
      if (navId === 'delegation') setAdminSubTab('delegation');
      if (navId === 'audit') setAdminSubTab('audit');
    }
  };

  // Switch active pupil or return to whole-class/school overview
  const handleChildSelect = async (childId: string) => {
    if (childId === 'overview') {
      if (activeView === 'teacher') {
        setTeacherSubView('matrix');
        setActiveNavId('room4-matrix');
      } else if (activeView === 'senco') {
        setSencoSubTab('provision_map');
        setActiveNavId('provision_map');
      }
      return;
    }

    const selected = pupils.find((p) => p.id === childId);
    if (!selected) return;
    setChild(selected);

    // If teacher selects a pupil from the dropdown, automatically drill down to 1:1 view
    if (activeView === 'teacher') {
      setTeacherSubView('focused');
      setActiveNavId('preflight-handover');
    } else if (activeView === 'senco' && (sencoSubTab === 'provision_map' || sencoSubTab === 'staff_team')) {
      setSencoSubTab('review_pack');
      setActiveNavId('review_pack');
    }

    try {
      const [events, brief, handover] = await Promise.all([
        api.getTimeline(selected.id),
        api.getMorningBriefing(selected.id).catch(() => null),
        api.getLatestHandover(selected.id).catch(() => null),
      ]);
      setTimeline(events);
      setBriefing(brief);
      setLatestHandover(handover);
    } catch (err) {
      console.error('Error fetching child data:', err);
    }
  };

  // Load pupil, timeline, and morning handover when authenticated
  useEffect(() => {
    if (!currentUser) return;

    async function loadData() {
      try {
        setLoading(true);
        const pupilList = await api.getPupils();
        setPupils(pupilList);
        if (pupilList.length > 0) {
          let selected = pupilList[0];
          // If logged in as parent or pupil with linked child_id, select their child
          if (currentUser?.child_id) {
            const linked = pupilList.find((p) => p.id === currentUser.child_id);
            if (linked) selected = linked;
          }
          setChild(selected);

          const [events, brief, handover, recentInvites] = await Promise.all([
            api.getTimeline(selected.id),
            api.getMorningBriefing(selected.id).catch(() => null),
            api.getLatestHandover(selected.id).catch(() => null),
            api.getRecentInvitations().catch(() => []),
          ]);
          setTimeline(events);
          setBriefing(brief);
          setLatestHandover(handover);
          if (recentInvites && recentInvites.length > 0) {
            setLatestInvitation(recentInvites[0]);
          }
        } else {
          setChild(null);
          setTimeline([]);
          setBriefing(null);
          setLatestHandover(null);
        }
      } catch (err) {
        console.error('Error connecting to backend:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.theme_preference) syncUserTheme(user.theme_preference);
    handleViewChange(user.role as RoleView);
  };

  const handleTourSelectRole = async (role: RoleView) => {
    try {
      setLoading(true);
      const res = await api.demoLogin(role);
      handleLoginSuccess(res.user);
    } catch (err) {
      console.error('Failed to demo login as', role, err);
      handleViewChange(role);
    } finally {
      setLoading(false);
      setIsTourModalOpen(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setChild(null);
  };

  const handleChildRegistered = async (newChildId: string) => {
    try {
      const pupilList = await api.getPupils();
      setPupils(pupilList);
      const recentInvites = await api.getRecentInvitations().catch(() => []);
      if (recentInvites && recentInvites.length > 0) {
        setLatestInvitation(recentInvites[0]);
      }
      if (newChildId) {
        await handleChildSelect(newChildId);
      }
    } catch (err) {
      console.error('Error refreshing after registration:', err);
    }
  };

  const handleOpenParentOnboarding = (token: string) => {
    setOnboardingToken(token);
    setIsParentOnboardingOpen(true);
  };

  const handleCloseParentOnboarding = () => {
    setIsParentOnboardingOpen(false);
    setOnboardingToken(null);
    try {
      window.history.replaceState({}, document.title, window.location.pathname.replace('/onboard', '/') || '/');
    } catch (_) {}
  };

  const handleOnboardingCompleted = async (childId?: string, activatedRole?: string) => {
    setIsParentOnboardingOpen(false);
    setOnboardingToken(null);
    try {
      window.history.replaceState({}, document.title, window.location.pathname.replace('/onboard', '/') || '/');
    } catch (_) {}
    try {
      setLoading(true);
      const user = await api.getCurrentUser();
      if (user) {
        handleLoginSuccess(user);
        if (childId) {
          await handleChildSelect(childId);
        }
        if (activatedRole) {
          handleViewChange(activatedRole as RoleView);
        }
      }
    } catch (err) {
      console.error('Failed to reload user post-onboarding:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBriefing = async () => {
    if (!child) return;
    try {
      const brief = await api.getMorningBriefing(child.id);
      setBriefing(brief);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogObservation = async (eventData: any) => {
    if (!child) return;
    const newEvent = await api.logEvent({
      ...eventData,
      child_id: child.id,
      school_id: child.school_id,
    });
    setTimeline([newEvent, ...timeline]);
  };

  const handleAcknowledgeHandover = async (transitionId: string) => {
    try {
      const updated = await api.acknowledgeTransition(transitionId);
      setLatestHandover((prev) =>
        prev
          ? {
              ...prev,
              acknowledged_by_staff: true,
              acknowledged_at: updated.acknowledged_at || new Date().toISOString(),
            }
          : null
      );

      setTimeline((prev) =>
        prev.map((evt) => {
          if (evt.transition_log && evt.transition_log.id === transitionId) {
            return {
              ...evt,
              status: 'Acknowledged',
              transition_log: {
                ...evt.transition_log,
                acknowledged_by_staff: true,
                acknowledged_at: updated.acknowledged_at || new Date().toISOString(),
              },
            };
          }
          return evt;
        })
      );
    } catch (err) {
      console.error('Failed to acknowledge transition handover:', err);
    }
  };

  const handleSubmitHandover = async (handoverData: any) => {
    if (!child) return;
    const newEvent = await api.submitMorningHandover(child.id, handoverData, currentUser?.full_name || 'Dana Carter');
    setTimeline([newEvent, ...timeline]);
    const freshHandover = await api.getLatestHandover(child.id).catch(() => null);
    setLatestHandover(freshHandover);
    await handleRefreshBriefing();
  };

  const handleChildCheckIn = async (checkInData: any) => {
    if (!child) return;
    const newEvent = await api.logCheckIn(child.id, checkInData);
    setTimeline([newEvent, ...timeline]);
  };

  const handleDirectLog = async (eventData: any) => {
    if (!child) return;
    const newEvent = await api.logEvent({
      ...eventData,
      child_id: child.id,
      school_id: child.school_id,
    });
    setTimeline([newEvent, ...timeline]);
  };

  const handleLogIncident = async (incident: IncidentSubmission) => {
    if (!child) return;
    await api.logIncident(incident);
    const refreshed = await api.getTimeline(child.id);
    setTimeline(refreshed);
  };

  const handleOpenWorksheet = (key: string) => {
    setActiveWorksheet(key);
    setIsWorksheetModalOpen(true);
  };

  const handleLogMilestone = async (title: string, summary: string) => {
    if (!child) return;
    const newEvent = await api.logEvent({
      child_id: child.id,
      school_id: child.school_id,
      event_type: 'Observation',
      reporter_type: currentUser?.role === 'ta' ? 'Teaching Assistant' : 'Teacher',
      reporter_name: currentUser?.full_name || 'Ms Johnson',
      title: title,
      summary: summary,
      significance: 'Notable Win',
      visibility: 'Shared',
      observation: {
        activity_context: 'Maths Adaptation',
        strategy_used: 'Visual-Spatial Learning Pathway',
        strategy_worked: true,
        strengths_observed: 'Spatial reasoning, gradient geometry, independent task completion',
      },
    });
    setTimeline([newEvent, ...timeline]);
  };

  const handleUploadDocument = async (title: string, docType: string, file: File) => {
    if (!child) return;
    await api.uploadDocument(child.id, title, docType, file);
  };

  const handleLogDeEscalation = async (data: {
    strategyName: string;
    category: string;
    worked: boolean;
    notes: string;
  }) => {
    if (!child) return;
    const newEvent = await api.logEvent({
      child_id: child.id,
      school_id: child.school_id,
      event_type: 'Observation',
      reporter_type: 'Teacher',
      reporter_name: currentUser?.full_name || 'Ms Clara Johnson',
      title: `In-the-Moment De-Escalation: ${data.strategyName}`,
      summary: data.notes,
      significance: data.worked ? 'Notable Win' : 'Routine Note',
      visibility: 'Shared',
      observation: {
        activity_context: 'Classroom Support (Room 4)',
        strategy_used: data.strategyName,
        strategy_worked: data.worked,
        notes: data.notes,
      },
    });
    setTimeline([newEvent, ...timeline]);
  };

  // 1. Initial Auth Check Spinner
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-3 text-white">
        <div className="w-10 h-10 rounded-full border-3 border-teal border-t-transparent animate-spin" />
        <div className="text-sm font-semibold text-slate-300">Checking See My Mind session...</div>
      </div>
    );
  }

  // 2. Unauthenticated: Render Login Layer
  if (!currentUser) {
    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onOpenInvitation={handleOpenParentOnboarding}
        />
        <ParentOnboardingModal
          isOpen={isParentOnboardingOpen}
          token={onboardingToken}
          onClose={handleCloseParentOnboarding}
          onCompleted={handleOnboardingCompleted}
        />
      </>
    );
  }

  // 3. Authenticated: Render Single-Persona View
  if (loading || (!child && activeView !== 'senco' && activeView !== 'admin' && activeView !== 'teacher')) {
    return (
      <div className="min-h-screen bg-canvas text-textMain flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full border-4 border-teal border-t-transparent animate-spin" />
        <div className="text-sm font-bold text-textHead font-serif">Connecting to See My Mind & NOYA AI...</div>
        <div className="text-xs text-textDim">Loading {currentUser.full_name}&apos;s Workspace</div>
        <ParentOnboardingModal
          isOpen={isParentOnboardingOpen}
          token={onboardingToken}
          onClose={handleCloseParentOnboarding}
          onCompleted={handleOnboardingCompleted}
        />
      </div>
    );
  }

  const isHandoverAcknowledged = latestHandover?.acknowledged_by_staff;
  const isBreakfastSkipped = latestHandover?.breakfast_eaten === false;

  const topBarConfig = {
    teacher: {
      title: `Good morning, ${currentUser.full_name} 👋`,
      subtitle: teacherSubView === 'matrix'
        ? `${currentUser.school_name || "Inclusive School"} · ${child?.room_name || 'Room 4'} Classroom Hub · ${pupils.length} SEND Learners`
        : `1:1 Support Focus · ${child?.preferred_name || child?.first_name || 'Pupil'} ${child?.last_name || ''}`,
      pills: teacherSubView === 'matrix'
        ? [
            { label: `🏫 ${pupils.length} SEND Learners`, color: 'teal' as const },
            { label: `📋 ${pupils.filter(p => p.support_profile?.has_ehcp).length} Active EHCPs`, color: 'purple' as const },
            latestHandover && !isHandoverAcknowledged
              ? { label: '🔔 Handover Needs Ack', color: 'red' as const }
              : { label: '✓ Handovers Logged', color: 'green' as const },
            { label: '⚡ Assembly 9:05am', color: 'amber' as const },
          ]
        : [
            latestHandover && !isHandoverAcknowledged
              ? { label: '🔔 Handover Needs Ack', color: 'red' as const }
              : { label: '✓ Handover Acknowledged', color: 'green' as const },
            isBreakfastSkipped
              ? { label: '🍽 Skipped Breakfast', color: 'amber' as const }
              : { label: '🥣 Breakfast Eaten', color: 'teal' as const },
            { label: '⚡ Assembly 9:05am', color: 'red' as const },
            { label: '📚 Maths: Straight Lines', color: 'gold' as const },
          ],
      actionButton: {
        label: '+ Log Observation',
        onClick: () => setIsObsModalOpen(true),
        icon: <Plus className="w-4 h-4" />,
      },
    },
    senco: {
      title: `Inclusion & SEND Caseload · ${currentUser.full_name}`,
      subtitle: `${currentUser.school_name || "Assigned School"} · Academic Year 2026/2027`,
      pills: [
        { label: `${pupils.length} Pupils on Caseload`, color: 'teal' as const },
        { label: `${pupils.filter(p => p.support_profile?.has_ehcp).length} Active EHCPs`, color: 'purple' as const },
      ],
      actionButton: {
        label: '+ Register SEND Pupil',
        onClick: () => setIsRegisterModalOpen(true),
        icon: <Plus className="w-4 h-4" />,
      },
    },
    parent: {
      title: `${child?.preferred_name || child?.first_name || 'Pupil'} ${child?.last_name || ''} · Parent Hub`,
      subtitle: `${currentUser.full_name}${currentUser.school_name ? ` · ${currentUser.school_name}` : ""}`,
      pills: [
        isHandoverAcknowledged
          ? { label: '✓ Read by Teacher', color: 'green' as const }
          : { label: '⏳ Handover Sent · Awaiting Check-In', color: 'amber' as const },
        { label: '🎧 Noise Defenders in Bag', color: 'teal' as const },
      ],
    },
    child: {
      title: `My Day · ${child?.preferred_name || child?.first_name || 'Pupil'} ⭐`,
      subtitle: `${currentUser.school_name || "Inclusive School"} · Pupil Voice`,
      pills: [{ label: '😊 Feeling Great', color: 'green' as const }],
    },
    ta: {
      title: `Teaching Assistant View · ${currentUser.full_name}`,
      subtitle: `1-to-1 Support Focus${currentUser.school_name ? ` · ${currentUser.school_name}` : ""}`,
      pills: [
        { label: `⚡ ${child?.preferred_name || child?.first_name || 'Pupil'}: High Priority`, color: 'red' as const },
        { label: '🎧 Headphones at Door (8:55am)', color: 'amber' as const },
      ],
      actionButton: {
        label: '+ Log Note',
        onClick: () => setIsObsModalOpen(true),
        icon: <Plus className="w-4 h-4" />,
      },
    },
    parentplus: {
      title: 'Parent Plus · Post-16 Pathways',
      subtitle: 'Longitudinal Strengths & Careers · Year 10+',
      pills: [{ label: 'Top Match: Game Design (92%)', color: 'gold' as const }],
    },
    admin: {
      title: 'Admin & School Governance Hub',
      subtitle: `${currentUser.full_name} · Platform Governance`,
      pills: [
        { label: '🏛️ Multi-School Isolation', color: 'indigo' as const },
        { label: '📜 Audit Trail Active', color: 'teal' as const },
      ],
    },
  }[activeView];

  return (
    <div className="min-h-screen bg-[#F7FAFB] dark:bg-[#0B132B] text-[#1A3A4A] dark:text-[#E2E8F0] flex font-sans transition-colors duration-200">
      <Sidebar
        activeView={activeView}
        currentUser={currentUser}
        activeNavId={activeNavId}
        onSelectNav={handleSelectNav}
        onLogout={handleLogout}
        onSwitchPersona={handleLogout}
        onRegisterChild={() => setIsRegisterModalOpen(true)}
        onOpenWorksheet={handleOpenWorksheet}
        onOpenObservationModal={() => setIsObsModalOpen(true)}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenTour={() => setIsTourModalOpen(true)}
      />

      <main className="ml-0 lg:ml-64 min-h-screen flex flex-col flex-1 w-full overflow-x-hidden bg-canvas text-textMain transition-colors duration-200">
        <InvitationNotificationBanner
          onOpenInvitation={handleOpenParentOnboarding}
          latestInvitation={latestInvitation}
        />

        <TopBar
          title={topBarConfig.title}
          subtitle={topBarConfig.subtitle}
          pills={topBarConfig.pills}
          actionButton={topBarConfig.actionButton}
          pupils={currentUser.role === 'senco' || currentUser.role === 'teacher' ? pupils : undefined}
          overviewLabel={
            activeView === 'teacher'
              ? `🏫 ${child?.room_name || 'Room 4'} Classroom Hub (All Pupils)`
              : activeView === 'senco'
              ? '🏫 Whole-School Provision Register'
              : undefined
          }
          selectedChildId={
            (activeView === 'teacher' && teacherSubView === 'matrix') ||
            (activeView === 'senco' && (sencoSubTab === 'provision_map' || sencoSubTab === 'staff_team'))
              ? 'overview'
              : child?.id
          }
          onSelectChild={handleChildSelect}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          onOpenTour={() => setIsTourModalOpen(true)}
        />

        <div className="p-3.5 sm:p-5 lg:p-7 max-w-7xl w-full mx-auto flex-1 animate-in fade-in duration-200">
          {activeView === 'teacher' && (
            <TeacherView
              child={child}
              timeline={timeline}
              briefing={briefing}
              latestHandover={latestHandover}
              activeSubView={teacherSubView}
              onSubViewChange={(view) => {
                setTeacherSubView(view);
                setActiveNavId(view === 'matrix' ? 'room4-matrix' : 'preflight-handover');
              }}
              onSelectPupil={handleChildSelect}
              onRefreshBriefing={handleRefreshBriefing}
              onAcknowledgeHandover={handleAcknowledgeHandover}
              onOpenObservationModal={() => setIsObsModalOpen(true)}
              onOpenIncidentModal={() => setIsIncidentModalOpen(true)}
              onOpenWorksheet={handleOpenWorksheet}
              onLogMilestone={handleLogMilestone}
              onLogDeEscalation={handleLogDeEscalation}
            />
          )}

          {activeView === 'parent' && (
            <ParentView
              child={child!}
              timeline={timeline}
              latestHandover={latestHandover}
              activeTab={parentSubTab}
              onTabChange={(tab) => {
                setParentSubTab(tab);
                setActiveNavId(tab);
              }}
              onSubmitHandover={handleSubmitHandover}
            />
          )}

          {activeView === 'senco' && (
            <SencoView
              child={child}
              timeline={timeline}
              currentUser={currentUser}
              pupils={pupils}
              activeTab={sencoSubTab}
              onTabChange={(tab) => {
                setSencoSubTab(tab);
                setActiveNavId(tab);
              }}
              onOpenDocModal={() => setIsDocModalOpen(true)}
              onOpenIncidentModal={() => setIsIncidentModalOpen(true)}
              onRegisterChild={() => setIsRegisterModalOpen(true)}
            />
          )}

          {activeView === 'child' && (
            <ChildView
              child={child!}
              onCheckIn={handleChildCheckIn}
              onOpenWorksheet={handleOpenWorksheet}
            />
          )}

          {activeView === 'ta' && (
            <TaView
              child={child!}
              timeline={timeline}
              onOpenObservationModal={() => setIsObsModalOpen(true)}
              onDirectLog={handleDirectLog}
              onOpenWorksheet={handleOpenWorksheet}
            />
          )}

          {activeView === 'parentplus' && <ParentPlusView child={child!} />}

          {activeView === 'admin' && (
            <AdminView
              activeTab={adminSubTab}
              onTabChange={(tab) => {
                setAdminSubTab(tab);
                setActiveNavId(tab);
              }}
            />
          )}
        </div>
      </main>

      <ObservationModal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
        onSubmit={handleLogObservation}
        childName={child?.preferred_name || child?.first_name || 'Pupil'}
      />

      <IncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        onSubmit={handleLogIncident}
        childName={child?.preferred_name || child?.first_name || 'Pupil'}
        childId={child?.id || ''}
      />

      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSubmit={handleUploadDocument}
        childName={child?.preferred_name || child?.first_name || 'Pupil'}
      />

      <WorksheetModal
        isOpen={isWorksheetModalOpen}
        onClose={() => setIsWorksheetModalOpen(false)}
        initialWorksheet={activeWorksheet}
        onCompleteStep={handleLogMilestone}
      />

      <RegisterChildModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegistered={handleChildRegistered}
        onOpenParentOnboarding={handleOpenParentOnboarding}
      />

      <ParentOnboardingModal
        isOpen={isParentOnboardingOpen}
        token={onboardingToken}
        onClose={handleCloseParentOnboarding}
        onCompleted={handleOnboardingCompleted}
      />

      <PersonaTourModal
        isOpen={isTourModalOpen}
        onClose={() => setIsTourModalOpen(false)}
        userRole={currentUser.role as RoleView}
        schoolName={currentUser.school_name}
        userName={currentUser.full_name}
        onSelectRole={handleTourSelectRole}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
