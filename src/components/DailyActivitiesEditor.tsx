import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Filter,
  Calendar,
  Check,
  AlertTriangle,
  CheckSquare,
  Square,
  RefreshCw,
  LayoutList,
  Table as TableIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';
import { ACTIVITY_CATEGORIES, ActivityCategory, DailyActivityItem, ReportConfig } from '../types';
import {
  getMonthIndexFromName,
  DAY_NAMES_ID,
  MONTH_NAMES_ID,
  getHolidayInfo,
} from '../utils/calendarHelper';
import { ConfirmModal } from './ConfirmModal';

export const getCategoryBadgeClass = (category: string) => {
  switch (category) {
    case 'Pembelajaran':
    case 'Mengajar':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'Asesmen':
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    case 'Kegiatan Keagamaan':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'Kegiatan Kesiswaan':
      return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
    case 'Pembiasaan dan Penguatan Karakter':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'Kebersihan dan Lingkungan Madrasah':
      return 'bg-teal-50 text-teal-700 border border-teal-200';
    case 'Pengembangan Kompetensi Guru':
      return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'Hubungan dengan Orang Tua dan Komite':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'Peringatan Hari Besar dan Perayaan Madrasah':
    case 'Kepanitiaan':
      return 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200';
    case 'Kompetisi dan Pengembangan Prestasi':
      return 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'Administrasi dan Manajemen Madrasah':
    case 'Kegiatan Lainnya':
      return 'bg-slate-100 text-slate-700 border border-slate-300';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

// --- Date & Day Parsing & Automatic Stepping Helpers ---
export function parseDateParts(dateStr: string): { day: number; monthIndex: number; year: number } | null {
  if (!dateStr) return null;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return { day: d, monthIndex: m, year: y };
      }
    }
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return { day: d, monthIndex: m, year: y };
      }
    }
  }
  return null;
}

export function toIsoDate(ddmmyyyy: string): string {
  const p = parseDateParts(ddmmyyyy);
  if (!p) return '';
  const mm = String(p.monthIndex + 1).padStart(2, '0');
  const dd = String(p.day).padStart(2, '0');
  return `${p.year}-${mm}-${dd}`;
}

export function fromIsoDate(isoStr: string): string {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
  }
  return '';
}

export function getDayNameFromDateStr(dateStr: string): string {
  const p = parseDateParts(dateStr);
  if (!p) return 'Senin';
  const dt = new Date(p.year, p.monthIndex, p.day);
  const dayIndex = dt.getDay();
  return DAY_NAMES_ID[dayIndex] || 'Senin';
}

export function getAutoNextDate(
  activities: DailyActivityItem[],
  monthName: string,
  year: number
): { date: string; day: string } {
  const monthIdx = getMonthIndexFromName(monthName);
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  // Find all activity dates in this month & year
  const recordedDays: number[] = [];
  activities.forEach((act) => {
    const p = parseDateParts(act.date);
    if (p && p.monthIndex === monthIdx && p.year === year) {
      recordedDays.push(p.day);
    }
  });

  if (recordedDays.length > 0) {
    const maxDay = Math.max(...recordedDays);
    // Find next working day after maxDay
    let candidate = maxDay + 1;
    while (candidate <= daysInMonth) {
      const dt = new Date(year, monthIdx, candidate);
      if (dt.getDay() !== 0) { // Skip Sunday
        const dd = String(candidate).padStart(2, '0');
        const mm = String(monthIdx + 1).padStart(2, '0');
        const formatted = `${dd}/${mm}/${year}`;
        return {
          date: formatted,
          day: DAY_NAMES_ID[dt.getDay()],
        };
      }
      candidate++;
    }

    // If month ended, stay on the last recorded day so user can add additional tasks
    const lastDt = new Date(year, monthIdx, maxDay);
    const dd = String(maxDay).padStart(2, '0');
    const mm = String(monthIdx + 1).padStart(2, '0');
    return {
      date: `${dd}/${mm}/${year}`,
      day: DAY_NAMES_ID[lastDt.getDay()],
    };
  }

  // If no activities recorded yet, start from day 1 or first working day
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, monthIdx, d);
    if (dt.getDay() !== 0) {
      const dd = String(d).padStart(2, '0');
      const mm = String(monthIdx + 1).padStart(2, '0');
      return {
        date: `${dd}/${mm}/${year}`,
        day: DAY_NAMES_ID[dt.getDay()],
      };
    }
  }

  return {
    date: `01/${String(monthIdx + 1).padStart(2, '0')}/${year}`,
    day: 'Senin',
  };
}

