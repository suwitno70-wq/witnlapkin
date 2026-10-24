import { ActivityCategory, DailyActivityItem, ReportConfig, TeacherProfile } from '../types';

export interface CalendarDayInfo {
  date: number; // 1 - 31
  fullDateStr: string; // 'DD/MM/YYYY'
  isoDateStr: string; // 'YYYY-MM-DD'
  dayOfWeek: number; // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  dayName: string; // 'Senin', 'Selasa', etc.
  isWeekend: boolean; // Sunday or Saturday (depending on 5/6 days work week)
  isSunday: boolean;
  isSaturday: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isWorkingDay: boolean;
  activities: DailyActivityItem[];
}

export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];

export interface HolidayEntry {
  day: number;
  month: number; // 0-indexed (0 = Januari, 11 = Desember)
  year?: number; // optional, if undefined applies to all years
  name: string;
}

// Indonesian National Holidays
export const INDONESIAN_HOLIDAYS: HolidayEntry[] = [
  // Fixed annual national holidays
  { day: 1, month: 0, name: 'Tahun Baru Masehi' },
  { day: 1, month: 4, name: 'Hari Buruh Internasional' },
  { day: 2, month: 4, name: 'Hari Pendidikan Nasional (Hardiknas)' },
  { day: 1, month: 5, name: 'Hari Lahir Pancasila' },
  { day: 17, month: 7, name: 'Hari Kemerdekaan Republik Indonesia' },
  { day: 25, month: 10, name: 'Hari Guru Nasional' },
  { day: 25, month: 11, name: 'Hari Raya Natal' },

  // 2025 Islamic & Lunar Holidays
  { day: 27, month: 0, year: 2025, name: "Isra Mi'raj Nabi Muhammad SAW" },
  { day: 29, month: 0, year: 2025, name: 'Tahun Baru Imlek 2576' },
  { day: 29, month: 2, year: 2025, name: 'Hari Suci Nyepi Tahun Baru Saka 1947' },
  { day: 31, month: 2, year: 2025, name: 'Hari Raya Idul Fitri 1446 H' },
  { day: 1, month: 3, year: 2025, name: 'Hari Raya Idul Fitri 1446 H' },
  { day: 18, month: 3, year: 2025, name: 'Wafat Yesus Kristus' },
  { day: 12, month: 4, year: 2025, name: 'Hari Raya Waisak 2569 BE' },
  { day: 29, month: 4, year: 2025, name: 'Kenaikan Yesus Kristus' },
  { day: 7, month: 5, year: 2025, name: 'Hari Raya Idul Adha 1446 H' },
  { day: 27, month: 5, year: 2025, name: 'Tahun Baru Islam 1447 H' },
  { day: 5, month: 8, year: 2025, name: 'Maulid Nabi Muhammad SAW' },

  // 2026 Islamic & Lunar Holidays
  { day: 16, month: 0, year: 2026, name: "Isra Mi'raj Nabi Muhammad SAW" },
  { day: 17, month: 1, year: 2026, name: 'Tahun Baru Imlek 2577' },
  { day: 19, month: 2, year: 2026, name: 'Hari Suci Nyepi Tahun Baru Saka 1948' },
  { day: 20, month: 2, year: 2026, name: 'Hari Raya Idul Fitri 1447 H' },
  { day: 21, month: 2, year: 2026, name: 'Hari Raya Idul Fitri 1447 H' },
  { day: 3, month: 3, year: 2026, name: 'Wafat Yesus Kristus' },
  { day: 14, month: 4, year: 2026, name: 'Kenaikan Yesus Kristus' },
  { day: 31, month: 4, year: 2026, name: 'Hari Raya Waisak 2570 BE' },
  { day: 27, month: 4, year: 2026, name: 'Hari Raya Idul Adha 1447 H' },
  { day: 16, month: 5, year: 2026, name: 'Tahun Baru Islam 1448 H' },
  { day: 25, month: 7, year: 2026, name: 'Maulid Nabi Muhammad SAW' },
  { day: 4, month: 8, year: 2026, name: 'Maulid Nabi Muhammad SAW' },

  // 2027 Islamic & Lunar Holidays
  { day: 5, month: 1, year: 2027, name: "Isra Mi'raj Nabi Muhammad SAW" },
  { day: 6, month: 1, year: 2027, name: 'Tahun Baru Imlek 2578' },
  { day: 10, month: 2, year: 2027, name: 'Hari Raya Idul Fitri 1448 H' },
  { day: 11, month: 2, year: 2027, name: 'Hari Raya Idul Fitri 1448 H' },
  { day: 26, month: 2, year: 2027, name: 'Hari Suci Nyepi' },
  { day: 26, month: 2, year: 2027, name: 'Wafat Yesus Kristus' },
  { day: 6, month: 4, year: 2027, name: 'Kenaikan Yesus Kristus' },
  { day: 17, month: 4, year: 2027, name: 'Hari Raya Idul Adha 1448 H' },
  { day: 6, month: 5, year: 2027, name: 'Tahun Baru Islam 1449 H' },
  { day: 15, month: 7, year: 2027, name: 'Maulid Nabi Muhammad SAW' },
];

