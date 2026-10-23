/**
 * Philippine National Holidays (Regular and Special Non-Working Days)
 * for School Year 2026–2027 (Beginning June 15, 2026 through May 31, 2027)
 * aligned with Philippine Proclamations and official national holiday calendars.
 */

export interface NationalHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'Regular Holiday' | 'Special Non-Working Day' | 'Special Working Day';
  description?: string;
  isExcludedFromInstruction: boolean; // whether classes are suspended / excluded from instruction hours
}

export interface MonthlyInstructionReportData {
  monthKey: string; // e.g. "2026-06"
  monthName: string; // e.g. "June 2026"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalCalendarDays: number;
  totalWeekdays: number; // Mon-Fri
  holidays: (NationalHoliday & { dayOfWeek: string; formattedDate: string })[];
  weekdayHolidayCount: number; // holidays that fall on Mon-Fri
  actualInstructionalDays: number; // total weekdays minus weekday holidays
  dailyClassroomMinsPerTeacher: number; // statutory 360 mins (6 hrs)
  dailyAncillaryMinsPerTeacher: number; // statutory 120 mins (2 hrs)
  dailyTotalMinsPerTeacher: number; // statutory 480 mins (8 hrs)
  teacherCount: number;
  // Per-teacher monthly totals
  monthlyClassroomHoursPerTeacher: number;
  monthlyAncillaryHoursPerTeacher: number;
  monthlyTotalHoursPerTeacher: number;
  // Division-wide monthly aggregated totals
  divisionTotalClassroomMins: number;
  divisionTotalClassroomHours: number;
  divisionTotalAncillaryHours: number;
  divisionGrandTotalHours: number;
}

/**
 * Official Philippine National Holidays from June 2026 through May 2027.
 * SY 2026-2027 opens on June 15, 2026.
 */
