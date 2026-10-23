import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Radio,
  Shield,
  FileCheck,
  RefreshCw,
  Terminal,
  Volume2,
  Share2,
  ChevronDown,
  MessageSquare,
  AlertCircle,
  Copy,
  Check,
  Users,
  Search,
  ExternalLink,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { sendMessageToElFabriX, ElFabriXRequestOptions } from '../utils/elfabrixClient';

interface ElFabriXMessage {
  id: string;
  sender: 'user' | 'elfabrix';
  text: string;
  timestamp: string;
  channel: string;
  role: string;
  auditTrailId?: string;
}

const CHANNELS = [
  { id: 'webapp', label: 'In-App WebApp', icon: Terminal, desc: 'Rich Markdown, status logs, data tables' },
  { id: 'voice', label: 'Voice / Audio', icon: Volume2, desc: 'Conversational paragraph, spoken style' },
  { id: 'telegram_private', label: 'Telegram (1-on-1)', icon: Send, desc: 'Direct administrative controls & alerts' },
  { id: 'telegram_group', label: 'Telegram (Group)', icon: Users, desc: 'Concise team briefs, PII masked' },
  { id: 'fb_messenger', label: 'Messenger (1-on-1)', icon: MessageSquare, desc: 'Mobile-scannable, 24-hr Meta policy' },
  { id: 'fb_page_post', label: 'FB Page Publishing', icon: Share2, desc: 'Public broadcast drafts with approval gate' }
];

const ROLES = [
  { id: 'admin', label: 'Admin (Full Access)' },
  { id: 'staff', label: 'Staff (Standard)' },
  { id: 'guest', label: 'Guest (Read-Only)' }
];

const QUICK_ACTIONS = [
  {
    title: '22-Teacher Compliance Audit',
    prompt: 'Conduct a compliance audit of monthly accomplishment reports and lesson logs across all 22 teachers and learning sites.',
    channel: 'webapp'
  },
  {
    title: 'DepEd Policy Ingestion (DO/DM)',
    prompt: 'Scan DepEd Central, RO III, and Tarlac City portals for latest ALS issuances and formulate a 3-bullet actionable summary.',
    channel: 'webapp'
  },
  {
    title: 'Voice Briefing Preview',
    prompt: 'Provide a voice summary of division-wide learner progress and active CLC operations for executive listening.',
    channel: 'voice'
  },
  {
    title: 'Telegram Alert Dispatch (Draft)',
    prompt: 'Draft an automated alert for facilitators with pending monthly accomplishment reports or incomplete lesson logs.',
    channel: 'telegram_private'
  }
];