export function getMonthIndexFromName(monthName: string): number {
  if (!monthName) return 8; // Default September
  const cleaned = monthName.trim().toLowerCase();
  const idx = MONTH_NAMES_ID.findIndex((m) => m.toLowerCase() === cleaned);
  return idx !== -1 ? idx : 8;
}

export function getHolidayInfo(
  day: number,
  monthIndex: number,
  year: number,
  customHolidays: string[] = []
): { isHoliday: boolean; holidayName?: string } {
  // Check custom dates format 'DD/MM/YYYY'
  const dd = String(day).padStart(2, '0');
  const mm = String(monthIndex + 1).padStart(2, '0');
  const fullDate = `${dd}/${mm}/${year}`;
  if (customHolidays.includes(fullDate)) {
    return { isHoliday: true, holidayName: 'Hari Libur Khusus / Cuti Bersama' };
  }

  // Check national holidays list
  const match = INDONESIAN_HOLIDAYS.find((h) => {
    if (h.month !== monthIndex || h.day !== day) return false;
    if (h.year !== undefined && h.year !== year) return false;
    return true;
  });

  if (match) {
    return { isHoliday: true, holidayName: match.name };
  }

  return { isHoliday: false };
}

export interface CalendarMonthData {
  monthName: string;
  monthIndex: number;
  year: number;
  daysInMonth: number;
  firstDayOfWeek: number; // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  days: CalendarDayInfo[];
  totalWorkingDays: number;
  totalHolidays: number;
  totalActivitiesCount: number;
}

/**
 * Builds full calendar data for the selected month and year
 */
export function buildMonthCalendar(
  monthName: string,
  year: number,
  activities: DailyActivityItem[],
  workDaysMode: '5_days' | '6_days' = '6_days',
  customHolidays: string[] = []
): CalendarMonthData {
  const monthIndex = getMonthIndexFromName(monthName);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();

  const days: CalendarDayInfo[] = [];
  let totalWorkingDays = 0;
  let totalHolidays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, monthIndex, d);
    const dayOfWeek = dateObj.getDay();
    const dayName = DAY_NAMES_ID[dayOfWeek];
    const dd = String(d).padStart(2, '0');
    const mm = String(monthIndex + 1).padStart(2, '0');
    const fullDateStr = `${dd}/${mm}/${year}`;
    const isoDateStr = `${year}-${mm}-${dd}`;

    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const isWeekend = workDaysMode === '5_days' ? isSunday || isSaturday : isSunday;

    const holidayInfo = getHolidayInfo(d, monthIndex, year, customHolidays);
    const isWorkingDay = !isWeekend && !holidayInfo.isHoliday;

    if (isWorkingDay) totalWorkingDays++;
    if (holidayInfo.isHoliday) totalHolidays++;

    // Match activities for this day
    const dayActivities = activities.filter((act) => act.date === fullDateStr);

    days.push({
      date: d,
      fullDateStr,
      isoDateStr,
      dayOfWeek,
      dayName,
      isWeekend,
      isSunday,
      isSaturday,
      isHoliday: holidayInfo.isHoliday,
      holidayName: holidayInfo.holidayName,
      isWorkingDay,
      activities: dayActivities,
    });
  }

  const totalActivitiesCount = activities.length;

  return {
    monthName,
    monthIndex,
    year,
    daysInMonth,
    firstDayOfWeek,
    days,
    totalWorkingDays,
    totalHolidays,
    totalActivitiesCount,
  };
}