export const PHILIPPINE_NATIONAL_HOLIDAYS_SY2026_2027: NationalHoliday[] = [
  // June 2026 (Note: June 12 Independence Day is prior to SY opening on June 15)
  // July 2026
  // (No nationwide regular holiday in July, except local/special observances if proclaimed)
  // August 2026
  {
    date: '2026-08-21',
    name: 'Ninoy Aquino Day',
    type: 'Special Non-Working Day',
    description: 'National commemoration of the martyrdom of Benigno Aquino Jr.',
    isExcludedFromInstruction: true
  },
  {
    date: '2026-08-31',
    name: 'National Heroes Day',
    type: 'Regular Holiday',
    description: 'Last Monday of August honoring all Philippine national heroes',
    isExcludedFromInstruction: true
  },
  // September 2026
  // (Standard school operations; ALS literacy month activities)
  // October 2026
  // (World / National Teachers Day on Oct 5 is a working observance)
  // November 2026
  {
    date: '2026-11-01',
    name: "All Saints' Day",
    type: 'Special Non-Working Day',
    description: "Solemnity of All Saints' Day (Undas)",
    isExcludedFromInstruction: true
  },
  {
    date: '2026-11-02',
    name: "All Souls' Day",
    type: 'Special Non-Working Day',
    description: 'Special non-working day for family observances',
    isExcludedFromInstruction: true
  },
  {
    date: '2026-11-30',
    name: 'Bonifacio Day',
    type: 'Regular Holiday',
    description: 'Birth anniversary of national hero Andres Bonifacio',
    isExcludedFromInstruction: true
  },
  // December 2026
  {
    date: '2026-12-08',
    name: 'Feast of the Immaculate Conception',
    type: 'Special Non-Working Day',
    description: 'Patroness of the Philippines under Republic Act No. 10966',
    isExcludedFromInstruction: true
  },
  {
    date: '2026-12-24',
    name: 'Christmas Eve',
    type: 'Special Non-Working Day',
    description: 'Traditional holiday eve before Christmas Day',
    isExcludedFromInstruction: true
  },
  {
    date: '2026-12-25',
    name: 'Christmas Day',
    type: 'Regular Holiday',
    description: 'Nativity of the Lord Jesus Christ',
    isExcludedFromInstruction: true
  },
  {
    date: '2026-12-30',
    name: 'Rizal Day',
    type: 'Regular Holiday',
    description: 'Martyrdom anniversary of Dr. Jose Rizal',
    isExcludedFromInstruction: true
  },
  {
    date: '2026-12-31',
    name: "Last Day of the Year / New Year's Eve",
    type: 'Special Non-Working Day',
    description: 'End of year national non-working holiday',
    isExcludedFromInstruction: true
  },
  // January 2027
  {
    date: '2027-01-01',
    name: "New Year's Day",
    type: 'Regular Holiday',
    description: 'First day of the civil year',
    isExcludedFromInstruction: true
  },
  {
    date: '2027-01-23',
    name: 'First Philippine Republic Day',
    type: 'Special Working Day',
    description: 'Anniversary of Malolos Republic (RA 11014 - Classes observed)',
    isExcludedFromInstruction: false
  },
  // February 2027
  {
    date: '2027-02-06',
    name: 'Chinese New Year (Spring Festival)',
    type: 'Special Non-Working Day',
    description: 'Lunar New Year celebration',
    isExcludedFromInstruction: true
  },
  {
    date: '2027-02-25',
    name: 'EDSA People Power Revolution Anniversary',
    type: 'Special Non-Working Day',
    description: 'Commemoration of peaceful restoration of Philippine democracy',
    isExcludedFromInstruction: true
  },
  // March 2027
  {
    date: '2027-03-10',
    name: 'Eid al-Fitr (Feast of Ramadhan)',
    type: 'Regular Holiday',
    description: 'Islamic celebration concluding the holy month of Ramadan (est.)',
    isExcludedFromInstruction: true
  },
  {
    date: '2027-03-25',
    name: 'Maundy Thursday',
    type: 'Regular Holiday',
    description: 'Holy Week religious observance',
    isExcludedFromInstruction: true
  },
  {
    date: '2027-03-26',
    name: 'Good Friday',
    type: 'Regular Holiday',
    description: 'Solemn Holy Week commemoration of the Passion of Christ',
    isExcludedFromInstruction: true
  },
  {
    date: '2027-03-27',
    name: 'Black Saturday',
    type: 'Special Non-Working Day',
    description: 'Holy Week Saturday preceding Easter Sunday',
    isExcludedFromInstruction: true
  },
  // April 2027
  {
    date: '2027-04-09',
    name: 'Araw ng Kagitingan (Day of Valor)',
    type: 'Regular Holiday',
    description: 'Honoring WWII veterans of Bataan and Corregidor',
    isExcludedFromInstruction: true
  },
  // May 2027
  {
    date: '2027-05-01',
    name: 'Labor Day',
    type: 'Regular Holiday',
    description: 'Honoring all Filipino workers and laborers',
    isExcludedFromInstruction: true
  },
  {
    date: '2027-05-17',
    name: 'Eid al-Adha (Feast of the Sacrifice)',
    type: 'Regular Holiday',
    description: 'Islamic festival honoring the willingness to sacrifice (est.)',
    isExcludedFromInstruction: true
  }
];

/**
 * Month definitions starting strictly with June 15, 2026.
 */
