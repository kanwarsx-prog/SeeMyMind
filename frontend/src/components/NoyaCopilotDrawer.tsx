import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  User,
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
} from 'lucide-react';
import {
  Child,
  UserProfile,
  NoyaChatMessage,
  NoyaActionCard,
  NoyaCopilotChatResponse,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isParent = currentUser?.role === 'parent' || screenContext === 'parent_hub';
  const isClassroom = screenContext === 'classroom_matrix';
  const isSenco = screenContext === 'senco_overview';
  const pupilName = child?.preferred_name || child?.first_name || 'Pupil';
  const parentFirstName = currentUser?.full_name ? currentUser.full_name.split(' ')[0] : 'Dana';

  // Compute a unique key representing current conversation scope
  const currentContextKey = isClassroom
    ? 'scope:classroom_matrix'
    : isSenco
    ? 'scope:senco_overview'
    : isParent
    ? `scope:parent_${child?.id || 'general'}`
    : `scope:pupil_${child?.id || 'none'}`;

  const prevContextKeyRef = useRef<string>('');

  // Initialize or reset conversation when scope or child changes
  const resetConversation = () => {
    let greetingContent = '';
    let followups: string[] = [];

    if (isParent && child) {
      greetingContent = `Hello ${parentFirstName}! I'm **NOYA**, your family inclusion partner. I keep you directly connected with **${pupilName}**'s classroom support team, home-time energy updates, and proven calming routines with zero clinical jargon.\n\nHow can I help you and ${pupilName} today?`;
      followups = [
        `How can I help ${pupilName} settle arriving home tonight?`,
        `Has ${pupilName}'s morning check-in been seen by the teacher?`,
        `What sensory calming tools worked best in class today?`,
        `What does ${pupilName}'s 3:15 PM energy note mean for tonight?`,
      ];
    } else if (isClassroom) {
      greetingContent = `Hello! I'm **NOYA**, your classroom inclusion copilot for **Room 4**. I have real-time visibility across all 4 pupils in your cohort, class sensory accommodations, TA hours, and strategy win rates.\n\nHow can I help support your whole classroom delivery today?`;
      followups = [
        'Summarize Room 4 sensory accommodations',
        'Which pupils in Room 4 need proactive quiet breaks?',
        'What is our class strategy win rate this week?',
        'What are the weekly TA hours across Room 4?',
      ];
    } else if (isSenco) {
      greetingContent = `Hello! I'm **NOYA**, your school inclusion and statutory governance copilot for St. Jude's. I track whole-school provision mapping, High-Needs Band allocations, annual review cycles, and Local Authority compliance.\n\nWhat inclusion leadership insights can I provide today?`;
      followups = [
        'What is our whole-school EHCP vs SEN Support distribution?',
        'Which pupils have statutory annual reviews due this term?',
        'Show total weekly High-Needs TA support hours',
        'Summarize statutory provisions across classrooms',
      ];
    } else if (child) {
      greetingContent = `Hello! I'm **NOYA**, your context-aware SEND Copilot. I have live access to verified records, morning handovers, and statutory EHCP Section F data for **${pupilName}**. All queries run under strict multi-tenant isolation with Zero-LLM PII protection.\n\nHow can I assist your classroom delivery today?`;
      followups = [
        `What was the latest morning handover for ${pupilName}?`,
        `Who is the emergency contact for ${pupilName}?`,
        `What proven de-escalation strategies work best for ${pupilName}?`,
        `What are the statutory Section F agreed hours for ${pupilName}?`,
      ];
    } else {
      greetingContent = `Hello! I'm **NOYA**, your school SEND Copilot. I can query morning handovers, de-escalation strategies, and whole-school provisions. Select a pupil or ask a question below.`;
      followups = [
        'Show class provision overview',
        'Which pupils have upcoming annual reviews?',
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

  // Reset chat whenever child ID or screen context changes (fixes stuck old conversation)
  useEffect(() => {
    if (prevContextKeyRef.current !== currentContextKey) {
      prevContextKeyRef.current = currentContextKey;
      resetConversation();
    }
  }, [currentContextKey]);

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
    if (lower.includes('contact') || lower.includes('phone') || lower.includes('parent') || lower.includes('mum') || lower.includes('dad')) {
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('NOYA Copilot Error:', err);
      const errorMsg: DisplayMessage = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: `⚠️ **Unable to complete request**: ${err?.message || 'Could not connect to NOYA Copilot engine.'}\n\nPlease try again or verify your connection.`,
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
        aria-label="NOYA AI Copilot"
      >
        {/* Drawer Header */}
        <div className="px-4 py-3 border-b border-borderMain bg-cardSubtle flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal to-emerald-500 flex items-center justify-center text-white shadow-xs flex-shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-textHead tracking-tight">NOYA Copilot</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Agentic AI
                </span>
              </div>
              <p className="text-[11px] text-textDim truncate">
                {isParent && child ? (
                  <span className="flex items-center gap-1 font-medium text-textMain">
                    <span>👩‍👧</span>
                    <span>Family Partner for {pupilName} {child.last_name}</span>
                  </span>
                ) : isClassroom ? (
                  <span className="flex items-center gap-1 font-medium text-textMain">
                    <span>🏫</span>
                    <span>Room 4 Classroom Hub · All 4 Pupils</span>
                  </span>
                ) : isSenco ? (
                  <span className="flex items-center gap-1 font-medium text-textMain">
                    <span>🛡️</span>
                    <span>Whole-School SENCO Hub · Statutory Register</span>
                  </span>
                ) : child ? (
                  <span className="flex items-center gap-1 font-medium text-textMain">
                    <User className="w-3 h-3 text-teal" />
                    <span>{pupilName} {child.last_name} · {child.year_group || 'SEND'}</span>
                  </span>
                ) : (
                  <span>Whole School &bull; General Guidance</span>
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
              title="Close NOYA Copilot"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Context Chips Bar (Role and Screen Aware) */}
        <div className="px-3.5 py-2 bg-cardBg border-b border-borderMain/60 overflow-x-auto flex items-center gap-1.5 no-scrollbar flex-shrink-0">
          <span className="text-[10px] font-bold text-textDim uppercase tracking-wider flex-shrink-0 mr-1">
            Quick:
          </span>
          {isParent && child ? (
            <>
              <button
                onClick={() => handleChipClick(`Has ${pupilName}'s morning check-in been seen by the teacher?`)}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                🌅 Morning Note Seen?
              </button>
              <button
                onClick={() => handleChipClick(`What does ${pupilName}'s 3:15 PM energy note mean for tonight?`)}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                🎒 Home-Time Energy
              </button>
              <button
                onClick={() => handleChipClick(`How can I help ${pupilName} settle arriving home tonight?`)}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                Tonight&apos;s Calming Steps
              </button>
              <button
                onClick={() => handleChipClick(`What strengths and positive moments were celebrated for ${pupilName} recently?`)}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                ⭐ Classroom Wins
              </button>
            </>
          ) : isClassroom ? (
            <>
              <button
                onClick={() => handleChipClick('Summarize Room 4 sensory accommodations and environmental adjustments.')}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                🧩 Sensory Matrix
              </button>
              <button
                onClick={() => handleChipClick('What are the total weekly TA hours across Room 4 pupils?')}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                👥 TA Allocations
              </button>
              <button
                onClick={() => handleChipClick('What is our class strategy win rate this week?')}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                🎯 Strategy Win Rate
              </button>
              <button
                onClick={() => handleChipClick('Which pupils in Room 4 need proactive sensory breaks?')}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                ⚠️ Sensory Breaks
              </button>
            </>
          ) : isSenco ? (
            <>
              <button
                onClick={() => handleChipClick('What is our whole-school EHCP vs SEN Support distribution?')}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                📊 Provision Breakdown
              </button>
              <button
                onClick={() => handleChipClick('Which pupils have statutory annual reviews due this term?')}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                📅 Annual Reviews
              </button>
              <button
                onClick={() => handleChipClick('Show total weekly high-needs TA support hours across the school.')}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                🤝 High-Needs Hours
              </button>
              <button
                onClick={() => handleChipClick('Summarize Section 44 and statutory compliance for the trust report.')}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                📋 Statutory Compliance
              </button>
            </>
          ) : child ? (
            <>
              <button
                onClick={() => handleChipClick(`What was the latest morning handover status for ${pupilName}?`)}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                🌅 Morning Handover
              </button>
              <button
                onClick={() => handleChipClick(`Who is the emergency contact and what are their details for ${pupilName}?`)}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                📞 Emergency Contact
              </button>
              <button
                onClick={() => handleChipClick(`What proven de-escalation strategies work best for ${pupilName}?`)}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                🧘 De-escalation
              </button>
              <button
                onClick={() => handleChipClick(`What are the statutory EHCP Section F agreed hours and provisions for ${pupilName}?`)}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                📋 Section F Hours
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleChipClick('Show class provision overview')}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                🏫 Class Overview
              </button>
              <button
                onClick={() => handleChipClick('Which pupils have upcoming annual reviews?')}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-cardSubtle hover:bg-teal-50 dark:hover:bg-teal-950/50 hover:text-teal hover:border-teal/40 border border-borderMain text-textMain transition-all cursor-pointer font-medium active:scale-95"
              >
                📅 Annual Reviews
              </button>
            </>
          )}
        </div>

        {/* Message Thread (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-appBg/30">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
            >
              {/* Message Capsule */}
              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-teal text-white rounded-tr-xs'
                    : 'bg-cardBg border border-borderMain text-textMain rounded-tl-xs'
                }`}
              >
                {/* Assistant header tag */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-borderMain/50 text-[10px] text-textDim">
                    <div className="flex items-center gap-1.5 font-bold text-teal">
                      <Sparkles className="w-3 h-3 text-teal" />
                      <span>NOYA</span>
                      {msg.toolCalled && (
                        <span className="px-1.5 py-0.2 rounded-full bg-mint/20 text-teal text-[9px] font-mono border border-teal/20">
                          tool:{msg.toolCalled}
                        </span>
                      )}
                    </div>
                    {msg.latencyMs !== undefined && (
                      <span className="text-[9px] font-mono text-textDim">{msg.latencyMs}ms</span>
                    )}
                  </div>
                )}

                {/* Formatted Text Content */}
                <div className="whitespace-pre-line font-normal">
                  {formatMarkdownText(msg.content)}
                </div>

                {/* Interactive Action Card (Zero-LLM PII hydrated directly) */}
                {msg.actionCard && (
                  <div className="mt-3 pt-2 border-t border-borderMain/60">
                    {renderActionCard(msg.actionCard)}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <span className="text-[9px] text-textDim mt-1 px-1 font-mono">{msg.timestamp}</span>

              {/* Suggested follow-up chips */}
              {msg.role === 'assistant' && msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                  {msg.suggestedFollowups.map((followup, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(followup)}
                      className="flex items-center gap-1 text-[11px] text-teal hover:text-teal-medium bg-cardBg hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 rounded-xl px-2.5 py-1 font-medium transition-all cursor-pointer shadow-2xs active:scale-95 text-left"
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
        <div className="p-3 sm:p-4 border-t border-borderMain bg-cardBg flex-shrink-0 space-y-2">
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
              placeholder={
                child
                  ? `Ask NOYA about ${pupilName}'s handover, triggers, or EHCP...`
                  : 'Ask NOYA anything about classroom provision or EHCP...'
              }
              disabled={loading}
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-borderMain bg-inputBg text-textMain placeholder-textDim focus:outline-none focus:border-teal transition-colors shadow-2xs"
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
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Zero-LLM PII Protection
            </span>
            <span className="font-mono text-[9px]">Multi-Tenant Isolated</span>
          </div>
        </div>
      </aside>
    </>
  );
};

// =========================================================================
// ACTION CARD RENDERING (Zero-LLM PII Pattern)
// =========================================================================
function renderActionCard(card: NoyaActionCard) {
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

  // Generic fallback card
  return (
    <div className="p-3 rounded-xl bg-cardSubtle border border-borderMain space-y-1">
      <div className="font-bold text-xs text-textHead">{card.title}</div>
      {card.subtitle && <div className="text-[11px] text-textDim">{card.subtitle}</div>}
    </div>
  );
}

// Simple markdown formatter helper to bold **words** and preserve linebreaks
function formatMarkdownText(raw: string): React.ReactNode {
  if (!raw) return null;

  // Split by bold patterns **text**
  const lines = raw.split('\n');
  return lines.map((line, lIdx) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={lIdx} className={lIdx > 0 ? 'mt-1.5' : ''}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-bold text-textHead">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </p>
    );
  });
}