export type SchedulePreset =
  | 'pjok' // Guru PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan)
  | 'guru_kelas' // Guru Kelas (Madrasah Ibtidaiyah / SD)
  | 'guru_mapel' // Guru Mata Pelajaran Umum (Matematika, IPA, PAI, dll)
  | 'pembelajaran_umum'; // Format standar "Proses Belajar Mengajar"

/**
 * Generates realistic daily activities for each working day in the month
 */
export function generateMonthlyActivitiesSchedule(
  config: ReportConfig,
  teacher: TeacherProfile,
  workDaysMode: '5_days' | '6_days' = '6_days',
  preset: SchedulePreset = 'pembelajaran_umum',
  customHolidays: string[] = []
): DailyActivityItem[] {
  const monthIndex = getMonthIndexFromName(config.monthName);
  const year = config.year || 2026;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const generatedList: DailyActivityItem[] = [];
  let actCounter = 1;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, monthIndex, d);
    const dayOfWeek = dateObj.getDay();
    const dayName = DAY_NAMES_ID[dayOfWeek];

    const isSunday = dayOfWeek === 0;
    const isSaturday = dayOfWeek === 6;
    const isOffDay = workDaysMode === '5_days' ? isSunday || isSaturday : isSunday;

    // Skip holidays and weekends
    const holidayInfo = getHolidayInfo(d, monthIndex, year, customHolidays);
    if (isOffDay || holidayInfo.isHoliday) {
      continue;
    }

    const dd = String(d).padStart(2, '0');
    const mm = String(monthIndex + 1).padStart(2, '0');
    const formattedDate = `${dd}/${mm}/${year}`;

    // Generate task description based on day of week and preset
    const taskDesc = buildTaskDescriptionForDay(
      dayOfWeek,
      d,
      daysInMonth,
      preset,
      teacher,
      config.monthName,
      config.year
    );

    const category: ActivityCategory = taskDesc.includes('Panitia')
      ? 'Kepanitiaan'
      : 'Mengajar';

    generatedList.push({
      id: `act-auto-${Date.now()}-${actCounter}`,
      day: dayName,
      date: formattedDate,
      category,
      taskDescription: taskDesc,
      documentProof: 'Dokumen',
    });

    actCounter++;
  }

  return generatedList;
}

/**
 * Builds realistic Indonesian school task description for a specific day
 */
