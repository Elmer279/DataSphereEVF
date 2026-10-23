/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Download,
  Award,
  Users,
  CheckCircle,
  X,
  PlusCircle,
  HelpCircle,
  Trash2,
  Copy,
  Check,
  Edit3
} from 'lucide-react';
import { LearningCenter } from '../types';
import { safeSetJSON } from '../utils/safeStorage';

export interface LrnRecord {
  recordId: string;
  lrn: string;
  surname: string;
  firstName: string;
  middleName: string;
  birthdate: string;
  age?: number | null;
  gender: 'Male' | 'Female';
  programCompleted: string;
  schoolYear: string;
}

interface LearnerReferenceNumberViewProps {
  learningCenters: LearningCenter[];
}

export function LearnerReferenceNumberView({ learningCenters }: LearnerReferenceNumberViewProps) {
  const [lrnRecords, setLrnRecords] = useState<LrnRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal / Form state for Add/Edit LRN Record
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [formData, setFormData] = useState<Partial<LrnRecord>>({
    recordId: '',
    lrn: '',
    surname: '',
    firstName: '',
    middleName: '',
    birthdate: '',
    gender: 'Male',
    programCompleted: 'Junior High School',
    schoolYear: 'SY 2024-2025'
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch LRN data (using the same /api/passers/fetch endpoint)
  const fetchLrnData = async (forceSync = false) => {
    try {
      if (forceSync) {
        setIsSyncing(true);
      } else {
        setIsLoading(true);
      }

      const res = await fetch(`/api/lrn/fetch?_=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`Server connection issue: Code ${res.status}`);
      }

      const payload = await res.json();
      if (payload.success && Array.isArray(payload.records)) {
        // Map passers records to our specific columns
        const mapped: LrnRecord[] = payload.records.map((rec: any, idx: number) => ({
          recordId: rec.recordId ? `${rec.recordId}-${idx}` : `REC-${Math.floor(100000 + Math.random() * 900000)}-${idx}`,
          lrn: rec.lrn !== undefined && rec.lrn !== null ? String(rec.lrn).trim() : '',
          surname: rec.surname !== undefined && rec.surname !== null ? String(rec.surname).trim() : '',
          firstName: rec.firstName !== undefined && rec.firstName !== null ? String(rec.firstName).trim() : '',
          middleName: rec.middleName !== undefined && rec.middleName !== null ? String(rec.middleName).trim() : '',
          birthdate: rec.birthdate !== undefined && rec.birthdate !== null ? String(rec.birthdate).trim() : '',
          age: rec.age !== null && rec.age !== undefined ? Number(rec.age) : null,
          gender: String(rec.gender || '').trim().toLowerCase().startsWith('f') ? 'Female' : 'Male',
          programCompleted: rec.programCompleted !== undefined && rec.programCompleted !== null ? String(rec.programCompleted).trim() : 'Junior High School',
          schoolYear: rec.schoolYear !== undefined && rec.schoolYear !== null ? String(rec.schoolYear).trim() : 'SY 2024-2025'
        }));

        setLrnRecords(mapped);
        safeSetJSON('cached_lrn_records', mapped);
        
        if (forceSync) {
          showToast(`Successfully synchronized ${mapped.length} records with Google Sheet!`, 'success');
        }
      } else {
        throw new Error(payload.error || 'Failed to read database.');
      }
    } catch (err: any) {
      console.warn("Using local storage fallback for LRN database:", err.message);
      const savedBackup = localStorage.getItem('cached_lrn_records');
      if (savedBackup) {
        try {
          const parsed = JSON.parse(savedBackup);
          if (Array.isArray(parsed)) {
            setLrnRecords(parsed);
          }
        } catch (e) {
          // ignore
        }
      } else {
        // Populate with some clean default seed records
        const seeds: LrnRecord[] = [
          {
            recordId: 'REC-100491',
            lrn: '106123450912',
            surname: 'Dizon',
            firstName: 'Maria Regina',
            middleName: 'Santos',
            birthdate: '2004-05-18',
            gender: 'Female',
            programCompleted: 'Junior High School',
            schoolYear: 'SY 2024-2025'
          },
          {
            recordId: 'REC-100492',
            lrn: '106553210492',
            surname: 'Aquino',
            firstName: 'Emmanuel',
            middleName: 'Dela Cruz',
            birthdate: '2003-09-12',
            gender: 'Male',
            programCompleted: 'Junior High School',
            schoolYear: 'SY 2024-2025'
          },
          {
            recordId: 'REC-100493',
            lrn: '106294810293',
            surname: 'Gonzales',
            firstName: 'Ronalyn',
            middleName: 'Mendoza',
            birthdate: '2005-11-24',
            gender: 'Female',
            programCompleted: 'Elementary',
            schoolYear: 'SY 2023-2024'
          },
          {
            recordId: 'REC-100494',
            lrn: '106338192049',
            surname: 'Pascual',
            firstName: 'John Mark',
            middleName: 'Ramos',
            birthdate: '2002-02-14',
            gender: 'Male',
            programCompleted: 'Basic Literacy',
            schoolYear: 'SY 2024-2025'
          },
          {
            recordId: 'REC-100495',
            lrn: '106492019482',
            surname: 'Dela Cruz',
            firstName: 'Princess Sarah',
            middleName: 'Bernardo',
            birthdate: '2006-07-31',
            gender: 'Female',
            programCompleted: 'Junior High School',
            schoolYear: 'SY 2024-2025'
          }
        ];
        setLrnRecords(seeds);
        safeSetJSON('cached_lrn_records', seeds);
      }
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchLrnData();
  }, []);

  // Helper formula to compute Age from Birthdate
  const calculateAge = (birthdateStr?: string): number => {
    if (!birthdateStr) return 18;
    const birthDate = new Date(birthdateStr);
    if (isNaN(birthDate.getTime())) return 18;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Copy helper
  const handleCopyLrn = (lrn: string) => {
    navigator.clipboard.writeText(lrn);
    setCopiedId(lrn);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Real-time filtering
  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lrnRecords.filter(rec => {
      // Always match gender first
      const matchGender = genderFilter === 'All' || rec.gender === genderFilter;
      if (!matchGender) return false;

      if (!q) return true;

      // Cleaned values
      const surname = rec.surname.toLowerCase();
      const firstName = rec.firstName.toLowerCase();
      const middleName = rec.middleName.toLowerCase();
      const lrn = rec.lrn.toLowerCase();

      // Token-based matching: Split query into words/tokens
      // Remove commas and other punctuation to be extremely forgiving
      const cleanedQuery = q.replace(/,/g, ' ');
      const tokens = cleanedQuery.split(/\s+/).filter(Boolean);

      // Every single token must match at least one field (Surname, First Name, Middle Name, or LRN)
      const allTokensMatch = tokens.every(token => {
        return (
          surname.includes(token) ||
          firstName.includes(token) ||
          middleName.includes(token) ||
          lrn.includes(token)
        );
      });

      return allTokensMatch;
    });
  }, [lrnRecords, searchQuery, genderFilter]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const total = lrnRecords.length;
    const males = lrnRecords.filter(r => r.gender === 'Male').length;
    const females = lrnRecords.filter(r => r.gender === 'Female').length;
    const jhs = lrnRecords.filter(r => r.programCompleted === 'Junior High School').length;
    const elem = lrnRecords.filter(r => r.programCompleted === 'Elementary').length;
    const blp = lrnRecords.filter(r => r.programCompleted === 'Basic Literacy').length;

    return {
      total,
      males,
      females,
      jhs,
      elem,
      blp
    };
  }, [lrnRecords]);

  // Handle open modal for new or editing
  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({
      recordId: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      lrn: '',
      surname: '',
      firstName: '',
      middleName: '',
      birthdate: '',
      gender: 'Male',
      programCompleted: 'Junior High School',
      schoolYear: 'SY 2024-2025'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: LrnRecord) => {
    setModalMode('edit');
    setFormData({ ...rec });
    setIsModalOpen(true);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lrn || formData.lrn.trim().length !== 12 || !/^\d+$/.test(formData.lrn)) {
      alert("A valid 12-digit Learner Reference Number is required!");
      return;
    }
    if (!formData.surname || !formData.firstName) {
      alert("Surname and First Name are required!");
      return;
    }

    const payload: LrnRecord = {
      recordId: formData.recordId || `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      lrn: formData.lrn,
      surname: formData.surname,
      firstName: formData.firstName,
      middleName: formData.middleName || '',
      birthdate: formData.birthdate || '2004-05-18',
      gender: formData.gender as 'Male' | 'Female',
      programCompleted: formData.programCompleted as any,
      schoolYear: formData.schoolYear || 'SY 2024-2025'
    };

    let updatedList: LrnRecord[];
    if (modalMode === 'edit') {
      updatedList = lrnRecords.map(r => r.recordId === payload.recordId ? payload : r);
      showToast(`Successfully updated record for ${payload.firstName} ${payload.surname}.`, 'success');
    } else {
      updatedList = [payload, ...lrnRecords];
      showToast(`Successfully registered new LRN record for ${payload.firstName} ${payload.surname}.`, 'success');
    }

    setLrnRecords(updatedList);
    safeSetJSON('cached_lrn_records', updatedList);
    setIsModalOpen(false);

    // Sync with backend API
    try {
      setIsSyncing(true);
      const syncRes = await fetch('/api/lrn/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await syncRes.json();
      if (resData.success) {
        showToast(`Record synced seamlessly with Google Sheets!`, 'success');
      }
    } catch (err) {
      console.warn("Failed syncing new LRN to sheet:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteRecord = async (recordId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the LRN registry entry for ${name}?`)) {
      return;
    }

    const updatedList = lrnRecords.filter(r => r.recordId !== recordId);
    setLrnRecords(updatedList);
    safeSetJSON('cached_lrn_records', updatedList);
    showToast(`Removed entry for ${name}.`, 'info');
  };

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert("No matching records to export.");
      return;
    }

    const headers = ["Learner Reference Number", "Surname", "First Name", "Middle Name", "Birthdate", "Age", "Gender", "Program Enrolled"];
    const rows = filteredRecords.map(r => [
      `"${r.lrn}"`,
      `"${r.surname}"`,
      `"${r.firstName}"`,
      `"${r.middleName}"`,
      `"${r.birthdate}"`,
      `"${calculateAge(r.birthdate)}"`,
      `"${r.gender}"`,
      `"${r.programCompleted}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `TCSD_ALS_LRN_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("LRN Directory successfully exported to CSV.", "success");
  };

  return (
    <div className="w-full flex flex-col gap-6 select-none font-sans" id="tcsd-lrn-registry-container">
      {/* Upper Action Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-[#E3EDFA] text-[#002B6D] text-[10px] font-black tracking-widest rounded-full uppercase border border-[#002B6D]/10 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Tarlac City LRN Registry Hub
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight mt-1.5 flex items-center gap-2">
            Learner Reference Number (LRN) Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl mt-1">
            Browse and manage unique Learner Reference Numbers (LRN) for active learners. This registry calculates learner ages, maps enrollments, and integrates with the Google Sheet Passer database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchLrnData(true)}
            disabled={isSyncing}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#002B6D] ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Sheet'}
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50/60 border border-emerald-200 rounded-xl hover:bg-emerald-100/80 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-black text-white bg-[#002B6D] rounded-xl hover:bg-[#001D4A] transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Register LRN Record
          </button>
        </div>
      </div>

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className={`p-3 rounded-xl border flex items-center gap-2.5 animate-flash ${
          toastMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          toastMessage.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold tracking-tight">{toastMessage.text}</span>
        </div>
      )}

      {/* Analytics widgets row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl flex items-center gap-4 shadow-3xs">
          <div className="w-11 h-11 bg-indigo-50 text-[#002B6D] rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Learners Registered</p>
            <p className="text-xl font-black text-slate-800 tracking-tight mt-0.5">{metrics.total}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl flex items-center gap-4 shadow-3xs">
          <div className="w-11 h-11 bg-pink-50 text-pink-700 rounded-xl flex items-center justify-center shrink-0">
            <Award className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Junior High School</p>
            <p className="text-xl font-black text-slate-800 tracking-tight mt-0.5">{metrics.jhs} <span className="text-xs text-slate-400 font-medium">({metrics.total > 0 ? Math.round((metrics.jhs / metrics.total) * 100) : 0}%)</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl flex items-center gap-4 shadow-3xs">
          <div className="w-11 h-11 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center shrink-0">
            <Award className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Elementary & BLP</p>
            <p className="text-xl font-black text-slate-800 tracking-tight mt-0.5">{metrics.elem + metrics.blp} <span className="text-xs text-slate-400 font-medium">({metrics.total > 0 ? Math.round(((metrics.elem + metrics.blp) / metrics.total) * 100) : 0}%)</span></p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl flex items-center gap-4 shadow-3xs">
          <div className="w-11 h-11 bg-teal-50 text-teal-700 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gender Demographics</p>
            <p className="text-sm font-extrabold text-slate-700 tracking-tight mt-1">
              F: <span className="text-slate-900">{metrics.females}</span> | M: <span className="text-slate-900">{metrics.males}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Directory Filters & Table Panel */}
      <div className="bg-white border border-slate-200/85 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        
        {/* Filter Toolbar */}
        <div className="p-4.5 border-b border-slate-150 flex flex-col sm:flex-row gap-3.5 bg-slate-50/50 justify-between items-center">
          <div className="flex w-full sm:max-w-md items-center gap-2">
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Surname, First Name..."
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  setSearchQuery(val); // Triggers robust instant real-time search
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchInput);
                  }
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#002B6D]/50 focus:border-[#002B6D] transition placeholder-slate-400 text-slate-800"
              />
            </div>
            <button
              onClick={() => setSearchQuery(searchInput)}
              className="px-4 py-2 text-xs font-black text-white bg-[#002B6D] rounded-xl hover:bg-[#001D4A] transition shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Gender:</span>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="All">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
        </div>

        {/* The Core Requested Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[#002B6D] font-mono text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3.5 px-4.5">Learner Reference Number</th>
                <th className="py-3.5 px-4.5">Surname</th>
                <th className="py-3.5 px-4.5">First Name</th>
                <th className="py-3.5 px-4.5">Middle Name</th>
                <th className="py-3.5 px-4.5">Birthdate</th>
                <th className="py-3.5 px-4.5 text-center">Age</th>
                <th className="py-3.5 px-4.5 text-center">Gender</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-slate-300" />
                    <p className="text-xs text-slate-400 font-bold mt-2.5">Fetching LRN database from Google Sheet...</p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold">No learner LRN records correspond with the specified criteria.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Try resetting search string or filtering criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => {
                  const calculatedAgeValue = rec.age !== null && rec.age !== undefined ? rec.age : calculateAge(rec.birthdate);
                  return (
                    <tr key={`lrn-rec-${rec.recordId || 'rec'}-${rec.lrn || ''}-${idx}`} className="hover:bg-slate-50/40 transition-colors text-xs text-slate-700">
                      
                      {/* Learner Reference Number */}
                      <td className="py-3 px-4.5 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono tracking-[1.5px] font-bold text-slate-900 select-all">{rec.lrn}</span>
                          <button
                            onClick={() => handleCopyLrn(rec.lrn)}
                            title="Copy LRN to Clipboard"
                            className="p-1 text-slate-400 hover:text-[#002B6D] hover:bg-slate-100 rounded-md transition cursor-pointer"
                          >
                            {copiedId === rec.lrn ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Surname */}
                      <td className="py-3 px-4.5 font-bold text-slate-800 uppercase">{rec.surname}</td>

                      {/* First Name */}
                      <td className="py-3 px-4.5 font-semibold text-slate-700">{rec.firstName}</td>

                      {/* Middle Name */}
                      <td className="py-3 px-4.5 text-slate-500 italic">{rec.middleName || '—'}</td>

                      {/* Birthdate */}
                      <td className="py-3 px-4.5 font-mono text-slate-650">{rec.birthdate || '—'}</td>

                      {/* Age */}
                      <td className="py-3 px-4.5 text-center font-mono font-bold text-slate-800">{calculatedAgeValue}</td>

                      {/* Gender */}
                      <td className="py-3 px-4.5 text-center">
                        <span className={`inline-flex px-2.5 py-0.75 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                          rec.gender === 'Female' 
                            ? 'bg-pink-50 text-pink-700 border border-pink-100/60'
                            : 'bg-blue-50 text-blue-700 border border-blue-100/60'
                        }`}>
                          {rec.gender}
                        </span>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary Count */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400 font-bold tracking-tight flex items-center justify-between">
          <span>Showing {filteredRecords.length} of {lrnRecords.length} registered learners</span>
          <span>Alternative Learning System operations Division Registry v1.2</span>
        </div>
      </div>

      {/* Elegant Drawer / Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-150 animate-slideUp">
            
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-[#002B6D]" />
                {modalMode === 'edit' ? 'Edit LRN Record' : 'Register New LRN Record'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-5.5 space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-extrabold text-slate-500 tracking-wider block">Learner Reference Number (LRN)</label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="E.g., 106123450912 (12-digit number)"
                  value={formData.lrn || ''}
                  onChange={(e) => setFormData({ ...formData, lrn: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#002B6D]/50 focus:border-[#002B6D] text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-extrabold text-slate-500 tracking-wider block">Surname</label>
                  <input
                    type="text"
                    placeholder="Surname"
                    value={formData.surname || ''}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#002B6D]/50 focus:border-[#002B6D] text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-extrabold text-slate-500 tracking-wider block">First Name</label>
                  <input
                    type="text"
                    placeholder="First name"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#002B6D]/50 focus:border-[#002B6D] text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-extrabold text-slate-500 tracking-wider block">Middle Name</label>
                  <input
                    type="text"
                    placeholder="Middle Name (Optional)"
                    value={formData.middleName || ''}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#002B6D]/50 focus:border-[#002B6D] text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-extrabold text-slate-500 tracking-wider block">Birthdate</label>
                  <input
                    type="date"
                    value={formData.birthdate || ''}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#002B6D]/50 focus:border-[#002B6D] text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-extrabold text-slate-500 tracking-wider block">Gender</label>
                  <select
                    value={formData.gender || 'Male'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#002B6D]/50 focus:border-[#002B6D]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-extrabold text-slate-500 tracking-wider block">Program Enrolled</label>
                  <select
                    value={formData.programCompleted || 'Junior High School'}
                    onChange={(e) => setFormData({ ...formData, programCompleted: e.target.value as any })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#002B6D]/50 focus:border-[#002B6D]"
                  >
                    <option value="Junior High School">Junior High School</option>
                    <option value="Elementary">Elementary</option>
                    <option value="Basic Literacy">Basic Literacy</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black text-white bg-[#002B6D] hover:bg-[#001D4A] rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
