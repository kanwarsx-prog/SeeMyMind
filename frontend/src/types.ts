export interface SupportProfile {
  id: string;
  child_id: string;
  primary_need?: string;
  secondary_need?: string;
  summary?: string;
  communication_preferences?: string;
  sensory_profile?: string;
  strengths_interests?: string;
  has_ehcp: boolean;
}

export interface Child {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  preferred_name?: string;
  date_of_birth: string;
  sex: string;
  year_group?: string;
  room_name?: string;
  school_id?: string;
  active: boolean;
  support_profile?: SupportProfile;
}

export interface ObservationDetail {
  id: string;
  event_id: string;
  activity_context?: string;
  engagement_level?: string;
  strategy_used?: string;
  strategy_worked?: boolean;
  strengths_observed?: string;
  notes?: string;
}

export interface TransitionLogDetail {
  id: string;
  event_id: string;
  transition_type: string;
  sleep_quality?: string;
  morning_mood?: string;
  breakfast_eaten?: boolean;
  medication_given?: boolean;
  special_notes_for_day?: string;
  acknowledged_by_staff: boolean;
  acknowledged_at?: string;
  created_at?: string;
  event_time?: string;
}

export interface ChildCheckInDetail {
  id: string;
  event_id: string;
  mood_emoji: string;
  mood_label: string;
  energy_level?: number;
  self_regulation_need?: string;
  voice_note_text?: string;
}

export interface ChildEvent {
  id: string;
  child_id: string;
  school_id?: string;
  event_time: string;
  event_type: string;
  reporter_type: string;
  reporter_name?: string;
  title: string;
  summary: string;
  significance: string;
  visibility: string;
  status: string;
  observation?: ObservationDetail;
  transition_log?: TransitionLogDetail;
  child_check_in?: ChildCheckInDetail;
}

export interface EvidenceCitation {
  citation_text: string;
  snippet?: string;
  event_id?: string;
}

export interface MorningBriefing {
  child_id: string;
  child_name: string;
  briefing_date: string;
  summary_markdown: string;
  recommended_focus: string[];
  citations: EvidenceCitation[];
  confidence_level: string;
}

export interface AskNoyaResponse {
  question: string;
  answer_markdown: string;
  citations: EvidenceCitation[];
  model_used: string;
  latency_ms: number;
}

export interface NoyaChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface NoyaActionCard {
  card_type: 'contact_card' | 'handover_card' | 'de_escalation_card' | 'proposed_action' | 'day_summary_card' | string;
  type?: string;
  title: string;
  subtitle?: string;
  primary_action?: {
    type: 'phone' | 'email' | 'url';
    label: string;
    value: string;
  };
  action_type?: 'log_observation' | 'calming_win' | 'morning_receipt' | string;
  status?: 'pending' | 'confirmed' | 'dismissed';
  child_id?: string;
  payload?: Record<string, any>;
  details?: Record<string, any>;
  badges?: string[];
  restricted?: boolean;
}

export interface NoyaCopilotChatRequest {
  child_id?: string;
  active_view?: string;
  message: string;
  history?: NoyaChatMessage[];
}

export interface NoyaExecutionStep {
  step_number: number;
  title: string;
  detail: string;
  tool_name?: string | null;
  status: string;
  findings?: string | null;
  latency_ms?: number;
}

export interface NoyaCopilotChatResponse {
  answer_markdown: string;
  action_card?: NoyaActionCard | null;
  suggested_followups?: string[];
  tool_called?: string | null;
  citations?: EvidenceCitation[];
  model_used?: string;
  latency_ms?: number;
  execution_steps?: NoyaExecutionStep[];
}

export interface IncidentDetail {
  id: string;
  event_id: string;
  child_id: string;
  event_time: string;
  reporter_name?: string;
  reporter_type: string;
  location?: string;
  severity: string;
  antecedent: string;
  behaviour: string;
  consequence: string;
  de_escalation_strategy_used?: string;
  recovery_time_minutes?: number;
  parent_notified: boolean;
  status: string;
}