function buildTaskDescriptionForDay(
  dayOfWeek: number,
  dayDate: number,
  totalDays: number,
  preset: SchedulePreset,
  teacher: TeacherProfile,
  monthName: string,
  year: number
): string {
  // Last 2 days of month: usually includes monthly report preparation
  const isEndOfMonth = dayDate >= totalDays - 2;

  if (isEndOfMonth && dayOfWeek === 5) {
    return `Proses Belajar Mengajar\nMembuat laporan Bulanan ${monthName} ${year}`;
  }

  switch (preset) {
    case 'pjok': {
      if (dayOfWeek === 1) {
        // Senin
        return 'Upacara Bendera\nProses Belajar Mengajar PJOK kelas IVR2 & IVR1';
      } else if (dayOfWeek === 2) {
        // Selasa
        return 'Proses Belajar Mengajar PJOK kelas VIR2 & VIR1\nBertugas sebagai guru piket';
      } else if (dayOfWeek === 3) {
        // Rabu
        return 'Proses Belajar Mengajar PJOK kelas VR2 & VIR3\nMendampingi Sholat Dzuhur Berjamaah';
      } else if (dayOfWeek === 4) {
        // Kamis
        return 'Proses Belajar Mengajar PJOK kelas IVR1 & VR1\nEvaluasi & Penilaian Praktik PJOK';
      } else if (dayOfWeek === 5) {
        // Jumat
        return 'Senam Pagi & Pembiasaan Rohani\nProses Belajar Mengajar PJOK kelas VR2';
      } else if (dayOfWeek === 6) {
        // Sabtu
        return 'Ekstrakurikuler Olahraga & Kepramukaan\nMengikuti Rapat Dinas Dewan Guru';
      }
      return 'Proses Belajar Mengajar';
    }

    case 'guru_kelas': {
      if (dayOfWeek === 1) {
        // Senin
        return 'Upacara Bendera\nProses Belajar Mengajar Tematik\nPembinaan Karakter Siswa';
      } else if (dayOfWeek === 2) {
        return 'Proses Belajar Mengajar Tematik\nBertugas sebagai guru piket';
      } else if (dayOfWeek === 3) {
        return 'Proses Belajar Mengajar Tematik\nMendampingi Sholat Dzuhur Berjamaah';
      } else if (dayOfWeek === 4) {
        return 'Proses Belajar Mengajar Tematik\nPenilaian Harian Siswa & Remedial';
      } else if (dayOfWeek === 5) {
        return 'Senam Kesegaran Jasmani & Pembiasaan Rohani\nProses Belajar Mengajar Tematik';
      } else if (dayOfWeek === 6) {
        return 'Kegiatan Ekstrakurikuler Kepramukaan\nEvaluasi Pembelajaran Mingguan';
      }
      return 'Proses Belajar Mengajar';
    }

    case 'guru_mapel': {
      const subject = teacher.subject || 'Mata Pelajaran';
      if (dayOfWeek === 1) {
        return `Upacara Bendera\nProses Belajar Mengajar ${subject}`;
      } else if (dayOfWeek === 2) {
        return `Proses Belajar Mengajar ${subject}\nBertugas sebagai guru piket`;
      } else if (dayOfWeek === 3) {
        return `Proses Belajar Mengajar ${subject}\nMendampingi Sholat Dzuhur Berjamaah`;
      } else if (dayOfWeek === 4) {
        return `Proses Belajar Mengajar ${subject}\nPelaksanaan Asesmen Formatif`;
      } else if (dayOfWeek === 5) {
        return `Senam Pagi / Pembiasaan Diri Rohani\nProses Belajar Mengajar ${subject}`;
      } else if (dayOfWeek === 6) {
        return `Kegiatan Kepramukaan\nMengikuti Rapat Dinas Dewan Guru`;
      }
      return `Proses Belajar Mengajar ${subject}`;
    }

    case 'pembelajaran_umum':
    default: {
      if (dayOfWeek === 1) {
        return 'Upacara Bendera\nProses Belajar Mengajar';
      } else if (dayOfWeek === 2) {
        return 'Proses Belajar Mengajar\nBertugas sebagai guru piket';
      } else if (dayOfWeek === 3) {
        return 'Proses Belajar Mengajar\nMendampingi Sholat Dzuhur Berjamaah';
      } else if (dayOfWeek === 4) {
        return 'Proses Belajar Mengajar\nPenilaian Harian & Asesmen Siswa';
      } else if (dayOfWeek === 5) {
        return 'Senam Pagi & Pembiasaan Rohani\nProses Belajar Mengajar';
      } else if (dayOfWeek === 6) {
        return 'Kegiatan Kepramukaan & Ekstrakurikuler\nEvaluasi Hasil Belajar Siswa';
      }
      return 'Proses Belajar Mengajar';
    }
  }
}
