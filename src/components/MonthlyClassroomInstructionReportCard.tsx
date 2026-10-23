import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  CalendarCheck,
  ChevronDown,
  FileSpreadsheet,
  Download,
  Printer,
  Sparkles,
  Info
} from 'lucide-react';
import {
  SCHOOL_YEAR_MONTHS,
  calculateMonthlyInstructionReport,
  MonthlyInstructionReportData
} from '../data/holidaysData';

interface MonthlyClassroomInstructionReportCardProps {
  teacherCount?: number;
}

export function MonthlyClassroomInstructionReportCard({
  teacherCount = 17
}: MonthlyClassroomInstructionReportCardProps) {
  // Dropdown begins with June 15, 2026 (index 0 is '2026-06')
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(SCHOOL_YEAR_MONTHS[0].key);

  const reportData: MonthlyInstructionReportData = useMemo(() => {
    return calculateMonthlyInstructionReport(selectedMonthKey, teacherCount);
  }, [selectedMonthKey, teacherCount]);

  const selectedMonthMeta = useMemo(() => {
    return SCHOOL_YEAR_MONTHS.find(m => m.key === selectedMonthKey) || SCHOOL_YEAR_MONTHS[0];
  }, [selectedMonthKey]);

  // Export report to CSV
  const handleExportCSV = () => {
    const lines: string[] = [];
    lines.push(`Monthly Classroom Instruction Time Report - DepEd ALS Division of Tarlac City`);
    lines.push(`Report Month: ${reportData.monthName} (Effective: ${reportData.startDate} to ${reportData.endDate})`);
    lines.push(`Active ALS Mobile Teachers: ${reportData.teacherCount}`);
    lines.push(``);
    lines.push(`METRIC,VALUE,UNIT`);
    lines.push(`Total Calendar Days in Window,${reportData.totalCalendarDays},Days`);
    lines.push(`Total Weekdays (Monday-Friday),${reportData.totalWeekdays},Days`);
    lines.push(`Excluded Weekday National Holidays,${reportData.weekdayHolidayCount},Days`);
    lines.push(`Net Actual Instructional Days,${reportData.actualInstructionalDays},Days`);
    lines.push(`Statutory Daily Teaching Load,${reportData.dailyClassroomMinsPerTeacher / 60},Hours/day (360 mins)`);
    lines.push(`Statutory Daily Ancillary Duty,${reportData.dailyAncillaryMinsPerTeacher / 60},Hours/day (120 mins)`);
    lines.push(`Monthly Teaching Load per Teacher,${reportData.monthlyClassroomHoursPerTeacher.toFixed(1)},Hours`);
    lines.push(`Monthly Ancillary Load per Teacher,${reportData.monthlyAncillaryHoursPerTeacher.toFixed(1)},Hours`);
    lines.push(`Monthly Total Workload per Teacher,${reportData.monthlyTotalHoursPerTeacher.toFixed(1)},Hours`);
    lines.push(`Division Total Classroom Instruction Time,${reportData.divisionTotalClassroomHours.toFixed(1)},Hours (${reportData.divisionTotalClassroomMins.toLocaleString()} mins)`);
    lines.push(`Division Total Ancillary Duty Time,${reportData.divisionTotalAncillaryHours.toFixed(1)},Hours`);
    lines.push(`Division Grand Total Monthly Service Time,${reportData.divisionGrandTotalHours.toFixed(1)},Hours`);
    lines.push(``);
    lines.push(`NATIONAL HOLIDAYS IN ${reportData.monthName.toUpperCase()}`);
    lines.push(`Date,Day,Holiday Name,Type,Instruction Status`);

    if (reportData.holidays.length === 0) {
      lines.push(`None,N/A,No National Holidays Proclaimed for this Month,N/A,Regular Class Operations`);
    } else {
      reportData.holidays.forEach(h => {
        lines.push(`"${h.date}","${h.dayOfWeek}","${h.name.replace(/"/g, '""')}","${h.type}","${h.isExcludedFromInstruction ? 'EXCLUDED FROM COMPUTATION' : 'INCLUDED / WORKING'}"`);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monthly_Instruction_Report_${reportData.monthKey}_TCSD_ALS.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="monthly-instruction-time-report-container"
      className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-6"
    >
      {/* Top Header & Month Dropdown Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CalendarCheck className="w-3 h-3 text-emerald-600" />
              Statutory Instruction Report
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-400">
              • DepEd Order No. 005, s. 2024 & Magna Carta
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-50 text-[#002B6D] border border-blue-100">
              Starts June 15, 2026
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#002B6D]" />
            Monthly Classroom Instruction Time Report
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-2xl">
            Accurate monthly accounting of classroom instructional time, teaching load, and ancillary duty across all {reportData.teacherCount} Mobile Teachers. National holidays are automatically audited and excluded from net teaching computations.
          </p>
        </div>

        {/* Dropdown & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Select Month:</span>
            <select
              id="monthly-instruction-report-month-select"
              value={selectedMonthKey}
              onChange={e => setSelectedMonthKey(e.target.value)}
              className="bg-transparent text-xs font-extrabold text-[#002B6D] focus:outline-hidden cursor-pointer pr-2"
            >
              {SCHOOL_YEAR_MONTHS.map(m => (
                <option key={m.key} value={m.key}>
                  {m.name} {m.note ? `(${m.note})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Export this monthly instructional report to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export</span> Report
          </button>
        </div>
      </div>

      {/* Special Context Banner for June 15, 2026 or Current Month */}
      {selectedMonthMeta.note && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-xs text-[#002B6D] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold uppercase tracking-wide text-[10px] text-blue-800 block">
              Official School Year Opening Window
            </span>
            <span>
              School Year 2026–2027 officially begins on <strong>June 15, 2026</strong>. Instructional computations for June are calibrated starting from June 15 through June 30, 2026 (prior dates are pre-school opening and excluded).
            </span>
          </div>
        </div>
      )}

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Actual Instructional Days */}
        <div className="bg-slate-50/90 rounded-xl border border-slate-200 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-500">
              INSTRUCTIONAL DAYS
            </span>
            <span className="px-2 py-0.5 text-[9px] font-mono font-extrabold bg-emerald-100 text-emerald-800 rounded-md">
              Net Days
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">
              {reportData.actualInstructionalDays}
            </span>
            <span className="text-xs font-bold text-slate-500">School Days</span>
          </div>
          <p className="text-[10.5px] text-slate-500 font-medium">
            {reportData.totalWeekdays} weekdays • <span className="text-rose-600 font-bold">-{reportData.weekdayHolidayCount} holiday{reportData.weekdayHolidayCount === 1 ? '' : 's'}</span>
          </p>
        </div>

        {/* Metric 2: Monthly Hours per Teacher */}
        <div className="bg-slate-50/90 rounded-xl border border-slate-200 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-500">
              PER TEACHER LOAD
            </span>
            <span className="px-2 py-0.5 text-[9px] font-mono font-extrabold bg-amber-100 text-amber-800 rounded-md">
              6h/Day
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#002B6D]">
              {reportData.monthlyClassroomHoursPerTeacher.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-slate-500">Teaching Hrs</span>
          </div>
          <p className="text-[10.5px] text-slate-500 font-medium">
            + {reportData.monthlyAncillaryHoursPerTeacher.toFixed(1)} hrs ancillary = <strong className="text-slate-800">{reportData.monthlyTotalHoursPerTeacher.toFixed(1)} total hrs</strong>
          </p>
        </div>

        {/* Metric 3: Division-Wide Classroom Instruction */}
        <div className="bg-slate-50/90 rounded-xl border border-slate-200 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-500">
              DIVISION INSTRUCTION TIME
            </span>
            <span className="px-2 py-0.5 text-[9px] font-mono font-extrabold bg-blue-100 text-[#002B6D] rounded-md">
              {reportData.teacherCount} Teachers
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900">
              {reportData.divisionTotalClassroomHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
            <span className="text-xs font-bold text-slate-500">Hours</span>
          </div>
          <p className="text-[10.5px] text-slate-500 font-medium">
            {reportData.divisionTotalClassroomMins.toLocaleString()} instruction minutes total
          </p>
        </div>

        {/* Metric 4: Excluded National Holidays */}
        <div className="bg-slate-50/90 rounded-xl border border-slate-200 p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-500">
              HOLIDAYS EXCLUDED
            </span>
            <span className={`px-2 py-0.5 text-[9px] font-mono font-extrabold rounded-md ${
              reportData.weekdayHolidayCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
            }`}>
              {reportData.weekdayHolidayCount > 0 ? `${reportData.weekdayHolidayCount} Excluded` : '0 Days'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-rose-700">
              {reportData.holidays.length}
            </span>
            <span className="text-xs font-bold text-slate-500">National Observances</span>
          </div>
          <p className="text-[10.5px] text-slate-500 font-medium">
            {reportData.weekdayHolidayCount} weekday suspension{reportData.weekdayHolidayCount === 1 ? '' : 's'} deducted
          </p>
        </div>
      </div>

      {/* National Holidays Audit & Exclusion Breakdown Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
              National Holidays in {reportData.monthName} & Exclusion Status
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {reportData.holidays.length === 0
              ? 'No national holidays this month'
              : `${reportData.holidays.length} holiday${reportData.holidays.length > 1 ? 's' : ''} audited`}
          </span>
        </div>

        {reportData.holidays.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600 font-medium flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>
              <strong>Zero class suspensions.</strong> All {reportData.totalWeekdays} weekdays in {reportData.monthName} are active instructional days with standard 360-minute daily teaching load per facilitator.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3">National Holiday / Observance</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3 text-center">Effect on Computation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reportData.holidays.map((h, idx) => {
                  const isWeekend = h.dayOfWeek === 'Saturday' || h.dayOfWeek === 'Sunday';
                  return (
                    <tr key={h.date || idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {h.formattedDate}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">
                        {h.dayOfWeek}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-extrabold text-slate-900">{h.name}</span>
                        {h.description && (
                          <span className="block text-[10.5px] text-slate-500 font-normal">
                            {h.description}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          h.type === 'Regular Holiday'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : h.type === 'Special Non-Working Day'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {h.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {h.isExcludedFromInstruction ? (
                          isWeekend ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              Falls on Weekend (No Weekday Deduct)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                              Excluded from Net Hours (-6 hrs/teacher)
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Special Working Day (Classes Maintained)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructional Time Math & Magna Carta Compliance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
          <div className="flex items-center gap-2 text-[#002B6D] font-extrabold text-xs">
            <BookOpen className="w-4 h-4 text-[#002B6D]" />
            <span>Monthly Instructional Computation Formula</span>
          </div>
          <div className="text-xs text-slate-700 space-y-1 font-mono text-[11px]">
            <p>
              • <strong>Gross Weekdays:</strong> {reportData.totalWeekdays} days (Mon–Fri)
            </p>
            <p>
              • <strong>Excluded Holidays:</strong> -{reportData.weekdayHolidayCount} days
            </p>
            <p className="text-emerald-800 font-bold">
              • <strong>Net Instructional Days:</strong> {reportData.actualInstructionalDays} days
            </p>
            <p className="text-[#002B6D] font-bold pt-1 border-t border-blue-200">
              • <strong>Teaching Time Formula:</strong> {reportData.actualInstructionalDays} days × 360 mins (6.0 hrs) = <strong>{reportData.monthlyClassroomHoursPerTeacher.toFixed(1)} hrs/teacher</strong>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Statutory Reference & Workday Guidelines</span>
          </div>
          <div className="text-[11px] text-slate-600 space-y-1 leading-relaxed">
            <p>
              • <strong>Actual Classroom Teaching:</strong> Capped at 6 hours (360 minutes) daily under the Magna Carta for Public School Teachers (RA 4670).
            </p>
            <p>
              • <strong>Ancillary Tasks:</strong> 2 hours (120 minutes) daily for lesson preparation, learner portfolio evaluation, and community coordination (DepEd DO 005, s. 2024).
            </p>
            <p className="text-slate-900 font-bold">
              • <strong>Full Workday:</strong> 8 hours total service per day (480 minutes).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