export function stepWorkingDay(
  currentDateStr: string,
  direction: 'next' | 'prev',
  monthName: string,
  year: number
): { date: string; day: string } {
  const p = parseDateParts(currentDateStr);
  const monthIdx = getMonthIndexFromName(monthName);
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  let curDay = p ? p.day : 1;
  let nextDay = direction === 'next' ? curDay + 1 : curDay - 1;

  while (nextDay >= 1 && nextDay <= daysInMonth) {
    const dt = new Date(year, monthIdx, nextDay);
    if (dt.getDay() !== 0) { // Skip Sunday
      const dd = String(nextDay).padStart(2, '0');
      const mm = String(monthIdx + 1).padStart(2, '0');
      return {
        date: `${dd}/${mm}/${year}`,
        day: DAY_NAMES_ID[dt.getDay()],
      };
    }
    nextDay = direction === 'next' ? nextDay + 1 : nextDay - 1;
  }

  // If boundary reached, clamp
  const clampedDay = direction === 'next' ? daysInMonth : 1;
  const dt = new Date(year, monthIdx, clampedDay);
  const dd = String(clampedDay).padStart(2, '0');
  const mm = String(monthIdx + 1).padStart(2, '0');
  return {
    date: `${dd}/${mm}/${year}`,
    day: DAY_NAMES_ID[dt.getDay()],
  };
}

interface DailyActivitiesEditorProps {
  config: ReportConfig;
  activities: DailyActivityItem[];
  onUpdateActivities: (activities: DailyActivityItem[]) => void;
  onAutoSyncLampiran2: () => void;
  onOpenCalendar?: () => void;
}

