import React, { useState, useEffect } from 'react';
import {
  Child,
  ChildEvent,
  AskNoyaResponse,
  DocumentItem,
  IncidentDetail,
  AnnualReviewPackResponse,
  SchoolProvisionMatrixResponse,
  ProvisionMapPupil,
  AdminUserItem,
  CamhsClinicalDossierResponse,
  UserProfile,
} from '../types';
import {
  ShieldCheck,
  Sparkles,
  Search,
  FileText,
  CheckCircle2,
  Upload,
  AlertTriangle,
  Printer,
  ArrowRight,
  Filter,
  Users,
  Check,
  Mail,
  X,
  UserPlus,
  RefreshCw,
  GraduationCap,
  UserCheck,
  Edit3,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api';
import { AnnualReviewPackModal } from '../components/AnnualReviewPackModal';
import { CamhsEvidenceDossierModal } from '../components/CamhsEvidenceDossierModal';
import { AbcTooltip } from '../components/AbcTooltip';
import { AnalyticsReportsDashboard } from '../components/AnalyticsReportsDashboard';

export type SencoTab = 'review_pack' | 'provision_map' | 'staff_team' | 'assistant' | 'reports_analytics';


interface SencoViewProps {
  child?: Child | null;
  timeline: ChildEvent[];
  currentUser?: UserProfile | null;
  pupils?: Child[];
  activeTab?: SencoTab;
  onTabChange?: (tab: SencoTab) => void;
  onOpenDocModal?: () => void;
  onOpenIncidentModal?: () => void;
  onRegisterChild?: () => void;
  onOpenCopilot?: (initialQuery?: string) => void;
}

export const SencoView: React.FC<SencoViewProps> = ({
  child,
  timeline,
  currentUser,
  pupils: _pupils = [],
  activeTab: propActiveTab,
  onTabChange,
  onOpenDocModal,
  onOpenIncidentModal,
  onRegisterChild,
  onOpenCopilot,
}) => {
  const [activeTab, setActiveTab] = useState<SencoTab>(
    propActiveTab || 'review_pack'
  );

  useEffect(() => {
    if (propActiveTab && propActiveTab !== activeTab) {
      setActiveTab(propActiveTab);
    }
  }, [propActiveTab]);

  const handleTabSelect = (tab: SencoTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // AI & Overview state
  const [query, setQuery] = useState('What sensory calming strategies have proven most effective this month?');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskNoyaResponse | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentDetail[]>([]);

  // Annual Review Pack state
  const [reviewPack, setReviewPack] = useState<AnnualReviewPackResponse | null>(null);
  const [loadingPack, setLoadingPack] = useState(false);
  const [showPackModal, setShowPackModal] = useState(false);

  // CAMHS Clinical Dossier state
  const [camhsDossier, setCamhsDossier] = useState<CamhsClinicalDossierResponse | null>(null);
  const [showCamhsModal, setShowCamhsModal] = useState(false);
  const [loadingCamhs, setLoadingCamhs] = useState(false);

  const handleOpenCamhsModal = async () => {
    if (!child?.id) return;
    try {
      setLoadingCamhs(true);
      const data = await api.getCamhsClinicalDossier(child.id);
      setCamhsDossier(data);
      setShowCamhsModal(true);
    } catch (err) {
      console.error('Failed to load CAMHS dossier:', err);
      alert('Failed to generate clinical dossier: ' + err);
    } finally {
      setLoadingCamhs(false);
    }
  };

  // Caseload Provision Matrix state
  const [provisionMatrix, setProvisionMatrix] = useState<SchoolProvisionMatrixResponse | null>(null);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [provisionFilter, setProvisionFilter] = useState<'all' | 'ehcp' | 'k' | 'asc' | 'adhd' | 'due_soon'>('all');

  useEffect(() => {
    if (child?.id) {
      api.getDocuments(child.id).then(setDocuments).catch(console.error);
      api.getIncidents(child.id).then(setIncidents).catch(console.error);

      setLoadingPack(true);
      api.getAnnualReviewPack(child.id)
        .then(setReviewPack)
        .catch(console.error)
        .finally(() => setLoadingPack(false));
    }
  }, [child?.id]);

  useEffect(() => {
    if (activeTab === 'provision_map' && !provisionMatrix) {
      setLoadingMatrix(true);
      api.getSchoolProvisionMatrix()
        .then(setProvisionMatrix)
        .catch(console.error)
        .finally(() => setLoadingMatrix(false));
    }
  }, [activeTab, provisionMatrix]);

  // Staff Directory & Provisioning state
  const [staffList, setStaffList] = useState<AdminUserItem[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffFilter, setStaffFilter] = useState<'all' | 'teacher' | 'ta' | 'specialist'>('all');
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [provisionSuccessMsg, setProvisionSuccessMsg] = useState<{
    name: string;
    email: string;
    role: string;
    password?: string;
  } | null>(null);

  const [staffForm, setStaffForm] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    role: 'teacher' | 'ta' | 'specialist';
    jobTitle: string;
    password?: string;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'teacher',
    jobTitle: '',
    password: '',
  });

  // Editing state
  const [editingStaff, setEditingStaff] = useState<AdminUserItem | null>(null);
  const [editForm, setEditForm] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    jobTitle: string;
    isActive: boolean;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'teacher',
    jobTitle: '',
    isActive: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Deleting state
  const [deletingStaff, setDeletingStaff] = useState<AdminUserItem | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleOpenEdit = (staff: AdminUserItem) => {
    const parts = staff.full_name.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    setEditingStaff(staff);
    setEditForm({
      firstName,
      lastName,
      email: staff.email,
      role: staff.role,
      jobTitle: staff.role === 'teacher' ? 'Classroom Teacher' : staff.role === 'ta' ? '1:1 Support TA' : staff.role.toUpperCase(),
      isActive: staff.is_active,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      setSavingEdit(true);
      await api.updateStaff(editingStaff.id, {
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        email: editForm.email,
        role: editForm.role,
        job_title: editForm.jobTitle,
        is_active: editForm.isActive,
      });
      setEditingStaff(null);
      await loadStaff();
    } catch (err: any) {
      alert(`Failed to update staff member: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingStaff) return;
    try {
      setConfirmingDelete(true);
      await api.deleteStaff(deletingStaff.id);
      setDeletingStaff(null);
      await loadStaff();
    } catch (err: any) {
      alert(`Failed to delete staff member: ${err.message}`);
    } finally {
      setConfirmingDelete(false);
    }
  };

  const loadStaff = async () => {
    try {
      setLoadingStaff(true);
      const data = await api.getAdminUsers();
      setStaffList(data);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'staff_team') {
      loadStaff();
    }
  }, [activeTab]);

  const handleProvisionStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.firstName || !staffForm.lastName || !staffForm.email) {
      alert('Please fill out all required fields.');
      return;
    }
    try {
      setSubmittingStaff(true);
      const res = await api.provisionStaff({
        first_name: staffForm.firstName,
        last_name: staffForm.lastName,
        email: staffForm.email,
        role: staffForm.role,
        job_title: staffForm.jobTitle || undefined,
        password: staffForm.password || undefined,
      });
      setProvisionSuccessMsg({
        name: res.full_name,
        email: res.email,
        role: res.role,
        password: res.temporary_credentials,
      });
      setIsAddStaffModalOpen(false);
      setStaffForm({
        firstName: '',
        lastName: '',
        email: '',
        role: 'teacher',
        jobTitle: '',
        password: '',
      });
      await loadStaff();
    } catch (err: any) {
      alert(`Staff appointment failed: ${err.message}`);
    } finally {
      setSubmittingStaff(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (onOpenCopilot) {
      onOpenCopilot(query);
      return;
    }
    if (!child?.id) {
      alert('Please register or select a pupil first.');
      return;
    }
    setLoading(true);
    try {
      const resp = await api.askNoya(child.id, query);
      setResult(resp);
    } catch (err) {
      console.error(err);
      alert('Failed to query NOYA.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered pupils for provision map
  const getFilteredPupils = (pupils: ProvisionMapPupil[]) => {
    switch (provisionFilter) {
      case 'ehcp':
        return pupils.filter((p) => p.support_tier.includes('EHCP'));
      case 'k':
        return pupils.filter((p) => p.support_tier.includes('SEN Support'));
      case 'asc':
        return pupils.filter((p) => p.primary_need.toLowerCase().includes('autism') || p.primary_need.toLowerCase().includes('asc'));
      case 'adhd':
        return pupils.filter((p) => p.primary_need.toLowerCase().includes('adhd'));
      case 'due_soon':
        return pupils.filter((p) => p.days_until_review <= 30);
      default:
        return pupils;
    }
  };

  return (
    <div className="space-y-6">

      {/* ============================================================== */}
      {/* TAB 1: STATUTORY ANNUAL REVIEW EVIDENCE PACK                   */}
      {/* ============================================================== */}
      {activeTab === 'review_pack' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {!child && !reviewPack ? (
            <div className="card p-12 text-center text-textDim dark:text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal/10 text-teal flex items-center justify-center mx-auto text-2xl font-bold">
                📋
              </div>
              <h4 className="font-bold text-base text-navy dark:text-white">No SEND Pupil Selected</h4>
              <p className="text-xs max-w-md mx-auto">
                There are currently no active SEND pupils registered for {currentUser?.school_name || "this school"}. Click &ldquo;+ Register SEND Pupil&rdquo; above to onboard your first pupil.
              </p>
              {onRegisterChild && (
                <button
                  onClick={onRegisterChild}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal hover:bg-teal-dark text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <span>+ Register First Pupil</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Pupil Target Bar & Quick Export */}
              <div className="bg-gradient-to-r from-purple-50/90 via-cardBg to-indigo-50/50 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-navy text-textMain dark:text-white p-5 rounded-2xl border border-purple-200/60 dark:border-purple-900/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-white/10 flex items-center justify-center text-xl font-bold font-serif text-purple-700 dark:text-mint border border-purple-200 dark:border-white/10">
                    {(child?.first_name?.[0] || reviewPack?.child_name?.[0] || 'S') + (child?.last_name?.[0] || '')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold font-serif text-navy dark:text-white">
                        {child?.full_name || (child ? `${child.first_name} ${child.last_name}` : (reviewPack?.child_name || 'SEND Pupil'))}
                      </h3>
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-400/20 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-400/30 px-2 py-0.5 rounded-full font-bold">
                        Statutory EHCP
                      </span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                        Review Due in 14 Days
                      </span>
                    </div>
                    <p className="text-xs text-textDim dark:text-white/70 mt-0.5">
                      {child?.year_group || 'SEND Pupil'} &bull; Primary Need: {reviewPack?.primary_need || 'SEND Support'} &bull; {timeline.length} Evidence Events Logged
                    </p>
                  </div>
                </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              {loadingPack && (
                <div className="text-[11px] text-teal dark:text-mint font-semibold animate-pulse mr-2">
                  Synthesizing evidence...
                </div>
              )}
              <button
                onClick={handleOpenCamhsModal}
                disabled={loadingCamhs}
                className="w-full sm:w-auto justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
                title="NICE NG87 / CG128 Multi-Agency Clinical Dossier for CAMHS"
              >
                {loadingCamhs ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 text-white" />
                )}
                <span>CAMHS Clinical Dossier</span>
              </button>

              <button
                onClick={() => setShowPackModal(true)}
                className="w-full sm:w-auto justify-center px-4 py-2.5 bg-gradient-to-r from-teal to-mint text-navy rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4 text-navy" />
                <span>Print / Save Statutory PDF</span>
              </button>
            </div>
          </div>

          {/* Longitudinal Evidence Metrics Ribbon */}
          {reviewPack && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="stat-card border-teal">
                <div className="font-serif text-2xl font-bold text-teal">
                  {reviewPack.metrics.total_evidence_observations}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Classroom Observation Logs</div>
              </div>
              <div className="stat-card border-emerald-600">
                <div className="font-serif text-2xl font-bold text-emerald-700">
                  {reviewPack.metrics.de_escalation_win_rate.split(' ')[0]}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">De-Escalation Success Rate</div>
              </div>
              <div className="stat-card border-amber-dark">
                <div className="font-serif text-2xl font-bold text-amber-dark">
                  {reviewPack.metrics.morning_handovers_received}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Parent Handovers Received</div>
              </div>
              <div className="stat-card border-purple-dark">
                <div className="font-serif text-2xl font-bold text-purple-dark">0</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Fixed-Term Exclusions</div>
              </div>
            </div>
          )}

          {/* Statutory Sections A & B */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Section A: Views of Child & Parent */}
            <div className="lg:col-span-6 space-y-4">
              <div className="card p-5 border-l-4 border-l-teal space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-teal/10 text-teal flex items-center justify-center font-bold text-xs">
                      A
                    </span>
                    <h4 className="text-sm font-bold text-navy">Section A: Child & Parent Voice</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal/10 text-teal font-bold">
                    Co-Produced
                  </span>
                </div>

                {reviewPack && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-teal-50/40 rounded-xl border border-teal/20 space-y-1">
                      <div className="font-bold text-navy flex items-center gap-1.5">
                        <span>🧒 {child?.preferred_name || child?.first_name || reviewPack.child_name.split(' ')[0]}&apos;s Voice & What Matters:</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed italic">
                        &ldquo;{reviewPack.section_a.child_views}&rdquo;
                      </p>
                    </div>

                    <div className="p-3 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40 space-y-1">
                      <div className="font-bold text-navy dark:text-white">
                        <span>👩‍👦 {child ? `${child.preferred_name || child.first_name}'s Parent / Carer` : (reviewPack.child_name ? `${reviewPack.child_name.split(' ')[0]}'s Parent / Carer` : 'Parent / Carer')} (Parent Views & Progress):</span>
                      </div>
                      <p className="text-textSub dark:text-slate-300 leading-relaxed">
                        {reviewPack.section_a.parent_views}
                      </p>
                    </div>

                    <div className="text-[11px] text-textDim dark:text-slate-400 italic bg-cardSubtle p-2.5 rounded-xl border border-borderMain">
                      <strong>Aspirations: </strong>{reviewPack.section_a.child_aspirations}
                    </div>
                  </div>
                )}
              </div>

              {/* Section E: Target Progress */}
              <div className="card p-5 border-l-4 border-l-emerald-600 space-y-3">
                <div className="flex items-center justify-between border-b border-borderMain pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-200/50 dark:border-emerald-800/40">
                      E
                    </span>
                    <h4 className="text-sm font-bold text-navy dark:text-white">Section E: Measurable Outcomes & Target Progress</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 font-bold">
                    Statutory Targets
                  </span>
                </div>

                {reviewPack && (
                  <div className="space-y-2 text-xs">
                    {reviewPack.section_e.map((out) => (
                      <div key={out.target_id} className="p-2.5 bg-cardSubtle rounded-xl border border-borderMain space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-navy dark:text-white">{out.title}</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                            {out.status}
                          </span>
                        </div>
                        <p className="text-textSub dark:text-slate-300 text-[11px] leading-snug">{out.evidence_summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section B & Section F */}
            <div className="lg:col-span-6 space-y-4">
              {/* Section B: Special Educational Needs */}
              <div className="card p-5 border-l-4 border-l-purple-dark space-y-3">
                <div className="flex items-center justify-between border-b border-borderMain pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-purple-light dark:bg-purple-950/60 text-purple-dark dark:text-purple-300 flex items-center justify-center font-bold text-xs border border-purple-200/50 dark:border-purple-800/40">
                      B
                    </span>
                    <h4 className="text-sm font-bold text-navy dark:text-white">Section B: Special Educational Needs (4 Areas)</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-light dark:bg-purple-950/50 text-purple-dark dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40 font-bold">
                    Evidence Verified
                  </span>
                </div>

                {reviewPack && (
                  <div className="space-y-2.5 text-xs">
                    {reviewPack.section_b.map((need, idx) => (
                      <div key={idx} className="p-3 bg-cardSubtle rounded-xl border border-borderMain space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-navy dark:text-white">{need.area_of_need}</span>
                          <span className="text-[10px] text-teal dark:text-teal-300 font-semibold">
                            {need.evidence_count} Live Observations
                          </span>
                        </div>
                        <p className="text-textSub dark:text-slate-300 text-[11px] leading-snug">{need.statutory_summary}</p>
                        <div className="pt-1 text-[10px] text-textDim dark:text-slate-400">
                          <strong>Citations: </strong>{need.citations.join(' · ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section F: Quantified Provision */}
              <div className="card p-5 border-l-4 border-l-indigo-600 space-y-3">
                <div className="flex items-center justify-between border-b border-borderMain pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-200/50 dark:border-indigo-800/40">
                      F
                    </span>
                    <h4 className="text-sm font-bold text-navy dark:text-white">Section F: Quantified Special Provision Delivered</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40 font-bold">
                    100% Tracked
                  </span>
                </div>

                {reviewPack && (
                  <div className="space-y-2 text-xs">
                    {reviewPack.section_f.map((prov) => (
                      <div key={prov.provision_id} className="p-3 bg-cardSubtle rounded-xl border border-borderMain space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-navy dark:text-white">{prov.title}</span>
                          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-800/40 px-2 py-0.5 rounded-md">
                            {prov.evidence_delivery_rate}
                          </span>
                        </div>
                        <p className="text-purple-dark dark:text-purple-300 text-[11px] font-semibold">{prov.quantified_support}</p>
                        <p className="text-textDim dark:text-slate-400 text-[10px]">{prov.impact_notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Full Screen Review Pack Modal */}
          {showPackModal && (
            <AnnualReviewPackModal
              isOpen={showPackModal}
              onClose={() => setShowPackModal(false)}
              pack={reviewPack}
            />
          )}

          {/* Full Screen CAMHS Clinical Dossier Modal */}
          {showCamhsModal && (
            <CamhsEvidenceDossierModal
              isOpen={showCamhsModal}
              onClose={() => setShowCamhsModal(false)}
              dossier={camhsDossier}
            />
          )}
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: WHOLE-SCHOOL CASELOAD & PROVISION MAPPING MATRIX         */}
      {/* ============================================================== */}
      {activeTab === 'provision_map' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Caseload Strategic Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="stat-card border-teal">
              <div className="font-serif text-2xl font-bold text-teal">
                {provisionMatrix?.total_send_count ?? 0}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Whole-School SEND Caseload</div>
            </div>
            <div className="stat-card border border-gray-100 border-l-4 border-l-purple-600">
              <div className="font-serif text-2xl font-bold text-purple-900">
                {provisionMatrix?.ehcp_count ?? 0}
              </div>
              <div className="text-[10px] text-gray-600 mt-0.5">Statutory EHCPs Managed</div>
            </div>
            <div className="stat-card border border-gray-100 border-l-4 border-l-indigo-600">
              <div className="font-serif text-2xl font-bold text-indigo-800">
                {provisionMatrix?.sen_support_count ?? 0}
              </div>
              <div className="text-[10px] text-gray-600 mt-0.5">SEN Support (K) Learners</div>
            </div>
            <div className="stat-card border border-gray-100 border-l-4 border-l-emerald-600">
              <div className="font-serif text-2xl font-bold text-emerald-800">
                {provisionMatrix ? `${provisionMatrix.total_ta_hours_weekly.toFixed(0)}h` : '0h'}
              </div>
              <div className="text-[10px] text-gray-600 mt-0.5">1:1 TA Hours / Week</div>
            </div>
            <div className="stat-card border border-gray-100 border-l-4 border-l-amber-500">
              <div className="font-serif text-2xl font-bold text-amber-800">
                {provisionMatrix?.high_needs_funding_total || '£0'}
              </div>
              <div className="text-[10px] text-gray-600 mt-0.5">High Needs Block Funding</div>
            </div>
            <div className="stat-card border border-gray-100 border-l-4 border-l-rose-500">
              <div className="font-serif text-2xl font-bold text-rose-700">
                {provisionMatrix?.reviews_due_next_30_days ?? 0}
              </div>
              <div className="text-[10px] text-gray-600 mt-0.5">Reviews Due in &le; 30 Days</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="card p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-navy dark:text-white px-2">
              <Filter className="w-3.5 h-3.5 text-teal" />
              <span>Filter Caseload Register:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {[
                { key: 'all', label: `All Pupils (${provisionMatrix?.total_send_count ?? 0})` },
                { key: 'ehcp', label: `Statutory EHCP (${provisionMatrix?.ehcp_count ?? 0})` },
                { key: 'k', label: `SEN Support (${provisionMatrix?.sen_support_count ?? 0})` },
                { key: 'asc', label: 'ASC / Autism' },
                { key: 'adhd', label: 'ADHD' },
                { key: 'due_soon', label: '⚠️ Reviews Due Soon (≤30d)' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setProvisionFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    provisionFilter === f.key
                      ? 'bg-teal text-white shadow-xs font-bold'
                      : 'bg-cardSubtle border border-borderMain text-textDim hover:text-textMain hover:bg-slate-100 dark:hover:bg-[#1E324A]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Provision Table / Cards Container */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-borderMain flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-navy dark:text-white">
                  {currentUser?.school_name || provisionMatrix?.school_name || "Whole School"} Provision &amp; Funding Register (2026/2027)
                </h3>
                <p className="text-[11px] text-textDim dark:text-slate-400">
                  Showing {provisionMatrix ? getFilteredPupils(provisionMatrix.pupils).length : 0} active SEND learners with statutory review dates.
                </p>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-teal/10 text-teal dark:text-teal-300 border border-teal/20 font-bold hidden sm:inline">
                DfE SEND Code of Practice Compliant
              </span>
            </div>

            {loadingMatrix ? (
              <div className="p-12 text-center text-textDim dark:text-slate-400 text-xs">
                <div className="w-7 h-7 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Loading whole-school provision matrix...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-cardSubtle text-textDim dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-borderMain">
                      <th className="py-3 px-4">Pupil &amp; Year</th>
                      <th className="py-3 px-3">Support Tier</th>
                      <th className="py-3 px-3">Primary Need</th>
                      <th className="py-3 px-3">High Needs Funding Band</th>
                      <th className="py-3 px-3">Weekly 1:1 TA Hours</th>
                      <th className="py-3 px-3">Assigned Key Worker</th>
                      <th className="py-3 px-4">Annual Review Due</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-borderMain">
                    {provisionMatrix && getFilteredPupils(provisionMatrix.pupils).length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-textDim dark:text-slate-400">
                          <p className="font-semibold text-sm mb-1 text-navy dark:text-white">No pupils in current register</p>
                          <p className="text-xs">No active SEND learners registered yet for {currentUser?.school_name || "this school"}.</p>
                        </td>
                      </tr>
                    )}
                    {provisionMatrix &&
                      getFilteredPupils(provisionMatrix.pupils).map((p) => (
                        <tr key={p.id} className="hover:bg-slate-100/80 dark:hover:bg-[#1A2E44] transition-colors border-b border-gray-100 dark:border-borderMain">
                          <td className="py-3.5 px-4 font-bold text-navy dark:text-white">
                            <div className="flex items-center gap-2">
                              <span>{p.name}</span>
                              <span className="text-[10px] font-normal text-gray-400 dark:text-slate-400">({p.year_group})</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                p.support_tier.includes('EHCP')
                                  ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-700'
                                  : 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/80 dark:text-teal-200 dark:border-teal-700'
                              }`}
                            >
                              {p.support_tier}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-gray-600 dark:text-slate-300 max-w-[160px] truncate">
                            {p.primary_need}
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-gray-700 dark:text-slate-200">
                            {p.funding_band}
                          </td>
                          <td className="py-3.5 px-3 font-bold text-teal dark:text-mint">
                            {p.allocated_ta_hours > 0 ? `${p.allocated_ta_hours}h/wk` : 'Universal'}
                          </td>
                          <td className="py-3.5 px-3 text-gray-600 dark:text-slate-300">
                            {p.assigned_ta}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  p.review_status === 'overdue'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700'
                                    : p.review_status === 'due_soon'
                                    ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700'
                                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {p.review_status === 'overdue'
                                  ? '⚠️ Overdue'
                                  : p.review_status === 'due_soon'
                                  ? `⚠️ Due in ${p.days_until_review}d`
                                  : `In ${p.days_until_review}d`}
                              </span>
                              <span className="text-[11px] text-gray-400 dark:text-slate-400">{p.annual_review_due}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                handleTabSelect('review_pack');
                                setShowPackModal(true);
                              }}
                              className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-200 hover:underline cursor-pointer flex items-center gap-1 justify-end ml-auto"
                            >
                              <span>Pack</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: AI EVIDENCE RETRIEVAL & RAG ASSISTANT                   */}
      {/* ============================================================== */}
      {activeTab === 'assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Left Column: Ask NOYA & EHCP Outcomes */}
          <div className="lg:col-span-7 space-y-4">
            {/* Ask NOYA RAG & Evidence Tool */}
            <div className="card p-5 border-l-4 border-l-teal">
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal" />
                  <h3 className="text-sm font-bold text-navy">Ask NOYA &bull; SEND Longitudinal Evidence Retrieval</h3>
                </div>
                {onOpenCopilot && (
                  <button
                    type="button"
                    onClick={() => onOpenCopilot(query)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal border border-teal-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal" />
                    <span>Ask NOYA</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Ask questions across {child?.preferred_name || child?.first_name || 'the pupil'}&apos;s observation history, morning handovers, and EHCP provision records. Answers include verifiable citations.
              </p>

              <form onSubmit={handleAsk} className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask NOYA about triggers, strategies, or learning wins..."
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2.5 bg-teal hover:bg-teal-medium text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{loading ? 'Searching...' : 'Ask'}</span>
                </button>
              </form>

              {result && (
                <div className="p-4 rounded-xl bg-mint/10 border border-mint/40 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px] text-teal font-bold">
                    <span>NOYA Synthesis ({result.model_used})</span>
                    <span>{result.latency_ms}ms</span>
                  </div>
                  <div className="text-xs text-navy whitespace-pre-line leading-relaxed">
                    {result.answer_markdown}
                  </div>
                  {result.citations.length > 0 && (
                    <div className="pt-2 border-t border-mint/20 text-[10px] text-gray-500">
                      <span className="font-bold">Citations: </span>
                      {result.citations.map((c) => c.citation_text).join(' &bull; ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Statutory EHCP Progress Section */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-dark" />
                  <h3 className="text-sm font-bold text-navy">EHCP Annual Review & Outcomes</h3>
                </div>
                <span className="text-[10px] bg-purple-light text-purple-dark px-2 py-0.5 rounded-full font-bold">
                  Section F Active
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <div className="font-bold text-navy">Target 1: Sensory Regulation in Large Spaces</div>
                  <p className="text-gray-600">Provision: Access to noise defenders & visual timetable for whole-school transitions.</p>
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>On track &bull; 8 positive observation logs this term</span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <div className="font-bold text-navy">Target 2: Peer Collaboration & Group Tasks</div>
                  <p className="text-gray-600">Provision: Visual task breakdown strip for partner work in practical subjects.</p>
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Demonstrated in Science practical (Water density task)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Documents, Incidents & Caseload */}
          <div className="lg:col-span-5 space-y-4">
            {/* Statutory Documents Section */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-dark" />
                  <h3 className="text-sm font-bold text-navy">Statutory Documents ({documents.length})</h3>
                </div>
                {onOpenDocModal && (
                  <button
                    onClick={onOpenDocModal}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-purple-light text-purple-dark rounded-lg hover:bg-purple-200 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>+ Upload</span>
                  </button>
                )}
              </div>

              {documents.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No statutory documents uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-navy">{doc.title}</div>
                        <div className="text-[10px] text-gray-400">{doc.document_type} &bull; {(doc.file_size_bytes ? doc.file_size_bytes / 1024 : 0).toFixed(1)} KB</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Stored</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ABC Incident Triage */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-coral" />
                  <h3 className="text-sm font-bold text-navy">ABC Incidents ({incidents.length})</h3>
                  <AbcTooltip />
                </div>
                {onOpenIncidentModal && (
                  <button
                    onClick={onOpenIncidentModal}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 rounded-lg hover:bg-rose-100 cursor-pointer"
                  >
                    <span>+ Report ABC</span>
                  </button>
                )}
              </div>

              {incidents.length === 0 ? (
                <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Zero major incidents recorded this term.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-navy">
                        <span>{inc.location || 'Classroom'}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          inc.severity === 'Safeguarding Incident' ? 'bg-red-100 text-red-800' : 'bg-coral-100 text-coral-800'
                        }`}>
                          {inc.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600"><strong>A:</strong> {inc.antecedent}</p>
                      <p className="text-[11px] text-gray-600"><strong>B:</strong> {inc.behaviour}</p>
                      <p className="text-[11px] text-emerald-700"><strong>C:</strong> {inc.consequence}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inclusion Triage & Reviews */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <ShieldCheck className="w-4 h-4 text-teal" />
                <h3 className="text-sm font-bold text-navy">Inclusion Triage & Reviews</h3>
              </div>

              <div className="space-y-3">
                {provisionMatrix && provisionMatrix.pupils.length > 0 ? (
                  provisionMatrix.pupils.slice(0, 3).map((p) => (
                    <div key={p.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-navy">
                        <span>{p.name} ({p.year_group})</span>
                        <span className={`text-[10px] font-semibold ${p.review_status === 'due_soon' ? 'text-coral-dark' : 'text-emerald-700'}`}>
                          {p.review_status === 'due_soon' ? '⚠️ Review Due Soon' : 'Active'}
                        </span>
                      </div>
                      <p className="text-gray-500 text-[11px]">{p.primary_need} &bull; {p.support_tier} &bull; Key Worker: {p.assigned_ta}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 text-xs text-gray-400 text-center">
                    No active triage alerts for this school&apos;s caseload.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: SCHOOL STAFF & TEAM DIRECTORY (SENCO RECRUITING & DELEGATION) */}
      {/* ============================================================== */}
      {activeTab === 'staff_team' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Action Banner */}
          <div className="bg-gradient-to-r from-emerald-50/90 via-cardBg to-teal-50/50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-navy text-textMain dark:text-white p-5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-white/10 flex items-center justify-center text-xl font-bold font-serif text-emerald-800 dark:text-mint border border-emerald-200 dark:border-white/10">
                👥
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold font-serif text-navy dark:text-white">
                    School Staff & Inclusion Team Directory
                  </h3>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-400/20 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                    {currentUser?.school_name || "Assigned School"}
                  </span>
                </div>
                <p className="text-xs text-textDim dark:text-mint/80 mt-1 max-w-2xl">
                  SENCO operational authority: Appoint, provision, and allocate Classroom Teachers, Teaching Assistants, and Specialists within your school tenant.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={loadStaff}
                disabled={loadingStaff}
                className="px-3.5 py-2.5 rounded-xl bg-cardSubtle dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 text-textMain dark:text-white text-xs font-semibold transition-all border border-borderMain dark:border-white/15 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Refresh Staff List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStaff ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setIsAddStaffModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-teal hover:bg-teal-dark text-white text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-white" />
                <span>+ Add Staff Member</span>
              </button>
            </div>
          </div>

          {/* Provisioning Success Notification */}
          {provisionSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200 flex items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">
                    ✓ Successfully appointed and provisioned {provisionSuccessMsg.name} ({provisionSuccessMsg.email})
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-300">
                    Role: <span className="font-semibold uppercase tracking-wider">{provisionSuccessMsg.role}</span> &bull; Initial Password: <code className="bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900 dark:text-emerald-200">{provisionSuccessMsg.password || 'Welcome2026!'}</code> &bull; Invitation email logged in audit trail.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProvisionSuccessMsg(null)}
                className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 4 Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-cardBg p-4 rounded-2xl border border-borderMain shadow-2xs">
              <div className="flex items-center justify-between text-textDim dark:text-slate-400 mb-1">
                <span className="text-xs font-semibold">Total Appointed</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-serif text-navy dark:text-white">
                {staffList.length}
              </div>
              <p className="text-[10px] text-textDim dark:text-slate-400 mt-0.5">Active School Team</p>
            </div>

            <div className="bg-cardBg p-4 rounded-2xl border border-borderMain shadow-2xs">
              <div className="flex items-center justify-between text-textDim dark:text-slate-400 mb-1">
                <span className="text-xs font-semibold">Teachers</span>
                <GraduationCap className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold font-serif text-navy dark:text-white">
                {staffList.filter((s) => s.role === 'teacher').length}
              </div>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium mt-0.5">Classroom & Handover Leads</p>
            </div>

            <div className="bg-cardBg p-4 rounded-2xl border border-borderMain shadow-2xs">
              <div className="flex items-center justify-between text-textDim dark:text-slate-400 mb-1">
                <span className="text-xs font-semibold">1:1 TAs</span>
                <Users className="w-4 h-4 text-teal" />
              </div>
              <div className="text-2xl font-bold font-serif text-navy dark:text-white">
                {staffList.filter((s) => s.role === 'ta').length}
              </div>
              <p className="text-[10px] text-teal dark:text-teal-300 font-medium mt-0.5">SEND Transition & Daily Notes</p>
            </div>

            <div className="bg-cardBg p-4 rounded-2xl border border-borderMain shadow-2xs">
              <div className="flex items-center justify-between text-textDim dark:text-slate-400 mb-1">
                <span className="text-xs font-semibold">Specialists / SENCO</span>
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold font-serif text-navy dark:text-white">
                {staffList.filter((s) => s.role === 'specialist' || s.role === 'senco').length}
              </div>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">SaLT, Ed Psych & Leadership</p>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-cardBg p-3 rounded-2xl border border-borderMain shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setStaffFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  staffFilter === 'all'
                    ? 'bg-teal text-white shadow-xs font-bold'
                    : 'text-textDim hover:text-textMain hover:bg-slate-100 dark:hover:bg-[#1E324A]'
                }`}
              >
                All Staff ({staffList.length})
              </button>
              <button
                onClick={() => setStaffFilter('teacher')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  staffFilter === 'teacher'
                    ? 'bg-teal text-white shadow-xs font-bold'
                    : 'text-textDim hover:text-textMain hover:bg-slate-100 dark:hover:bg-[#1E324A]'
                }`}
              >
                Classroom Teachers ({staffList.filter((s) => s.role === 'teacher').length})
              </button>
              <button
                onClick={() => setStaffFilter('ta')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  staffFilter === 'ta'
                    ? 'bg-teal text-white shadow-xs font-bold'
                    : 'text-textDim hover:text-textMain hover:bg-slate-100 dark:hover:bg-[#1E324A]'
                }`}
              >
                Teaching Assistants ({staffList.filter((s) => s.role === 'ta').length})
              </button>
              <button
                onClick={() => setStaffFilter('specialist')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  staffFilter === 'specialist'
                    ? 'bg-teal text-white shadow-xs font-bold'
                    : 'text-textDim hover:text-textMain hover:bg-slate-100 dark:hover:bg-[#1E324A]'
                }`}
              >
                Specialists ({staffList.filter((s) => s.role === 'specialist').length})
              </button>
            </div>

            <div className="text-xs text-textDim dark:text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal" />
              <span>Strict School Tenant Boundary Enforced</span>
            </div>
          </div>

          {/* Staff Grid */}
          {loadingStaff ? (
            <div className="p-12 text-center text-textDim dark:text-slate-400 bg-cardBg rounded-2xl border border-borderMain">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal" />
              <p className="text-xs">Loading appointed school team...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffList
                .filter((s) => {
                  if (staffFilter === 'teacher') return s.role === 'teacher';
                  if (staffFilter === 'ta') return s.role === 'ta';
                  if (staffFilter === 'specialist') return s.role === 'specialist';
                  return true;
                })
                .map((staff) => {
                  const roleConfig = {
                    teacher: {
                      badge: 'Classroom Teacher',
                      badgeBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
                      avatarBg: 'bg-purple-600 text-white',
                      duties: 'Morning handovers, adapted lessons & visual worksheets',
                    },
                    ta: {
                      badge: '1:1 Teaching Assistant',
                      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
                      avatarBg: 'bg-emerald-600 text-white',
                      duties: 'Key transition support, quick classroom notes & calming steps',
                    },
                    specialist: {
                      badge: 'Specialist / Therapist',
                      badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
                      avatarBg: 'bg-indigo-600 text-white',
                      duties: 'Clinical observations, SaLT therapy programs & diagnostic reports',
                    },
                    senco: {
                      badge: 'Lead SENCO & Inclusion Lead',
                      badgeBg: 'bg-teal/10 dark:bg-teal-950/60 text-teal dark:text-teal-300 border-teal/20 dark:border-teal-800/40',
                      avatarBg: 'bg-teal text-white',
                      duties: 'Statutory Section 44 packs, SEND register & staff team management',
                    },
                  }[staff.role] || {
                    badge: staff.role.toUpperCase(),
                    badgeBg: 'bg-cardSubtle text-textDim border-borderMain',
                    avatarBg: 'bg-gray-600 text-white',
                    duties: 'Staff operations',
                  };

                  const initials = staff.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div
                      key={staff.id}
                      className="bg-cardBg rounded-2xl border border-borderMain p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${roleConfig.avatarBg}`}
                            >
                              {initials}
                            </div>
                            <div>
                              <h4 className="font-bold text-navy dark:text-white text-sm leading-tight">
                                {staff.full_name}
                              </h4>
                              <a
                                href={`mailto:${staff.email}`}
                                className="text-[11px] text-textDim dark:text-slate-400 hover:text-teal dark:hover:text-teal-300 flex items-center gap-1 mt-0.5"
                              >
                                <Mail className="w-3 h-3" />
                                <span>{staff.email}</span>
                              </a>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleConfig.badgeBg} whitespace-nowrap`}
                          >
                            {roleConfig.badge}
                          </span>
                        </div>

                        <div className="space-y-1.5 py-3 border-t border-b border-borderMain my-3 text-xs">
                          <div className="flex justify-between items-center text-textDim dark:text-slate-400">
                            <span>Assigned Tenant:</span>
                            <span className="font-semibold text-navy dark:text-white">
                              {staff.school_name || currentUser?.school_name || "Assigned School"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-textDim dark:text-slate-400">
                            <span>Status:</span>
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                              <UserCheck className="w-3 h-3" />
                              Active & Verified
                            </span>
                          </div>
                        </div>

                        <div className="bg-cardSubtle p-2.5 rounded-xl border border-borderMain">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-textDim dark:text-slate-400 block mb-1">
                            Delegated Responsibilities:
                          </span>
                          <p className="text-[11px] text-textSub dark:text-slate-300 leading-relaxed">
                            {roleConfig.duties}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-borderMain flex items-center justify-between text-[11px] text-textDim dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(staff)}
                            className="px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-slate-100 dark:hover:bg-[#1E324A] text-textSub dark:text-slate-300 border border-borderMain font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                            title="Edit staff profile"
                          >
                            <Edit3 className="w-3 h-3 text-textDim dark:text-slate-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingStaff(staff)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                            title="Delete staff account"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>Delete</span>
                          </button>
                        </div>
                        <span className="text-teal dark:text-teal-300 font-semibold">1-Click Connected</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Modal: Add Staff Member */}
          {isAddStaffModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-cardBg rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-borderMain text-textMain animate-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-borderMain">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/40">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-navy dark:text-white text-base">
                        Provision School Staff Member
                      </h3>
                      <p className="text-xs text-textDim dark:text-slate-400">
                        {currentUser?.school_name || "School"} &bull; Recruited under SENCO leadership
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAddStaffModalOpen(false)}
                    className="text-textDim hover:text-textMain p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E324A] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleProvisionStaff} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-navy dark:text-white mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={staffForm.firstName}
                        onChange={(e) =>
                          setStaffForm({ ...staffForm, firstName: e.target.value })
                        }
                        placeholder="e.g. Thomas"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-hidden focus:border-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-navy dark:text-white mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={staffForm.lastName}
                        onChange={(e) =>
                          setStaffForm({ ...staffForm, lastName: e.target.value })
                        }
                        placeholder="e.g. Clarke"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-hidden focus:border-teal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy dark:text-white mb-1">
                      School Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={staffForm.email}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, email: e.target.value })
                      }
                      placeholder="e.g. teacher@school.sch.uk"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-hidden focus:border-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy dark:text-white mb-1">
                      Role & Support Tier *
                    </label>
                    <select
                      value={staffForm.role}
                      onChange={(e) =>
                        setStaffForm({
                          ...staffForm,
                          role: e.target.value as 'teacher' | 'ta' | 'specialist',
                        })
                      }
                      className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-hidden focus:border-teal cursor-pointer"
                    >
                      <option value="teacher">Classroom Teacher (Class Lead, Handover recipient)</option>
                      <option value="ta">Teaching Assistant / 1:1 Support (Classroom notes, Transition support)</option>
                      <option value="specialist">Specialist / Therapist / SaLT (Clinical observations)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy dark:text-white mb-1">
                      Class / Room / Specialism Assignment
                    </label>
                    <input
                      type="text"
                      value={staffForm.jobTitle}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, jobTitle: e.target.value })
                      }
                      placeholder="e.g. Year 4 Teacher (Room 2) or Autism 1:1 Specialist"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-hidden focus:border-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy dark:text-white mb-1">
                      Initial Temporary Password (Optional)
                    </label>
                    <input
                      type="text"
                      value={staffForm.password}
                      onChange={(e) =>
                        setStaffForm({ ...staffForm, password: e.target.value })
                      }
                      placeholder="Defaults to Welcome2026!"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-hidden focus:border-teal font-mono"
                    />
                    <p className="text-[10px] text-textDim dark:text-slate-400 mt-1">
                      The user will be prompted to change their password upon first login.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-borderMain flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsAddStaffModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-textDim hover:text-textMain hover:bg-slate-100 dark:hover:bg-[#1E324A] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingStaff}
                      className="px-5 py-2.5 rounded-xl bg-teal hover:bg-teal-dark text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {submittingStaff ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Provisioning...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Appoint & Provision Staff</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Edit Staff Member */}
          {editingStaff && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-cardBg rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-borderMain text-textMain animate-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-borderMain">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center border border-purple-200/50 dark:border-purple-800/40">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-navy dark:text-white text-base">
                        Edit Staff Member Profile
                      </h3>
                      <p className="text-xs text-textDim dark:text-slate-400">
                        {editingStaff.full_name} &bull; {editingStaff.school_name || currentUser?.school_name || "Assigned School"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingStaff(null)}
                    className="text-textDim hover:text-textMain p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1E324A] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-navy dark:text-white mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.firstName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, firstName: e.target.value })
                        }
                        className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-hidden focus:border-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-navy dark:text-white mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.lastName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, lastName: e.target.value })
                        }
                        className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-hidden focus:border-teal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy dark:text-white mb-1">
                      School Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-hidden focus:border-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy dark:text-white mb-1">
                      Role & Support Tier *
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          role: e.target.value,
                        })
                      }
                      className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-hidden focus:border-teal cursor-pointer"
                    >
                      <option value="teacher">Classroom Teacher</option>
                      <option value="ta">Teaching Assistant / 1:1 Support</option>
                      <option value="specialist">Specialist / Therapist / SaLT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy dark:text-white mb-1">
                      Class / Room / Specialism Assignment
                    </label>
                    <input
                      type="text"
                      value={editForm.jobTitle}
                      onChange={(e) =>
                        setEditForm({ ...editForm, jobTitle: e.target.value })
                      }
                      placeholder="e.g. Year 5 Class Teacher (Room 4)"
                      className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-hidden focus:border-teal"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="edit-is-active"
                      checked={editForm.isActive}
                      onChange={(e) =>
                        setEditForm({ ...editForm, isActive: e.target.checked })
                      }
                      className="rounded border-borderMain text-teal focus:ring-teal cursor-pointer"
                    />
                    <label htmlFor="edit-is-active" className="text-xs font-semibold text-textSub dark:text-slate-300 cursor-pointer">
                      Active Account (uncheck to suspend access)
                    </label>
                  </div>

                  <div className="pt-3 border-t border-borderMain flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEditingStaff(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-textDim hover:text-textMain hover:bg-slate-100 dark:hover:bg-[#1E324A] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="px-5 py-2.5 rounded-xl bg-teal hover:bg-teal-dark text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingEdit ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Delete Staff Member Confirmation */}
          {deletingStaff && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="bg-cardBg rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900/50 text-textMain animate-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3.5 mb-4 text-rose-600 dark:text-rose-400">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/50 dark:border-rose-800/40 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy dark:text-white text-base leading-tight">
                      Delete Staff Account?
                    </h3>
                    <p className="text-xs text-textDim dark:text-slate-400 mt-0.5">
                      This action will revoke access and remove the staff member.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-cardSubtle rounded-xl border border-borderMain text-xs space-y-1.5 mb-4">
                  <div className="flex justify-between">
                    <span className="text-textDim dark:text-slate-400">Name:</span>
                    <span className="font-bold text-navy dark:text-white">{deletingStaff.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textDim dark:text-slate-400">Email:</span>
                    <span className="font-semibold text-textSub dark:text-slate-300">{deletingStaff.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textDim dark:text-slate-400">Role:</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">{deletingStaff.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textDim dark:text-slate-400">Tenant:</span>
                    <span className="font-medium text-textSub dark:text-slate-300">{deletingStaff.school_name || currentUser?.school_name || "Assigned School"}</span>
                  </div>
                </div>

                <p className="text-[11px] text-textDim dark:text-slate-400 mb-5 leading-relaxed">
                  Historical clinical observations and safeguarding notes previously submitted by this user will be preserved in the audit trail.
                </p>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeletingStaff(null)}
                    disabled={confirmingDelete}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-textDim hover:text-textMain hover:bg-slate-100 dark:hover:bg-[#1E324A] cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={confirmingDelete}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {confirmingDelete ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Confirm Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: SEND OPERATIONAL REPORTS & EVIDENCE ANALYTICS           */}
      {/* ============================================================== */}
      {activeTab === 'reports_analytics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <AnalyticsReportsDashboard />
        </div>
      )}
    </div>
  );
};
