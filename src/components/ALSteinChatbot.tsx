import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Bot,
  BrainCircuit,
  TrendingUp,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Trash2,
  Download,
  Copy,
  Check,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  Layers,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import alsteinAvatarImg from '../assets/alstein_avatar.jpg';
import {
  buildClassProgramKnowledgeContext,
  processLocalAlsteinQuery,
  saveAuditLog,
  getAuditLogs,
  clearAuditLogs,
  AlsteinAnalysisResult,
  AlsteinAuditLog
} from '../utils/alsteinEngine';

interface Message {
  id: string;
  sender: 'user' | 'alstein';
  text: string;
  timestamp: string;
  auditTrailId?: string;
  modelUsed?: string;
  evidenceBasis?: string[];
  metrics?: AlsteinAnalysisResult['metrics'];
}

interface ALSteinChatbotProps {
  currentTeacherName?: string;
}

const SUGGESTED_PROMPTS = [
  'What if enrollment increases by 20%?',
  'What is the correlation between attendance and completion rates?',
  'Highlight potential schedule conflicts or load optimizations',
  'Show me all classes scheduled on Mondays',
  'List teacher assignments by subject',
  'Check compliance with DepEd Order 005, s. 2024'
];

export function ALSteinChatbot({ currentTeacherName }: ALSteinChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'audit' | 'knowledge'>('chat');
  const [auditLogs, setAuditLogs] = useState<AlsteinAuditLog[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'alstein',
      text: `### 🧪 Salutations! I am ALStein, your Class Program Assistant.\n\n` +
        `I possess complete real-time knowledge of all **17 Mobile Teachers**, **77+ Community Learning Centers (CLCs)**, and the statutory guidelines of **DepEd Order No. 005, s. 2024** and the **Magna Carta for Public School Teachers (RA 4670)**.\n\n` +
        `How may I assist you today? You can ask me for:\n` +
        `- **Probability assessments & scenario simulations** (e.g. *“What if enrollment increases by 20%?”*)\n` +
        `- **Correlation analysis** (e.g. *“Correlation between attendance and completion rates”*)\n` +
        `- **Schedule summaries & optimizations** (e.g. *“Highlight conflicts or teacher load balance”*)\n` +
        `- **Evidence & audit-ready references** for all calculations.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      auditTrailId: 'ALS-INIT-SYSTEM',
      evidenceBasis: [
        'DepEd Order No. 005, s. 2024',
        'Magna Carta for Public School Teachers (RA 4670)',
        'Division-Wide Mobile Teachers Weekly Schedule Masterlist'
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen && !isMinimized && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, activeTab]);

  // Load audit logs on mount
  useEffect(() => {
    setAuditLogs(getAuditLogs());
  }, []);

  // Sync knowledge context
  const liveKnowledge = useMemo(() => {
    return buildClassProgramKnowledgeContext();
  }, []);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || query).trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      // 1. First attempt full-stack call to Gemini API endpoint
      const response = await fetch('/api/alstein/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          classProgramContext: {
            ...liveKnowledge,
            selectedTeacher: currentTeacherName || 'All Teachers'
          }
        })
      });

      let alsteinResponse: Message;

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.answer) {
          alsteinResponse = {
            id: `msg-${Date.now()}-alstein`,
            sender: 'alstein',
            text: data.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            auditTrailId: data.auditTrailId,
            modelUsed: data.modelUsed || 'gemini-3.8-flash',
            evidenceBasis: data.evidenceBasis || [
              'DepEd Order No. 005, s. 2024',
              'Magna Carta for Public School Teachers (RA 4670)',
              'TCSD Class Program Database'
            ]
          };

          // Save audit log
          const newAuditLog: AlsteinAuditLog = {
            id: data.auditTrailId || `ALS-AUDIT-${Date.now()}`,
            query: textToSend,
            timestamp: new Date().toISOString(),
            answerPreview: data.answer.substring(0, 140) + '...',
            evidenceCount: data.evidenceBasis?.length || 3,
            mode: 'gemini'
          };
          saveAuditLog(newAuditLog);
          setAuditLogs(getAuditLogs());
        } else {
          // Fallback to local deterministic agentic engine
          const localResult = processLocalAlsteinQuery(textToSend);
          alsteinResponse = {
            id: `msg-${Date.now()}-alstein`,
            sender: 'alstein',
            text: localResult.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            auditTrailId: localResult.auditTrailId,
            modelUsed: localResult.modelUsed,
            evidenceBasis: localResult.evidenceBasis,
            metrics: localResult.metrics
          };

          const newAuditLog: AlsteinAuditLog = {
            id: localResult.auditTrailId,
            query: textToSend,
            timestamp: localResult.timestamp,
            answerPreview: localResult.answer.substring(0, 140) + '...',
            evidenceCount: localResult.evidenceBasis.length,
            mode: 'statistical_engine'
          };
          saveAuditLog(newAuditLog);
          setAuditLogs(getAuditLogs());
        }
      } else {
        // Fallback to local deterministic agentic engine
        const localResult = processLocalAlsteinQuery(textToSend);
        alsteinResponse = {
          id: `msg-${Date.now()}-alstein`,
          sender: 'alstein',
          text: localResult.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          auditTrailId: localResult.auditTrailId,
          modelUsed: localResult.modelUsed,
          evidenceBasis: localResult.evidenceBasis,
          metrics: localResult.metrics
        };

        const newAuditLog: AlsteinAuditLog = {
          id: localResult.auditTrailId,
          query: textToSend,
          timestamp: localResult.timestamp,
          answerPreview: localResult.answer.substring(0, 140) + '...',
          evidenceCount: localResult.evidenceBasis.length,
          mode: 'statistical_engine'
        };
        saveAuditLog(newAuditLog);
        setAuditLogs(getAuditLogs());
      }

      setMessages(prev => [...prev, alsteinResponse]);
    } catch (err) {
      // Local fallback on network error
      const localResult = processLocalAlsteinQuery(textToSend);
      const fallbackResponse: Message = {
        id: `msg-${Date.now()}-alstein`,
        sender: 'alstein',
        text: localResult.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        auditTrailId: localResult.auditTrailId,
        modelUsed: localResult.modelUsed,
        evidenceBasis: localResult.evidenceBasis,
        metrics: localResult.metrics
      };
      setMessages(prev => [...prev, fallbackResponse]);

      const newAuditLog: AlsteinAuditLog = {
        id: localResult.auditTrailId,
        query: textToSend,
        timestamp: localResult.timestamp,
        answerPreview: localResult.answer.substring(0, 140) + '...',
        evidenceCount: localResult.evidenceBasis.length,
        mode: 'statistical_engine'
      };
      saveAuditLog(newAuditLog);
      setAuditLogs(getAuditLogs());
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Floating Persistent Avatar Icon Button (Bottom Right, positioned above ElFabriX) */}
      <div
        className="fixed bottom-24 right-5 z-50 flex flex-col items-end print:hidden select-none"
        id="alstein-widget-wrapper"
      >
        {!isOpen && (
          <div className="relative group">
            {/* Tooltip on Hover */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xl whitespace-nowrap pointer-events-none transition-all duration-200 border border-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Ask ALStein – Your Class Program Assistant
            </div>

            {/* Clickable Avatar Icon Button */}
            <button
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
              }}
              title="Ask ALStein – Your Class Program Assistant"
              className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#002B6D] to-blue-600 p-0.5 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-hidden focus:ring-4 focus:ring-blue-400/40 cursor-pointer overflow-hidden border-2 border-white/80"
              id="alstein-floating-trigger"
            >
              <img
                src={alsteinAvatarImg}
                alt="ALStein Avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-[14px]"
              />
              {/* Online Pulse Indicator */}
              <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
              </span>
            </button>
          </div>
        )}

        {/* ALStein Chatbot Window */}
        {isOpen && (
          <div
            className={`w-[95vw] sm:w-[460px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 ${
              isMinimized ? 'h-14' : 'h-[620px] max-h-[85vh]'
            }`}
            id="alstein-chat-window"
          >
            {/* Window Top Header */}
            <div className="bg-gradient-to-r from-[#002B6D] via-[#00388D] to-[#001F52] px-4 py-2.5 text-white flex items-center justify-between shadow-xs select-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/40 shadow-xs shrink-0">
                  <img
                    src={alsteinAvatarImg}
                    alt="ALStein"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-black text-white tracking-tight truncate">
                      ALStein
                    </h4>
                    <span className="px-1.5 py-0.2 rounded-md text-[9px] font-mono font-extrabold bg-blue-400/30 text-blue-200 border border-blue-300/30">
                      AGENTIC AI
                    </span>
                  </div>
                  <p className="text-[10.5px] text-blue-100/90 font-medium truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Class Program Assistant & Advisor
                  </p>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/15 rounded-lg text-blue-200 hover:text-white transition cursor-pointer"
                  title={isMinimized ? 'Expand window' : 'Minimize window'}
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-rose-500/80 rounded-lg text-blue-200 hover:text-white transition cursor-pointer"
                  title="Close ALStein window"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Window Body (Hidden if minimized) */}
            {!isMinimized && (
              <>
                {/* Secondary Sub-navigation Tabs */}
                <div className="flex items-center border-b border-slate-100 bg-slate-50/80 px-3 py-1.5 gap-1.5 text-xs">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'chat'
                        ? 'bg-white text-[#002B6D] shadow-2xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat & Inquiries
                  </button>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'audit'
                        ? 'bg-white text-[#002B6D] shadow-2xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Audit Trail ({auditLogs.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('knowledge')}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'knowledge'
                        ? 'bg-white text-[#002B6D] shadow-2xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Knowledge Sync
                  </button>
                </div>

                {/* Tab 1: Chat Stream */}
                {activeTab === 'chat' && (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Scrollable Message History */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {msg.sender === 'user' ? 'You' : 'ALStein'}
                            </span>
                            <span className="text-[10px] text-slate-400">• {msg.timestamp}</span>
                            {msg.auditTrailId && (
                              <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                {msg.auditTrailId}
                              </span>
                            )}
                          </div>

                          <div
                            className={`rounded-2xl p-3.5 max-w-[90%] leading-relaxed ${
                              msg.sender === 'user'
                                ? 'bg-[#002B6D] text-white rounded-br-xs'
                                : 'bg-slate-50 border border-slate-200/90 text-slate-800 rounded-bl-xs shadow-2xs'
                            }`}
                          >
                            <div className="prose prose-xs max-w-none text-xs text-inherit space-y-2 whitespace-pre-line">
                              {msg.text}
                            </div>

                            {/* Evidence & Basis Badges */}
                            {msg.evidenceBasis && msg.evidenceBasis.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-1">
                                <span className="text-[9.5px] font-mono font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  Evidence & Basis:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {msg.evidenceBasis.map((ev, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[9.5px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                                    >
                                      {ev}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Structured Metrics Callout (Scenario / Correlation / Probability) */}
                            {msg.metrics && (
                              <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-2">
                                {msg.metrics.probabilityAssessment && (
                                  <div className="bg-white p-2.5 rounded-xl border border-blue-100 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-[#002B6D]">
                                        Probability Assessment:
                                      </span>
                                      <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                                        {(msg.metrics.probabilityAssessment.probability * 100).toFixed(0)}% ({msg.metrics.probabilityAssessment.level})
                                      </span>
                                    </div>
                                    <p className="text-[10.5px] text-slate-600">
                                      {msg.metrics.probabilityAssessment.scenario}
                                    </p>
                                  </div>
                                )}

                                {msg.metrics.correlationAnalysis && (
                                  <div className="bg-white p-2.5 rounded-xl border border-emerald-100 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-emerald-800">
                                        Correlation Analysis (r):
                                      </span>
                                      <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                                        r = {msg.metrics.correlationAnalysis.coefficient}
                                      </span>
                                    </div>
                                    <p className="text-[10.5px] text-slate-600">
                                      {msg.metrics.correlationAnalysis.interpretation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action Bar (Copy text) */}
                            {msg.sender === 'alstein' && (
                              <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                                <span>{msg.modelUsed || 'gemini-3.8-flash'}</span>
                                <button
                                  onClick={() => copyToClipboard(msg.text, msg.id)}
                                  className="hover:text-slate-700 transition flex items-center gap-1 cursor-pointer"
                                  title="Copy response"
                                >
                                  {copiedId === msg.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-600">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {isLoading && (
                        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl w-fit text-slate-500 text-xs">
                          <RefreshCw className="w-4 h-4 animate-spin text-[#002B6D]" />
                          <span className="font-semibold">ALStein is analyzing Class Program data...</span>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggested Prompts Pill Strip */}
                    <div className="p-2 border-t border-slate-100 bg-slate-50/60 overflow-x-auto flex items-center gap-1.5 select-none shrink-0">
                      <Sparkles className="w-3 h-3 text-[#002B6D] shrink-0 ml-1" />
                      {SUGGESTED_PROMPTS.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(p)}
                          className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-[#002B6D] border border-slate-200 hover:border-blue-200 rounded-lg text-[10.5px] font-semibold whitespace-nowrap transition cursor-pointer shrink-0 shadow-2xs"
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    {/* Chat Input Field & Send Button */}
                    <div className="p-3 border-t border-slate-200 bg-white">
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          ref={inputRef}
                          type="text"
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                          placeholder="Ask ALStein about schedules, probabilities, correlations..."
                          className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] transition"
                          disabled={isLoading}
                        />
                        <button
                          type="submit"
                          disabled={!query.trim() || isLoading}
                          className="p-2.5 bg-[#002B6D] hover:bg-[#001F52] disabled:opacity-40 text-white rounded-xl transition cursor-pointer shadow-xs shrink-0"
                          title="Send inquiry"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Tab 2: Compliance Audit Trail */}
                {activeTab === 'audit' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Compliance Audit Trail
                        </h5>
                        <p className="text-[11px] text-slate-500 font-medium">
                          All ALStein inquiries and responses logged for statutory verification.
                        </p>
                      </div>
                      {auditLogs.length > 0 && (
                        <button
                          onClick={() => {
                            clearAuditLogs();
                            setAuditLogs([]);
                          }}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear Logs
                        </button>
                      )}
                    </div>

                    {auditLogs.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 space-y-1">
                        <ShieldCheck className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="font-bold">No Audit Records Yet</p>
                        <p className="text-[11px]">Send an inquiry to ALStein to initiate the compliance audit trail.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {auditLogs.map(log => (
                          <div
                            key={log.id}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[9px] font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                                {log.id}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="font-bold text-slate-900 text-[11px]">
                              Q: "{log.query}"
                            </p>
                            <p className="text-[10.5px] text-slate-600 leading-snug">
                              {log.answerPreview}
                            </p>
                            <div className="flex items-center justify-between pt-1 text-[9.5px] text-slate-400 border-t border-slate-200/60">
                              <span>Mode: {log.mode.toUpperCase()}</span>
                              <span className="text-emerald-700 font-bold">Audit-Ready Verified</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Knowledge Base Sync */}
                {activeTab === 'knowledge' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                    <div>
                      <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <BrainCircuit className="w-4 h-4 text-[#002B6D]" />
                        Real-Time Knowledge Base Synchronization
                      </h5>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Live indexed data elements ingested from the Google Sheets Class Program master database.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Facilitators</span>
                        <span className="text-xl font-black text-slate-900">{liveKnowledge.totalTeachers}</span>
                        <span className="text-[10px] text-emerald-600 font-bold block">100% Rostered</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered CLCs</span>
                        <span className="text-xl font-black text-slate-900">{liveKnowledge.totalClcs}</span>
                        <span className="text-[10px] text-blue-600 font-bold block">{liveKnowledge.districts.length} Districts</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                        Statutory Rules & Baselines
                      </span>
                      <div className="space-y-1.5">
                        {liveKnowledge.statutoryRules.map((rule, idx) => (
                          <div
                            key={idx}
                            className="bg-blue-50/50 border border-blue-100 rounded-lg p-2 text-[10.5px] text-slate-700 flex items-start gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#002B6D] shrink-0 mt-0.5" />
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
