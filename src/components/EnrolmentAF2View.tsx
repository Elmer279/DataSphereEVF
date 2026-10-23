/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Printer, 
  Save, 
  Clock, 
  CheckCircle2, 
  Info, 
  BookOpen, 
  MapPin, 
  Users, 
  Check,
  Calendar,
  AlertCircle,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  RefreshCw,
  Cloud,
  ChevronDown,
  X
} from 'lucide-react';
import { LearnerRecord } from '../types';
import { COMMUNITY_LEARNING_CENTERS, getClcCode } from '../utils/clcMap';
import { SHEET_COLUMNS } from '../utils/sheetsSync';

interface FormCharBoxesProps {
  value: string;
  onChange: (val: string) => void;
  length: number;
  disabled?: boolean;
  panelMode: 'fill' | 'print';
  isNumericOnly?: boolean;
}

export function FormCharBoxes({ 
  value, 
  onChange, 
  length, 
  disabled = false,
  panelMode,
  isNumericOnly = false
}: FormCharBoxesProps) {
  const chars = (value || '').toUpperCase().slice(0, length).split('');
  const gridCells = Array.from({ length });
  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    inputsRef.current = inputsRef.current.slice(0, length);
  }, [length]);

  const handleCharChange = (idx: number, charVal: string) => {
    const isAlphabetOrDigitOrSpec = isNumericOnly ? /[^0-9]/g : /[^A-Z0-9\s\-\.]/gi;
    const cleanChar = charVal.toUpperCase().replace(isAlphabetOrDigitOrSpec, '').slice(-1);
    
    const newChars = Array.from({ length }, (_, i) => chars[i] || '');
    newChars[idx] = cleanChar;
    
    const newVal = newChars.join('');
    onChange(newVal);

    if (cleanChar && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
      setTimeout(() => {
        inputsRef.current[idx + 1]?.select();
      }, 0);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!chars[idx] && idx > 0) {
        const newChars = Array.from({ length }, (_, i) => chars[i] || '');
        newChars[idx - 1] = '';
        onChange(newChars.join(''));
        inputsRef.current[idx - 1]?.focus();
        setTimeout(() => {
          inputsRef.current[idx - 1]?.select();
        }, 0);
        e.preventDefault();
      } else {
        const newChars = Array.from({ length }, (_, i) => chars[i] || '');
        newChars[idx] = '';
        onChange(newChars.join(''));
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
      setTimeout(() => {
        inputsRef.current[idx - 1]?.select();
      }, 0);
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
      setTimeout(() => {
        inputsRef.current[idx + 1]?.select();
      }, 0);
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const isAlphabetOrDigitOrSpec = isNumericOnly ? /[^0-9]/g : /[^A-Z0-9\s\-\.]/gi;
    const cleanPasted = pastedData.toUpperCase().replace(isAlphabetOrDigitOrSpec, '').slice(0, length);
    onChange(cleanPasted);
    
    const targetIdx = Math.min(cleanPasted.length, length - 1);
    inputsRef.current[targetIdx]?.focus();
    setTimeout(() => {
      inputsRef.current[targetIdx]?.select();
    }, 0);
  };

  if (panelMode === 'fill') {
    return (
      <div className="flex gap-[1px] items-center bg-white border border-slate-300 p-[1.5px] rounded-[1px] shadow-3xs">
        {gridCells.map((_, idx) => {
          const char = chars[idx] || '';
          return (
            <input
              key={idx}
              ref={(el) => { inputsRef.current[idx] = el; }}
              type="text"
              inputMode={isNumericOnly ? "numeric" : "text"}
              pattern={isNumericOnly ? "[0-9]*" : undefined}
              maxLength={1}
              value={char}
              disabled={disabled}
              onChange={(e) => handleCharChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="w-[13px] h-[17px] border-[0.5px] border-slate-300 bg-white font-mono font-bold text-[9.5px] text-[#002B6D] text-center focus:outline-hidden focus:border-[#002B6D] focus:bg-sky-50 transition-colors uppercase"
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-[0.5px] items-center bg-white border border-slate-755 p-[1px]">
      {gridCells.map((_, idx) => {
        const char = chars[idx] || '';
        return (
          <div
            key={idx}
            className="w-[12px] h-[16px] border-[0.5px] border-slate-500 bg-white font-mono font-bold text-[9px] text-slate-900 flex items-center justify-center select-none"
          >
            {char}
          </div>
        );
      })}
    </div>
  );
}

export function normalizeBirthdateToMMDDYYYY(rawDate: string): string {
  if (!rawDate) return '';
  const trimmed = rawDate.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parts = trimmed.split('T')[0].split('-');
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      return `${mm.padStart(2, '0')}/${dd.padStart(2, '0')}/${yyyy}`;
    }
  }
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const [mm, dd, yyyy] = parts;
      return `${mm.padStart(2, '0')}/${dd.padStart(2, '0')}/${yyyy}`;
    }
  }
  return trimmed;
}

interface FormBirthdateBoxesProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  panelMode: 'fill' | 'print';
}

export function FormBirthdateBoxes({
  value,
  onChange,
  disabled = false,
  panelMode
}: FormBirthdateBoxesProps) {
  // Extract only digits from "08/15/1995" or "1995-08-15" -> "08151995"
  const normalizedVal = normalizeBirthdateToMMDDYYYY(value);
  const digits = (normalizedVal || '').replace(/[^0-9]/g, '').slice(0, 8);
  const chars = digits.split('');
  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    inputsRef.current = inputsRef.current.slice(0, 8);
  }, []);

  const updateBirthdate = (newChars: string[]) => {
    const dStr = newChars.join('');
    // Reconstruct with slashes if we have values
    let formatted = '';
    if (dStr.length > 0) {
      const mm = dStr.slice(0, 2);
      const dd = dStr.slice(2, 4);
      const yyyy = dStr.slice(4, 8);
      
      formatted = mm;
      if (dStr.length > 2) {
        formatted += '/' + dd;
      }
      if (dStr.length > 4) {
        formatted += '/' + yyyy;
      }
    }
    onChange(formatted);
  };

  const handleCharChange = (idx: number, charVal: string) => {
    const cleanDigit = charVal.replace(/[^0-9]/g, '').slice(-1);
    const newChars = Array.from({ length: 8 }, (_, i) => chars[i] || '');
    newChars[idx] = cleanDigit;
    updateBirthdate(newChars);

    if (cleanDigit && idx < 7) {
      inputsRef.current[idx + 1]?.focus();
      setTimeout(() => {
        inputsRef.current[idx + 1]?.select();
      }, 0);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!chars[idx] && idx > 0) {
        const newChars = Array.from({ length: 8 }, (_, i) => chars[i] || '');
        newChars[idx - 1] = '';
        updateBirthdate(newChars);
        inputsRef.current[idx - 1]?.focus();
        setTimeout(() => {
          inputsRef.current[idx - 1]?.select();
        }, 0);
        e.preventDefault();
      } else {
        const newChars = Array.from({ length: 8 }, (_, i) => chars[i] || '');
        newChars[idx] = '';
        updateBirthdate(newChars);
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
      setTimeout(() => {
        inputsRef.current[idx - 1]?.select();
      }, 0);
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && idx < 7) {
      inputsRef.current[idx + 1]?.focus();
      setTimeout(() => {
        inputsRef.current[idx + 1]?.select();
      }, 0);
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const cleanDigits = pastedData.replace(/[^0-9]/g, '').slice(0, 8);
    const newChars = cleanDigits.split('');
    updateBirthdate(newChars);
    
    const targetIdx = Math.min(cleanDigits.length, 7);
    inputsRef.current[targetIdx]?.focus();
    setTimeout(() => {
      inputsRef.current[targetIdx]?.select();
    }, 0);
  };

  const renderCell = (idx: number) => {
    const char = chars[idx] || '';
    if (panelMode === 'fill') {
      return (
        <input
          key={idx}
          ref={(el) => { inputsRef.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={char}
          disabled={disabled}
          onChange={(e) => handleCharChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="w-[13px] h-[17px] border-[0.5px] border-slate-300 bg-white font-mono font-bold text-[9.5px] text-[#002B6D] text-center focus:outline-hidden focus:border-[#002B6D] focus:bg-sky-50 transition-colors"
        />
      );
    }
    return (
      <div
        key={idx}
        className="w-[12px] h-[16px] border-[0.5px] border-slate-500 bg-white font-mono font-bold text-[9px] text-slate-900 flex items-center justify-center select-none"
      >
        {char}
      </div>
    );
  };

  if (panelMode === 'fill') {
    return (
      <div className="flex items-center gap-[1px]">
        <div className="flex gap-[1px] items-center bg-white border border-slate-305 p-[1.5px] rounded-[1px] shadow-3xs">
          {renderCell(0)}
          {renderCell(1)}
        </div>
        <span className="text-[10px] font-black font-mono text-slate-800 shrink-0 px-0.5">/</span>
        <div className="flex gap-[1px] items-center bg-white border border-slate-305 p-[1.5px] rounded-[1px] shadow-3xs">
          {renderCell(2)}
          {renderCell(3)}
        </div>
        <span className="text-[10px] font-black font-mono text-slate-800 shrink-0 px-0.5">/</span>
        <div className="flex gap-[1px] items-center bg-white border border-slate-305 p-[1.5px] rounded-[1px] shadow-3xs">
          {renderCell(4)}
          {renderCell(5)}
          {renderCell(6)}
          {renderCell(7)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-[0.5px]">
      <div className="flex gap-[0.5px] items-center bg-white border border-slate-400 p-[1px]">
        {renderCell(0)}
        {renderCell(1)}
      </div>
      <span className="text-[9px] font-black font-mono text-slate-900 shrink-0 px-0.5">/</span>
      <div className="flex gap-[0.5px] items-center bg-white border border-slate-400 p-[1px]">
        {renderCell(2)}
        {renderCell(3)}
      </div>
      <span className="text-[9px] font-black font-mono text-slate-900 shrink-0 px-0.5">/</span>
      <div className="flex gap-[0.5px] items-center bg-white border border-slate-400 p-[1px]">
        {renderCell(4)}
        {renderCell(5)}
        {renderCell(6)}
        {renderCell(7)}
      </div>
    </div>
  );
}

interface EnrolmentAF2ViewProps {
  learners: LearnerRecord[];
  onAddLearner: (learner: LearnerRecord) => any;
  onUpdateLearner: (id: string, updatedFields: Partial<LearnerRecord>) => any;
  onSetLearners?: React.Dispatch<React.SetStateAction<LearnerRecord[]>>;
  customSpreadsheetId?: string | null;
  customSpreadsheetUrl?: string | null;
  accessToken?: string | null;
  onSignIn?: (clientId?: string, clientSecret?: string) => Promise<any>;
  onCreatedCustomSheet?: (id: string | null, url: string | null) => void;
}

const RELIGION_OPTIONS = [
  "Roman Catholicism",
  "Islam",
  "Iglesia ni Cristo",
  "Protestant/Evangelical",
  "Philippine Independent Church (Aglipayan)",
  "Seventh-day Adventist",
  "Jehovah’s Witnesses",
  "United Church of Christ",
  "Indigenous Folk Religions",
  "Dharmic Religions"
];

const MOTHER_TONGUE_OPTIONS = [
  "Kapampangan",
  "Ilocano",
  "Pangasinan",
  "Tagalog",
  "Bisaya",
  "English",
  "Others"
];

export function EnrolmentAF2View({ 
  learners, 
  onAddLearner, 
  onUpdateLearner,
  onSetLearners,
  customSpreadsheetId,
  customSpreadsheetUrl,
  accessToken,
  onSignIn,
  onCreatedCustomSheet
}: EnrolmentAF2ViewProps) {
  // Navigation Mode: 'fill' (Form Editor) | 'print' (Clean high-fidelity printout)
  const [panelMode, setPanelMode] = useState<'fill' | 'print'>('fill');
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>('');
  const [compileSuccess, setCompileSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Search filter states
  const [learnerNameSearch, setLearnerNameSearch] = useState('');
  const [clcSearch, setClcSearch] = useState('');
  const [selectedClc, setSelectedClc] = useState<string>('All');
  const [clcSearchQuery, setClcSearchQuery] = useState('');
  const [isClcDropdownOpen, setIsClcDropdownOpen] = useState(false);

  // States & handlers for custom connected Google Sheet for AF2 submissions
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(() => localStorage.getItem('google_custom_client_id') || '695917606941-6ujh60ml9ptml30k5sr2g27sa4djii8j.apps.googleusercontent.com');
  const [clientSecret, setClientSecret] = useState(() => localStorage.getItem('google_custom_client_secret') || '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');
  const [showConfig, setShowConfig] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleAuthorizeGoogle = async () => {
    if (!onSignIn) return;
    setIsSigningIn(true);
    setSheetError(null);
    try {
      localStorage.setItem('google_custom_client_id', clientId);
      localStorage.setItem('google_custom_client_secret', clientSecret);
      await onSignIn(clientId, clientSecret);
    } catch (err: any) {
      console.error("[OAuth Popup Error]", err);
      setSheetError(err.message || String(err));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCreateConnectedSheet = async () => {
    setIsCreatingSheet(true);
    setSheetError(null);
    try {
      const response = await fetch('/api/sheets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          title: "Modified ALS Enrollment Form Records (AF2)",
          headers: SHEET_COLUMNS,
          tabName: "Sheet1",
          shareWithEmail: "maharlikangguro@gmail.com"
        })
      });

      const resJson = await response.json();
      if (resJson.success && resJson.spreadsheetId) {
        if (onCreatedCustomSheet) {
          onCreatedCustomSheet(
            resJson.spreadsheetId, 
            resJson.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${resJson.spreadsheetId}`
          );
        }
      } else {
        throw new Error(resJson.error || "Failed to create Google Sheet.");
      }
    } catch (err: any) {
      console.error("[Google Sheet Connection Error]", err);
      setSheetError(err.message || String(err));
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm("Are you sure you want to revert to the default shared registry sheet? All future registrations will go back to the default spreadsheet.")) {
      if (onCreatedCustomSheet) {
        onCreatedCustomSheet(null, null);
      }
    }
  };

  const filteredLearnerOptions = useMemo(() => {
    return learners.filter(l => {
      const fullName = `${l.firstName || ''} ${l.middleName || ''} ${l.lastName || ''}`.toLowerCase();
      const matchesSearch = !learnerNameSearch || (
        fullName.includes(learnerNameSearch.toLowerCase()) || 
        (l.recordNumber || '').includes(learnerNameSearch)
      );
      const lClc = l.clcName || l.communityLearningCenter || '';
      const matchesClc = selectedClc === 'All' || lClc.trim().toLowerCase() === selectedClc.trim().toLowerCase();
      return matchesSearch && matchesClc;
    });
  }, [learners, learnerNameSearch, selectedClc]);



  // AF2 Comprehensive State
  const [formFields, setFormFields] = useState({
    date: new Date().toISOString().split('T')[0],
    recordNumber: '', // LRN (12 digits)
    clcName: '',
    clcCode: '',
    teacher: '',

    // 1. Learner's Personal Information (Page 1)
    lastName: '',
    firstName: '',
    middleName: '',
    nameExtension: '', // e.g. Jr, III
    birthdate: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female',
    birthplace: '',
    contactNumber: '',
    religion: '',
    motherTongue: '',
    
    // IP Community Details
    isIP: 'No' as 'Yes' | 'No',
    ipCommunity: '',

    // 4Ps Family Beneficiary Identifier
    is4Ps: 'No' as 'Yes' | 'No',
    householdId: '', // 14-digit alphanumeric code

    // Civil Status
    civilStatus: 'Single' as 'Single' | 'Married' | 'Separated' | 'Widow/er' | 'Solo Parent',

    // Current Address
    houseNo: '',
    street: '',
    barangay: 'San Vicente',
    city: 'Tarlac City',
    province: 'Tarlac',
    country: 'Philippines',
    zipCode: '2300',

    // Permanent Address
    sameAddress: 'Yes' as 'Yes' | 'No',
    permHouseNo: '',
    permStreet: '',
    permBarangay: 'San Vicente',
    permCity: 'Tarlac City',
    permProvince: 'Tarlac',
    permCountry: 'Philippines',
    permZipCode: '2300',

    // 2. Parents/Guardian's Information (Page 1)
    fatherLastName: '',
    fatherFirstName: '',
    fatherMiddleName: '',
    fatherOccupation: '',

    motherLastName: '', // Maiden Last Name
    motherFirstName: '',
    motherMiddleName: '',
    motherOccupation: '',

    guardianLastName: '',
    guardianFirstName: '',
    guardianMiddleName: '',
    guardianOccupation: '',

    // PWD Records (Page 2)
    isPWD: 'No' as 'Yes' | 'No',
    pwdDisabilityType: [] as string[], // checked lists
    pwdSpecialHealthType: '' as 'Cancer' | 'Non-Cancer' | '',
    pwdVisualImpairmentType: '' as 'Blind' | 'Low Vision' | '',
    hasPWDID: 'No' as 'Yes' | 'No',

    // 3. Educational Information (Page 2)
    lastGradeCompleted: '' as string,
    whyNotAttend: '' as string,
    whyNotAttendSpecify: '',
    attendedALSBef: 'No' as 'Yes' | 'No',
    attendedALSBefPrg: '' as string, // Basic Literacy, A&E Elementary, A&E Junior High School, ALS senior High School
    completedALSBef: 'No' as 'Yes' | 'No',
    completedALSBefNoReason: '',

    // 4. Accessibility and Availability of CLC (Page 2)
    clcDistanceKms: '',
    clcDistanceHrs: '',
    clcDistanceMins: '',
    howGetToClc: 'Walking' as 'Walking' | 'Motorcycle' | 'Bicycle' | 'Others',
    howGetToClcOthers: '',

    // Weekly hours available
    clcDaysAvailability: {
      Monday: '',
      Tuesday: '',
      Wednesday: '',
      Thursday: '',
      Friday: '',
      Saturday: '',
      Sunday: '',
    } as Record<string, string>,

    // 5. Modality Preference
    preferredModalities: [] as string[],
    
    // Portal indicators
    district: 'Tarlac City',
    status: 'Enrolled' as 'Enrolled' | 'In Processing' | 'Completed' | 'On Leave',
    program: 'A&E Junior High School' as string,
    learnerSignature: '',
    teacherSignature: ''
  });

  // Autosave states
  const [isDirty, setIsDirty] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Triggered on any physical user interaction in the form container
  const handleUserInteraction = () => {
    setIsDirty(true);
    setAutosaveStatus('idle');
  };

  // Debounced Autosave to the Consolidated master sheet "Data on Enrollment Portal" on the Table
  useEffect(() => {
    if (!isDirty) return;

    // We need at least first name and last name to create or update a record
    if (!formFields.firstName || !formFields.lastName) {
      return;
    }

    setAutosaveStatus('saving');

    const timer = setTimeout(() => {
      if (!onSetLearners) {
        setAutosaveStatus('idle');
        return;
      }

      const synthesizedFatherName = formFields.fatherFirstName 
        ? `${formFields.fatherLastName || ''}, ${formFields.fatherFirstName} ${formFields.fatherMiddleName || ''}`.trim()
        : 'N/A';
      
      const synthesizedMotherName = formFields.motherFirstName 
        ? `${formFields.motherLastName || ''}, ${formFields.motherFirstName} ${formFields.motherMiddleName || ''}`.trim() 
        : 'N/A';

      const mockLrn = formFields.recordNumber || `11774201${Math.floor(100000 + Math.random() * 900000)}`;

      onSetLearners(prev => {
        if (selectedLearnerId) {
          // Update existing learner locally
          return prev.map(l => {
            if (l.id === selectedLearnerId) {
              return {
                ...l,
                recordNumber: formFields.recordNumber || l.recordNumber,
                lastName: formFields.lastName,
                firstName: formFields.firstName,
                middleName: formFields.middleName,
                nameExtension: formFields.nameExtension,
                gender: formFields.gender,
                dateOfBirth: formFields.birthdate,
                age: parseInt(formFields.age) || l.age,
                motherTongue: formFields.motherTongue,
                indigenousPeople: formFields.isIP === 'Yes' ? (formFields.ipCommunity || 'Yes') : 'No',
                religion: formFields.religion,
                houseNo: formFields.houseNo,
                street: formFields.street,
                barangay: formFields.barangay,
                city: formFields.city,
                province: formFields.province,
                fatherName: synthesizedFatherName,
                motherName: synthesizedMotherName,
                contactNumber: formFields.contactNumber || 'N/A',
                lastGradeLevelCompleted: formFields.lastGradeCompleted,
                reasonsForNotAttending: formFields.whyNotAttend || 'N/A',
                name: `${formFields.firstName} ${formFields.middleName ? formFields.middleName[0] + '. ' : ''}${formFields.lastName}`,
                program: formFields.program,
                status: formFields.status,
                district: formFields.district,
                contact: formFields.contactNumber || 'N/A',
                clcName: formFields.clcName,
                clcCode: formFields.clcCode,
                teacher: formFields.teacher,
                learnerSignature: formFields.learnerSignature,
                teacherSignature: formFields.teacherSignature,
                clcDistanceKms: formFields.clcDistanceKms,
                clcDistanceHrs: formFields.clcDistanceHrs,
                clcDistanceMins: formFields.clcDistanceMins,
                howGetToClc: formFields.howGetToClc,
                howGetToClcOthers: formFields.howGetToClcOthers,
                clcDaysAvailability: formFields.clcDaysAvailability,
                preferredModalities: formFields.preferredModalities,
                isIP: formFields.isIP,
                ipCommunity: formFields.ipCommunity,
                is4Ps: formFields.is4Ps,
                householdId: formFields.householdId,
                civilStatus: formFields.civilStatus,
                country: formFields.country,
                zipCode: formFields.zipCode,
                fatherLastName: formFields.fatherLastName,
                fatherFirstName: formFields.fatherFirstName,
                fatherMiddleName: formFields.fatherMiddleName,
                fatherOccupation: formFields.fatherOccupation,
                motherLastName: formFields.motherLastName,
                motherFirstName: formFields.motherFirstName,
                motherMiddleName: formFields.motherMiddleName,
                motherOccupation: formFields.motherOccupation,
                guardianLastName: formFields.guardianLastName,
                guardianFirstName: formFields.guardianFirstName,
                guardianMiddleName: formFields.guardianMiddleName,
                guardianOccupation: formFields.guardianOccupation,
                isPWD: formFields.isPWD,
                pwdDisabilityType: formFields.pwdDisabilityType,
                pwdSpecialHealthType: formFields.pwdSpecialHealthType,
                pwdVisualImpairmentType: formFields.pwdVisualImpairmentType,
                hasPWDID: formFields.hasPWDID,
                whyNotAttendSpecify: formFields.whyNotAttendSpecify,
                attendedALSBef: formFields.attendedALSBef,
                attendedALSBefPrg: formFields.attendedALSBefPrg,
                completedALSBef: formFields.completedALSBef,
                completedALSBefNoReason: formFields.completedALSBefNoReason,
              };
            }
            return l;
          });
        } else {
          // Generate active new ID and register locally
          const generatedId = `ALS-RF-${Date.now()}`;
          const newRec: LearnerRecord = {
            id: generatedId,
            recordNumber: mockLrn,
            lastName: formFields.lastName,
            firstName: formFields.firstName,
            middleName: formFields.middleName,
            nameExtension: formFields.nameExtension,
            gender: formFields.gender,
            dateOfBirth: formFields.birthdate || new Date().toISOString().split('T')[0],
            age: parseInt(formFields.age) || 16,
            motherTongue: formFields.motherTongue || 'Tagalog',
            indigenousPeople: formFields.isIP === 'Yes' ? (formFields.ipCommunity || 'Yes') : 'No',
            religion: formFields.religion || 'Roman Catholic',
            houseNo: formFields.houseNo,
            street: formFields.street,
            barangay: formFields.barangay,
            city: formFields.city,
            province: formFields.province,
            fatherName: synthesizedFatherName,
            motherName: synthesizedMotherName,
            contactNumber: formFields.contactNumber || 'N/A',
            lastGradeLevelCompleted: formFields.lastGradeCompleted || 'Grade 6',
            dateMapped: new Date().toISOString().split('T')[0],
            interestedInALS: 'Yes',
            preferredProgram: formFields.program,
            dateOfFirstAttendance: new Date().toISOString().split('T')[0],
            enrolledInAls: 'Yes',
            reasonsForNotAttending: formFields.whyNotAttend || 'N/A',
            name: `${formFields.firstName} ${formFields.middleName ? formFields.middleName[0] + '. ' : ''}${formFields.lastName}`,
            program: formFields.program,
            status: formFields.status,
            district: formFields.district,
            contact: formFields.contactNumber || 'N/A',
            clcName: formFields.clcName,
            clcCode: formFields.clcCode,
            teacher: formFields.teacher,
            admissionDate: new Date().toISOString().split('T')[0],
            learnerSignature: formFields.learnerSignature,
            teacherSignature: formFields.teacherSignature,
            clcDistanceKms: formFields.clcDistanceKms,
            clcDistanceHrs: formFields.clcDistanceHrs,
            clcDistanceMins: formFields.clcDistanceMins,
            howGetToClc: formFields.howGetToClc,
            howGetToClcOthers: formFields.howGetToClcOthers,
            clcDaysAvailability: formFields.clcDaysAvailability,
            preferredModalities: formFields.preferredModalities,
            isIP: formFields.isIP,
            ipCommunity: formFields.ipCommunity,
            is4Ps: formFields.is4Ps,
            householdId: formFields.householdId,
            civilStatus: formFields.civilStatus,
            country: formFields.country,
            zipCode: formFields.zipCode,
            fatherLastName: formFields.fatherLastName,
            fatherFirstName: formFields.fatherFirstName,
            fatherMiddleName: formFields.fatherMiddleName,
            fatherOccupation: formFields.fatherOccupation,
            motherLastName: formFields.motherLastName,
            motherFirstName: formFields.motherFirstName,
            motherMiddleName: formFields.motherMiddleName,
            motherOccupation: formFields.motherOccupation,
            guardianLastName: formFields.guardianLastName,
            guardianFirstName: formFields.guardianFirstName,
            guardianMiddleName: formFields.guardianMiddleName,
            guardianOccupation: formFields.guardianOccupation,
            isPWD: formFields.isPWD,
            pwdDisabilityType: formFields.pwdDisabilityType,
            pwdSpecialHealthType: formFields.pwdSpecialHealthType,
            pwdVisualImpairmentType: formFields.pwdVisualImpairmentType,
            hasPWDID: formFields.hasPWDID,
            whyNotAttendSpecify: formFields.whyNotAttendSpecify,
            attendedALSBef: formFields.attendedALSBef,
            attendedALSBefPrg: formFields.attendedALSBefPrg,
            completedALSBef: formFields.completedALSBef,
            completedALSBefNoReason: formFields.completedALSBefNoReason,
          };

          // Also set the selected ID so future keystrokes update this record
          setTimeout(() => setSelectedLearnerId(generatedId), 10);
          return [newRec, ...prev];
        }
      });

      setAutosaveStatus('saved');
      setIsDirty(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [formFields, isDirty, selectedLearnerId, onSetLearners]);

  const pwdDisabilityOptions = [
    'Attention Deficit Hyperactivity Disorder',
    'Autism Spectrum Disorder',
    'Cerebral Palsy',
    'Emotional-Behavioral Disorder',
    'Hearing Impairment',
    'Intellectual Disability',
    'Learning Disability',
    'Multiple Disabilities',
    'Orthopedic/Physical Handicap',
    'Speech/Language Disorder',
    'Special Health Problem/Chronic Disease',
    'Visual Impairment'
  ];

  const whyNotAttendOptions = [
    'No school in barangay',
    'School too far from home',
    'Needed to help family',
    'Unable to pay for miscellaneous and other expenses',
    'Others'
  ];

  const gradeLevelOptions = [
    { value: 'Kinder', label: 'Kinder' },
    { value: 'Grade 1', label: 'Grade 1' },
    { value: 'Grade 2', label: 'Grade 2' },
    { value: 'Grade 3', label: 'Grade 3' },
    { value: 'Grade 4', label: 'Grade 4' },
    { value: 'Grade 5', label: 'Grade 5' },
    { value: 'Grade 6', label: 'Grade 6' },
    { value: 'Grade 7', label: 'Grade 7' },
    { value: 'Grade 8', label: 'Grade 8' },
    { value: 'Grade 9', label: 'Grade 9' },
    { value: 'Grade 10', label: 'Grade 10' },
    { value: 'Grade 11', label: 'Grade 11' }
  ];

  const distanceModalityOptions = [
    { value: 'Blended (Combination)', label: 'Blended (Combination)' },
    { value: 'Educational Television', label: 'Educational Television' },
    { value: 'Homeschooling', label: 'Homeschooling' },
    { value: 'Modular (Digital)', label: 'Modular (Digital)' },
    { value: 'Modular (Print)', label: 'Modular (Print)' },
    { value: 'Online', label: 'Online' },
    { value: 'Radio-Based Television', label: 'Radio-Based Television' }
  ];

  // Helper functions for automatic calculation of age and signatures
  const computeAgeAsOfFeb2027 = (dobStr: string): string => {
    if (!dobStr) return '';
    const clean = dobStr.replace(/[^0-9/]/g, '').trim();
    const parts = clean.split('/');
    if (parts.length < 3) return '';
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(month) || isNaN(day) || isNaN(year) || year < 1900) {
      return '';
    }
    
    // Present date dynamic calculation relative to today
    const today = new Date();
    const targetYear = today.getFullYear();
    const targetMonth = today.getMonth() + 1; // 1-indexed
    const targetDay = today.getDate();
    
    let age = targetYear - year;
    if (month > targetMonth || (month === targetMonth && day > targetDay)) {
      age--;
    }
    return age >= 0 ? String(age) : '';
  };

  const getRemarksForProgram = (program: string | undefined, grade?: string): string => {
    const prog = (program || '').trim();
    if (prog) {
      if (prog.toLowerCase().includes('basic literacy') || prog === 'BLP') {
        return 'The Learner is enrolled in Basic Literacy Program';
      }
      if (prog.toLowerCase().includes('elementary')) {
        return 'The Learner is enrolled in A&E Elementary';
      }
      if (prog.toLowerCase().includes('junior high') || prog.toLowerCase().includes('secondary')) {
        return 'The Learner is enrolled in A&E Junior High School';
      }
      if (prog.toLowerCase().includes('senior high')) {
        return 'The Learner is enrolled in ALS Senior High School';
      }
      return `The Learner is enrolled in ${prog}`;
    }
    if (!grade) return '—';
    const trimmed = grade.trim();
    if (trimmed === 'Kinder' || trimmed === 'Grade 1') {
      return 'The Learner is enrolled in Basic Literacy Program: Developing';
    }
    if (trimmed === 'Grade 2' || trimmed === 'Grade 3') {
      return 'The Learner is enrolled in Basic Literacy Program: Beginning';
    }
    if (trimmed === 'Grade 4' || trimmed === 'Grade 5') {
      return 'The Learner is enrolled in A&E Elementary: Intermediate';
    }
    if (trimmed === 'Grade 6' || trimmed === 'Grade 7') {
      return 'The Learner is enrolled in A&E Junior High School: Upper Intermediate';
    }
    if (trimmed === 'Grade 8' || trimmed === 'Grade 9') {
      return 'The Learner is enrolled in A&E Elementary: Proficient';
    }
    if (trimmed === 'Grade 10') {
      return 'The Learner is enrolled in ALS Senior High school: Grade 11';
    }
    if (trimmed === 'Grade 11') {
      return 'The Learner is enrolled in ALS Senior High school: Grade 12';
    }
    return '—';
  };

  const formatSignatureDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      return `${mm}/${dd}/${yyyy}`;
    }
    return dateStr;
  };

  const formatTeacherName = (fullName: string): string => {
    if (!fullName) return '';
    const trimmed = fullName.trim();
    let nameWithoutSuffix = trimmed;
    let suffix = '';
    if (trimmed.toUpperCase().endsWith(' JR.')) {
      nameWithoutSuffix = trimmed.slice(0, -4).trim();
      suffix = ' JR.';
    }
    
    const parts = nameWithoutSuffix.split(/\s+/);
    if (parts.length >= 3) {
      const last = parts[parts.length - 1] + suffix;
      const middle = parts[parts.length - 2];
      const first = parts.slice(0, parts.length - 2).join(' ');
      return `${first}, ${middle}, ${last}`;
    } else if (parts.length === 2) {
      const last = parts[1] + suffix;
      const first = parts[0];
      return `${first}, , ${last}`;
    }
    return trimmed;
  };

  // Synchronize computed fields: age (as of Feb 15, 2027), learner signature, and teacher signature
  useEffect(() => {
    const computedAge = computeAgeAsOfFeb2027(formFields.birthdate);
    
    // Format Name of Learner: "First Name, Middle Name, Last Name"
    const lFirst = (formFields.firstName || '').trim();
    const lMid = (formFields.middleName || '').trim();
    const lLast = (formFields.lastName || '').trim();
    
    let computedLearnerSig = '';
    if (lFirst || lMid || lLast) {
      const formattedDate = formatSignatureDate(formFields.date);
      const dateSuffix = formattedDate ? ` - ${formattedDate}` : '';
      computedLearnerSig = `${lFirst}, ${lMid}, ${lLast}${dateSuffix}`.toUpperCase();
    }
    
    // Format Name of Teacher: "First Name, Middle Name, Last Name"
    let computedTeacherSig = '';
    if (formFields.teacher) {
      const formattedDate = formatSignatureDate(formFields.date);
      const dateSuffix = formattedDate ? ` - ${formattedDate}` : '';
      const formattedTeacherName = formatTeacherName(formFields.teacher);
      computedTeacherSig = `${formattedTeacherName}${dateSuffix}`.toUpperCase();
    }
    
    setFormFields(prev => {
      let changed = false;
      const next = { ...prev };
      
      if (computedAge && prev.age !== computedAge) {
        next.age = computedAge;
        changed = true;
      }
      
      if (computedLearnerSig && prev.learnerSignature !== computedLearnerSig) {
        next.learnerSignature = computedLearnerSig;
        changed = true;
      }
      
      if (computedTeacherSig && prev.teacherSignature !== computedTeacherSig) {
        next.teacherSignature = computedTeacherSig;
        changed = true;
      }
      
      return changed ? next : prev;
    });
  }, [
    formFields.birthdate,
    formFields.firstName,
    formFields.middleName,
    formFields.lastName,
    formFields.teacher,
    formFields.date
  ]);

  // Prefill when active registry dropdown selection changes
  useEffect(() => {
    if (selectedLearnerId) {
      const learner = learners.find(l => l.id === selectedLearnerId);
      if (learner) {
        // Parse Parents (Last, First Middle) matches
        let fLast = '', fFirst = '', fMid = '';
        if (learner.fatherName && learner.fatherName !== 'N/A') {
          const parts = learner.fatherName.split(',');
          if (parts.length > 1) {
            fLast = parts[0].trim();
            const firstParts = parts[1].trim().split(' ');
            fFirst = firstParts[0];
            fMid = firstParts.slice(1).join(' ');
          } else {
            fFirst = learner.fatherName;
          }
        }

        let mLast = '', mFirst = '', mMid = '';
        if (learner.motherName && learner.motherName !== 'N/A') {
          const parts = learner.motherName.split(',');
          if (parts.length > 1) {
            mLast = parts[0].trim();
            const firstParts = parts[1].trim().split(' ');
            mFirst = firstParts[0];
            mMid = firstParts.slice(1).join(' ');
          } else {
            mFirst = learner.motherName;
          }
        }

        setFormFields(prev => ({
          ...prev,
          recordNumber: learner.recordNumber || '',
          lastName: learner.lastName || '',
          firstName: learner.firstName || '',
          middleName: learner.middleName || '',
          nameExtension: learner.nameExtension || '',
          birthdate: normalizeBirthdateToMMDDYYYY(learner.dateOfBirth || (learner as any).birthdate || ''),
          gender: learner.gender || 'Male',
          age: String(learner.age || ''),
          motherTongue: learner.motherTongue || 'Tagalog',
          houseNo: learner.houseNo || '',
          street: learner.street || '',
          barangay: learner.barangay || 'San Vicente',
          city: learner.city || 'Tarlac City',
          province: learner.province || 'Tarlac',
          contactNumber: learner.contactNumber || learner.contact || '',
          religion: learner.religion || 'Roman Catholic',
          isIP: learner.indigenousPeople === 'Yes' ? 'Yes' : 'No',
          ipCommunity: learner.indigenousPeople !== 'Yes' && learner.indigenousPeople !== 'No' ? learner.indigenousPeople : '',
          fatherLastName: learner.fatherLastName || fLast,
          fatherFirstName: learner.fatherFirstName || fFirst,
          fatherMiddleName: learner.fatherMiddleName || fMid,
          fatherOccupation: learner.fatherOccupation || '',
          motherLastName: learner.motherLastName || mLast,
          motherFirstName: learner.motherFirstName || mFirst,
          motherMiddleName: learner.motherMiddleName || mMid,
          motherOccupation: learner.motherOccupation || '',
          guardianLastName: learner.guardianLastName || '',
          guardianFirstName: learner.guardianFirstName || '',
          guardianMiddleName: learner.guardianMiddleName || '',
          guardianOccupation: learner.guardianOccupation || '',
          isPWD: learner.isPWD || 'No',
          pwdDisabilityType: learner.pwdDisabilityType || [],
          pwdSpecialHealthType: learner.pwdSpecialHealthType || '',
          pwdVisualImpairmentType: learner.pwdVisualImpairmentType || '',
          hasPWDID: learner.hasPWDID || 'No',
          whyNotAttendSpecify: learner.whyNotAttendSpecify || '',
          lastGradeCompleted: learner.lastGradeLevelCompleted || 'Grade 6',
          whyNotAttend: learner.reasonsForNotAttending || 'Needed to help family',
          program: learner.program || 'A&E Junior High School',
          status: learner.status || 'Enrolled',
          district: learner.district || 'Tarlac City',
          learnerSignature: learner.learnerSignature || '',
          teacherSignature: learner.teacherSignature || '',
          clcName: learner.clcName || '',
          clcCode: learner.clcCode || '',
          teacher: learner.teacher || '',
          clcDistanceKms: learner.clcDistanceKms || '',
          clcDistanceHrs: learner.clcDistanceHrs || '',
          clcDistanceMins: learner.clcDistanceMins || '',
          howGetToClc: learner.howGetToClc || 'Walking',
          howGetToClcOthers: learner.howGetToClcOthers || '',
          clcDaysAvailability: learner.clcDaysAvailability || { Monday: '', Tuesday: '', Wednesday: '', Thursday: '', Friday: '', Saturday: '', Sunday: '' },
          preferredModalities: Array.isArray(learner.preferredModalities) ? learner.preferredModalities : (typeof learner.preferredModalities === 'string' ? [learner.preferredModalities] : []),
          is4Ps: learner.is4Ps || 'No',
          householdId: learner.householdId || '',
          civilStatus: learner.civilStatus || 'Single',
          country: learner.country || 'Philippines',
          zipCode: learner.zipCode || '2300',
          attendedALSBef: learner.attendedALSBef || 'No',
          attendedALSBefPrg: learner.attendedALSBefPrg || '',
          completedALSBef: learner.completedALSBef || 'No',
          completedALSBefNoReason: learner.completedALSBefNoReason || '',
        }));

        setIsDirty(false);
        setAutosaveStatus('saved');
      }
    }
  }, [selectedLearnerId, learners]);

  const handlePWDDisabilityToggle = (type: string) => {
    setFormFields(prev => {
      const updated = prev.pwdDisabilityType.includes(type)
        ? prev.pwdDisabilityType.filter(item => item !== type)
        : [...prev.pwdDisabilityType, type];

      let specialHealth = prev.pwdSpecialHealthType;
      let visualImpairment = prev.pwdVisualImpairmentType;

      if (!updated.includes('Special Health Problem/Chronic Disease')) {
        specialHealth = '';
      }
      if (!updated.includes('Visual Impairment')) {
        visualImpairment = '';
      }

      return {
        ...prev,
        pwdDisabilityType: updated,
        pwdSpecialHealthType: specialHealth,
        pwdVisualImpairmentType: visualImpairment
      };
    });
  };

  const handleSpecialHealthToggle = (type: 'Cancer' | 'Non-Cancer') => {
    setFormFields(prev => {
      let newTypes = [...prev.pwdDisabilityType];
      const parent = 'Special Health Problem/Chronic Disease';
      if (!newTypes.includes(parent)) {
        newTypes.push(parent);
      }
      const current = prev.pwdSpecialHealthType;
      const newVal = current === type ? '' : type;
      return {
        ...prev,
        pwdDisabilityType: newTypes,
        pwdSpecialHealthType: newVal
      };
    });
  };

  const handleVisualImpairmentToggle = (type: 'Blind' | 'Low Vision') => {
    setFormFields(prev => {
      let newTypes = [...prev.pwdDisabilityType];
      const parent = 'Visual Impairment';
      if (!newTypes.includes(parent)) {
        newTypes.push(parent);
      }
      const current = prev.pwdVisualImpairmentType;
      const newVal = current === type ? '' : type;
      return {
        ...prev,
        pwdDisabilityType: newTypes,
        pwdVisualImpairmentType: newVal
      };
    });
  };

  const handleModalityToggle = (modality: string) => {
    setFormFields(prev => {
      const updated = prev.preferredModalities.includes(modality)
        ? prev.preferredModalities.filter(item => item !== modality)
        : [...prev.preferredModalities, modality];
      return { ...prev, preferredModalities: updated };
    });
  };

  const handleDayTimeChange = (day: string, value: string) => {
    setFormFields(prev => ({
      ...prev,
      clcDaysAvailability: {
        ...prev.clcDaysAvailability,
        [day]: value.toUpperCase()
      }
    }));
  };

  const handleCompileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formFields.firstName || !formFields.lastName) {
      alert("Both First Name and Last Name are absolutely critical to save enrollment!");
      return;
    }

    const synthesizedFatherName = formFields.fatherFirstName 
      ? `${formFields.fatherLastName || ''}, ${formFields.fatherFirstName} ${formFields.fatherMiddleName || ''}`.trim()
      : 'N/A';
    
    const synthesizedMotherName = formFields.motherFirstName 
      ? `${formFields.motherLastName || ''}, ${formFields.motherFirstName} ${formFields.motherMiddleName || ''}`.trim() 
      : 'N/A';

    setIsSyncing(true);
    setSyncStatus('idle');
    setSyncMessage("Processing registration and preparing row mapping...");

    try {
      let syncResult;
      if (selectedLearnerId) {
        setSyncMessage("Syncing modified record with Google Sheet 'Enrollment_AF2' (BUROT CLC)...");
        syncResult = await onUpdateLearner(selectedLearnerId, {
          lastName: formFields.lastName,
          firstName: formFields.firstName,
          middleName: formFields.middleName,
          gender: formFields.gender,
          age: parseInt(formFields.age) || 16,
          contact: formFields.contactNumber || 'N/A',
          program: formFields.program,
          status: formFields.status,
          district: formFields.district,
          barangay: formFields.barangay,
          city: formFields.city,
          province: formFields.province,
          dateOfBirth: formFields.birthdate,
          fatherName: synthesizedFatherName,
          motherName: synthesizedMotherName,
          reasonsForNotAttending: formFields.whyNotAttend || 'N/A',
          lastGradeLevelCompleted: formFields.lastGradeCompleted,
          learnerSignature: formFields.learnerSignature,
          teacherSignature: formFields.teacherSignature,
          clcName: formFields.clcName,
          clcCode: formFields.clcCode,
          teacher: formFields.teacher,
          name: `${formFields.firstName} ${formFields.middleName ? formFields.middleName[0] + '. ' : ''}${formFields.lastName}`
        });
      } else {
        const mockLrn = formFields.recordNumber || `11774201${Math.floor(100000 + Math.random() * 900000)}`;
        const generatedId = `ALS-RF-${Date.now()}`;
        
        const newRec: LearnerRecord = {
          id: generatedId,
          recordNumber: mockLrn,
          lastName: formFields.lastName,
          firstName: formFields.firstName,
          middleName: formFields.middleName,
          gender: formFields.gender,
          dateOfBirth: formFields.birthdate || new Date().toISOString().split('T')[0],
          age: parseInt(formFields.age) || 16,
          motherTongue: formFields.motherTongue || 'Tagalog',
          indigenousPeople: formFields.isIP === 'Yes' ? (formFields.ipCommunity || 'Yes') : 'No',
          religion: formFields.religion || 'Roman Catholic',
          houseNo: formFields.houseNo,
          street: formFields.street,
          barangay: formFields.barangay,
          city: formFields.city,
          province: formFields.province,
          fatherName: synthesizedFatherName,
          motherName: synthesizedMotherName,
          contactNumber: formFields.contactNumber || 'N/A',
          lastGradeLevelCompleted: formFields.lastGradeCompleted || 'Grade 6',
          dateMapped: new Date().toISOString().split('T')[0],
          interestedInALS: 'Yes',
          preferredProgram: formFields.program,
          dateOfFirstAttendance: new Date().toISOString().split('T')[0],
          enrolledInAls: 'Yes',
          reasonsForNotAttending: formFields.whyNotAttend || 'N/A',
          name: `${formFields.firstName} ${formFields.middleName ? formFields.middleName[0] + '. ' : ''}${formFields.lastName}`,
          program: formFields.program,
          status: formFields.status,
          district: formFields.district,
          contact: formFields.contactNumber || 'N/A',
          clcName: formFields.clcName,
          clcCode: formFields.clcCode,
          teacher: formFields.teacher,
          admissionDate: new Date().toISOString().split('T')[0],
          learnerSignature: formFields.learnerSignature,
          teacherSignature: formFields.teacherSignature,
        };

        setSyncMessage("Syncing new registration with Google Sheet 'Enrollment_AF2' (BUROT CLC)...");
        syncResult = await onAddLearner(newRec);
        setSelectedLearnerId(generatedId);
      }

      setSyncStatus('success');
      setSyncMessage("Successfully committed and synced with Google Sheet 'Enrollment_AF2' (BUROT CLC tab)!");
      setCompileSuccess(true);
      setIsDirty(false);
      setAutosaveStatus('saved');
      setTimeout(() => {
        setCompileSuccess(false);
        setPanelMode('print');
        setIsSyncing(false);
        setSyncMessage(null);
      }, 1500);

    } catch (err: any) {
      console.warn("Google Sheet Sync offline or bypassed:", err);
      setSyncStatus('error');
      setSyncMessage("Synchronized locally! Online sync bypassed or fallback triggered.");
      
      setCompileSuccess(true);
      setIsDirty(false);
      setAutosaveStatus('saved');
      setTimeout(() => {
        setCompileSuccess(false);
        setPanelMode('print');
        setIsSyncing(false);
        setSyncMessage(null);
      }, 2500);
    }
  };

  const handlePrint = () => {
    setPanelMode('print');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleReset = () => {
    if (confirm("Clear form draft values? Any unsaved edits will be dumped.")) {
      setFormFields({
        date: new Date().toISOString().split('T')[0],
        recordNumber: '',
        clcName: '',
        clcCode: '',
        teacher: '',
        lastName: '',
        firstName: '',
        middleName: '',
        nameExtension: '',
        birthdate: '',
        age: '',
        gender: 'Male',
        birthplace: '',
        contactNumber: '',
        religion: '',
        motherTongue: '',
        isIP: 'No',
        ipCommunity: '',
        is4Ps: 'No',
        householdId: '',
        civilStatus: 'Single',
        houseNo: '',
        street: '',
        barangay: 'San Vicente',
        city: 'Tarlac City',
        province: 'Tarlac',
        country: 'Philippines',
        zipCode: '2300',
        sameAddress: 'Yes',
        permHouseNo: '',
        permStreet: '',
        permBarangay: 'San Vicente',
        permCity: 'Tarlac City',
        permProvince: 'Tarlac',
        permCountry: 'Philippines',
        permZipCode: '2300',
        fatherLastName: '',
        fatherFirstName: '',
        fatherMiddleName: '',
        fatherOccupation: '',
        motherLastName: '',
        motherFirstName: '',
        motherMiddleName: '',
        motherOccupation: '',
        guardianLastName: '',
        guardianFirstName: '',
        guardianMiddleName: '',
        guardianOccupation: '',
        isPWD: 'No',
        pwdDisabilityType: [],
        pwdSpecialHealthType: '',
        pwdVisualImpairmentType: '',
        hasPWDID: 'No',
        lastGradeCompleted: '',
        whyNotAttend: '',
        whyNotAttendSpecify: '',
        attendedALSBef: 'No',
        attendedALSBefPrg: '',
        completedALSBef: 'No',
        completedALSBefNoReason: '',
        clcDistanceKms: '',
        clcDistanceHrs: '',
        clcDistanceMins: '',
        howGetToClc: 'Walking',
        howGetToClcOthers: '',
        clcDaysAvailability: {
          Monday: '',
          Tuesday: '',
          Wednesday: '',
          Thursday: '',
          Friday: '',
          Saturday: '',
          Sunday: '',
        },
        preferredModalities: [],
        district: 'Tarlac City',
        status: 'Enrolled',
        program: 'A&E Junior High School',
        learnerSignature: '',
        teacherSignature: ''
      });
      setSelectedLearnerId('');
      setIsDirty(false);
      setAutosaveStatus('idle');
    }
  };

  // Renders editable in-place standard input lines embedded perfectly in DepEd paper boxes
  function FormInput({
    id,
    value,
    onChange,
    placeholder = '____________________',
    className = '',
    style = {},
    disabled = false,
  }: {
    id: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
  }) {
    if (panelMode === 'fill') {
      return (
        <input
          id={id}
          type="text"
          value={(value || '').toUpperCase()}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder={placeholder}
          disabled={disabled}
          className={`bg-sky-50/50 border-b border-dashed border-slate-400 focus:bg-sky-50 focus:border-[#002B6D] outline-none px-1 text-[10px] font-black text-slate-900 placeholder-slate-300 transition-colors uppercase py-0.5 rounded-xs disabled:opacity-50 disabled:bg-slate-105 disabled:border-slate-200 ${className}`}
          style={style}
        />
      );
    }
    return (
      <span className={`font-black text-slate-900 text-[10px] uppercase border-b border-transparent px-1 inline-block ${className}`} style={{ ...style, wordBreak: 'break-word' }}>
        {(value || '').toUpperCase() || '—'}
      </span>
    );
  }

  // Renders editable in-place standard select dropdown list embedded in DepEd paper boxes
  function FormSelect({
    id,
    value,
    onChange,
    options,
    placeholder = 'Select option',
    className = '',
    style = {},
    disabled = false,
  }: {
    id: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
  }) {
    if (panelMode === 'fill') {
      return (
        <select
          id={id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`bg-sky-50/50 border-b border-dashed border-slate-400 focus:bg-sky-50 focus:border-[#002B6D] outline-none px-1 text-[10px] font-black text-slate-900 transition-colors uppercase py-0.5 rounded-xs disabled:opacity-50 disabled:bg-slate-105 disabled:border-slate-200 ${className}`}
          style={style}
        >
          <option value="" className="text-slate-400">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="font-extrabold text-slate-900 bg-white">
              {opt.toUpperCase()}
            </option>
          ))}
        </select>
      );
    }
    return (
      <span className={`font-black text-slate-900 text-[10px] uppercase border-b border-transparent px-1 inline-block ${className}`} style={{ ...style, wordBreak: 'break-word' }}>
        {(value || '').toUpperCase() || '—'}
      </span>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col gap-6 animate-fade-in w-full text-slate-800 font-sans p-2 sm:p-4 md:p-6 print:p-0 print:bg-white">
      
      {/* DepEd Title Banner (HIDDEN ON PRINT) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs print:hidden">
        <div className="flex items-start gap-3">
          <img 
            src="https://lh3.googleusercontent.com/d/1cGaJXvEpivgZMUr9QTMO0rhB2MbJnPhz" 
            className="w-12 h-12 select-none shrink-0 object-contain rounded-full shadow-sm" 
            alt="AF2 DEPED Logo" 
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback element if drive image is loading slowly
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <div className="flex items-center gap-1.5 text-[#002B6D] text-[9.5px] font-black uppercase tracking-widest leading-none">
              <span className="inline-block w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
              DepEd Alternative Learning System Registry • Annex 2
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
              Modified ALS Enrollment Form <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.5 rounded font-black whitespace-nowrap">AF2 SHEET</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Registration form replication with diagnostics, socio-cultural indicators, CLC scheduling and high-fidelity PDF paper export.
            </p>
          </div>
        </div>

        {/* View Mode Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
          {/* Community Learning Center Selector Dropdown */}
          <div className="relative z-30">
            <button
              type="button"
              onClick={() => setIsClcDropdownOpen(!isClcDropdownOpen)}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs text-xs font-black text-slate-800 hover:bg-slate-100 transition cursor-pointer max-w-[220px] sm:max-w-[280px]"
            >
              <MapPin className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span className="truncate">
                {selectedClc === 'All' ? 'All Community Learning Centers' : selectedClc}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" />
            </button>

            {isClcDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => {
                    setIsClcDropdownOpen(false);
                    setClcSearchQuery('');
                  }} 
                />
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 animate-fade-in flex flex-col max-h-[300px]">
                  <div className="relative mb-2 shrink-0">
                    <span className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      className="w-full pl-8.5 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#002B6D] focus:bg-white"
                      placeholder="Search learning center..."
                      value={clcSearchQuery}
                      onChange={(e) => setClcSearchQuery(e.target.value)}
                      autoFocus
                    />
                    {clcSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setClcSearchQuery('')}
                        className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 p-1 rounded-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  <div className="overflow-y-auto grow space-y-0.5 max-h-56">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClc('All');
                        setIsClcDropdownOpen(false);
                        setClcSearchQuery('');
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                        selectedClc === 'All'
                          ? 'bg-[#E3EDFA] text-[#002B6D]'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>All Community Learning Centers</span>
                      {selectedClc === 'All' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    
                    {COMMUNITY_LEARNING_CENTERS
                      .filter(clc => clc.toLowerCase().includes(clcSearchQuery.toLowerCase()))
                      .map(clc => {
                        const isSelected = selectedClc.trim().toLowerCase() === clc.trim().toLowerCase();
                        return (
                          <button
                            key={clc}
                            type="button"
                            onClick={() => {
                              setSelectedClc(clc);
                              setIsClcDropdownOpen(false);
                              setClcSearchQuery('');
                              setFormFields(prev => ({
                                ...prev,
                                clcName: clc,
                                clcCode: getClcCode(clc) || prev.clcCode
                              }));
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#E3EDFA] text-[#002B6D]'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{clc}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Active Learner Search (Filtering on Search Name) */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by LRN or Name..."
              value={learnerNameSearch}
              onChange={(e) => setLearnerNameSearch(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-800 focus:outline-none w-[150px] placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          {/* Active Learner Profile Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <span className="text-[10px] font-black text-slate-500 uppercase select-none">Active Profile:</span>
            <select
              value={selectedLearnerId}
              onChange={(e) => setSelectedLearnerId(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[240px]"
            >
              <option value="">-- NEW BLANK DRAFT --</option>
              {filteredLearnerOptions.map((l, idx) => (
                <option key={`${l.id || 'opt'}-${idx}`} value={l.id}>
                  {l.lastName}, {l.firstName} {l.middleName ? `${l.middleName[0]}.` : ''} ({l.recordNumber || 'No LRN'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPanelMode('fill')}
              className={`flex-1 xl:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                panelMode === 'fill'
                  ? 'bg-white text-[#002B6D] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-700" />
              Form Editor Layout
            </button>
          </div>

          {/* Action-oriented Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-black bg-[#002B6D] hover:bg-[#001e4d] text-white transition shadow-sm active:scale-[98%] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            Print Form
          </button>
        </div>
      </div>





      {/* ACTIONS ROW FOR COMFORTABLE SUBMISSIONS */}
      {panelMode === 'fill' && (
        <div className="flex flex-col gap-3 print:hidden w-full">
          {syncMessage && (
            <div className={`p-4 rounded-xl border text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in ${
              syncStatus === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm' :
              syncStatus === 'error' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-sky-50 text-sky-800 border-sky-200'
            }`}>
              <div className="flex items-center gap-2">
                {syncStatus === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : syncStatus === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 shadow-xs" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
                )}
                <span className="leading-tight">{syncMessage}</span>
              </div>
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <span className="text-[9px] font-mono uppercase bg-white/75 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                  Tab: BUROT CLC
                </span>
                <span className="text-[9px] font-mono uppercase bg-white/75 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                  Sheet: Enrollment_AF2
                </span>
              </div>
            </div>
          )}

          <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-3xs animate-fade-in">
            <div className="flex items-center gap-2 text-[10.5px] font-bold text-[#002B6D]">
              <Info className="w-4 h-4 text-sky-700 animate-pulse shrink-0" />
              <span className="leading-tight">Editing live DepEd form compartments below. Standard inputs save automatically to the database on compile.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto uppercase">
              {autosaveStatus === 'saving' && (
                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 animate-pulse normal-case shrink-0">
                  <RefreshCw className="w-3 h-3 animate-spin" /> 
                  Saving to Portal...
                </span>
              )}
              {autosaveStatus === 'saved' && (
                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 normal-case shrink-0">
                  <Check className="w-3 h-3" /> 
                  Saved to Portal Table
                </span>
              )}
              {autosaveStatus === 'idle' && (
                <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 normal-case shrink-0">
                  <Cloud className="w-3 h-3 text-slate-400" /> 
                  Portal Sync Ready
                </span>
              )}
              <button
                type="button"
                onClick={handleCompileSubmit}
                disabled={compileSuccess || isSyncing}
                className="flex-1 sm:flex-none bg-[#002B6D] hover:bg-sky-950 text-white px-5 py-2.5 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-sky-305 animate-spin shrink-0" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-sky-305 shrink-0" />
                )}
                {isSyncing ? 'Syncing...' : compileSuccess ? 'Generating...' : 'Save to Data on Enrollment Portal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT VIEW HEADER */}
      {panelMode === 'print' && (
        <div className="bg-white p-4 rounded-xl border border-slate-250 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-3xs print:hidden animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span>Active AF2 form is fully compiled. Make sure to enable "Background Graphics" in your printer system.</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto self-stretch sm:self-auto">
            <button
              onClick={() => setPanelMode('fill')}
              className="flex-1 sm:flex-none border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg text-xs font-black text-slate-700 transition"
            >
              Go back to Editor
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none bg-[#002B6D] hover:bg-sky-950 text-white px-5 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              Physical Print / PDF Save
            </button>
          </div>
        </div>
      )}



      {/* ========================================================= */}
      {/* HIGH FIDELITY PAPER LAYOUT (STACKED SHEETS 1 & 2 OF AF2)   */}
      {/* ========================================================= */}
      <form onSubmit={handleCompileSubmit} onChange={handleUserInteraction} onClick={handleUserInteraction} className="space-y-6 print:space-y-0 print:p-0">
        
        {/* SHEET PAGE 1: Learner Basic Personal Information */}
        <div className="bg-white shadow-xl border-[1.5px] border-slate-900 mx-auto w-full max-w-[812px] p-8 md:p-10 font-sans text-slate-900 leading-normal relative select-text print:shadow-none print:border-slate-800 print:my-0 print:mx-auto">
          
          {/* Header row containing stylized official seal assets */}
          <div className="flex justify-between items-center border-b-[1.5px] border-slate-900 pb-3 mb-3">
            <div className="flex items-center gap-3">
              <img 
                src="https://lh3.googleusercontent.com/d/16PpvyVKWmD0yRY2dYB4KJb_O4XYNScqc" 
                className="w-12 h-12 select-none shrink-0 object-contain" 
                alt="DEPED Seal" 
                referrerPolicy="no-referrer"
              />

              <div>
                <h1 className="text-[12px] font-black uppercase text-slate-950 tracking-wider">MODIFIED ALS ENROLLMENT FORM</h1>
                <h2 className="text-[10px] font-black text-slate-700 leading-none mt-0.5">(AF2) Learner's Basic Profile</h2>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[8px] font-bold font-mono block text-slate-500 leading-none">Revised as of 02/2024</span>
            </div>
          </div>

          {/* Community Learning Center Metadata Fields Grid */}
          <div className="border-[0.5px] border-slate-700 p-2 text-[8px] mb-3 leading-normal font-medium bg-slate-50/50 text-slate-700 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5 w-full">
              <strong className="text-slate-950 uppercase shrink-0">COMMUNITY LEARNING CENTER:</strong>
              <FormInput 
                id="clcName"
                value={formFields.clcName}
                onChange={(val) => {
                  const rCode = getClcCode(val);
                  setFormFields(prev => ({
                    ...prev,
                    clcName: val,
                    clcCode: rCode || prev.clcCode
                  }));
                }}
                placeholder="Enter Community Learning Center"
                className="grow font-black text-[#002B6D] uppercase"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full ml-[2cm]">
              <strong className="text-slate-950 uppercase shrink-0">CLC CODE:</strong>
              <FormInput 
                id="clcCode"
                value={formFields.clcCode}
                onChange={(val) => setFormFields({...formFields, clcCode: val.toUpperCase()})}
                placeholder="Type CLC Code"
                className="grow"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full">
              <strong className="text-slate-950 uppercase shrink-0">DISTRICT:</strong>
              <FormInput 
                id="district"
                value={formFields.district}
                onChange={(val) => setFormFields({...formFields, district: val.toUpperCase()})}
                placeholder="Enter District"
                className="grow uppercase font-bold"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full">
              <strong className="text-slate-950 uppercase shrink-0">TEACHER:</strong>
              <FormInput 
                id="teacher"
                value={formFields.teacher}
                onChange={(val) => setFormFields({...formFields, teacher: val.toUpperCase()})}
                placeholder="Enter Teacher Name"
                className="grow uppercase font-bold"
              />
            </div>
          </div>

          {/* Top Date & LRN Grid compartment */}
          <div className="grid grid-cols-2 gap-4 mb-3 text-[10px] font-bold pb-2 border-b border-slate-300">
            <div className="flex items-center gap-1.5">
              <span>Date: (mm/dd/yyyy)</span>
              {panelMode === 'fill' ? (
                <input
                  type="date"
                  value={formFields.date}
                  onChange={(e) => setFormFields({...formFields, date: e.target.value})}
                  className="bg-sky-50 border border-slate-350 px-1 py-0.5 rounded text-[9px] font-bold text-[#002B6D]"
                />
              ) : (
                <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 border border-slate-300">
                  {formFields.date ? new Date(formFields.date).toLocaleDateString() : 'N/A'}
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-1.5 text-right">
              <span className="text-[9px] font-bold">Learner Reference No. (LRN) if available:</span>
              <FormCharBoxes
                value={formFields.recordNumber}
                onChange={(val) => setFormFields({...formFields, recordNumber: val})}
                length={12}
                panelMode={panelMode}
                isNumericOnly={true}
              />
            </div>
          </div>

          {/* Part 1: Learner's Personal Information */}
          <div className="border border-slate-900 rounded-xs mb-4 bg-white overflow-hidden">
            <div className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-wide px-3 py-1 flex justify-between">
              <span>1. Learner's Personal Information</span>
              <span className="text-[7.5px] italic text-slate-300 font-medium">WRITE LEGIBLY IN CAPITAL LETTERS ONLY</span>
            </div>

            {/* Row 1: Last Name & Birthdate */}
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800 border-b border-slate-800 text-[10px] items-stretch">
              <div className="md:col-span-3 p-2 flex flex-col gap-1.5 justify-start">
                <span className="text-[8px] text-slate-850 uppercase block font-black leading-none">Last Name</span>
                <FormCharBoxes
                  value={formFields.lastName}
                  onChange={(val) => setFormFields({...formFields, lastName: val})}
                  length={26}
                  panelMode={panelMode}
                />
              </div>
              <div className="md:col-span-1 p-2 flex flex-col gap-1 text-center md:text-left justify-start">
                <span className="text-[8px] text-slate-850 uppercase block font-black leading-none mb-0.5">Birthdate (mm/dd/yyyy)</span>
                <FormBirthdateBoxes
                  value={formFields.birthdate}
                  onChange={(val) => setFormFields({...formFields, birthdate: val})}
                  panelMode={panelMode}
                  disabled={panelMode !== 'fill'}
                />
              </div>
            </div>

            {/* Row 2: First Name, Age & Sex */}
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800 border-b border-slate-800 text-[10px] items-stretch">
              <div className="md:col-span-3 p-2 flex flex-col gap-1.5 justify-start">
                <span className="text-[8px] text-slate-850 uppercase block font-black leading-none">First Name</span>
                <FormCharBoxes
                  value={formFields.firstName}
                  onChange={(val) => setFormFields({...formFields, firstName: val})}
                  length={26}
                  panelMode={panelMode}
                />
              </div>
              <div className="md:col-span-1">
                <div className="grid grid-cols-5 h-full divide-x divide-slate-800">
                  <div className="col-span-2 p-2 flex flex-col justify-start">
                    <span className="text-[8px] text-slate-850 uppercase block font-black leading-none mb-1.5">Age</span>
                    <FormCharBoxes
                      value={formFields.age}
                      onChange={(val) => setFormFields({...formFields, age: val})}
                      length={2}
                      panelMode={panelMode}
                      isNumericOnly={true}
                    />
                  </div>
                  <div className="col-span-3 p-2 flex flex-col justify-start">
                    <span className="text-[8px] text-slate-850 uppercase block font-black leading-none">Sex</span>
                    <div className="flex flex-col gap-1 mt-1 justify-center">
                      <button
                        type="button"
                        disabled={panelMode !== 'fill'}
                        onClick={() => setFormFields({...formFields, gender: 'Male'})}
                        className="flex items-center gap-1.5 focus:outline-none"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black ${formFields.gender === 'Male' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                          {formFields.gender === 'Male' ? '✓' : ''}
                        </span>
                        <span className="text-[8px] font-black tracking-tight">Male</span>
                      </button>
                      <button
                        type="button"
                        disabled={panelMode !== 'fill'}
                        onClick={() => setFormFields({...formFields, gender: 'Female'})}
                        className="flex items-center gap-1.5 focus:outline-none"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black ${formFields.gender === 'Female' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                          {formFields.gender === 'Female' ? '✓' : ''}
                        </span>
                        <span className="text-[8px] font-black tracking-tight">Female</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Middle Name & Place of Birth */}
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800 border-b border-slate-800 text-[10px] items-stretch">
              <div className="md:col-span-3 p-2 flex flex-col gap-1.5 justify-start">
                <span className="text-[8px] text-slate-850 uppercase block font-black leading-none">Middle Name</span>
                <FormCharBoxes
                  value={formFields.middleName}
                  onChange={(val) => setFormFields({...formFields, middleName: val})}
                  length={26}
                  panelMode={panelMode}
                />
              </div>
              <div className="md:col-span-1 p-2 flex flex-col justify-start">
                <span className="text-[8px] text-slate-850 uppercase block font-black leading-none">Place of Birth (Municipality/City)</span>
                <FormInput
                  id="birthplace"
                  placeholder="Municipality/City"
                  value={formFields.birthplace}
                  onChange={(val) => setFormFields({...formFields, birthplace: val})}
                  className="w-full mt-1.5"
                />
              </div>
            </div>

            {/* Row 4: Extension Name, Contact Numbers, and Religion */}
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800 border-b border-slate-800 text-[10px] items-stretch">
              <div className="md:col-span-3">
                <div className="grid grid-cols-5 h-full divide-x divide-slate-800">
                  <div className="col-span-2 p-2 flex flex-col justify-start">
                    <span className="text-[7.5px] text-slate-850 uppercase block font-black leading-none mb-1">Extension Name e.g. Jr., III (if applicable)</span>
                    <FormCharBoxes
                      value={formFields.nameExtension}
                      onChange={(val) => setFormFields({...formFields, nameExtension: val})}
                      length={6}
                      panelMode={panelMode}
                    />
                  </div>
                  <div className="col-span-3 p-2 flex flex-col justify-start">
                    <span className="text-[7.5px] text-slate-850 uppercase block font-black leading-none mb-1.5">Contact Number/s</span>
                    <FormInput
                      id="contactNumber"
                      placeholder="Contact Number/s"
                      value={formFields.contactNumber}
                      onChange={(val) => setFormFields({...formFields, contactNumber: val})}
                      className="w-full font-mono"
                    />
                  </div>
                </div>
              </div>
              <div className="md:col-span-1 p-2 flex flex-col justify-start col-span-1">
                <span className="text-[8px] text-slate-850 uppercase block font-black leading-none">Religion</span>
                <FormInput
                  id="religion"
                  placeholder="Enter Religion"
                  value={formFields.religion}
                  onChange={(val) => setFormFields({...formFields, religion: val})}
                  className="w-full mt-1.5 uppercase font-bold"
                />
              </div>
            </div>

            {/* Row 5: IP Community check & Mother Tongue */}
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800 border-b border-slate-800 text-[10px] items-stretch">
              <div className="md:col-span-3 p-2 flex flex-col justify-center">
                <span className="text-[7.5px] text-slate-850 block font-black leading-none">Belonging to any Indigenous Peoples (IP) Community/Indigenous Cultural Community?</span>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 font-bold">
                  <button
                    type="button"
                    disabled={panelMode !== 'fill'}
                    onClick={() => setFormFields({...formFields, isIP: 'Yes'})}
                    className="flex items-center gap-1 text-[10px]"
                  >
                    <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white`}>
                      {formFields.isIP === 'Yes' ? '✓' : ''}
                    </span>
                    <span className="text-[9px]">Yes</span>
                  </button>
                  <button
                    type="button"
                    disabled={panelMode !== 'fill'}
                    onClick={() => setFormFields({...formFields, isIP: 'No', ipCommunity: ''})}
                    className="flex items-center gap-1 text-[10px]"
                  >
                    <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white`}>
                      {formFields.isIP === 'No' ? '✓' : ''}
                    </span>
                    <span className="text-[9px]">No</span>
                  </button>
                  <span className="text-[9px] font-black tracking-tight text-slate-500">If Yes, please specify:</span>
                  <FormInput
                    id="ipCommunity"
                    placeholder="Specify ethnic community"
                    value={formFields.ipCommunity}
                    onChange={(val) => setFormFields({...formFields, ipCommunity: val})}
                    className="flex-1 text-[9px] py-0 border-b border-slate-400 focus:border-slate-800 outline-none"
                    disabled={formFields.isIP !== 'Yes'}
                  />
                </div>
              </div>
              <div className="md:col-span-1 p-2 flex flex-col justify-start">
                <span className="text-[8px] text-slate-850 uppercase block font-black leading-none">Mother Tongue</span>
                <FormInput
                  id="motherTongue"
                  placeholder="Enter Mother Tongue"
                  value={formFields.motherTongue}
                  onChange={(val) => setFormFields({...formFields, motherTongue: val})}
                  className="w-full mt-1.5 uppercase font-bold"
                />
              </div>
            </div>

            {/* Row 6: 4Ps & Civil Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-[10px] items-stretch">
              <div className="md:col-span-3 p-2 flex flex-col justify-between gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-[7.5px] text-slate-850 uppercase block font-black leading-none">Is your family a beneficiary of 4Ps?</span>
                  <div className="flex gap-3 font-bold">
                    <button
                      type="button"
                      disabled={panelMode !== 'fill'}
                      onClick={() => setFormFields({...formFields, is4Ps: 'Yes'})}
                      className="flex items-center gap-1 text-[10px]"
                    >
                      <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white`}>
                        {formFields.is4Ps === 'Yes' ? '✓' : ''}
                      </span>
                      <span className="text-[9px]">Yes</span>
                    </button>
                    <button
                      type="button"
                      disabled={panelMode !== 'fill'}
                      onClick={() => setFormFields({...formFields, is4Ps: 'No', householdId: ''})}
                      className="flex items-center gap-1 text-[10px]"
                    >
                      <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white`}>
                        {formFields.is4Ps === 'No' ? '✓' : ''}
                      </span>
                      <span className="text-[9px]">No</span>
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-[7px] text-slate-500 uppercase block font-black leading-none mb-1">If Yes, please write the 4Ps Household ID Number:</span>
                  <FormCharBoxes
                    value={formFields.householdId}
                    onChange={(val) => setFormFields({...formFields, householdId: val, is4Ps: 'Yes'})}
                    length={14}
                    panelMode={panelMode}
                    isNumericOnly={true}
                  />
                </div>
              </div>
              <div className="md:col-span-1 p-2 flex flex-col justify-start">
                <span className="text-[7.5px] text-slate-850 uppercase block font-black leading-none mb-1">Civil Status</span>
                <div className="border border-slate-400 p-2 rounded-xs flex-1 bg-white">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] font-bold uppercase">
                    {[
                      { value: 'Single', label: 'Single' },
                      { value: 'Married', label: 'Married' },
                      { value: 'Separated', label: 'Separated' },
                      { value: 'Widow/er', label: 'Widow/er' },
                      { value: 'Solo Parent', label: 'Solo Parent' }
                    ].map(({ value: statusVal, label: statusLabel }) => {
                      const isChecked = formFields.civilStatus === statusVal;
                      const isSoloParent = statusVal === 'Solo Parent';
                      return (
                        <button
                          key={statusVal}
                          type="button"
                          disabled={panelMode !== 'fill'}
                          onClick={() => setFormFields({...formFields, civilStatus: statusVal as any})}
                          className={`flex items-center gap-1 text-left focus:outline-none ${isSoloParent ? 'col-span-2' : ''}`}
                        >
                          <span className={`w-3 h-3 border border-slate-800 flex items-center justify-center text-[7px] font-black bg-white shrink-0`}>
                            {isChecked ? '✓' : ''}
                          </span>
                          <span className="text-[8px] leading-tight font-black">{statusLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Address compartment */}
            <div className="border-b border-slate-800">
              <div className="bg-slate-105 text-slate-900 border-b border-slate-800 px-3 py-1 font-black uppercase text-[8px] tracking-wide select-none">
                CURRENT RESIDENTIAL ADDRESS
              </div>
              <div className="grid grid-cols-4 divide-x divide-slate-800 text-[10px]">
                <div className="p-1.5">
                  <span className="text-[7.5px] text-slate-400 block font-bold leading-none mb-1">House No.</span>
                  <FormInput
                    id="houseNo"
                    placeholder="e.g. 102"
                    value={formFields.houseNo}
                    onChange={(val) => setFormFields({...formFields, houseNo: val})}
                    className="w-full"
                  />
                </div>
                <div className="p-1.5 col-span-2">
                  <span className="text-[7.5px] text-slate-400 block font-bold leading-none mb-1">Sitio/Street Name</span>
                  <FormInput
                    id="street"
                    placeholder="e.g. MABALACAT ROA"
                    value={formFields.street}
                    onChange={(val) => setFormFields({...formFields, street: val})}
                    className="w-full"
                  />
                </div>
                <div className="p-1.5">
                  <span className="text-[7.5px] text-[#002B6D] block font-black leading-none mb-1">Barangay</span>
                  <FormInput
                    id="barangay"
                    placeholder="SAN VICENTE"
                    value={formFields.barangay}
                    onChange={(val) => setFormFields({...formFields, barangay: val})}
                    className="w-full text-[#002B6D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-5 divide-x divide-slate-800 border-t border-slate-800 text-[10px]">
                <div className="p-1.5 col-span-2">
                  <span className="text-[7.5px] text-slate-400 block font-bold leading-none mb-1">Municipality/City</span>
                  <FormInput
                    id="city"
                    placeholder="TARLAC CITY"
                    value={formFields.city}
                    onChange={(val) => setFormFields({...formFields, city: val})}
                    className="w-full"
                  />
                </div>
                <div className="p-1.5">
                  <span className="text-[7.5px] text-slate-405 block font-bold leading-none mb-1">Province</span>
                  <FormInput
                    id="province"
                    placeholder="TARLAC"
                    value={formFields.province}
                    onChange={(val) => setFormFields({...formFields, province: val})}
                    className="w-full"
                  />
                </div>
                <div className="p-1.5">
                  <span className="text-[7.5px] text-slate-400 block font-bold leading-none mb-1">Country</span>
                  <FormInput
                    id="country"
                    placeholder="PHILIPPINES"
                    value={formFields.country}
                    onChange={(val) => setFormFields({...formFields, country: val})}
                    className="w-full"
                  />
                </div>
                <div className="p-1.5">
                  <span className="text-[7.5px] text-slate-400 block font-bold leading-none mb-1">Zip Code</span>
                  <FormInput
                    id="zipCode"
                    placeholder="2300"
                    value={formFields.zipCode}
                    onChange={(val) => setFormFields({...formFields, zipCode: val})}
                    className="w-full font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Permanent address compartment */}
            <div>
              <div className="bg-slate-105 text-slate-900 border-b border-slate-800 px-3 py-1.5 flex flex-wrap justify-between items-center text-[10px] select-none">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-extrabold text-[9px] uppercase tracking-wide">Permanent Address</span>
                  <div className="flex items-center gap-3 border-l border-slate-300 pl-3">
                    <span className="text-[8px] font-black text-slate-700">Same with your Current Address?</span>
                    <button
                      type="button"
                      disabled={panelMode !== 'fill'}
                      onClick={() => setFormFields({
                        ...formFields,
                        sameAddress: 'Yes'
                      })}
                      className="flex items-center gap-1 focus:outline-hidden"
                    >
                      <span className="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8px] font-black bg-white shrink-0">
                        {formFields.sameAddress === 'Yes' ? '✓' : ''}
                      </span>
                      <span className="text-[8.5px] font-black">Yes</span>
                    </button>
                    <button
                      type="button"
                      disabled={panelMode !== 'fill'}
                      onClick={() => setFormFields({
                        ...formFields,
                        sameAddress: 'No'
                      })}
                      className="flex items-center gap-1 focus:outline-hidden"
                    >
                      <span className="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8px] font-black bg-white shrink-0">
                        {formFields.sameAddress === 'No' ? '✓' : ''}
                      </span>
                      <span className="text-[8.5px] font-black">No</span>
                    </button>
                  </div>
                </div>
                <div className="text-[8px] font-black italic text-slate-500">
                  If Yes, proceed to item 2
                </div>
              </div>

              <div className="grid grid-cols-4 divide-x divide-slate-800 text-[10px]">
                <div className="p-1.5 flex flex-col">
                  <span className="text-[7.5px] text-slate-400 block font-bold leading-none mb-1">House No.</span>
                  <FormInput
                    id="permHouseNo"
                    placeholder="e.g. 102"
                    value={formFields.sameAddress === 'Yes' ? formFields.houseNo : formFields.permHouseNo}
                    onChange={(val) => setFormFields({...formFields, permHouseNo: val, sameAddress: 'No'})}
                    disabled={formFields.sameAddress === 'Yes'}
                    className="w-full text-slate-900"
                  />
                </div>
                <div className="p-1.5 col-span-2 flex flex-col">
                  <span className="text-[7.5px] text-slate-400 block font-bold leading-none mb-1">Sitio/Street Name</span>
                  <FormInput
                    id="permStreet"
                    placeholder="e.g. MABALACAT ROAD"
                    value={formFields.sameAddress === 'Yes' ? formFields.street : formFields.permStreet}
                    onChange={(val) => setFormFields({...formFields, permStreet: val, sameAddress: 'No'})}
                    disabled={formFields.sameAddress === 'Yes'}
                    className="w-full text-slate-900"
                  />
                </div>
                <div className="p-1.5 flex flex-col">
                  <span className="text-[7.5px] text-[#002B6D] block font-black leading-none mb-1">Barangay</span>
                  <FormInput
                    id="permBarangay"
                    placeholder="SAN VICENTE"
                    value={formFields.sameAddress === 'Yes' ? formFields.barangay : formFields.permBarangay}
                    onChange={(val) => setFormFields({...formFields, permBarangay: val, sameAddress: 'No'})}
                    disabled={formFields.sameAddress === 'Yes'}
                    className="w-full text-[#002B6D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-5 divide-x divide-slate-800 border-t border-slate-800 text-[10px]">
                <div className="p-1.5 col-span-2 flex flex-col">
                  <span className="text-[7.5px] text-slate-405 block font-bold leading-none mb-1">Municipality/City</span>
                  <FormInput
                    id="permCity"
                    placeholder="TARLAC CITY"
                    value={formFields.sameAddress === 'Yes' ? formFields.city : formFields.permCity}
                    onChange={(val) => setFormFields({...formFields, permCity: val, sameAddress: 'No'})}
                    disabled={formFields.sameAddress === 'Yes'}
                    className="w-full text-slate-900"
                  />
                </div>
                <div className="p-1.5 flex flex-col">
                  <span className="text-[7.5px] text-slate-400 block font-bold leading-none mb-1">Province</span>
                  <FormInput
                    id="permProvince"
                    placeholder="TARLAC"
                    value={formFields.sameAddress === 'Yes' ? formFields.province : formFields.permProvince}
                    onChange={(val) => setFormFields({...formFields, permProvince: val, sameAddress: 'No'})}
                    disabled={formFields.sameAddress === 'Yes'}
                    className="w-full text-slate-900"
                  />
                </div>
                <div className="p-1.5 flex flex-col">
                  <span className="text-[7.5px] text-slate-400 block font-bold leading-none mb-1">Country</span>
                  <FormInput
                    id="permCountry"
                    placeholder="PHILIPPINES"
                    value={formFields.sameAddress === 'Yes' ? formFields.country : formFields.permCountry}
                    onChange={(val) => setFormFields({...formFields, permCountry: val, sameAddress: 'No'})}
                    disabled={formFields.sameAddress === 'Yes'}
                    className="w-full text-slate-900"
                  />
                </div>
                <div className="p-1.5 flex flex-col">
                  <span className="text-[7.5px] text-slate-400 block font-bold leading-none mb-1">Zip Code</span>
                  <FormInput
                    id="permZipCode"
                    placeholder="2300"
                    value={formFields.sameAddress === 'Yes' ? formFields.zipCode : formFields.permZipCode}
                    onChange={(val) => setFormFields({...formFields, permZipCode: val, sameAddress: 'No'})}
                    disabled={formFields.sameAddress === 'Yes'}
                    className="w-full font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Part 2: Parent's/Guardian's Information */}
          <div className="border border-slate-900 rounded-sm mb-4 bg-white overflow-hidden">
            <div className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-wide px-3 py-1">
              2. PARENT'S/GUARDIANS INFORMATION
            </div>

            {/* Father details */}
            <div className="border-b border-slate-800 p-2 text-[10px]">
              <strong className="block text-[8px] text-[#002B6D] uppercase mb-1 tracking-wider">FATHER'S NAME</strong>
              <div className="grid grid-cols-4 gap-3 text-slate-950 font-bold">
                <div>
                  <span className="text-[7.5px] text-slate-400 block uppercase leading-none mb-0.5">Last Name</span>
                  <FormInput
                    id="fatherLastName"
                    placeholder="Last Name"
                    value={formFields.fatherLastName}
                    onChange={(val) => setFormFields({...formFields, fatherLastName: val})}
                    className="w-full py-0"
                  />
                </div>
                <div>
                  <span className="text-[7.5px] text-slate-400 block uppercase leading-none mb-0.5">First Name</span>
                  <FormInput
                    id="fatherFirstName"
                    placeholder="First Name"
                    value={formFields.fatherFirstName}
                    onChange={(val) => setFormFields({...formFields, fatherFirstName: val})}
                    className="w-full py-0"
                  />
                </div>
                <div>
                  <span className="text-[7.5px] text-slate-400 block uppercase leading-none mb-0.5">Middle Name</span>
                  <FormInput
                    id="fatherMiddleName"
                    placeholder="Middle Name"
                    value={formFields.fatherMiddleName}
                    onChange={(val) => setFormFields({...formFields, fatherMiddleName: val})}
                    className="w-full py-0"
                  />
                </div>
                <div>
                  <span className="text-[7.5px] text-slate-405 block uppercase leading-none mb-0.5">Occupation</span>
                  <FormInput
                    id="fatherOccupation"
                    placeholder="Occupation"
                    value={formFields.fatherOccupation}
                    onChange={(val) => setFormFields({...formFields, fatherOccupation: val})}
                    className="w-full py-0"
                  />
                </div>
              </div>
            </div>

            {/* Mother details */}
            <div className="border-b border-slate-800 p-2 text-[10px]">
              <strong className="block text-[8px] text-[#002B6D] uppercase mb-1 tracking-wider">MOTHERS'S NAME</strong>
              <div className="grid grid-cols-4 gap-3 text-slate-950 font-bold">
                <div>
                  <span className="text-[7.5px] text-slate-404 block uppercase leading-none mb-0.5">Last Name</span>
                  <FormInput
                    id="motherLastName"
                    placeholder="Last Name"
                    value={formFields.motherLastName}
                    onChange={(val) => setFormFields({...formFields, motherLastName: val})}
                    className="w-full py-0"
                  />
                </div>
                <div>
                  <span className="text-[7.5px] text-slate-400 block uppercase leading-none mb-0.5">First Name</span>
                  <FormInput
                    id="motherFirstName"
                    placeholder="First Name"
                    value={formFields.motherFirstName}
                    onChange={(val) => setFormFields({...formFields, motherFirstName: val})}
                    className="w-full py-0"
                  />
                </div>
                <div>
                  <span className="text-[7.5px] text-slate-400 block uppercase leading-none mb-0.5">Middle Name</span>
                  <FormInput
                    id="motherMiddleName"
                    placeholder="Middle Name"
                    value={formFields.motherMiddleName}
                    onChange={(val) => setFormFields({...formFields, motherMiddleName: val})}
                    className="w-full py-0"
                  />
                </div>
                <div>
                  <span className="text-[7.5px] text-slate-400 block uppercase leading-none mb-0.5">Occupation</span>
                  <FormInput
                    id="motherOccupation"
                    placeholder="Occupation"
                    value={formFields.motherOccupation}
                    onChange={(val) => setFormFields({...formFields, motherOccupation: val})}
                    className="w-full py-0"
                  />
                </div>
              </div>
            </div>

            {/* Legal Guardian Details */}
            <div className="p-2 text-[10px]">
              <strong className="block text-[8px] text-[#002B6D] uppercase mb-1 tracking-wider font-extrabold">LEGAL GUARDIAN NAME</strong>
              <div className="grid grid-cols-4 gap-3 text-slate-950 font-bold">
                <div>
                  <span className="text-[7.5px] text-slate-400 block uppercase leading-none mb-0.5">Last Name</span>
                  <FormInput
                    id="guardianLastName"
                    placeholder="Last Name"
                    value={formFields.guardianLastName}
                    onChange={(val) => setFormFields({...formFields, guardianLastName: val})}
                    className="w-full py-0"
                  />
                </div>
                <div>
                  <span className="text-[7.5px] text-slate-400 block uppercase leading-none mb-0.5">First Name</span>
                  <FormInput
                    id="guardianFirstName"
                    placeholder="First Name"
                    value={formFields.guardianFirstName}
                    onChange={(val) => setFormFields({...formFields, guardianFirstName: val})}
                    className="w-full py-0"
                  />
                </div>
                <div>
                  <span className="text-[7.5px] text-slate-400 block uppercase leading-none mb-0.5">Middle Name</span>
                  <FormInput
                    id="guardianMiddleName"
                    placeholder="Middle Name"
                    value={formFields.guardianMiddleName}
                    onChange={(val) => setFormFields({...formFields, guardianMiddleName: val})}
                    className="w-full py-0"
                  />
                </div>
                <div>
                  <span className="text-[7.5px] text-slate-400 block uppercase leading-none mb-0.5">Occupation</span>
                  <FormInput
                    id="guardianOccupation"
                    placeholder="Occupation"
                    value={formFields.guardianOccupation}
                    onChange={(val) => setFormFields({...formFields, guardianOccupation: val})}
                    className="w-full py-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Page 1 Bottom indicators */}
          <div className="flex justify-between items-center text-[7.5px] text-slate-404 border-t border-slate-200 pt-2 font-bold select-none">
            <span>Alternative Learning System Portal Registry — System Generated Electronic Form</span>
            <span className="font-extrabold text-slate-800">ALS AF2 SHEET • PAGE 1 OF 2</span>
          </div>
        </div>

        {/* ========================================== */}
        {/* SHEET PAGE 2: PWD, Educational & Schedules */}
        {/* ========================================== */}
        <div className="bg-white shadow-xl border-[1.5px] border-slate-900 mx-auto w-full max-w-[812px] p-8 md:p-10 font-sans text-slate-900 leading-normal relative select-text print:shadow-none print:border-slate-800 print:my-0 print:mx-auto">
          
          <div className="flex justify-between items-center border-b border-slate-900 pb-2 mb-3">
            <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-[#002B6D]">ALS FORM 2 (BASIC PROFILE DETAILS CONTINUED)</span>
            <span className="text-[8px] font-black italic bg-slate-100 px-1 rounded-sm select-none">CONFIDENTIAL PHILIPPINE SYSTEM RECORD</span>
          </div>

          {/* PWD diagnostics panel */}
          <div className="border border-slate-900 rounded-xs mb-3 bg-white">
            <div className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-wide px-3 py-1 select-none">
              MODIFIED ALS ENROLLMENT FORM (PWD STATUS)
            </div>
            <div className="p-3 text-[10px] space-y-3 font-semibold">
              
              {/* Question a: Is the Learner PWD? */}
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-[9px] font-black uppercase text-slate-800">a. Is the Learner PWD?</span>
                <div className="flex gap-4 font-bold">
                  <button
                    type="button"
                    disabled={panelMode !== 'fill'}
                    onClick={() => setFormFields({...formFields, isPWD: 'Yes'})}
                    className="flex items-center gap-1.5 focus:outline-hidden"
                  >
                    <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black ${formFields.isPWD === 'Yes' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                      {formFields.isPWD === 'Yes' ? '✓' : ''}
                    </span>
                    <span className="text-[8.5px] font-black">Yes</span>
                  </button>
                  <button
                    type="button"
                    disabled={panelMode !== 'fill'}
                    onClick={() => setFormFields({...formFields, isPWD: 'No', pwdDisabilityType: [], pwdSpecialHealthType: '', pwdVisualImpairmentType: '', hasPWDID: 'No'})}
                    className="flex items-center gap-1.5 focus:outline-hidden"
                  >
                    <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black ${formFields.isPWD === 'No' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                      {formFields.isPWD === 'No' ? '✓' : ''}
                    </span>
                    <span className="text-[8.5px] font-black">No</span>
                  </button>
                </div>
              </div>

              {/* Subtitle: If yes, specify the type of disability */}
              <div className={`transition-all duration-200 ${(formFields.isPWD === 'Yes' || panelMode === 'fill') ? 'opacity-100' : 'opacity-40 select-none pointer-events-none'}`}>
                <span className="text-[8px] text-slate-500 block uppercase mb-1.5 font-black tracking-wider leading-none">
                  If Yes, specify the type of disability:
                </span>
                
                {/* 3-column Box precisely layout */}
                <div className="border border-slate-500 p-3 bg-slate-50/50 rounded-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    
                    {/* Column 1 */}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={panelMode !== 'fill' || formFields.isPWD === 'No'}
                        onClick={() => handlePWDDisabilityToggle('Attention Deficit Hyperactivity Disorder')}
                        className="flex items-center gap-1.5 focus:outline-hidden text-left"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                          {formFields.pwdDisabilityType.includes('Attention Deficit Hyperactivity Disorder') ? '✓' : ''}
                        </span>
                        <span className="text-[8.5px] font-black leading-tight text-slate-800">Attention Deficit Hyperactivity Disorder</span>
                      </button>

                      <button
                        type="button"
                        disabled={panelMode !== 'fill' || formFields.isPWD === 'No'}
                        onClick={() => handlePWDDisabilityToggle('Autism Spectrum Disorder')}
                        className="flex items-center gap-1.5 focus:outline-hidden text-left"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                          {formFields.pwdDisabilityType.includes('Autism Spectrum Disorder') ? '✓' : ''}
                        </span>
                        <span className="text-[8.5px] font-black leading-tight text-slate-800">Autism Spectrum Disorder</span>
                      </button>

                      <button
                        type="button"
                        disabled={panelMode !== 'fill' || formFields.isPWD === 'No'}
                        onClick={() => handlePWDDisabilityToggle('Cerebral Palsy')}
                        className="flex items-center gap-1.5 focus:outline-hidden text-left"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                          {formFields.pwdDisabilityType.includes('Cerebral Palsy') ? '✓' : ''}
                        </span>
                        <span className="text-[8.5px] font-black leading-tight text-slate-800">Cerebral Palsy</span>
                      </button>

                      <button
                        type="button"
                        disabled={panelMode !== 'fill' || formFields.isPWD === 'No'}
                        onClick={() => handlePWDDisabilityToggle('Emotional-Behavioral Disorder')}
                        className="flex items-center gap-1.5 focus:outline-hidden text-left"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                          {formFields.pwdDisabilityType.includes('Emotional-Behavioral Disorder') ? '✓' : ''}
                        </span>
                        <span className="text-[8.5px] font-black leading-tight text-slate-800">Emotional-Behavior Disorder</span>
                      </button>

                      <button
                        type="button"
                        disabled={panelMode !== 'fill' || formFields.isPWD === 'No'}
                        onClick={() => handlePWDDisabilityToggle('Hearing Impairment')}
                        className="flex items-center gap-1.5 focus:outline-hidden text-left"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                          {formFields.pwdDisabilityType.includes('Hearing Impairment') ? '✓' : ''}
                        </span>
                        <span className="text-[8.5px] font-black leading-tight text-slate-800">Hearing Impairment</span>
                      </button>
                    </div>

                    {/* Column 2 */}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={panelMode !== 'fill' || formFields.isPWD === 'No'}
                        onClick={() => handlePWDDisabilityToggle('Intellectual Disability')}
                        className="flex items-center gap-1.5 focus:outline-hidden text-left"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                          {formFields.pwdDisabilityType.includes('Intellectual Disability') ? '✓' : ''}
                        </span>
                        <span className="text-[8.5px] font-black leading-tight text-slate-800">Intellectual Disability</span>
                      </button>

                      <button
                        type="button"
                        disabled={panelMode !== 'fill' || formFields.isPWD === 'No'}
                        onClick={() => handlePWDDisabilityToggle('Learning Disability')}
                        className="flex items-center gap-1.5 focus:outline-hidden text-left"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                          {formFields.pwdDisabilityType.includes('Learning Disability') ? '✓' : ''}
                        </span>
                        <span className="text-[8.5px] font-black leading-tight text-slate-800">Learning Disability</span>
                      </button>

                      <button
                        type="button"
                        disabled={panelMode !== 'fill' || formFields.isPWD === 'No'}
                        onClick={() => handlePWDDisabilityToggle('Multiple Disabilities')}
                        className="flex items-center gap-1.5 focus:outline-hidden text-left"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                          {formFields.pwdDisabilityType.includes('Multiple Disabilities') ? '✓' : ''}
                        </span>
                        <span className="text-[8.5px] font-black leading-tight text-slate-800">Multiple Disabilities</span>
                      </button>

                      <button
                        type="button"
                        disabled={panelMode !== 'fill' || formFields.isPWD === 'No'}
                        onClick={() => handlePWDDisabilityToggle('Orthopedic/Physical Handicap')}
                        className="flex items-center gap-1.5 focus:outline-hidden text-left"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                          {formFields.pwdDisabilityType.includes('Orthopedic/Physical Handicap') ? '✓' : ''}
                        </span>
                        <span className="text-[8.5px] font-black leading-tight text-slate-800">Orthopedic/Physical Handicap</span>
                      </button>

                      <button
                        type="button"
                        disabled={panelMode !== 'fill' || formFields.isPWD === 'No'}
                        onClick={() => handlePWDDisabilityToggle('Speech/Language Disorder')}
                        className="flex items-center gap-1.5 focus:outline-hidden text-left"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                          {formFields.pwdDisabilityType.includes('Speech/Language Disorder') ? '✓' : ''}
                        </span>
                        <span className="text-[8.5px] font-black leading-tight text-slate-800">Speech/Language Disorder</span>
                      </button>
                    </div>

                    {/* Column 3 */}
                    <div className="flex flex-col gap-2.5">
                      {/* Special Health parent */}
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          disabled={panelMode !== 'fill' || formFields.isPWD === 'No'}
                          onClick={() => handlePWDDisabilityToggle('Special Health Problem/Chronic Disease')}
                          className="flex items-center gap-1.5 focus:outline-hidden text-left"
                        >
                          <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                            {formFields.pwdDisabilityType.includes('Special Health Problem/Chronic Disease') ? '✓' : ''}
                          </span>
                          <span className="text-[8.5px] font-black leading-tight text-slate-800">Special Health Problem/Chronic Disease</span>
                        </button>
                        
                        {/* Special Health sub options */}
                        <div className="flex items-center gap-4 pl-5">
                          <button
                            type="button"
                            disabled={panelMode !== 'fill' || formFields.isPWD === 'No' || !formFields.pwdDisabilityType.includes('Special Health Problem/Chronic Disease')}
                            onClick={() => handleSpecialHealthToggle('Cancer')}
                            className="flex items-center gap-1.5 focus:outline-hidden text-left disabled:opacity-40"
                          >
                            <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                              {formFields.pwdSpecialHealthType === 'Cancer' ? '✓' : ''}
                            </span>
                            <span className="text-[8px] font-black text-slate-700">Cancer</span>
                          </button>
                          <button
                            type="button"
                            disabled={panelMode !== 'fill' || formFields.isPWD === 'No' || !formFields.pwdDisabilityType.includes('Special Health Problem/Chronic Disease')}
                            onClick={() => handleSpecialHealthToggle('Non-Cancer')}
                            className="flex items-center gap-1.5 focus:outline-hidden text-left disabled:opacity-40"
                          >
                            <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                              {formFields.pwdSpecialHealthType === 'Non-Cancer' ? '✓' : ''}
                            </span>
                            <span className="text-[8px] font-black text-slate-700">Non-Cancer</span>
                          </button>
                        </div>
                      </div>

                      {/* Visual Impairment parent */}
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          disabled={panelMode !== 'fill' || formFields.isPWD === 'No'}
                          onClick={() => handlePWDDisabilityToggle('Visual Impairment')}
                          className="flex items-center gap-1.5 focus:outline-hidden text-left"
                        >
                          <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                            {formFields.pwdDisabilityType.includes('Visual Impairment') ? '✓' : ''}
                          </span>
                          <span className="text-[8.5px] font-black leading-tight text-slate-800">Visual Impairment</span>
                        </button>
                        
                        {/* Visual Impairment sub options */}
                        <div className="flex items-center gap-4 pl-5">
                          <button
                            type="button"
                            disabled={panelMode !== 'fill' || formFields.isPWD === 'No' || !formFields.pwdDisabilityType.includes('Visual Impairment')}
                            onClick={() => handleVisualImpairmentToggle('Blind')}
                            className="flex items-center gap-1.5 focus:outline-hidden text-left disabled:opacity-40"
                          >
                            <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                              {formFields.pwdVisualImpairmentType === 'Blind' ? '✓' : ''}
                            </span>
                            <span className="text-[8px] font-black text-slate-700">Blind</span>
                          </button>
                          <button
                            type="button"
                            disabled={panelMode !== 'fill' || formFields.isPWD === 'No' || !formFields.pwdDisabilityType.includes('Visual Impairment')}
                            onClick={() => handleVisualImpairmentToggle('Low Vision')}
                            className="flex items-center gap-1.5 focus:outline-hidden text-left disabled:opacity-40"
                          >
                            <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                              {formFields.pwdVisualImpairmentType === 'Low Vision' ? '✓' : ''}
                            </span>
                            <span className="text-[8px] font-black text-slate-700">Low Vision</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Question b: Does the Learner have a PWD ID? */}
              <div className={`flex flex-wrap items-center gap-4 pt-1.5 border-t border-slate-100 ${formFields.isPWD === 'No' ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                <span className="text-[9px] font-black uppercase text-slate-800">b. Does the Learner have a PWD ID?</span>
                <div className="flex gap-4 font-bold">
                  <button
                    type="button"
                    disabled={panelMode !== 'fill' || formFields.isPWD === 'No'}
                    onClick={() => setFormFields({...formFields, hasPWDID: 'Yes'})}
                    className="flex items-center gap-1.5 focus:outline-hidden disabled:opacity-55"
                  >
                    <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black ${formFields.hasPWDID === 'Yes' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                      {formFields.hasPWDID === 'Yes' ? '✓' : ''}
                    </span>
                    <span className="text-[8.5px] font-black">Yes</span>
                  </button>
                  <button
                    type="button"
                    disabled={panelMode !== 'fill' || formFields.isPWD === 'No'}
                    onClick={() => setFormFields({...formFields, hasPWDID: 'No'})}
                    className="flex items-center gap-1.5 focus:outline-hidden disabled:opacity-55"
                  >
                    <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black ${formFields.hasPWDID === 'No' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                      {formFields.hasPWDID === 'No' ? '✓' : ''}
                    </span>
                    <span className="text-[8.5px] font-black">No</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* 3. Educational Information History */}
          <div className="border border-slate-900 rounded-xs mb-3 bg-white">
            <div className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-wide px-3 py-1 select-none">
              3. Educational Information
            </div>

            <div className="p-3 text-[10px] space-y-3 font-semibold">
              {/* Table structure for Last Grade Level Completed */}
              <div className="border border-slate-700 rounded-sm overflow-hidden bg-white">
                <div className="border-b border-slate-700 bg-slate-100 text-slate-800 text-center font-black uppercase py-1 text-[8.5px] select-none tracking-wider">
                  Last grade level completed (Check only if applicable)
                </div>
                
                <div className="grid grid-cols-12 text-[8.5px] divide-y md:divide-y-0 md:divide-x divide-slate-705">
                  {/* ELEMENTARY Column */}
                  <div className="col-span-12 md:col-span-6 flex flex-col">
                    <div className="bg-slate-50 border-b border-slate-700 text-center font-black py-1 uppercase text-[7.5px] tracking-widest text-slate-750 select-none">
                      ELEMENTARY
                    </div>
                    <div className="p-2 px-3 grid grid-cols-4 gap-2 items-start justify-between flex-1">
                      {/* Column 1: Kinder */}
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          disabled={panelMode !== 'fill'}
                          onClick={() => setFormFields({...formFields, lastGradeCompleted: formFields.lastGradeCompleted === 'Kinder' ? '' : 'Kinder'})}
                          className="flex items-center gap-1.5 focus:outline-hidden text-left"
                        >
                          <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                            {formFields.lastGradeCompleted === 'Kinder' ? '✓' : ''}
                          </span>
                          <span className="text-[8px] font-bold text-slate-800">Kinder</span>
                        </button>
                      </div>

                      {/* Column 2: Grade 1, Grade 2 */}
                      <div className="flex flex-col gap-2">
                        {['Grade 1', 'Grade 2'].map(grd => {
                          const matched = formFields.lastGradeCompleted === grd;
                          return (
                            <button
                              key={grd}
                              type="button"
                              disabled={panelMode !== 'fill'}
                              onClick={() => setFormFields({...formFields, lastGradeCompleted: matched ? '' : grd})}
                              className="flex items-center gap-1.5 focus:outline-hidden text-left"
                            >
                              <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                                {matched ? '✓' : ''}
                              </span>
                              <span className="text-[8px] font-bold text-slate-800">{grd}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Column 3: Grade 3, Grade 4 */}
                      <div className="flex flex-col gap-2">
                        {['Grade 3', 'Grade 4'].map(grd => {
                          const matched = formFields.lastGradeCompleted === grd;
                          return (
                            <button
                              key={grd}
                              type="button"
                              disabled={panelMode !== 'fill'}
                              onClick={() => setFormFields({...formFields, lastGradeCompleted: matched ? '' : grd})}
                              className="flex items-center gap-1.5 focus:outline-hidden text-left"
                            >
                              <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                                {matched ? '✓' : ''}
                              </span>
                              <span className="text-[8px] font-bold text-slate-800">{grd}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Column 4: Grade 5, Grade 6 */}
                      <div className="flex flex-col gap-2">
                        {['Grade 5', 'Grade 6'].map(grd => {
                          const matched = formFields.lastGradeCompleted === grd;
                          return (
                            <button
                              key={grd}
                              type="button"
                              disabled={panelMode !== 'fill'}
                              onClick={() => setFormFields({...formFields, lastGradeCompleted: matched ? '' : grd})}
                              className="flex items-center gap-1.5 focus:outline-hidden text-left"
                            >
                              <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                                {matched ? '✓' : ''}
                              </span>
                              <span className="text-[8px] font-bold text-slate-800">{grd}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* JUNIOR HIGH SCHOOL Column */}
                  <div className="col-span-12 md:col-span-4 flex flex-col">
                    <div className="bg-slate-50 border-b border-slate-700 text-center font-black py-1 uppercase text-[7.5px] tracking-widest text-slate-750 select-none">
                      JUNIOR HIGH SCHOOL
                    </div>
                    <div className="p-2 px-3 grid grid-cols-2 gap-2 items-start flex-1">
                      <div className="flex flex-col gap-2">
                        {['Grade 7', 'Grade 8'].map(grd => {
                          const matched = formFields.lastGradeCompleted === grd;
                          return (
                            <button
                              key={grd}
                              type="button"
                              disabled={panelMode !== 'fill'}
                              onClick={() => setFormFields({...formFields, lastGradeCompleted: matched ? '' : grd})}
                              className="flex items-center gap-1.5 focus:outline-hidden text-left"
                            >
                              <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                                {matched ? '✓' : ''}
                              </span>
                              <span className="text-[8px] font-bold text-slate-800">{grd}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-col gap-2">
                        {['Grade 9', 'Grade 10'].map(grd => {
                          const matched = formFields.lastGradeCompleted === grd;
                          return (
                            <button
                              key={grd}
                              type="button"
                              disabled={panelMode !== 'fill'}
                              onClick={() => setFormFields({...formFields, lastGradeCompleted: matched ? '' : grd})}
                              className="flex items-center gap-1.5 focus:outline-hidden text-left"
                            >
                              <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                                {matched ? '✓' : ''}
                              </span>
                              <span className="text-[8px] font-bold text-slate-800">{grd}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* SENIOR HIGH SCHOOL Column */}
                  <div className="col-span-12 md:col-span-2 flex flex-col">
                    <div className="bg-slate-50 border-b border-slate-700 text-center font-black py-1 uppercase text-[7.5px] tracking-widest text-slate-750 select-none">
                      SENIOR HIGH SCHOOL
                    </div>
                    <div className="p-2 px-3 flex flex-col justify-start flex-1">
                      <button
                        type="button"
                        disabled={panelMode !== 'fill'}
                        onClick={() => setFormFields({...formFields, lastGradeCompleted: formFields.lastGradeCompleted === 'Grade 11' ? '' : 'Grade 11'})}
                        className="flex items-center gap-1.5 focus:outline-hidden text-left"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                          {formFields.lastGradeCompleted === 'Grade 11' ? '✓' : ''}
                        </span>
                        <span className="text-[8px] font-bold text-slate-800">Grade 11</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid with 2 columns: Why did not attend (left) / ALS Sessions before (right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left Column Box: Why did not complete schooling */}
                <div className="border border-slate-700 p-3 bg-white rounded-sm flex flex-col">
                  <span className="text-[8px] text-[#002B6D] font-black uppercase block mb-2 tracking-wide leading-tight">
                    Why did you not attend/complete schooling (For OSY only)
                  </span>
                  
                  <div className="flex flex-col gap-2 flex-1 justify-start">
                    {whyNotAttendOptions.map(opt => {
                      const sel = formFields.whyNotAttend === opt;
                      return (
                        <div key={opt} className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={panelMode !== 'fill'}
                            onClick={() => setFormFields({...formFields, whyNotAttend: sel ? '' : opt, whyNotAttendSpecify: opt === 'Others' ? (sel ? '' : formFields.whyNotAttendSpecify) : ''})}
                            className="flex items-center gap-1.5 focus:outline-hidden text-left"
                          >
                            <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                              {sel ? '✓' : ''}
                            </span>
                            <span className="text-[8.5px] font-black text-slate-800 leading-tight">
                              {opt === 'Others' ? 'Others: (Pls specify)' : opt}
                            </span>
                          </button>
                          {opt === 'Others' && sel && (
                            <FormInput
                              id="whyNotAttendSpecify"
                              placeholder="..."
                              value={formFields.whyNotAttendSpecify}
                              onChange={(val) => setFormFields({...formFields, whyNotAttendSpecify: val})}
                              className="flex-1 text-[8px] py-0 h-5"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column Box: ALS Session history */}
                <div className="border border-slate-700 p-3 bg-white rounded-sm flex flex-col gap-2.5">
                  {/* Attended before? */}
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-[8.5px] font-black text-slate-800">Have you attended ALS learning sessions before?</span>
                    <div className="flex gap-4 font-bold shrink-0">
                      <button
                        type="button"
                        disabled={panelMode !== 'fill'}
                        onClick={() => setFormFields({...formFields, attendedALSBef: 'Yes'})}
                        className="flex items-center gap-1.5 focus:outline-hidden"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black ${formFields.attendedALSBef === 'Yes' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                          {formFields.attendedALSBef === 'Yes' ? '✓' : ''}
                        </span>
                        <span className="text-[8px] font-black">Yes</span>
                      </button>
                      <button
                        type="button"
                        disabled={panelMode !== 'fill'}
                        onClick={() => setFormFields({
                          ...formFields,
                          attendedALSBef: 'No',
                          attendedALSBefPrg: '',
                          completedALSBef: 'No',
                          completedALSBefNoReason: ''
                        })}
                        className="flex items-center gap-1.5 focus:outline-hidden"
                      >
                        <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black ${formFields.attendedALSBef === 'No' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                          {formFields.attendedALSBef === 'No' ? '✓' : ''}
                        </span>
                        <span className="text-[8px] font-black">No</span>
                      </button>
                    </div>
                  </div>

                  {/* If Yes, Programs checklist */}
                  <div className={`pl-2.5 border-l-2 border-slate-200 py-0.5 flex flex-col gap-1.5 transition-all duration-200 ${(formFields.attendedALSBef === 'Yes' || panelMode === 'fill') ? 'opacity-100' : 'opacity-40 select-none pointer-events-none'}`}>
                    <span className="text-[7.5px] text-slate-500 block uppercase font-extrabold leading-none tracking-wider">
                      If Yes, check the appropriate program:
                    </span>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {[
                        { val: 'Basic Literacy', lbl: 'Basic Literacy' },
                        { val: 'A&E Elementary', lbl: 'A&E Elementary' },
                        { val: 'A&E Junior High School', lbl: 'A&E Junior High School' },
                        { val: 'ALS senior High School', lbl: 'ALS senior High School' }
                      ].map(prg => {
                        const active = formFields.attendedALSBefPrg === prg.val;
                        return (
                          <button
                            key={prg.val}
                            type="button"
                            disabled={panelMode !== 'fill' || formFields.attendedALSBef !== 'Yes'}
                            onClick={() => setFormFields({...formFields, attendedALSBefPrg: active ? '' : prg.val})}
                            className="flex items-center gap-1.5 focus:outline-hidden text-left"
                          >
                            <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black bg-white shrink-0`}>
                              {active ? '✓' : ''}
                            </span>
                            <span className="text-[8px] font-bold text-slate-800">{prg.lbl}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Completed? checkbox logic */}
                  <div className={`flex flex-col gap-1.5 pt-2 border-t border-slate-100 transition-all duration-200 ${(formFields.attendedALSBef === 'Yes' || panelMode === 'fill') ? 'opacity-100' : 'opacity-40 select-none pointer-events-none'}`}>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-[8.5px] font-black text-slate-800">Have you completed the program?</span>
                      <div className="flex gap-4 font-bold shrink-0">
                        <button
                          type="button"
                          disabled={panelMode !== 'fill' || formFields.attendedALSBef !== 'Yes'}
                          onClick={() => setFormFields({...formFields, completedALSBef: 'Yes', completedALSBefNoReason: ''})}
                          className="flex items-center gap-1.5 focus:outline-hidden"
                        >
                          <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black ${formFields.completedALSBef === 'Yes' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                            {formFields.completedALSBef === 'Yes' ? '✓' : ''}
                          </span>
                          <span className="text-[8px] font-black">Yes</span>
                        </button>
                        <button
                          type="button"
                          disabled={panelMode !== 'fill' || formFields.attendedALSBef !== 'Yes'}
                          onClick={() => setFormFields({...formFields, completedALSBef: 'No'})}
                          className="flex items-center gap-1.5 focus:outline-hidden"
                        >
                          <span className={`w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[8.5px] font-black ${formFields.completedALSBef === 'No' ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                            {formFields.completedALSBef === 'No' ? '✓' : ''}
                          </span>
                          <span className="text-[8px] font-black">No</span>
                        </button>
                      </div>
                    </div>

                    {/* No complete state reason */}
                    <div className={`flex items-center gap-2 mt-0.5 transition-all duration-200 ${(formFields.completedALSBef === 'No' || panelMode === 'fill') ? 'opacity-100' : 'opacity-40 select-none pointer-events-none'}`}>
                      <span className="text-[8px] font-black text-slate-700 shrink-0">If No, state the reason:</span>
                      <FormInput
                        id="completedALSBefNoReason"
                        placeholder="..."
                        value={formFields.completedALSBefNoReason}
                        disabled={panelMode !== 'fill' || formFields.completedALSBef !== 'No'}
                        onChange={(val) => setFormFields({...formFields, completedALSBefNoReason: val})}
                        className="flex-1 py-0 h-5"
                      />
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>

          {/* 4. Accessibility and Availability of CLC */}
          <div className="border border-slate-900 rounded-sm mb-3 bg-white">
            <div className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-wide px-3 py-1 select-none">
              4. Accessibility and Availability of CLC
            </div>
            
            <div className="p-3 text-[9px] space-y-3 font-semibold text-slate-830">
              {/* Question 1 */}
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-800">1.How far is your home to your Learning Center?</span>
                  <div className="flex items-center gap-1 ml-2">
                    <span className="font-bold text-slate-800">in kms</span>
                    <input
                      type="text"
                      disabled={panelMode !== 'fill'}
                      value={formFields.clcDistanceKms || ''}
                      onChange={(e) => setFormFields({...formFields, clcDistanceKms: e.target.value})}
                      className="border-b border-dashed border-slate-800 bg-transparent text-center focus:outline-none focus:border-blue-600 font-mono text-[9px] w-28 h-5 px-1 font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-1 ml-4 col-span-2">
                    <span className="font-bold text-slate-800">in hours and mins</span>
                    <input
                      type="text"
                      placeholder="..."
                      disabled={panelMode !== 'fill'}
                      value={formFields.clcDistanceHrs || ''}
                      onChange={(e) => setFormFields({...formFields, clcDistanceHrs: e.target.value})}
                      className="border-b border-dashed border-slate-800 bg-transparent text-center focus:outline-none focus:border-blue-600 font-mono text-[9px] w-48 h-5 px-1 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Question 2 */}
              <div className="pt-1">
                <span className="font-bold text-slate-800 block">2.How do you get from your home to your Learning Center?</span>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1.5 pl-4">
                  {['Walking', 'Motorcycle', 'Bicycle', 'Others'].map(mode => {
                    const checked = formFields.howGetToClc === mode;
                    return (
                      <div key={mode} className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={panelMode !== 'fill'}
                          onClick={() => setFormFields({
                            ...formFields,
                            howGetToClc: checked ? '' as any : mode as any,
                            howGetToClcOthers: mode === 'Others' ? (checked ? '' : formFields.howGetToClcOthers) : ''
                          })}
                          className="flex items-center gap-1.5 focus:outline-hidden text-left"
                        >
                          <span className="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[10px] font-black bg-white shrink-0">
                            {checked ? '✓' : ''}
                          </span>
                          <span className="text-[8.5px] font-bold text-slate-800 leading-tight">
                            {mode === 'Others' ? 'Others (Please specify)' : mode}
                          </span>
                        </button>
                        {mode === 'Others' && checked && (
                          <input
                            type="text"
                            placeholder="Please specify"
                            disabled={panelMode !== 'fill'}
                            value={formFields.howGetToClcOthers || ''}
                            onChange={(e) => setFormFields({...formFields, howGetToClcOthers: e.target.value})}
                            className="border-b border-dashed border-slate-800 bg-transparent focus:outline-none focus:border-blue-600 font-mono text-[8.5px] w-56 h-4 px-1 font-bold"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Question 3 */}
              <div className="pt-1">
                <span className="font-bold text-slate-800 block mb-1.5">
                  3. Please provide the specific day and time you can be at your Learning Center:
                </span>
                <div className="border border-slate-700 rounded-xs overflow-hidden">
                  <table className="w-full border-collapse text-center bg-white text-[8px]">
                    <thead>
                      <tr className="bg-slate-55 border-b border-slate-700 select-none text-slate-800 font-black uppercase text-[7.5px]">
                        <th className="py-1 border-r border-slate-700 w-[14.28%]">Monday</th>
                        <th className="py-1 border-r border-slate-700 w-[14.28%]">Tuesday</th>
                        <th className="py-1 border-r border-slate-700 w-[14.28%]">Wednesday</th>
                        <th className="py-1 border-r border-slate-700 w-[14.28%]">Thursday</th>
                        <th className="py-1 border-r border-slate-700 w-[14.28%]">Friday</th>
                        <th className="py-1 border-r border-slate-700 w-[14.28%]">Saturday</th>
                        <th className="py-1 w-[14.28%]">Sunday</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="font-bold">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, dIdx) => {
                          const isDropdownDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day);
                          return (
                            <td key={day} className={`h-12 p-0.5 relative align-top ${dIdx < 6 ? 'border-r border-slate-700' : ''}`}>
                              {panelMode === 'fill' ? (
                                isDropdownDay ? (
                                  <div className="flex flex-col h-full justify-between items-stretch">
                                    <select
                                      value={formFields.clcDaysAvailability[day] || ''}
                                      onChange={(e) => handleDayTimeChange(day, e.target.value)}
                                      className="w-full text-[7.5px] font-black uppercase bg-sky-50 border-b border-dashed border-slate-350 outline-none text-slate-900 py-[1px] focus:bg-sky-100"
                                    >
                                      <option value="">- SELECT -</option>
                                      <option value="8:00 AM TO 3:00 PM">8:00 AM TO 3:00 PM</option>
                                      <option value="8:00 AM TO 12:00 PM">8:00 AM TO 12:00 PM</option>
                                      <option value="1:00 PM TO 3:00 PM">1:00 PM TO 3:00 PM</option>
                                      <option value="CUSTOM font-bold">OTHER...</option>
                                    </select>
                                    {((formFields.clcDaysAvailability[day] !== '8:00 AM TO 3:00 PM' &&
                                      formFields.clcDaysAvailability[day] !== '8:00 AM TO 12:00 PM' &&
                                      formFields.clcDaysAvailability[day] !== '1:00 PM TO 3:00 PM' &&
                                      formFields.clcDaysAvailability[day] !== '') || formFields.clcDaysAvailability[day] === 'CUSTOM') && (
                                        <input
                                          type="text"
                                          placeholder="..."
                                          value={formFields.clcDaysAvailability[day] === 'CUSTOM' ? '' : formFields.clcDaysAvailability[day]}
                                          onChange={(e) => handleDayTimeChange(day, e.target.value)}
                                          className="w-full text-center text-[7px] font-black uppercase bg-transparent outline-none py-0.5 border-t border-dotted border-slate-200"
                                        />
                                    )}
                                  </div>
                                ) : (
                                  <textarea
                                    placeholder="..."
                                    rows={2}
                                    maxLength={40}
                                    value={formFields.clcDaysAvailability[day] || ''}
                                    onChange={(e) => handleDayTimeChange(day, e.target.value)}
                                    className="w-full h-full resize-none bg-transparent outline-none text-center text-[8.5px] font-black uppercase placeholder-slate-300 leading-tight focus:bg-sky-50/50"
                                  />
                                )
                              ) : (
                                <span className="text-[8.5px] text-slate-800 block text-center font-black leading-snug break-all p-0.5">
                                  {formFields.clcDaysAvailability[day] || ''}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          {/* 5. Modalities checklist */}
          <div className="border border-slate-900 rounded-sm mb-3 bg-white">
            <div className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-wide px-3 py-1 select-none">
              5. If the school will implement other distance learning modalities aside from face-to-face instruction, what would you prefer for the learner:
            </div>
            
            <div className="p-3 text-[9px] font-semibold text-slate-800">
              <span className="text-[8px] text-slate-500 block uppercase font-extrabold mb-2 select-none tracking-wider">
                Check all that applies:
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-y-2 mt-1">
                {[
                  { value: 'Blended (Combination)', label: 'Blended (Combination)' },
                  { value: 'Homeschooling', label: 'Homeschooling' },
                  { value: 'Modular (Print)', label: 'Modular (Print)' },
                  { value: 'Radio-Based Television', label: 'Radio-Based Television' },
                  { value: 'Educational Television', label: 'Educational Television' },
                  { value: 'Modular (Digital)', label: 'Modular (Digital)' },
                  { value: 'Online', label: 'Online' }
                ].map(opt => {
                  const checked = formFields.preferredModalities.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={panelMode !== 'fill'}
                      onClick={() => handleModalityToggle(opt.value)}
                      className="flex items-center gap-1.5 text-left focus:outline-hidden"
                    >
                      <span className="w-3.5 h-3.5 border border-slate-800 flex items-center justify-center text-[10px] font-black bg-white shrink-0">
                        {checked ? '✓' : ''}
                      </span>
                      <span className="text-[8px] font-bold text-slate-800 leading-tight">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Privacy Consent Notice & Signatures */}
          <div className="p-3 text-[8.5px] leading-relaxed mb-4 bg-white relative">
            <p className="text-slate-800 text-[8.5px] sm:text-[9px] leading-relaxed mb-3 font-medium">
              I hereby certify that the information provided above is true and accurate to the best of my knowledge. I authorize the Department of Education to utilize the details specified above for the purpose of creating and/or updating his/her profile in the Learner Information System.
            </p>
            <p className="text-slate-800 text-[8.5px] sm:text-[9px] leading-relaxed font-medium">
              The information herein shall be treated as confidential in compliance with the Data Privacy Act of 2012.
            </p>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-300 rounded-sm">
              <span className="font-black text-slate-850 uppercase text-[9px] tracking-wider block">REMARKS:</span>
              <p className="text-slate-900 font-extrabold text-[10px] mt-1">
                {getRemarksForProgram(formFields.program, formFields.lastGradeCompleted)}
              </p>
            </div>

            {/* Signature fields row */}
            <div className="grid grid-cols-2 gap-12 mt-16 text-[9px]">
              {/* Left Column: Learner */}
              <div className="flex flex-col items-center">
                <div className="w-[240px] flex flex-col items-center">
                  {panelMode === 'fill' ? (
                    <input
                      type="text"
                      placeholder="Type Learner Name & Date"
                      value={formFields.learnerSignature}
                      onChange={(e) => setFormFields({...formFields, learnerSignature: e.target.value})}
                      className="w-full text-center bg-sky-50/70 focus:bg-sky-50 hover:bg-sky-50/90 outline-none text-[9px] font-black text-slate-900 px-1 py-0.5 rounded-xs uppercase placeholder-slate-400"
                    />
                  ) : (
                    <span className="font-mono text-[9.5px] uppercase font-black text-slate-900 text-center block min-h-[14px]">
                      {formFields.learnerSignature || ''}
                    </span>
                  )}
                  <div className="w-full h-[1px] bg-slate-900 mt-1 mb-1" />
                  <span className="text-slate-800 text-[8.5px] font-medium leading-normal select-none text-center">
                    Signature over Printed Name and Date
                  </span>
                </div>
              </div>

              {/* Right Column: Teacher / Facilitator */}
              <div className="flex flex-col items-center">
                <div className="w-[260px] flex flex-col items-center justify-end">
                  {panelMode === 'fill' ? (
                    <input
                      type="text"
                      placeholder="Type Instructor Name & Date"
                      value={formFields.teacherSignature}
                      onChange={(e) => setFormFields({...formFields, teacherSignature: e.target.value})}
                      className="w-full text-center bg-sky-50/70 focus:bg-sky-50 hover:bg-sky-50/90 outline-none text-[9px] font-black text-slate-900 px-1 py-0.5 rounded-xs uppercase placeholder-slate-400"
                    />
                  ) : (
                    <span className="font-mono text-[9.5px] uppercase font-black text-slate-900 text-center block min-h-[14px]">
                      {formFields.teacherSignature || ''}
                    </span>
                  )}
                  <div className="w-full h-[1px] bg-slate-900 mt-1 mb-1" />
                  <span className="text-slate-800 text-[8px] font-bold leading-tight select-none text-center block">
                    ALS Teacher/Community ALS Implementor/Learning Facilitator
                  </span>
                  <span className="text-slate-800 text-[7.5px] font-normal leading-normal select-none text-center block">
                    Signature over Printed Name and Date
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sheet Footer */}
          <div className="flex justify-between items-center text-[7.5px] text-slate-404 pt-2 border-t border-slate-200 font-bold select-none">
            <span>Alternative Learning System Portal Registry — Electronic Record No. AF2-{selectedLearnerId || 'NEW'}</span>
            <span className="font-extrabold text-slate-800">ALS AF2 SHEET • PAGE 2 OF 2</span>
          </div>

        </div>

      </form>

    </div>
  );
}
