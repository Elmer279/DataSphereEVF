/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, Save, Sparkles, Check, HelpCircle, FileSpreadsheet } from 'lucide-react';
import { ChatMessage, formatDistrictName } from '../types';

const APPS_SCRIPT_PREVIEW = `/**
 * Google Apps Script for Literacy Mapping
 * Paste inside Extensions > Apps Script
 */
function doGet(e) {
  const params = e.parameter || {};
  const requestedTab = params.tab;
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  const allRecords = [];
  
  for (let s of sheets) {
    const sheetName = s.getName();
    if (sheetName.toLowerCase().startsWith("sheet")) continue;
    if (requestedTab && sheetName.toLowerCase() !== requestedTab.toLowerCase()) continue;
    const sheetData = s.getDataRange().getValues();
    if (sheetData.length < 2) continue;
    const headers = sheetData[0].map(h => String(h).trim().toLowerCase());
    
    // Auto map columns ...
    const fields = {
      recordNumber: headers.indexOf("record number"),
      lastName: headers.indexOf("last name"),
      firstName: headers.indexOf("first name"),
      middleName: headers.indexOf("middle name"),
      gender: headers.indexOf("gender"),
      dateOfBirth: headers.indexOf("date of birth"),
      age: headers.indexOf("age")
    };
    // Fetch full code via Download Button below
  }
}`;

interface AdminHubViewProps {
  selectedDistrict: string;
}

export function AdminHubView({ selectedDistrict }: AdminHubViewProps) {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'chat-init',
      sender: 'assistant',
      text: `Hello! I am your TCSD ALS DataSphere Operations Assistant. I am specialized in the Philippine Department of Education's Alternative Learning System curriculum and classroom strategies.
      
How can I assist you with lesson guides, adult motivation strategies, or regional CLC management today?`,
      timestamp: 'Just now'
    }
  ]);
  const [userInput, setUserInput] = useState<string>('');
  const [sendingChat, setSendingChat] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Configuration settings state
  const [divisionName, setDivisionName] = useState<string>('Tarlac City Schools Division');
  const [schoolYear, setSchoolYear] = useState<string>('2025 - 2026');
  const [primaryLanguage, setPrimaryLanguage] = useState<string>('Tagalog / English / Kapampangan');
  const [curriculumStandard, setCurriculumStandard] = useState<string>('DepEd K-12 ALS curriculum matrix');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle chat messaging
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || sendingChat) return;

    const userText = userInput.trim();
    const newUserMsg: ChatMessage = {
      id: `chat-usr-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setUserInput('');
    setSendingChat(true);

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are the TCSD ALS DataSphere AI Assistant. You are advising an ALS mobile teacher.
          User question: "${userText}"
          Selected current regional district: "${formatDistrictName(selectedDistrict)}"
          Core guidelines:
          - Provide highly active, practical, localized Filipino educational tips.
          - Speak with warm, supportive, and extremely knowledgeable pedagogical leadership.
          - Structure with high readability, incorporating clear numbered steps where helpful. Keep it concise but thoroughly functional.`,
          context: 'TCSD ALS chatbot assistant context'
        })
      });

      if (!response.ok) throw new Error('Model offline');
      const data = await response.json();

      const newBotMsg: ChatMessage = {
        id: `chat-bot-${Date.now()}`,
        sender: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newBotMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `chat-err-${Date.now()}`,
        sender: 'assistant',
        text: "Tarlac Division Network Outpost Offline. Verify your Gemini secret API keys on AI Studio. Pedagogical suggestion: If your out-of-school youth are working day shifts, consider providing offline self-learning packets coupled with weekly localized support checklists.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSendingChat(false);
    }
  };

  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* ALS Operations Assistant Panel (Col span 2) */}
      <div className="xl:col-span-2 bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs flex flex-col h-[520px]">
        
        {/* Chat Header */}
        <div className="bg-[#002B6D] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1 px-2.5 bg-sky-500 rounded-lg text-white font-black text-xs font-mono flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" /> ALStein
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">ALS Operations Assistant</h3>
              <p className="text-[10px] text-sky-200">Department of Education • Alternative Learning System</p>
            </div>
          </div>
          <p className="text-[10px] text-sky-200 bg-white/10 px-2 py-0.5 rounded-full font-mono">
            District Focus: {formatDistrictName(selectedDistrict)}
          </p>
        </div>

        {/* Messages Stage */}
        <div className="grow p-5 overflow-y-auto space-y-4 bg-slate-50 flex flex-col h-full scrollbar-thin">
          {messages.map((msg) => {
            const isBot = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isBot ? 'self-start' : 'self-end flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm font-bold text-xs ${
                  isBot ? 'bg-[#002B6D] text-[#38bdf8]' : 'bg-slate-200 text-slate-800'
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className="space-y-1">
                  <div className={`rounded-2xl p-3.5 text-xs font-sans leading-relaxed shadow-xs text-left ${
                    isBot
                      ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-none whitespace-pre-line'
                      : 'bg-indigo-650 text-white bg-[#002B6D] rounded-tr-none whitespace-pre-line'
                  }`}>
                    {msg.text}
                  </div>
                  
                  <p className="text-[9px] text-slate-400 font-mono text-center sm:text-right px-1">
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {sendingChat && (
            <div className="flex gap-3 max-w-[85%] self-start animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[#002B6D] text-sky-300 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3 px-4 flex items-center gap-1.5 shadow-xs">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          <div ref={scrollRef}></div>
        </div>

        {/* Chat Sender Form */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input
            type="text"
            required
            placeholder="Ask AI lesson plans, modular ideas, tricycle student schedules..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={sendingChat}
            className="grow px-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-slate-50 focus:outline-none focus:border-indigo-500 font-sans disabled:opacity-65"
          />
          <button
            type="submit"
            disabled={sendingChat || !userInput.trim()}
            className="bg-[#002B6D] hover:bg-[#00255c] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </form>

      </div>

      {/* Admin Settings Panel (Col span 1) */}
      <div className="space-y-4">
        
        {/* Helpful links card */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
            <Heart className="w-4.5 h-4.5 text-amber-600 shrink-0" />
            DepEd ALS Mobile Guidelines
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed font-sans">
            Alternative Learning System mobile teaching requires frequent local tracking. Ensure all physical learner workbook logs are synchronized with the online DataSphere portal at least once per fiscal semester term.
          </p>
        </div>

      </div>

    </div>
  );
}

// Simple export helper since Heart is imported locally
function Heart(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
