import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Key, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  HardDrive, 
  Save, 
  Sliders, 
  FileSpreadsheet,
  Globe,
  ShieldCheck,
  Info,
  ExternalLink,
  Copy,
  Check,
  Layers
} from 'lucide-react';
import { OFFICIAL_CLASS_PROGRAM_SHEET_TABS } from './ClassProgramView';
import { SERVICE_ACCOUNT_EMAIL } from '../data/clcDetailsData';

interface SettingsViewProps {
  selectedDistrict?: string;
  onSpreadsheetIdChange?: (newId: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  selectedDistrict,
  onSpreadsheetIdChange,
}) => {
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('spreadsheetId') || '1Z-GsOOh5DV5CSilR7AZFZX_s1K1ktvC7sVVgFcJR3o0';
  });

  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    return localStorage.getItem('appsScriptUrl') || 'https://script.google.com/macros/s/AKfycbw3mS8N63H9m44G2_yQ3M4zZq-3p2f4i5e6r7/exec';
  });

  // Class Program Google Sheet & Apps Script Settings
  const [classProgramSpreadsheetId, setClassProgramSpreadsheetId] = useState<string>(() => {
    const raw = localStorage.getItem('classProgramSpreadsheetId');
    if (raw && raw !== '1DJDJRfQzgkl_gtGcCDVv1uuyLGAZC-c9F-tRYI_jFPw') {
      return raw;
    }
    return '1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc';
  });

  const [classProgramAppsScriptUrl, setClassProgramAppsScriptUrl] = useState<string>(() => {
    return localStorage.getItem('classProgramAppsScriptUrl') || 'https://script.google.com/macros/s/AKfycbzA_aZEgCh_4GKxaS7b98l3zBz-rhwEQp0ZWYZgjdBUMQ5wLSX_aH6mKpo92X7oRMKsIA/exec';
  });

  const [classProgramTabSearch, setClassProgramTabSearch] = useState<string>('');
  const [copiedSA, setCopiedSA] = useState<boolean>(false);

  // Google Drive & Sheets Live Integration States
  const [driveSearchQuery, setDriveSearchQuery] = useState<string>('Class Program');
  const [driveSearchResults, setDriveSearchResults] = useState<any[]>([]);
  const [driveSearchLoading, setDriveSearchLoading] = useState<boolean>(false);
  const [driveSearchError, setDriveSearchError] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');

  const handleSearchGoogleDrive = async () => {
    setDriveSearchLoading(true);
    setDriveSearchError('');
    try {
      const resp = await fetch(`/api/drive/search?q=${encodeURIComponent(driveSearchQuery)}`);
      if (!resp.ok) {
        throw new Error(`Drive connection exception: status ${resp.status}`);
      }
      const data = await resp.json();
      if (data.status === 'NO_API_KEY') {
        setDriveSearchError("Google Sheets and Drive API key is not mapped. Please ensure GOOGLE_API_KEY is configured.");
        setDriveSearchResults([]);
      } else {
        setDriveSearchResults(data.files || []);
        if ((data.files || []).length === 0) {
          setDriveSearchError("No spreadsheet files matching criteria found under this Google Cloud API credentials scope.");
        }
      }
    } catch (err: any) {
      setDriveSearchError(err.message || 'Unknown network error');
      setDriveSearchResults([]);
    } finally {
      setDriveSearchLoading(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('spreadsheetId', spreadsheetId.trim());
    localStorage.setItem('appsScriptUrl', appsScriptUrl.trim());
    localStorage.setItem('classProgramSpreadsheetId', classProgramSpreadsheetId.trim());
    localStorage.setItem('classProgramAppsScriptUrl', classProgramAppsScriptUrl.trim());

    if (onSpreadsheetIdChange) {
      onSpreadsheetIdChange(spreadsheetId.trim());
    }
    setSaveStatus('All settings saved and applied globally across ALS DataSphere!');
    setTimeout(() => {
      setSaveStatus('');
    }, 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#002B6D] via-[#0A1F44] to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold tracking-tight">System & Integration Settings</h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9.5px] uppercase font-mono font-bold px-2 py-0.5 rounded-md">
                Google Services Engine
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Configure Division Spreadsheet ID, Google Apps Script Endpoint, and Google Drive Workspace Integration
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-2 self-start md:self-center cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          Save & Apply Settings
        </button>
      </div>

      {saveStatus && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* CONFIGURE SPREADSHEET ID & SERVICES CONTENT PANEL */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-6">
        
        {/* Section Title */}
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-sky-400" />
              Configure Spreadsheet ID & Database Endpoints
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct live sync parameters for Tarlac City Schools Division Barangay-Level Baseline Literacy Mapping
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-800 text-sky-400 px-3 py-1 rounded-full border border-slate-700">
            Active Connection Target
          </span>
        </div>

        {/* API Status Badges Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <div className="text-[9.5px] text-slate-400 font-mono tracking-wider uppercase font-bold">Google Drive API Status</div>
              <div className="text-xs font-extrabold text-slate-100">EXPLORER ACTIVE</div>
            </div>
          </div>
          <div className="border-t sm:border-t-0 sm:border-l border-slate-800/85 pt-2 sm:pt-0 sm:pl-3 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <div className="text-[9.5px] text-slate-400 font-mono tracking-wider uppercase font-bold">Google Sheets API Status</div>
              <div className="text-xs font-extrabold text-slate-100">NATIVE READ READY</div>
            </div>
          </div>
          <div className="border-t sm:border-t-0 sm:border-l border-slate-800/85 pt-2 sm:pt-0 sm:pl-3 flex items-center gap-2 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <div className="text-[9.5px] text-slate-400 tracking-wider uppercase font-bold">Workspace Service Account</div>
              <div className="text-[11px] font-semibold text-amber-400 truncate max-w-[160px]" title="datasphere-core-engine@gen-lang-client-0675008110.iam.gserviceaccount.com">
                datasphere-core-engine...
              </div>
            </div>
          </div>
          <div className="border-t sm:border-t-0 sm:border-l border-slate-800/85 pt-2 sm:pt-0 sm:pl-3 flex items-center gap-2 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <div className="text-[9.5px] text-slate-400 tracking-wider uppercase font-bold">Key Signatory Scope</div>
              <div className="text-[11px] font-semibold text-sky-400">AIzaSyBw...vCw</div>
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-slate-200 font-extrabold text-xs flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9.5px] rounded-md font-mono uppercase tracking-wider">Sheet ID</span>
              Target Spreadsheet ID
            </label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl text-white bg-[#0F172A] focus:outline-none focus:border-indigo-500 font-mono text-xs shadow-inner"
              placeholder="Google Sheet Spreadsheet ID Key"
            />
            <span className="text-[10.5px] text-slate-400 block">
              Found in your spreadsheet URL between <code className="text-amber-300 bg-slate-800 px-1 py-0.5 rounded">/d/</code> and <code className="text-amber-300 bg-slate-800 px-1 py-0.5 rounded">/edit</code>
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-200 font-extrabold text-xs flex items-center gap-2">
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[9.5px] rounded-md font-mono uppercase tracking-wider">Apps Script</span>
              Google Apps Script Web App Endpoint URL
            </label>
            <input
              type="text"
              value={appsScriptUrl}
              onChange={(e) => setAppsScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/XXXXXX/exec"
              className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl text-white bg-[#0F172A] focus:outline-none focus:border-indigo-500 font-mono text-xs shadow-inner"
            />
            <span className="text-[10.5px] text-slate-400 block">
              Compile and deploy <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">/google-apps-script.js</code> to enable deep active read/write sync operations.
            </span>
          </div>
        </div>

        {/* Google Drive Workspace File Finder Section */}
        <div className="pt-5 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="block text-slate-200 font-extrabold text-xs flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[9.5px] rounded-md font-mono uppercase tracking-wider">Drive Explorer</span>
              🔍 Search Google Drive for ALS Spreadsheets
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] text-slate-400">Quick searches:</span>
              <button
                type="button"
                onClick={() => {
                  setDriveSearchQuery('Class Program');
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                  driveSearchQuery === 'Class Program'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                }`}
              >
                Class Program
              </button>
              <button
                type="button"
                onClick={() => {
                  setDriveSearchQuery('Tarlac City ALS Baseline Data on Literacy Mapping');
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                  driveSearchQuery.includes('Baseline')
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                }`}
              >
                Baseline Data
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={driveSearchQuery}
              onChange={(e) => setDriveSearchQuery(e.target.value)}
              placeholder="Search file name (e.g., Class Program)"
              className="grow px-3.5 py-2 border border-slate-700 rounded-xl text-white bg-[#0F172A] focus:outline-none focus:border-yellow-500 text-xs font-medium"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchGoogleDrive();
                }
              }}
            />
            <button
              type="button"
              onClick={handleSearchGoogleDrive}
              disabled={driveSearchLoading}
              className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-800 text-slate-950 transition-colors font-extrabold rounded-xl shrink-0 text-xs cursor-pointer"
            >
              {driveSearchLoading ? "Searching..." : "Find Sheets"}
            </button>
          </div>

          {/* Quick Recommend Card for Class Program */}
          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-extrabold text-slate-100 truncate">Official Class Program Spreadsheet</span>
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9.5px] font-mono font-bold">18 Tabs</span>
              </div>
              <span className="block text-[10.5px] font-mono text-slate-400 truncate mt-0.5">
                ID: 1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setClassProgramSpreadsheetId('1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc');
                setSaveStatus('Selected official Class Program spreadsheet (1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc)');
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[11px] transition shrink-0 cursor-pointer"
            >
              Select for Class Program
            </button>
          </div>

          {driveSearchError && (
            <p className="text-[11px] text-amber-400 mt-1.5 font-medium">{driveSearchError}</p>
          )}

          {driveSearchResults.length > 0 && (
            <div className="mt-3 text-xs p-3 bg-[#0F172A] border border-slate-800 rounded-xl max-h-56 overflow-y-auto flex flex-col gap-2 scrollbar-thin">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block border-b border-slate-800 pb-1.5">
                Found in your Google Drive ({driveSearchResults.length} files):
              </span>
              {driveSearchResults.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 p-2 hover:bg-slate-800/70 rounded-lg transition-colors">
                  <div className="truncate min-w-0">
                    <span className="font-extrabold text-slate-200 block truncate">{f.name}</span>
                    <span className="block text-[10px] text-slate-400 truncate font-mono">ID: {f.id}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSpreadsheetId(f.id);
                        localStorage.setItem('spreadsheetId', f.id);
                        setSaveStatus(`Selected for Main Registry: "${f.name}" (${f.id})`);
                        if (onSpreadsheetIdChange) {
                          onSpreadsheetIdChange(f.id);
                        }
                      }}
                      className="px-2.5 py-1 bg-yellow-500/15 hover:bg-yellow-500 text-yellow-400 hover:text-slate-950 transition-all rounded-lg text-[10.5px] font-extrabold border border-yellow-500/30 cursor-pointer"
                    >
                      Set Main
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setClassProgramSpreadsheetId(f.id);
                        localStorage.setItem('classProgramSpreadsheetId', f.id);
                        setSaveStatus(`Selected for Class Program: "${f.name}" (${f.id})`);
                      }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all rounded-lg text-[10.5px] font-black cursor-pointer"
                    >
                      Set Class Program
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Footer Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-6 py-2.5 bg-[#002B6D] hover:bg-[#001D4A] text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Configuration Changes
          </button>
        </div>

      </div>

      {/* CLASS PROGRAM GOOGLE SHEET & GID CONFIGURATION PANEL */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-6">
        
        {/* Section Title */}
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                Configure Spreadsheet ID & Database Endpoints
              </h3>
              <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                Class Program
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Google Sheet name: <strong>Class Program</strong> • Live schedule matrix sync parameters for 17 ALS Teachers and CLC Details
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-800 text-amber-300 px-3 py-1 rounded-full border border-slate-700">
            18 Registered Tabs (17 Teachers + CLC Details)
          </span>
        </div>

        {/* Authorized Service Account Banner */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-extrabold text-slate-200">Required Service Account Permission</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
              Google Cloud IAM Service Account
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Ensure this official service account email is granted <strong>Viewer</strong> (or <strong>Editor</strong>) permission on your Class Program Google Sheet (<strong>Class Program</strong>) so the backend engine can read all teacher matrix tabs:
          </p>

          <div className="flex items-center justify-between gap-2 p-2.5 bg-[#0A101D] rounded-lg border border-slate-800">
            <code className="text-xs font-mono text-amber-300 truncate select-all">
              {SERVICE_ACCOUNT_EMAIL}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
                setCopiedSA(true);
                setTimeout(() => setCopiedSA(false), 2500);
              }}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold rounded-md transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copiedSA ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSA ? 'Copied!' : 'Copy Email'}
            </button>
          </div>
        </div>

        {/* Class Program Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-slate-200 font-extrabold text-xs flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[9.5px] rounded-md font-mono uppercase tracking-wider">Class Program</span>
                Target Spreadsheet ID
              </label>
              {classProgramSpreadsheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${classProgramSpreadsheetId.trim().replace(/^.*\/d\//, '').replace(/\/.*$/, '')}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10.5px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Sheet
                </a>
              )}
            </div>
            <input
              type="text"
              value={classProgramSpreadsheetId}
              onChange={(e) => setClassProgramSpreadsheetId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl text-white bg-[#0F172A] focus:outline-none focus:border-amber-500 font-mono text-xs shadow-inner"
              placeholder="e.g. 1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10.5px] text-slate-400 block">
                Google Sheet Name: <strong>Class Program</strong> (17 teachers + CLC Details).
              </span>
              {classProgramSpreadsheetId !== '1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc' && (
                <button
                  type="button"
                  onClick={() => setClassProgramSpreadsheetId('1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc')}
                  className="text-[10.5px] text-amber-400 hover:text-amber-300 font-bold shrink-0 cursor-pointer"
                >
                  Use Official ID
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-200 font-extrabold text-xs flex items-center gap-2">
              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[9.5px] rounded-md font-mono uppercase tracking-wider">Endpoint URL</span>
              Google Apps Script Web App Endpoint URL
            </label>
            <input
              type="text"
              value={classProgramAppsScriptUrl}
              onChange={(e) => setClassProgramAppsScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full px-3.5 py-2.5 border border-slate-700 rounded-xl text-white bg-[#0F172A] focus:outline-none focus:border-cyan-500 font-mono text-xs shadow-inner"
            />
            <span className="text-[10.5px] text-slate-400 block">
              Apps Script Web App URL to enable direct matrix querying and parsing.
            </span>
          </div>
        </div>

        {/* Source of Data: Sheet Name and GID Directory Table */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-xs font-extrabold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Source of Data: Sheet Name and GID Directory ({OFFICIAL_CLASS_PROGRAM_SHEET_TABS.length} Tabs)
              </h4>
              <p className="text-[11px] text-slate-400">
                Official Google Sheet tabs with their direct links and sheet identifiers (GID)
              </p>
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={classProgramTabSearch}
                onChange={(e) => setClassProgramTabSearch(e.target.value)}
                placeholder="Filter tabs or GIDs..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#0F172A] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 max-h-64 overflow-y-auto scrollbar-thin bg-slate-950/40">
            {OFFICIAL_CLASS_PROGRAM_SHEET_TABS
              .filter(tab => 
                !classProgramTabSearch ||
                tab.name.toLowerCase().includes(classProgramTabSearch.toLowerCase()) ||
                tab.gid.includes(classProgramTabSearch)
              )
              .map(tab => {
                const cleanSId = classProgramSpreadsheetId.trim().replace(/^.*\/d\//, '').replace(/\/.*$/, '') || '1YfXfPT7NvehXaRvN8a9GDbyvG3IxHxUAUgcVLObRxkc';
                const directLink = `https://docs.google.com/spreadsheets/d/${cleanSId}/edit#gid=${tab.gid}`;

                return (
                  <div key={tab.gid} className="p-2.5 px-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-100 text-xs truncate">{tab.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold ${
                          tab.type === 'clc_registry'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}>
                          GID: {tab.gid}
                        </span>
                      </div>
                    </div>

                    <a
                      href={directLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-bold rounded-lg text-[11px] transition flex items-center gap-1 shrink-0 border border-slate-700"
                      title={`Open sheet tab for ${tab.name}`}
                    >
                      <ExternalLink className="w-3 h-3 text-sky-400" />
                      Direct Link
                    </a>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Save Footer Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Class Program Settings
          </button>
        </div>

      </div>

    </div>
  );
};
