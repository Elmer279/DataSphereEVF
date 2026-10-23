import React, { useState, useEffect, useMemo } from 'react';
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
  UserCheck,
  CheckCircle2,
  X,
  BookOpen,
  Filter,
  Calendar,
  Check,
  Briefcase,
  ClipboardList,
  Sparkles,
  Bookmark,
  ShieldAlert,
  Save,
  CheckSquare,
  BarChart2,
  ListPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LearnerRecord, LearningCenter } from '../types';

export interface ILAGoal {
  id: string;
  goalText: string;
  targetDate: string;
  strategy: string;
  status: 'Not Started' | 'In Progress' | 'Achieved';
}

export interface RLPEntry {
  id: string;
  learningStrand: 'LS1 English' | 'LS1 Filipino' | 'LS2 Scientific Thinking' | 'LS3 Mathematics' | 'LS4 Life & Career' | 'LS5 Self & Society' | 'LS6 Digital Citizenship';
  moduleTitle: string;
  preScore: number;
  postScore: number;
  maxScore: number;
  dateCompleted: string;
  remarks: string;
}

export interface IndividualLearningAgreement {
  id: string;
  learnerId: string;
  learnerName: string;
  clc: string;
  teacherName: string;
  dateAgreed: string;
  goals: ILAGoal[];
  rlpEntries: RLPEntry[];
  learnerSignatureName?: string;
  learnerSignatureDate?: string;
  facilitatorSignatureName?: string;
  facilitatorSignatureDate?: string;
}

interface IndividualLearningAgreementViewProps {
  learners: LearnerRecord[];
  learningCenters: LearningCenter[];
  selectedDistrict?: string;
}

// Initial default agreements matching seeded learners
const DEFAULT_ILA_RECORDS: IndividualLearningAgreement[] = [
  {
    id: 'ila-001',
    learnerId: '1',
    learnerName: 'Cardo D. Dalisay',
    clc: 'San Roque Community Learning Center',
    teacherName: 'Mrs. Maria Elena Santos',
    dateAgreed: '2026-05-18',
    goals: [
      { id: 'g-1', goalText: 'Pass the Accreditation and Equivalency (A&E) Test for Junior High School', targetDate: '2026-12-15', strategy: 'Attend CLC sessions regularly, study self-paced modules, and complete all FLT/RPL tasks.', status: 'In Progress' },
      { id: 'g-2', goalText: 'Improve English reading comprehension and writing skills', targetDate: '2026-09-30', strategy: 'Focus on LS1 English modules and complete written activities.', status: 'Achieved' },
      { id: 'g-3', goalText: 'Learn basic spreadsheet operations and digital security safety', targetDate: '2026-11-20', strategy: 'Attend the computer literacy sessions in San Roque CLC.', status: 'Not Started' }
    ],
    rlpEntries: [
      { id: 'e-1', learningStrand: 'LS1 English', moduleTitle: 'Understanding Subject-Verb Agreement', preScore: 4, postScore: 9, maxScore: 10, dateCompleted: '2026-05-24', remarks: 'Good progress. Understands basic sentence structure.' },
      { id: 'e-2', learningStrand: 'LS1 Filipino', moduleTitle: 'Pagsulat ng Pormal na Liham sa Opisina', preScore: 5, postScore: 8, maxScore: 10, dateCompleted: '2026-06-02', remarks: 'Writes very clearly. Excelled in formal vocabulary.' },
      { id: 'e-3', learningStrand: 'LS3 Mathematics', moduleTitle: 'Introduction to Integers & Fractions', preScore: 2, postScore: 7, maxScore: 10, dateCompleted: '2026-06-14', remarks: 'Needs more practice with subtraction of fractions.' },
      { id: 'e-4', learningStrand: 'LS4 Life & Career', moduleTitle: 'Exploring Work Opportunities', preScore: 7, postScore: 10, maxScore: 10, dateCompleted: '2026-06-20', remarks: 'Excellent vocational alignment and understanding.' }
    ],
    learnerSignatureName: 'Cardo D. Dalisay',
    learnerSignatureDate: '2026-05-18',
    facilitatorSignatureName: 'Mrs. Maria Elena Santos',
    facilitatorSignatureDate: '2026-05-18'
  },
  {
    id: 'ila-002',
    learnerId: '2',
    learnerName: 'Juan dela Cruz Jr.',
    clc: 'Tibag Community Learning Center',
    teacherName: 'Mr. Juan dela Cruz Jr.',
    dateAgreed: '2026-05-20',
    goals: [
      { id: 'g-4', goalText: 'Improve basic mathematical calculations for shop inventory accounting', targetDate: '2026-08-30', strategy: 'Complete LS3 module series on decimals, percentages, and basic algebra.', status: 'In Progress' },
      { id: 'g-5', goalText: 'Gain certification in core agricultural practices', targetDate: '2026-11-15', strategy: 'Finish LS2 Scientific & Quantitative and LS4 vocational modules.', status: 'Not Started' }
    ],
    rlpEntries: [
      { id: 'e-5', learningStrand: 'LS3 Mathematics', moduleTitle: 'Understanding Decimals and Percentages', preScore: 3, postScore: 8, maxScore: 10, dateCompleted: '2026-06-05', remarks: 'Much improved inventory calculations. Proficient.' },
      { id: 'e-6', learningStrand: 'LS2 Scientific Thinking', moduleTitle: 'Ecosystems & Sustainable Farming', preScore: 5, postScore: 9, maxScore: 10, dateCompleted: '2026-06-18', remarks: 'Deep appreciation of agricultural science.' }
    ],
    learnerSignatureName: 'Juan dela Cruz Jr.',
    learnerSignatureDate: '2026-05-20',
    facilitatorSignatureName: 'Mr. Juan dela Cruz Jr.',
    facilitatorSignatureDate: '2026-05-20'
  }
];