export interface IncidentSubmission {
  child_id: string;
  reporter_name?: string;
  reporter_type?: string;
  location?: string;
  severity: string;
  antecedent: string;
  behaviour: string;
  consequence: string;
  de_escalation_strategy_used?: string;
  recovery_time_minutes?: number;
  parent_notified?: boolean;
  follow_up_action?: string;
}

export interface DocumentItem {
  id: string;
  child_id: string;
  school_id?: string;
  title: string;
  document_type: string;
  storage_path: string;
  file_size_bytes?: number;
  mime_type?: string;
  is_indexed: boolean;
  created_at: string;
}

export interface PathwayStep {
  number: number;
  title: string;
  description: string;
  status: 'done' | 'active' | 'next' | 'locked';
  badge: string;
  sensory_pause_after?: boolean;
}

export interface PeerAdaptation {
  initials: string;
  name: string;
  need: string;
  route: string;
  method: 'Auditory' | 'Kinesthetic' | 'Written' | 'Visual';
  color: string;
}

export interface CurriculumUnit {
  id: string;
  subject: string;
  year_group: string;
  key_stage?: string;
  title: string;
  strand: string;
  default_objective: string;
  source?: string;
  external_slug?: string;
}

export interface CurriculumMetadataResponse {
  year_groups: string[];
  subjects: string[];
  total_units: number;
}

export interface PathwayGenerateRequest {
  child_id: string;
  subject?: string;
  topic: string;
  learning_objective?: string;
  scaffolding_method?: string;
  use_ai?: boolean;
}

export interface AIRunAuditItem {
  id: string;
  created_at: string;
  requester_role: string;
  prompt_type: string;
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  status: string;
  child_id?: string | null;
  input_prompt?: string | null;
  output_text?: string | null;
  execution_steps?: NoyaExecutionStep[] | null;
}


export interface LessonPathwayResponse {
  child_id: string;
  child_name: string;
  subject: string;
  topic: string;
  learning_objective: string;
  cognitive_rationale: string;
  steps: PathwayStep[];
  ta_briefing: string;
  peer_adaptations: PeerAdaptation[];
  generated_at: string;
  model_used: string;
}

export interface SubjectProgress {
  subject: string;
  total_units: number;
  completed_units: number;
  in_progress_units: number;
  percentage: number;
}

export interface UnitProgressItem {
  unit_id: string;
  title: string;
  subject: string;
  strand: string;
  year_group: string;
  default_objective: string;
  status: 'mastered' | 'in_progress' | 'not_started' | 'adapted_ready';
  last_scaffolded_at?: string | null;
  accommodations_used: string[];
  mastery_note?: string | null;
}

export interface PupilCurriculumProgressResponse {
  child_id: string;
  child_name: string;
  year_group: string;
  primary_need: string;
  total_statutory_units: number;
  total_completed_units: number;
  total_in_progress_units: number;
  coverage_percentage: number;
  subjects_breakdown: SubjectProgress[];
  units: UnitProgressItem[];
  strengths_summary: string;
  next_recommended_units: string[];
}

export type RoleView = 'teacher' | 'senco' | 'parent' | 'child' | 'ta' | 'parentplus' | 'admin';
export type TeacherSubView = 'focused' | 'matrix' | 'pathways' | 'provision_map' | 'briefings';

export interface ClassroomMorningHandover {
  id: string;
  sleep_quality: string;
  morning_mood: string;
  breakfast_eaten: boolean;
  medication_given: boolean;
  special_notes_for_day: string;
  acknowledged_by_staff: boolean;
  acknowledged_at?: string | null;
  alerts?: string[];
}

export interface EmailPreview {
  to_email: string;
  subject: string;
  html_content: string;
  preview_text?: string;
  activation_url: string;
  sent_at: string;
  delivery_channel?: 'resend' | 'smtp' | 'preview';
  external_id?: string;
  delivery_error?: string;
}

