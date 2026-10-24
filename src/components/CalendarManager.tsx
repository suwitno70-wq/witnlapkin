import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info,
} from 'lucide-react';
import { ActivityCategory, DailyActivityItem, ReportConfig, TeacherProfile } from '../types';
import {
  buildMonthCalendar,
  CalendarDayInfo,
  DAY_NAMES_ID,
  generateMonthlyActivitiesSchedule,
  getMonthIndexFromName,
  MONTH_NAMES_ID,
  SchedulePreset,
} from '../utils/calendarHelper';
import { ConfirmModal } from './ConfirmModal';

interface CalendarManagerProps {
  config: ReportConfig;
  teacher: TeacherProfile;
  dailyActivities: DailyActivityItem[];
  onUpdateActivities: (activities: DailyActivityItem[]) => void;
  onUpdateConfig: (config: ReportConfig) => void;
  onAutoSyncLampiran2: () => void;
}

export const CalendarManager: React.FC<CalendarManagerProps> = ({
  config,
  teacher,
  dailyActivities,
  onUpdateActivities,
  onUpdateConfig,
  onAutoSyncLampiran2,
}) => {
  // Settings State
  const [workDaysMode, setWorkDaysMode] = useState<'5_days' | '6_days'>('6_days');
  const [selectedPreset, setSelectedPreset] = useState<SchedulePreset>(
    teacher.subject?.toLowerCase().includes('pjok') ||
      teacher.position?.toLowerCase().includes('penjaskes')
      ? 'pjok'
      : 'pembelajaran_umum'
  );
  const [customHolidays, setCustomHolidays] = useState<string[]>([]);

  // Month & Year state
  const currentMonthName = config.monthName || 'September';
  const currentYear = config.year || 2026;

  // Selected Day & Modal State
  const [activeDayCell, setActiveDayCell] = useState<CalendarDayInfo | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isConfirmGenerateOpen, setIsConfirmGenerateOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [generateActionType, setGenerateActionType] = useState<'replace' | 'append'>('replace');

  // Single Activity Form inside modal
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<ActivityCategory>('Mengajar');
  const [formDesc, setFormDesc] = useState<string>('Proses Belajar Mengajar');
  const [formProof, setFormProof] = useState<string>('Dokumen');

  // Build calendar matrix
  const calendarData = useMemo(() => {
    return buildMonthCalendar(
      currentMonthName,
      currentYear,
      dailyActivities,
      workDaysMode,
      customHolidays
    );
  }, [currentMonthName, currentYear, dailyActivities, workDaysMode, customHolidays]);

  // Handle Month Navigation
  const handlePrevMonth = () => {
    const idx = getMonthIndexFromName(currentMonthName);
    if (idx === 0) {
      onUpdateConfig({ ...config, monthName: MONTH_NAMES_ID[11], year: currentYear - 1 });
    } else {
      onUpdateConfig({ ...config, monthName: MONTH_NAMES_ID[idx - 1] });
    }
  };

  const handleNextMonth = () => {
    const idx = getMonthIndexFromName(currentMonthName);
    if (idx === 11) {
      onUpdateConfig({ ...config, monthName: MONTH_NAMES_ID[0], year: currentYear + 1 });
    } else {
      onUpdateConfig({ ...config, monthName: MONTH_NAMES_ID[idx + 1] });
    }
  };

  // Run Bulk Auto-generator
  const handleExecuteGenerate = () => {
    const generated = generateMonthlyActivitiesSchedule(
      config,
      teacher,
      workDaysMode,
      selectedPreset,
      customHolidays
    );

    if (generateActionType === 'replace') {
      onUpdateActivities(generated);
    } else {
      // Append only dates that are not yet recorded
      const existingDates = new Set(dailyActivities.map((a) => a.date));
      const filteredNew = generated.filter((g) => !existingDates.has(g.date));
      onUpdateActivities([...dailyActivities, ...filteredNew]);
    }

    setIsConfirmGenerateOpen(false);
    // Trigger sync to Lampiran 2 immediately
    setTimeout(() => {
      onAutoSyncLampiran2();
    }, 100);
  };

  // Open modal for day cell
  const handleOpenDayModal = (day: CalendarDayInfo) => {
    setActiveDayCell(day);
    setEditingActivityId(null);
    setFormCategory('Mengajar');
    setFormDesc(
      day.dayOfWeek === 1
        ? 'Upacara Bendera\nProses Belajar Mengajar'
        : 'Proses Belajar Mengajar'
    );
    setFormProof('Dokumen');
    setIsDayModalOpen(true);
  };

  const handleEditActivityFromCell = (day: CalendarDayInfo, act: DailyActivityItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDayCell(day);
    setEditingActivityId(act.id);
    setFormCategory(act.category);
    setFormDesc(act.taskDescription);
    setFormProof(act.documentProof || 'Dokumen');
    setIsDayModalOpen(true);
  };

  const handleDeleteActivityFromCell = (actId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = dailyActivities.filter((a) => a.id !== actId);
    onUpdateActivities(updated);
  };

  const handleSaveDayActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDayCell || !formDesc.trim()) return;

    if (editingActivityId) {
      const updated = dailyActivities.map((a) =>
        a.id === editingActivityId
          ? {
              ...a,
              category: formCategory,
              taskDescription: formDesc,
              documentProof: formProof,
            }
          : a
      );
      onUpdateActivities(updated);
    } else {
      const newAct: DailyActivityItem = {
        id: `act-cal-${Date.now()}`,
        day: activeDayCell.dayName,
        date: activeDayCell.fullDateStr,
        category: formCategory,
        taskDescription: formDesc,
        documentProof: formProof,
      };
      onUpdateActivities([...dailyActivities, newAct]);
    }

    setIsDayModalOpen(false);
  };

  // Quick toggle holiday for a date
  const handleToggleCustomHoliday = (fullDate: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomHolidays((prev) =>
      prev.includes(fullDate) ? prev.filter((d) => d !== fullDate) : [...prev, fullDate]
    );
  };

  // Render weekday header (Senin to Minggu)
  // Calendar standard starting on Monday
  const weekdayCols = ['Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu', 'Minggu'];

  // Offset calculation: dayOfWeek 0 is Sunday, 1 is Monday
  // In Monday-first view: Monday=0, Tuesday=1, ..., Sunday=6
  const getColIndex = (dayOfWeek: number) => (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  const firstDayCol = getColIndex(calendarData.firstDayOfWeek);

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Controls Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shadow-xs">
                <CalendarDays className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Kalender Kerja Otomatis Guru
                  <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    1-Klik Terisi Sebulan
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Hitung otomatis hari kerja, lewati hari libur nasional &amp; Minggu, dan sinkronkan langsung ke Lampiran 2.
                </p>
              </div>
            </div>
          </div>

          {/* Month & Year Navigator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 font-bold text-sm text-slate-800 min-w-[140px] text-center">
                {currentMonthName} {currentYear}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Sync Button */}
            <button
              type="button"
              onClick={onAutoSyncLampiran2}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition shadow-xs"
              title="Sinkronkan data kalender ke Lampiran 2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sinkronkan L2</span>
            </button>
          </div>
        </div>

        {/* 2. Statistical KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 block">Total Hari Bulan Ini</span>
            <div className="text-xl font-extrabold text-slate-800 mt-0.5">
              {calendarData.daysInMonth} <span className="text-xs font-normal text-slate-500">hari</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
            <span className="text-[11px] font-medium text-blue-700 block">Hari Kerja Efektif</span>
            <div className="text-xl font-extrabold text-blue-900 mt-0.5">
              {calendarData.totalWorkingDays}{' '}
              <span className="text-xs font-normal text-blue-600">hari aktif</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
            <span className="text-[11px] font-medium text-rose-700 block">Hari Libur / Weekend</span>
            <div className="text-xl font-extrabold text-rose-900 mt-0.5">
              {calendarData.daysInMonth - calendarData.totalWorkingDays}{' '}
              <span className="text-xs font-normal text-rose-600">hari</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[11px] font-medium text-emerald-700 block">Kegiatan Terjadwal</span>
            <div className="text-xl font-extrabold text-emerald-900 mt-0.5">
              {dailyActivities.length}{' '}
              <span className="text-xs font-normal text-emerald-600">entri harian</span>
            </div>
          </div>
        </div>

        {/* 3. Automatic Generator Configuration Toolbar */}
        <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Working days mode toggle */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 px-2">Sistem Sekolah:</span>
                <button
                  type="button"
                  onClick={() => setWorkDaysMode('6_days')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    workDaysMode === '6_days'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  6 Hari (Senin - Sabtu)
                </button>
                <button
                  type="button"
                  onClick={() => setWorkDaysMode('5_days')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    workDaysMode === '5_days'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  5 Hari (Senin - Jumat)
                </button>
              </div>

              {/* Preset routine selector */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 px-2">Pola Jadwal:</span>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value as SchedulePreset)}
                  className="bg-transparent text-xs font-medium text-slate-800 pr-3 py-1 focus:outline-hidden"
                >
                  <option value="pembelajaran_umum">Proses Belajar Mengajar (Umum)</option>
                  <option value="pjok">Guru PJOK (Penjas, Upacara, Senam, Praktik)</option>
                  <option value="guru_kelas">Guru Kelas (Tematik, Pembiasaan, Piket)</option>
                  <option value="guru_mapel">
                    Guru Mapel ({teacher.subject || 'Mata Pelajaran'})
                  </option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {dailyActivities.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsConfirmClearOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100/70 border border-rose-300 rounded-lg transition"
                  title="Kosongkan jadwal kegiatan saat ini"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Reset Jadwal</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setGenerateActionType('replace');
                  setIsConfirmGenerateOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition transform active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Isi Otomatis Sebulan Penuh</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              Generator akan otomatis membuat entri kegiatan harian untuk <strong>{calendarData.totalWorkingDays} hari kerja</strong> di bulan {currentMonthName} {currentYear}, melewati akhir pekan dan hari libur nasional.
            </span>
          </div>
        </div>
      </div>

      {/* 4. Visual Calendar Matrix */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Calendar Day Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100 text-center text-xs font-bold text-slate-700">
          {weekdayCols.map((col, idx) => {
            const isSun = idx === 6;
            const isSat = idx === 5;
            return (
              <div
                key={col}
                className={`py-3 px-2 uppercase tracking-wider text-[11px] ${
                  isSun ? 'text-rose-600 bg-rose-50/50' : isSat ? 'text-blue-700' : 'text-slate-700'
                }`}
              >
                {col}
              </div>
            );
          })}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 text-xs">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayCol }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[110px] bg-slate-50/40 p-2 opacity-30"></div>
          ))}

          {/* Month Days */}
          {calendarData.days.map((day) => {
            const hasActivities = day.activities.length > 0;
            const isToday =
              new Date().getDate() === day.date &&
              new Date().getMonth() === calendarData.monthIndex &&
              new Date().getFullYear() === calendarData.year;

            return (
              <div
                key={day.fullDateStr}
                onClick={() => handleOpenDayModal(day)}
                className={`min-h-[115px] p-2 flex flex-col justify-between transition group cursor-pointer relative ${
                  day.isSunday
                    ? 'bg-rose-50/30 hover:bg-rose-50/60'
                    : day.isHoliday
                    ? 'bg-amber-50/40 hover:bg-amber-50/70'
                    : day.isWeekend
                    ? 'bg-slate-50/80 hover:bg-slate-100/80'
                    : hasActivities
                    ? 'bg-white hover:bg-blue-50/40'
                    : 'bg-white hover:bg-slate-50'
                } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              >
                {/* Cell Header: Day Number & Holiday / Weekend status */}
                <div className="flex items-start justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm font-bold font-mono px-1.5 py-0.5 rounded-md ${
                        day.isSunday || day.isHoliday
                          ? 'bg-rose-100 text-rose-800'
                          : isToday
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-800 group-hover:text-blue-600'
                      }`}
                    >
                      {day.date}
                    </span>

                    {isToday && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-1 rounded">
                        Hari Ini
                      </span>
                    )}
                  </div>

                  {/* Quick Add Button on Hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDayModal(day);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100/80 rounded transition"
                    title={`Tambah kegiatan pada tanggal ${day.fullDateStr}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Holiday Badge if any */}
                {day.holidayName && (
                  <div className="mb-1">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-800 border border-rose-200 line-clamp-2 leading-tight">
                      🎉 {day.holidayName}
                    </span>
                  </div>
                )}

                {/* Weekend Tag */}
                {day.isSunday && !day.holidayName && (
                  <span className="text-[10px] text-rose-600 font-medium">Libur Akhir Pekan</span>
                )}
                {day.isSaturday && workDaysMode === '5_days' && !day.holidayName && (
                  <span className="text-[10px] text-slate-400 font-medium">Libur 5 Hari</span>
                )}

                {/* Day Activity List */}
                <div className="flex-1 space-y-1 my-1 overflow-hidden">
                  {day.activities.map((act) => (
                    <div
                      key={act.id}
                      className="group/act text-[10px] p-1.5 rounded-md bg-blue-50 border border-blue-200/80 text-blue-900 leading-tight hover:border-blue-400 hover:shadow-xs transition flex items-start justify-between gap-1"
                    >
                      <div className="truncate flex-1 font-medium">
                        {act.taskDescription.split('\n')[0]}
                        {act.taskDescription.includes('\n') && (
                          <span className="text-[9px] text-blue-500 ml-1">
                            (+{act.taskDescription.split('\n').length - 1})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/act:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => handleEditActivityFromCell(day, act, e)}
                          className="p-0.5 text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteActivityFromCell(act.id, e)}
                          className="p-0.5 text-rose-500 hover:text-rose-700"
                          title="Hapus"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Empty state prompt for working days without activities */}
                  {day.isWorkingDay && !hasActivities && (
                    <div className="text-[10px] text-slate-300 italic py-1 flex items-center gap-1 group-hover:text-blue-500">
                      <span>+ Tambah kegiatan</span>
                    </div>
                  )}
                </div>

                {/* Footer of cell: status indicator */}
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{day.dayName}</span>
                  {hasActivities && (
                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">
                      {day.activities.length} tugas
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Modal: Add or Edit Activity for Selected Day */}
      {isDayModalOpen && activeDayCell && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingActivityId ? 'Edit Kegiatan' : 'Tambah Kegiatan Harian'}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeDayCell.dayName}, {activeDayCell.fullDateStr}{' '}
                  {activeDayCell.holidayName && (
                    <span className="text-rose-600 font-semibold">({activeDayCell.holidayName})</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDayModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDayActivity} className="space-y-4 mt-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kategori Tugas
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Mengajar', 'Kepanitiaan', 'Kegiatan Lainnya'] as ActivityCategory[]).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategory(cat)}
                        className={`text-xs py-2 px-2 rounded-lg border font-medium transition text-center ${
                          formCategory === cat
                            ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-600'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Task Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Uraian Kegiatan
                  </label>
                  <span className="text-[10px] text-slate-400">
                    (Gunakan baris baru jika ada lebih dari 1 kegiatan)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Contoh: Proses Belajar Mengajar&#10;Bertugas sebagai guru piket"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Quick Template Buttons */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Template Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Mengajar');
                      setFormDesc('Proses Belajar Mengajar');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    Proses Belajar Mengajar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Mengajar');
                      setFormDesc('Upacara Bendera\nProses Belajar Mengajar');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    Upacara + Belajar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Kegiatan Lainnya');
                      setFormDesc('Bertugas sebagai guru piket');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    Guru Piket
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Kegiatan Lainnya');
                      setFormDesc('Mendampingi Sholat Dzuhur Berjamaah');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    Sholat Dzuhur
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Kepanitiaan');
                      setFormDesc('Panitia Acara Maulid Nabi Muhammad SAW');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    Panitia Acara
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Kegiatan Lainnya');
                      setFormDesc(`Membuat laporan Bulanan ${config.monthName} ${config.year}`);
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    Laporan Bulanan
                  </button>
                </div>
              </div>

              {/* Document Proof */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bukti Fisik / Output
                </label>
                <input
                  type="text"
                  value={formProof}
                  onChange={(e) => setFormProof(e.target.value)}
                  placeholder="Dokumen"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => handleToggleCustomHoliday(activeDayCell.fullDateStr, e)}
                  className="text-[11px] text-amber-700 hover:text-amber-900 underline"
                >
                  {customHolidays.includes(activeDayCell.fullDateStr)
                    ? 'Hapus Status Libur'
                    : 'Tandai Sebagai Libur'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDayModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                  >
                    {editingActivityId ? 'Simpan Perubahan' : 'Tambahkan ke Kalender'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Auto-Generate */}
      <ConfirmModal
        isOpen={isConfirmGenerateOpen}
        title="Isi Otomatis Kalender Sebulan Penuh?"
        message={`Sistem akan membuat kegiatan terstruktur untuk ${calendarData.totalWorkingDays} hari kerja di bulan ${currentMonthName} ${currentYear} dengan pola "${
          selectedPreset === 'pjok'
            ? 'Guru PJOK'
            : selectedPreset === 'guru_kelas'
            ? 'Guru Kelas'
            : selectedPreset === 'guru_mapel'
            ? `Guru Mapel (${teacher.subject})`
            : 'Proses Belajar Mengajar (Umum)'
        }". Hari libur nasional dan akhir pekan otomatis dilewati.`}
        confirmText="Buat Kalender Sekarang"
        cancelText="Batal"
        isDestructive={false}
        onConfirm={handleExecuteGenerate}
        onCancel={() => setIsConfirmGenerateOpen(false)}
      />

      {/* Confirmation Modal for Clear */}
      <ConfirmModal
        isOpen={isConfirmClearOpen}
        title="Reset Semua Kegiatan Kalender?"
        message="Semua data kegiatan harian yang tercatat di kalender akan dikosongkan. Anda dapat mengisinya kembali kapan saja."
        confirmText="Kosongkan Sekarang"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={() => {
          onUpdateActivities([]);
          setIsConfirmClearOpen(false);
        }}
        onCancel={() => setIsConfirmClearOpen(false)}
      />
    </div>
  );
};
