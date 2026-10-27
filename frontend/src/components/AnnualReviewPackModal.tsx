import React, { useState } from 'react';
import { AnnualReviewPackResponse } from '../types';
import {
  X,
  Printer,
  ShieldCheck,
  FileText,
  HeartHandshake,
  User,
} from 'lucide-react';

interface AnnualReviewPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: AnnualReviewPackResponse | null;
}

export const AnnualReviewPackModal: React.FC<AnnualReviewPackModalProps> = ({
  isOpen,
  onClose,
  pack,
}) => {
  const [recommendations, setRecommendations] = useState<string>(
    pack?.senco_recommendations || ''
  );
  const [isEditingRecs, setIsEditingRecs] = useState(false);

  if (!isOpen || !pack) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-navy/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
        {/* Top Action Toolbar */}
        <div className="bg-navy px-4 sm:px-6 py-3.5 flex items-center justify-between text-white flex-shrink-0 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-light/20 rounded-xl text-mint">
              <FileText className="w-5 h-5 text-mint" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-sm sm:text-base font-bold text-white">
                  Statutory EHCP Annual Review Evidence Pack
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  Panel Ready ✓
                </span>
              </div>
              <p className="text-[11px] text-white/70">
                Children & Families Act 2014 &bull; Sections A, B, E & F Longitudinal Synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 sm:px-4 py-2 bg-teal hover:bg-teal-medium text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4 text-mint" />
              <span className="hidden sm:inline">Print / Save as Statutory PDF</span>
              <span className="sm:hidden">Print</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-50/50 print:bg-white print:p-0">
          {/* Document Letterhead */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-navy to-slate-800 text-mint flex items-center justify-center text-xl font-bold font-serif shadow-xs">
                  {pack.school_name ? pack.school_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'SC'}
                </div>
                <div>
                  <h1 className="text-lg font-serif font-bold text-navy">
                    {pack.school_name || "Inclusive Academy"}
                  </h1>
                  <p className="text-xs text-gray-500">
                    Special Educational Needs &amp; Disabilities Coordination Department &bull; NASENCo Certified
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs space-y-0.5">
                <div className="font-bold text-navy">Review Date: {pack.review_date}</div>
                <div className="text-gray-500">Lead SENCO: {pack.senco_name}</div>
                <div className="text-[11px] text-teal font-semibold">Local Authority Panel Submission</div>
              </div>
            </div>

            {/* Pupil Information Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Pupil Name</span>
                <span className="font-bold text-navy text-sm">{pack.child_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Date of Birth / Year</span>
                <span className="font-bold text-navy">{pack.date_of_birth} ({pack.year_group})</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Primary Need</span>
                <span className="font-bold text-purple-dark">{pack.primary_need}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Statutory Status</span>
                <span className="font-bold text-emerald-700">{pack.statutory_status}</span>
              </div>
            </div>

            {/* Longitudinal Evidence Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 bg-mint-pale/50 border border-mint rounded-xl text-center">
                <div className="text-lg font-bold text-teal">{pack.metrics.total_evidence_observations}</div>
                <div className="text-[10px] text-gray-600 font-medium">Timeline Observations</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <div className="text-lg font-bold text-emerald-700">{pack.metrics.de_escalation_win_rate.split(' ')[0]}</div>
                <div className="text-[10px] text-gray-600 font-medium">De-Escalation Success</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <div className="text-lg font-bold text-amber-dark">{pack.metrics.morning_handovers_received}</div>
                <div className="text-[10px] text-gray-600 font-medium">Home Handovers Received</div>
              </div>
              <div className="p-3 bg-purple-light/40 border border-purple-200 rounded-xl text-center">
                <div className="text-lg font-bold text-purple-dark">{pack.metrics.safeguarding_incidents}</div>
                <div className="text-[10px] text-gray-600 font-medium">Safeguarding Incidents</div>
              </div>
            </div>
          </div>

          {/* Section A: Views, Wishes, and Feelings */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <span className="w-6 h-6 rounded-lg bg-teal/10 text-teal flex items-center justify-center font-bold text-xs">
                A
              </span>
              <h3 className="font-serif font-bold text-sm text-navy">
                Section A: Views, Interests, and Aspirations of the Child & Parents
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-teal-50/40 border border-teal/20 space-y-2">
                <div className="font-bold text-navy flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal" />
                  <span>Pupil Voice ({pack.child_name})</span>
                </div>
                <p className="text-gray-700 leading-relaxed italic">
                  &ldquo;{pack.section_a.child_views}&rdquo;
                </p>
                <div className="text-[11px] text-teal pt-1">
                  <strong>Future Aspiration: </strong>
                  <span>{pack.section_a.child_aspirations}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2">
                <div className="font-bold text-navy flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-amber-dark" />
                  <span>Parent / Carer Contribution</span>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {pack.section_a.parent_views}
                </p>
                <div className="text-[11px] text-amber-900 pt-1">
                  <strong>Parent Aspiration: </strong>
                  <span>{pack.section_a.parent_aspirations}</span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-[11px] text-gray-500">
              <strong>Co-Production Validation: </strong>{pack.section_a.co_production_notes}
            </div>
          </div>

          {/* Section B: Special Educational Needs (4 Areas of Need) */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <span className="w-6 h-6 rounded-lg bg-purple-light text-purple-dark flex items-center justify-center font-bold text-xs">
                B
              </span>
              <h3 className="font-serif font-bold text-sm text-navy">
                Section B: Special Educational Needs (Longitudinal Evidence Base)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {pack.section_b.map((need, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-navy text-xs">{need.area_of_need}</span>
                      <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full font-bold text-teal">
                        {need.evidence_count} Live Evidence Logs
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      {need.statutory_summary}
                    </p>
                    <p className="text-gray-600 bg-white p-2 rounded-lg border border-gray-100 text-[11px]">
                      <strong className="text-navy">Observed Classroom Impact: </strong>
                      {need.observed_impact}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 text-[10px] text-gray-500 space-y-0.5">
                    <span className="font-bold block text-gray-400 uppercase tracking-wider">Verified Citations:</span>
                    {need.citations.map((c, cIdx) => (
                      <div key={cIdx} className="truncate text-teal">&bull; {c}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section E: Outcomes & Measurable Targets */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                E
              </span>
              <h3 className="font-serif font-bold text-sm text-navy">
                Section E: Outcomes Sought & Target Progress
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              {pack.section_e.map((outcome) => (
                <div
                  key={outcome.target_id}
                  className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal text-xs">[{outcome.target_id}]</span>
                      <span className="font-bold text-navy">{outcome.title}</span>
                      <span className="text-[10px] text-gray-400">({outcome.category})</span>
                    </div>
                    <p className="text-gray-600 leading-snug">{outcome.evidence_summary}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        outcome.status === 'Met'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-teal/10 text-teal'
                      }`}
                    >
                      {outcome.status === 'Met' ? '✓ Target Met' : '→ On Track'}
                    </span>
                    <span className="text-[10px] text-gray-400">Reviewed {outcome.last_reviewed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section F: Special Educational Provision */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                F
              </span>
              <h3 className="font-serif font-bold text-sm text-navy">
                Section F: Quantified Special Educational Provision Delivered
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {pack.section_f.map((prov) => (
                <div key={prov.provision_id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="font-bold text-navy flex items-center gap-2">
                      <span className="text-teal font-mono">[{prov.provision_id}]</span>
                      <span>{prov.title}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full self-start sm:self-auto">
                      ✓ {prov.evidence_delivery_rate}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-gray-100 text-[11px] font-semibold text-purple-dark">
                    <strong>Quantified Provision: </strong>{prov.quantified_support}
                  </div>

                  <div className="text-[11px] text-gray-600">
                    <strong>Key Strategies Implemented: </strong>
                    {prov.strategies_used.join(' &bull; ')}
                  </div>

                  <div className="text-[11px] text-gray-500 italic pt-1 border-t border-gray-200/60">
                    <strong>Impact & Attendance: </strong>{prov.impact_notes}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SENCO Statutory Recommendation & Sign-Off */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border-l-4 border-l-purple-dark border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-dark" />
                <h3 className="font-serif font-bold text-sm text-navy">
                  SENCO Statutory Recommendation & Panel Submission
                </h3>
              </div>
              <button
                onClick={() => setIsEditingRecs(!isEditingRecs)}
                className="text-[11px] text-purple-dark font-bold hover:underline cursor-pointer"
              >
                {isEditingRecs ? 'Save Notes' : 'Edit Recommendation'}
              </button>
            </div>

            {isEditingRecs ? (
              <textarea
                rows={3}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-dark"
              />
            ) : (
              <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                {recommendations || pack.senco_recommendations}
              </p>
            )}

            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-500">
              <div>
                <span className="font-bold text-navy block">{pack.senco_name || "Not recorded"}</span>
                <span>Special Educational Needs Coordinator &bull; {pack.school_name || "Inclusive Academy"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-purple-light text-purple-dark font-bold">
                  Draft evidence view · human review required
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-shrink-0">
          <div className="text-[11px] text-gray-500 text-center sm:text-left">
            <span>Complies with Section 44 of the Children and Families Act 2014 & SEND Code of Practice.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
            >
              Close Preview
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2 bg-teal hover:bg-teal-medium text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-mint" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