export interface ChildRegistrationRequest {
  first_name: string;
  last_name: string;
  preferred_name?: string;
  date_of_birth: string;
  sex: string;
  year_group?: string;
  school_id?: string;
  primary_need?: string;
  secondary_need?: string;
  has_ehcp?: boolean;
  ehcp_status?: string;
  summary?: string;
  communication_preferences?: string;
  sensory_profile?: string;
  strengths_interests?: string;
  baseline_strategy?: string;
  guardian_first_name: string;
  guardian_last_name: string;
  guardian_email: string;
  guardian_mobile?: string;
  relationship_to_child?: string;
  send_invitation_immediately?: boolean;
}

export interface ChildRegistrationResponse {
  child_id: string;
  full_name: string;
  school_id: string;
  guardian_id: string;
  invitation_id?: string;
  invitation_token?: string;
  invitation_url?: string;
  email_preview?: EmailPreview;
  message: string;
}

export interface InvitationValidationResponse {
  token: string;
  valid: boolean;
  recipient_email: string;
  child_id?: string;
  child_name?: string;
  school_name?: string;
  role?: string;
  expires_at?: string;
}

export interface AcceptInvitationRequest {
  token: string;
  password: string;
  full_name?: string;
}

export interface ChildAccountSetupRequest {
  child_id: string;
  username: string;
  pin: string;
  avatar_emoji?: string;
}

export interface ChildAccountResponse {
  id: string;
  child_id: string;
  username: string;
  avatar_emoji: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  school_id?: string;
  school_name?: string;
  child_id?: string;
  guardian_id?: string;
  username?: string;
  avatar_emoji?: string;
  theme_preference?: 'light' | 'dark' | 'system';
}

export interface ClassroomPupilSummary {
  id: string;
  name: string;
  preferred_name: string;
  year_group: string;
  primary_need: string;
  secondary_need?: string;
  has_ehcp: boolean;
  support_tier: string;
  readiness_status: string;
  readiness_level: 'green' | 'amber' | 'red';
  primary_triggers: string[];
  sensory_calming_tools: string[];
  buddy_pairing?: string;
  subject_accommodations: {
    maths?: string;
    english?: string;
    science?: string;
    assembly?: string;
    [key: string]: string | undefined;
  };
  handover?: ClassroomMorningHandover;
}

export interface ClassroomMatrixData {
  room_name: string;
  year_group: string;
  lead_teacher: string;
  assigned_ta: string;
  total_send_count: number;
  ehcp_count: number;
  cohort: ClassroomPupilSummary[];
}

export interface SectionAViews {
  child_views: string;
  child_aspirations: string;
  parent_views: string;
  parent_aspirations: string;
  co_production_notes: string;
}

export interface SectionBNeed {
  area_of_need: string;
  statutory_summary: string;
  observed_impact: string;
  evidence_count: number;
  citations: string[];
}

export interface SectionEOutcome {
  target_id: string;
  title: string;
  category: string;
  status: 'Met' | 'On Track' | 'Needs Review';
  evidence_summary: string;
  last_reviewed: string;
}

export interface SectionFProvision {
  provision_id: string;
  title: string;
  quantified_support: string;
  evidence_delivery_rate: string;
  strategies_used: string[];
  impact_notes: string;
}

export interface AnnualReviewMetrics {
  total_evidence_observations: number;
  de_escalation_win_rate: string;
  morning_handovers_received: number;
  safeguarding_incidents: number;
  active_ehcp_days: number;
}

export interface AnnualReviewPackResponse {
  child_id: string;
  child_name: string;
  date_of_birth: string;
  year_group: string;
  primary_need: string;
  school_name: string;
  senco_name: string;
  review_date: string;
  statutory_status: string;
  metrics: {
    total_evidence_observations: number;
    de_escalation_win_rate: string;
    morning_handovers_received: number;
    safeguarding_incidents: number;
    active_ehcp_days: number;
  };
  section_a: SectionAViews;
  section_b: SectionBNeed[];
  section_e: SectionEOutcome[];
  section_f: SectionFProvision[];
  senco_recommendations: string;
}

export interface ProvisionMapPupil {
  id: string;
  name: string;
  year_group: string;
  primary_need: string;
  support_tier: string;
  funding_band: string;
  allocated_ta_hours: number;
  assigned_ta: string;
  annual_review_due: string;
  days_until_review: number;
  review_status: 'overdue' | 'due_soon' | 'scheduled';
}

