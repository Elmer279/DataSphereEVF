import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Printer,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  X,
  Filter,
  GraduationCap,
  Calendar,
  User,
  MapPin,
  ClipboardList,
  Bookmark,
  BookOpen,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LearnerRecord, LearningCenter } from '../types';

export interface AF5ModuleRow {
  moduleTitle: string;
  learningStrand: string;
  dateStarted: string;
  dateCompleted: string;
  rating: 'Outstanding' | 'Very Satisfactory' | 'Satisfactory' | 'Fair' | 'Needs Improvement' | string;
  remarks: string;
}

export interface AF5Record {
  id: string;
  learnerId: string;
  learnerName: string;
  clc: string;
  clcCode: string;
  teacherName: string;
  calendarYear: string;
  programType: 'Basic Literacy Program (BLP)' | 'A&E Elementary' | 'A&E Junior High School' | string;
  status: 'Ongoing' | 'Completed' | 'Certified' | 'Withdrew' | 'Transferred';
  
  // Assessment Benchmarks
  ablPreTest: string;
  ablPostTest: string;
  fltPreTest: string;
  fltPostTest: string;
  rplEquivalentGrade: string;

  // Academic Summary
  generalAverage: number;
  remarks: string;
  
  // Signature authorities
  mobileTeacher: string;
  epsALS: string;
  dateIssued: string;

  // Custom module completion logs
  modulesList?: AF5ModuleRow[];
}

interface LearnersPermanentRecordAF5ViewProps {
  learners: LearnerRecord[];
  learningCenters: LearningCenter[];
  selectedDistrict?: string;
}

const DEFAULT_AF5_RECORDS: AF5Record[] = [
  {
    id: 'af5-001',
    learnerId: '1',
    learnerName: 'Cardo D. Dalisay',
    clc: 'Burot Community Learning Center',
    clcCode: '1234321',
    teacherName: 'Melody Anne B. Aquino',
    calendarYear: '2026',
    programType: 'A&E Junior High School',
    status: 'Certified',
    ablPreTest: '92% (Basic)',
    ablPostTest: '98% (Advanced)',
    fltPreTest: '82% (Intermediate)',
    fltPostTest: '95% (Highly Proficient)',
    rplEquivalentGrade: 'Grade 10 Equivalent',
    generalAverage: 93,
    remarks: 'Promoted to Senior High School. Outstanding leadership skills in vocational modules.',
    mobileTeacher: 'Melody Anne B. Aquino',
    epsALS: 'Dr. Susan Yap',
    dateIssued: '2026-06-15',
    modulesList: [
      { moduleTitle: 'LS 1: Communication Skills (Filipino) - Pagsulat ng Sanaysay', learningStrand: 'LS1 Filipino', dateStarted: '2026-01-10', dateCompleted: '2026-02-05', rating: 'Outstanding', remarks: 'Excellent essays' },
      { moduleTitle: 'LS 1: Communication Skills (English) - Reading Comprehension', learningStrand: 'LS1 English', dateStarted: '2026-01-12', dateCompleted: '2026-02-18', rating: 'Very Satisfactory', remarks: 'Fluent speaker' },
      { moduleTitle: 'LS 2: Scientific Literacy - Understanding Ecosystems', learningStrand: 'LS2 Science', dateStarted: '2026-02-20', dateCompleted: '2026-03-15', rating: 'Satisfactory', remarks: 'Good project work' },
      { moduleTitle: 'LS 3: Mathematical Literacy - Business Math Basics', learningStrand: 'LS3 Math', dateStarted: '2026-02-22', dateCompleted: '2026-04-10', rating: 'Outstanding', remarks: 'Perfect score in assessments' },
      { moduleTitle: 'LS 6: Digital Citizenship - Safe Internet Use & Tools', learningStrand: 'LS6 Digital', dateStarted: '2026-04-15', dateCompleted: '2026-05-12', rating: 'Outstanding', remarks: 'Highly skilled' },
    ]
  },
  {
    id: 'af5-002',
    learnerId: '2',
    learnerName: 'Neri Naig',
    clc: 'Burot Community Learning Center',
    clcCode: '1234321',
    teacherName: 'Melody Anne B. Aquino',
    calendarYear: '2026',
    programType: 'A&E Junior High School',
    status: 'Completed',
    ablPreTest: '80% (Basic)',
    ablPostTest: '91% (Advanced)',
    fltPreTest: '75% (Intermediate)',
    fltPostTest: '89% (Proficient)',
    rplEquivalentGrade: 'Grade 9 Equivalent',
    generalAverage: 88,
    remarks: 'Eligible for A&E Certification Exam. Active participation in culinary modules.',
    mobileTeacher: 'Melody Anne B. Aquino',
    epsALS: 'Dr. Susan Yap',
    dateIssued: '2026-06-20',
    modulesList: [
      { moduleTitle: 'LS 1: Communication Skills (Filipino) - Panitikan', learningStrand: 'LS1 Filipino', dateStarted: '2026-01-10', dateCompleted: '2026-02-08', rating: 'Very Satisfactory', remarks: 'Creative in assignments' },
      { moduleTitle: 'LS 3: Mathematical Literacy - Geometry & Area calculations', learningStrand: 'LS3 Math', dateStarted: '2026-02-15', dateCompleted: '2026-03-30', rating: 'Satisfactory', remarks: 'Hardworking learner' },
      { moduleTitle: 'LS 4: Life & Career Skills - Entrepreneurship Mindset', learningStrand: 'LS4 Career', dateStarted: '2026-04-01', dateCompleted: '2026-05-10', rating: 'Outstanding', remarks: 'Built a practical micro-business plan' }
    ]
  }
];