export const SCHOOL_YEAR_MONTHS = [
  { key: '2026-06', name: 'June 2026', startDay: 15, endDay: 30, year: 2026, month: 5, note: 'SY 2026–2027 begins June 15, 2026' },
  { key: '2026-07', name: 'July 2026', startDay: 1, endDay: 31, year: 2026, month: 6 },
  { key: '2026-08', name: 'August 2026', startDay: 1, endDay: 31, year: 2026, month: 7 },
  { key: '2026-09', name: 'September 2026', startDay: 1, endDay: 30, year: 2026, month: 8 },
  { key: '2026-10', name: 'October 2026', startDay: 1, endDay: 31, year: 2026, month: 9 },
  { key: '2026-11', name: 'November 2026', startDay: 1, endDay: 30, year: 2026, month: 10 },
  { key: '2026-12', name: 'December 2026', startDay: 1, endDay: 31, year: 2026, month: 11 },
  { key: '2027-01', name: 'January 2027', startDay: 1, endDay: 31, year: 2027, month: 0 },
  { key: '2027-02', name: 'February 2027', startDay: 1, endDay: 28, year: 2027, month: 1 },
  { key: '2027-03', name: 'March 2027', startDay: 1, endDay: 31, year: 2027, month: 2 },
  { key: '2027-04', name: 'April 2027', startDay: 1, endDay: 30, year: 2027, month: 3 },
  { key: '2027-05', name: 'May 2027', startDay: 1, endDay: 31, year: 2027, month: 4 }
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Calculates accurate instructional day metrics, holiday exclusions, and
 * classroom teaching hours for any selected month.
 */
export function calculateMonthlyInstructionReport(
  monthKey: string,
  teacherCount: number = 17,
  weeklyClassroomMinsPerTeacher: number = 1800 // 6 hrs/day * 5 days = 1800 mins
): MonthlyInstructionReportData {
  const monthDef = SCHOOL_YEAR_MONTHS.find(m => m.key === monthKey) || SCHOOL_YEAR_MONTHS[0];
  const { year, month, startDay, endDay, name } = monthDef;

  const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  let totalCalendarDays = 0;
  let totalWeekdays = 0;

  // Track all weekdays (Mon-Fri = 1 to 5)
  const weekdaysMap = new Map<string, number>(); // YYYY-MM-DD -> day of week

  for (let d = startDay; d <= endDay; d++) {
    totalCalendarDays++;
    const curDate = new Date(year, month, d);
    const dayOfWeek = curDate.getDay(); // 0 = Sun, 1 = Mon ... 5 = Fri, 6 = Sat
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      totalWeekdays++;
      weekdaysMap.set(dateKey, dayOfWeek);
    }
  }

  // Find all national holidays falling within this month's active date range
  const monthHolidays = PHILIPPINE_NATIONAL_HOLIDAYS_SY2026_2027.filter(h => {
    return h.date >= startDateStr && h.date <= endDateStr;
  }).map(h => {
    const [y, m, d] = h.date.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayOfWeek = DAY_NAMES[dt.getDay()];
    const formattedDate = dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return {
      ...h,
      dayOfWeek,
      formattedDate
    };
  });

  // Weekday holidays that exclude instruction (falling on Mon-Fri and isExcludedFromInstruction)
  const weekdayHolidays = monthHolidays.filter(h => {
    return h.isExcludedFromInstruction && weekdaysMap.has(h.date);
  });

  const weekdayHolidayCount = weekdayHolidays.length;
  const actualInstructionalDays = Math.max(0, totalWeekdays - weekdayHolidayCount);

  // Daily statutory workload per DepEd DO 005, s. 2024 & Magna Carta for Public School Teachers
  // 6 hours (360 mins) actual classroom teaching + 2 hours (120 mins) ancillary = 8 hours (480 mins)
  const dailyClassroomMinsPerTeacher = 360;
  const dailyAncillaryMinsPerTeacher = 120;
  const dailyTotalMinsPerTeacher = 480;

  const monthlyClassroomHoursPerTeacher = (actualInstructionalDays * dailyClassroomMinsPerTeacher) / 60;
  const monthlyAncillaryHoursPerTeacher = (actualInstructionalDays * dailyAncillaryMinsPerTeacher) / 60;
  const monthlyTotalHoursPerTeacher = (actualInstructionalDays * dailyTotalMinsPerTeacher) / 60;

  const divisionTotalClassroomMins = actualInstructionalDays * dailyClassroomMinsPerTeacher * teacherCount;
  const divisionTotalClassroomHours = divisionTotalClassroomMins / 60;
  const divisionTotalAncillaryHours = (actualInstructionalDays * dailyAncillaryMinsPerTeacher * teacherCount) / 60;
  const divisionGrandTotalHours = divisionTotalClassroomHours + divisionTotalAncillaryHours;

  return {
    monthKey: monthDef.key,
    monthName: name,
    startDate: startDateStr,
    endDate: endDateStr,
    totalCalendarDays,
    totalWeekdays,
    holidays: monthHolidays,
    weekdayHolidayCount,
    actualInstructionalDays,
    dailyClassroomMinsPerTeacher,
    dailyAncillaryMinsPerTeacher,
    dailyTotalMinsPerTeacher,
    teacherCount,
    monthlyClassroomHoursPerTeacher,
    monthlyAncillaryHoursPerTeacher,
    monthlyTotalHoursPerTeacher,
    divisionTotalClassroomMins,
    divisionTotalClassroomHours,
    divisionTotalAncillaryHours,
    divisionGrandTotalHours
  };
}
