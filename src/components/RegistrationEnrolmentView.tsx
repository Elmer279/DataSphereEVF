/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  GraduationCap, 
  Search, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  HelpCircle, 
  ChevronRight, 
  Check, 
  Sparkles, 
  ClipboardCopy, 
  Calendar, 
  User, 
  Mail, 
  Building2, 
  MapPin, 
  Award,
  BookOpen,
  PieChart,
  UserCheck,
  BarChart4
} from 'lucide-react';
import { LearnerRecord } from '../types';
import { ElFabriXConsole } from './ElFabriXConsole';

interface RegistrationEnrolmentViewProps {
  learners: LearnerRecord[];
  onAddLearner: (learner: LearnerRecord) => void;
  onUpdateLearner: (id: string, updatedFields: Partial<LearnerRecord>) => void;
  onDeleteLearner: (id: string) => void;
  learningCenters: any[];
}

export function RegistrationEnrolmentView({
  learners,
  onAddLearner,
  onUpdateLearner,
  onDeleteLearner,
  learningCenters
}: RegistrationEnrolmentViewProps) {
  // Views inside Registration & Enrolment: 'overview' | 'registry' | 'form'
  const [currentSubTab, setCurrentSubTab] = useState<'overview' | 'registry' | 'form'>('overview');

  // Registry states
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  // Form states
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    gender: 'Male' as 'Male' | 'Female',
    age: '',
    motherTongue: 'Tagalog',
    indigenousPeople: 'No',
    religion: 'Roman Catholic',
    houseNo: '',
    street: '',
    barangay: 'Aguso',
    contactNumber: '',
    lastGradeLevelCompleted: 'Grade 6',
    program: 'A&E Secondary' as 'Basic Literacy' | 'A&E Elementary' | 'A&E Secondary',
    status: 'Enrolled' as 'Enrolled' | 'In Processing' | 'Completed' | 'On Leave',
    district: 'District A',
    reasonsForNotAttending: 'Employment',
  });

  const [formSuccess, setFormSuccess] = useState(false);

  // Form submission handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      alert("Please fill in the required First Name and Last Name fields!");
      return;
    }

    const ageNum = parseInt(formData.age, 10) || 16;
    const lrnSuffix = Math.floor(100000 + Math.random() * 900000); // 6 random digits
    const recordId = `ALS-RF-${Date.now()}`;
    const recordNumber = `11774201${lrnSuffix}`; // Mock LRN

    const newLearner: LearnerRecord = {
      id: recordId,
      recordNumber: recordNumber,
      lastName: formData.lastName,
      firstName: formData.firstName,
      middleName: formData.middleName,
      gender: formData.gender,
      dateOfBirth: new Date(Date.now() - ageNum * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      age: ageNum,
      motherTongue: formData.motherTongue,
      indigenousPeople: formData.indigenousPeople,
      religion: formData.religion,
      houseNo: formData.houseNo,
      street: formData.street,
      barangay: formData.barangay,
      city: 'Tarlac City',
      province: 'Tarlac',
      fatherName: 'N/A',
      motherName: 'N/A',
      contactNumber: formData.contactNumber || 'N/A',
      lastGradeLevelCompleted: formData.lastGradeLevelCompleted,
      dateMapped: new Date().toISOString().split('T')[0],
      interestedInALS: 'Yes',
      preferredProgram: formData.program,
      dateOfFirstAttendance: new Date().toISOString().split('T')[0],
      enrolledInAls: 'Yes',
      reasonsForNotAttending: formData.reasonsForNotAttending,
      name: `${formData.firstName} ${formData.middleName ? formData.middleName[0] + '. ' : ''}${formData.lastName}`,
      program: formData.program,
      status: formData.status,
      district: formData.district,
      contact: formData.contactNumber || 'N/A',
      admissionDate: new Date().toISOString().split('T')[0],
    };

    onAddLearner(newLearner);
    setFormSuccess(true);
    
    // Reset Form
    setFormData({
      lastName: '',
      firstName: '',
      middleName: '',
      gender: 'Male',
      age: '',
      motherTongue: 'Tagalog',
      indigenousPeople: 'No',
      religion: 'Roman Catholic',
      houseNo: '',
      street: '',
      barangay: 'Aguso',
      contactNumber: '',
      lastGradeLevelCompleted: 'Grade 6',
      program: 'A&E Secondary',
      status: 'Enrolled',
      district: 'District A',
      reasonsForNotAttending: 'Employment',
    });

    setTimeout(() => {
      setFormSuccess(false);
      setCurrentSubTab('registry');
    }, 2000);
  };

  // Metrics computing based on existing records
  const totalLearnersCount = learners.length;
  const blpCount = learners.filter(l => l.program === 'Basic Literacy').length;
  const elemCount = learners.filter(l => l.program === 'A&E Elementary').length;
  const secCount = learners.filter(l => l.program === 'A&E Secondary').length;

  const maleCount = learners.filter(l => l.gender === 'Male').length;
  const femaleCount = learners.filter(l => l.gender === 'Female').length;

  const statusEnrolledCount = learners.filter(l => l.status === 'Enrolled').length;
  const statusProcessingCount = learners.filter(l => l.status === 'In Processing' || !l.status).length;
  const statusCompletedCount = learners.filter(l => l.status === 'Completed').length;
  const statusOnLeaveCount = learners.filter(l => l.status === 'On Leave').length;

  // Filtered Registry List
  const filteredRegistry = learners.filter(l => {
    const nameMatch = l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     l.recordNumber?.includes(searchTerm);
    const programMatch = programFilter === 'all' || l.program === programFilter;
    const statusMatch = statusFilter === 'all' || l.status === statusFilter;
    const genderMatch = genderFilter === 'all' || l.gender === genderFilter;
    
    return nameMatch && programMatch && statusMatch && genderMatch;
  });

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-6 flex flex-col gap-6 animate-fade-in w-full text-slate-800 font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/70 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sky-700 text-xs font-bold uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            DepEd ALS Enrollment Services
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Registration & Enrolment Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Manage electronic ALS Form 1 (AF-1) learner desks, admit new scholars, and track localized enrollment distributions.
          </p>
        </div>

        {/* Local Tab Selectors */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl self-stretch md:self-auto">
          <button
            onClick={() => setCurrentSubTab('overview')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              currentSubTab === 'overview'
                ? 'bg-white text-[#002B6D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Overview
          </button>
          
          <button
            onClick={() => setCurrentSubTab('registry')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              currentSubTab === 'registry'
                ? 'bg-white text-[#002B6D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Master Registry ({totalLearnersCount})
          </button>

          <button
            onClick={() => setCurrentSubTab('form')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              currentSubTab === 'form'
                ? 'bg-white text-[#002B6D] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            AF-1 Enrollment Desk
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: OVERVIEW & DASHBOARD METRICS */}
      {currentSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Central Orchestrator Console: ElFabriX */}
          <ElFabriXConsole />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1 */}
            <div className="bg-gradient-to-br from-[#0a1931] to-[#010918] text-slate-100 p-5 rounded-2xl shadow-sm border border-[#002B6D]/45 relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute right-2 bottom-2 opacity-[0.05] pointer-events-none">
                <Users className="w-24 h-24 text-white" />
              </div>
              <div className="flex justify-between items-start z-10">
                <span className="text-[10px] uppercase font-bold tracking-wider text-sky-305">Total Enregistered</span>
                <span className="bg-sky-500/20 text-sky-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-sky-400/10">AF-1</span>
              </div>
              <div className="mt-2 z-10">
                <div className="text-3xl font-black text-white">{totalLearnersCount}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-medium">ALS Literacy Enrollees</div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute right-2 bottom-2 opacity-[0.05] pointer-events-none">
                <GraduationCap className="w-24 h-24 text-slate-900" />
              </div>
              <div className="flex justify-between items-start z-10">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">ALS Level Splits</span>
                <span className="bg-[#002B6D]/10 text-[#002B6D] font-mono text-[9px] px-1.5 py-0.5 rounded">Levels</span>
              </div>
              <div className="mt-2 z-10 grid grid-cols-3 gap-1 divide-x divide-slate-100 text-center">
                <div>
                  <div className="text-base font-extrabold text-slate-800">{blpCount}</div>
                  <div className="text-[8px] text-slate-400 uppercase font-bold">BLP</div>
                </div>
                <div>
                  <div className="text-base font-extrabold text-slate-800">{elemCount}</div>
                  <div className="text-[8px] text-slate-400 uppercase font-bold">Elem</div>
                </div>
                <div>
                  <div className="text-base font-extrabold text-[#002B6D]">{secCount}</div>
                  <div className="text-[8px] text-slate-400 uppercase font-bold">Sec</div>
                </div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute right-2 bottom-2 opacity-[0.05] pointer-events-none">
                <UserCheck className="w-24 h-24 text-emerald-600" />
              </div>
              <div className="flex justify-between items-start z-10">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Gender Distribution</span>
                <span className="bg-emerald-50 text-emerald-700 font-mono text-[9px] px-1.5 py-0.5 rounded border border-emerald-100">Ratio</span>
              </div>
              <div className="mt-2 z-10">
                <div className="flex justify-between text-xs text-slate-500 font-bold mb-1.5">
                  <span>Male: {maleCount}</span>
                  <span>Female: {femaleCount}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${totalLearnersCount ? (maleCount / totalLearnersCount) * 100 : 50}%` }} 
                    className="bg-sky-600 h-full"
                  />
                  <div 
                    style={{ width: `${totalLearnersCount ? (femaleCount / totalLearnersCount) * 100 : 50}%` }} 
                    className="bg-rose-500 h-full"
                  />
                </div>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 relative overflow-hidden flex flex-col justify-between h-32">
              <div className="absolute right-2 bottom-2 opacity-[0.05] pointer-events-none">
                <Clock className="w-24 h-24 text-amber-500" />
              </div>
              <div className="flex justify-between items-start z-10">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Status Breakdowns</span>
                <span className="bg-amber-50 text-amber-700 font-mono text-[9px] px-1.5 py-0.5 rounded border border-amber-100">States</span>
              </div>
              <div className="mt-2 z-10 grid grid-cols-2 gap-x-2 gap-y-1 text-center justify-items-center">
                <div className="text-left w-full pl-2">
                  <span className="text-[10px] text-slate-400 font-semibold block">Enrolled</span>
                  <span className="text-sm font-black text-slate-800">{statusEnrolledCount}</span>
                </div>
                <div className="text-left w-full pl-2 border-l border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block">Processing</span>
                  <span className="text-sm font-black text-amber-600">{statusProcessingCount}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Visual Analytics row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="registration-enrolment-analytics-section">
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart4 className="w-4 h-4 text-[#002B6D]" /> Enrolment Levels breakdown
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-2">
                
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">JHS Secondary</span>
                  <span className="text-xl font-black text-slate-800 mt-1">42</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-[#002B6D] h-full rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">SHS Secondary</span>
                  <span className="text-xl font-black text-indigo-700 mt-1">17</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-indigo-650 h-full rounded-full" style={{ width: '28%' }} />
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Elementary</span>
                  <span className="text-xl font-black text-indigo-900 mt-1">11</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '18%' }} />
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Basic Literacy</span>
                  <span className="text-xl font-black text-amber-600 mt-1">6</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '10%' }} />
                  </div>
                </div>

              </div>
              
              <div className="p-3 bg-blue-50/50 border border-blue-50 rounded-xl text-[11px] text-sky-950 font-medium">
                📘 Secondary learning components (LS1 to LS6) form the largest curriculum weight of currently mapped desks.
              </div>
            </div>

            {/* Sector Registration Ratios */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3.5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Registration Complete Ratio
                </h3>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">Ratio of fully processed Form 1 (AF1) binders.</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-650">
                  <span className="font-bold">Completed Desk Admissions</span>
                  <span className="font-mono font-black text-emerald-600 text-[11px]">88% Complete</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '88%' }} />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>DATABASE STATUS: OK</span>
                <span className="text-emerald-600 font-bold">ACTIVE REGISTRATION</span>
              </div>
            </div>

          </div>

          {/* Quick Info & Informational Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-950 flex items-center gap-2 mb-3">
                  <Award className="w-4.5 h-4.5 text-[#002B6D]" />
                  DepEd Alternative Learning System Standards
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed space-y-2 mb-4">
                  Every resident or non-formal student undergoing mapping in Tarlac City is encouraged to formalize their academic progress via digital AF-1 desks. The localized data is parsed into real attendance indices of our community mobile teachers.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-slate-800 block">Form 1 (AF1) Integrity</span>
                      Admitted individuals automatically connect to class timetables under District coordinators.
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-slate-800 block">Automatic GIDs Mapping</span>
                      Every Barangay matching includes specific Geospatial GIDs to trace tablet requirements synchronously.
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">Current Registry Sync: OK</span>
                <button 
                  onClick={() => setCurrentSubTab('form')}
                  className="text-sky-700 hover:text-sky-900 font-black flex items-center gap-1 transition-all"
                >
                  Configure new desk <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick action checklist panel */}
            <div className="bg-[#002B6D] text-slate-200 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Sparkles className="w-48 h-48 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-black text-sky-400 uppercase tracking-widest mb-2">Registry Instructions</h4>
                <h3 className="text-base font-black text-white leading-tight mb-4">Admitting Students</h3>
                
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-sky-400 font-black">1.</span>
                    <span>Verify learner credentials (LRN, birth records, previous school level certificates).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-sky-400 font-black">2.</span>
                    <span>Navigate to <strong>AF-1 Enrollment Desk</strong> to insert the record data.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono text-sky-400 font-black">3.</span>
                    <span>Select correct District corresponding to their local community mobile teacher's jurisdiction.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-white/10 mt-6 flex justify-center">
                <button 
                  onClick={() => setCurrentSubTab('registry')}
                  className="w-full bg-[#E3EDFA] hover:bg-white text-[#002B6D] font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs"
                >
                  Open Enrolment Registry
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-VIEW 2: ENROLMENT MASTER REGISTRY */}
      {currentSubTab === 'registry' && (
        <div className="space-y-4">
          
          {/* Filtering, Search & Helpers header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row justify-between items-center gap-3">
            
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search LRN, last or first name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              
              {/* Program Filter */}
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">All Programs</option>
                <option value="Basic Literacy">Basic Literacy (BLP)</option>
                <option value="A&E Elementary">A&E Elementary</option>
                <option value="A&E Secondary">A&E Secondary</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">All Statuses</option>
                <option value="Enrolled">Enrolled</option>
                <option value="In Processing">In Processing</option>
                <option value="Completed">Completed</option>
                <option value="On Leave">On Leave</option>
              </select>

              {/* Gender Filter */}
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              {/* Clear filters Button */}
              {(searchTerm || programFilter !== 'all' || statusFilter !== 'all' || genderFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setProgramFilter('all');
                    setStatusFilter('all');
                    setGenderFilter('all');
                  }}
                  className="p-1 px-2.5 text-xs text-[#002B6D] hover:underline font-bold"
                >
                  Clear FILTERS
                </button>
              )}

            </div>
          </div>

          {/* Table representation */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[#475569] font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">LRN / Record ID</th>
                    <th className="py-3 px-4">Full Student Name</th>
                    <th className="py-3 px-4">Age / Sex</th>
                    <th className="py-3 px-4">Brgy / District</th>
                    <th className="py-3 px-4">Registered Program</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredRegistry.length > 0 ? (
                    filteredRegistry.map((learner, index) => (
                      <tr key={`${learner.id || 'lrn'}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                        
                        {/* LRN / ID */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                          <div>{learner.recordNumber || 'N/A'}</div>
                          <span className="text-[9px] text-slate-400 font-normal">{learner.id}</span>
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4 font-black text-slate-900 whitespace-nowrap">
                          {learner.lastName}, {learner.firstName} {learner.middleName ? learner.middleName[0] + '.' : ''}
                        </td>

                        {/* Age / Sex */}
                        <td className="py-3 px-4 whitespace-nowrap font-medium">
                          {learner.age} yrs / <span className={learner.gender === 'Female' ? 'text-rose-600 font-bold' : 'text-sky-700 font-bold'}>{learner.gender}</span>
                        </td>

                        {/* Residence / Division Area */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-700">{learner.barangay}</div>
                          <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{learner.district}</div>
                        </td>

                        {/* Program */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            learner.program === 'Basic Literacy' ? 'bg-[#E2F1E8] text-[#135F36]' :
                            learner.program === 'A&E Elementary' ? 'bg-amber-50 text-amber-800 border border-amber-200/40' :
                            'bg-[#E3EDFA] text-[#002B6D] font-black'
                          }`}>
                            {learner.program}
                          </span>
                        </td>

                        {/* Status Tag Select */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <select
                            value={learner.status || 'Enrolled'}
                            onChange={(e) => onUpdateLearner(learner.id, { status: e.target.value as any })}
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase text-center border focus:outline-none font-sans cursor-pointer ${
                              learner.status === 'Enrolled' ? 'text-emerald-500 bg-emerald-50 border-emerald-300/30' :
                              learner.status === 'Completed' ? 'text-blue-600 bg-blue-50 border-blue-400/30 font-black' :
                              learner.status === 'On Leave' ? 'text-slate-500 bg-slate-50 border-slate-300/30' :
                              'text-amber-500 bg-amber-50 border-amber-300/30'
                            }`}
                          >
                            <option value="Enrolled">Enrolled</option>
                            <option value="In Processing">In Processing</option>
                            <option value="Completed">Completed</option>
                            <option value="On Leave">On Leave</option>
                          </select>
                        </td>

                        {/* Delete Row Action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (confirm(`Are you absolutely sure you want to delete ALS Enrolment Record of ${learner.firstName} ${learner.lastName}?`)) {
                                onDeleteLearner(learner.id);
                              }
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Learner Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 px-4 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <HelpCircle className="w-8 h-8 text-slate-300" />
                          <span className="font-bold">No ALS records matching filters</span>
                          <span className="text-[10px] text-slate-400">Configure search parameters or click AF-1 Enrollment Desk above to insert.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination / Total count bottom strip */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 text-slate-500 font-mono text-[9px] flex justify-between items-center">
              <span>Showing {filteredRegistry.length} of {totalLearnersCount} enregistered entries</span>
              <span className="text-slate-400">Database Engine: Synchronous Memory Client</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: DIGITAL ENROLMENT AF-1 FORM */}
      {currentSubTab === 'form' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80">
          
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
            <span className="w-8 h-8 bg-sky-50 text-[#002B6D] border border-sky-100 rounded-full flex items-center justify-center font-bold text-sm">AF</span>
            <div>
              <h3 className="text-sm font-black text-slate-950">
                Alternative Learning System Form 1 (AF-1) Admission Desk
              </h3>
              <p className="text-[10px] text-slate-500">Provide official learner parameters below to commit to synchronized ALS Literacy database.</p>
            </div>
          </div>

          {formSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 rounded-full bg-emerald-100 p-0.5" />
              <div>
                <span>Admission complete! Student registered successfully in local memory storage.</span>
                <span className="font-mono text-[9px] block text-emerald-600 font-normal mt-0.5">Redirecting to Master Registry database...</span>
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-5 text-slate-700">
            
            {/* Step 1: Basic Demographics */}
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#002B6D] bg-[#E3EDFA] px-2 py-0.5 rounded">
                Section A: Learner Demographics
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3.5">
                
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="e.g. Dela Cruz"
                    className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-sky-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="e.g. Juan"
                    className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-sky-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                    placeholder="e.g. Rizal"
                    className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    Gender / Sex
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                    className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="99"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    placeholder="e.g. 17"
                    className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    Mother Tongue
                  </label>
                  <input
                    type="text"
                    value={formData.motherTongue}
                    onChange={(e) => setFormData({...formData, motherTongue: e.target.value})}
                    placeholder="e.g. Tagalog, Kapampangan"
                    className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

              </div>
            </div>

            {/* Step 2: Location and Contacts */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#002B6D] bg-[#E3EDFA] px-2 py-0.5 rounded">
                Section B: Residence & Contacts
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3.5">
                
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    House No. / Street
                  </label>
                  <input
                    type="text"
                    value={formData.houseNo}
                    onChange={(e) => setFormData({...formData, houseNo: e.target.value})}
                    placeholder="e.g. Blk 1 Lot 4"
                    className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    Barangay
                  </label>
                  <select
                    value={formData.barangay}
                    onChange={(e) => setFormData({...formData, barangay: e.target.value})}
                    className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Aguso">Aguso</option>
                    <option value="Alvindia">Alvindia</option>
                    <option value="Amucao">Amucao</option>
                    <option value="Armenia">Armenia</option>
                    <option value="Asturias">Asturias</option>
                    <option value="Atioc">Atioc</option>
                    <option value="Balanti">Balanti</option>
                    <option value="Matatalaib">Matatalaib</option>
                    <option value="Ligtasan">Ligtasan</option>
                    <option value="San Vicente">San Vicente</option>
                    <option value="Tibag">Tibag</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                    placeholder="e.g. 09123456789"
                    className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

              </div>
            </div>

            {/* Step 3: DepEd ALS Program Allocations */}
            <div className="pt-4 border-t border-slate-100">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#002B6D] bg-[#E3EDFA] px-2 py-0.5 rounded">
                Section C: ALS Program Allocations
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3.5">
                
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    Last Grade Level Completed
                  </label>
                  <input
                    type="text"
                    value={formData.lastGradeLevelCompleted}
                    onChange={(e) => setFormData({...formData, lastGradeLevelCompleted: e.target.value})}
                    placeholder="e.g. Grade 6, Grade 9"
                    className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    Preferred ALS Program
                  </label>
                  <select
                    value={formData.program}
                    onChange={(e) => setFormData({...formData, program: e.target.value as any})}
                    className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-sky-500 focus:outline-none font-bold text-[#002B6D]"
                  >
                    <option value="Basic Literacy">Basic Literacy Program (BLP)</option>
                    <option value="A&E Elementary">Accreditation & Equivalency (A&E) - Elementary</option>
                    <option value="A&E Secondary">Accreditation & Equivalency (A&E) - Secondary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="Enrolled">Enrolled</option>
                    <option value="In Processing">In Processing</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1">
                    Assigned Admin District
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    className="block w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="District A">District A (East)</option>
                    <option value="District B">District B (West)</option>
                    <option value="Physical Count of Inventories">Physical Count Sector</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Submission Block */}
            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCurrentSubTab('registry')}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-black text-white bg-[#002B6D] hover:bg-sky-950 rounded-xl transition-colors shadow-xs"
              >
                Admit & Enrol Scholar (AF-1)
              </button>
            </div>

          </form>

        </div>
      )}

    </div>
  );
}
