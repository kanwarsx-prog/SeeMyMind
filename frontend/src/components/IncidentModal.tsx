import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { IncidentSubmission } from '../types';
import { AbcTooltip } from './AbcTooltip';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: IncidentSubmission) => Promise<void>;
  childName: string;
  childId: string;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  childName,
  childId,
}) => {
  const [location, setLocation] = useState('Classroom');
  const [severity, setSeverity] = useState('Moderate');
  const [antecedent, setAntecedent] = useState('');
  const [behaviour, setBehaviour] = useState('');
  const [consequence, setConsequence] = useState('');
  const [strategy, setStrategy] = useState('');
  const [recoveryTime, setRecoveryTime] = useState<number>(10);
  const [parentNotified, setParentNotified] = useState(false);
  const [followUp, setFollowUp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!antecedent || !behaviour || !consequence) {
      alert('Please fill out all ABC fields (Antecedent, Behaviour, Consequence).');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        child_id: childId,
        reporter_name: 'Class Teacher',
        reporter_type: 'Teacher',
        location,
        severity,
        antecedent,
        behaviour,
        consequence,
        de_escalation_strategy_used: strategy,
        recovery_time_minutes: recoveryTime,
        parent_notified: parentNotified,
        follow_up_action: followUp || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to log incident.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-coral/10 rounded-xl text-coral-dark flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-navy text-sm sm:text-base">Record ABC Incident</h3>
                <AbcTooltip variant="badge" />
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500">Structured Antecedent-Behaviour-Consequence log for {childName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-navy hover:bg-gray-100 cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Location & Severity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy mb-1">Incident Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal"
              >
                <option value="Classroom">Classroom</option>
                <option value="Playground">Playground</option>
                <option value="Corridor / Hall">Corridor / Hall</option>
                <option value="Dining Hall">Dining Hall</option>
                <option value="Assembly">Assembly</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-navy mb-1">Severity Rating</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal font-semibold text-coral-dark"
              >
                <option value="Low">Low (Mild disengagement)</option>
                <option value="Moderate">Moderate (Distress/Disruption)</option>
                <option value="High">High (Severely overwhelmed / unsafe)</option>
                <option value="Safeguarding Incident">Safeguarding Incident (DSL Alert)</option>
              </select>
            </div>
          </div>

          {severity === 'Safeguarding Incident' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>This record will automatically alert the Designated Safeguarding Lead (DSL).</span>
            </div>
          )}

          {/* Antecedent */}
          <div>
            <label className="block font-bold text-navy mb-1">
              A · What Happened Before (Trigger) <span className="font-normal text-gray-400">(What triggered this immediately before?)</span>
            </label>
            <textarea
              rows={2}
              value={antecedent}
              onChange={(e) => setAntecedent(e.target.value)}
              placeholder="e.g. Unexpected loud siren; transition announced without 5-minute visual timer warning..."
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal"
              required
            />
          </div>

          {/* Behaviour */}
          <div>
            <label className="block font-bold text-navy mb-1">
              B · What Happened (Reaction) <span className="font-normal text-gray-400">(Factual, non-judgmental description)</span>
            </label>
            <textarea
              rows={2}
              value={behaviour}
              onChange={(e) => setBehaviour(e.target.value)}
              placeholder="e.g. Covered ears, cried, threw reading book, crawled beneath desk..."
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal"
              required
            />
          </div>

          {/* Consequence */}
          <div>
            <label className="block font-bold text-navy mb-1">
              C · Support Given & Outcome <span className="font-normal text-gray-400">(How was the pupil supported to calm down?)</span>
            </label>
            <textarea
              rows={2}
              value={consequence}
              onChange={(e) => setConsequence(e.target.value)}
              placeholder="e.g. Offered noise defenders, walked to quiet reading alcove with TA..."
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-teal"
              required
            />
          </div>

          {/* Strategy & Recovery Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy mb-1">Calming Strategy Used</label>
              <input
                type="text"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                placeholder="e.g. Noise defenders, 5-4-3-2-1 grounding"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block font-bold text-navy mb-1">Recovery Time (Minutes)</label>
              <input
                type="number"
                min={1}
                max={180}
                value={recoveryTime}
                onChange={(e) => setRecoveryTime(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal"
              />
            </div>
          </div>

          {/* Parent notification checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="parentNotified"
              checked={parentNotified}
              onChange={(e) => setParentNotified(e.target.checked)}
              className="rounded text-teal focus:ring-teal cursor-pointer"
            />
            <label htmlFor="parentNotified" className="text-gray-700 cursor-pointer">
              Parent has been verbally notified / handover note requested
            </label>
          </div>

          {/* Follow up action */}
          <div>
            <label className="block font-bold text-navy mb-1">Follow-up Action for SENCO / DSL (Optional)</label>
            <input
              type="text"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="e.g. Review Section F environmental sensory trigger provision"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal"
            />
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-coral hover:bg-coral-dark text-white font-bold cursor-pointer transition-all shadow-xs"
            >
              {submitting ? 'Recording...' : 'Record Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
