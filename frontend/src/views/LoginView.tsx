import React, { useState } from 'react';
import { api } from '../api';
import { UserProfile } from '../types';
import { Sparkles, GraduationCap, ShieldCheck, HeartHandshake, User, Users, Lock, ArrowRight, KeyRound, Building2 } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  onOpenInvitation?: (token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onOpenInvitation }) => {
  const [tab, setTab] = useState<'portal' | 'pupil'>('portal');
  const [loading, setLoading] = useState(false);
  const [demoLoadingRole, setDemoLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Demo Mode visibility (hidden by default unless ?demo=true or #demo in URL)
  const [showDemoMode, setShowDemoMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('demo') === 'true' || window.location.hash === '#demo';
    }
    return false;
  });

  // Staff / Parent fields
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');

  // Pupil Voice fields
  const [pupilUsername, setPupilUsername] = useState('');
  const [pupilPin, setPupilPin] = useState('');

  // Token input for direct invitation entry
  const [manualToken, setManualToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const handlePortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password.trim()) {
      setError('Please enter your email or username and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(emailOrUsername.trim(), password.trim());
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePupilLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pupilUsername.trim() || pupilPin.length < 4) {
      setError('Please enter your child username and 4-digit PIN.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(pupilUsername.trim(), pupilPin.trim());
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Incorrect PIN or username.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    setError(null);
    setDemoLoadingRole(role);
    try {
      const res = await api.demoLogin(role);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || `Failed to sign in as ${role}.`);
    } finally {
      setDemoLoadingRole(null);
    }
  };

  const handlePinKeyClick = (digit: string) => {
    if (pupilPin.length < 4) {
      setPupilPin((prev) => prev + digit);
    }
  };

  const handlePinBackspace = () => {
    setPupilPin((prev) => prev.slice(0, -1));
  };

  const demoPersonas = [
    {
      role: 'admin',
      name: 'Dr. Alistair Vance',
      subtitle: 'Platform Governance Lead',
      icon: Building2,
      color: 'from-indigo-600 to-slate-800',
      textColor: 'text-indigo-400',
      badge: '🏛️ Admin Hub',
      desc: 'Multi-school onboarding, persona provisioning & GDPR audit logs',
    },
    {
      role: 'teacher',
      name: 'Ms Johnson',
      subtitle: 'Classroom Teacher · Room 4',
      icon: GraduationCap,
      color: 'from-purple-600 to-indigo-600',
      textColor: 'text-purple-600',
      badge: '👩‍🏫 Teacher View',
      desc: 'Morning handovers, adapted lessons & visual task cards',
    },
    {
      role: 'senco',
      name: 'Ms Okafor',
      subtitle: 'SENCO · Inclusion Lead',
      icon: ShieldCheck,
      color: 'from-teal to-teal-dark',
      textColor: 'text-teal',
      badge: '🗂 SENCO View',
      desc: 'SEND register, statutory EHCPs, child registration & parent invites',
    },
    {
      role: 'parent',
      name: 'Dana Carter',
      subtitle: "Phoenix's Mum",
      icon: HeartHandshake,
      color: 'from-amber-600 to-orange-600',
      textColor: 'text-amber-600',
      badge: '👨‍👩‍👧 Parent Hub',
      desc: 'Morning handovers, read-receipts, tonight tips & learning wins',
    },
    {
      role: 'child',
      name: 'Phoenix Carter',
      subtitle: 'Pupil Voice · Year 5',
      icon: User,
      color: 'from-coral to-rose-600',
      textColor: 'text-coral',
      badge: '🧒 Pupil Voice',
      desc: 'Daily emoji check-in, visual worksheets & celebrating wins',
    },
    {
      role: 'ta',
      name: 'Melissa Grant',
      subtitle: 'Teaching Assistant · 1-to-1',
      icon: Users,
      color: 'from-emerald-600 to-teal',
      textColor: 'text-emerald-600',
      badge: '🤝 TA View',
      desc: 'Key transition schedule & quick classroom notes (<30s)',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-teal selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="p-4 sm:p-6 max-w-7xl w-full mx-auto flex items-center justify-between z-10 gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-coral via-amber to-mint flex items-center justify-center p-0.5 shadow-lg shadow-teal/20 flex-shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-mint" />
            </div>
          </div>
          <div>
            <div className="font-serif font-bold text-base sm:text-lg tracking-wide text-white">See My Mind</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">SEND Inclusive Education Platform</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            onClick={() => setShowDemoMode((prev) => !prev)}
            className={`text-xs px-2.5 sm:px-3.5 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 flex-shrink-0 shadow-xs active:scale-95 cursor-pointer ${
              showDemoMode
                ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{showDemoMode ? '✕ Hide Demo' : '✨ Demo Mode'}</span>
          </button>



          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="text-xs px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5 text-teal" />
            <span className="hidden md:inline">Have an invite token?</span>
            <span className="md:hidden">Token</span>
          </button>
        </div>
      </header>

      {/* Manual Invitation Acceptance Drawer */}
      {showTokenInput && (
        <div className="max-w-md w-full mx-auto px-4 z-20 animate-fade-in mb-4">
          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Enter 72-Hour Parent Invitation Token
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste token from invitation email..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal font-mono"
              />
              <button
                onClick={() => {
                  if (manualToken.trim() && onOpenInvitation) {
                    onOpenInvitation(manualToken.trim());
                  }
                }}
                className="px-4 py-2 rounded-xl bg-teal text-white text-xs font-bold hover:bg-teal-dark transition-colors"
              >
                Open →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      {!showDemoMode ? (
        <main className="max-w-xl w-full mx-auto px-4 py-8 z-10 flex flex-col items-center justify-center flex-1">
          {/* Centered Login Card */}
          <div className="w-full bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal">Role-Based Access Control</span>
              <h1 className="text-2xl font-bold font-serif text-white mt-1">Sign in to your account</h1>
              <p className="text-xs text-slate-400 mt-1">
                Select your login method below to access your role-specific dashboard.
              </p>
            </div>

            {/* Tab Selector */}
            <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-700/80 text-xs font-semibold">
              <button
                onClick={() => {
                  setTab('portal');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  tab === 'portal'
                    ? 'bg-slate-800 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Staff & Parents 🏢
              </button>
              <button
                onClick={() => {
                  setTab('pupil');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  tab === 'pupil'
                    ? 'bg-slate-800 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pupil Voice 🧒
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2 animate-fade-in">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: Staff & Parent Login */}
            {tab === 'portal' && (
              <form onSubmit={handlePortalLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address or Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. senco@stjudes.sch.uk"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal text-white text-xs font-bold transition-all shadow-md shadow-teal/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Sign In to Portal →</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: Pupil Voice PIN Login */}
            {tab === 'pupil' && (
              <form onSubmit={handlePupilLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pupil Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. child username"
                    value={pupilUsername}
                    onChange={(e) => setPupilUsername(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-coral text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                    Enter 4-Digit Secret PIN
                  </label>
                  {/* Visual PIN Dots */}
                  <div className="flex justify-center gap-3 mb-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-lg ${
                          pupilPin.length > idx
                            ? 'border-coral bg-coral/20 text-coral shadow-xs'
                            : 'border-slate-700 bg-slate-900 text-slate-600'
                        }`}
                      >
                        {pupilPin.length > idx ? '●' : ''}
                      </div>
                    ))}
                  </div>

                  {/* Keypad */}
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        type="button"
                        key={digit}
                        onClick={() => handlePinKeyClick(digit)}
                        className="py-2.5 rounded-xl bg-slate-750 hover:bg-slate-700 text-white font-bold text-base transition-all active:scale-95 border border-slate-700/60"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPupilPin('')}
                      className="py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePinKeyClick('0')}
                      className="py-2.5 rounded-xl bg-slate-750 hover:bg-slate-700 text-white font-bold text-sm transition-all active:scale-95"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handlePinBackspace}
                      className="py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs"
                    >
                      ⌫
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || pupilPin.length < 4}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-coral to-rose-600 hover:from-rose-600 hover:to-coral text-white text-xs font-bold transition-all shadow-md shadow-coral/20 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <span>⭐</span>
                  <span>Enter Pupil Voice Check-In</span>
                </button>
              </form>
            )}

            {/* Subtle Evaluator Prompt */}
            <div className="pt-4 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setShowDemoMode(true)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 hover:border-teal/40 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-between transition-all group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Evaluating See My Mind without credentials?</span>
                </span>
                <span className="font-bold text-mint flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>View Demo Personas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          </div>

          {/* Trust & Compliance Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-teal" /> DfE SEND Code of Practice (2015) Aligned</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-teal" /> Multi-Tenant Role Isolation</span>
            <span className="flex items-center gap-1.5"><HeartHandshake className="w-3.5 h-3.5 text-coral" /> UK GDPR Compliant</span>
          </div>
        </main>
      ) : (
        <main className="max-w-6xl w-full mx-auto px-4 py-6 z-10 flex flex-col lg:flex-row gap-8 items-start flex-1 animate-fade-in">
          {/* Left: Login Card */}
          <div className="w-full lg:w-5/12 bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-3xl p-4 sm:p-7 shadow-2xl space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal">Role-Based Access Control</span>
              <h1 className="text-2xl font-bold font-serif text-white mt-1">Sign in to your account</h1>
              <p className="text-xs text-slate-400 mt-1">
                Select your login method below to access your role-specific dashboard.
              </p>
            </div>

            {/* Tab Selector */}
            <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-700/80 text-xs font-semibold">
              <button
                onClick={() => {
                  setTab('portal');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  tab === 'portal'
                    ? 'bg-slate-800 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Staff & Parents 🏢
              </button>
              <button
                onClick={() => {
                  setTab('pupil');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  tab === 'pupil'
                    ? 'bg-slate-800 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pupil Voice 🧒
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2 animate-fade-in">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: Staff & Parent Login */}
            {tab === 'portal' && (
              <form onSubmit={handlePortalLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address or Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. senco@stjudes.sch.uk"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal to-teal-dark hover:from-teal-dark hover:to-teal text-white text-xs font-bold transition-all shadow-md shadow-teal/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Sign In to Portal →</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: Pupil Voice PIN Login */}
            {tab === 'pupil' && (
              <form onSubmit={handlePupilLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pupil Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. child username"
                    value={pupilUsername}
                    onChange={(e) => setPupilUsername(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-coral text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                    Enter 4-Digit Secret PIN
                  </label>
                  <div className="flex justify-center gap-3 mb-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-lg ${
                          pupilPin.length > idx
                            ? 'border-coral bg-coral/20 text-coral shadow-xs'
                            : 'border-slate-700 bg-slate-900 text-slate-600'
                        }`}
                      >
                        {pupilPin.length > idx ? '●' : ''}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        type="button"
                        key={digit}
                        onClick={() => handlePinKeyClick(digit)}
                        className="py-2.5 rounded-xl bg-slate-750 hover:bg-slate-700 text-white font-bold text-sm transition-all active:scale-95 cursor-pointer"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPupilPin('')}
                      className="py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePinKeyClick('0')}
                      className="py-2.5 rounded-xl bg-slate-750 hover:bg-slate-700 text-white font-bold text-sm transition-all active:scale-95"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handlePinBackspace}
                      className="py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs"
                    >
                      ⌫
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || pupilPin.length < 4}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-coral to-rose-600 hover:from-rose-600 hover:to-coral text-white text-xs font-bold transition-all shadow-md shadow-coral/20 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <span>⭐</span>
                  <span>Enter Pupil Voice Check-In</span>
                </button>
              </form>
            )}
          </div>

          {/* Right: Quick Demo Persona Picker */}
          <div className="w-full lg:w-7/12 space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-mint flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber" />
                  Stakeholder & Investor Demo Mode
                </span>
                <h2 className="text-lg font-bold font-serif text-white mt-0.5">
                  1-Click Persona Quick Login
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoMode(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-600 active:scale-95"
              >
                <span>✕</span>
                <span>Hide Demo Mode</span>
              </button>
            </div>



            <p className="text-xs text-slate-400 leading-relaxed">
              Select any persona below to authenticate with a live JWT token and experience their dedicated, role-locked dashboard:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {demoPersonas.map((p) => {
                const Icon = p.icon;
                const isCurrentLoading = demoLoadingRole === p.role;
                return (
                  <button
                    key={p.role}
                    disabled={demoLoadingRole !== null}
                    onClick={() => handleDemoLogin(p.role)}
                    className="p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-slate-600 text-left transition-all hover:scale-[1.01] hover:shadow-lg flex flex-col justify-between group cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${p.color} text-white flex items-center justify-center shadow-xs`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-teal transition-colors">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-slate-400">{p.subtitle}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700">
                        {p.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mb-2">
                      {p.desc}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 pt-1 border-t border-slate-700/50">
                      <span className="text-teal group-hover:underline">Launch Persona</span>
                      {isCurrentLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-teal border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal group-hover:translate-x-0.5 transition-all" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500 z-10 border-t border-slate-800/60">
        See My Mind &bull; UK SEND Code of Practice Compliant &bull; Secure Role-Based Access Control
      </footer>
    </div>
  );
};
