import React, { useMemo } from 'react';
import {
  Briefcase,
  Clock,
  Calendar,
  BarChart2,
  ArrowUpRight,
  Layers,
  BookOpen,
  Users,
  MapPin,
  CheckCircle,
  ShieldCheck
} from 'lucide-react';
import {
  CLASS_PROGRAM_TEACHERS,
  getConsolidatedWeeklySchedules,
  getDefaultClassProgramForTeacher,
  getAllAssignedCLCsForTeacher
} from '../utils/classProgramSync';
import { MonthlyClassroomInstructionReportCard } from './MonthlyClassroomInstructionReportCard';
import { ALSteinChatbot } from './ALSteinChatbot';

interface ClassProgramDashboardViewProps {
  onNavigateToMatrix?: () => void;
}

export function ClassProgramDashboardView({ onNavigateToMatrix }: ClassProgramDashboardViewProps) {
  // Compute dynamic consolidated analytics across all active ALS Mobile Teachers
  const analytics = useMemo(() => {
    const schedules = getConsolidatedWeeklySchedules();
    const teacherCount = CLASS_PROGRAM_TEACHERS.length;

    let overallClassroomMins = 0;
    let overallAncillaryMins = 0;
    let overallFlagMins = 0;
    let overallLunchMins = 0;

    const strandTotals: Record<string, { mins: number; label: string; color: string }> = {
      LS1: { mins: 0, label: 'LS1: Communication Skills (English & Filipino)', color: 'bg-amber-500' },
      LS2: { mins: 0, label: 'LS2: Scientific & Critical Thinking Skills', color: 'bg-emerald-500' },
      LS3: { mins: 0, label: 'LS3: Mathematical & Problem-Solving Skills', color: 'bg-blue-500' },
      LS4: { mins: 0, label: 'LS4: Life and Career Skills', color: 'bg-purple-500' },
      LS5: { mins: 0, label: 'LS5: Understanding Self and Society', color: 'bg-rose-500' },
      LS6: { mins: 0, label: 'LS6: Digital Citizenship & ICT', color: 'bg-sky-500' },
      Ancillary: { mins: 0, label: 'Ancillary Tasks & Community Mapping', color: 'bg-cyan-500' },
      Flag: { mins: 0, label: 'Flag Ceremony & Morning Assembly', color: 'bg-indigo-500' },
      Lunch: { mins: 0, label: 'Daily Lunch Break', color: 'bg-slate-500' },
    };

    const allClcSet = new Set<string>();

    CLASS_PROGRAM_TEACHERS.forEach(teacher => {
      const rows = getDefaultClassProgramForTeacher(teacher.name);
      const teacherClcs = getAllAssignedCLCsForTeacher(teacher.name, rows);
      teacherClcs.forEach(clc => allClcSet.add(clc));

      rows.forEach(row => {
        const mins = Number(row.minutes) || 0;
        const rowId = row.id?.toLowerCase() || '';
        const mondayContent = (row.monday || '').toLowerCase();

        if (row.isHeaderRow || row.bgType === 'header') {
          return;
        }

        if (row.bgType === 'flag' || rowId.includes('flag') || mondayContent.includes('flag') || mondayContent.includes('hoisting')) {
          const flagDuration = mins || 60;
          overallFlagMins += flagDuration;
          strandTotals.Flag.mins += flagDuration;
          return;
        }

        if (row.bgType === 'lunch' || rowId.includes('lunch') || mondayContent.includes('lunch')) {
          const lunchDuration = (mins || 60) * 5;
          overallLunchMins += lunchDuration;
          strandTotals.Lunch.mins += lunchDuration;
          return;
        }

        if (row.bgType === 'ancillary' || rowId.includes('ancillary') || mondayContent.includes('ancillary')) {
          const ancDuration = mins ? mins * 5 : 600;
          overallAncillaryMins += ancDuration;
          strandTotals.Ancillary.mins += ancDuration;
          return;
        }

        // Daily Classroom Teaching Slots (Mon - Fri = 5 days)
        if (mins > 0) {
          const weeklySlotMins = mins * 5;
          overallClassroomMins += weeklySlotMins;

          if (rowId.includes('ls1') || mondayContent.includes('ls1') || mondayContent.includes('communication')) {
            strandTotals.LS1.mins += weeklySlotMins;
          } else if (rowId.includes('ls2') || mondayContent.includes('ls2') || mondayContent.includes('scientific')) {
            strandTotals.LS2.mins += weeklySlotMins;
          } else if (rowId.includes('ls3') || mondayContent.includes('ls3') || mondayContent.includes('mathematical') || mondayContent.includes('math')) {
            strandTotals.LS3.mins += weeklySlotMins;
          } else if (rowId.includes('ls4') || mondayContent.includes('ls4') || mondayContent.includes('life')) {
            strandTotals.LS4.mins += weeklySlotMins;
          } else if (rowId.includes('ls5') || mondayContent.includes('ls5') || mondayContent.includes('self')) {
            strandTotals.LS5.mins += weeklySlotMins;
          } else if (rowId.includes('ls6') || mondayContent.includes('ls6') || mondayContent.includes('digital') || mondayContent.includes('ict')) {
            strandTotals.LS6.mins += weeklySlotMins;
          } else {
            strandTotals.LS1.mins += weeklySlotMins;
          }
        }
      });
    });

    const overallTotalServiceMins = overallClassroomMins + overallAncillaryMins;
    const overallGrandTotalMins = overallTotalServiceMins + overallFlagMins + overallLunchMins;

    const strandBreakdownList = Object.entries(strandTotals).map(([key, data]) => ({
      key,
      label: data.label,
      mins: data.mins,
      color: data.color
    }));

    return {
      teacherCount,
      schedules,
      uniqueClcCount: allClcSet.size,
      overallClassroomMins,
      overallClassroomHrs: (overallClassroomMins / 60).toFixed(1),
      overallAncillaryMins,
      overallAncillaryHrs: (overallAncillaryMins / 60).toFixed(1),
      overallTotalServiceMins,
      overallTotalServiceHrs: (overallTotalServiceMins / 60).toFixed(1),
      overallGrandTotalMins,
      strandBreakdownList,
      avgClassroomHrsPerTeacher: teacherCount > 0 ? (overallClassroomMins / 60 / teacherCount).toFixed(1) : '30.0',
      avgAncillaryHrsPerTeacher: teacherCount > 0 ? (overallAncillaryMins / 60 / teacherCount).toFixed(1) : '10.0',
      avgTotalHrsPerTeacher: teacherCount > 0 ? (overallTotalServiceMins / 60 / teacherCount).toFixed(1) : '40.0'
    };
  }, []);

  return (
    <div className="space-y-5 pb-12 text-slate-800 font-sans">
      {/* Top Header Notification Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-50 text-[#002B6D] border border-blue-100">
              Class Program Teaching Load & Service Matrix Analytics
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-400">
              • Division of Tarlac City ({analytics.teacherCount} Mobile Teachers Roster)
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> DepEd DO 005, s. 2024 Compliant
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#002B6D]" />
            Class Program Teaching Load & Service Matrix Analytics
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time aggregated workload distribution, statutory teaching allocations, ancillary assignments, and learning strand proportions across all {analytics.teacherCount} mobile teachers.
          </p>
        </div>

        {onNavigateToMatrix && (
          <button
            onClick={onNavigateToMatrix}
            className="px-4 py-2 bg-[#002B6D] hover:bg-[#001D4A] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
          >
            <Calendar className="w-4 h-4" /> View Schedule Matrix Table
            <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
          </button>
        )}
      </div>

      {/* Core Overall Workload Service Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-500 tracking-wider">
              NUMBER OF TEACHERS
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">
              {analytics.teacherCount} <span className="text-xs text-slate-500 font-bold">Facilitators</span>
            </span>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Active Division Mobile Teachers Roster
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-500 tracking-wider">
              OVERALL CLASSROOM INSTRUCTION
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">
              {analytics.overallClassroomMins.toLocaleString()} <span className="text-xs text-slate-500 font-bold">mins/wk</span>
            </span>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              {analytics.overallClassroomHrs} hrs/wk total • avg {analytics.avgClassroomHrsPerTeacher} hrs/teacher
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-500 tracking-wider">
              OVERALL ANCILLARY DUTIES
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">
              {analytics.overallAncillaryMins.toLocaleString()} <span className="text-xs text-slate-500 font-bold">mins/wk</span>
            </span>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              {analytics.overallAncillaryHrs} hrs/wk total • avg {analytics.avgAncillaryHrsPerTeacher} hrs/teacher
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-500 tracking-wider">
              OVERALL TOTAL WEEKLY SERVICE
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#002B6D] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">
              {analytics.overallTotalServiceMins.toLocaleString()} <span className="text-xs text-slate-500 font-bold">mins</span>
            </span>
            <p className="text-[11px] font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              {analytics.overallTotalServiceHrs} Net Hrs ({analytics.avgTotalHrsPerTeacher} hrs/teacher/wk)
            </p>
          </div>
        </div>
      </div>

      {/* Container: Monthly Classroom Instruction Time Report */}
      <MonthlyClassroomInstructionReportCard teacherCount={analytics.teacherCount} />

      {/* Overall Learning Strand Breakdown Visual Bars Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#002B6D]" />
              Overall Weekly Learning Strand & Activity Allocation Ratios
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Consolidated time allocation across Learning Strands LS1 - LS6, Ancillary Tasks, and Morning Assembly for all {analytics.teacherCount} Mobile Teachers.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#002B6D] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 shrink-0">
            Grand Total: {analytics.overallGrandTotalMins.toLocaleString()} Mins / Week
          </span>
        </div>

        <div className="space-y-3.5">
          {analytics.strandBreakdownList.map((item) => {
            const percentage = analytics.overallGrandTotalMins > 0
              ? ((item.mins / analytics.overallGrandTotalMins) * 100).toFixed(1)
              : '0.0';

            return (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    {item.label}
                  </span>
                  <span className="text-slate-900 font-mono font-black">
                    {item.mins.toLocaleString()} mins <span className="text-slate-400 font-normal">({percentage}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(2, Number(percentage)))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Persistent Assistant Chatbot: ALStein */}
      <ALSteinChatbot />
    </div>
  );
}

