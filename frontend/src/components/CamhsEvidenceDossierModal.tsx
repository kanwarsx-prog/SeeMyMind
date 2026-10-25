import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Pill,
  Sparkles,
  AlertTriangle,
  Heart,
  FileText,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { CamhsClinicalDossierResponse } from '../types';

interface CamhsEvidenceDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: CamhsClinicalDossierResponse | null;
}

export const CamhsEvidenceDossierModal: React.FC<CamhsEvidenceDossierModalProps> = ({
  isOpen,
  onClose,
  dossier,
}) => {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !dossier) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `CLINICAL EVIDENCE DOSSIER FOR CAMHS / COMMUNITY PEDIATRICIAN
Patient: ${dossier.patient_header.full_name} | NHS No: ${dossier.patient_header.nhs_number} | DOB: ${dossier.patient_header.date_of_birth} (${dossier.patient_header.chronological_age})
School: ${dossier.patient_header.school_name} (URN: ${dossier.patient_header.school_urn}) | Year Group: ${dossier.patient_header.year_group}
Lead SENCO: ${dossier.patient_header.lead_senco_name} | Class Teacher: ${dossier.patient_header.class_teacher_name}
Parent / Carer: ${dossier.patient_header.parent_carer_name} | Referring Clinic: ${dossier.patient_header.referring_clinic}

MEDICATION & TITRATION:
- Drug: ${dossier.medication_audit.medication_name} (${dossier.medication_audit.dosage})
- Administration Logged: ${dossier.medication_audit.administration_time_logged}
- Vulnerability Dip Window: ${dossier.medication_audit.mid_morning_dip_window}
- Caloric Co-Ingestion Compliance: ${dossier.medication_audit.caloric_co_ingestion_compliance}
- Fasted vs Fed Incident Ratio: ${dossier.medication_audit.fasted_vs_fed_incident_ratio}

NICE CROSS-SETTING CONCORDANCE (NG87 / CG128):
${dossier.cross_setting_concordance
  .map(
    (c) =>
      `• [${c.domain}] (${c.concordance_level}):\n  Home: ${c.home_presentation}\n  School: ${c.school_presentation}\n  Clinical Significance: ${c.clinical_significance}`
  )
  .join('\n\n')}

MASKING & RESTRAINT COLLAPSE:
- Masking Index: ${dossier.restraint_collapse_analysis.masking_index_score}/100
- Outward School Compliance: ${dossier.restraint_collapse_analysis.school_compliance_rating}
- After-School Collapse Frequency: ${dossier.restraint_collapse_analysis.post_school_collapse_frequency}
- Home Decompression: ${dossier.restraint_collapse_analysis.home_decompression_recommendation}

CLINICAL RECOMMENDATIONS:
${dossier.clinical_recommendations.map((r) => `• [${r.category}] ${r.recommendation} (${r.statutory_anchor})`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const {
    patient_header,
    medication_audit,
    cross_setting_concordance,
    sensory_environment_audit,
    restraint_collapse_analysis,
    clinical_recommendations,
    nice_guideline_compliance,
  } = dossier;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-navy/80 backdrop-blur-sm print:p-0 print:bg-white print:static print:inset-auto animate-in fade-in duration-200"
    >
      {/* Container Card */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none print:m-0 print:max-w-none print:max-h-none print:bg-white print:text-black">
        
        {/* Pinned Action Toolbar (Screen Only) */}
        <div className="flex-shrink-0 z-20 flex items-center justify-between px-5 sm:px-6 py-3.5 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h2 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Multi-Agency Clinical Evidence Dossier</span>
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-semibold">
              NICE NG87 / CG128
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border border-slate-200 dark:border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied Digest' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
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

        {/* Scrollable Printable Multi-Page Clinical Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 print:p-0 print:space-y-6 print:overflow-visible">
          
          {/* Institutional Header & Clinical Title Block */}
          <div className="border-b-2 border-blue-600 pb-6 print:pb-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 bg-blue-700 text-white text-[11px] font-black rounded tracking-widest uppercase">
                    NHS Multi-Agency Evidence
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Paired Home & School Longitudinal Audit
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 dark:text-white print:text-black">
                  Clinical Evidence Dossier & Titration Audit
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-300 print:text-slate-700">
                  Comprehensive multi-setting observational evidence prepared for Child and Adolescent Mental Health Services (CAMHS) & Consultant Pediatricians.
                </p>
              </div>

              <div className="sm:text-right space-y-0.5 text-xs text-slate-600 dark:text-slate-400 print:text-black font-mono">
                <div className="font-bold text-slate-800 dark:text-slate-200 print:text-black">{patient_header.school_name}</div>
                <div>DfE URN: {patient_header.school_urn} · {patient_header.year_group}</div>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">{patient_header.reporting_window}</div>
              </div>
            </div>

            {/* NICE Compliance Declaration Banner */}
            <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center justify-between text-xs text-blue-900 dark:text-blue-200 print:border-slate-300">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{nice_guideline_compliance}</span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-bold">
                Clinical Grade
              </span>
            </div>

            {/* Patient & Key Professional Metadata Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 print:bg-white print:border-slate-300">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Patient Full Name</span>
                <div className="font-black text-sm text-slate-900 dark:text-white print:text-black">{patient_header.full_name}</div>
                <div className="text-[11px] text-slate-500">Known as: {patient_header.preferred_name}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">NHS Number & DOB</span>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200 print:text-black">{patient_header.nhs_number}</div>
                <div className="text-[11px] text-slate-500">{patient_header.date_of_birth} ({patient_header.chronological_age})</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">School Multi-Agency Team</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 print:text-black">{patient_header.lead_senco_name}</div>
                <div className="text-[11px] text-slate-500">{patient_header.class_teacher_name} · {patient_header.primary_ta_name}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Referring Clinical Service</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 print:text-black">{patient_header.referring_clinic}</div>
                <div className="text-[11px] text-slate-500">Parent / Carer: {patient_header.parent_carer_name}</div>
              </div>
            </div>
          </div>

          {/* Section 1: Pharmacological Titration & Bioavailability Timeline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Pill className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white print:text-black">
                1. Medication Profile & Chrono-Biology Timeline
              </h3>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 print:bg-white print:border-slate-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs print:border-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Prescribed Compound & Dose</span>
                  <div className="font-bold text-blue-700 dark:text-blue-400 text-sm mt-0.5">{medication_audit.medication_name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{medication_audit.dosage} · {medication_audit.formulation}</div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs print:border-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Logged Ingestion & Peak Window</span>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5">{medication_audit.administration_time_logged}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Peak therapeutic focus: {medication_audit.peak_bioavailability_window}</div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Mid-Morning Vulnerability Dip</span>
                  <div className="font-bold text-amber-900 dark:text-amber-200 text-sm mt-0.5">{medication_audit.mid_morning_dip_window}</div>
                  <div className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">Plasma trough between 1st & 2nd phase</div>
                </div>
              </div>

              {/* Fasted vs Fed Statistical Risk Box */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 print:border-slate-300">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 print:text-black">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Caloric Food Co-Ingestion Correlation:</span>
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400">
                    Compliance: {medication_audit.caloric_co_ingestion_compliance}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  <strong className="text-amber-700 dark:text-amber-300 font-bold">Empirical Risk Ratio ({medication_audit.fasted_vs_fed_incident_ratio}): </strong>
                  {medication_audit.clinical_observation}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Home vs School Cross-Setting Concordance Table (NICE NG87 / CG128) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white print:text-black">
                  2. Cross-Setting Concordance Audit (Home vs School)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">NICE Criterion: Pervasiveness in ≥2 Settings</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 print:border-slate-300">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] print:bg-slate-100">
                  <tr>
                    <th className="py-3 px-3.5">Diagnostic Domain</th>
                    <th className="py-3 px-3.5">Home Presentation ({dossier.patient_header.parent_carer_name || "Home"})</th>
                    <th className="py-3 px-3.5">School Presentation ({dossier.patient_header.school_name || "School"})</th>
                    <th className="py-3 px-3 text-center">Concordance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-slate-300">
                  {cross_setting_concordance.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white print:text-black align-top">
                        {item.domain}
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 leading-tight">
                          {item.clinical_significance}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 print:text-black align-top leading-relaxed">
                        {item.home_presentation}
                      </td>
                      <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 print:text-black align-top leading-relaxed">
                        {item.school_presentation}
                      </td>
                      <td className="py-3 px-3 text-center align-top whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.concordance_level === 'Pervasive Across Settings'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : item.concordance_level === 'Masked at School'
                              ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {item.concordance_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Sensory Environment & Behavioural Safety Audit */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white print:text-black">
                3. Sensory Environment & De-Escalation Trajectory
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 print:bg-white print:border-slate-300">
                <span className="text-[10px] font-bold uppercase text-slate-400">Identified Environmental Triggers</span>
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 print:text-black">
                  {sensory_environment_audit.primary_sensory_triggers.map((trigger, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0">✕</span>
                      <span>{trigger}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                  <strong>Acoustic Threshold:</strong> {sensory_environment_audit.acoustic_decibel_tolerance}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 print:bg-white print:border-slate-300">
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                  Empirically Effective Accommodations
                </span>
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 print:text-black">
                  {sensory_environment_audit.top_effective_accommodations.map((acc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span>{acc}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span><strong>Avg Latency to Calm:</strong> {sensory_environment_audit.average_latency_to_de_escalate_minutes} mins</span>
                  <span className="text-emerald-700 font-bold">0 Exclusions</span>
                </div>
              </div>
            </div>

            {/* Ineffective Strategy Warning Callout */}
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Clinically Contraindicated Interventions: </strong>
                {sensory_environment_audit.ineffective_or_escalating_actions.join(', ')}
              </div>
            </div>
          </div>

          {/* Section 4: Restraint Collapse & Neurodivergent Masking Analysis */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Heart className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white print:text-black">
                4. Restraint Collapse & Autonomic Depletion Profiling
              </h3>
            </div>

            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-900/60 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200 dark:border-purple-900/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-purple-800 dark:text-purple-300">
                    Masking Index Score
                  </span>
                  <span className="text-lg font-black font-mono text-purple-900 dark:text-purple-200">
                    {restraint_collapse_analysis.masking_index_score} / 100
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                  {restraint_collapse_analysis.school_compliance_rating}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 print:text-black">Autonomic Mechanism: </strong>
                  <span className="text-slate-600 dark:text-slate-300 print:text-slate-700">
                    {restraint_collapse_analysis.autonomic_depletion_mechanism}
                  </span>
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 print:text-black">Clinical Home Recommendation: </strong>
                  <span className="text-slate-600 dark:text-slate-300 print:text-slate-700">
                    {restraint_collapse_analysis.home_decompression_recommendation}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Clinical Recommendations & Multi-Agency Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white print:text-black">
                5. Multi-Agency Clinical Action Recommendations
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              {clinical_recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 print:bg-white print:border-slate-300"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {rec.category}
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium print:text-black">
                      {rec.recommendation}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap self-start sm:self-auto bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {rec.statutory_anchor}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Multi-Agency Formal Declaration & Sign-Off Block */}
          <div className="pt-6 border-t-2 border-slate-200 dark:border-slate-800 space-y-4 print:pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Multi-Agency Declaration & Verification Signatures
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                Compiled: {new Date(dossier.compiled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl h-24 flex flex-col justify-between print:border-slate-400">
                <span className="text-[9px] uppercase font-bold text-slate-400">Consultant Pediatrician / CAMHS</span>
                <div className="border-b border-dashed border-slate-400 my-auto" />
                <span className="text-[10px] text-slate-500">Date: ____________</span>
              </div>

              <div className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl h-24 flex flex-col justify-between print:border-slate-400">
                <span className="text-[9px] uppercase font-bold text-slate-400">Lead SENCO ({patient_header.lead_senco_name})</span>
                <div className="border-b border-dashed border-slate-400 my-auto" />
                <span className="text-[10px] text-slate-500">Date: ____________</span>
              </div>

              <div className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl h-24 flex flex-col justify-between print:border-slate-400">
                <span className="text-[9px] uppercase font-bold text-slate-400">Class Teacher ({patient_header.class_teacher_name})</span>
                <div className="border-b border-dashed border-slate-400 my-auto" />
                <span className="text-[10px] text-slate-500">Date: ____________</span>
              </div>

              <div className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl h-24 flex flex-col justify-between print:border-slate-400">
                <span className="text-[9px] uppercase font-bold text-slate-400">Parent / Carer ({patient_header.parent_carer_name})</span>
                <div className="border-b border-dashed border-slate-400 my-auto" />
                <span className="text-[10px] text-slate-500">Date: ____________</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
