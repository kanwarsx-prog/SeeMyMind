import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Phone,
  Mail,
  CheckCircle2,
  Lock,
  BrainCircuit,
  Clock,
  ArrowRight,
  ShieldCheck,
  Activity,
  Heart,
  Moon,
  Coffee,
  Pill,
  ClipboardCheck,
  Check,
  Loader2,
  Zap,
  Star,
} from 'lucide-react';
import {
  Child,
  UserProfile,
  NoyaChatMessage,
  NoyaActionCard,
  NoyaCopilotChatResponse,
  NoyaExecutionStep,
} from '../types';
import { api } from '../api';

interface NoyaCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  child?: Child | null;
  activeView?: string;
  screenContext?: string;
  currentUser?: UserProfile | null;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actionCard?: NoyaActionCard | null;
  suggestedFollowups?: string[];
  toolCalled?: string | null;
  latencyMs?: number;
  modelUsed?: string;
  executionSteps?: NoyaExecutionStep[];
  timestamp: string;
}

export const NoyaCopilotDrawer: React.FC<NoyaCopilotDrawerProps> = ({
  isOpen,
  onClose,
  child,
  activeView = 'classroom',
  screenContext,
  currentUser,
  initialQuery,
  onClearInitialQuery,
}) => {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [actionCardStates, setActionCardStates] = useState<Record<string, 'pending' | 'confirming' | 'confirmed' | 'dismissed'>>({});
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleSteps = (msgId: string) => {
    setExpandedSteps((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleConfirmAction = async (card: NoyaActionCard, cardId: string) => {
    if (!card.payload) return;
    setActionCardStates((prev) => ({ ...prev, [cardId]: 'confirming' }));
    try {
      await api.logTimelineEvent(card.payload);
      setActionCardStates((prev) => ({ ...prev, [cardId]: 'confirmed' }));
    } catch (err: any) {
      console.error('Failed to confirm action:', err);
      setActionCardStates((prev) => ({ ...prev, [cardId]: 'pending' }));
      alert(`Could not log action: ${err?.message || 'Error occurred'}`);
    }
  };

  const handleDismissAction = (cardId: string) => {
    setActionCardStates((prev) => ({ ...prev, [cardId]: 'dismissed' }));
  };

  const isParent = currentUser?.role === 'parent' || screenContext === 'parent_hub';
  const isSenco = screenContext === 'senco_overview';
  const pupilName = child?.preferred_name || child?.first_name || 'Pupil';
  const parentFirstName = currentUser?.full_name ? currentUser.full_name.split(' ')[0] : 'Dana';

  // Initialize or reset conversation based on persona
  const resetConversation = () => {
    let greetingContent = '';
    let followups: string[] = [];

    if (isParent) {
      greetingContent = `Hello ${parentFirstName}! I'm **NOYA**, your family inclusion partner. I keep you directly connected with your children's classroom team, home-time energy updates, and practical calming routines.\n\nHow can I help you today?`;
      followups = [
        `How was ${pupilName}'s day today?`,
        "Tonight's calming steps",
        "Has morning check-in been seen?",
      ];
    } else if (isSenco) {
      greetingContent = `Hello! I'm **NOYA**, your school inclusion and statutory governance partner. I track whole-school provision mapping, High-Needs Band allocations, annual review cycles, and Local Authority compliance.\n\nWhat inclusion leadership insights can I provide today?`;
      followups = [
        'Provision breakdown',
        'Statutory annual reviews due',
        'High-needs TA hours summary',
      ];
    } else {
      greetingContent = `Hello! I'm **NOYA**, your classroom inclusion assistant for St. Jude's. I have real-time visibility across your class cohort, pupil support profiles, and morning handovers.\n\nHow can I support your classroom delivery today?`;
      followups = [
        'Room 4 accommodations',
        'Proven calming strategies',
        'Class strategy win rate',
      ];
    }

    const greeting: DisplayMessage = {
      id: 'greeting-' + Date.now(),
      role: 'assistant',
      content: greetingContent,
      suggestedFollowups: followups,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([greeting]);
  };

  // Only initialize greeting once if empty; never wipe conversation on pupil or screen switch
  useEffect(() => {
    if (messages.length === 0) {
      resetConversation();
    }
  }, []);

  // Handle incoming initialQuery (e.g. from SencoView search box)
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery.trim());
      if (onClearInitialQuery) onClearInitialQuery();
    }
  }, [isOpen, initialQuery]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || loading) return;

    const userMsg: DisplayMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: userText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    setLoading(true);

    // Status hint based on question intent
    const lower = userText.toLowerCase();
    if (lower.includes('how was') || lower.includes('day today') || lower.includes('school today') || lower.includes('how did') || lower.includes('day go')) {
      setStatusMessage('Reviewing afternoon battery, classroom wins & decompression steps...');
    } else if (lower.includes('contact') || lower.includes('phone') || lower.includes('parent') || lower.includes('mum') || lower.includes('dad')) {
      setStatusMessage('Validating guardian records & RBAC permissions...');
    } else if (lower.includes('handover') || lower.includes('sleep') || lower.includes('mood') || lower.includes('morning')) {
      setStatusMessage('Retrieving verified morning transition capsule...');
    } else if (lower.includes('de-escalat') || lower.includes('calm') || lower.includes('strateg')) {
      setStatusMessage('Querying proven classroom strategies & win rates...');
    } else if (lower.includes('ehcp') || lower.includes('section f') || lower.includes('hour')) {
      setStatusMessage('Auditing statutory Section F provision targets...');
    } else {
      setStatusMessage('Synthesizing verified longitudinal context...');
    }

    try {
      // Build conversation history for the backend
      const historyPayload: NoyaChatMessage[] = newMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response: NoyaCopilotChatResponse = await api.copilotChat({
        child_id: child?.id,
        active_view: activeView,
        message: userText.trim(),
        history: historyPayload,
      });

      const assistantMsg: DisplayMessage = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: response.answer_markdown,
        actionCard: response.action_card,
        suggestedFollowups: response.suggested_followups,
        toolCalled: response.tool_called,
        latencyMs: response.latency_ms,
        modelUsed: response.model_used,
        executionSteps: response.execution_steps,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('NOYA Error:', err);
      const errorMsg: DisplayMessage = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: `⚠️ **Unable to complete request**: ${err?.message || 'Could not connect to NOYA.'}\n\nPlease try again or verify your connection.`,
        suggestedFollowups: ['Try again', 'What was the latest morning handover?'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  const handleChipClick = (promptText: string) => {
    handleSendMessage(promptText);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        aria-hidden="true"
      />

      {/* Slide-out sidecar drawer */}
      <aside
        className="fixed inset-y-0 right-0 w-full sm:w-[460px] z-50 bg-cardBg border-l border-borderMain shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right"
        role="dialog"
        aria-label="NOYA AI Assistant"
      >
        {/* Drawer Header */}
        <div className="px-4 py-3 border-b border-borderMain bg-cardSubtle flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal to-emerald-500 flex items-center justify-center text-white shadow-xs flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-textHead tracking-tight font-sans">NOYA</h2>
                {child && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 font-medium truncate">
                    Focused: {pupilName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-textDim truncate font-sans">
                {isParent ? (
                  <span>Family Partner · St. Jude&apos;s</span>
                ) : isSenco ? (
                  <span>SENCO Statutory Inclusion Partner</span>
                ) : (
                  <span>Classroom Inclusion Partner</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={resetConversation}
              type="button"
              className="p-1.5 rounded-lg text-textDim hover:text-textHead hover:bg-cardBg transition-colors cursor-pointer"
              title="Reset conversation"
              aria-label="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-textDim hover:text-textHead hover:bg-cardBg transition-colors cursor-pointer"
              title="Close NOYA"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-appBg/30">
          {messages.map((msg, msgIdx) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
            >
              {/* Message Capsule */}
              <div
                className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-teal-700 dark:bg-teal-600 text-white rounded-tr-xs font-medium'
                    : 'bg-cardBg border border-borderMain text-textMain rounded-tl-xs'
                }`}
              >
                {/* Explainable Execution Steps (Reasoning Trace) */}
                {msg.role === 'assistant' && msg.executionSteps && msg.executionSteps.length > 0 && (
                  <div className="mb-2.5 pb-2 border-b border-borderMain/50">
                    <button
                      type="button"
                      onClick={() => toggleSteps(msg.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-teal hover:text-teal-dark dark:hover:text-teal-light font-medium transition-colors cursor-pointer group"
                    >
                      <Zap className="w-3.5 h-3.5 text-teal" />
                      <span className="font-semibold">
                        {msg.executionSteps.length} {msg.executionSteps.length === 1 ? 'step verified' : 'steps verified'}
                      </span>
                      {msg.latencyMs !== undefined && (
                        <span className="text-[10px] text-textDim font-mono">({msg.latencyMs}ms)</span>
                      )}
                      <span className="text-[10px] text-textDim group-hover:text-teal underline underline-offset-2 ml-1">
                        {expandedSteps[msg.id] ? 'Hide trace' : 'View trace'}
                      </span>
                    </button>

                    {/* Expanded Stepper Card */}
                    {expandedSteps[msg.id] && (
                      <div className="mt-2 p-2.5 rounded-xl bg-appBg/80 dark:bg-cardSubtle border border-borderMain text-left space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-[10px] font-bold text-textDim uppercase tracking-wider px-1">
                          <span>Reasoning & Record Trace</span>
                          <span className="text-teal font-mono lowercase">verified live</span>
                        </div>
                        <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:left-3 before:w-0.5 before:bg-teal/30 dark:before:bg-teal/20">
                          {msg.executionSteps.map((step) => (
                            <div key={step.step_number} className="relative flex items-start gap-2.5 pl-1 text-[11px]">
                              {/* Step indicator circle */}
                              <div className="w-4 h-4 rounded-full bg-teal text-white flex items-center justify-center flex-shrink-0 text-[9px] font-bold z-10 shadow-2xs mt-0.5">
                                {step.step_number}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  <span className="font-semibold text-textMain">{step.title}</span>
                                  {step.tool_name && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-cardBg border border-borderMain text-textDim">
                                      {step.tool_name}
                                    </span>
                                  )}
                                </div>
                                {step.detail && (
                                  <p className="text-[11px] text-textDim leading-snug mt-0.5">
                                    {step.detail}
                                  </p>
                                )}
                                {step.findings && (
                                  <div className="mt-1 px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/50 dark:border-teal-800/50 text-[10.5px] text-teal font-medium flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3 text-teal flex-shrink-0" />
                                    <span className="truncate">{step.findings}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Formatted Text Content */}
                <div className="whitespace-pre-line font-normal">
                  {formatMarkdownText(msg.content, msg.role === 'user')}
                </div>

                {/* Interactive Action Card (Zero-LLM PII hydrated directly) */}
                {msg.actionCard && (
                  <div className="mt-3 pt-2 border-t border-borderMain/60">
                    {renderActionCard(msg.actionCard, msg.id, actionCardStates[msg.id], handleConfirmAction, handleDismissAction)}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[10px] text-textDim mt-1 px-1 font-mono">{msg.timestamp}</span>

              {/* Suggested follow-up chips (Only shown on latest assistant message) */}
              {msg.role === 'assistant' && msgIdx === messages.length - 1 && msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 max-w-[95%]">
                  {msg.suggestedFollowups.map((followup, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(followup)}
                      className="inline-flex items-center gap-1.5 text-xs text-textMain hover:text-teal bg-cardBg hover:bg-cardSubtle border border-borderMain hover:border-teal/50 rounded-full px-3 py-1.5 font-medium transition-all cursor-pointer shadow-2xs active:scale-95 text-left"
                    >
                      <span>{followup}</span>
                      <ArrowRight className="w-3 h-3 flex-shrink-0 text-teal/70" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Loading status indicator */}
          {loading && (
            <div className="flex flex-col items-start animate-in fade-in">
              <div className="bg-cardBg border border-borderMain rounded-2xl rounded-tl-xs px-4 py-3 text-xs shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-teal font-semibold">
                  <BrainCircuit className="w-4 h-4 animate-spin text-teal" />
                  <span>NOYA is thinking...</span>
                </div>
                {statusMessage && (
                  <p className="text-[11px] text-textDim italic flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-teal animate-pulse" />
                    {statusMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 sm:p-3.5 border-t border-borderMain bg-cardBg flex-shrink-0 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask NOYA anything..."
              disabled={loading}
              className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-borderMain bg-inputBg text-textMain placeholder-textDim focus:outline-none focus:border-teal transition-colors shadow-2xs"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="p-2.5 rounded-xl bg-teal hover:bg-teal-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0 shadow-xs active:scale-95"
              title="Send query to NOYA"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Privacy & Zero-LLM PII Footnote */}
          <div className="flex items-center justify-between text-[10px] text-textDim px-1 pt-0.5">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Zero-LLM PII Protected
            </span>
            <span className="font-mono text-[9px] text-textDim">St. Jude&apos;s · Multi-Tenant Isolated</span>
          </div>
        </div>
      </aside>
    </>
  );
};

// =========================================================================
// ACTION CARD RENDERING (Zero-LLM PII Pattern)
// =========================================================================
function renderActionCard(
  card: NoyaActionCard,
  cardId: string = 'card',
  actionState: 'pending' | 'confirming' | 'confirmed' | 'dismissed' = 'pending',
  onConfirm?: (card: NoyaActionCard, cardId: string) => void,
  onDismiss?: (cardId: string) => void,
) {
  // 1. Emergency Contact Card
  if (card.card_type === 'contact_card') {
    if (card.restricted) {
      return (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>{card.title}</span>
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-snug">
            {card.subtitle || 'Teaching Assistants are restricted from viewing private guardian numbers.'}
          </p>
        </div>
      );
    }

    const details = card.details || {};
    return (
      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{card.title}</span>
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
            Verified Record
          </span>
        </div>

        {card.subtitle && (
          <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
            {card.subtitle}
          </p>
        )}

        {/* Action Buttons: Click to Call & Email directly on user's device */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {card.primary_action && card.primary_action.type === 'phone' && (
            <a
              href={`tel:${card.primary_action.value}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors active:scale-95"
            >
              <Phone className="w-3 h-3" />
              <span>{card.primary_action.label}</span>
            </a>
          )}
          {details.email && (
            <a
              href={`mailto:${details.email}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-cardBg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-semibold text-xs transition-colors active:scale-95"
            >
              <Mail className="w-3 h-3" />
              <span>{details.email}</span>
            </a>
          )}
        </div>

        <p className="text-[9px] text-emerald-700 dark:text-emerald-400/80 italic pt-1">
          🛡️ Contact numbers are injected locally and never exposed to cloud LLM prompts.
        </p>
      </div>
    );
  }

  // 2. Morning Handover Capsule Card
  if (card.card_type === 'handover_card') {
    const d = card.details || {};
    return (
      <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-sky-900 dark:text-sky-200">
            <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>{card.title}</span>
          </div>
          {card.badges && card.badges[0] && (
            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-300">
              {card.badges[0]}
            </span>
          )}
        </div>

        {/* Quick Vitals Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/70 dark:bg-cardBg/70 border border-sky-100 dark:border-sky-900">
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
            <div>
              <span className="text-[9px] text-textDim block">Sleep Quality</span>
              <span className="font-bold text-textMain capitalize">{d.sleep_quality || 'Unknown'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/70 dark:bg-cardBg/70 border border-sky-100 dark:border-sky-900">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <div>
              <span className="text-[9px] text-textDim block">Morning Mood</span>
              <span className="font-bold text-textMain capitalize">{d.morning_mood || 'Calm'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/70 dark:bg-cardBg/70 border border-sky-100 dark:border-sky-900">
            <Coffee className="w-3.5 h-3.5 text-amber-500" />
            <div>
              <span className="text-[9px] text-textDim block">Breakfast</span>
              <span className="font-bold text-textMain">{d.breakfast_eaten ? 'Eaten' : 'None'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/70 dark:bg-cardBg/70 border border-sky-100 dark:border-sky-900">
            <Pill className="w-3.5 h-3.5 text-teal" />
            <div>
              <span className="text-[9px] text-textDim block">Medication</span>
              <span className="font-bold text-textMain">{d.medication_given ? 'Administered' : 'N/A'}</span>
            </div>
          </div>
        </div>

        {d.notes && (
          <div className="p-2 rounded-lg bg-white/80 dark:bg-cardBg/80 border border-sky-100 dark:border-sky-900 text-[11px] text-textMain italic">
            &ldquo;{d.notes}&rdquo;
          </div>
        )}
      </div>
    );
  }

  // 3. Proven De-escalation Strategies Card
  if (card.card_type === 'de_escalation_card') {
    const strategies: string[] = (card.details?.strategies as string[]) || [];
    return (
      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900 dark:text-purple-200">
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>{card.title}</span>
        </div>
        <div className="space-y-1.5 pt-1">
          {strategies.map((strat, sIdx) => (
            <div
              key={sIdx}
              className="p-1.5 rounded-lg bg-white/70 dark:bg-cardBg/70 border border-purple-100 dark:border-purple-900 text-[11px] text-textMain flex items-start gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <span>{strat}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. Proposed Action Card (Human-in-the-Loop Safe Mutation)
  if (card.card_type === 'proposed_action' || card.type === 'proposed_action') {
    const d = card.details || {};
    const status = actionState || 'pending';

    if (status === 'confirmed') {
      return (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-1.5 animate-in fade-in">
          <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-200 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>✓ Logged to Pupil Timeline</span>
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
            Recorded: &ldquo;{card.title.replace('Proposed: ', '')}&rdquo; with strategy &ldquo;{d.strategy || 'Classroom Adjustment'}&rdquo;.
          </p>
        </div>
      );
    }

    if (status === 'dismissed') {
      return (
        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-borderMain text-[11px] text-textDim italic">
          ✕ Proposal dismissed by educator. No records were modified.
        </div>
      );
    }

    return (
      <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border-2 border-purple-300 dark:border-purple-800/80 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-purple-900 dark:text-purple-200">
            <ClipboardCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>{card.title}</span>
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
            Action Proposal
          </span>
        </div>

        {card.subtitle && (
          <p className="text-[11px] text-purple-800 dark:text-purple-300 font-medium">
            {card.subtitle}
          </p>
        )}

        <div className="p-2.5 rounded-lg bg-white/80 dark:bg-cardBg/80 border border-purple-200 dark:border-purple-900 text-[11px] space-y-1 text-textMain">
          <div className="flex items-center justify-between text-[10px] text-textDim border-b border-purple-100 dark:border-purple-900/50 pb-1">
            <span>Strategy: <strong className="text-textMain">{d.strategy || 'Classroom Adjustment'}</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{d.outcome || '✓ Worked Well'}</span>
          </div>
          <p className="text-[11px] leading-relaxed pt-0.5">{d.summary || card.payload?.summary}</p>
        </div>

        {/* Human-in-the-Loop Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {onConfirm && (
            <button
              type="button"
              onClick={() => onConfirm(card, cardId)}
              disabled={status === 'confirming'}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal hover:bg-teal-medium text-white font-bold text-xs shadow-xs transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {status === 'confirming' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm & Log to Timeline</span>
                </>
              )}
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss(cardId)}
              disabled={status === 'confirming'}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-cardBg hover:bg-gray-100 dark:hover:bg-gray-800 text-textDim hover:text-textMain border border-borderMain text-xs font-semibold transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Dismiss
            </button>
          )}
        </div>

        <p className="text-[9px] text-purple-700 dark:text-purple-400/80 italic pt-0.5">
          🛡️ Human-in-the-Loop: This note is never saved to the database until you confirm.
        </p>
      </div>
    );
  }

  // 5. Day Summary & Decompression Card
  if (card.card_type === 'day_summary_card' || card.type === 'day_summary_card') {
    const d = card.details || {};
    const battery = Number(d.battery_percentage ?? 75);
    const winTitle = d.classroom_win_title || 'Classroom Engagement';
    const winDesc = d.classroom_win_desc || 'Worked well with classroom peers and stayed engaged.';
    const decompProt: string[] = (d.decompression_protocol as string[]) || [];

    const batteryColor = battery < 40 
      ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' 
      : battery < 70 
      ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'
      : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';

    return (
      <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/70 space-y-2.5">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-teal-900 dark:text-teal-200">
            <Zap className="w-3.5 h-3.5 text-teal" />
            <span>{card.title || `${d.pupil_name || 'Pupil'}'s Day at a Glance`}</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${batteryColor}`}>
            🔋 {battery}% Energy
          </span>
        </div>

        {/* 3:15 PM Battery & Status Note */}
        <div className="p-2 rounded-lg bg-white/80 dark:bg-cardBg/80 border border-teal-100 dark:border-teal-900/60 text-[11px] space-y-1">
          <div className="flex items-center justify-between font-semibold text-textHead text-[10px]">
            <span>3:15 PM Home-Time Battery</span>
            <span className="text-teal font-bold">{d.energy_status || 'Moderate Energy'}</span>
          </div>
          <p className="text-[11px] text-textDim leading-snug">
            {d.afternoon_note || 'Needs a gentle, low-demand buffer upon arrival home.'}
          </p>
        </div>

        {/* Celebrated Classroom Win */}
        {winTitle && (
          <div className="p-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 space-y-0.5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-200">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
              <span>Celebrated Win:</span>
              <span className="truncate">{winTitle}</span>
            </div>
            <p className="text-[10.5px] text-amber-800/90 dark:text-amber-300/90 leading-tight">
              {winDesc}
            </p>
          </div>
        )}

        {/* Top Evening Calming Steps */}
        {decompProt.length > 0 && (
          <div className="space-y-1 pt-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
              Recommended Evening Steps:
            </div>
            <div className="space-y-1">
              {decompProt.slice(0, 2).map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-1.5 text-[11px] text-textMain bg-white/60 dark:bg-cardBg/60 p-1.5 rounded-md border border-teal-100 dark:border-teal-900/40"
                >
                  <CheckCircle2 className="w-3 h-3 text-teal flex-shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Generic fallback card
  return (
    <div className="p-3 rounded-xl bg-cardSubtle border border-borderMain space-y-1">
      <div className="font-bold text-xs text-textHead">{card.title}</div>
      {card.subtitle && <div className="text-[11px] text-textDim">{card.subtitle}</div>}
    </div>
  );
}

// Clean markdown formatter helper: handles bold text, bulleted lists, and linebreaks cleanly
function formatMarkdownText(raw: string, isUser: boolean = false): React.ReactNode {
  if (!raw) return null;

  const lines = raw.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lIdx} className="h-1" />;
        }

        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const isNumbered = /^\d+\.\s/.test(trimmed);
        const content = isBullet ? trimmed.slice(2) : isNumbered ? trimmed.replace(/^\d+\.\s/, '') : line;

        const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);

        const renderedContent = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className={isUser ? 'font-bold text-white' : 'font-semibold text-textHead'}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code
                key={pIdx}
                className={
                  isUser
                    ? 'px-1.5 py-0.5 rounded bg-white/20 text-[12px] font-mono text-white'
                    : 'px-1.5 py-0.5 rounded bg-cardSubtle text-[12px] font-mono text-teal border border-borderMain'
                }
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          return <span key={pIdx}>{part}</span>;
        });

        if (isBullet) {
          return (
            <div key={lIdx} className={`flex items-start gap-2 pl-0.5 text-[13.5px] leading-relaxed ${isUser ? 'text-white font-medium' : 'text-textMain'}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2 ${isUser ? 'bg-white' : 'bg-teal'}`} />
              <div className="flex-1">{renderedContent}</div>
            </div>
          );
        }

        if (isNumbered) {
          const match = trimmed.match(/^(\d+)\./);
          const num = match ? match[1] : '•';
          return (
            <div key={lIdx} className={`flex items-start gap-2 pl-0.5 text-[13.5px] leading-relaxed ${isUser ? 'text-white font-medium' : 'text-textMain'}`}>
              <span className={`text-[11px] font-bold flex-shrink-0 mt-0.5 ${isUser ? 'text-white/90' : 'text-teal'}`}>{num}.</span>
              <div className="flex-1">{renderedContent}</div>
            </div>
          );
        }

        return (
          <p key={lIdx} className={`text-[13.5px] leading-relaxed ${isUser ? 'text-white font-medium' : 'text-textMain'}`}>
            {renderedContent}
          </p>
        );
      })}
    </div>
  );
}
