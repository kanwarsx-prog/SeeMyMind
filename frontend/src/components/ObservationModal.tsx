import React, { useState } from 'react';
import { X, CheckCircle, Sparkles } from 'lucide-react';
import { Child } from '../types';

interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  childName: string;
  pupils: Child[];
  selectedChildId: string;
  onSelectChild: (childId: string) => void;
}

export const ObservationModal: React.FC<ObservationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  childName,
  pupils,
  selectedChildId,
  onSelectChild,
}) => {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('Maths Lesson');
  const [engagement, setEngagement] = useState('High');
  const [strategy, setStrategy] = useState('Visual Task Strip');
  const [strategyWorked, setStrategyWorked] = useState(true);
  const [summary, setSummary] = useState('');
  const [strengths, setStrengths] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        title: title || `${context} Observation`,
        summary: summary || `Observation recorded in ${context}. Engagement: ${engagement}.`,
        event_type: 'Observation',
        reporter_type: 'Teacher',
        reporter_name: 'Ms Johnson',
        significance: strategyWorked ? 'Notable Win' : 'Routine',
        visibility: 'Shared',
        observation: {
          activity_context: context,
          engagement_level: engagement,
          strategy_used: strategy,
          strategy_worked: strategyWorked,
          strengths_observed: strengths,
          notes: summary,
        },
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to log observation. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-navy">Log Classroom Observation</h3>
            <p className="text-[11px] sm:text-xs text-gray-500">Adding to {childName}'s shared timeline</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-navy hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-navy mb-1">Pupil</label>
            <select
              value={selectedChildId}
              onChange={(e) => onSelectChild(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal bg-white"
              required
            >
              <option value="">Select a pupil</option>
              {pupils.map((pupil) => (
                <option key={pupil.id} value={pupil.id}>
                  {pupil.full_name || `${pupil.first_name} ${pupil.last_name}`}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500 mt-1">This observation will be added to the selected pupil&apos;s timeline.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1">Title / Headline</label>
            <input
              type="text"
              placeholder="e.g. Excellent Maths Engagement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Lesson Context</label>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal bg-white"
              >
                <option>Maths Lesson</option>
                <option>Science Practical</option>
                <option>English / Reading</option>
                <option>Playground / Breaktime</option>
                <option>Assembly Transition</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Engagement Level</label>
              <select
                value={engagement}
                onChange={(e) => setEngagement(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal bg-white"
              >
                <option>High</option>
                <option>Engaged with Support</option>
                <option>Passive</option>
                <option>Overwhelmed / Disengaged</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 bg-mint/10 border border-mint/30 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Calming & Support Tracker</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Strategy used (e.g. Visual Card)"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStrategyWorked(true)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                    strategyWorked
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  ✓ Worked
                </button>
                <button
                  type="button"
                  onClick={() => setStrategyWorked(false)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                    !strategyWorked
                      ? 'bg-coral-dark text-white border-coral-dark shadow-xs'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  ✕ Did not work
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1">Observation Summary & Notes</label>
            <textarea
              rows={3}
              placeholder="Describe what went well or what triggered hesitation..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1">Strengths Observed (For Parent & Annual Review)</label>
            <input
              type="text"
              placeholder="e.g. Spatial reasoning, helping a peer, focused problem solving"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal"
            />
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-gray-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-teal hover:bg-teal-medium shadow-sm transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <span>Posting to Live Database...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Log to Live Timeline</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