export const DailyActivitiesEditor: React.FC<DailyActivitiesEditorProps> = ({
  config,
  activities,
  onUpdateActivities,
  onAutoSyncLampiran2,
  onOpenCalendar,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileView, setMobileView] = useState<'cards' | 'table'>('cards');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formDay, setFormDay] = useState<string>('Senin');
  const [formDate, setFormDate] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ActivityCategory>('Pembelajaran');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formProof, setFormProof] = useState<string>('Dokumen');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [quickNotice, setQuickNotice] = useState<string | null>(null);

  // Deletion modal state (replaces blocked window.confirm)
  const [itemToDelete, setItemToDelete] = useState<DailyActivityItem | null>(null);
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);
  const [isConfirmGenerateOpen, setIsConfirmGenerateOpen] = useState(false);

  // Selection state for batch actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu', 'Minggu'];

  // Calculate full month options for 1-tap select dropdown
  const monthIndex = getMonthIndexFromName(config.monthName);
  const daysInMonth = new Date(config.year, monthIndex + 1, 0).getDate();

  const daysOptions = useMemo(() => {
    const options = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(config.year, monthIndex, d);
      const dayOfWeek = dt.getDay();
      const dayName = DAY_NAMES_ID[dayOfWeek];
      const dd = String(d).padStart(2, '0');
      const mm = String(monthIndex + 1).padStart(2, '0');
      const fullDateStr = `${dd}/${mm}/${config.year}`;
      const isSun = dayOfWeek === 0;
      const hol = getHolidayInfo(d, monthIndex, config.year);
      
      const actCount = activities.filter((a) => a.date === fullDateStr).length;

      let tag = '';
      if (hol.isHoliday) {
        tag = ` 🎉 Libur: ${hol.holidayName}`;
      } else if (isSun) {
        tag = ' ⚠️ Minggu (Libur)';
      } else if (actCount > 0) {
        tag = ` (${actCount} kegiatan)`;
      }

      options.push({
        dateStr: fullDateStr,
        isoStr: `${config.year}-${mm}-${dd}`,
        dayNum: d,
        dayName,
        label: `${dayName}, ${fullDateStr}${tag}`,
        isWorkingDay: !isSun && !hol.isHoliday,
        isSun,
        isHoliday: hol.isHoliday,
        holidayName: hol.holidayName,
        actCount,
      });
    }
    return options;
  }, [config.monthName, config.year, activities, daysInMonth, monthIndex]);

  // Check holiday/weekend status of currently selected formDate
  const currentDateInfo = useMemo(() => {
    const p = parseDateParts(formDate);
    if (!p) return null;
    const isSun = new Date(p.year, p.monthIndex, p.day).getDay() === 0;
    const hol = getHolidayInfo(p.day, p.monthIndex, p.year);
    return {
      isSun,
      isHoliday: hol.isHoliday,
      holidayName: hol.holidayName,
    };
  }, [formDate]);

  // Check if today matches the report month/year
  const now = new Date();
  const isCurrentMonthMatch =
    now.getMonth() === monthIndex && now.getFullYear() === config.year;

  // Handle automatic date change with auto-sync to day of week
  const handleDateChange = (newDateStr: string) => {
    setFormDate(newDateStr);
    const calculatedDay = getDayNameFromDateStr(newDateStr);
    setFormDay(calculatedDay);
  };

  // Step forward/backward to next working day
  const handleStepNext = () => {
    const next = stepWorkingDay(formDate || '01/09/2026', 'next', config.monthName, config.year);
    setFormDate(next.date);
    setFormDay(next.day);
  };

  const handleStepPrev = () => {
    const prev = stepWorkingDay(formDate || '01/09/2026', 'prev', config.monthName, config.year);
    setFormDate(prev.date);
    setFormDay(prev.day);
  };

  // Quick jump to today
  const handleSetToday = () => {
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dateStr = `${dd}/${mm}/${now.getFullYear()}`;
    handleDateChange(dateStr);
  };

  // Quick jump to first working day
  const handleSetFirstDay = () => {
    const first = getAutoNextDate([], config.monthName, config.year);
    setFormDate(first.date);
    setFormDay(first.day);
  };

  const filteredActivities = activities.filter((act) => {
    if (filterCategory !== 'all' && act.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        act.taskDescription.toLowerCase().includes(q) ||
        act.day.toLowerCase().includes(q) ||
        act.date.toLowerCase().includes(q) ||
        (act.category && act.category.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Open Add Modal with AUTOMATICALLY calculated next date and day
  const handleOpenAdd = () => {
    setEditingId(null);
    const auto = getAutoNextDate(activities, config.monthName, config.year);
    setFormDate(auto.date);
    setFormDay(auto.day);
    setFormCategory('Pembelajaran');
    setFormDesc('');
    setFormProof('Dokumen');
    setQuickNotice(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (act: DailyActivityItem) => {
    setEditingId(act.id);
    setFormDay(act.day);
    setFormDate(act.date);
    setFormCategory(act.category);
    setFormDesc(act.taskDescription);
    setFormProof(act.documentProof || 'Dokumen');
    setQuickNotice(null);
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDesc.trim()) return;

    if (editingId) {
      const updated = activities.map((item) =>
        item.id === editingId
          ? {
              ...item,
              day: formDay,
              date: formDate,
              category: formCategory,
              taskDescription: formDesc,
              documentProof: formProof,
            }
          : item
      );
      onUpdateActivities(updated);
    } else {
      const newAct: DailyActivityItem = {
        id: `act-${Date.now()}`,
        day: formDay,
        date: formDate || '01/09/2026',
        category: formCategory,
        taskDescription: formDesc,
        documentProof: formProof,
      };
      onUpdateActivities([...activities, newAct]);
    }

    setIsModalOpen(false);
  };

  // Save current item and automatically advance to next working day
  const handleSaveAndNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formDesc.trim()) return;

    const newAct: DailyActivityItem = {
      id: `act-${Date.now()}`,
      day: formDay,
      date: formDate || '01/09/2026',
      category: formCategory,
      taskDescription: formDesc,
      documentProof: formProof,
    };
    const nextActivities = [...activities, newAct];
    onUpdateActivities(nextActivities);

    // Advance to next working day automatically
    const next = stepWorkingDay(formDate, 'next', config.monthName, config.year);
    setFormDate(next.date);
    setFormDay(next.day);
    setFormDesc('');
    setQuickNotice(`✓ Tersimpan! Otomatis lanjut ke ${next.day}, ${next.date}`);
    setTimeout(() => {
      setQuickNotice(null);
    }, 3000);
  };

  // Perform single item deletion
  const confirmDeleteItem = () => {
    if (!itemToDelete) return;
    const updated = activities.filter((act) => act.id !== itemToDelete.id);
    onUpdateActivities(updated);
    setSelectedIds((prev) => prev.filter((id) => id !== itemToDelete.id));
    setItemToDelete(null);
  };

  // Perform clear all activities
  const confirmClearAll = () => {
    onUpdateActivities([]);
    setSelectedIds([]);
    setIsConfirmClearAllOpen(false);
  };

  // Delete selected items
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const updated = activities.filter((act) => !selectedIds.includes(act.id));
    onUpdateActivities(updated);
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredActivities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredActivities.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Quick auto-populate month days (Senin - Jum'at or Sabtu)
  const confirmGenerateMonthDays = () => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    let monthIndex = monthNames.findIndex(
      (m) => m.toLowerCase() === config.monthName.toLowerCase()
    );
    if (monthIndex === -1) monthIndex = 8; // default September

    const year = config.year || 2026;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const dayNameMap: Record<number, string> = {
      0: 'Minggu',
      1: 'Senin',
      2: 'Selasa',
      3: 'Rabu',
      4: 'Kamis',
      5: "Jum'at",
      6: 'Sabtu',
    };

    const newActivities: DailyActivityItem[] = [];
    let actIndex = 1;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, monthIndex, d);
      const dayNum = dateObj.getDay();
      if (dayNum === 0) continue; // Skip Sundays

      const dayStr = dayNameMap[dayNum];
      const dd = String(d).padStart(2, '0');
      const mm = String(monthIndex + 1).padStart(2, '0');
      const formattedDate = `${dd}/${mm}/${year}`;

      newActivities.push({
        id: `act-gen-${actIndex}`,
        day: dayStr,
        date: formattedDate,
        category: 'Mengajar',
        taskDescription: 'Proses Belajar Mengajar',
        documentProof: 'Dokumen',
      });
      actIndex++;
    }

    onUpdateActivities(newActivities);
    setIsConfirmGenerateOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-lg font-bold text-slate-900">
              Input &amp; Kelola Kegiatan Harian (Lampiran 1)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Total tercatat: <strong className="text-slate-800">{activities.length} kegiatan</strong>. Setiap perubahan langsung sinkron ke Lampiran 2.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenCalendar && (
            <button
              onClick={onOpenCalendar}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition shadow-xs"
              title="Buka tampilan Kalender Interaktif untuk generate sebulan penuh"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Buka Kalender Otomatis</span>
            </button>
          )}

          {/* Explicit Sync to Lampiran 2 Button */}
          <button
            onClick={onAutoSyncLampiran2}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition shadow-xs"
            title="Sinkronkan seluruh data kegiatan ke Lampiran 2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sinkronkan Lampiran 2</span>
          </button>

          {/* Clear Table Button */}
          {activities.length > 0 && (
            <button
              onClick={() => setIsConfirmClearAllOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
              title="Kosongkan seluruh kegiatan tabel"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Kosongkan Tabel</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Kegiatan
          </button>
        </div>
      </div>

      {/* Filter, Search, and View Mode actions */}
      <div className="space-y-2.5 py-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Category Filter & Search Bar */}
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-lg transition text-xs font-semibold ${
                filterCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({activities.length})
            </button>

            <div className="flex-1 min-w-[200px] flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full text-xs bg-transparent border-none text-slate-700 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Jenis Kegiatan (11 Kategori)</option>
                {ACTIVITY_CATEGORIES.map((cat, idx) => {
                  const count = activities.filter((a) => a.category === cat).length;
                  return (
                    <option key={cat} value={cat}>
                      {idx + 1}. {cat} {count > 0 ? `(${count})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Search Box & Mobile View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari uraian/hari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mobile View Switcher (Cards vs Table) */}
            <div className="flex md:hidden items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setMobileView('cards')}
                className={`p-1.5 rounded-md text-xs font-medium transition flex items-center gap-1 ${
                  mobileView === 'cards'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Kartu HP"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="text-[10px]">Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileView('table')}
                className={`p-1.5 rounded-md text-xs font-medium transition flex items-center gap-1 ${
                  mobileView === 'table'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Tabel"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="text-[10px]">Tabel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Batch selection bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-xs animate-in fade-in">
            <span className="text-rose-800 font-semibold">
              {selectedIds.length} item dipilih
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="text-xs text-rose-700 hover:text-rose-900 font-medium underline"
              >
                {selectedIds.length === filteredActivities.length ? 'Batal Semua' : 'Pilih Semua'}
              </button>
              <button
                onClick={handleDeleteSelected}
                className="text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 px-2.5 py-1 rounded-md flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Terpilih
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Mobile Cards View (Visible on small screens when mobileView === 'cards') */}
      {mobileView === 'cards' && (
        <div className="md:hidden space-y-3">
          {filteredActivities.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-400">
              <p className="text-xs text-slate-600 font-medium mb-3">
                {searchQuery || filterCategory !== 'all'
                  ? 'Tidak ada kegiatan yang sesuai pencarian/filter.'
                  : 'Belum ada kegiatan harian yang tercatat.'}
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="w-full py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-xs"
              >
                + Tambah Kegiatan Baru
              </button>
            </div>
          ) : (
            filteredActivities.map((act, index) => {
              const isSelected = selectedIds.includes(act.id);
              return (
                <div
                  key={act.id}
                  className={`bg-white rounded-xl border p-3.5 shadow-xs transition ${
                    isSelected ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSelectOne(act.id)}
                        className="p-1 -ml-1 text-slate-400 hover:text-slate-700"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-400">#{index + 1}</span>
                          <span className="font-bold text-sm text-slate-900">{act.day}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-500">{act.date}</span>
                      </div>
                    </div>

                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold text-right max-w-[170px] truncate ${getCategoryBadgeClass(
                        act.category
                      )}`}
                    >
                      {act.category}
                    </span>
                  </div>

                  <div className="text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-line py-2.5">
                    {act.taskDescription}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-mono">
                      Bukti: {act.documentProof || 'Dokumen'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(act)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(act)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. Desktop & Tablet Table View (Always on desktop, or toggled on mobile) */}
      <div className={`overflow-x-auto border border-slate-200 rounded-lg ${mobileView === 'cards' ? 'hidden md:block' : 'block'}`}>
        <table className="w-full text-xs text-left border-collapse min-w-[620px]">
          <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-slate-500 hover:text-slate-800"
                  title="Pilih semua"
                >
                  {selectedIds.length > 0 && selectedIds.length === filteredActivities.length ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-2 w-10 text-center">No</th>
              <th className="py-2.5 px-3 w-24">Hari</th>
              <th className="py-2.5 px-3 w-28">Tanggal</th>
              <th className="py-2.5 px-3 w-28">Kategori</th>
              <th className="py-2.5 px-4">Uraian Kegiatan</th>
              <th className="py-2.5 px-3 w-24 text-center">Bukti</th>
              <th className="py-2.5 px-3 w-20 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  <div className="max-w-xs mx-auto space-y-3">
                    <p className="text-xs text-slate-500 font-medium">
                      {searchQuery || filterCategory !== 'all'
                        ? 'Tidak ada kegiatan yang sesuai pencarian/filter.'
                        : 'Belum ada kegiatan harian yang tercatat.'}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      {onOpenCalendar && (
                        <button
                          type="button"
                          onClick={onOpenCalendar}
                          className="px-3.5 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold shadow-xs transition flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Buat Kalender Otomatis</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="px-3.5 py-1.5 text-xs bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 font-semibold shadow-xs transition"
                      >
                        + Tambah Manual
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredActivities.map((act, index) => {
                const isSelected = selectedIds.includes(act.id);
                return (
                  <tr
                    key={act.id}
                    className={`transition group ${
                      isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSelectOne(act.id)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-500 font-mono">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{act.day}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono whitespace-nowrap">
                      {act.date}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${getCategoryBadgeClass(
                          act.category
                        )}`}
                      >
                        {act.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                      {act.taskDescription}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {act.documentProof || 'Dokumen'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(act)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit kegiatan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(act)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Hapus kegiatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editingId ? 'Edit Kegiatan Harian' : 'Tambah Kegiatan Harian (Lampiran 1)'}
            </h3>

            {quickNotice && (
              <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{quickNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Seksi Tanggal & Hari Otomatis */}
              <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Tanggal &amp; Hari (Otomatis)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                    <Check className="w-3 h-3" /> Tanggal &amp; Hari Terisi Otomatis
                  </span>
                </div>

                {/* 1. Dropdown Cepat Kalender Bulan Ini (1-Sentuh di HP) */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Pilih Tanggal Bulan {config.monthName} {config.year}:
                  </label>
                  <select
                    value={formDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium text-slate-800 shadow-2xs"
                  >
                    {daysOptions.map((opt) => (
                      <option key={opt.dateStr} value={opt.dateStr}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Dua kolom: Tanggal (DD/MM/YYYY) + Native Picker & Hari Otomatis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Kolom Tanggal */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Tanggal (DD/MM/YYYY)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="01/09/2026"
                        value={formDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono font-bold text-slate-800"
                        required
                      />
                      {/* Native HTML5 date picker overlay button */}
                      <label
                        className="p-2 bg-white border border-slate-300 hover:border-blue-400 rounded-lg cursor-pointer transition text-slate-600 hover:text-blue-600 relative shrink-0 shadow-2xs"
                        title="Buka Kalender HP"
                      >
                        <Calendar className="w-4 h-4" />
                        <input
                          type="date"
                          value={toIsoDate(formDate)}
                          onChange={(e) => {
                            if (e.target.value) {
                              const ddmmyyyy = fromIsoDate(e.target.value);
                              handleDateChange(ddmmyyyy);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Kolom Hari (Otomatis Dihitung) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium text-slate-700">
                        Hari (Otomatis)
                      </label>
                      <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                        Sesuai Kalender
                      </span>
                    </div>
                    <div className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span className="text-blue-900 font-extrabold">{formDay}</span>
                      <span className="text-[10px] font-normal text-slate-500 truncate max-w-[130px]">
                        {currentDateInfo?.isSun
                          ? '⚠️ Minggu (Libur)'
                          : currentDateInfo?.isHoliday
                          ? `🎉 ${currentDateInfo.holidayName}`
                          : 'Hari Kerja'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Tombol Bantu Otomatis Cepat */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-slate-400 text-[10px] mr-1">Lompat Tanggal:</span>
                  <button
                    type="button"
                    onClick={handleStepNext}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-md text-blue-700 font-semibold transition shadow-2xs"
                    title="Maju ke hari kerja berikutnya"
                  >
                    <span>+1 Hari Kerja</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleStepPrev}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition shadow-2xs"
                    title="Mundur 1 hari kerja"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span>-1 Hari</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSetFirstDay}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition shadow-2xs"
                    title="Pilih awal bulan"
                  >
                    Awal Bulan (01)
                  </button>
                  {isCurrentMonthMatch && (
                    <button
                      type="button"
                      onClick={handleSetToday}
                      className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold border border-blue-300 rounded-md transition shadow-2xs"
                    >
                      📅 Hari Ini
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Jenis Kegiatan (11 Kategori Madrasah)
                  </label>
                  <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    {formCategory}
                  </span>
                </div>

                {/* Dropdown for quick and accessible selection */}
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ActivityCategory)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium bg-white mb-2"
                >
                  {ACTIVITY_CATEGORIES.map((cat, idx) => (
                    <option key={cat} value={cat}>
                      {idx + 1}. {cat}
                    </option>
                  ))}
                  {!ACTIVITY_CATEGORIES.includes(formCategory) && (
                    <option value={formCategory}>{formCategory}</option>
                  )}
                </select>

                {/* Numbered 1-11 category buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                  {ACTIVITY_CATEGORIES.map((cat, idx) => {
                    const isSelected = formCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategory(cat)}
                        className={`text-left text-xs px-2.5 py-1.5 rounded-md border transition flex items-center gap-2 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white font-semibold shadow-xs'
                            : 'bg-white border-slate-200 hover:border-blue-400 text-slate-700 hover:bg-blue-50/50'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isSelected ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Uraian Kegiatan
                  </label>
                  <span className="text-[11px] text-slate-400">
                    (Gunakan baris baru untuk kegiatan tambahan di hari yang sama)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Contoh: Mengajar PJOK kelas VIR2 & VIR1&#10;Bertugas sebagai guru piket"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-sans"
                  required
                />
              </div>

              {/* Template shortcuts */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                  Template Cepat Sesuai Kategori:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Pembelajaran');
                      setFormDesc('Proses Belajar Mengajar PJOK kelas IVR2 & IVR1');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + 1. Pembelajaran (KBM)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Asesmen');
                      setFormDesc('Evaluasi & Penilaian Pembelajaran Harian Siswa');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + 2. Asesmen / Penilaian
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Kegiatan Keagamaan');
                      setFormDesc('Mendampingi Sholat Dzuhur Berjamaah Siswa');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + 3. Sholat Berjamaah
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Kegiatan Kesiswaan');
                      setFormDesc('Pembinaan Ekstrakurikuler Olahraga dan Pramuka');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + 4. Kesiswaan / Ekskul
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Pembiasaan dan Penguatan Karakter');
                      setFormDesc('Mengikuti Upacara Bendera & Apel Karakter Siswa');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + 5. Upacara & Karakter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Kebersihan dan Lingkungan Madrasah');
                      setFormDesc('Gerakan Jumat Bersih & Perawatan Lingkungan Madrasah');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + 6. Kebersihan Lingkungan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Pengembangan Kompetensi Guru');
                      setFormDesc('Mengikuti Kegiatan KKG / MGMP / Pelatihan Mandiri');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + 7. KKG / Pelatihan Guru
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Hubungan dengan Orang Tua dan Komite');
                      setFormDesc('Pertemuan & Konsultasi Perkembangan Siswa dengan Orang Tua/Wali');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + 8. Komite & Orang Tua
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Peringatan Hari Besar dan Perayaan Madrasah');
                      setFormDesc('Panitia Peringatan Maulid Nabi Muhammad SAW di Madrasah');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + 9. Panitia Hari Besar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Kompetisi dan Pengembangan Prestasi');
                      setFormDesc('Membimbing dan Mendampingi Siswa pada Ajang Kompetisi Olahraga/Seni');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + 10. Bimbingan Kompetisi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Administrasi dan Manajemen Madrasah');
                      setFormDesc('Bertugas sebagai Guru Piket Madrasah');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + 11. Guru Piket
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Administrasi dan Manajemen Madrasah');
                      setFormDesc(`Membuat laporan Bulanan ${config.monthName} ${config.year}`);
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + 11. Laporan Bulanan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Bukti Dokumen / Output
                </label>
                <input
                  type="text"
                  value={formProof}
                  onChange={(e) => setFormProof(e.target.value)}
                  placeholder="Dokumen"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition order-3 sm:order-1"
                >
                  Batal
                </button>
                <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
                  {!editingId && (
                    <button
                      type="button"
                      onClick={handleSaveAndNext}
                      className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition flex items-center justify-center gap-1.5 shadow-2xs"
                      title="Simpan kegiatan hari ini dan langsung otomatis lanjut isi hari berikutnya"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Simpan &amp; Lanjut +1 Hari</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                  >
                    {editingId ? 'Simpan Perubahan' : 'Simpan Kegiatan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal for Single Item Deletion */}
      <ConfirmModal
        isOpen={itemToDelete !== null}
        title="Hapus Kegiatan Harian?"
        message={`Apakah Anda yakin ingin menghapus kegiatan tanggal ${itemToDelete?.date} (${itemToDelete?.taskDescription.slice(0, 50)}...)? Volume di Lampiran 2 akan diperbarui otomatis.`}
        confirmText="Hapus Kegiatan"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={confirmDeleteItem}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Confirm Modal for Clearing All */}
      <ConfirmModal
        isOpen={isConfirmClearAllOpen}
        title="Kosongkan Semua Kegiatan Harian?"
        message="Semua baris kegiatan di Lampiran 1 akan dihapus sehingga Anda dapat mengisi data kegiatan sekolah Anda dari awal."
        confirmText="Kosongkan Tabel"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={confirmClearAll}
        onCancel={() => setIsConfirmClearAllOpen(false)}
      />

      {/* Confirm Modal for Generating Month */}
      <ConfirmModal
        isOpen={isConfirmGenerateOpen}
        title="Isi Otomatis Jadwal Sebulan?"
        message={`Sistem akan membuat baris kegiatan hari kerja (Senin - Sabtu) untuk bulan ${config.monthName} ${config.year}. Data kegiatan saat ini akan digantikan.`}
        confirmText="Buat Kalender Sebulan"
        cancelText="Batal"
        isDestructive={false}
        onConfirm={confirmGenerateMonthDays}
        onCancel={() => setIsConfirmGenerateOpen(false)}
      />
    </div>
  );
};
