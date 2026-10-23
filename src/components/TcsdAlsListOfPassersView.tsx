/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Download,
  CheckCircle,
  X,
  Building,
  Calendar,
  Layers,
  Briefcase,
  User,
  Hash,
  AlertCircle,
  RefreshCw,
  Award,
  ChevronRight,
  Database,
  PrinterCheck,
  FileSpreadsheet,
  PlusCircle,
  ArrowLeft,
  Check,
  Cloud
} from 'lucide-react';
import { LearningCenter } from '../types';
import { safeSetJSON } from '../utils/safeStorage';

export interface PasserDetailedRecord {
  recordId: string; // 1
  barcode: string; // 2
  completeName: string; // 3: COMPLETE NAME (Last Name, First Name, Middle Name, Ext in Alphabetical Order)
  surname: string; // 4
  firstName: string; // 5
  middleName: string; // 6
  middleInitial: string; // 7
  birthdate: string; // 8
  gender: 'Male' | 'Female'; // 9
  lrn: string; // 10
  curriculum: string; // 11
  programCompleted: string; // 12
  schoolYear: string; // 13
  typeOfAssessment: string; // 14
  portfolioCertificateNumber: string; // 15
  placeOfAssessment: string; // 16
  dateOfAssessment: string; // 17
  communityLearningCenter: string; // 18
  division: string; // 19
  unit: string; // 20
  region: string; // 21
  remarks: string; // 22
  verifiedBy: string; // 23
  dateVerified: string; // 24
  // Backward compatibility fields if present
  requestedDocument?: string;
  purposeOfRequest?: string;
  dateRequested?: string;
  issuedTo?: string;
  dateAccomplished?: string;
  documentControlNo?: string;
}

interface TcsdAlsListOfPassersViewProps {
  learningCenters: LearningCenter[];
}