export interface SchoolProvisionMatrixResponse {
  school_name: string;
  academic_year: string;
  lead_senco: string;
  total_send_count: number;
  ehcp_count: number;
  sen_support_count: number;
  total_ta_hours_weekly: number;
  high_needs_funding_total: string;
  reviews_due_next_30_days: number;
  pupils: ProvisionMapPupil[];
}

// Parent Decompression & Masking Hub
export interface AdultClue {
  source: string;
  role: string;
  time: string;
  observation: string;
  significance: string;
  marker_type: string;
}

export interface DecompressionStep {
  step: number;
  title: string;
  subtitle: string;
  description: string;
  icon_type: string;
  tag: string;
}

export interface DecompressionBridgeResponse {
  child_id: string;
  child_name: string;
  battery_percentage: number;
  battery_status: string;
  battery_color: string;
  masking_level: string;
  masking_explanation: string;
  draining_factors: string[];
  recharging_factors: string[];
  adult_observation_clues: AdultClue[];
  decompression_recipe: DecompressionStep[];
  recommended_evening_activities: string[];
  generated_at: string;
}

export interface EveningCheckInCreate {
  child_id?: string;
  parent_name?: string;
  after_school_decompression: string;
  evening_mood: string;
  dinner_eaten: boolean;
  screen_free_downtime_minutes: number;
  notes_for_tomorrow?: string;
}

export interface EveningCheckInResponse {
  id: string;
  event_id: string;
  child_id: string;
  parent_name: string;
  after_school_decompression: string;
  evening_mood: string;
  dinner_eaten: boolean;
  screen_free_downtime_minutes: number;
  notes_for_tomorrow?: string;
  logged_at: string;
}

export interface CorrelationInsightItem {
  factor: string;
  incident_rate: string;
  effect: string;
  confidence: string;
  status: 'positive' | 'warning' | 'neutral';
}

export interface MedicationCorrelationResponse {
  child_id: string;
  child_name: string;
  medication_name: string;
  morning_window: string;
  dip_window: string;
  total_days_analyzed: number;
  optimal_conditions: string[];
  correlation_insights: CorrelationInsightItem[];
  pediatrician_summary: string;
  generated_at: string;
}

export interface ParentWinsGalleryItem {
  id: string;
  child_id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  teacher_quote: string;
  celebration_badge: string;
  tags: string[];
}

// Trust & Multi-School Governance Types
export interface SchoolTenant {
  id: string;
  school_name: string;
  urn_number?: string;
  phase?: string;
  local_authority?: string;
  lead_senco_name?: string;
  school_reference?: string;
  town_city?: string;
  postcode?: string;
  main_email?: string;
  main_telephone?: string;
  active: boolean;
  pupil_count: number;
  staff_count: number;
  created_at: string;
}

export interface AdminSchoolCreate {
  school_name: string;
  urn_number: string;
  phase?: string;
  local_authority?: string;
  lead_senco_name?: string;
  school_reference?: string;
  town_city?: string;
  postcode?: string;
  main_email?: string;
  main_telephone?: string;
}

export interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  school_id?: string;
  school_name: string;
  is_active: boolean;
  is_verified: boolean;
  created_at?: string;
}

export interface StaffProvisionRequest {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  school_id?: string;
  job_title?: string;
  password?: string;
}

export interface StaffUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  job_title?: string;
  is_active?: boolean;
}

export interface StaffProvisionResponse {
  user_id: string;
  staff_id?: string;
  email: string;
  full_name: string;
  role: string;
  school_id: string;
  school_name: string;
  job_title?: string;
  temporary_credentials: string;
  invitation_token?: string;
  message: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_id?: string;
  actor_name: string;
  actor_role: string;
  school_id?: string;
  school_name?: string;
  action: string;
  target_type: string;
  target_id?: string;
  target_name?: string;
  details: string;
  ip_address?: string;
}

export interface TrustGovernanceStats {
  total_schools: number;
  total_staff: number;
  total_pupils: number;
  ehcp_pupils: number;
  compliance_score: string;
  audit_events_count: number;
  lead_trust_admin: string;
}