export function LearnersPermanentRecordAF5View({ learners, learningCenters, selectedDistrict }: LearnersPermanentRecordAF5ViewProps) {
  const [af5Records, setAf5Records] = useState<AF5Record[]>(() => {
    const saved = localStorage.getItem('tcsd_learner_af5_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse AF5 records from cache, resetting to defaults", e);
      }
    }
    return DEFAULT_AF5_RECORDS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [programFilter, setProgramFilter] = useState('All');
  const [clcFilter, setClcFilter] = useState('All');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'profile' | 'benchmarks' | 'modules'>('profile');

  // Printing state
  const [printRecord, setPrintRecord] = useState<AF5Record | null>(null);

  // Form Field states
  const [formLearnerId, setFormLearnerId] = useState('manual');
  const [formLearnerName, setFormLearnerName] = useState('');
  const [formClc, setFormClc] = useState('');
  const [formClcCode, setFormClcCode] = useState('');
  const [formTeacherName, setFormTeacherName] = useState('');
  const [formCalendarYear, setFormCalendarYear] = useState('2026');
  const [formProgramType, setFormProgramType] = useState('A&E Junior High School');
  const [formStatus, setFormStatus] = useState<'Ongoing' | 'Completed' | 'Certified' | 'Withdrew' | 'Transferred'>('Ongoing');
  
  const [formAblPreTest, setFormAblPreTest] = useState('85%');
  const [formAblPostTest, setFormAblPostTest] = useState('90%');
  const [formFltPreTest, setFormFltPreTest] = useState('80%');
  const [formFltPostTest, setFormFltPostTest] = useState('88%');
  const [formRplEquivalentGrade, setFormRplEquivalentGrade] = useState('Junior High School Level');
  const [formGeneralAverage, setFormGeneralAverage] = useState(85);
  const [formRemarks, setFormRemarks] = useState('');
  const [formMobileTeacher, setFormMobileTeacher] = useState('');
  const [formEpsALS, setFormEpsALS] = useState('Dr. Susan Yap');
  const [formDateIssued, setFormDateIssued] = useState('2026-06-28');

  // Dynamic modules builder
  const [formModules, setFormModules] = useState<AF5ModuleRow[]>([]);
  const [newModTitle, setNewModTitle] = useState('');
  const [newModStrand, setNewModStrand] = useState('LS1 Filipino');
  const [newModStart, setNewModStart] = useState('2026-01-10');
  const [newModComplete, setNewModComplete] = useState('2026-02-15');
  const [newModRating, setNewModRating] = useState('Outstanding');
  const [newModRemarks, setNewModRemarks] = useState('Completed successfully');

  // Sync back to local storage
  useEffect(() => {
    localStorage.setItem('tcsd_learner_af5_records', JSON.stringify(af5Records));
  }, [af5Records]);

  // Handle setting CLC Code automatically when a CLC is selected
  useEffect(() => {
    const selectedClcObj = learningCenters.find(c => c.name === formClc);
    if (selectedClcObj) {
      setFormClcCode(selectedClcObj.code || '');
      setFormTeacherName(selectedClcObj.teacher || '');
      setFormMobileTeacher(selectedClcObj.teacher || '');
    }
  }, [formClc, learningCenters]);

  // Handle setting learner fields automatically when a registered learner is selected
  useEffect(() => {
    if (formLearnerId !== 'manual') {
      const found = learners.find(l => l.id === formLearnerId);
      if (found) {
        setFormLearnerName(`${found.firstName} ${found.lastName}`);
        if (found.clcName) {
          setFormClc(found.clcName);
        }
      }
    }
  }, [formLearnerId, learners]);

  const handleAddModule = () => {
    if (!newModTitle.trim()) return;
    const newMod: AF5ModuleRow = {
      moduleTitle: newModTitle,
      learningStrand: newModStrand,
      dateStarted: newModStart,
      dateCompleted: newModComplete,
      rating: newModRating,
      remarks: newModRemarks
    };
    setFormModules([...formModules, newMod]);
    setNewModTitle('');
    setNewModRemarks('Completed successfully');
  };

  const handleRemoveModule = (index: number) => {
    setFormModules(formModules.filter((_, i) => i !== index));
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormLearnerId('manual');
    setFormLearnerName('');
    setFormClc(learningCenters[0]?.name || '');
    setFormClcCode(learningCenters[0]?.code || '');
    setFormTeacherName(learningCenters[0]?.teacher || '');
    setFormCalendarYear('2026');
    setFormProgramType('A&E Junior High School');
    setFormStatus('Ongoing');
    setFormAblPreTest('85%');
    setFormAblPostTest('90%');
    setFormFltPreTest('80%');
    setFormFltPostTest('88%');
    setFormRplEquivalentGrade('Junior High School Level');
    setFormGeneralAverage(85);
    setFormRemarks('');
    setFormMobileTeacher(learningCenters[0]?.teacher || '');
    setFormEpsALS('Dr. Susan Yap');
    setFormDateIssued('2026-06-28');
    setFormModules([]);
    
    setActiveFormTab('profile');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: AF5Record) => {
    setEditingId(rec.id);
    setFormLearnerId(rec.learnerId);
    setFormLearnerName(rec.learnerName);
    setFormClc(rec.clc);
    setFormClcCode(rec.clcCode);
    setFormTeacherName(rec.teacherName);
    setFormCalendarYear(rec.calendarYear);
    setFormProgramType(rec.programType);
    setFormStatus(rec.status);
    setFormAblPreTest(rec.ablPreTest);
    setFormAblPostTest(rec.ablPostTest);
    setFormFltPreTest(rec.fltPreTest);
    setFormFltPostTest(rec.fltPostTest);
    setFormRplEquivalentGrade(rec.rplEquivalentGrade);
    setFormGeneralAverage(rec.generalAverage);
    setFormRemarks(rec.remarks);
    setFormMobileTeacher(rec.mobileTeacher);
    setFormEpsALS(rec.epsALS);
    setFormDateIssued(rec.dateIssued);
    setFormModules(rec.modulesList || []);

    setActiveFormTab('profile');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLearnerName.trim()) return;

    const recordData: AF5Record = {
      id: editingId || `af5-${Date.now()}`,
      learnerId: formLearnerId,
      learnerName: formLearnerName,
      clc: formClc,
      clcCode: formClcCode,
      teacherName: formTeacherName,
      calendarYear: formCalendarYear,
      programType: formProgramType,
      status: formStatus,
      ablPreTest: formAblPreTest,
      ablPostTest: formAblPostTest,
      fltPreTest: formFltPreTest,
      fltPostTest: formFltPostTest,
      rplEquivalentGrade: formRplEquivalentGrade,
      generalAverage: Number(formGeneralAverage),
      remarks: formRemarks,
      mobileTeacher: formMobileTeacher,
      epsALS: formEpsALS,
      dateIssued: formDateIssued,
      modulesList: formModules
    };

    if (editingId) {
      setAf5Records(af5Records.map(r => r.id === editingId ? recordData : r));
    } else {
      setAf5Records([...af5Records, recordData]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this Learner\'s Permanent Record (AF5)?')) {
      setAf5Records(af5Records.filter(r => r.id !== id));
    }
  };

  const filteredRecords = useMemo(() => {
    return af5Records.filter(rec => {
      const matchSearch = rec.learnerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rec.clc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rec.teacherName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || rec.status === statusFilter;
      const matchProgram = programFilter === 'All' || rec.programType === programFilter;
      const matchClc = clcFilter === 'All' || rec.clc === clcFilter;
      return matchSearch && matchStatus && matchProgram && matchClc;
    });
  }, [af5Records, searchTerm, statusFilter, programFilter, clcFilter]);

  // Unique lists for filters
  const availableClcs = useMemo(() => {
    const list = new Set(af5Records.map(r => r.clc));
    return Array.from(list);
  }, [af5Records]);

  const handlePrint = (rec: AF5Record) => {
    setPrintRecord(rec);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="relative space-y-6">
      
      {/* Print View Wrapper */}
      {printRecord && (
        <div className="hidden print:block fixed inset-0 bg-white z-50 p-8 text-black font-serif overflow-y-auto" style={{ fontSize: '11px', lineHeight: '1.4' }}>
          
          {/* Official Letterhead */}
          <div className="text-center space-y-1 border-b-2 border-black pb-4 mb-5">
            <div className="flex justify-between items-center px-8">
              <img src="https://lh3.googleusercontent.com/d/1cGaJXvEpivgZMUr9QTMO0rhB2MbJnPhz" alt="DEPED Logo" className="w-14 h-14 object-contain" />
              <div>
                <p className="uppercase tracking-wider font-extrabold text-sm">Republic of the Philippines</p>
                <p className="uppercase tracking-wider text-xs font-semibold">Department of Education</p>
                <p className="uppercase text-xs font-bold font-sans tracking-wide text-blue-900">Alternative Learning System (ALS)</p>
                <p className="text-sm font-black font-sans uppercase mt-1">LEARNER'S PERMANENT RECORD (ALS FORM 5)</p>
              </div>
              <img src="https://lh3.googleusercontent.com/d/1cGaJXvEpivgZMUr9QTMO0rhB2MbJnPhz" alt="ALS Logo" className="w-14 h-14 object-contain opacity-0" />
            </div>
          </div>

          {/* Core Profile Blocks */}
          <div className="grid grid-cols-2 gap-4 border border-black p-3 rounded-lg mb-4 bg-slate-50/10">
            <div className="space-y-1">
              <p><strong>Learner Name:</strong> <span className="underline uppercase font-bold text-xs">{printRecord.learnerName}</span></p>
              <p><strong>Community Learning Center (CLC):</strong> <span className="underline font-medium">{printRecord.clc}</span></p>
              <p><strong>CLC Code:</strong> <span className="underline">{printRecord.clcCode}</span></p>
              <p><strong>District Coordinator/Teacher:</strong> <span className="underline">{printRecord.teacherName}</span></p>
            </div>
            <div className="space-y-1">
              <p><strong>Program Type:</strong> <span className="underline font-bold text-blue-900">{printRecord.programType}</span></p>
              <p><strong>Calendar Year:</strong> <span className="underline">{printRecord.calendarYear}</span></p>
              <p><strong>Completion Status:</strong> <span className="underline font-extrabold text-xs uppercase">{printRecord.status}</span></p>
              <p><strong>Date Generated:</strong> <span className="underline">{printRecord.dateIssued}</span></p>
            </div>
          </div>

          {/* Assessment Benchmarks Table */}
          <div className="mb-4">
            <h2 className="font-extrabold text-xs uppercase border-b border-black pb-1 mb-2 font-sans text-blue-950">1. National Assessment Benchmarks</h2>
            <table className="w-full border-collapse border border-black text-left">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-black p-1.5 text-[10px]">Assessment Tool / Desk</th>
                  <th className="border border-black p-1.5 text-[10px]">Pre-Test Result / Score</th>
                  <th className="border border-black p-1.5 text-[10px]">Post-Test Result / Score</th>
                  <th className="border border-black p-1.5 text-[10px]">Equivalency / Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1.5 font-semibold">Assessment for Basic Literacy (ABL)</td>
                  <td className="border border-black p-1.5">{printRecord.ablPreTest}</td>
                  <td className="border border-black p-1.5">{printRecord.ablPostTest}</td>
                  <td className="border border-black p-1.5">Completer Baseline Entry</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 font-semibold">Functional Literacy Test (FLT)</td>
                  <td className="border border-black p-1.5">{printRecord.fltPreTest}</td>
                  <td className="border border-black p-1.5">{printRecord.fltPostTest}</td>
                  <td className="border border-black p-1.5">Advanced Cognitive Performance</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 font-semibold">Recognition of Prior Learning (RPL)</td>
                  <td className="border border-black p-1.5">Form 1-4 Complete</td>
                  <td className="border border-black p-1.5">Approved Portfolio Credits</td>
                  <td className="border border-black p-1.5 font-bold">{printRecord.rplEquivalentGrade}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Core Modules Completed */}
          <div className="mb-5">
            <h2 className="font-extrabold text-xs uppercase border-b border-black pb-1 mb-2 font-sans text-blue-950">2. Record of Completed Learning Modules</h2>
            <table className="w-full border-collapse border border-black text-left">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-black p-1.5 text-[10px] w-1/12">No.</th>
                  <th className="border border-black p-1.5 text-[10px] w-5/12">Module / Topic Title</th>
                  <th className="border border-black p-1.5 text-[10px] w-2/12">Learning Strand</th>
                  <th className="border border-black p-1.5 text-[10px] w-2/12">Duration Dates</th>
                  <th className="border border-black p-1.5 text-[10px] w-1/12 text-center">Rating</th>
                  <th className="border border-black p-1.5 text-[10px] w-2/12">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {printRecord.modulesList && printRecord.modulesList.length > 0 ? (
                  printRecord.modulesList.map((m, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-1 text-center">{idx + 1}</td>
                      <td className="border border-black p-1 font-semibold">{m.moduleTitle}</td>
                      <td className="border border-black p-1">{m.learningStrand}</td>
                      <td className="border border-black p-1 text-[9px]">{m.dateStarted} to {m.dateCompleted}</td>
                      <td className="border border-black p-1 text-center font-bold text-xs">{m.rating === 'Outstanding' ? 'O' : m.rating === 'Very Satisfactory' ? 'VS' : 'S'}</td>
                      <td className="border border-black p-1 text-[9.5px]">{m.remarks}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="border border-black p-4 text-center text-slate-500 italic">No module completion logs attached to this permanent record.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Academic average & signature authority blocks */}
          <div className="mt-8 grid grid-cols-2 gap-8 pt-6 border-t border-black">
            <div className="space-y-4">
              <p><strong>General Average Rating:</strong> <span className="font-extrabold text-sm underline">{printRecord.generalAverage}%</span></p>
              <p><strong>Teacher's Final Recommendation & Remarks:</strong></p>
              <p className="italic underline p-2 bg-slate-50 rounded text-xs">{printRecord.remarks || 'Learner is highly recommended for promotion and A&E certification.'}</p>
            </div>
            
            <div className="space-y-6 pt-2">
              <div className="text-center space-y-1">
                <p className="font-bold underline uppercase">{printRecord.mobileTeacher}</p>
                <p className="text-[9px] uppercase tracking-wide text-slate-600 font-sans">ALS Mobile Teacher (Signature Over Printed Name)</p>
              </div>

              <div className="text-center space-y-1 pt-4">
                <p className="font-bold underline uppercase">{printRecord.epsALS}</p>
                <p className="text-[9px] uppercase tracking-wide text-slate-600 font-sans">Education Program Specialist II - ALS</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setPrintRecord(null)}
            className="print:hidden absolute top-4 right-4 bg-red-600 text-white font-black px-4 py-2 rounded-xl text-xs hover:bg-red-700 shadow-md cursor-pointer transition-all"
          >
            ← Close Print Mode
          </button>
        </div>
      )}

      {/* Screen Header View card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-slate-200/90 rounded-3xl shadow-3xs print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#002B6D]/5 border border-[#002B6D]/10 rounded-full flex items-center justify-center text-[#002B6D] shadow-3xs shrink-0">
            <FolderOpen className="w-6 h-6 text-[#002B6D]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              Learner's Permanent Record (AF5)
            </h1>
            <p className="text-xs text-slate-500 font-medium font-semibold">
              Official DepEd Alternative Learning System Form 5 transcripts, module completion logs, and assessment summaries.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#002B6D] hover:bg-[#002B6D]/90 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs tracking-tight shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create New AF5 Record
        </button>
      </div>

      {/* Interactive statistics / cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wide">Total Transcripts</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{af5Records.length}</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5" /></div>
        </div>
        
        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wide">Certified Completers</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {af5Records.filter(r => r.status === 'Certified').length}
            </p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wide">Under A&E JHS</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">
              {af5Records.filter(r => r.programType.includes('JHS')).length}
            </p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wide">Average Rating</p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {af5Records.length > 0 
                ? `${Math.round(af5Records.reduce((sum, r) => sum + r.generalAverage, 0) / af5Records.length)}%` 
                : '0%'}
            </p>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center"><Bookmark className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Control Panel / Filtering Bar */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-3xs flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search learner name or CLC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#002B6D]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="Certified">Certified</option>
            <option value="Withdrew">Withdrew</option>
            <option value="Transferred">Transferred</option>
          </select>

          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none"
          >
            <option value="All">All Programs</option>
            <option value="Basic Literacy Program (BLP)">BLP</option>
            <option value="A&E Elementary">A&E Elementary</option>
            <option value="A&E Junior High School">A&E JHS</option>
          </select>

          {availableClcs.length > 0 && (
            <select
              value={clcFilter}
              onChange={(e) => setClcFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none"
            >
              <option value="All">All CLCs</option>
              {availableClcs.map((clcName, i) => (
                <option key={i} value={clcName}>{clcName}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Table Directory */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-2xs print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-200/80 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-4 pl-6">Learner Record & Program</th>
                <th className="p-4">Community Learning Center</th>
                <th className="p-4 text-center">Abl Pre/Post</th>
                <th className="p-4 text-center">Flt Pre/Post</th>
                <th className="p-4 text-center">Modules Log</th>
                <th className="p-4 text-center">Rating</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-extrabold text-slate-900 text-sm">{rec.learnerName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{rec.programType} • CY {rec.calendarYear}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{rec.clc}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Teacher: {rec.teacherName}</p>
                    </td>
                    <td className="p-4 text-center text-[11px]">
                      <span className="text-slate-500">{rec.ablPreTest || '-'}</span>
                      <ChevronRight className="w-3 h-3 inline mx-1 text-slate-400" />
                      <span className="font-bold text-emerald-600">{rec.ablPostTest || '-'}</span>
                    </td>
                    <td className="p-4 text-center text-[11px]">
                      <span className="text-slate-500">{rec.fltPreTest || '-'}</span>
                      <ChevronRight className="w-3 h-3 inline mx-1 text-slate-400" />
                      <span className="font-bold text-indigo-600">{rec.fltPostTest || '-'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">
                        {rec.modulesList?.length || 0} Modules
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-black text-blue-900">{rec.generalAverage}%</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1.5 rounded-full text-[10px] font-black tracking-tight ${
                        rec.status === 'Certified' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                        rec.status === 'Completed' ? 'bg-blue-50 border border-blue-200 text-blue-700' :
                        rec.status === 'Ongoing' ? 'bg-amber-50 border border-amber-200 text-amber-700' :
                        'bg-slate-100 border border-slate-200 text-slate-500'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePrint(rec)}
                          title="Print official AF5 form"
                          className="p-1.5 hover:bg-[#E3EDFA] rounded-lg text-[#002B6D] transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          title="Edit AF5 Record"
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          title="Delete"
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                    No matching ALS Permanent Records (AF5) found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Input / Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:hidden">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              
              {/* Modal Header */}
              <div className="p-5.5 bg-[#002B6D] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-5.5 h-5.5 text-amber-300" />
                  <div>
                    <h2 className="text-md font-black tracking-tight">
                      {editingId ? 'Edit Learner\'s Permanent Record (AF5)' : 'Create New Learner\'s Permanent Record (AF5)'}
                    </h2>
                    <p className="text-[10px] text-blue-100 font-semibold">Tarlac City Sub-District ALS Core Transcript Form</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Navigation Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 p-2">
                <button
                  type="button"
                  onClick={() => setActiveFormTab('profile')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeFormTab === 'profile' ? 'bg-[#002B6D] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  1. Profile & Setup
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('benchmarks')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeFormTab === 'benchmarks' ? 'bg-[#002B6D] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  2. Assessment Benchmarks
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab('modules')}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeFormTab === 'modules' ? 'bg-[#002B6D] text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  3. Modules Log ({formModules.length})
                </button>
              </div>

              {/* Modal Body / Scroll area */}
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* TAB 1: PROFILE & SETUP */}
                {activeFormTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Link to Registered Learner</label>
                        <select
                          value={formLearnerId}
                          onChange={(e) => setFormLearnerId(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                        >
                          <option value="manual">-- Input manually / not in list --</option>
                          {learners.map((l, index) => (
                            <option key={`${l.id || 'opt'}-${index}`} value={l.id}>{l.firstName} {l.lastName} ({l.recordNumber || 'Enrolled'})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Learner Name (Last, First Middle)</label>
                        <input
                          type="text"
                          required
                          value={formLearnerName}
                          onChange={(e) => setFormLearnerName(e.target.value)}
                          placeholder="e.g. Cardo Dalisay"
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Select CLC</label>
                        <select
                          value={formClc}
                          onChange={(e) => setFormClc(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                        >
                          {learningCenters.map((lc, i) => (
                            <option key={i} value={lc.name}>{lc.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">CLC Code</label>
                        <input
                          type="text"
                          required
                          value={formClcCode}
                          onChange={(e) => setFormClcCode(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 text-slate-500 cursor-not-allowed"
                          readOnly
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">ALS Program Type</label>
                        <select
                          value={formProgramType}
                          onChange={(e) => setFormProgramType(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                        >
                          <option value="Basic Literacy Program (BLP)">Basic Literacy Program (BLP)</option>
                          <option value="A&E Elementary">A&E Elementary</option>
                          <option value="A&E Junior High School">A&E Junior High School</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Calendar Year</label>
                        <input
                          type="text"
                          required
                          value={formCalendarYear}
                          onChange={(e) => setFormCalendarYear(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Current Status</label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                        >
                          <option value="Ongoing">Ongoing</option>
                          <option value="Completed">Completed</option>
                          <option value="Certified">Certified</option>
                          <option value="Withdrew">Withdrew</option>
                          <option value="Transferred">Transferred</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Date Issued</label>
                        <input
                          type="date"
                          required
                          value={formDateIssued}
                          onChange={(e) => setFormDateIssued(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                        />
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB 2: ASSESSMENT BENCHMARKS */}
                {activeFormTab === 'benchmarks' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-bold mb-2">Configure initial input scores / metrics from previous baseline diagnostic tests:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">ABL Pre-Test Score</label>
                        <input
                          type="text"
                          value={formAblPreTest}
                          onChange={(e) => setFormAblPreTest(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                          placeholder="e.g. 85%"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">ABL Post-Test Score</label>
                        <input
                          type="text"
                          value={formAblPostTest}
                          onChange={(e) => setFormAblPostTest(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                          placeholder="e.g. 94%"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">FLT Pre-Test Score</label>
                        <input
                          type="text"
                          value={formFltPreTest}
                          onChange={(e) => setFormFltPreTest(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                          placeholder="e.g. 80%"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">FLT Post-Test Score</label>
                        <input
                          type="text"
                          value={formFltPostTest}
                          onChange={(e) => setFormFltPostTest(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                          placeholder="e.g. 90%"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">RPL Approved Grade Equivalent</label>
                        <input
                          type="text"
                          value={formRplEquivalentGrade}
                          onChange={(e) => setFormRplEquivalentGrade(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                          placeholder="e.g. Grade 10 Equivalent"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">General Average Rating (%)</label>
                        <input
                          type="number"
                          required
                          min={50}
                          max={100}
                          value={formGeneralAverage}
                          onChange={(e) => setFormGeneralAverage(Number(e.target.value))}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Teacher's Recommendations & Special Remarks</label>
                        <textarea
                          rows={3}
                          value={formRemarks}
                          onChange={(e) => setFormRemarks(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                          placeholder="Enter academic summary..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">ALS Mobile Teacher</label>
                        <input
                          type="text"
                          value={formMobileTeacher}
                          onChange={(e) => setFormMobileTeacher(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Education Program Specialist (EPS)</label>
                        <input
                          type="text"
                          value={formEpsALS}
                          onChange={(e) => setFormEpsALS(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#002B6D]"
                        />
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB 3: MODULES LOG */}
                {activeFormTab === 'modules' && (
                  <div className="space-y-4">
                    
                    {/* Add module helper inline box */}
                    <div className="border border-slate-200/95 p-4 rounded-2xl space-y-3.5 bg-slate-50/50">
                      <p className="text-[10px] text-[#002B6D] uppercase font-black tracking-wide">Attach New Module Completion Record</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Module / Topic Title"
                          value={newModTitle}
                          onChange={(e) => setNewModTitle(e.target.value)}
                          className="p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none"
                        />
                        <select
                          value={newModStrand}
                          onChange={(e) => setNewModStrand(e.target.value)}
                          className="p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none"
                        >
                          <option value="LS1 Filipino">LS 1 Communication (Filipino)</option>
                          <option value="LS1 English">LS 1 Communication (English)</option>
                          <option value="LS2 Science">LS 2 Scientific Literacy</option>
                          <option value="LS3 Math">LS 3 Mathematical Literacy</option>
                          <option value="LS4 Career">LS 4 Life & Career Skills</option>
                          <option value="LS5 Society">LS 5 Understanding Self & Society</option>
                          <option value="LS6 Digital">LS 6 Digital Citizenship</option>
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={newModStart}
                            onChange={(e) => setNewModStart(e.target.value)}
                            className="p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none w-1/2"
                          />
                          <input
                            type="date"
                            value={newModComplete}
                            onChange={(e) => setNewModComplete(e.target.value)}
                            className="p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none w-1/2"
                          />
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={newModRating}
                            onChange={(e) => setNewModRating(e.target.value)}
                            className="p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none w-1/2"
                          >
                            <option value="Outstanding">Outstanding</option>
                            <option value="Very Satisfactory">Very Satisfactory</option>
                            <option value="Satisfactory">Satisfactory</option>
                            <option value="Fair">Fair</option>
                            <option value="Needs Improvement">Needs Improvement</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Remarks"
                            value={newModRemarks}
                            onChange={(e) => setNewModRemarks(e.target.value)}
                            className="p-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white focus:outline-none w-1/2"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddModule}
                        className="bg-[#002B6D] text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 hover:bg-[#002B6D]/90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Module to AF5
                      </button>
                    </div>

                    {/* Modules Directory List */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Current Linked Modules ({formModules.length})</p>
                      {formModules.length > 0 ? (
                        formModules.map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50">
                            <div>
                              <p className="font-extrabold text-xs text-slate-800">{m.moduleTitle}</p>
                              <p className="text-[9px] text-slate-400 font-bold mt-0.5">{m.learningStrand} • {m.dateStarted} to {m.dateCompleted}</p>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-[10px] font-black uppercase tracking-tight bg-blue-100/80 text-blue-700 px-2 py-1 rounded-md">
                                {m.rating}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveModule(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 italic text-xs text-center py-6">No learning modules attached yet.</p>
                      )}
                    </div>

                  </div>
                )}

              </form>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-semibold">
                  {activeFormTab === 'profile' && 'Proceed to Section 2: Assessment Benchmarks'}
                  {activeFormTab === 'benchmarks' && 'Proceed to Section 3: Learning Modules Log'}
                  {activeFormTab === 'modules' && 'Double check inputs before saving AF5 Record!'}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4.5 py-2 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-650 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  
                  {activeFormTab !== 'modules' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeFormTab === 'profile') setActiveFormTab('benchmarks');
                        else if (activeFormTab === 'benchmarks') setActiveFormTab('modules');
                      }}
                      className="px-4.5 py-2 bg-[#002B6D] text-white rounded-xl text-xs font-extrabold hover:bg-[#002B6D]/90"
                    >
                      Next Section
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSave}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md"
                    >
                      Save AF5 Record
                    </button>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