export const ElFabriXConsole: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<ElFabriXRequestOptions['channel']>('webapp');
  const [selectedRole, setSelectedRole] = useState<ElFabriXRequestOptions['role']>('admin');
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const [messages, setMessages] = useState<ElFabriXMessage[]>([
    {
      id: 'init-msg-1',
      sender: 'elfabrix',
      text: `### Executive Summary\n` +
        `**ElFabriX Orchestrator Core is Active.**\n` +
        `Connected to TCSD ALS DataSphere across 22 Mobile Teachers, 77+ CLCs, Google Drive services, and DepEd policy parsing pipelines.\n\n` +
        `| System / Agent | Action Executed | Channel / Status / Output ID |\n` +
        `| :--- | :--- | :--- |\n` +
        `| **ElFabriX Core** | Initialized multi-channel router & RBAC guard | ALL_CHANNELS / STANDBY / ORCH-MAIN-DASH |\n` +
        `| **Supervisory Roster** | Ingested 22-Teacher scope across all learning sites | INTERNAL / READY / SUPV-22T |\n` +
        `| **DepEd Ingestion** | Prepared 3-bullet summary engine for DO & DM issuances | CLOUD_SCRAPER / ACTIVE / DEPED-RO3 |\n\n` +
        `### Next Steps & Recommendations\n` +
        `- Select an interaction channel above (WebApp, Voice, Telegram, or Messenger).\n` +
        `- Type a custom supervisory command or click any of the Quick Action chips below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: 'webapp',
      role: 'admin',
      auditTrailId: 'ELFABRIX-INIT-READY'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (overridePrompt?: string) => {
    const promptToSend = (overridePrompt || inputPrompt).trim();
    if (!promptToSend || isProcessing) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ElFabriXMessage = {
      id: userMessageId,
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: selectedChannel || 'webapp',
      role: selectedRole || 'admin'
    };

    setMessages(prev => [...prev, userMsg]);
    if (!overridePrompt) setInputPrompt('');
    setIsProcessing(true);

    try {
      const reply = await sendMessageToElFabriX(promptToSend, {
        channel: selectedChannel,
        role: selectedRole
      });

      const elfabrixMsg: ElFabriXMessage = {
        id: `elfabrix-${Date.now()}`,
        sender: 'elfabrix',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        channel: selectedChannel || 'webapp',
        role: selectedRole || 'admin',
        auditTrailId: `ELFABRIX-${Date.now().toString().slice(-6)}`
      };

      setMessages(prev => [...prev, elfabrixMsg]);
    } catch (err: any) {
      const errorMsg: ElFabriXMessage = {
        id: `err-${Date.now()}`,
        sender: 'elfabrix',
        text: `### Execution Exception\n` +
          `Failed to process prompt via ElFabriX: ${err.message || err}.\n` +
          `Please check network connection or retry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        channel: selectedChannel || 'webapp',
        role: selectedRole || 'admin'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="elfabrix-main-dashboard-console" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200">
      {/* Console Header */}
      <div className="bg-gradient-to-r from-[#001D4A] via-[#002B6D] to-[#0A4EA3] text-white p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-sky-200 shadow-inner shrink-0">
              <Bot className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-black bg-sky-400/20 text-sky-200 border border-sky-400/30">
                  Orchestrator Agent
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Multi-Channel Online
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2 mt-0.5">
                ElFabriX Central Orchestrator Console
              </h2>
              <p className="text-xs text-sky-100/80 font-normal">
                Intelligent bridge connecting WebApp, Voice, Telegram, Facebook Messenger, 22-Teacher supervision, and DepEd policy scraping.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* RBAC Selector */}
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
              <Shield className="w-3.5 h-3.5 text-sky-300 shrink-0" />
              <span className="text-[10px] text-sky-200 uppercase font-mono font-bold">Role:</span>
              <select
                id="elfabrix-role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                aria-label="Select ElFabriX Role"
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer focus:ring-0"
              >
                {ROLES.map(r => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Expand/Collapse */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-white/15 cursor-pointer"
            >
              {isExpanded ? 'Minimize' : 'Expand'}
            </button>
          </div>
        </div>

        {/* Channel Selector Bar */}
        {isExpanded && (
          <div className="mt-5 pt-4 border-t border-white/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-200 font-bold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-300" /> Active Output & Ingestion Channel
              </span>
              <span className="text-[10px] text-sky-200/70 font-mono">
                [Channel: {selectedChannel} | Role: {selectedRole}]
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {CHANNELS.map(ch => {
                const Icon = ch.icon;
                const active = selectedChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    id={`channel-btn-${ch.id}`}
                    onClick={() => setSelectedChannel(ch.id as any)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-white text-[#002B6D] font-black shadow-md scale-[1.02]'
                        : 'bg-white/10 hover:bg-white/15 text-white/90 font-semibold border border-white/10'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#002B6D]' : 'text-sky-300'}`} />
                    <div className="overflow-hidden">
                      <p className="text-[11px] leading-tight truncate">{ch.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Console Body */}
      {isExpanded && (
        <div className="p-5 space-y-4">
          {/* Quick Action Chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Quick Supervision & Ingestion Prompts
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((qa, i) => (
                <button
                  key={i}
                  id={`quick-action-btn-${i}`}
                  onClick={() => {
                    setSelectedChannel(qa.channel as any);
                    handleSend(qa.prompt);
                  }}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-[#E3EDFA] hover:text-[#002B6D] text-slate-700 rounded-lg text-xs font-semibold transition-all duration-150 border border-slate-200/60 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>{qa.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chat Stream */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4 max-h-[420px] overflow-y-auto space-y-4 font-sans text-xs">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400 font-mono font-bold">
                    <span>{isUser ? 'OPERATOR' : 'ELFABRIX ORCHESTRATOR'}</span>
                    <span>•</span>
                    <span className="text-slate-500">{m.timestamp}</span>
                    <span>•</span>
                    <span className="uppercase text-sky-700 bg-sky-50 px-1 rounded border border-sky-100">
                      {m.channel}
                    </span>
                  </div>

                  <div
                    className={`rounded-2xl p-4 max-w-4xl shadow-2xs ${
                      isUser
                        ? 'bg-[#002B6D] text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed font-medium">{m.text}</p>
                    ) : (
                      <div className="space-y-2.5">
                        {/* Render simple markdown layout */}
                        <div className="prose prose-xs max-w-none text-slate-800 leading-relaxed font-normal">
                          {m.text.split('\n\n').map((block, idx) => {
                            // Check if block is a table
                            if (block.includes('| :---') || block.startsWith('|')) {
                              const lines = block.trim().split('\n').filter(Boolean);
                              const headerLine = lines[0];
                              const dataLines = lines.slice(2);
                              const headers = headerLine.split('|').map(c => c.trim()).filter(Boolean);

                              return (
                                <div key={idx} className="my-2.5 overflow-x-auto rounded-lg border border-slate-200">
                                  <table className="min-w-full divide-y divide-slate-200 text-left text-[11px]">
                                    <thead className="bg-slate-100/80 text-slate-700 font-bold">
                                      <tr>
                                        {headers.map((h, hIdx) => (
                                          <th key={hIdx} className="px-3 py-2 border-r last:border-r-0 border-slate-200">
                                            {h}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white font-mono text-[10.5px]">
                                      {dataLines.map((dLine, dIdx) => {
                                        const cells = dLine.split('|').map(c => c.trim()).filter(Boolean);
                                        return (
                                          <tr key={dIdx} className="hover:bg-slate-50/60">
                                            {cells.map((cell, cIdx) => (
                                              <td key={cIdx} className="px-3 py-1.5 border-r last:border-r-0 border-slate-100">
                                                {cell.replace(/\*\*/g, '')}
                                              </td>
                                            ))}
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            }

                            // Check headers
                            if (block.startsWith('### ')) {
                              return (
                                <h3 key={idx} className="text-xs font-black text-[#002B6D] uppercase tracking-wide mt-2 mb-1">
                                  {block.replace('### ', '')}
                                </h3>
                              );
                            }
                            if (block.startsWith('#### ')) {
                              return (
                                <h4 key={idx} className="text-[11px] font-bold text-slate-800 uppercase tracking-wide mt-1.5 mb-1">
                                  {block.replace('#### ', '')}
                                </h4>
                              );
                            }

                            // Check bullet list
                            if (block.startsWith('- ') || block.startsWith('* ') || block.includes('\n- ') || block.includes('\n* ')) {
                              const items = block.split(/\n[-*] /).filter(Boolean);
                              return (
                                <ul key={idx} className="space-y-1 list-disc list-inside text-slate-700 text-[11.5px]">
                                  {items.map((item, iIdx) => (
                                    <li key={iIdx}>
                                      {item.replace(/^[-*] /, '')}
                                    </li>
                                  ))}
                                </ul>
                              );
                            }

                            return (
                              <p key={idx} className="whitespace-pre-wrap text-[11.5px] leading-relaxed">
                                {block}
                              </p>
                            );
                          })}
                        </div>

                        {/* Audit Trail ID & Action Bar */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-500">
                              {m.auditTrailId || 'ELFABRIX-LOG'}
                            </span>
                            <span>•</span>
                            <span className="text-emerald-600 font-bold">RBAC Verified</span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(m.id, m.text)}
                            className="flex items-center gap-1 hover:text-slate-700 transition-colors cursor-pointer"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex items-center gap-2 text-slate-500 italic p-2 bg-white rounded-xl border border-slate-200/60 w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#002B6D]" />
                <span>ElFabriX is orchestrating sub-agents & processing payload...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Prompt Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="elfabrix-prompt-input"
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={`Send instruction to ElFabriX under [Channel: ${selectedChannel} | Role: ${selectedRole}]...`}
              disabled={isProcessing}
              className="flex-1 bg-slate-50 focus:bg-white border border-slate-300 focus:border-[#002B6D] rounded-xl px-4 py-3 text-xs outline-none transition-all placeholder:text-slate-400 font-medium"
            />
            <button
              id="elfabrix-send-btn"
              type="submit"
              disabled={isProcessing || !inputPrompt.trim()}
              className="px-5 py-3 bg-[#002B6D] hover:bg-[#002B6D]/90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
            >
              <span>Execute</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
