import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Printer,
  ChevronRight,
  TrendingUp,
  Award,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  X,
  BookOpen,
  Filter,
  BarChart4,
  Calendar,
  Check,
  Briefcase,
  History,
  ClipboardList,
  GraduationCap,
  Sparkles,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LearnerRecord, LearningCenter } from '../types';

export interface RPLAwardRow {
  award: string;
  gained: string;
  strand: string;
  competency: string;
}

export interface RPLTrainingRow {
  title: string;
  from: string;
  to: string;
  evidence: string;
  skillsGained: string;
  strand: string;
  competency: string;
}

export interface RPLWorkRow {
  description: string;
  employer: string;
  from: string;
  to: string;
  task: string;
  gained: string;
  strand: string;
  competency: string;
}

export interface RPLAssessment {
  id: string;
  learnerId: string;
  learnerName: string;
  clc: string;
  teacherName: string;
  dateAssessed: string;
  // Form 1: Life Experiences Status
  form1Status: 'completed' | 'pending' | 'under-review';
  form1Details: string;
  // Form 2: Record of Training Status
  form2Status: 'completed' | 'pending' | 'under-review';
  form2TrainingHours: number;
  // Form 3: Summary of Work History
  form3Status: 'completed' | 'pending' | 'under-review';
  form3YearsExp: number;
  // Form 4: Checklist of Skills score (percentage across learning strands)
  form4Score: number; // 0-100%
  // Summary outputs
  approvedCredits: number;
  readinessStatus: 'Ready for FLT' | 'Needs Intervention' | 'Highly Recommended';
  remarks: string;

  // New fields for digital PDF conversion
  alsProgram?: string;
  awardsList?: RPLAwardRow[];
  trainingsList?: RPLTrainingRow[];
  worksList?: RPLWorkRow[];
  learnerSignatureName?: string;
  learnerSignatureDate?: string;
  parentSignatureName?: string;
  parentSignatureDate?: string;
  implementerSignatureName?: string;
  implementerSignatureDate?: string;
}

interface RecognitionOfPriorLearningViewProps {
  learners: LearnerRecord[];
  learningCenters: LearningCenter[];
  mode?: 'assessment' | 'records';
  selectedDistrict?: string;
}

// Initial dummy records for RPL matching the existing default learners
const DEFAULT_RPL_RECORDS: RPLAssessment[] = [
  {
    id: 'rpl-001',
    learnerId: '1',
    learnerName: 'Cardo D. Dalisay',
    clc: 'San Roque Community Learning Center',
    teacherName: 'Mrs. Maria Elena Santos',
    dateAssessed: '2026-05-18',
    form1Status: 'completed',
    form1Details: 'Extensive agricultural self-employment & barangay security officer experience.',
    form2Status: 'completed',
    form2TrainingHours: 40,
    form3Status: 'completed',
    form3YearsExp: 8,
    form4Score: 88,
    approvedCredits: 20,
    readinessStatus: 'Highly Recommended',
    remarks: 'Demonstrates exceptional leadership and technical skills. Ready for accelerated JHS program.'
  },
  {
    id: 'rpl-002',
    learnerId: '2',
    learnerName: 'Juan dela Cruz Jr.',
    clc: 'Tibag Community Learning Center',
    teacherName: 'Mr. Juan dela Cruz Jr.',
    dateAssessed: '2026-05-20',
    form1Status: 'completed',
    form1Details: 'Apprentice mechanic helper at municipal garage with rich technical background.',
    form2Status: 'under-review',
    form2TrainingHours: 12,
    form3Status: 'completed',
    form3YearsExp: 3,
    form4Score: 72,
    approvedCredits: 12,
    readinessStatus: 'Ready for FLT',
    remarks: 'Practical carpentry and machine skills are highly developed. Recommend immediate FLT diagnostic.'
  },
  {
    id: 'rpl-003',
    learnerId: '3',
    learnerName: 'Evelyn Perez',
    clc: 'Maliwalo Community Learning Center',
    teacherName: 'Ms. Evelyn Perez',
    dateAssessed: '2026-05-22',
    form1Status: 'pending',
    form1Details: 'Home manager with informal tailoring & embroidery small-scale sales experience.',
    form2Status: 'pending',
    form2TrainingHours: 0,
    form3Status: 'pending',
    form3YearsExp: 0,
    form4Score: 45,
    approvedCredits: 5,
    readinessStatus: 'Needs Intervention',
    remarks: 'Strong interest in tailoring but needs foundational literacy/numeracy support.'
  }
];

