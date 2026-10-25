import React, { useState } from 'react';
import { X, Moon, CheckCircle2, Send, Clock, Sparkles } from 'lucide-react';
import { EveningCheckInCreate } from '../types';

interface EveningCheckInModalProps {
  childId: string;
  childName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EveningCheckInCreate) => Promise<void>;
}

export const EveningCheckInModal: React.FC<EveningCheckInModalProps> = ({
  childId,
  childName = 'Phoenix',
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [decompression, setDecompression] = useState('Mild Sensory Wobble (10-15m)');
  const [eveningMood, setEveningMood] = useState('Tired but Regulated');
  const [dinnerEaten, setDinnerEaten] = useState(true);
  const [downtimeMins, setDowntimeMins] = useState(35);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        child_id: childId,
        parent_name: 'Dana Carter',
        after_school_decompression: decompression,
        evening_mood: eveningMood,
        dinner_eaten: dinnerEaten,
        screen_free_downtime_minutes: Number(downtimeMins),
        notes_for_tomorrow: notes.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to save evening check-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-cardBg w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-borderMain flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-navy via-navy-light to-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Moon className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-white">
                Evening Recovery Check-In
              </h3>
              <p className="text-[11px] text-white/70">
                20-second home check-in · Closes the loop with Ms Johnson for tomorrow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-navy dark:text-white">Evening Check-In Synced!</h4>
            <p className="text-xs text-textDim dark:text-slate-400 max-w-sm mx-auto">
              Your evening recovery notes have been saved to {childName}'s timeline and will appear on Ms Johnson's registration desk tomorrow morning.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            {/* Arrival status */}
            <div>
              <label className="block text-xs font-bold text-navy dark:text-white mb-1.5">
                How did {childName} settle when arriving home from school?
              </label>
              <select
                value={decompression}
                onChange={(e) => setDecompression(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-none focus:border-amber-dark font-medium"
              >
                <option>Smooth & Calm (Immediate engagement)</option>
                <option>Mild Sensory Wobble (10-15m quiet time)</option>
                <option>Heavy Meltdown (30m+ restraint collapse)</option>
                <option>Shutdown / Non-verbal Cocoon</option>
              </select>
            </div>

            {/* Evening mood */}
            <div>
              <label className="block text-xs font-bold text-navy dark:text-white mb-1.5">
                Evening mood & regulation
              </label>
              <select
                value={eveningMood}
                onChange={(e) => setEveningMood(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-none focus:border-amber-dark font-medium"
              >
                <option>Tired but Regulated</option>
                <option>Calm & Content</option>
                <option>Sensitive / Emotional</option>
                <option>Restless / High Energy</option>
                <option>Deeply Fatigued</option>
              </select>
            </div>

            {/* Dinner & Downtime Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-borderMain bg-cardSubtle cursor-pointer">
                <input
                  type="checkbox"
                  checked={dinnerEaten}
                  onChange={(e) => setDinnerEaten(e.target.checked)}
                  className="rounded text-amber-dark focus:ring-amber-dark w-4 h-4"
                />
                <span className="text-xs font-bold text-navy dark:text-white">Dinner / Snack Eaten</span>
              </label>

              <div className="p-2.5 rounded-xl border border-borderMain bg-cardSubtle">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-navy dark:text-white">Screen-Free Downtime:</span>
                  <span className="text-teal dark:text-teal-300 font-bold">{downtimeMins} mins</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={downtimeMins}
                  onChange={(e) => setDowntimeMins(Number(e.target.value))}
                  className="w-full accent-teal cursor-pointer"
                />
              </div>
            </div>

            {/* Notes for tomorrow's teacher */}
            <div>
              <label className="block text-xs font-bold text-navy dark:text-white mb-1.5">
                Notes for Ms Johnson tomorrow morning (optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Calmed down quickly after building with Lego. Went to bed happy..."
                className="w-full text-xs px-3 py-2 rounded-xl border border-borderMain bg-cardBg text-textMain focus:outline-none focus:border-amber-dark"
              />
            </div>

            {/* Pro-tip */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/50 dark:border-amber-800/40 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>Why this matters:</strong> Closing today&apos;s loop lets Miss Johnson know how the evening went so tomorrow morning starts with the right support.
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-borderMain">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-textDim hover:text-textMain transition-colors font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-teal hover:bg-teal-dark text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{loading ? 'Saving...' : 'Sync Evening Check-In'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