export interface DelegationMatrixItem {
  role_key: string;
  role_title: string;
  tier: string;
  authorities: string[];
  delegated_responsibilities: string[];
  safeguarding_scope: string;
  data_boundary: string;
}

// Reporting & Analytics Suite Types
export interface SchoolAnalyticsOverview {
  school_name: string;
  total_send_pupils: number;
  ehcp_count: number;
  sen_support_count: number;
  total_weekly_ta_hours_allocated: number;
  total_weekly_ta_hours_delivered: number;
  provision_delivery_rate: number;
  overall_de_escalation_win_rate: number;
  total_incidents_this_term: number;
  peak_vulnerability_window: string;
  annual_reviews_on_track_rate: number;
}

export interface HeatmapPeriodSlot {
  period_id: string;
  period_label: string;
  time_window: string;
  incident_counts: Record<string, number>;
  total_count: number;
  intensity: 'none' | 'low' | 'medium' | 'high';
}

export interface IncidentHeatmapResponse {
  days: string[];
  day_keys: string[];
  periods: HeatmapPeriodSlot[];
  total_incidents: number;
  peak_window: string;
}

export interface TriggerCategoryMetric {
  category: string;
  label: string;
  count: number;
  percentage: number;
  primary_antecedent_examples: string[];
}

export interface TriggersReportResponse {
  total_recorded_triggers: number;
  triggers: TriggerCategoryMetric[];
}

export interface StrategyWinRateMetric {
  strategy_id: string;
  title: string;
  category: string;
  total_attempts: number;
  successful_resolutions: number;
  win_rate_percentage: number;
  avg_recovery_minutes: number;
  recommended_for: string[];
}

export interface StrategyEfficacyResponse {
  overall_win_rate: number;
  total_strategies_evaluated: number;
  strategies: StrategyWinRateMetric[];
}

export interface FundingBandBreakdown {
  band: string;
  annual_amount_per_pupil: string;
  pupil_count: number;
  total_funding: string;
  weekly_ta_hours_allocated: number;
  weekly_ta_hours_delivered: number;
  delivery_compliance_percentage: number;
}

export interface ProvisionAuditResponse {
  school_name: string;
  academic_year: string;
  total_high_needs_funding: string;
  total_allocated_ta_hours: number;
  total_delivered_ta_hours: number;
  overall_compliance_rate: number;
  bands: FundingBandBreakdown[];
}

// Statutory SEN Information Report & Governor Pack (Regulation 51)
export interface StatutorySchoolHeader {
  school_name: string;
  urn: string;
  dfe_number: string;
  academic_year: string;
  lead_senco: string;
  senco_qualifications: string;
  headteacher: string;
  send_governor: string;
  publication_date: string;
}

export interface CaseloadNeedCategory {
  code_of_practice_area: string;
  primary_diagnoses: string[];
  pupil_count: number;
  percentage_of_send: number;
  key_adaptations_provided: string[];
}

export interface CaseloadDemographics {
  total_pupils_in_school: number;
  total_send_count: number;
  send_percentage_school: number;
  ehcp_count: number;
  ehcp_percentage_school: number;
  sen_support_count: number;
  needs_distribution: CaseloadNeedCategory[];
}

export interface StatutoryProvisionAuditSummary {
  total_high_needs_funding: string;
  weekly_ta_hours_allocated: number;
  weekly_ta_hours_delivered: number;
  statutory_delivery_compliance_rate: number;
  band_breakdown: Array<{
    band: string;
    annual_amount: string;
    pupils: number;
    total_spend: string;
    allocated_hours: string;
    delivered_hours: string;
    compliance: string;
  }>;
  deployment_model: string;
}

export interface EmpiricalEfficacyAudit {
  de_escalation_win_rate: number;
  total_interventions_recorded: number;
  fixed_term_exclusions: number;
  permanent_exclusions: number;
  average_attendance_rate: number;
  breakthrough_milestones_logged: number;
  top_effective_strategies: string[];
  statutory_evaluation_narrative: string;
}