export function TcsdAlsListOfPassersView({ learningCenters }: TcsdAlsListOfPassersViewProps) {
  // Main local database loading state
  const [passerList, setPasserList] = useState<PasserDetailedRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Search input and auto-match status
  const [searchSurname, setSearchSurname] = useState<string>('');
  const [searchFirstName, setSearchFirstName] = useState<string>('');
  const [searchMiddleName, setSearchMiddleName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Form states matching exactly the 24 schema properties requested by user
  const [formData, setFormData] = useState<Partial<PasserDetailedRecord>>({
    recordId: 'REC-100492',
    barcode: 'PC1002391092',
    completeName: 'Dizon, Maria Regina, Santos',
    surname: 'Dizon',
    firstName: 'Maria Regina',
    middleName: 'Santos',
    middleInitial: 'S',
    birthdate: '2004-05-18',
    gender: 'Female',
    lrn: '106123450912',
    curriculum: 'ALS K-to-12 Basic Education Curriculum',
    programCompleted: 'Junior High School',
    schoolYear: 'SY 2024-2025',
    typeOfAssessment: 'Presentation Portfolio Assessment (PPA-5)',
    portfolioCertificateNumber: 'PPA-2025-RC3-1002',
    placeOfAssessment: 'Tarlac City Schools Division Hub',
    dateOfAssessment: '2025-04-12',
    communityLearningCenter: 'Tibag CLC Hub',
    division: 'Tarlac City Schools Division',
    unit: 'Curriculum Implementation Division (CID) - ALS',
    region: 'Region III - Central Luzon',
    remarks: 'PASSED - Qualified for Senior High School enrolment.',
    verifiedBy: 'Elmer V. Fabros, EPS II - ALS',
    dateVerified: new Date().toISOString().split('T')[0]
  });

  // Current subview: 'form' is the main core layout, or 'print' for specialized print slip
  const [viewMode, setViewMode] = useState<'form' | 'print'>('form');

  // Load database from endpoint
  const fetchPassersData = async (forceSync = false) => {
    try {
      if (forceSync) {
        setIsSyncing(true);
      } else {
        setIsLoading(true);
      }
      setFetchError(null);

      const res = await fetch(`/api/passers/fetch?_=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`Koneksyon sa server issue: Code ${res.status}`);
      }
      
      const payload = await res.json();
      if (payload.success && Array.isArray(payload.records)) {
        setPasserList(payload.records);
        // Save to local storage for quick fallback
        safeSetJSON('cached_passers_database_sheet', payload.records);
        
        if (payload.records.length > 0 && !forceSync) {
          // prefill first search query with a default
          setFormData(payload.records[0]);
        }
        
        if (forceSync) {
          showToast(`Salamat! Matagumpay na na-sync ang ${payload.records.length} passer records mula sa Google Sheet.`, 'success');
        }
      } else {
        throw new Error(payload.error || 'Nabigong basahin ang database format.');
      }
    } catch (err: any) {
      console.warn("Using offline localStorage fallback due to Sheets API fetch error:", err.message);
      const savedBackup = localStorage.getItem('cached_passers_database_sheet');
      if (savedBackup) {
        try {
          const parsed = JSON.parse(savedBackup);
          if (Array.isArray(parsed)) {
            setPasserList(parsed);
            if (parsed.length > 0) {
              setFormData(parsed[0]);
            }
          } else {
            console.warn("Parsed passers database is not an array, skipping");
          }
          if (forceSync) {
            showToast("Nagkaroon ng aberya sa live sheet. Ginamit ang pinakahuling naka-cache na records.", 'info');
          }
        } catch (e) {
          setFetchError(err.message || 'Error occurred handling sheet database fetch.');
        }
      } else {
        setFetchError(`Hindi makuha ang Google Sheet data: ${err.message}. Pakisuri ang koneksyon ng database.`);
      }
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Run initial fetch on mount and setup auto-sync interval
  useEffect(() => {
    fetchPassersData();

    // Automatically synchronize frontend with backend Google Sheet every 30 seconds
    const syncInterval = setInterval(() => {
      fetchPassersData(false);
    }, 30000);

    return () => clearInterval(syncInterval);
  }, []);

  // Show status feedback
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setSyncMessage({ text, type });
    setTimeout(() => {
      setSyncMessage(null);
    }, 4500);
  };

  // Smart split query: parses "Surname, First Name, Middle Name" formats
  const parsedSearchParams = useMemo(() => {
    if (!searchQuery.trim()) return { surname: '', firstName: '', middleName: '' };
    const parts = searchQuery.split(',').map(s => s.trim().toLowerCase());
    return {
      surname: parts[0] || '',
      firstName: parts[1] || '',
      middleName: parts[2] || ''
    };
  }, [searchQuery]);

  // Filters results in real-time matching surname search, first name search, middle name search, or comma-separated query
  const searchSuggestions = useMemo(() => {
    const sTerm = searchSurname.trim().toLowerCase();
    const fTerm = searchFirstName.trim().toLowerCase();
    const mTerm = searchMiddleName.trim().toLowerCase();
    const { surname: qSurname, firstName: qFirstName, middleName: qMiddleName } = parsedSearchParams;

    const surnameFilter = sTerm || qSurname;
    const firstNameFilter = fTerm || qFirstName;
    const middleNameFilter = mTerm || qMiddleName;

    if (!surnameFilter && !firstNameFilter && !middleNameFilter && !searchQuery.trim() && !sTerm && !fTerm && !mTerm) return [];

    return passerList.filter(rec => {
      const recSurname = (rec.surname || '').toLowerCase();
      const recFirstName = (rec.firstName || '').toLowerCase();
      const recMiddleName = (rec.middleName || '').toLowerCase();
      const recCompleteName = (rec.completeName || '').toLowerCase();

      const matchesSurname = !surnameFilter || recSurname.includes(surnameFilter) || recCompleteName.includes(surnameFilter);
      const matchesFirstName = !firstNameFilter || recFirstName.includes(firstNameFilter) || recCompleteName.includes(firstNameFilter);
      const matchesMiddleName = !middleNameFilter || recMiddleName.includes(middleNameFilter) || recCompleteName.includes(middleNameFilter);

      return matchesSurname && matchesFirstName && matchesMiddleName;
    }).slice(0, 15);
  }, [passerList, searchSurname, searchFirstName, searchMiddleName, parsedSearchParams, searchQuery]);

  // Fill all 28 form properties upon choosing a matched record
  const handleSelectRecord = (record: PasserDetailedRecord) => {
    setFormData({ ...record });
    setShowSuggestions(false);
    showToast(`Pinunan ang form para kay ${record.firstName} ${record.surname}!`, 'success');
  };

  // Clean form state to permit manual record input (Fields 1 to 24)
  const handleClearForm = () => {
    setFormData({
      recordId: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      barcode: `BC${Date.now().toString().slice(-10)}`,
      completeName: '',
      surname: '',
      firstName: '',
      middleName: '',
      middleInitial: '',
      birthdate: '',
      gender: 'Male',
      lrn: '',
      curriculum: 'ALS K-to-12 Basic Education Curriculum',
      programCompleted: 'Junior High School',
      schoolYear: 'SY 2024-2025',
      typeOfAssessment: 'Accreditation & Equivalency Portfolio Assessment',
      portfolioCertificateNumber: '',
      placeOfAssessment: 'Tarlac City Schools Division Hub',
      dateOfAssessment: new Date().toISOString().split('T')[0],
      communityLearningCenter: learningCenters[0]?.name || 'Tibag CLC Hub',
      division: 'Tarlac City Schools Division',
      unit: 'Curriculum Implementation Division (CID) - ALS',
      region: 'Region III - Central Luzon',
      remarks: 'PASSED - Satisfied all criteria.',
      verifiedBy: 'Elmer V. Fabros, EPS II - ALS',
      dateVerified: new Date().toISOString().split('T')[0]
    });
    setSearchSurname('');
    setSearchFirstName('');
    setSearchQuery('');
    showToast("Nalinis na ang form. Maaari nang mag-input ng bagong record.", 'info');
  };

  // Save changes locally to current state
  const handleUpdateRecord = (e?: React.FormEvent): PasserDetailedRecord | null => {
    if (e) e.preventDefault();

    if (!formData.surname && !formData.completeName) {
      alert("Pakiusap, paki-suri ang surname (Apelyido) o Complete Name!");
      return null;
    }

    const computedCompleteName = formData.completeName || 
      [formData.surname, formData.firstName, formData.middleName].filter(Boolean).join(', ');

    const payload: PasserDetailedRecord = {
      recordId: formData.recordId || `REC-MAN-${Date.now()}`,
      barcode: formData.barcode || `BAR-${Date.now()}`,
      completeName: computedCompleteName,
      surname: formData.surname || '',
      firstName: formData.firstName || '',
      middleName: formData.middleName || '',
      middleInitial: formData.middleInitial || (formData.middleName ? formData.middleName.charAt(0).toUpperCase() : ''),
      birthdate: formData.birthdate || '',
      gender: (formData.gender as 'Male' | 'Female') || 'Male',
      lrn: formData.lrn || '',
      curriculum: formData.curriculum || 'ALS K-to-12 Basic Education Curriculum',
      programCompleted: (formData.programCompleted as any) || 'Junior High School',
      schoolYear: formData.schoolYear || 'SY 2024-2025',
      typeOfAssessment: formData.typeOfAssessment || 'Accreditation & Equivalency Portfolio Assessment',
      portfolioCertificateNumber: formData.portfolioCertificateNumber || 'N/A',
      placeOfAssessment: formData.placeOfAssessment || 'Tarlac City',
      dateOfAssessment: formData.dateOfAssessment || '',
      communityLearningCenter: formData.communityLearningCenter || 'Tarlac City',
      division: formData.division || 'Tarlac City Schools Division',
      unit: formData.unit || 'Curriculum Implementation Division (CID) - ALS',
      region: formData.region || 'Region III - Central Luzon',
      remarks: formData.remarks || 'PASSED',
      verifiedBy: formData.verifiedBy || 'Elmer V. Fabros, EPS II - ALS',
      dateVerified: formData.dateVerified || new Date().toISOString().split('T')[0]
    };

    const existsIdx = passerList.findIndex(p => p.recordId === payload.recordId || (p.surname && payload.surname && p.surname.toLowerCase() === payload.surname.toLowerCase() && p.firstName && payload.firstName && p.firstName.toLowerCase() === payload.firstName.toLowerCase()));

    let updatedList: PasserDetailedRecord[];
    if (existsIdx !== -1) {
      updatedList = [...passerList];
      updatedList[existsIdx] = payload;
      showToast(`Matagumpay na na-update ang record para kay ${payload.completeName || payload.surname}!`, 'success');
    } else {
      updatedList = [payload, ...passerList];
      showToast(`Matagumpay na naidagdag ang bagong record para kay ${payload.completeName || payload.surname}!`, 'success');
    }

    setPasserList(updatedList);
    safeSetJSON('cached_passers_database_sheet', updatedList);
    return payload;
  };

  // Synchronize & Save directly to Google Sheet
  const handleSyncAndSaveToGoogleSheet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const payload = handleUpdateRecord();
    if (!payload) return;

    try {
      setIsSyncing(true);
      const syncRes = await fetch('/api/passers/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const resData = await syncRes.json();
      if (resData.success) {
        if (resData.simulated) {
          showToast(`Nai-save sa cache. Google Sheet: ${resData.error}`, 'info');
        } else {
          showToast(`Matagumpay na nai-sync at na-save si ${payload.completeName || payload.surname} sa Google Sheet!`, 'success');
          // Refresh list from Google Sheet to ensure complete synchronization
          await fetchPassersData(true);
        }
      } else {
        throw new Error(resData.error || "Nabigong i-save sa Google Sheet.");
      }
    } catch (err: any) {
      console.error("Failed to sync updated passer with Google Sheet:", err);
      showToast(`Nai-save sa cache, ngunit nagkaroon ng error sa Google Sheet: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFormSave = (e: React.FormEvent) => {
    handleSyncAndSaveToGoogleSheet(e);
  };

  // Export as CSV
  const handleExportCSV = () => {
    if (passerList.length === 0) {
      alert("Walang sapat na record upang i-export!");
      return;
    }

    const headers = [
      "Record ID", "QR Code", "COMPLETE NAME (Last Name, First Name, Middle Name, Ext in Alphabetical Order)",
      "Surname", "First Name", "Middle Name", "Middle Initial", "Birthdate", "Gender", 
      "Learner Reference Number", "Curriculum", "Program Completed", "School Year", "Type of Assessment", 
      "Portfolio Certificate Number", "Place of Assessment", "Date of Assessment", "Community Learning Center", 
      "Division", "Unit", "Region", "Remarks", "Verified by", "Date Verified"
    ];

    const csvRows = [
      headers.join(','),
      ...passerList.map(p => {
        const cName = p.completeName || [p.surname, p.firstName, p.middleName].filter(Boolean).join(', ');
        return [
          `"${p.recordId}"`,
          `"${p.barcode}"`,
          `"${cName}"`,
          `"${p.surname}"`,
          `"${p.firstName}"`,
          `"${p.middleName || ''}"`,
          `"${p.middleInitial || ''}"`,
          `"${p.birthdate || ''}"`,
          `"${p.gender}"`,
          `"${p.lrn}"`,
          `"${p.curriculum}"`,
          `"${p.programCompleted}"`,
          `"${p.schoolYear}"`,
          `"${p.typeOfAssessment || ''}"`,
          `"${p.portfolioCertificateNumber || ''}"`,
          `"${p.placeOfAssessment || ''}"`,
          `"${p.dateOfAssessment || ''}"`,
          `"${p.communityLearningCenter || ''}"`,
          `"${p.division || ''}"`,
          `"${p.unit || ''}"`,
          `"${p.region || ''}"`,
          `"${p.remarks || ''}"`,
          `"${p.verifiedBy || ''}"`,
          `"${p.dateVerified || ''}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `TCSD_ALS_Passers_Registry_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Na-download ang buong report database bilang CSV format.", 'success');
  };

  // Helper parsing of school year to accommodate double inputs (SY 2024 - 2025 style)
  const schoolYearParts = useMemo(() => {
    const raw = formData.schoolYear || '';
    const match = raw.match(/(\d{4})[-/](\d{4})/);
    return {
      from: match ? match[1] : '2024',
      to: match ? match[2] : '2025'
    };
  }, [formData.schoolYear]);

  const updateSchoolYear = (field: 'from' | 'to', val: string) => {
    const fromVal = field === 'from' ? val : schoolYearParts.from;
    const toVal = field === 'to' ? val : schoolYearParts.to;
    setFormData(prev => ({
      ...prev,
      schoolYear: `SY ${fromVal}-${toVal}`
    }));
  };

  // Trigger system physical print on user action
  const handlePrintSlip = () => {
    const originalMode = viewMode;
    setViewMode('print');
    setTimeout(() => {
      window.print();
      setViewMode(originalMode);
    }, 400);
  };

  // Custom official Laurel logo wrapper inside HTML
  const OfficialSealLogo = () => (
    <div className="w-18 h-18 flex items-center justify-center">
      <img 
        src="https://lh3.googleusercontent.com/d/16PpvyVKWmD0yRY2dYB4KJb_O4XYNScqc" 
        alt="Official Logo" 
        className="w-16 h-16 object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );

  // QR Code visualization using robust web API
  const QRCodeVisual = ({ code, size = 64 }: { code: string; size?: number }) => {
    const [qrUrl, setQrUrl] = useState<string>('');

    useEffect(() => {
      const codeVal = code || 'PC1002391092';
      // Use clean, standard, reliable API-based QR generator
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&color=002b6d&data=${encodeURIComponent(codeVal)}`);
    }, [code, size]);

    return (
      <div className="flex flex-col items-center">
        <div className="bg-white p-1 border border-slate-300 rounded-md flex items-center justify-center">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt={`QR Code: ${code}`}
              style={{ width: `${size}px`, height: `${size}px` }}
              className="rendering-pixelated"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div style={{ width: `${size}px`, height: `${size}px` }} className="bg-slate-100 animate-pulse rounded-xs" />
          )}
        </div>
        <span className="text-[8px] font-mono tracking-[1px] text-slate-800 font-bold uppercase mt-1.5">{code || 'PC1002391092'}</span>
      </div>
    );
  };

  // Determine which options are active for assessment type checkboxes
  const rawAssessmentType = formData.typeOfAssessment || '';
  const isAssessmentFormal = rawAssessmentType.toLowerCase().includes('test') || rawAssessmentType.toLowerCase().includes('formal');
  const isAssessmentPortfolio = rawAssessmentType.toLowerCase().includes('portfolio') || rawAssessmentType.toLowerCase().includes('tesda');

  // Determine which options are active for requested document checkboxes
  const rawRequestedDocument = formData.requestedDocument || '';
  const isDocTranscript = rawRequestedDocument.toLowerCase().includes('transcript') || rawRequestedDocument.toLowerCase().includes('af5') || rawRequestedDocument.toLowerCase().includes('permanent');
  const isDocPasser = rawRequestedDocument.toLowerCase().includes('passer');
  const isDocGoodMoral = rawRequestedDocument.toLowerCase().includes('good moral') || (rawRequestedDocument.toLowerCase().includes('moral') && !isDocPasser);
  
  const splitDocs = rawRequestedDocument.split(',').map(s => s.trim()).filter(Boolean);
  const isDocOther = splitDocs.some(d => {
    const l = d.toLowerCase();
    return !l.includes('transcript') && !l.includes('af5') && !l.includes('permanent') && !l.includes('passer') && !l.includes('good moral') && !l.includes('moral');
  });

  const handleSetAssessmentType = (type: 'Formal' | 'Portfolio') => {
    if (type === 'Formal') {
      setFormData(prev => ({ ...prev, typeOfAssessment: 'Accreditation & Equivalency Test' }));
    } else {
      setFormData(prev => ({ ...prev, typeOfAssessment: 'Accreditation & Equivalency Portfolio Assessment' }));
    }
  };

  const handleToggleRequestedDoc = (docType: 'Transcript' | 'Passer' | 'GoodMoral' | 'Other', otherValue?: string) => {
    const currentDocs = rawRequestedDocument.split(',').map(s => s.trim()).filter(Boolean);
    const transcriptStr = 'Transcript of Records (AF5)';
    const passerStr = 'Certificate of Passer';
    const goodMoralStr = 'Certificate of Good Moral';
    
    let targetStr = '';
    if (docType === 'Transcript') targetStr = transcriptStr;
    else if (docType === 'Passer') targetStr = passerStr;
    else if (docType === 'GoodMoral') targetStr = goodMoralStr;
    else targetStr = otherValue || 'Other';
    
    let newDocs: string[];
    if (docType === 'Other') {
      newDocs = currentDocs.filter(d => d !== transcriptStr && d !== passerStr && d !== goodMoralStr);
      if (targetStr && targetStr !== 'Other') {
        newDocs = [...currentDocs.filter(d => d === transcriptStr || d === passerStr || d === goodMoralStr), targetStr];
      } else {
        const hasOther = currentDocs.some(d => d !== transcriptStr && d !== passerStr && d !== goodMoralStr);
        if (hasOther) {
          newDocs = currentDocs.filter(d => d === transcriptStr || d === passerStr || d === goodMoralStr);
        } else {
          newDocs = [...currentDocs, 'Other'];
        }
      }
    } else {
      if (currentDocs.includes(targetStr)) {
        newDocs = currentDocs.filter(d => d !== targetStr);
      } else {
        newDocs = [...currentDocs, targetStr];
      }
    }
    setFormData(prev => ({ ...prev, requestedDocument: newDocs.join(', ') }));
  };

  return (
    <div className="w-full flex flex-col gap-6 select-none font-sans" id="tcsd-detailed-registry-main-container">
      
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-[10px] font-black tracking-widest rounded-full uppercase border border-amber-200/60 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
              Tarlac City Passers Registry Hub
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight mt-1.5 flex items-center gap-2">
            List of Passers Registry
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl mt-1">
            Dynamic digital data module directly integrated with the ALS Central Sheets. Search by applicant name hierarchy, update records in place, and print authenticated physical Accomplishment Slips.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchPassersData(true)}
            disabled={isSyncing}
            className={`px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#002B6D] ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sinu-sync...' : 'Sync Google Sheet'}
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50/60 border border-emerald-200 rounded-xl hover:bg-emerald-100/80 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            I-export CSV
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncMessage && (
        <div className={`p-3 rounded-xl border flex items-center gap-2.5 animate-flash no-print ${
          syncMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          syncMessage.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold tracking-tight">{syncMessage.text}</span>
        </div>
      )}

      {/* Primary Workspace Panel */}
      {viewMode === 'print' ? (
        /* Isolated high-fidelity print mockup screen */
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6 no-print">
            <button
              onClick={() => setViewMode('form')}
              className="px-3.5 py-1.5 text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Bumalik sa Form
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 text-xs font-black text-white bg-[#002B6D] hover:bg-[#00173D] rounded-lg flex items-center gap-1 shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              I-print ang Dokumento
            </button>
          </div>

          <div className="print-certified-wrapper p-8 bg-white max-w-[800px] mx-auto overflow-auto font-serif" id="print-view-document">
            
            {/* OFFICIAL ALS PORTABLE SLIP LETTERHEAD MANDATED */}
            <div className="flex items-center gap-4 mb-6 font-sans border-b border-dashed border-slate-300 pb-5 text-slate-900">
              <div className="w-18 h-18 flex-none flex items-center justify-center">
                <img 
                  src="https://lh3.googleusercontent.com/d/16PpvyVKWmD0yRY2dYB4KJb_O4XYNScqc" 
                  alt="Tarlac City Logo" 
                  className="w-16 h-16 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 text-center space-y-1">
                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase leading-none">Republic of the Philippines</p>
                <div className="h-[2px]" />
                <h3 className="text-xs font-black uppercase tracking-wide leading-none">Department of Education</h3>
                <p className="text-[10px] text-slate-500 italic leading-none">Region III - Central Luzon</p>
                <div className="h-[4px]" />
                <h2 className="text-xs font-black tracking-tight text-[#002B6D] uppercase leading-none">TARLAC CITY SCHOOLS DIVISION</h2>
                <div className="text-[9px] text-slate-600 mt-1.5 uppercase font-bold tracking-tight leading-tight">
                  Alternative Learning System Operations • Curriculum Implementation Division (CID)
                </div>
                <div className="w-40 bg-slate-300 h-[1.5px] mx-auto my-3" />
                <h1 className="text-xs font-black text-slate-950 uppercase tracking-widest">
                  OFFICIAL ALS RECORD VERIFICATION SLIP
                </h1>
                <p className="text-[9.5px] font-mono text-slate-700 mt-1 uppercase">
                  Document Control No: <strong className="text-slate-950">REQ-02719-20250815</strong>
                </p>
              </div>
              <div className="w-18 h-18 flex-none invisible md:block" />
            </div>

            {/* The high-fidelity form reproduced verbatim for clean physical printouts */}
            <div className="border border-slate-950 bg-white text-slate-950 p-[1.5px]">
              <div className="border-[1.5px] border-slate-950">
                {/* Visual grid content matched to screen, styled for print high-contrast black/white */}
                <div className="grid grid-cols-12 border-b-2 border-slate-950 text-slate-950">
                  <div className="col-span-3 border-r-2 border-slate-950 p-4 flex items-center justify-center">
                    <OfficialSealLogo />
                  </div>
                  <div className="col-span-9 p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase leading-none">REPUBLIC OF THE PHILIPPINES</p>
                    <h3 className="text-xs font-black uppercase tracking-wide leading-none mt-1">DEPARTMENT OF EDUCATION</h3>
                    <p className="text-[10px] text-slate-500 italic leading-none mt-0.5">REGION III</p>
                    <h2 className="text-xs font-black tracking-tight text-[#002B6D] uppercase mt-1 leading-none">TARLAC CITY SCHOOLS DIVISION</h2>
                    <div className="w-24 bg-slate-300 h-[1.5px] my-2" />
                    <h1 className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-widest leading-none mt-0.5">
                      OFFICIAL ALS VERIFICATION RECORD
                    </h1>
                  </div>
                </div>

                {/* Sub row - Barcode & Id */}
                <div className="grid grid-cols-12 border-b-2 border-slate-950 bg-white">
                  <div className="col-span-7 border-r-2 border-slate-950 p-2 flex items-center justify-center">
                    <QRCodeVisual code={formData.barcode || 'PC1002391092'} />
                  </div>
                  <div className="col-span-5 p-3 flex flex-col justify-center">
                    <div className="text-[10px] font-sans uppercase font-bold tracking-wide text-slate-500">Record ID</div>
                    <div className="font-mono text-sm font-black text-[#002B6D] mt-0.5">{formData.recordId || 'N/A'}</div>
                  </div>
                </div>

                {/* Sec 1: Personal Information */}
                <div className="bg-[#D2E2F2] text-[#002B6D] border-b-2 border-slate-950 py-1.5 text-center font-sans font-extrabold text-[11px] tracking-widest uppercase">
                  I. PERSONAL INFORMATION
                </div>

                {/* COMPLETE NAME */}
                <div className="border-b border-slate-950 p-2 text-xs font-sans bg-slate-50/50">
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight block">
                    COMPLETE NAME (Last Name, First Name, Middle Name, Ext in Alphabetical Order)
                  </span>
                  <span className="font-serif text-[14px] font-extrabold text-[#002B6D] mt-1 block">
                    {formData.completeName || [formData.surname, formData.firstName, formData.middleName].filter(Boolean).join(', ') || '—'}
                  </span>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-950 text-xs font-sans">
                  {/* Surname */}
                  <div className="col-span-4 border-r border-slate-950 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Surname</span>
                    <span className="font-serif text-[13px] font-bold text-slate-900 mt-1.5">{formData.surname || '—'}</span>
                  </div>
                  {/* First Name */}
                  <div className="col-span-4 border-r border-slate-950 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">First Name</span>
                    <span className="font-serif text-[13px] font-bold text-slate-900 mt-1.5">{formData.firstName || '—'}</span>
                  </div>
                  {/* Middle Name */}
                  <div className="col-span-3 border-r border-slate-950 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Middle Name</span>
                    <span className="font-serif text-[13px] font-bold text-slate-900 mt-1.5">{formData.middleName || '—'}</span>
                  </div>
                  {/* Middle Initial */}
                  <div className="col-span-1 p-2 flex flex-col justify-between text-center">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">M.I.</span>
                    <span className="font-serif text-[13px] font-bold text-slate-900 mt-1.5">{formData.middleInitial || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b-2 border-slate-950 text-xs font-sans">
                  {/* Birthdate */}
                  <div className="col-span-4 border-r border-slate-950 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Birthdate (YYYY-MM-DD)</span>
                    <span className="font-mono text-[13px] font-bold text-slate-900 mt-1.5">{formData.birthdate || '—'}</span>
                  </div>
                  {/* Gender */}
                  <div className="col-span-3 border-r border-slate-950 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Gender</span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1">
                        <div className={`w-3.5 h-3.5 border border-slate-950 flex items-center justify-center font-mono font-bold text-[10px] ${formData.gender === 'Male' ? 'bg-[#002B6D] text-white' : ''}`}>✓</div>
                        <span className="text-[10px] font-bold">M</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-3.5 h-3.5 border border-slate-950 flex items-center justify-center font-mono font-bold text-[10px] ${formData.gender === 'Female' ? 'bg-[#002B6D] text-white' : ''}`}>✓</div>
                        <span className="text-[10px] font-bold">F</span>
                      </div>
                    </div>
                  </div>
                  {/* LRN */}
                  <div className="col-span-5 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Learner Reference Number (LRN)</span>
                    <span className="font-mono text-[13px] font-bold tracking-[2px] text-slate-900 mt-1.5">{formData.lrn || '—'}</span>
                  </div>
                </div>

                {/* Sec 2: Academic Record */}
                <div className="bg-[#D2E2F2] text-[#002B6D] border-b-2 border-slate-950 py-1.5 text-center font-sans font-extrabold text-[11px] tracking-widest uppercase">
                  II. ACADEMIC RECORD
                </div>

                <div className="grid grid-cols-12 border-b border-slate-950 text-xs font-sans">
                  {/* Curriculum */}
                  <div className="col-span-5 border-r border-slate-950 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Curriculum</span>
                    <span className="font-serif text-[12px] text-slate-900 font-semibold mt-1">{formData.curriculum || '—'}</span>
                  </div>
                  {/* Program Completed */}
                  <div className="col-span-4 border-r border-slate-950 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Program Completed</span>
                    <span className="font-sans text-[12px] text-[#002B6D] font-extrabold mt-1">{formData.programCompleted || '—'}</span>
                  </div>
                  {/* School Year */}
                  <div className="col-span-3 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">School Year</span>
                    <span className="font-serif text-[12px] text-slate-900 font-bold mt-1">{formData.schoolYear || '—'}</span>
                  </div>
                </div>

                {/* Type of Assessment Grid Options */}
                <div className="grid grid-cols-12 border-b border-slate-950 text-xs font-sans bg-slate-50/50">
                  <div className="col-span-12 p-2">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight block mb-1">Type of Assessment</span>
                    <span className="font-serif text-[12px] font-extrabold text-[#002B6D]">{formData.typeOfAssessment || 'Accreditation & Equivalency Portfolio Assessment'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-950 text-xs font-sans">
                  {/* Portfolio Certificate Number */}
                  <div className="col-span-12 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Portfolio Certificate Number</span>
                    <span className="font-mono text-[12px] font-black text-slate-800 mt-1">{formData.portfolioCertificateNumber || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-950 text-xs font-sans">
                  {/* Place of Assessment */}
                  <div className="col-span-7 border-r border-slate-950 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Place of Assessment</span>
                    <span className="font-serif text-[12px] text-slate-900 font-semibold mt-1">{formData.placeOfAssessment || '—'}</span>
                  </div>
                  {/* Date of Assessment */}
                  <div className="col-span-5 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Date of Assessment</span>
                    <span className="font-mono text-[12px] text-slate-900 font-semibold mt-1">{formData.dateOfAssessment || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-950 text-xs font-sans">
                  {/* CLC */}
                  <div className="col-span-12 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Community Learning Center (CLC)</span>
                    <span className="font-serif text-[12px] text-[#002B6D] font-extrabold mt-1">{formData.communityLearningCenter || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b border-slate-950 text-xs font-sans">
                  {/* Division */}
                  <div className="col-span-5 border-r border-slate-950 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Division</span>
                    <span className="font-serif text-[12px] text-slate-900 font-semibold mt-1">{formData.division || '—'}</span>
                  </div>
                  {/* Unit */}
                  <div className="col-span-4 border-r border-slate-950 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Unit</span>
                    <span className="font-serif text-[11px] text-slate-800 mt-1">{formData.unit || '—'}</span>
                  </div>
                  {/* Region */}
                  <div className="col-span-3 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Region</span>
                    <span className="font-serif text-[12px] text-slate-900 font-semibold mt-1">{formData.region || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 border-b-2 border-slate-950 text-xs font-sans">
                  {/* Remarks */}
                  <div className="col-span-12 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Remarks</span>
                    <span className="font-serif text-[12px] text-emerald-800 font-black tracking-tight mt-1">{formData.remarks || '—'}</span>
                  </div>
                </div>

                {/* Sec 3: Verification Details */}
                <div className="bg-[#D2E2F2] text-[#002B6D] border-b-2 border-slate-950 py-1.5 text-center font-sans font-extrabold text-[11px] tracking-widest uppercase">
                  III. VERIFICATION DETAILS
                </div>

                <div className="grid grid-cols-12 border-b border-slate-950 text-xs font-sans">
                  {/* Verified by */}
                  <div className="col-span-8 border-r border-slate-950 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Verified by</span>
                    <span className="font-serif text-[12px] text-slate-900 font-bold mt-1 lg:mt-3">{formData.verifiedBy || '—'}</span>
                  </div>
                  {/* Date Verified */}
                  <div className="col-span-4 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Date Verified</span>
                    <span className="font-mono text-[12px] text-slate-900 mt-1 lg:mt-3">{formData.dateVerified || '—'}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Official seal decoration below print block */}
            <div className="mt-8 flex items-center justify-between text-[11px] font-sans font-bold text-slate-500">
              <div className="text-left">
                <p>TCSD DEPED ADMINISTRATIVE PORTAL COPY</p>
                <p className="font-normal text-[9px] text-slate-400 mt-0.5">Printed automatically from cloud ledger database.</p>
              </div>
              <div className="text-right italic">
                <p>Certification Seal Secured</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Regular live interactive workspace dashboard */
        <div className="flex flex-col gap-6">

          {/* S1: Auto suggestions search card (Verify & Retrieve Passer) */}
          <div className="w-full p-6 bg-white border border-slate-200/95 rounded-2xl shadow-xs no-print">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[#002B6D]">
                <Search className="w-4.5 h-4.5 shrink-0" />
                <h2 className="text-sm font-extrabold tracking-wider uppercase text-indigo-950">
                  Verify & Retrieve Passer
                </h2>
              </div>
              {(searchSurname || searchFirstName || searchMiddleName || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchSurname('');
                    setSearchFirstName('');
                    setSearchMiddleName('');
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  I-clear ang Search
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Mag-search gamit ang <strong className="text-slate-700">Surname Search</strong>, <strong className="text-slate-700">First Name Search</strong>, <strong className="text-slate-700">Middle Name Search</strong>, o kumpletong pangalan upang mabilis na ma-filter at makuha ang record ng passer mula sa Google Sheet.
            </p>

            {/* Dynamic Search Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-3.5">
              {/* Surname Search */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Surname Search (Apelyido)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Hal. Dizon, Santos, Apurado..."
                    value={searchSurname}
                    onChange={(e) => {
                      setSearchSurname(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full pl-3.5 pr-8 py-2 bg-indigo-50/20 border border-indigo-150 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#002B6D]"
                  />
                  {searchSurname && (
                    <button
                      type="button"
                      onClick={() => setSearchSurname('')}
                      className="absolute right-2 top-2 p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* First Name Search */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  First Name Search (Pangalan)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Hal. Maria Regina, Juanita..."
                    value={searchFirstName}
                    onChange={(e) => {
                      setSearchFirstName(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full pl-3.5 pr-8 py-2 bg-indigo-50/20 border border-indigo-150 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#002B6D]"
                  />
                  {searchFirstName && (
                    <button
                      type="button"
                      onClick={() => setSearchFirstName('')}
                      className="absolute right-2 top-2 p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Middle Name Search */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Middle Name Search (Gitnang Pangalan)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Hal. Santos, Dela Cruz..."
                    value={searchMiddleName}
                    onChange={(e) => {
                      setSearchMiddleName(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full pl-3.5 pr-8 py-2 bg-indigo-50/20 border border-indigo-150 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#002B6D]"
                  />
                  {searchMiddleName && (
                    <button
                      type="button"
                      onClick={() => setSearchMiddleName('')}
                      className="absolute right-2 top-2 p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Combined / Format Search */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Full Format Search (Surname, First Name)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Surname, First Name, Middle Name"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full pl-3.5 pr-8 py-2 bg-indigo-50/20 border border-indigo-150 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#002B6D]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Auto suggestion dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="mt-3 border border-slate-200 rounded-xl bg-white shadow-lg divide-y divide-slate-100 max-h-60 overflow-y-auto">
                <div className="px-3.5 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-100">
                  <span>Natagpuang mga Record ({searchSuggestions.length})</span>
                  <span className="text-slate-400 font-normal">I-click upang i-load sa Form</span>
                </div>
                {searchSuggestions.map((rec, idx) => (
                  <button
                    key={`passer-sugg-${rec.recordId || 'rec'}-${rec.lrn || ''}-${idx}`}
                    type="button"
                    onClick={() => handleSelectRecord(rec)}
                    className="w-full px-4 py-2.5 text-left hover:bg-indigo-50/50 transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800 flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-[#002B6D] shrink-0" />
                        <span>{rec.surname}, {rec.firstName} {rec.middleName ? `(${rec.middleName})` : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium font-mono mt-0.5">
                        <span className="flex items-center gap-0.5"><Hash className="w-2.5 h-2.5" /> {rec.lrn}</span>
                        <span>•</span>
                        <span>{rec.programCompleted}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">{rec.remarks}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md shrink-0">
                      Piliin
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Clear Suggestions indicator if matching yields zero */}
            {showSuggestions && (searchSurname || searchFirstName || searchMiddleName || searchQuery) && searchSuggestions.length === 0 && (
              <div className="mt-3 text-center p-3 border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-500 bg-slate-50">
                Walang natagpuang katugmang record sa database. Subukang baguhin ang apelyido, pangalan, o gitnang pangalan.
              </div>
            )}
          </div>

          {/* S2: Quick administrative workflow logistics (Quick Controls & Actions) */}
          <div className="w-full p-6 bg-white border border-slate-200/95 rounded-2xl shadow-xs space-y-4 no-print">
            <div className="flex items-center gap-1.5 text-[#002B6D]">
              <Layers className="w-4.5 h-4.5 shrink-0" />
              <h2 className="text-sm font-extrabold tracking-wider uppercase text-indigo-950">
                Quick Controls & Actions
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleClearForm}
                className="w-full px-4 py-3 bg-[#E3EDFA] hover:bg-[#D4E4FC] text-[#002B6D] text-xs font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-[#002B6D]" />
                Dagdagan ng Manual Entry
              </button>

              <button
                type="button"
                onClick={handlePrintSlip}
                className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                I-print ang Verification Slip
              </button>
            </div>

             <div className="border-t border-slate-100 pt-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Currently Loaded Record (Naka-load na Record)</div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-sm font-black text-indigo-800 uppercase shrink-0">
                  {formData.firstName ? formData.firstName.charAt(0) : '?'}
                  {formData.surname ? formData.surname.charAt(0) : '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-800 truncate leading-tight">
                    {formData.firstName || 'Empty'} {formData.surname || 'Record'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5 truncate">
                    ID: {formData.recordId || 'Draft'} • LRN: {formData.lrn || 'None'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSyncing}
                onClick={(e) => handleSyncAndSaveToGoogleSheet(e)}
                className="w-full mt-3 px-4 py-3 bg-[#002B6D] hover:bg-[#001D4D] disabled:bg-slate-350 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-emerald-300 font-black" />
                )}
                {isSyncing ? 'Synchronizing with Google Sheet...' : 'Synchronize & Save to Google Sheet'}
              </button>
            </div>
          </div>
          
          {/* S3: General Stats Checklist info (Administrative Reminder) */}
          <div className="w-full p-6 bg-amber-50/60 border border-amber-200 rounded-2xl shadow-sm text-slate-700 flex flex-col gap-3 no-print">
            <h3 className="text-sm font-black text-amber-900 tracking-wider uppercase flex items-center gap-1 border-b border-amber-200 pb-2">
              <AlertCircle className="w-4.5 h-4.5 text-amber-700" />
              Administrative Reminder
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <div className="p-3.5 bg-white border border-amber-200 rounded-xl leading-snug font-bold text-amber-955 text-xs shadow-xs flex items-center justify-center text-center">
                Certificate of Passer (BEC 2000)
              </div>
              <div className="p-3.5 bg-white border border-amber-200 rounded-xl leading-snug font-bold text-amber-955 text-xs shadow-xs flex items-center justify-center text-center">
                Certificate of Passer (K+12)
              </div>
            </div>
          </div>

          {/* COMPREHENSIVE FILLABLE TABLE FORM (Now beautifully positioned full-width below Administrative Reminder) */}
          <div className="w-full">
            {isLoading ? (
              <div className="h-96 w-full flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl">
                <RefreshCw className="w-8 h-8 text-[#002B6D] animate-spin" />
                <span className="text-xs font-semibold text-slate-400 mt-2">Ipinapasa ang database ledger...</span>
              </div>
            ) : (
              <form id="passers-accomplishment-form" onSubmit={handleFormSave} className="bg-[#fcfaf5] p-5.5 sm:p-7 border border-slate-300 rounded-2xl shadow-xs space-y-6">
                
                {/* Visual Section Title Header */}
                <div className="flex flex-wrap items-center justify-between border-b border-dashed border-slate-250 pb-3 gap-2">
                  <div>
                    <h2 className="text-xs font-black uppercase text-[#002B6D] tracking-wider">
                      Interactive Accomplishment Form Editor
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Direktang mag-type at pumili ng options sa ibaba upang punan ang registry form.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleUpdateRecord(e)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                      Update the Record
                    </button>
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={(e) => handleSyncAndSaveToGoogleSheet(e)}
                      className="px-4 py-1.5 bg-[#002B6D] hover:bg-[#001D4D] disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {isSyncing ? (
                        <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                      ) : (
                        <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      Synchronize & Save to Google Sheet
                    </button>
                  </div>
                </div>

                {/* THE HIGH-FIDELITY DESIGNED PAPER FORM AS SHOWN IN THE USER IMAGE */}
                <div className="border-2 border-slate-900 bg-white shadow-md relative p-[2px]">
                  <div className="border border-slate-900">
                    
                    {/* Header Block with Inline Official Seals and Title */}
                    <div className="grid grid-cols-12 border-b-2 border-slate-900 bg-white">
                      <div className="col-span-3 border-r border-slate-900 p-3.5 flex items-center justify-center">
                        <OfficialSealLogo />
                      </div>
                      <div className="col-span-9 p-3 flex flex-col items-center justify-center text-center">
                        <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase leading-none">REPUBLIC OF THE PHILIPPINES</p>
                        <h3 className="text-xs font-black uppercase tracking-wide leading-none mt-1">DEPARTMENT OF EDUCATION</h3>
                        <p className="text-[10px] text-slate-500 italic leading-none mt-0.5">REGION III</p>
                        <h2 className="text-xs font-black tracking-tight text-[#002B6D] uppercase mt-1 leading-none">TARLAC CITY SCHOOLS DIVISION</h2>
                        <div className="w-24 bg-slate-300 h-[1.5px] my-2" />
                        <h1 className="text-sm font-black text-slate-950 uppercase tracking-widest leading-none mt-0.5">
                          OFFICIAL ALS VERIFICATION RECORD
                        </h1>
                      </div>
                    </div>

                    {/* First Line containing QR Code on left and Record ID on the right */}
                    <div className="grid grid-cols-12 border-b-2 border-slate-900 bg-white">
                      <div className="col-span-7 border-r border-slate-900 p-2 flex flex-col items-center justify-center">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest self-start ml-2 mb-0.5">Automated Sheets QR Code</span>
                        <QRCodeVisual code={formData.barcode || 'PC1002391092'} />
                      </div>

                      <div className="col-span-5 p-2.5 flex flex-col justify-center">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Record ID *</label>
                        <input
                          type="text"
                          required
                          value={formData.recordId || ''}
                          onChange={(e) => setFormData(p => ({ ...p, recordId: e.target.value }))}
                          className="w-full bg-transparent border-b border-slate-200 mt-1 pb-0.5 font-mono text-sm font-black text-indigo-900 focus:outline-hidden focus:border-[#002B6D]"
                        />
                      </div>
                    </div>

                    {/* SECTION I: PERSONAL INFORMATION BANNER */}
                    <div className="bg-[#D3E2F2] border-b-2 border-slate-900 py-1.5 text-center text-[10px] font-black tracking-widest text-[#002B6D] uppercase">
                      PERSONAL INFORMATION
                    </div>

                    {/* COMPLETE NAME (Last Name, First Name, Middle Name, Ext in Alphabetical Order) */}
                    <div className="border-b border-slate-900 p-2 font-sans bg-slate-50/50">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight block">
                        COMPLETE NAME (Last Name, First Name, Middle Name, Ext in Alphabetical Order)
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. Dizon, Maria Regina, Santos"
                        value={formData.completeName || ''}
                        onChange={(e) => setFormData(p => ({ ...p, completeName: e.target.value }))}
                        className="w-full bg-transparent border-b border-dashed border-slate-300 font-serif text-sm font-bold text-[#002B6D] mt-1 pb-0.5 focus:outline-hidden focus:border-[#002B6D]"
                      />
                    </div>

                    {/* Surname, First Name, Middle Name, Middle Initial */}
                    <div className="grid grid-cols-12 border-b border-slate-900 text-[11px] font-sans">
                      <div className="col-span-4 border-r border-slate-900 p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Surname *</span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dizon"
                          value={formData.surname || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(p => {
                              const updated = { ...p, surname: val };
                              const computed = [val, p.firstName, p.middleName].filter(Boolean).join(', ');
                              return { ...updated, completeName: computed };
                            });
                          }}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 font-serif text-sm font-bold text-slate-900 mt-1 pb-0.5 focus:outline-hidden focus:border-[#002B6D]"
                        />
                      </div>

                      <div className="col-span-4 border-r border-slate-950 p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">First Name *</span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Maria Regina"
                          value={formData.firstName || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(p => {
                              const updated = { ...p, firstName: val };
                              const computed = [p.surname, val, p.middleName].filter(Boolean).join(', ');
                              return { ...updated, completeName: computed };
                            });
                          }}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 font-serif text-sm font-bold text-slate-900 mt-1 pb-0.5 focus:outline-hidden focus:border-[#002B6D]"
                        />
                      </div>

                      <div className="col-span-3 border-r border-slate-900 p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Middle Name</span>
                        <input
                          type="text"
                          placeholder="e.g. Santos"
                          value={formData.middleName || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(p => {
                              const updated = { ...p, middleName: val };
                              const computed = [p.surname, p.firstName, val].filter(Boolean).join(', ');
                              return { ...updated, completeName: computed };
                            });
                          }}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 font-serif text-sm font-bold text-slate-900 mt-1 pb-0.5 focus:outline-hidden focus:border-[#002B6D]"
                        />
                      </div>

                      <div className="col-span-1 p-2 flex flex-col justify-between text-center">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight block">M.I.</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={formData.middleInitial || ''}
                          onChange={(e) => setFormData(p => ({ ...p, middleInitial: e.target.value.toUpperCase() }))}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 text-center font-serif text-sm font-bold text-slate-900 mt-1 pb-0.5 focus:outline-hidden focus:border-[#002B6D]"
                        />
                      </div>
                    </div>

                    {/* Birthdate, Gender, LRN */}
                    <div className="grid grid-cols-12 border-b-2 border-slate-900 text-[11px] font-sans">
                      <div className="col-span-4 border-r border-slate-900 p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Birthdate (YYYY-MM-DD) *</span>
                        <input
                          type="date"
                          required
                          value={formData.birthdate || ''}
                          onChange={(e) => setFormData(p => ({ ...p, birthdate: e.target.value }))}
                          className="w-full bg-transparent border-b border-slate-200 font-mono text-sm font-bold text-slate-900 mt-1 pb-0.5 focus:outline-hidden focus:border-[#002B6D]"
                        />
                      </div>

                      <div className="col-span-3 border-r border-[#000] p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Gender *</span>
                        <div className="flex items-center gap-3 mt-1.5">
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, gender: 'Male' }))}
                            className="flex items-center gap-1 group select-none text-left focus:outline-hidden"
                          >
                            <div className={`w-4 h-4 rounded-xs border border-slate-800 flex items-center justify-center font-bold text-[10px] ${formData.gender === 'Male' ? 'bg-[#002B6D] text-white border-[#002B6D]' : 'bg-transparent text-transparent group-hover:bg-slate-50'}`}>✓</div>
                            <span className="font-bold text-[11px] text-slate-800">Male</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, gender: 'Female' }))}
                            className="flex items-center gap-1 group select-none text-left focus:outline-hidden"
                          >
                            <div className={`w-4 h-4 rounded-xs border border-slate-800 flex items-center justify-center font-bold text-[10px] ${formData.gender === 'Female' ? 'bg-[#002B6D] text-white border-[#002B6D]' : 'bg-transparent text-transparent group-hover:bg-slate-50'}`}>✓</div>
                            <span className="font-bold text-[11px] text-slate-800">Female</span>
                          </button>
                        </div>
                      </div>

                      <div className="col-span-5 p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Learner Reference Number (LRN) *</span>
                        <input
                          type="text"
                          required
                          maxLength={12}
                          placeholder="12-digit LRN"
                          value={formData.lrn || ''}
                          onChange={(e) => setFormData(p => ({ ...p, lrn: e.target.value.replace(/\D/g, '') }))}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 font-mono text-sm tracking-[2px] font-black text-indigo-900 mt-1 pb-0.5 focus:outline-hidden focus:border-[#002B6D]"
                        />
                      </div>
                    </div>

                    {/* SECTION II: ACADEMIC RECORD BANNER */}
                    <div className="bg-[#D3E2F2] border-b-2 border-slate-900 py-1.5 text-center text-[10px] font-black tracking-widest text-[#002B6D] uppercase">
                      ACADEMIC RECORD
                    </div>

                    {/* Curriculum, Program Completed, School Year */}
                    <div className="grid grid-cols-12 border-b border-slate-900 text-[11px] font-sans">
                      <div className="col-span-5 border-r border-[#000] p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Curriculum *</span>
                        <input
                          type="text"
                          required
                          value={formData.curriculum || ''}
                          onChange={(e) => setFormData(p => ({ ...p, curriculum: e.target.value }))}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 font-serif text-xs font-semibold text-slate-800 mt-1 pb-0.5 focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-4 border-r border-slate-900 p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Program Completed *</span>
                        <select
                          value={formData.programCompleted || 'Junior High School'}
                          onChange={(e) => setFormData(p => ({ ...p, programCompleted: e.target.value }))}
                          className="w-full bg-transparent font-sans border-b border-slate-200 text-xs font-extrabold text-[#002B6D] mt-1 pb-0.5 focus:outline-hidden cursor-pointer"
                        >
                          <option value="Junior High School">Junior High School</option>
                          <option value="Elementary">Elementary</option>
                          <option value="Basic Literacy">Basic Literacy</option>
                          {formData.programCompleted && !['Junior High School', 'Elementary', 'Basic Literacy'].includes(formData.programCompleted) && (
                            <option value={formData.programCompleted}>{formData.programCompleted}</option>
                          )}
                        </select>
                      </div>

                      <div className="col-span-3 p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">School Year (From - To) *</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="text"
                            maxLength={4}
                            value={schoolYearParts.from}
                            onChange={(e) => updateSchoolYear('from', e.target.value.replace(/\D/g, ''))}
                            className="w-12 bg-transparent text-center border-b border-dashed border-slate-300 font-serif text-xs font-bold text-slate-800 focus:outline-hidden"
                          />
                          <span className="text-slate-400">-</span>
                          <input
                            type="text"
                            maxLength={4}
                            value={schoolYearParts.to}
                            onChange={(e) => updateSchoolYear('to', e.target.value.replace(/\D/g, ''))}
                            className="w-12 bg-transparent text-center border-b border-dashed border-slate-300 font-serif text-xs font-bold text-slate-800 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Type of Assessment */}
                    <div className="grid grid-cols-12 border-b border-slate-900 text-[11px] font-sans bg-slate-50/50">
                      <div className="col-span-12 p-2">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight block">Type of Assessment *</span>
                        <input
                          type="text"
                          required
                          value={formData.typeOfAssessment || ''}
                          onChange={(e) => setFormData(p => ({ ...p, typeOfAssessment: e.target.value }))}
                          placeholder="e.g. Accreditation & Equivalency Portfolio Assessment"
                          className="w-full bg-transparent border-b border-dashed border-slate-300 font-serif text-xs font-bold text-[#002B6D] mt-1 pb-0.5 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Portfolio Certificate Number */}
                    <div className="grid grid-cols-12 border-b border-slate-900 text-[11px] font-sans">
                      <div className="col-span-12 p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Portfolio Certificate Number</span>
                        <input
                          type="text"
                          placeholder="e.g. AE-2025-RC3-0045"
                          value={formData.portfolioCertificateNumber || ''}
                          onChange={(e) => setFormData(p => ({ ...p, portfolioCertificateNumber: e.target.value }))}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 font-mono text-xs font-bold text-slate-800 mt-1 pb-0.5 focus:outline-hidden focus:border-[#002B6D]"
                        />
                      </div>
                    </div>

                    {/* Place of Assessment, Date of Assessment */}
                    <div className="grid grid-cols-12 border-b border-[#000] text-[11px] font-sans">
                      <div className="col-span-7 border-r border-slate-900 p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Place of Assessment *</span>
                        <input
                          type="text"
                          required
                          value={formData.placeOfAssessment || ''}
                          onChange={(e) => setFormData(p => ({ ...p, placeOfAssessment: e.target.value }))}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 font-serif text-xs text-slate-800 mt-1 pb-0.5 focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-5 p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Date of Assessment</span>
                        <input
                          type="date"
                          value={formData.dateOfAssessment || ''}
                          onChange={(e) => setFormData(p => ({ ...p, dateOfAssessment: e.target.value }))}
                          className="w-full bg-transparent border-b border-slate-200 mt-1 pb-0.5 font-mono text-xs font-bold text-slate-800 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Community Learning Center Row */}
                    <div className="grid grid-cols-12 border-b border-[#000] text-[11px] font-sans">
                      <div className="col-span-12 p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Community Learning Center (CLC) *</span>
                        <input
                          type="text"
                          required
                          value={formData.communityLearningCenter || ''}
                          onChange={(e) => setFormData(p => ({ ...p, communityLearningCenter: e.target.value }))}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 font-serif text-xs text-slate-800 mt-1 pb-0.5 focus:outline-hidden"
                          placeholder="I-type ang Community Learning Center..."
                        />
                      </div>
                    </div>

                    {/* Division, Unit, Region */}
                    <div className="grid grid-cols-12 border-b border-[#000] text-[11px] font-sans">
                      <div className="col-span-5 border-r border-[#000] p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Division *</span>
                        <input
                          type="text"
                          required
                          value={formData.division || ''}
                          onChange={(e) => setFormData(p => ({ ...p, division: e.target.value }))}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 font-serif text-xs text-slate-800 mt-1 pb-0.5 focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-4 border-r border-[rgb(0,0,0)] p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Unit *</span>
                        <input
                          type="text"
                          required
                          value={formData.unit || ''}
                          onChange={(e) => setFormData(p => ({ ...p, unit: e.target.value }))}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 font-serif text-[10px] text-slate-800 mt-1 pb-0.5 focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-3 p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Region *</span>
                        <input
                          type="text"
                          required
                          value={formData.region || ''}
                          onChange={(e) => setFormData(p => ({ ...p, region: e.target.value }))}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 font-serif text-xs text-slate-800 mt-1 pb-0.5 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Remarks */}
                    <div className="grid grid-cols-12 border-b-2 border-slate-900 text-[11px] font-sans">
                      <div className="col-span-12 p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Remarks *</span>
                        <input
                          type="text"
                          required
                          value={formData.remarks || ''}
                          onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 font-serif text-xs font-bold text-emerald-800 mt-1 pb-0.5 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* SECTION III: VERIFICATION DETAILS */}
                    <div className="bg-[#D3E2F2] border-b-2 border-slate-900 py-1.5 text-center text-[10px] font-black tracking-widest text-[#002B6D] uppercase">
                      VERIFICATION DETAILS
                    </div>

                    {/* Verified By, Date Verified */}
                    <div className="grid grid-cols-12 border-b border-slate-900 text-[11px] font-sans">
                      <div className="col-span-8 border-r border-[#000] p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight font-sans">Verified by *</span>
                        <input
                          type="text"
                          required
                          value={formData.verifiedBy || ''}
                          onChange={(e) => setFormData(p => ({ ...p, verifiedBy: e.target.value }))}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 font-serif text-xs font-bold text-slate-800 mt-1 pb-0.5 focus:outline-hidden"
                          placeholder="e.g. Elmer V. Fabros, EPS II - ALS"
                        />
                      </div>

                      <div className="col-span-4 p-2 flex flex-col justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight font-sans">Date Verified *</span>
                        <input
                          type="date"
                          required
                          value={formData.dateVerified || ''}
                          onChange={(e) => setFormData(p => ({ ...p, dateVerified: e.target.value }))}
                          className="w-full bg-transparent border-b border-slate-200 mt-1 pb-0.5 font-mono text-xs font-bold text-slate-800 focus:outline-hidden"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Submit Action Bar under form */}
                <div className="pt-4 flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="px-4 py-2 border border-slate-250 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  >
                    Linisin ang Form
                  </button>

                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={(e) => handleSyncAndSaveToGoogleSheet(e)}
                    className="px-4.5 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-blue-400" />
                    Update & Auto Sync to Sheet
                  </button>

                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={(e) => handleSyncAndSaveToGoogleSheet(e)}
                    className="px-6 py-2.5 bg-[#002B6D] hover:bg-[#00173D] disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Cloud className="w-4 h-4 text-emerald-400" />
                    )}
                    Synchronize & Save to Google Sheet
                  </button>
                </div>

              </form>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
