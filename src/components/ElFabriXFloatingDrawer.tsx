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
  X,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  Users,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Flame,
  ArrowRight
} from 'lucide-react';
import { sendMessageToElFabriX, ElFabriXRequestOptions } from '../utils/elfabrixClient';

interface ElFabriXDrawerMessage {
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
  { id: 'admin', label: 'Admin' },
  { id: 'staff', label: 'Staff' },
  { id: 'guest', label: 'Guest' }
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

interface ElFabriXFloatingDrawerProps {
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export const ElFabriXFloatingDrawer: React.FC<ElFabriXFloatingDrawerProps> = ({
  isOpen: externalIsOpen,
  onOpen: externalOnOpen,
  onClose: externalOnClose
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleOpen = () => {
    if (externalOnOpen) externalOnOpen();
    setInternalIsOpen(true);
  };

  const handleClose = () => {
    if (externalOnClose) externalOnClose();
    setInternalIsOpen(false);
  };

  const [selectedChannel, setSelectedChannel] = useState<ElFabriXRequestOptions['channel']>('webapp');
  const [selectedRole, setSelectedRole] = useState<ElFabriXRequestOptions['role']>('admin');
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ElFabriXDrawerMessage[]>([
    {
      id: 'init-drawer-msg',
      sender: 'elfabrix',
      text: `### Executive Summary\n` +
        `**ElFabriX Orchestrator Active.**\n` +
        `Connected to TCSD ALS DataSphere across 22 Mobile Teachers, 77+ CLCs, Google Drive services, and DepEd policy parsing pipelines.\n\n` +
        `| System / Agent | Action Executed | Channel / Status / Output ID |\n` +
        `| :--- | :--- | :--- |\n` +
        `| **ElFabriX Core** | Multi-channel router & RBAC gate active | ALL_CHANNELS / STANDBY / ORCH-DRAWER-01 |\n` +
        `| **Supervisory Roster** | Ingested 22-Teacher scope across learning sites | INTERNAL / READY / SUPV-22T |\n` +
        `| **DepEd Ingestion** | 3-bullet summary engine for DO & DM issuances | CLOUD_SCRAPER / ACTIVE / DEPED-RO3 |\n\n` +
        `### Next Steps & Recommendations\n` +
        `- Select a channel above (WebApp, Voice, Telegram, or Messenger).\n` +
        `- Type an operational prompt or tap one of the quick actions below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: 'webapp',
      role: 'admin',
      auditTrailId: 'ELFABRIX-INIT-READY'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
    }
  }, [isOpen, messages]);

  const handleSend = async (overridePrompt?: string) => {
    const promptToSend = (overridePrompt || inputPrompt).trim();
    if (!promptToSend || isProcessing) return;

    const userMsg: ElFabriXDrawerMessage = {
      id: `user-${Date.now()}`,
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

      const elfabrixMsg: ElFabriXDrawerMessage = {
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
      const errorMsg: ElFabriXDrawerMessage = {
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
    <>
      {/* PERSISTENT FLOATING ACTION BUTTON (FAB) (Bottom-Right Corner) */}
      <div
        id="elfabrix-floating-button-container"
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden select-none"
      >
        {!isOpen && (
          <div className="relative group">
            {/* Tooltip on Hover */}
            <div className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-[#001D4A] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xl whitespace-nowrap pointer-events-none transition-all duration-200 border border-sky-400/30">
              <Sparkles className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
              <span>ElFabriX AI Orchestrator</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-200 uppercase font-mono">
                Open Drawer
              </span>
            </div>

            {/* Glowing Floating Action Button (FAB) */}
            <button
              id="elfabrix-open-drawer-btn"
              onClick={handleOpen}
              aria-label="Open ElFabriX AI Orchestrator Drawer"
              className="relative w-15 h-15 rounded-2xl bg-gradient-to-tr from-[#001D4A] via-[#002B6D] to-[#0A4EA3] p-0.5 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-hidden focus:ring-4 focus:ring-sky-400/40 cursor-pointer overflow-hidden border-2 border-white/80 group flex items-center justify-center"
            >
              {/* Inner container with icon & styling */}
              <div className="w-full h-full rounded-[14px] bg-[#002B6D] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/20 to-transparent pointer-events-none" />
                <Bot className="w-7 h-7 text-sky-200 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-[8.5px] font-black tracking-tighter text-sky-100 uppercase font-mono mt-0.5">
                  ElFabriX
                </span>
              </div>

              {/* Online Pulse Beacon */}
              <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
              </span>
            </button>
          </div>
        )}
      </div>

      {/* BACKDROP OVERLAY WHEN DRAWER IS OPEN */}
      {isOpen && (
        <div
          id="elfabrix-drawer-backdrop"
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity duration-300 print:hidden"
        />
      )}

      {/* SLIDE-OVER DRAWER INTERFACE */}
      <aside
        id="elfabrix-drawer-panel"
        aria-label="ElFabriX AI Orchestrator Drawer"
        className={`fixed top-0 right-0 h-full w-full sm:w-[540px] md:w-[600px] bg-white z-50 shadow-2xl border-l border-slate-200 flex flex-col transition-transform duration-300 ease-out transform print:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-[#001D4A] via-[#002B6D] to-[#0A4EA3] text-white px-5 py-4 shrink-0 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-sky-200 shadow-inner shrink-0">
                <Bot className="w-5 h-5 text-sky-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white tracking-tight">
                    ElFabriX Orchestrator
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-black bg-sky-400/20 text-sky-200 border border-sky-400/30">
                    Drawer
                  </span>
                </div>
                <p className="text-[11px] text-sky-100/80 font-medium">
                  Central Bridge • 22 Teachers • DepEd Portals • Multi-Channel
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Role Select in Header */}
              <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 text-[11px]">
                <Shield className="w-3 h-3 text-sky-300 shrink-0" />
                <select
                  id="elfabrix-drawer-role-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  aria-label="Select Role"
                  className="bg-transparent text-[11px] font-bold text-white outline-none cursor-pointer"
                >
                  {ROLES.map(r => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Close Drawer Button */}
              <button
                id="elfabrix-close-drawer-btn"
                onClick={handleClose}
                title="Close Drawer"
                className="p-1.5 hover:bg-white/15 rounded-xl text-sky-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Compact Multi-Channel Selector */}
          <div className="mt-3.5 pt-3 border-t border-white/15">
            <div className="flex items-center justify-between text-[10px] text-sky-200 font-mono uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1 font-bold">
                <Radio className="w-3 h-3 text-emerald-300" /> Channel Context
              </span>
              <span className="text-sky-200/70">
                [Channel: {selectedChannel} | Role: {selectedRole}]
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {CHANNELS.map(ch => {
                const Icon = ch.icon;
                const active = selectedChannel === ch.id;
                return (
                  <button
                    key={ch.id}
                    id={`drawer-channel-${ch.id}`}
                    onClick={() => setSelectedChannel(ch.id as any)}
                    title={ch.desc}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-left transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-white text-[#002B6D] font-bold shadow-xs'
                        : 'bg-white/10 hover:bg-white/15 text-white/90 font-medium'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#002B6D]' : 'text-sky-300'}`} />
                    <span className="text-[10px] truncate">{ch.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Action Chips Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 overflow-x-auto shrink-0 flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Prompts:
          </span>
          {QUICK_ACTIONS.map((qa, i) => (
            <button
              key={i}
              id={`drawer-quick-${i}`}
              onClick={() => {
                setSelectedChannel(qa.channel as any);
                handleSend(qa.prompt);
              }}
              disabled={isProcessing}
              className="px-2.5 py-1 bg-white hover:bg-[#E3EDFA] hover:text-[#002B6D] text-slate-700 rounded-md text-[11px] font-medium transition border border-slate-200 flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <FileCheck className="w-3 h-3 text-slate-400" />
              <span>{qa.title}</span>
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-50/50">
          {messages.map(m => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400 font-mono font-bold">
                  <span>{isUser ? 'OPERATOR' : 'ELFABRIX'}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                  <span>•</span>
                  <span className="uppercase text-sky-700 bg-sky-50 px-1 rounded border border-sky-100">
                    {m.channel}
                  </span>
                </div>

                <div
                  className={`rounded-2xl p-4 max-w-[92%] shadow-2xs ${
                    isUser
                      ? 'bg-[#002B6D] text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed font-medium">{m.text}</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="prose prose-xs max-w-none text-slate-800 leading-relaxed font-normal">
                        {m.text.split('\n\n').map((block, idx) => {
                          // Table parser
                          if (block.includes('| :---') || block.startsWith('|')) {
                            const lines = block.trim().split('\n').filter(Boolean);
                            const headerLine = lines[0];
                            const dataLines = lines.slice(2);
                            const headers = headerLine.split('|').map(c => c.trim()).filter(Boolean);

                            return (
                              <div key={idx} className="my-2.5 overflow-x-auto rounded-lg border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-left text-[10.5px]">
                                  <thead className="bg-slate-100 text-slate-700 font-bold">
                                    <tr>
                                      {headers.map((h, hIdx) => (
                                        <th key={hIdx} className="px-2.5 py-1.5 border-r last:border-r-0 border-slate-200">
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 bg-white font-mono text-[10px]">
                                    {dataLines.map((dLine, dIdx) => {
                                      const cells = dLine.split('|').map(c => c.trim()).filter(Boolean);
                                      return (
                                        <tr key={dIdx} className="hover:bg-slate-50/60">
                                          {cells.map((cell, cIdx) => (
                                            <td key={cIdx} className="px-2.5 py-1.5 border-r last:border-r-0 border-slate-100">
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

                          // Headers
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

                          // Bullet list
                          if (block.startsWith('- ') || block.startsWith('* ') || block.includes('\n- ') || block.includes('\n* ')) {
                            const items = block.split(/\n[-*] /).filter(Boolean);
                            return (
                              <ul key={idx} className="space-y-1 list-disc list-inside text-slate-700 text-[11px]">
                                {items.map((item, iIdx) => (
                                  <li key={iIdx}>
                                    {item.replace(/^[-*] /, '')}
                                  </li>
                                ))}
                              </ul>
                            );
                          }

                          return (
                            <p key={idx} className="whitespace-pre-wrap text-[11px] leading-relaxed">
                              {block}
                            </p>
                          );
                        })}
                      </div>

                      {/* Audit Log and Copy Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="font-bold text-slate-500">
                          {m.auditTrailId || 'ELFABRIX-LOG'}
                        </span>
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
                              <span>Copy</span>
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
            <div className="flex items-center gap-2 text-slate-500 italic p-2.5 bg-white rounded-xl border border-slate-200/60 w-fit">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#002B6D]" />
              <span className="text-[11px]">ElFabriX is orchestrating sub-agents & processing payload...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Input Form (Bottom of Drawer) */}
        <div className="p-3.5 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              id="elfabrix-drawer-prompt-input"
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={`Instruct ElFabriX [Channel: ${selectedChannel} | Role: ${selectedRole}]...`}
              disabled={isProcessing}
              className="flex-1 bg-slate-50 focus:bg-white border border-slate-300 focus:border-[#002B6D] rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all placeholder:text-slate-400 font-medium"
            />
            <button
              id="elfabrix-drawer-send-btn"
              type="submit"
              disabled={isProcessing || !inputPrompt.trim()}
              className="px-4 py-2.5 bg-[#002B6D] hover:bg-[#002B6D]/90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
};