export function RecognitionOfPriorLearningView({ learners, learningCenters, mode: initialMode = 'records' }: RecognitionOfPriorLearningViewProps) {
  const [activeViewMode, setActiveViewMode] = useState<'records' | 'assessment'>(initialMode);
  const [rplRecords, setRplRecords] = useState<RPLAssessment[]>(() => {
    const saved = localStorage.getItem('tcsd_rpl_evaluations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse RPL records. Seeding defaults.", e);
      }
    }
    return DEFAULT_RPL_RECORDS;
  });

  useEffect(() => {
    localStorage.setItem('tcsd_rpl_evaluations', JSON.stringify(rplRecords));
  }, [rplRecords]);

  // Form / Creation State
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [formDate, setFormDate] = useState('2026-06-12');
  const [formTeacher, setFormTeacher] = useState('');
  const [formClc, setFormClc] = useState('');
  const [formProgram, setFormProgram] = useState('Elementary'); // ALS Program status
  
  // Table rows for parts I, II, III
  const [awardsRows, setAwardsRows] = useState<RPLAwardRow[]>(() =>
    Array.from({ length: 4 }, () => ({ award: '', gained: '', strand: '', competency: '' }))
  );
  const [trainingsRows, setTrainingsRows] = useState<RPLTrainingRow[]>(() =>
    Array.from({ length: 5 }, () => ({ title: '', from: '', to: '', evidence: '', skillsGained: '', strand: '', competency: '' }))
  );
  const [worksRows, setWorksRows] = useState<RPLWorkRow[]>(() =>
    Array.from({ length: 8 }, () => ({ description: '', employer: '', from: '', to: '', task: '', gained: '', strand: '', competency: '' }))
  );

  // Signatures
  const [learnerSignatureName, setLearnerSignatureName] = useState('');
  const [learnerSignatureDate, setLearnerSignatureDate] = useState('');
  const [parentSignatureName, setParentSignatureName] = useState('');
  const [parentSignatureDate, setParentSignatureDate] = useState('');
  const [implementerSignatureName, setImplementerSignatureName] = useState('');
  const [implementerSignatureDate, setImplementerSignatureDate] = useState('');
  
  // RPL forms progress
  const [form1Status, setForm1Status] = useState<'completed' | 'pending' | 'under-review'>('completed');
  const [form1Details, setForm1Details] = useState('');
  const [form2Status, setForm2Status] = useState<'completed' | 'pending' | 'under-review'>('completed');
  const [form2TrainingHours, setForm2TrainingHours] = useState<number>(0);
  const [form3Status, setForm3Status] = useState<'completed' | 'pending' | 'under-review'>('completed');
  const [form3YearsExp, setForm3YearsExp] = useState<number>(0);
  
  // Form 4 self-rating competency score
  const [form4Score, setForm4Score] = useState<number>(75);
  const [approvedCredits, setApprovedCredits] = useState<number>(10);
  const [readinessStatus, setReadinessStatus] = useState<'Ready for FLT' | 'Needs Intervention' | 'Highly Recommended'>('Ready for FLT');
  const [remarks, setRemarks] = useState('');
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClc, setFilterClc] = useState('All');
  const [filterReadiness, setFilterReadiness] = useState('All');

  // Currently editing RPL id
  const [editingId, setEditingId] = useState<string | null>(null);

  // Certificate showcase modal
  const [selectedCertificateRecord, setSelectedCertificateRecord] = useState<RPLAssessment | null>(null);

  // Sync CLC / Teacher when learner is selected in Form
  const handleLearnerChange = (id: string) => {
    setSelectedLearnerId(id);
    const chosen = learners.find(l => l.id === id);
    if (chosen) {
      setFormClc(chosen.clcName || '');
      setFormTeacher(chosen.teacher || '');
    }
  };

  // Switch to assessment screen for creating a new record
  const startNewAssessment = () => {
    setEditingId(null);
    setSelectedLearnerId('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTeacher('');
    setFormClc('');
    setFormProgram('Elementary');
    
    setAwardsRows(Array.from({ length: 4 }, () => ({ award: '', gained: '', strand: '', competency: '' })));
    setTrainingsRows(Array.from({ length: 5 }, () => ({ title: '', from: '', to: '', evidence: '', skillsGained: '', strand: '', competency: '' })));
    setWorksRows(Array.from({ length: 8 }, () => ({ description: '', employer: '', from: '', to: '', task: '', gained: '', strand: '', competency: '' })));

    setLearnerSignatureName('');
    setLearnerSignatureDate('');
    setParentSignatureName('');
    setParentSignatureDate('');
    setImplementerSignatureName('');
    setImplementerSignatureDate('');

    setForm1Status('completed');
    setForm1Details('');
    setForm2Status('completed');
    setForm2TrainingHours(0);
    setForm3Status('completed');
    setForm3YearsExp(0);
    setForm4Score(75);
    setApprovedCredits(10);
    setReadinessStatus('Ready for FLT');
    setRemarks('');
    setFormStep(1);
    setActiveViewMode('assessment');
  };

  // Load a record for editing
  const loadRecordForEdit = (record: RPLAssessment) => {
    setEditingId(record.id);
    setSelectedLearnerId(record.learnerId);
    setFormDate(record.dateAssessed);
    setFormTeacher(record.teacherName);
    setFormClc(record.clc);
    setFormProgram(record.alsProgram || 'Elementary');

    setAwardsRows(record.awardsList && record.awardsList.length > 0 
      ? record.awardsList 
      : Array.from({ length: 4 }, () => ({ award: '', gained: '', strand: '', competency: '' }))
    );
    setTrainingsRows(record.trainingsList && record.trainingsList.length > 0 
      ? record.trainingsList 
      : Array.from({ length: 5 }, () => ({ title: '', from: '', to: '', evidence: '', skillsGained: '', strand: '', competency: '' }))
    );
    setWorksRows(record.worksList && record.worksList.length > 0 
      ? record.worksList 
      : Array.from({ length: 8 }, () => ({ description: '', employer: '', from: '', to: '', task: '', gained: '', strand: '', competency: '' }))
    );

    setLearnerSignatureName(record.learnerSignatureName || '');
    setLearnerSignatureDate(record.learnerSignatureDate || '');
    setParentSignatureName(record.parentSignatureName || '');
    setParentSignatureDate(record.parentSignatureDate || '');
    setImplementerSignatureName(record.implementerSignatureName || '');
    setImplementerSignatureDate(record.implementerSignatureDate || '');

    setForm1Status(record.form1Status);
    setForm1Details(record.form1Details);
    setForm2Status(record.form2Status);
    setForm2TrainingHours(record.form2TrainingHours);
    setForm3Status(record.form3Status);
    setForm3YearsExp(record.form3YearsExp);
    setForm4Score(record.form4Score);
    setApprovedCredits(record.approvedCredits);
    setReadinessStatus(record.readinessStatus);
    setRemarks(record.remarks);
    setFormStep(1);
    setActiveViewMode('assessment');
  };

  // Submit assessment form
  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLearnerId) {
      alert("Please select a learner.");
      return;
    }

    const learnerName = learners.find(l => l.id === selectedLearnerId)?.name || 'Unknown Learner';

    const payload: RPLAssessment = {
      id: editingId || `rpl-${Date.now()}`,
      learnerId: selectedLearnerId,
      learnerName,
      clc: formClc,
      teacherName: formTeacher,
      dateAssessed: formDate,
      form1Status,
      form1Details,
      form2Status,
      form2TrainingHours,
      form3Status,
      form3YearsExp,
      form4Score,
      approvedCredits,
      readinessStatus,
      remarks,

      alsProgram: formProgram,
      awardsList: awardsRows,
      trainingsList: trainingsRows,
      worksList: worksRows,
      learnerSignatureName,
      learnerSignatureDate,
      parentSignatureName,
      parentSignatureDate,
      implementerSignatureName,
      implementerSignatureDate
    };

    if (editingId) {
      setRplRecords(prev => prev.map(r => r.id === editingId ? payload : r));
    } else {
      setRplRecords(prev => [payload, ...prev]);
    }

    setEditingId(null);
    setActiveViewMode('records');
  };

  // Delete evaluation
  const handleDeleteRecord = (id: string) => {
    if (confirm("Are you sure you want to delete this RPL evaluation record?")) {
      setRplRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  // Filtered Records List
  const filteredRecords = useMemo(() => {
    return rplRecords.filter(r => {
      const matchSearch = r.learnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.clc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.remarks.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClc = filterClc === 'All' || r.clc === filterClc;
      const matchReadiness = filterReadiness === 'All' || r.readinessStatus === filterReadiness;

      return matchSearch && matchClc && matchReadiness;
    });
  }, [rplRecords, searchQuery, filterClc, filterReadiness]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const totalCount = rplRecords.length;
    const avgCredits = totalCount > 0 ? Math.round(rplRecords.reduce((sum, r) => sum + r.approvedCredits, 0) / totalCount) : 0;
    const completedProgress = rplRecords.filter(r => r.form1Status === 'completed' && r.form2Status === 'completed' && r.form3Status === 'completed').length;
    const readyForFlt = rplRecords.filter(r => r.readinessStatus === 'Highly Recommended' || r.readinessStatus === 'Ready for FLT').length;

    return { totalCount, avgCredits, completedProgress, readyForFlt };
  }, [rplRecords]);

  return (
    <div className="w-full space-y-6" id="rpl-view-root">
      
      {/* 1. Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="bg-[#E3EDFA] text-[#002B6D] p-2.5 rounded-2xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Recognition of Prior Learning (RPL)</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium font-sans">
                Evaluation of Life Experience, Record of Trainings, and Learner Skill Checklists (RPL Forms 1-4)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveViewMode('records')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold rounded-xl transition ${
              activeViewMode === 'records'
                ? 'bg-[#E3EDFA] text-[#002B6D]'
                : 'text-slate-500 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            Learners' Prior Records (RPL)
          </button>
          <button
            onClick={startNewAssessment}
            className={`flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
              activeViewMode === 'assessment' && !editingId
                ? 'bg-[#002B6D] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-350 shadow-3xs'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            New RPL Evaluation
          </button>
        </div>
      </div>

      {activeViewMode === 'records' ? (
        <>
          {/* 2. Key Metrics Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-3xs hover:border-[#002B6D]/30 transition duration-300">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <ClipboardList className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total RPL Evaluated</p>
                <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">{stats.totalCount} Learners</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-3xs hover:border-[#002B6D]/30 transition duration-300">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Avg Prior Credits Granted</p>
                <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">{stats.avgCredits} credits</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-3xs hover:border-[#002B6D]/30 transition duration-300">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Form 1-3 Completed</p>
                <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">{stats.completedProgress} profiles</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-3xs hover:border-[#002B6D]/30 transition duration-300">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Highly Prepped for FLT</p>
                <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">{stats.readyForFlt} candidates</h3>
              </div>
            </div>
          </div>

          {/* 3. Filter and Table Layout */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs overflow-hidden">
            {/* Control Filters Area */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
              <div className="relative w-full md:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by learner name, CLC, or remarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D] transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                <div className="flex items-center gap-1.5 min-w-[150px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">CLC Center:</span>
                  <select
                    value={filterClc}
                    onChange={(e) => setFilterClc(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D] transition"
                  >
                    <option value="All">All Centers</option>
                    {Array.from(new Set(rplRecords.map(r => r.clc))).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 min-w-[150px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">Status:</span>
                  <select
                    value={filterReadiness}
                    onChange={(e) => setFilterReadiness(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D] transition"
                  >
                    <option value="All">All Readiness</option>
                    <option value="Highly Recommended">Highly Recommended</option>
                    <option value="Ready for FLT">Ready for FLT</option>
                    <option value="Needs Intervention">Needs Intervention</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table or Empty Slate */}
            {filteredRecords.length === 0 ? (
              <div className="p-12 text-center">
                <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No RPL evaluations found</h4>
                <p className="text-xs text-slate-400 mt-1">Adjust your filters or register a new evaluation using the "New RPL Evaluation" button.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-4 px-5">Learner Name</th>
                      <th className="py-4 px-5">Coordinating Hub / CLC</th>
                      <th className="py-4 px-3 text-center">RPL Docs (F1-F3)</th>
                      <th className="py-4 px-3 text-center">Competency (Form 4)</th>
                      <th className="py-4 px-4 text-center">Approved Credits</th>
                      <th className="py-4 px-4 text-center">Evaluation Rating</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                    {filteredRecords.map((record, index) => {
                      const computedReadinessBg = record.readinessStatus === 'Highly Recommended'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : record.readinessStatus === 'Ready for FLT'
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100';

                      return (
                        <tr key={`${record.id || 'rec'}-${index}`} className="hover:bg-slate-50/55 transition duration-150">
                          <td className="py-4 px-5">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-800 text-[13px]">{record.learnerName}</span>
                              <span className="text-[10px] text-slate-400 font-sans mt-0.5">Assessed: {record.dateAssessed}</span>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex flex-col">
                              <span className="text-slate-800 text-[12px]">{record.clc}</span>
                              <span className="text-[10px] text-slate-450 font-medium font-mono">Assessor: {record.teacherName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className="inline-flex gap-1.5">
                              {/* Form 1 */}
                              <span
                                title="RPL Form 1: Documentation of Life Experiences"
                                className={`w-6 h-6 rounded-lg text-[9px] font-bold flex items-center justify-center border ${
                                  record.form1Status === 'completed'
                                    ? 'bg-green-50 text-green-700 border-green-150'
                                    : record.form1Status === 'under-review'
                                      ? 'bg-amber-50 text-amber-700 border-amber-150'
                                      : 'bg-slate-50 text-slate-400 border-slate-100'
                                }`}
                              >
                                F1
                              </span>
                              {/* Form 2 */}
                              <span
                                title={`RPL Form 2: Record of Training (${record.form2TrainingHours} Hours)`}
                                className={`w-6 h-6 rounded-lg text-[9px] font-bold flex items-center justify-center border ${
                                  record.form2Status === 'completed'
                                    ? 'bg-green-50 text-green-700 border-green-150'
                                    : record.form2Status === 'under-review'
                                      ? 'bg-amber-50 text-amber-700 border-amber-150'
                                      : 'bg-slate-50 text-slate-400 border-slate-100'
                                }`}
                              >
                                F2
                              </span>
                              {/* Form 3 */}
                              <span
                                title={`RPL Form 3: Summary of Work History (${record.form3YearsExp} Years Exp)`}
                                className={`w-6 h-6 rounded-lg text-[9px] font-bold flex items-center justify-center border ${
                                  record.form3Status === 'completed'
                                    ? 'bg-green-50 text-green-700 border-green-150'
                                    : record.form3Status === 'under-review'
                                      ? 'bg-amber-50 text-amber-700 border-amber-150'
                                      : 'bg-slate-50 text-slate-400 border-slate-100'
                                }`}
                              >
                                F3
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-[#002B6D] h-full" style={{ width: `${record.form4Score}%` }} />
                              </div>
                              <span className="font-semibold text-slate-700 text-[11px]">{record.form4Score}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-xs font-bold text-slate-800">
                              {record.approvedCredits} credits
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2 py-1 leading-none rounded-full text-[10px] font-bold border ${computedReadinessBg}`}>
                              {record.readinessStatus}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedCertificateRecord(record)}
                                className="p-1.5 text-slate-400 hover:text-[#002B6D] hover:bg-slate-100 rounded-lg transition"
                                title="View RPL Certificate"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => loadRecordForEdit(record)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                                title="Edit Evaluation"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(record.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Evaluation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Evaluation Workspace Wizard */
        <form onSubmit={handleSaveAssessment} className="bg-white rounded-3xl border border-slate-200/80 shadow-3xs overflow-hidden p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {editingId ? "Update RPL Evaluation Record" : "Digital Evaluation Form (RPL)"}
              </h2>
              <p className="text-xs text-slate-400 font-medium">Record equivalent credits and performance across RPL Forms 1 to 4.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setEditingId(null); setActiveViewMode('records'); }}
                className="px-3.5 py-1.5 border border-slate-200/75 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#002B6D] text-white hover:bg-[#002B6D]/90 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {editingId ? "Save Changes" : "Save Evaluation"}
              </button>
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              type="button"
              onClick={() => setFormStep(1)}
              className={`flex-1 py-3 text-center text-xs font-extrabold transition border-b-2 -mb-[2px] cursor-pointer ${
                formStep === 1
                  ? 'border-[#002B6D] text-[#002B6D]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Page 1: Awards & Trainings (I & II)
            </button>
            <button
              type="button"
              onClick={() => setFormStep(2)}
              className={`flex-1 py-3 text-center text-xs font-extrabold transition border-b-2 -mb-[2px] cursor-pointer ${
                formStep === 2
                  ? 'border-[#002B6D] text-[#002B6D]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Page 2: Work History & Signatures (III)
            </button>
            <button
              type="button"
              onClick={() => setFormStep(3)}
              className={`flex-1 py-3 text-center text-xs font-extrabold transition border-b-2 -mb-[2px] cursor-pointer ${
                formStep === 3
                  ? 'border-[#002B6D] text-[#002B6D]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Page 3: Evaluation Verdict & Credits (F1 - F4)
            </button>
          </div>

          <div className="space-y-6">
            {formStep === 1 && (
              <div className="border border-slate-200 rounded-3xl p-6 bg-slate-50/35 relative space-y-6 shadow-2xs">
                <div className="text-center space-y-1">
                  <h2 className="text-sm font-black text-slate-800 tracking-tight">RECOGNITION OF PRIOR LEARNING (RPL) FORM</h2>
                  <p className="text-[10px] text-[#002B6D] font-extrabold uppercase tracking-widest bg-blue-50/75 inline-block px-3 py-1 rounded-full border border-blue-100 pb-1">
                    see the attached file: RPL_Form_060726
                  </p>
                </div>

                {/* Header fields: Learner Name, CLC, Program */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-dashed border-slate-200 pb-5">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-450 tracking-wider mb-1 block">Name of Learner <span className="text-rose-500">*</span></label>
                    <select
                      value={selectedLearnerId}
                      onChange={(e) => handleLearnerChange(e.target.value)}
                      disabled={!!editingId}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#002B6D] bg-white disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
                      required
                    >
                      <option value="">-- Choose Learner Profile --</option>
                      {learners.map((l, index) => (
                        <option key={`${l.id || 'opt'}-${index}`} value={l.id}>
                          {l.name} {l.program ? `(${l.program})` : ''}
                        </option>
                      ))}
                    </select>
                    <span className="text-[8px] text-slate-400 font-semibold mt-0.5 block italic">(First Name, Middle Initial, Last Name, Extension Name)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-450 tracking-wider mb-1 block">Community Learning Center (CLC) <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={formClc}
                      onChange={(e) => setFormClc(e.target.value)}
                      placeholder="E.g. San Roque CLC"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-[#002B6D]"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-slate-450 tracking-wider mb-1 block">ALS Program <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={formProgram}
                      onChange={(e) => setFormProgram(e.target.value)}
                      placeholder="E.g. Basic Literacy / Junior High School"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-[#002B6D]"
                      required
                    />
                  </div>
                </div>

                {/* Part I: Awards Received */}
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-black text-[#002B6D] uppercase tracking-wide">Part I. Awards Received (Mga Natanggap na Parangal)</h4>
                    <p className="text-[10px] text-slate-500 italic font-semibold mt-1 block">
                      Direction: Write down the various awards you received. (Isulat ang mga parangal na iyong natanggap)
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-3xs">
                    <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                      <thead className="bg-[#002B6D] text-white">
                        <tr className="text-[9px] font-black uppercase tracking-wider">
                          <th className="p-3 border-r border-[#002B6D] w-1/3">Awards (Mga Parangal)<br/><span className="text-[8px] font-normal lowercase">(Awards received from school, work, community, religious group, organization, and others)</span></th>
                          <th className="p-3 border-r border-[#002B6D] w-1/3">Learning/s Gained (Mga Natutuhan)</th>
                          <th className="p-3 w-1/3 text-center">Recognized Learning Competency/ies<br/><span className="text-[8px] font-normal lowercase">(for the ALS Implementer)</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {awardsRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 animate-fade-in">
                            <td className="p-2 border-r border-slate-100">
                              <textarea
                                rows={2}
                                value={row.award}
                                onChange={(e) => {
                                  const updated = [...awardsRows];
                                  updated[idx].award = e.target.value;
                                  setAwardsRows(updated);
                                }}
                                placeholder="Describe award received..."
                                className="w-full bg-slate-50/45 p-1.5 text-xs text-slate-850 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none"
                              />
                            </td>
                            <td className="p-2 border-r border-slate-100">
                              <textarea
                                rows={2}
                                value={row.gained}
                                onChange={(e) => {
                                  const updated = [...awardsRows];
                                  updated[idx].gained = e.target.value;
                                  setAwardsRows(updated);
                                }}
                                placeholder="What did you learn from this..."
                                className="w-full bg-slate-50/45 p-1.5 text-xs text-slate-850 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none"
                              />
                            </td>
                            <td className="p-2 space-y-1.5">
                              <div className="flex gap-1.5 items-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase w-14">Strand:</span>
                                <input
                                  type="text"
                                  value={row.strand}
                                  onChange={(e) => {
                                    const updated = [...awardsRows];
                                    updated[idx].strand = e.target.value;
                                    setAwardsRows(updated);
                                  }}
                                  placeholder="e.g. LS1 Communication..."
                                  className="w-full bg-slate-50/45 px-2 py-1 text-xs text-slate-800 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none font-bold"
                                />
                              </div>
                              <div className="flex gap-1.5 items-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase w-14">Comp No:</span>
                                <input
                                  type="text"
                                  value={row.competency}
                                  onChange={(e) => {
                                    const updated = [...awardsRows];
                                    updated[idx].competency = e.target.value;
                                    setAwardsRows(updated);
                                  }}
                                  placeholder="e.g. Competency No. 1.2..."
                                  className="w-full bg-slate-50/45 px-2 py-1 text-xs text-slate-800 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none font-bold"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[8px] text-[#002B6D] font-bold italic text-right">(Use additional sheets, if necessary.)</p>
                </div>

                {/* Part II: Record of Training/s */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-black text-[#002B6D] uppercase tracking-wide">Part II. Record of Training/s (Talaan ng Pagsasanay)</h4>
                    <p className="text-[10px] text-slate-500 italic font-semibold mt-1 block">
                      Directions: Write the details of your previous or present training/s in the table below. (Isulat ang mga detalye ng iyong mga nakaraan o kasalukuyang pagsasanay sa talahanayan sa ibaba.)
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-3xs">
                    <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                      <thead className="bg-[#002B6D] text-white">
                        <tr className="text-[9px] font-black uppercase tracking-wider">
                          <th className="p-3 border-r border-[#002B6D] w-1/5" rowSpan={2}>Title of the Training/s<br/><span className="text-[8px] font-normal lowercase">(Pamagat ng Pagsasanay)</span></th>
                          <th className="p-2 border-r border-[#002B6D] text-center" colSpan={2}>Dates (Petsa)</th>
                          <th className="p-3 border-r border-[#002B6D] w-1/5" rowSpan={2}>Evidence/s<br/><span className="text-[8px] font-normal lowercase">(Katibayan)</span></th>
                          <th className="p-3 border-r border-[#002B6D] w-1/5" rowSpan={2}>Skill/s Gained<br/><span className="text-[8px] font-normal lowercase">(Kasanayang Natutuhan)</span></th>
                          <th className="p-3 w-1/5 text-center" rowSpan={2}>Recognized Learning Competency/ies<br/><span className="text-[8px] font-normal lowercase">(for the ALS Implementer)</span></th>
                        </tr>
                        <tr className="text-[8px] font-black uppercase tracking-wider bg-[#001D4B]">
                          <th className="p-1 border-r border-[#001D4B] text-center w-24">From (Mula)</th>
                          <th className="p-1 border-r border-[#001D4B] text-center w-24">To (Hanggang)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {trainingsRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 animate-fade-in">
                            <td className="p-2 border-r border-slate-100">
                              <input
                                type="text"
                                value={row.title}
                                onChange={(e) => {
                                  const updated = [...trainingsRows];
                                  updated[idx].title = e.target.value;
                                  setTrainingsRows(updated);
                                }}
                                placeholder="Training/Course Title..."
                                className="w-full bg-slate-50/45 px-2 py-1.5 text-xs text-slate-850 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none"
                              />
                            </td>
                            <td className="p-1.5 border-r border-slate-100">
                              <input
                                type="text"
                                value={row.from}
                                onChange={(e) => {
                                  const updated = [...trainingsRows];
                                  updated[idx].from = e.target.value;
                                  setTrainingsRows(updated);
                                }}
                                placeholder="MM/YY"
                                className="w-full bg-slate-50/45 text-center py-1 text-xs text-slate-850 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none"
                              />
                            </td>
                            <td className="p-1.5 border-r border-slate-100">
                              <input
                                type="text"
                                value={row.to}
                                onChange={(e) => {
                                  const updated = [...trainingsRows];
                                  updated[idx].to = e.target.value;
                                  setTrainingsRows(updated);
                                }}
                                placeholder="MM/YY"
                                className="w-full bg-slate-50/45 text-center py-1 text-xs text-slate-850 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none"
                              />
                            </td>
                            <td className="p-2 border-r border-slate-100">
                              <input
                                type="text"
                                value={row.evidence}
                                onChange={(e) => {
                                  const updated = [...trainingsRows];
                                  updated[idx].evidence = e.target.value;
                                  setTrainingsRows(updated);
                                }}
                                placeholder="e.g. Certificate, Photo..."
                                className="w-full bg-slate-50/45 px-2 py-1.5 text-xs text-slate-850 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none"
                              />
                            </td>
                            <td className="p-2 border-r border-slate-100">
                              <input
                                type="text"
                                value={row.skillsGained}
                                onChange={(e) => {
                                  const updated = [...trainingsRows];
                                  updated[idx].skillsGained = e.target.value;
                                  setTrainingsRows(updated);
                                }}
                                placeholder="Key hands-on skills..."
                                className="w-full bg-slate-50/45 px-2 py-1.5 text-xs text-slate-850 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none"
                              />
                            </td>
                            <td className="p-2 space-y-1.5">
                              <div className="flex gap-1.5 items-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase w-14">Strand:</span>
                                <input
                                  type="text"
                                  value={row.strand}
                                  onChange={(e) => {
                                    const updated = [...trainingsRows];
                                    updated[idx].strand = e.target.value;
                                    setTrainingsRows(updated);
                                  }}
                                  placeholder="e.g. LS6 Digital..."
                                  className="w-full bg-slate-50/45 px-2 py-1 text-xs text-slate-800 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none font-bold"
                                />
                              </div>
                              <div className="flex gap-1.5 items-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase w-14">Comp No:</span>
                                <input
                                  type="text"
                                  value={row.competency}
                                  onChange={(e) => {
                                    const updated = [...trainingsRows];
                                    updated[idx].competency = e.target.value;
                                    setTrainingsRows(updated);
                                  }}
                                  placeholder="e.g. Comp No. 3.1..."
                                  className="w-full bg-slate-50/45 px-2 py-1 text-xs text-slate-800 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none font-bold"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[8px] text-[#002B6D] font-bold italic text-right">(Use additional sheets, if necessary.)</p>
                </div>
              </div>
            )}

            {formStep === 2 && (
              <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/35 relative space-y-6 shadow-2xs">
                {/* Part III: Work Experience/s */}
                <div className="space-y-3">
                  <div className="border-b border-slate-200 pb-2">
                    <h4 className="text-sm font-black text-[#002B6D] uppercase tracking-wide">Part III. Work Experience/s (Karanasan sa Trabaho)</h4>
                    <p className="text-[10px] text-slate-500 italic font-semibold mt-1 block">
                      Directions: Write the details of your previous or present work/s in the table below. (Isulat ang mga detalye ng iyong mga nakaraan o kasalukuyang trabaho sa talahanayan sa ibaba.)
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-3xs">
                    <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                      <thead className="bg-[#002B6D] text-white">
                        <tr className="text-[9px] font-black uppercase tracking-wider">
                          <th className="p-3 border-r border-[#002B6D] w-[15%]" rowSpan={2}>Work Description<br/><span className="text-[8px] font-normal lowercase">(Paglalarawan ng Trabaho)</span></th>
                          <th className="p-3 border-r border-[#002B6D] w-[15%]" rowSpan={2}>Employer/s and Workplace/s<br/><span className="text-[8px] font-normal lowercase">(Pinagtrabahuhan)</span></th>
                          <th className="p-2 border-r border-[#002B6D] text-center" colSpan={2}>Dates (Petsa)</th>
                          <th className="p-3 border-r border-[#002B6D] w-[15%]" rowSpan={2}>Assigned Task/s<br/><span className="text-[8px] font-normal lowercase">(Nakatalagang Gawain)</span></th>
                          <th className="p-3 border-r border-[#002B6D] w-[15%]" rowSpan={2}>Learning/s Gained<br/><span className="text-[8px] font-normal lowercase">(Mga Natutuhan)</span></th>
                          <th className="p-3 w-1/5 text-center" rowSpan={2}>Recognized Learning Competency/ies<br/><span className="text-[8px] font-normal lowercase">(for the ALS Implementer)</span></th>
                        </tr>
                        <tr className="text-[8px] font-black uppercase tracking-wider bg-[#001D4B]">
                          <th className="p-1 border-r border-[#001D4B] text-center w-20">From (Mula)</th>
                          <th className="p-1 border-r border-[#001D4B] text-center w-20">To (Hanggang)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {worksRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 animate-fade-in">
                            <td className="p-2 border-r border-slate-100">
                              <input
                                type="text"
                                value={row.description}
                                onChange={(e) => {
                                  const updated = [...worksRows];
                                  updated[idx].description = e.target.value;
                                  setWorksRows(updated);
                                }}
                                placeholder="Job Title / Role..."
                                className="w-full bg-slate-50/45 px-2 py-1.5 text-xs text-slate-850 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none"
                              />
                            </td>
                            <td className="p-2 border-r border-slate-100">
                              <input
                                type="text"
                                value={row.employer}
                                onChange={(e) => {
                                  const updated = [...worksRows];
                                  updated[idx].employer = e.target.value;
                                  setWorksRows(updated);
                                }}
                                placeholder="Company / Workplace..."
                                className="w-full bg-slate-50/45 px-2 py-1.5 text-xs text-slate-850 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none"
                              />
                            </td>
                            <td className="p-1.5 border-r border-slate-100">
                              <input
                                type="text"
                                value={row.from}
                                onChange={(e) => {
                                  const updated = [...worksRows];
                                  updated[idx].from = e.target.value;
                                  setWorksRows(updated);
                                }}
                                placeholder="MM/YY"
                                className="w-full bg-slate-50/45 text-center py-1 text-xs text-slate-850 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none"
                              />
                            </td>
                            <td className="p-1.5 border-r border-slate-100">
                              <input
                                type="text"
                                value={row.to}
                                onChange={(e) => {
                                  const updated = [...worksRows];
                                  updated[idx].to = e.target.value;
                                  setWorksRows(updated);
                                }}
                                placeholder="MM/YY"
                                className="w-full bg-slate-50/45 text-center py-1 text-xs text-slate-850 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none"
                              />
                            </td>
                            <td className="p-2 border-r border-slate-100">
                              <input
                                type="text"
                                value={row.task}
                                onChange={(e) => {
                                  const updated = [...worksRows];
                                  updated[idx].task = e.target.value;
                                  setWorksRows(updated);
                                }}
                                placeholder="Assignments..."
                                className="w-full bg-slate-50/45 px-2 py-1.5 text-xs text-slate-850 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none"
                              />
                            </td>
                            <td className="p-2 border-r border-slate-100">
                              <input
                                type="text"
                                value={row.gained}
                                onChange={(e) => {
                                  const updated = [...worksRows];
                                  updated[idx].gained = e.target.value;
                                  setWorksRows(updated);
                                }}
                                placeholder="Practical skills..."
                                className="w-full bg-slate-50/45 px-2 py-1.5 text-xs text-slate-850 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none"
                              />
                            </td>
                            <td className="p-2 space-y-1.5">
                              <div className="flex gap-1.5 items-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase w-14">Strand:</span>
                                <input
                                  type="text"
                                  value={row.strand}
                                  onChange={(e) => {
                                    const updated = [...worksRows];
                                    updated[idx].strand = e.target.value;
                                    setWorksRows(updated);
                                  }}
                                  placeholder="e.g. LS4 Life & Career..."
                                  className="w-full bg-slate-50/45 px-2 py-1 text-xs text-slate-800 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none font-bold"
                                />
                              </div>
                              <div className="flex gap-1.5 items-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase w-14">Comp No:</span>
                                <input
                                  type="text"
                                  value={row.competency}
                                  onChange={(e) => {
                                    const updated = [...worksRows];
                                    updated[idx].competency = e.target.value;
                                    setWorksRows(updated);
                                  }}
                                  placeholder="e.g. Comp No. 2.1..."
                                  className="w-full bg-slate-50/45 px-2 py-1 text-xs text-slate-880 border border-slate-150 rounded-lg focus:bg-white focus:border-[#002B6D] outline-none font-bold"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[8px] text-[#002B6D] font-bold italic text-right">(Use additional sheets, if necessary.)</p>
                </div>

                {/* Signature Panel */}
                <div className="pt-6 border-t border-slate-200">
                  <h4 className="text-xs font-black text-[#002B6D] uppercase tracking-wider mb-4 border-b border-slate-100 pb-1 inline-block">Official Forms Verification & Signatures</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Learner Signature */}
                    <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">ALS Learner's Signature</p>
                      <div className="space-y-2">
                        <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Learner Sign-off Name</label>
                          <input
                            type="text"
                            value={learnerSignatureName}
                            onChange={(e) => setLearnerSignatureName(e.target.value)}
                            placeholder="Type Learner's name to sign"
                            className="w-full bg-white px-2.5 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:border-[#002B6D] outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Date Signed</label>
                          <input
                            type="text"
                            value={learnerSignatureDate}
                            onChange={(e) => setLearnerSignatureDate(e.target.value)}
                            placeholder="e.g. June 12, 2026"
                            className="w-full bg-white px-2.5 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:border-[#002B6D] outline-none"
                          />
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-400 italic font-medium leading-tight">Learner's Signature over Printed Name and Date</p>
                    </div>

                    {/* Parent Signature */}
                    <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Parent/Guardian Signature</p>
                      <div className="space-y-2">
                        <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Parent/Guardian Name</label>
                          <input
                            type="text"
                            value={parentSignatureName}
                            onChange={(e) => setParentSignatureName(e.target.value)}
                            placeholder="Type Parent/Guardian Name"
                            className="w-full bg-white px-2.5 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:border-[#002B6D] outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Date Signed</label>
                          <input
                            type="text"
                            value={parentSignatureDate}
                            onChange={(e) => setParentSignatureDate(e.target.value)}
                            placeholder="e.g. June 12, 2026"
                            className="w-full bg-white px-2.5 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:border-[#002B6D] outline-none"
                          />
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-400 italic font-medium leading-tight">(for minor and learner in special cases only)</p>
                    </div>

                    {/* Implementer Signature */}
                    <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">ALS Implementer Signature</p>
                      <div className="space-y-2">
                        <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Assessor / Implementer Name</label>
                          <input
                            type="text"
                            value={implementerSignatureName}
                            onChange={(e) => setImplementerSignatureName(e.target.value)}
                            placeholder="Type Teacher's name to sign"
                            className="w-full bg-white px-2.5 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:border-[#002B6D] outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Date Signed</label>
                          <input
                            type="text"
                            value={implementerSignatureDate}
                            onChange={(e) => setImplementerSignatureDate(e.target.value)}
                            placeholder="e.g. June 12, 2026"
                            className="w-full bg-white px-2.5 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:border-[#002B6D] outline-none"
                          />
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-400 italic font-medium leading-tight">ALS Implementer's Signature over Printed Name and Date</p>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {formStep === 3 && (
              <div className="space-y-6">
                <div className="bg-[#002B6D]/5 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 animate-pulse shrink-0" />
                  <div>
                    <p className="text-xs text-blue-800 font-extrabold uppercase tracking-wide">RPL Verification verdict (RPL Forms 1-4 Metrics)</p>
                    <p className="text-[11px] text-blue-600 font-medium">Please verify equivalent values and performance checkmarks to index and evaluate the learner's overall score.</p>
                  </div>
                </div>

                {/* Checklist from Form 1 to Form 4 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Form 1 Checklist */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between animate-fade-in">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center justify-center">F1</span>
                        RPL Form 1: Life Experiences
                      </h4>
                      <p className="text-[9px] text-slate-400 mt-1 font-medium">Evaluate document of milestones, achievements & skills.</p>
                    </div>
                    <div className="mt-3.5 space-y-2">
                      <select
                        value={form1Status}
                        onChange={(e) => setForm1Status(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white cursor-pointer"
                      >
                        <option value="completed">Completed / Approved</option>
                        <option value="under-review">Under Review</option>
                        <option value="pending">Pending Documents</option>
                      </select>
                      <textarea
                        value={form1Details}
                        onChange={(e) => setForm1Details(e.target.value)}
                        placeholder="Highlights of experiences: e.g. self-employment details..."
                        rows={2}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Form 2 Checklist */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between animate-fade-in">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center justify-center">F2</span>
                        RPL Form 2: Training History
                      </h4>
                      <p className="text-[9px] text-slate-400 mt-1 font-medium">Record certification or technical/vocational program hours.</p>
                    </div>
                    <div className="mt-3.5 space-y-2">
                      <select
                        value={form2Status}
                        onChange={(e) => setForm2Status(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white cursor-pointer"
                      >
                        <option value="completed">Verified / Approved</option>
                        <option value="under-review">Needs Verification</option>
                        <option value="pending">No Prior Trainings Listed</option>
                      </select>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="0"
                          value={form2TrainingHours}
                          onChange={(e) => setForm2TrainingHours(parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-center font-bold text-slate-700"
                        />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hours</span>
                      </div>
                    </div>
                  </div>

                  {/* Form 3 Checklist */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between animate-fade-in">
                    <div>
                      <h4 className="text-xs font-bold text-slate-705 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-bold flex items-center justify-center">F3</span>
                        RPL Form 3: Work History Summary
                      </h4>
                      <p className="text-[9px] text-slate-400 mt-1 font-medium">Evaluate years of active household, retail or manual labor exp.</p>
                    </div>
                    <div className="mt-3.5 space-y-2">
                      <select
                        value={form3Status}
                        onChange={(e) => setForm3Status(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white cursor-pointer"
                      >
                        <option value="completed">Verified / Employment Record Clear</option>
                        <option value="under-review">Under Interview/Validation</option>
                        <option value="pending">No formal/informal history sheets</option>
                      </select>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="0"
                          value={form3YearsExp}
                          onChange={(e) => setForm3YearsExp(parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-center font-bold text-slate-700"
                        />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Years</span>
                      </div>
                    </div>
                  </div>

                  {/* Form 4 Checklist */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between animate-fade-in">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center justify-center">F4</span>
                        RPL Form 4: Skills Checklist
                      </h4>
                      <p className="text-[9px] text-slate-400 mt-1 font-medium">Aggregate percentage level of competencies across LS1-6.</p>
                    </div>
                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Score Index:</span>
                        <span className="text-xs font-extrabold text-[#002B6D]">{form4Score}% Competency Match</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={form4Score}
                        onChange={(e) => setForm4Score(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#002B6D]"
                      />
                      <div className="flex justify-between text-[8px] font-bold text-slate-400">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Decisions and Remarks */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-[#002B6D] uppercase tracking-wider font-extrabold">Prior Learning Approved Decisions</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider mb-1 block">Approved Equivalency Credits Score</label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={approvedCredits}
                        onChange={(e) => setApprovedCredits(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D] font-bold text-slate-800 bg-white"
                      />
                      <p className="text-[9px] text-slate-400 mt-1 leading-normal font-medium text-slate-400">Select equivalent unit hours/credits granted to support fast-track module pathways (Max: 40 credits).</p>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-455 tracking-wider mb-1 block">RPL Readiness Classification</label>
                      <select
                        value={readinessStatus}
                        onChange={(e) => setReadinessStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#002B6D] text-slate-800 bg-white cursor-pointer"
                      >
                        <option value="Ready for FLT">Ready for FLT Diagnostics</option>
                        <option value="Highly Recommended">Highly Recommended for Fast Class Track</option>
                        <option value="Needs Intervention">Needs Foundational Intervention First</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider mb-1 block">Assessor's Comments & Custom Remarks</label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter professional details recommending placement pathways or module priorities for this learner."
                      rows={2}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-700"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls inside Form */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Form Sheet Navigation:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setFormStep(step as any)}
                    className={`w-5 h-5 rounded-lg text-[9px] font-bold flex items-center justify-center transition cursor-pointer ${
                      formStep === step
                        ? 'bg-[#002B6D] text-white'
                        : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {formStep > 1 && (
                <button
                  type="button"
                  onClick={() => setFormStep((formStep - 1) as any)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Previous Page
                </button>
              )}
              {formStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setFormStep((formStep + 1) as any)}
                  className="px-5 py-2 bg-[#002B6D] text-white rounded-xl text-xs font-bold hover:bg-[#002B6D]/90 shadow-sm transition cursor-pointer"
                >
                  Next Page
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#002B6D] text-white rounded-xl text-xs font-bold hover:bg-[#002B6D]/90 shadow-sm transition flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  {editingId ? "Save Changes" : "Save Evaluation"}
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {/* 4. Certificate Showcase / Printing Modal overlay */}
      <AnimatePresence>
        {selectedCertificateRecord && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border-4 border-double border-slate-200 max-w-2xl w-full p-8 shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => setSelectedCertificateRecord(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Traditional Seal / Design elements inside printed document */}
              <div className="border border-slate-150 p-6 rounded-2xl relative bg-linear-to-b from-amber-50/10 via-white to-amber-50/10">
                <div className="text-center space-y-2">
                  <span className="text-[11px] uppercase font-black tracking-widest text-[#002B6D]">Department of Education</span>
                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">ALTERNATIVE LEARNING SYSTEM</h3>
                  <p className="text-[10px] text-slate-450 uppercase font-semibold">Tarlac City Schools Division</p>
                  
                  <div className="w-32 h-0.5 bg-linear-to-r from-transparent via-[#002B6D] to-transparent mx-auto my-3" />
                  
                  <h2 className="text-lg font-black text-[#002B6D] italic font-serif">Certificate of RPL Assessment</h2>
                  
                  <p className="text-[11px] text-slate-500 italic mt-4 max-w-md mx-auto leading-relaxed">
                    This is to certify that documentation evaluation for Recognition of Prior Learning (RPL Forms 1-4) has been successfully verified for:
                  </p>

                  <h1 className="text-xl font-bold bg-linear-to-r from-slate-900 via-[#002B6D] to-slate-900 bg-clip-text text-transparent my-3">
                    {selectedCertificateRecord.learnerName}
                  </h1>

                  <p className="text-[11px] text-slate-500 mt-2">
                    Enrolled at <span className="font-bold text-slate-800">{selectedCertificateRecord.clc}</span>
                  </p>

                  <div className="grid grid-cols-3 gap-2 max-w-md mx-auto my-6 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <div>
                      <p className="text-[8px] uppercase font-bold text-slate-400">Total Approved Credits</p>
                      <h4 className="text-sm font-black text-slate-800">{selectedCertificateRecord.approvedCredits} credits</h4>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase font-bold text-slate-400">Form 4 Match Score</p>
                      <h4 className="text-sm font-black text-slate-800">{selectedCertificateRecord.form4Score}%</h4>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase font-bold text-slate-400">Classification</p>
                      <h4 className="text-xs font-black text-green-700">{selectedCertificateRecord.readinessStatus}</h4>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed text-left bg-white p-3 rounded-xl border border-dashed border-slate-200">
                    <strong>Evaluator Remarks:</strong> {selectedCertificateRecord.remarks || 'Recognized prior competencies matching baseline secondary education strands. Prior training credits transfer approved.'}
                  </p>

                  <div className="flex items-center justify-between mt-10 px-6">
                    <div className="text-left">
                      <div className="w-36 border-b border-slate-350 my-1 font-mono font-bold text-slate-800 text-[10px]">
                        {selectedCertificateRecord.teacherName}
                      </div>
                      <p className="text-[8px] uppercase font-bold text-slate-400">ALS Teacher / Assessor</p>
                    </div>

                    <div className="text-right">
                      <div className="w-36 border-b border-slate-350 my-1 font-mono font-bold text-slate-800 text-[10px]">
                        {selectedCertificateRecord.learnerName}
                      </div>
                      <p className="text-[8px] uppercase font-bold text-slate-400">ALS Learner Signature</p>
                    </div>
                  </div>

                  <div className="text-[8px] text-slate-400 mt-6 pt-4 border-t border-slate-100 text-center">
                    Authorized Document of DepEd Alternative Learning System. Printed on: {selectedCertificateRecord.dateAssessed}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pr-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#002B6D] text-white hover:bg-[#002B6D]/90 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Official Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