export interface CoProductionAudit {
  daily_morning_handovers_active: number;
  pupil_voice_checkins_this_term: number;
  parent_satisfaction_percentage: number;
  multi_agency_partners: string[];
}

export interface StatutoryReviewComplianceAudit {
  annual_reviews_due_this_year: number;
  annual_reviews_completed_or_on_track: number;
  overdue_reviews: number;
  statutory_compliance_rate: number;
}

export interface SenInformationReportResponse {
  header: StatutorySchoolHeader;
  demographics: CaseloadDemographics;
  provision_audit: StatutoryProvisionAuditSummary;
  efficacy: EmpiricalEfficacyAudit;
  co_production: CoProductionAudit;
  annual_review_compliance: StatutoryReviewComplianceAudit;
  senco_strategic_commentary: string;
  priorities_for_next_year: string[];
  governance_declaration: string;
}

// CAMHS / Pediatrician Multi-Agency Clinical Dossier (NICE NG87 / CG128)
export interface ClinicalPatientHeader {
  child_id: string;
  full_name: string;
  preferred_name: string;
  date_of_birth: string;
  chronological_age: string;
  nhs_number: string;
  school_name: string;
  school_urn: string;
  year_group: string;
  primary_need: string;
  lead_senco_name: string;
  class_teacher_name: string;
  primary_ta_name: string;
  parent_carer_name: string;
  referring_clinic: string;
  reporting_window: string;
}

export interface MedicationTitrationAudit {
  medication_name: string;
  dosage: string;
  formulation: string;
  prescribed_schedule: string;
  administration_time_logged: string;
  peak_bioavailability_window: string;
  mid_morning_dip_window: string;
  caloric_co_ingestion_compliance: string;
  fasted_vs_fed_incident_ratio: string;
  clinical_observation: string;
}

export interface CrossSettingConcordanceItem {
  domain: string;
  home_presentation: string;
  school_presentation: string;
  concordance_level: string;
  clinical_significance: string;
}

export interface SensoryEnvironmentAudit {
  primary_sensory_triggers: string[];
  acoustic_decibel_tolerance: string;
  average_latency_to_de_escalate_minutes: number;
  top_effective_accommodations: string[];
  ineffective_or_escalating_actions: string[];
  fixed_or_permanent_exclusions: number;
}

export interface RestraintCollapseAnalysis {
  masking_index_score: number;
  school_compliance_rating: string;
  post_school_collapse_frequency: string;
  autonomic_depletion_mechanism: string;
  home_decompression_recommendation: string;
}

export interface ClinicalRecommendationItem {
  category: string;
  recommendation: string;
  statutory_anchor: string;
}

export interface CamhsClinicalDossierResponse {
  patient_header: ClinicalPatientHeader;
  medication_audit: MedicationTitrationAudit;
  cross_setting_concordance: CrossSettingConcordanceItem[];
  sensory_environment_audit: SensoryEnvironmentAudit;
  restraint_collapse_analysis: RestraintCollapseAnalysis;
  clinical_recommendations: ClinicalRecommendationItem[];
  nice_guideline_compliance: string;
  compiled_at: string;
}

// Teacher Classroom Provision Map & Graduated Response Review (CoP 6.44-6.56)
export interface GraduatedResponseItem {
  pupil_id: string;
  name: string;
  preferred_name: string;
  support_tier: string;
  primary_need: string;
  assigned_ta: string;
  weekly_ta_hours: number;
  assess_notes: string;
  plan_targets: string[];
  do_provisions: string[];
  review_efficacy: string;
  review_outcome: 'Target Met' | 'Significant Progress' | 'Needs Revision' | 'Escalate to EHCP' | string;
  breakthrough_milestones: string[];
  recommended_next_steps: string;
}

export interface ClassroomProvisionSummary {
  room_name: string;
  year_group: string;
  class_teacher_name: string;
  primary_ta_name: string;
  review_period: string;
  total_send_pupils: number;
  ehcp_count: number;
  sen_support_count: number;
  total_weekly_ta_hours: number;
  overall_class_win_rate: number;
  graduated_responses: GraduatedResponseItem[];
  statutory_declaration: string;
  generated_at: string;
  school_name?: string;
}