export function IndividualLearningAgreementView({ learners, learningCenters, selectedDistrict }: IndividualLearningAgreementViewProps) {
  const [agreements, setAgreements] = useState<IndividualLearningAgreement[]>(() => {
    const saved = localStorage.getItem('tcsd_ila_agreements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse ILA records. Seeding defaults.", e);
      }
    }
    return DEFAULT_ILA_RECORDS;
  });

  useEffect(() => {
    localStorage.setItem('tcsd_ila_agreements', JSON.stringify(agreements));
  }, [agreements]);

  // Selected ILA learner details state
  const [selectedAgreementId, setSelectedAgreementId] = useState<string>('ila-001');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClcFilter, setSelectedClcFilter] = useState('All');

  // Forms states
  const [isAddingAgreement, setIsAddingAgreement] = useState(false);
  const [newLearnerId, setNewLearnerId] = useState('');
  const [newDateAgreed, setNewDateAgreed] = useState(() => new Date().toISOString().split('T')[0]);

  // Learning goal form
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [goalText, setGoalText] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });
  const [goalStrategy, setGoalStrategy] = useState('');

  // RLP Entry Form
  const [isAddingRLP, setIsAddingRLP] = useState(false);
  const [rlpStrand, setRlpStrand] = useState<RLPEntry['learningStrand']>('LS1 English');
  const [rlpModule, setRlpModule] = useState('');
  const [rlpPreScore, setRlpPreScore] = useState<number>(0);
  const [rlpPostScore, setRlpPostScore] = useState<number>(0);
  const [rlpMaxScore, setRlpMaxScore] = useState<number>(10);
  const [rlpDate, setRlpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [rlpRemarks, setRlpRemarks] = useState('');

  // Print Preview Dialog State
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Active sub-tab inside the agreement details panel
  const [detailsSubTab, setDetailsSubTab] = useState<'goals' | 'rlp' | 'summary'>('goals');

  // Retrieve the actively selected agreement
  const activeAgreement = useMemo(() => {
    return agreements.find(a => a.id === selectedAgreementId);
  }, [agreements, selectedAgreementId]);

  // Filtered agreements list for sidebar
  const filteredAgreements = useMemo(() => {
    return agreements.filter(a => {
      const matchesSearch = a.learnerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            a.clc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClc = selectedClcFilter === 'All' || a.clc === selectedClcFilter;
      return matchesSearch && matchesClc;
    });
  }, [agreements, searchQuery, selectedClcFilter]);

  // Unique list of CLCs available in agreements for filtering
  const clcOptions = useMemo(() => {
    const clcs = agreements.map(a => a.clc);
    return ['All', ...Array.from(new Set(clcs))];
  }, [agreements]);

  // Selectable learners that do not yet have an agreement registered
  const unassignedLearners = useMemo(() => {
    const assignedIds = new Set(agreements.map(a => a.learnerId));
    return learners.filter(l => !assignedIds.has(l.id));
  }, [learners, agreements]);

  // Synchronize CLC / Teacher when a new learner is picked in the setup form
  const [newClc, setNewClc] = useState('');
  const [newTeacher, setNewTeacher] = useState('');
  
  useEffect(() => {
    if (newLearnerId) {
      const selectedLearner = learners.find(l => l.id === newLearnerId);
      if (selectedLearner) {
        setNewClc(selectedLearner.clcName || selectedLearner.communityLearningCenter || 'San Roque Community Learning Center');
        setNewTeacher(selectedLearner.teacher || 'Mrs. Maria Elena Santos');
      }
    }
  }, [newLearnerId, learners]);

  // Handler to create a new ILA
  const handleCreateAgreement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLearnerId) return;

    const chosenLearner = learners.find(l => l.id === newLearnerId);
    if (!chosenLearner) return;

    const newAgreement: IndividualLearningAgreement = {
      id: `ila-${Date.now()}`,
      learnerId: chosenLearner.id,
      learnerName: chosenLearner.name || `${chosenLearner.firstName} ${chosenLearner.lastName}`,
      clc: newClc,
      teacherName: newTeacher,
      dateAgreed: newDateAgreed,
      goals: [
        {
          id: `g-init-${Date.now()}`,
          goalText: `Pass the Alternative Learning System A&E Assessment (${chosenLearner.preferredProgram || 'Junior High School'})`,
          targetDate: newDateAgreed,
          strategy: 'Work sequentially through recommended Self-Learning Modules and attend weekly community tutorial sessions.',
          status: 'In Progress'
        }
      ],
      rlpEntries: [],
      learnerSignatureName: chosenLearner.name || `${chosenLearner.firstName} ${chosenLearner.lastName}`,
      learnerSignatureDate: newDateAgreed,
      facilitatorSignatureName: newTeacher,
      facilitatorSignatureDate: newDateAgreed
    };

    setAgreements(prev => [newAgreement, ...prev]);
    setSelectedAgreementId(newAgreement.id);
    setIsAddingAgreement(false);
    setNewLearnerId('');
  };

  // Handler to add a Goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAgreement || !goalText.trim()) return;

    const newGoal: ILAGoal = {
      id: `g-${Date.now()}`,
      goalText: goalText.trim(),
      targetDate: goalTargetDate,
      strategy: goalStrategy.trim() || 'Study dedicated instructional modules & perform self-directed exercises.',
      status: 'Not Started'
    };

    setAgreements(prev => prev.map(a => {
      if (a.id === activeAgreement.id) {
        return {
          ...a,
          goals: [...a.goals, newGoal]
        };
      }
      return a;
    }));

    setIsAddingGoal(false);
    setGoalText('');
    setGoalStrategy('');
  };

  // Handler to toggle Goal Status
  const handleToggleGoalStatus = (goalId: string, currentStatus: ILAGoal['status']) => {
    if (!activeAgreement) return;

    const nextStatuses: Record<ILAGoal['status'], ILAGoal['status']> = {
      'Not Started': 'In Progress',
      'In Progress': 'Achieved',
      'Achieved': 'Not Started'
    };

    const nextStatus = nextStatuses[currentStatus];

    setAgreements(prev => prev.map(a => {
      if (a.id === activeAgreement.id) {
        return {
          ...a,
          goals: a.goals.map(g => g.id === goalId ? { ...g, status: nextStatus } : g)
        };
      }
      return a;
    }));
  };

  // Handler to delete a Goal
  const handleDeleteGoal = (goalId: string) => {
    if (!activeAgreement) return;
    if (!confirm('Are you sure you want to delete this learning goal?')) return;

    setAgreements(prev => prev.map(a => {
      if (a.id === activeAgreement.id) {
        return {
          ...a,
          goals: a.goals.filter(g => g.id !== goalId)
        };
      }
      return a;
    }));
  };

  // Handler to add an RLP Entry
  const handleAddRLPEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAgreement || !rlpModule.trim()) return;

    const newEntry: RLPEntry = {
      id: `e-${Date.now()}`,
      learningStrand: rlpStrand,
      moduleTitle: rlpModule.trim(),
      preScore: Number(rlpPreScore),
      postScore: Number(rlpPostScore),
      maxScore: Number(rlpMaxScore),
      dateCompleted: rlpDate,
      remarks: rlpRemarks.trim() || 'Successfully verified modules & competencies completed.'
    };

    setAgreements(prev => prev.map(a => {
      if (a.id === activeAgreement.id) {
        return {
          ...a,
          rlpEntries: [...a.rlpEntries, newEntry]
        };
      }
      return a;
    }));

    setIsAddingRLP(false);
    setRlpModule('');
    setRlpPreScore(0);
    setRlpPostScore(0);
    setRlpMaxScore(10);
    setRlpRemarks('');
  };

  // Handler to delete an RLP Entry
  const handleDeleteRLPEntry = (entryId: string) => {
    if (!activeAgreement) return;
    if (!confirm('Are you sure you want to delete this module progress record?')) return;

    setAgreements(prev => prev.map(a => {
      if (a.id === activeAgreement.id) {
        return {
          ...a,
          rlpEntries: a.rlpEntries.filter(e => e.id !== entryId)
        };
      }
      return a;
    }));
  };

  // Delete whole Agreement
  const handleDeleteAgreement = (agreementId: string) => {
    if (!confirm('Are you absolutely sure you want to delete this entire Individual Learning Agreement & Record of Progress? This action is irreversible.')) return;
    setAgreements(prev => prev.filter(a => a.id !== agreementId));
    if (selectedAgreementId === agreementId) {
      const remaining = agreements.filter(a => a.id !== agreementId);
      if (remaining.length > 0) {
        setSelectedAgreementId(remaining[0].id);
      } else {
        setSelectedAgreementId('');
      }
    }
  };

  // Percentage calculations of achieved goals
  const goalStats = useMemo(() => {
    if (!activeAgreement || activeAgreement.goals.length === 0) return { total: 0, achieved: 0, percent: 0 };
    const total = activeAgreement.goals.length;
    const achieved = activeAgreement.goals.filter(g => g.status === 'Achieved').length;
    const inProgress = activeAgreement.goals.filter(g => g.status === 'In Progress').length;
    const percent = Math.round((achieved / total) * 100);
    return { total, achieved, inProgress, percent };
  }, [activeAgreement]);

  // Completion calculation of RLP modules by strand
  const strandStats = useMemo(() => {
    if (!activeAgreement) return [];
    
    const strands: RLPEntry['learningStrand'][] = [
      'LS1 English',
      'LS1 Filipino',
      'LS2 Scientific Thinking',
      'LS3 Mathematics',
      'LS4 Life & Career',
      'LS5 Self & Society',
      'LS6 Digital Citizenship'
    ];

    return strands.map(strand => {
      const entries = activeAgreement.rlpEntries.filter(e => e.learningStrand === strand);
      const count = entries.length;
      
      // Calculate average post-test score percentage
      let avgPrePercent = 0;
      let avgPostPercent = 0;
      if (count > 0) {
        const totalPre = entries.reduce((acc, curr) => acc + (curr.preScore / curr.maxScore), 0);
        const totalPost = entries.reduce((acc, curr) => acc + (curr.postScore / curr.maxScore), 0);
        avgPrePercent = Math.round((totalPre / count) * 100);
        avgPostPercent = Math.round((totalPost / count) * 100);
      }

      return {
        strand,
        count,
        avgPrePercent,
        avgPostPercent
      };
    });
  }, [activeAgreement]);

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-140px)] rounded-3xl overflow-hidden shadow-xs border border-slate-200">
      
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-[#002B6D] to-[#124E9C] text-white px-8 py-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ClipboardList className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-200">Alternative Learning System Form Suite</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Individual Learning Agreement (ILA) & Record of Learner's Progress
          </h2>
          <p className="text-xs text-sky-100/95 mt-1 max-w-2xl font-normal leading-relaxed">
            DepEd ALS Assessment Form 1 (ILA) and Record of Module Progress (RLP). Seamlessly collaborate with learners to establish educational objectives and track modular milestones across the 6 Learning Strands.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-center shrink-0">
          <button
            onClick={() => setIsAddingAgreement(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black tracking-wider flex items-center gap-2 shadow-xs transition duration-150 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            CREATE NEW ILA
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        
        {/* SIDEBAR: Active ILA Directory & Filter */}
        <div className="w-full lg:w-96 border-r border-slate-200 bg-white p-5 flex flex-col shrink-0">
          
          <div className="mb-5 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">ILA Learner Directory</h3>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search learner name or CLC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-[#002B6D]/20 focus:border-[#002B6D] outline-none transition"
              />
            </div>

            {/* CLC Filter dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedClcFilter}
                onChange={(e) => setSelectedClcFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-[11px] font-bold text-slate-600 outline-none focus:border-[#002B6D]"
              >
                {clcOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt === 'All' ? 'Filter by: All Learning Centers' : opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Directory List Container */}
          <div className="grow overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
            {filteredAgreements.length === 0 ? (
              <div className="text-center py-10 px-4 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No learning agreements match your filters.</p>
              </div>
            ) : (
              filteredAgreements.map(agreement => {
                const isSelected = agreement.id === selectedAgreementId;
                const totalGoals = agreement.goals.length;
                const achievedGoals = agreement.goals.filter(g => g.status === 'Achieved').length;
                const modulesCount = agreement.rlpEntries.length;

                return (
                  <div
                    key={agreement.id}
                    onClick={() => {
                      setSelectedAgreementId(agreement.id);
                      setDetailsSubTab('goals');
                    }}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-200 shadow-xs ring-1 ring-blue-200'
                        : 'bg-[#F8FAFC]/50 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className={`font-bold text-sm tracking-tight ${isSelected ? 'text-[#002B6D]' : 'text-slate-800'}`}>
                          {agreement.learnerName}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-normal">
                          {agreement.clc}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAgreement(agreement.id);
                        }}
                        className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-md transition"
                        title="Delete ILA"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-white/80 border border-slate-100 p-2 rounded-xl">
                        <span className="text-slate-400 font-bold block">ILA GOALS</span>
                        <span className="font-extrabold text-slate-700 mt-0.5 block">
                          {achievedGoals} / {totalGoals} Achieved
                        </span>
                      </div>
                      <div className="bg-white/80 border border-slate-100 p-2 rounded-xl">
                        <span className="text-slate-400 font-bold block">MODULES LOG</span>
                        <span className="font-extrabold text-slate-700 mt-0.5 block">
                          {modulesCount} Completed
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between items-center text-[9px] font-mono text-slate-400">
                      <span>Agreed: {agreement.dateAgreed}</span>
                      <span className="flex items-center gap-1 font-sans text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3 h-3 stroke-[2.5]" /> Setup Verified
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* DETAILS PANEL: Agreement Sheet Display */}
        <div className="grow bg-slate-50 p-6 flex flex-col min-w-0">
          
          {activeAgreement ? (
            <motion.div
              key={activeAgreement.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Profile Card Summary */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 h-24 w-24 bg-blue-50 rounded-bl-full -z-0 opacity-40" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#002B6D] flex items-center justify-center font-black text-xl border border-blue-200">
                      {activeAgreement.learnerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">{activeAgreement.learnerName}</h3>
                        <span className="bg-[#002B6D]/10 text-[#002B6D] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                          ALS Active Agreement
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        CLC: <span className="text-slate-700 font-bold">{activeAgreement.clc}</span> • Teacher: <span className="text-slate-700 font-semibold">{activeAgreement.teacherName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      onClick={() => setShowPrintModal(true)}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide flex items-center gap-2 shadow-2xs transition"
                    >
                      <Printer className="w-4 h-4 text-slate-500" />
                      Print DepEd Forms
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">Agreement Date</span>
                    <p className="font-extrabold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {activeAgreement.dateAgreed}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">Goal Achievements</span>
                    <div className="flex items-center gap-2">
                      <div className="grow bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${goalStats.percent}%` }}
                        />
                      </div>
                      <span className="font-extrabold text-slate-700 whitespace-nowrap">{goalStats.percent}% achieved</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">Verification Signatures</span>
                    <p className="text-emerald-600 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Checked & Signed
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub Navigation Bar */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setDetailsSubTab('goals')}
                  className={`px-5 py-3 text-xs font-black tracking-wide border-b-2 transition -mb-px ${
                    detailsSubTab === 'goals'
                      ? 'border-[#002B6D] text-[#002B6D]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    ILA goals & Objectives ({activeAgreement.goals.length})
                  </span>
                </button>
                <button
                  onClick={() => setDetailsSubTab('rlp')}
                  className={`px-5 py-3 text-xs font-black tracking-wide border-b-2 transition -mb-px ${
                    detailsSubTab === 'rlp'
                      ? 'border-[#002B6D] text-[#002B6D]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Record of Learner's Progress ({activeAgreement.rlpEntries.length})
                  </span>
                </button>
                <button
                  onClick={() => setDetailsSubTab('summary')}
                  className={`px-5 py-3 text-xs font-black tracking-wide border-b-2 transition -mb-px ${
                    detailsSubTab === 'summary'
                      ? 'border-[#002B6D] text-[#002B6D]'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4" />
                    Learning Strand Analytics
                  </span>
                </button>
              </div>

              {/* Tab 1: ILA Goals Container */}
              {detailsSubTab === 'goals' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-700">Learner Goals Contract (Assessment Form 1)</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Define milestones, timeline and concrete strategies mutually agreed with the learner.</p>
                    </div>
                    <button
                      onClick={() => setIsAddingGoal(true)}
                      className="bg-[#002B6D] hover:bg-[#001D4A] text-white px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Goal
                    </button>
                  </div>

                  <div className="space-y-3">
                    {activeAgreement.goals.length === 0 ? (
                      <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
                        <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-semibold">No objectives registered in this learning agreement yet.</p>
                      </div>
                    ) : (
                      activeAgreement.goals.map((goal, idx) => (
                        <div
                          key={goal.id}
                          className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition"
                        >
                          <div className="space-y-1.5 max-w-2xl">
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                {idx + 1}
                              </span>
                              <h5 className="font-bold text-slate-800 text-sm">{goal.goalText}</h5>
                            </div>
                            <div className="pl-7 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              <p className="text-slate-500 leading-relaxed">
                                <span className="font-bold text-slate-400 text-[10px] uppercase block">Strategy / Learning Activities</span>
                                {goal.strategy}
                              </p>
                              <p className="text-slate-500 mt-1 md:mt-0">
                                <span className="font-bold text-slate-400 text-[10px] uppercase block">Target Date</span>
                                <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  {goal.targetDate}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pl-7 md:pl-0 self-start md:self-center">
                            <button
                              onClick={() => handleToggleGoalStatus(goal.id, goal.status)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide uppercase transition ${
                                goal.status === 'Achieved'
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : goal.status === 'In Progress'
                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {goal.status}
                            </button>
                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition"
                              title="Delete goal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: RLP Completed Modules */}
              {detailsSubTab === 'rlp' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-700">Completed Instructional Modules (Record of Learner's Progress)</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Log self-learning modules completed, pre-test and post-test assessment performance scores.</p>
                    </div>
                    <button
                      onClick={() => setIsAddingRLP(true)}
                      className="bg-[#002B6D] hover:bg-[#001D4A] text-white px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Log Module Entry
                    </button>
                  </div>

                  <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-2xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-4">Learning Strand</th>
                          <th className="py-3 px-4">Module / Topic</th>
                          <th className="py-3 px-4 text-center">Pre-Test</th>
                          <th className="py-3 px-4 text-center">Post-Test</th>
                          <th className="py-3 px-4 text-center">Improvement</th>
                          <th className="py-3 px-4">Completion Date</th>
                          <th className="py-3 px-4">Evaluator Remarks</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                        {activeAgreement.rlpEntries.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                              No module achievements logged for this learner yet.
                            </td>
                          </tr>
                        ) : (
                          activeAgreement.rlpEntries.map(entry => {
                            const improvement = entry.postScore - entry.preScore;
                            const gainPercent = Math.round((improvement / entry.maxScore) * 100);

                            return (
                              <tr key={entry.id} className="hover:bg-slate-50/40 transition">
                                <td className="py-3.5 px-4 font-bold text-slate-800">
                                  <span className="bg-slate-100 px-2 py-1 rounded-md text-[10px]">
                                    {entry.learningStrand}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-bold text-slate-700">{entry.moduleTitle}</td>
                                <td className="py-3.5 px-4 text-center font-bold">
                                  <span className="text-slate-500">{entry.preScore}</span> / {entry.maxScore}
                                </td>
                                <td className="py-3.5 px-4 text-center font-bold">
                                  <span className="text-[#002B6D]">{entry.postScore}</span> / {entry.maxScore}
                                </td>
                                <td className="py-3.5 px-4 text-center font-extrabold">
                                  <span className={`flex items-center justify-center gap-1 ${improvement > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    +{improvement} ({gainPercent > 0 ? `+${gainPercent}%` : '0%'})
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 font-mono text-slate-500">{entry.dateCompleted}</td>
                                <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={entry.remarks}>
                                  {entry.remarks}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    onClick={() => handleDeleteRLPEntry(entry.id)}
                                    className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition"
                                    title="Delete entry"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Strand Analytics */}
              {detailsSubTab === 'summary' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-700">Competency Progress by Learning Strand</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Overview of module completion volume and pre/post-test performance gains per strand.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {strandStats.map(stat => {
                      const percentComplete = Math.min(Math.round((stat.count / 5) * 100), 100); // Assume target of 5 modules per strand is benchmark
                      
                      return (
                        <div key={stat.strand} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-extrabold text-slate-700 text-xs uppercase tracking-wide">{stat.strand}</h5>
                              <span className="text-[11px] text-slate-400 mt-0.5 block">{stat.count} modules finished</span>
                            </div>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold text-[10px] px-2 py-0.5 rounded-lg">
                              {percentComplete}% of Strand Target
                            </span>
                          </div>

                          <div className="space-y-2">
                            {/* Bar completion */}
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${percentComplete}%` }} />
                            </div>

                            {/* Score diagnostic gain chart */}
                            {stat.count > 0 ? (
                              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 font-bold block text-[9px] uppercase">Average Pre-test</span>
                                  <span className="font-extrabold text-slate-500">{stat.avgPrePercent}% score</span>
                                </div>
                                <div className="space-y-0.5 text-right">
                                  <span className="text-slate-400 font-bold block text-[9px] uppercase">Average Post-test</span>
                                  <span className="font-extrabold text-[#002B6D]">{stat.avgPostPercent}% score</span>
                                </div>
                                <div className="space-y-0.5 text-right">
                                  <span className="text-slate-400 font-bold block text-[9px] uppercase">Average Gain</span>
                                  <span className="font-extrabold text-emerald-600">+{stat.avgPostPercent - stat.avgPrePercent}%</span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic pt-2">No score records registered in this Learning Strand.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </motion.div>
          ) : (
            <div className="text-center py-24 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-black text-slate-700">No Learning Agreements Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Create a brand-new agreement to formulate goals and objectives for your alternative learning system students.</p>
              <button
                onClick={() => setIsAddingAgreement(true)}
                className="mt-5 bg-[#002B6D] hover:bg-[#001D4A] text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Create First Agreement
              </button>
            </div>
          )}

        </div>

      </div>

      {/* MODAL 1: Create Learning Agreement Dialog */}
      <AnimatePresence>
        {isAddingAgreement && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="bg-[#002B6D] text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-400" />
                  <h3 className="font-black tracking-tight text-sm uppercase">Initialize Learning Agreement (ILA)</h3>
                </div>
                <button
                  onClick={() => setIsAddingAgreement(false)}
                  className="text-white/85 hover:text-white p-1 hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAgreement} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Select ALS Learner
                  </label>
                  <select
                    value={newLearnerId}
                    onChange={(e) => setNewLearnerId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-xs font-bold outline-none focus:border-[#002B6D]"
                  >
                    <option value="">-- Choose a student to establish contract --</option>
                    {unassignedLearners.length === 0 ? (
                      <option disabled>No unassigned learners left (or create one in registry)</option>
                    ) : (
                      unassignedLearners.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.name || `${l.firstName} ${l.lastName}`} ({l.clcName || 'No CLCassigned'})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {newLearnerId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-4 border-t border-slate-100 pt-4"
                  >
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                        Community Learning Center (CLC)
                      </label>
                      <input
                        type="text"
                        value={newClc}
                        onChange={(e) => setNewClc(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold outline-none focus:border-[#002B6D]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                        ALS Teacher / Facilitator Name
                      </label>
                      <input
                        type="text"
                        value={newTeacher}
                        onChange={(e) => setNewTeacher(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold outline-none focus:border-[#002B6D]"
                      />
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Date Agreed & Signed
                  </label>
                  <input
                    type="date"
                    value={newDateAgreed}
                    onChange={(e) => setNewDateAgreed(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold outline-none focus:border-[#002B6D]"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingAgreement(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newLearnerId}
                    className="bg-[#002B6D] hover:bg-[#001D4A] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
                  >
                    Establish Agreement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Add Goal Objective Form */}
      <AnimatePresence>
        {isAddingGoal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="bg-[#002B6D] text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold tracking-tight text-xs uppercase flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                  Add Learner Objective (Form 1)
                </h3>
                <button
                  onClick={() => setIsAddingGoal(false)}
                  className="text-white/85 hover:text-white p-1 hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddGoal} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Learning Goal / Objective
                  </label>
                  <textarea
                    placeholder="e.g. Pass the Accreditation and Equivalency (A&E) Test for JHS or Improve reading skills"
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    required
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold outline-none focus:border-[#002B6D] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Target Date for Accomplishment
                  </label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold outline-none focus:border-[#002B6D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Learning Strategy & Materials
                  </label>
                  <textarea
                    placeholder="e.g. Work through Self-Learning Modules, seek guidance from instructional tutorials"
                    value={goalStrategy}
                    onChange={(e) => setGoalStrategy(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold outline-none focus:border-[#002B6D] resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingGoal(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#002B6D] hover:bg-[#001D4A] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition"
                  >
                    Save Objective
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Log Module RLP Entry */}
      <AnimatePresence>
        {isAddingRLP && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="bg-[#002B6D] text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold tracking-tight text-xs uppercase flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Log Module Entry (RLP)
                </h3>
                <button
                  onClick={() => setIsAddingRLP(false)}
                  className="text-white/85 hover:text-white p-1 hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddRLPEntry} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Learning Strand
                    </label>
                    <select
                      value={rlpStrand}
                      onChange={(e) => setRlpStrand(e.target.value as RLPEntry['learningStrand'])}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold outline-none focus:border-[#002B6D]"
                    >
                      <option value="LS1 English">LS1 Communication (English)</option>
                      <option value="LS1 Filipino">LS1 Communication (Filipino)</option>
                      <option value="LS2 Scientific Thinking">LS2 Scientific & Quantitative</option>
                      <option value="LS3 Mathematics">LS3 Mathematical Reasoning</option>
                      <option value="LS4 Life & Career">LS4 Life & Career Skills</option>
                      <option value="LS5 Self & Society">LS5 Understanding Self & Society</option>
                      <option value="LS6 Digital Citizenship">LS6 Digital Citizenship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Completion Date
                    </label>
                    <input
                      type="date"
                      value={rlpDate}
                      onChange={(e) => setRlpDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold outline-none focus:border-[#002B6D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Instructional Module Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Writing Formal Business Emails"
                    value={rlpModule}
                    onChange={(e) => setRlpModule(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold outline-none focus:border-[#002B6D]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Pre-Test Score
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={rlpMaxScore}
                      value={rlpPreScore}
                      onChange={(e) => setRlpPreScore(Number(e.target.value))}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold outline-none focus:border-[#002B6D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Post-Test Score
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={rlpMaxScore}
                      value={rlpPostScore}
                      onChange={(e) => setRlpPostScore(Number(e.target.value))}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold outline-none focus:border-[#002B6D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Max Score
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={rlpMaxScore}
                      onChange={(e) => setRlpMaxScore(Number(e.target.value))}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold outline-none focus:border-[#002B6D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Evaluator Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Excellent command over formal writing conventions"
                    value={rlpRemarks}
                    onChange={(e) => setRlpRemarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-semibold outline-none focus:border-[#002B6D]"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingRLP(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#002B6D] hover:bg-[#001D4A] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition"
                  >
                    Log Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Official DepEd Print Preview Sheet */}
      <AnimatePresence>
        {showPrintModal && activeAgreement && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 my-8"
            >
              <div className="bg-[#002B6D] text-white px-6 py-4 flex items-center justify-between no-print">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold tracking-tight text-xs uppercase">DepEd ALS Form Print Preview</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-black tracking-wide transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Form
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="text-white/85 hover:text-white p-1 hover:bg-white/10 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Document Sheet Container */}
              <div className="p-10 bg-white max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible text-slate-800" id="deped-printable-area">
                
                {/* Official Header */}
                <div className="text-center space-y-1 pb-6 border-b-2 border-black/80">
                  <div className="flex justify-center items-center gap-4 mb-2">
                    <img
                      src="https://lh3.googleusercontent.com/d/1VFOWXkbY1l9VBvvQXAETZ3gTDmVHUhNB"
                      alt="DepEd Logo"
                      className="w-14 h-14 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wide">Republika ng Pilipinas</h4>
                      <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">Kagawaran ng Edukasyon</h3>
                      <p className="text-[10px] text-slate-500 font-medium font-serif italic">Department of Education • Region III • Division of Tarlac City</p>
                    </div>
                    <img
                      src="https://lh3.googleusercontent.com/d/1RMiZninylXhyjgIjOKQC_9F7trv8EuQm"
                      alt="Tarlac Division Logo"
                      className="w-14 h-14 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h2 className="text-lg font-black tracking-tight uppercase pt-2">ALS ASSESSMENT FORM 1: INDIVIDUAL LEARNING AGREEMENT (ILA)</h2>
                </div>

                {/* Learner Info Block */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-slate-200 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-400 uppercase text-[9px] block">Learner Name:</span>
                    <span className="font-bold text-slate-800 text-sm">{activeAgreement.learnerName}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-400 uppercase text-[9px] block">Learning Center (CLC):</span>
                    <span className="font-semibold text-slate-800">{activeAgreement.clc}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-400 uppercase text-[9px] block">ALS Facilitator:</span>
                    <span className="font-semibold text-slate-800">{activeAgreement.teacherName}</span>
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-400 uppercase text-[9px] block">Date Formulated:</span>
                    <span className="font-mono text-slate-800 font-bold">{activeAgreement.dateAgreed}</span>
                  </div>
                </div>

                {/* Part I: Goals Contract */}
                <div className="py-6 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-widest border-b-2 border-slate-250 pb-1.5 text-slate-800">PART I: LEARNING AGREEMENT GOALS & TIMELINE</h3>
                  <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-300 text-slate-650 font-bold">
                        <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center">No.</th>
                        <th className="py-2.5 px-3 border-r border-slate-300">My Goals / Objectives</th>
                        <th className="py-2.5 px-3 border-r border-slate-300">Learning Strategies & Materials</th>
                        <th className="py-2.5 px-3 border-r border-slate-300 w-32 text-center">Target Completion</th>
                        <th className="py-2.5 px-3 w-32 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-250">
                      {activeAgreement.goals.map((g, idx) => (
                        <tr key={g.id}>
                          <td className="py-3 px-3 border-r border-slate-300 text-center font-bold">{idx + 1}</td>
                          <td className="py-3 px-3 border-r border-slate-300 font-bold">{g.goalText}</td>
                          <td className="py-3 px-3 border-r border-slate-300">{g.strategy}</td>
                          <td className="py-3 px-3 border-r border-slate-300 text-center font-mono">{g.targetDate}</td>
                          <td className="py-3 px-3 text-center font-bold uppercase text-[10px]">{g.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Part II: Modules Record */}
                <div className="py-6 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-widest border-b-2 border-slate-250 pb-1.5 text-slate-800">PART II: RECORD OF LEARNER'S PROGRESS (RLP)</h3>
                  <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-300 text-slate-650 font-bold">
                        <th className="py-2.5 px-3 border-r border-slate-300">Learning Strand</th>
                        <th className="py-2.5 px-3 border-r border-slate-300">Module / Topic Completed</th>
                        <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">Pre-test Score</th>
                        <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">Post-test Score</th>
                        <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">Gain</th>
                        <th className="py-2.5 px-3 text-center w-32">Date Finished</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-250">
                      {activeAgreement.rlpEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic font-medium">
                            No module assessment records compiled for this printout.
                          </td>
                        </tr>
                      ) : (
                        activeAgreement.rlpEntries.map(e => (
                          <tr key={e.id}>
                            <td className="py-3 px-3 border-r border-slate-300 font-bold">{e.learningStrand}</td>
                            <td className="py-3 px-3 border-r border-slate-300 font-bold text-slate-700">{e.moduleTitle}</td>
                            <td className="py-3 px-3 border-r border-slate-300 text-center">{e.preScore} / {e.maxScore}</td>
                            <td className="py-3 px-3 border-r border-slate-300 text-center">{e.postScore} / {e.maxScore}</td>
                            <td className="py-3 px-3 border-r border-slate-300 text-center font-bold text-emerald-600">+{e.postScore - e.preScore}</td>
                            <td className="py-3 px-3 text-center font-mono">{e.dateCompleted}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Signatures Declaration Block */}
                <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t-2 border-dashed border-slate-300 text-xs">
                  <div className="space-y-4 text-center">
                    <div className="border-b border-black pb-1 font-bold text-slate-800">
                      {activeAgreement.learnerSignatureName || activeAgreement.learnerName}
                    </div>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Learner Signature & Date</p>
                    <p className="text-[10px] font-mono font-medium text-slate-400">Signed on: {activeAgreement.learnerSignatureDate || activeAgreement.dateAgreed}</p>
                  </div>
                  <div className="space-y-4 text-center">
                    <div className="border-b border-black pb-1 font-bold text-slate-800">
                      {activeAgreement.facilitatorSignatureName || activeAgreement.teacherName}
                    </div>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">ALS Facilitator / Date</p>
                    <p className="text-[10px] font-mono font-medium text-slate-400">Signed on: {activeAgreement.facilitatorSignatureDate || activeAgreement.dateAgreed}</p>
                  </div>
                </div>

                {/* DepEd humble verification barcode simulation */}
                <div className="mt-16 flex items-center justify-between border-t border-slate-100 pt-4 text-[9px] font-mono text-slate-400 no-print">
                  <span>SYSTEM ASSESSED ID: {activeAgreement.id}</span>
                  <span>TCSD DIVISION OFFICE DIRECTORY ENCLOSURE FORM 2026</span>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
