import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  FileDown,
  Database,
  Edit,
  PenTool,
  Layers,
  Settings,
  HelpCircle,
  Eye,
  Check,
  ChevronDown,
  Share2,
  Sparkles,
  Link2,
  Trash2,
  User,
  RefreshCw,
  Calendar,
  HardDrive,
  Menu,
  X,
  Smartphone,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import {
  DailyActivityItem,
  MySQLConfig,
  ReportConfig,
  SummaryActivityItem,
  SupervisorProfile,
  TeacherProfile,
} from './types';
import {
  DEFAULT_DAILY_ACTIVITIES,
  DEFAULT_REPORT_CONFIG,
  DEFAULT_SUMMARY_ACTIVITIES,
  DEFAULT_SUPERVISOR,
  DEFAULT_TEACHER,
} from './utils/defaultData';
import { smartSyncLampiran1ToLampiran2, calculateReportStats } from './utils/calculator';
import { exportToDocx } from './utils/docxExport';
import { Lampiran1View } from './components/Lampiran1View';
import { Lampiran2View } from './components/Lampiran2View';
import { DailyActivitiesEditor } from './components/DailyActivitiesEditor';
import { AutoIntegrationManager } from './components/AutoIntegrationManager';
import { SignatureModal } from './components/SignatureModal';
import { ProfileEditorModal } from './components/ProfileEditorModal';
import { DewaHosterMySQLModal } from './components/DewaHosterMySQLModal';
import { ConfirmModal } from './components/ConfirmModal';
import { IdentityManager } from './components/IdentityManager';
import { CalendarManager } from './components/CalendarManager';
import { BackupRestoreModal } from './components/BackupRestoreModal';

const LOCAL_STORAGE_KEY = 'laporan_kinerja_guru_v2';
const PREV_LOCAL_STORAGE_KEY = 'laporan_kinerja_guru_app_data_v1';

export default function App() {
  // Main State
  const [config, setConfig] = useState<ReportConfig>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_config`) || localStorage.getItem(`${PREV_LOCAL_STORAGE_KEY}_config`);
    return saved ? JSON.parse(saved) : DEFAULT_REPORT_CONFIG;
  });

  const [teacher, setTeacher] = useState<TeacherProfile>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_teacher`) || localStorage.getItem(`${PREV_LOCAL_STORAGE_KEY}_teacher`);
    return saved ? JSON.parse(saved) : DEFAULT_TEACHER;
  });

  const [supervisor, setSupervisor] = useState<SupervisorProfile>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_supervisor`) || localStorage.getItem(`${PREV_LOCAL_STORAGE_KEY}_supervisor`);
    return saved ? JSON.parse(saved) : DEFAULT_SUPERVISOR;
  });

  const [dailyActivities, setDailyActivities] = useState<DailyActivityItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_daily`);
    return saved ? JSON.parse(saved) : DEFAULT_DAILY_ACTIVITIES;
  });

  const [summaryActivities, setSummaryActivities] = useState<SummaryActivityItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_summary`);
    const initialList: SummaryActivityItem[] = saved ? JSON.parse(saved) : DEFAULT_SUMMARY_ACTIVITIES;
    return initialList.map((item) => {
      if (
        item.taskName === 'Mengajar Mapel PJOK Kelas IV, V, & VI' ||
        item.taskName.includes('Mengajar Mapel PJOK')
      ) {
        return { ...item, taskName: 'Proses Belajar Mengajar' };
      }
      return item;
    });
  });

  const [mySQLConfig, setMySQLConfig] = useState<MySQLConfig>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_mysql`);
    return saved
      ? JSON.parse(saved)
      : {
          host: 'localhost',
          port: 3306,
          database: 'u12345_laporanguru',
          username: 'u12345_userguru',
          tablePrefix: 'tb_',
          encryptionKey: 'KemenagKotim2026_AESKey!',
          apiEndpoint: '',
        };
  });

  // UI Navigation states
  const [activeTab, setActiveTab] = useState<'preview' | 'identity' | 'calendar' | 'lampiran1_edit' | 'lampiran2_auto'>('calendar');
  const [previewDocument, setPreviewDocument] = useState<'both' | 'lampiran1' | 'lampiran2'>('both');

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDewaHosterModalOpen, setIsDewaHosterModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [signatureModalRole, setSignatureModalRole] = useState<'teacher' | 'supervisor' | null>(null);
  const [isDocxMenuOpen, setIsDocxMenuOpen] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [saveBannerMessage, setSaveBannerMessage] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mobilePreviewScale, setMobilePreviewScale] = useState<'fit' | 'full'>('full');

  // Restore/Import data handler (for multi-device transfer or cloud load)
  const handleRestoreData = (data: {
    config?: ReportConfig;
    teacher?: TeacherProfile;
    supervisor?: SupervisorProfile;
    dailyActivities?: DailyActivityItem[];
    summaryActivities?: SummaryActivityItem[];
    mySQLConfig?: MySQLConfig;
  }) => {
    if (data.config) setConfig(data.config);
    if (data.teacher) setTeacher(data.teacher);
    if (data.supervisor) setSupervisor(data.supervisor);
    if (data.dailyActivities) {
      setDailyActivities(data.dailyActivities);
      if (data.summaryActivities && data.summaryActivities.length > 0) {
        setSummaryActivities(data.summaryActivities);
      } else {
        const synced = smartSyncLampiran1ToLampiran2(
          data.dailyActivities,
          summaryActivities,
          data.config || config,
          data.teacher || teacher
        );
        setSummaryActivities(synced);
      }
    }
    if (data.mySQLConfig) setMySQLConfig(data.mySQLConfig);
    showNotice('Data berhasil dipulihkan! Seluruh laporan siap digunakan.');
  };

  // Auto save to localStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_config`, JSON.stringify(config));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_teacher`, JSON.stringify(teacher));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_supervisor`, JSON.stringify(supervisor));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_daily`, JSON.stringify(dailyActivities));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_summary`, JSON.stringify(summaryActivities));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_mysql`, JSON.stringify(mySQLConfig));
  }, [config, teacher, supervisor, dailyActivities, summaryActivities, mySQLConfig]);

  // Reactive update: Synchronize Lampiran 2 immediately whenever daily activities change
  const handleUpdateDailyActivities = (newDaily: DailyActivityItem[]) => {
    setDailyActivities(newDaily);
    if (newDaily.length === 0) {
      setSummaryActivities([]);
    } else {
      const synced = smartSyncLampiran1ToLampiran2(newDaily, summaryActivities, config, teacher);
      setSummaryActivities(synced);
    }
  };

  // Manual trigger synchronization from anywhere in the app
  const handleAutoSyncLampiran2 = (optionalDaily?: DailyActivityItem[]) => {
    const activitiesToUse = optionalDaily && Array.isArray(optionalDaily) ? optionalDaily : dailyActivities;
    const synced = smartSyncLampiran1ToLampiran2(activitiesToUse, summaryActivities, config, teacher);
    setSummaryActivities(synced);
    showNotice(
      `Sinkronisasi Berhasil! ${synced.length} baris capaian Lampiran 2 telah diperbarui dari ${activitiesToUse.length} kegiatan Lampiran 1.`
    );
  };

  const showNotice = (msg: string) => {
    setSaveBannerMessage(msg);
    setTimeout(() => setSaveBannerMessage(null), 3000);
  };

  // Confirmation Modal State
  const [isConfirmClearDataOpen, setIsConfirmClearDataOpen] = useState(false);

  // Handlers for signatures
  const handleSaveSignature = (role: 'teacher' | 'supervisor', signatureDataUrl: string) => {
    if (role === 'teacher') {
      setTeacher((prev) => ({ ...prev, signatureImage: signatureDataUrl }));
    } else {
      setSupervisor((prev) => ({ ...prev, signatureImage: signatureDataUrl }));
    }
    showNotice(`Tanda tangan ${role === 'teacher' ? 'Guru' : 'Kepala'} berhasil diperbarui!`);
  };

  // Clear all activities data
  const handleConfirmClearData = () => {
    setDailyActivities([]);
    setSummaryActivities([]);
    setIsConfirmClearDataOpen(false);
    showNotice('Semua data kegiatan berhasil dikosongkan!');
  };

  // Export docx
  const handleExportWord = async (mode: 'all' | 'lampiran1' | 'lampiran2') => {
    setIsDocxMenuOpen(false);
    setIsExportingDocx(true);
    try {
      await exportToDocx(
        mode,
        config,
        teacher,
        supervisor,
        dailyActivities,
        summaryActivities
      );
      showNotice('File Word (.docx) berhasil dibuat dan diunduh!');
    } catch (e: any) {
      showNotice(`Gagal mengekspor Word: ${e.message}`);
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Application Bar - Hidden during Print */}
      {/* Top Application Bar - Hidden during Print */}
      <header className="no-print bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-emerald-400/30 shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xs sm:text-base font-bold tracking-tight text-white line-clamp-1">
                    Laporan Kinerja Guru
                  </h1>
                  <span className="text-[9px] sm:text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full font-mono whitespace-nowrap">
                    Lampiran I &amp; II
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  {config.monthName} {config.year} &bull; {teacher.name}
                </p>
              </div>
            </div>

            {/* Desktop Quick Action Buttons (Large Screens >= 1024px) */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Pindah Perangkat / Backup Button */}
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-200 bg-sky-950/70 hover:bg-sky-900/90 border border-sky-600/50 rounded-lg transition"
                title="Cadangkan data dan pulihkan saat berpindah ke laptop atau perangkat lain"
              >
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                <span>Pindah Perangkat / Backup</span>
              </button>

              {/* Dewa Hoster MySQL Button */}
              <button
                type="button"
                onClick={() => setIsDewaHosterModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-600/50 rounded-lg transition"
                title="Integrasi & Panduan Deploy Database MySQL Dewa Hoster"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Deploy Dewa Hoster (MySQL)</span>
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
                title="Cetak langsung ke printer atau simpan PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-300" />
                <span>Cetak</span>
              </button>

              {/* Word (.docx) Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDocxMenuOpen(!isDocxMenuOpen)}
                  disabled={isExportingDocx}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{isExportingDocx ? 'Memproses...' : 'Ekspor Word (.docx)'}</span>
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>

                {isDocxMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 text-slate-800">
                    <button
                      onClick={() => handleExportWord('all')}
                      className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
                    >
                      <span className="font-semibold">Ekspor Lengkap (Lampiran I &amp; II)</span>
                      <span className="text-[10px] text-slate-400">1 Dokumen</span>
                    </button>
                    <button
                      onClick={() => handleExportWord('lampiran1')}
                      className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between border-t border-slate-100"
                    >
                      <span>Hanya Lampiran I (Harian)</span>
                      <span className="text-[10px] text-slate-400">Word</span>
                    </button>
                    <button
                      onClick={() => handleExportWord('lampiran2')}
                      className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between border-t border-slate-100"
                    >
                      <span>Hanya Lampiran II (Bulanan)</span>
                      <span className="text-[10px] text-slate-400">Word</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Profile & Setting Button */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Edit data guru, kepala madrasah, dan regulasi SE"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Header Quick Actions (< lg screens) */}
            <div className="flex lg:hidden items-center gap-1.5">
              {/* Word Button on Mobile */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDocxMenuOpen(!isDocxMenuOpen)}
                  disabled={isExportingDocx}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Word</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isDocxMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 text-slate-800">
                    <button
                      onClick={() => handleExportWord('all')}
                      className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
                    >
                      <span className="font-semibold">Ekspor Lengkap (L1 &amp; L2)</span>
                      <span className="text-[10px] text-slate-400">1 Dokumen</span>
                    </button>
                    <button
                      onClick={() => handleExportWord('lampiran1')}
                      className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between border-t border-slate-100"
                    >
                      <span>Hanya Lampiran I (Harian)</span>
                      <span className="text-[10px] text-slate-400">Word</span>
                    </button>
                    <button
                      onClick={() => handleExportWord('lampiran2')}
                      className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between border-t border-slate-100"
                    >
                      <span>Hanya Lampiran II (Bulanan)</span>
                      <span className="text-[10px] text-slate-400">Word</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hamburger Menu on Mobile */}
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                title="Menu Pengaturan Lengkap"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Responsive Horizontal Navigation (< lg) */}
        <div className="lg:hidden bg-slate-800 border-t border-slate-700/80 px-2.5 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`shrink-0 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white bg-slate-700/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Cetak</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`shrink-0 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'identity'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white bg-slate-700/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Identitas Guru &amp; Kepala</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`shrink-0 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white bg-slate-700/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Kalender Kerja</span>
            {dailyActivities.length > 0 && (
              <span className="text-[10px] bg-blue-500/30 text-white px-1.5 py-0.2 rounded-full font-mono">
                {dailyActivities.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lampiran1_edit')}
            className={`shrink-0 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'lampiran1_edit'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white bg-slate-700/60'
            }`}
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Harian L1 ({dailyActivities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lampiran2_auto')}
            className={`shrink-0 px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'lampiran2_auto'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white bg-slate-700/60'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Bulanan L2</span>
          </button>

          <button
            type="button"
            onClick={() => handleAutoSyncLampiran2()}
            className="shrink-0 text-emerald-300 hover:text-emerald-100 bg-emerald-950/80 border border-emerald-600/50 flex items-center gap-1 px-3 py-1.5 rounded-lg transition font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sinkron L1 &rarr; L2</span>
          </button>
        </div>

        {/* Desktop Sub-Navigation Bar (Large Screens >= 1024px) */}
        <div className="hidden lg:block bg-slate-800/80 border-t border-slate-700/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 py-2">
            {/* View / Edit Mode Switcher */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview Dokumen Cetak
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('identity')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'identity'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Identitas Guru &amp; Kepala
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'calendar'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Kalender Kerja Otomatis
                {dailyActivities.length > 0 && (
                  <span className="text-[10px] bg-blue-500/30 text-white px-1.5 py-0.2 rounded-full font-mono">
                    {dailyActivities.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('lampiran1_edit')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'lampiran1_edit'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Edit className="w-3.5 h-3.5" />
                Tabel Kegiatan (Lampiran 1)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('lampiran2_auto')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'lampiran2_auto'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                Integrasi Otomatis (Lampiran 2)
              </button>
            </div>

            {/* In Preview Tab, show document selector */}
            {activeTab === 'preview' && (
              <div className="flex items-center gap-1 bg-slate-900/60 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewDocument('both')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    previewDocument === 'both'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Lampiran I &amp; II
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDocument('lampiran1')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    previewDocument === 'lampiran1'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Hanya Lampiran I
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDocument('lampiran2')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    previewDocument === 'lampiran2'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Hanya Lampiran II
                </button>
              </div>
            )}

            {/* Data & Sync Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAutoSyncLampiran2()}
                className="text-[11px] text-emerald-300 hover:text-emerald-100 bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-600/50 flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium"
                title="Sinkronkan seluruh kegiatan Lampiran 1 ke Lampiran 2"
              >
                <RefreshCw className="w-3 h-3 text-emerald-400" />
                <span>Sinkronkan L1 &rarr; L2</span>
              </button>

              {dailyActivities.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsConfirmClearDataOpen(true)}
                  className="text-[11px] text-rose-300 hover:text-rose-100 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-700/50 flex items-center gap-1 px-2.5 py-1 rounded-md transition"
                  title="Kosongkan semua baris data kegiatan"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  Kosongkan Data
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Floating Save/Notice Toast */}
      {saveBannerMessage && (
        <div className="no-print fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveBannerMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-8 pb-28 lg:pb-8">
        {/* TAB 1: Preview Documents (Ready to print & accurate to user photos) */}
        {activeTab === 'preview' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Mobile Document Selector & Action Toolbar */}
            <div className="no-print lg:hidden space-y-2.5 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Pilih Dokumen Tampilan:</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
                  {config.monthName} {config.year}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewDocument('both')}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition text-center ${
                    previewDocument === 'both' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Semua (L1 &amp; L2)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDocument('lampiran1')}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition text-center ${
                    previewDocument === 'lampiran1' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Lampiran I
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDocument('lampiran2')}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition text-center ${
                    previewDocument === 'lampiran2' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Lampiran II
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 text-white rounded-xl font-semibold text-xs shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMobilePreviewScale(mobilePreviewScale === 'fit' ? 'full' : 'fit')}
                  className="inline-flex items-center gap-1 py-2 px-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-xs border border-slate-200"
                >
                  {mobilePreviewScale === 'fit' ? (
                    <>
                      <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                      <span>100%</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Pas Layar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Informative helper banner in preview */}
            <div className="no-print bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <Eye className="w-4 h-4" />
                </span>
                <div>
                  <strong className="text-slate-900">Format Resmi Madrasah:</strong> Tanda tangan Kepala (kiri) dan Guru (kanan) sejajar presisi. Klik area tanda tangan untuk ganti tanda tangan.
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSignatureModalRole('supervisor')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300"
                >
                  <PenTool className="w-3 h-3" /> TTD Kepala
                </button>
                <button
                  onClick={() => setSignatureModalRole('teacher')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300"
                >
                  <PenTool className="w-3 h-3" /> TTD Guru
                </button>
              </div>
            </div>

            {/* Document Sheets */}
            <div className="space-y-12">
              {/* Lampiran 1 */}
              {(previewDocument === 'both' || previewDocument === 'lampiran1') && (
                <div className="relative">
                  <div className="no-print text-center mb-3">
                    <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold">
                      Dokumen 1: Lampiran I (Laporan Kinerja Harian)
                    </span>
                  </div>
                  <div className={`overflow-x-auto transition-all ${mobilePreviewScale === 'fit' ? 'max-w-full overflow-hidden' : ''}`}>
                    <div className={mobilePreviewScale === 'fit' ? 'origin-top-left transform scale-[0.6] sm:scale-100 w-[166%] sm:w-full' : 'min-w-[620px] sm:min-w-0'}>
                      <Lampiran1View
                        config={config}
                        teacher={teacher}
                        supervisor={supervisor}
                        activities={dailyActivities}
                        onOpenTeacherSignature={() => setSignatureModalRole('teacher')}
                        onOpenSupervisorSignature={() => setSignatureModalRole('supervisor')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Page break delimiter for printing */}
              {previewDocument === 'both' && <div className="page-break-after no-print border-t-2 border-dashed border-slate-300 my-8"></div>}

              {/* Lampiran 2 */}
              {(previewDocument === 'both' || previewDocument === 'lampiran2') && (
                <div className="relative">
                  <div className="no-print text-center mb-3">
                    <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold">
                      Dokumen 2: Lampiran II (Laporan Capaian Kinerja Bulanan - Terhitung Otomatis)
                    </span>
                  </div>
                  <div className={`overflow-x-auto transition-all ${mobilePreviewScale === 'fit' ? 'max-w-full overflow-hidden' : ''}`}>
                    <div className={mobilePreviewScale === 'fit' ? 'origin-top-left transform scale-[0.6] sm:scale-100 w-[166%] sm:w-full' : 'min-w-[620px] sm:min-w-0'}>
                      <Lampiran2View
                        config={config}
                        teacher={teacher}
                        supervisor={supervisor}
                        summaries={summaryActivities}
                        onOpenTeacherSignature={() => setSignatureModalRole('teacher')}
                        onOpenSupervisorSignature={() => setSignatureModalRole('supervisor')}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Identitas Guru & Kepala */}
        {activeTab === 'identity' && (
          <IdentityManager
            config={config}
            teacher={teacher}
            supervisor={supervisor}
            onUpdateTeacher={(newT) => {
              setTeacher(newT);
              showNotice('Identitas Guru berhasil diperbarui!');
            }}
            onUpdateSupervisor={(newS) => {
              setSupervisor(newS);
              showNotice('Identitas Kepala berhasil diperbarui!');
            }}
            onUpdateConfig={(newC) => {
              setConfig(newC);
              showNotice('Pengaturan Periode & Regulasi berhasil diperbarui!');
            }}
            onOpenTeacherSignature={() => setSignatureModalRole('teacher')}
            onOpenSupervisorSignature={() => setSignatureModalRole('supervisor')}
          />
        )}

        {/* TAB 3: Kalender Kerja Otomatis */}
        {activeTab === 'calendar' && (
          <CalendarManager
            config={config}
            teacher={teacher}
            dailyActivities={dailyActivities}
            onUpdateActivities={handleUpdateDailyActivities}
            onUpdateConfig={(newC) => {
              setConfig(newC);
              showNotice('Bulan & Tahun laporan berhasil diperbarui!');
            }}
            onAutoSyncLampiran2={handleAutoSyncLampiran2}
          />
        )}

        {/* TAB 4: Lampiran 1 Daily Activities Editor (Tabel) */}
        {activeTab === 'lampiran1_edit' && (
          <DailyActivitiesEditor
            config={config}
            activities={dailyActivities}
            onUpdateActivities={handleUpdateDailyActivities}
            onAutoSyncLampiran2={handleAutoSyncLampiran2}
            onOpenCalendar={() => setActiveTab('calendar')}
          />
        )}

        {/* TAB 4: Lampiran 2 Auto Integration & Mappings */}
        {activeTab === 'lampiran2_auto' && (
          <AutoIntegrationManager
            config={config}
            teacher={teacher}
            dailyActivities={dailyActivities}
            summaryActivities={summaryActivities}
            onUpdateSummaries={setSummaryActivities}
            onTriggerSync={handleAutoSyncLampiran2}
          />
        )}
      </main>

      {/* Footer during normal view */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Aplikasi Laporan Bulanan Guru Sesuai Format Kemenag &bull; Siap Deploy di Hosting Dewa Hoster MySQL
          </div>
          <div className="text-[11px] text-slate-400">
            Terintegrasi Otomatis &bull; Presisi Kiri-Kanan &bull; Word (.docx) &amp; Print
          </div>
        </div>
      </footer>

      {/* Signature Modal */}
      {signatureModalRole && (
        <SignatureModal
          isOpen={true}
          onClose={() => setSignatureModalRole(null)}
          targetRole={signatureModalRole}
          currentSignature={
            signatureModalRole === 'teacher' ? teacher.signatureImage : supervisor.signatureImage
          }
          roleTitle={
            signatureModalRole === 'teacher' ? 'Guru Bidang Studi' : supervisor.position
          }
          personName={
            signatureModalRole === 'teacher' ? teacher.name : supervisor.name
          }
          nip={signatureModalRole === 'teacher' ? teacher.nip : supervisor.nip}
          onSaveSignature={handleSaveSignature}
        />
      )}

      {/* Backup & Restore Multi-Device Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        config={config}
        teacher={teacher}
        supervisor={supervisor}
        dailyActivities={dailyActivities}
        summaryActivities={summaryActivities}
        mySQLConfig={mySQLConfig}
        onRestoreData={handleRestoreData}
        onOpenDewaHosterModal={() => {
          setIsBackupModalOpen(false);
          setIsDewaHosterModalOpen(true);
        }}
      />

      {/* Profile & Setting Modal */}
      <ProfileEditorModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        config={config}
        teacher={teacher}
        supervisor={supervisor}
        onSave={(newCfg, newT, newS) => {
          setConfig(newCfg);
          setTeacher(newT);
          setSupervisor(newS);
          showNotice('Data identitas dan regulasi berhasil diperbarui!');
        }}
      />

      {/* Dewa Hoster MySQL Hub Modal */}
      <DewaHosterMySQLModal
        isOpen={isDewaHosterModalOpen}
        onClose={() => setIsDewaHosterModalOpen(false)}
        config={config}
        teacher={teacher}
        supervisor={supervisor}
        dailyActivities={dailyActivities}
        summaryActivities={summaryActivities}
        mySQLConfig={mySQLConfig}
        onUpdateMySQLConfig={setMySQLConfig}
        onLoadDataFromRemote={handleRestoreData}
      />

      {/* Modal Konfirmasi Kosongkan Data */}
      <ConfirmModal
        isOpen={isConfirmClearDataOpen}
        title="Kosongkan Semua Data Kegiatan?"
        message="Semua baris kegiatan di Lampiran 1 dan Lampiran 2 akan dihapus sehingga formulir laporan menjadi kosong dan siap Anda isi dari awal."
        confirmText="Kosongkan Data"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={handleConfirmClearData}
        onCancel={() => setIsConfirmClearDataOpen(false)}
      />
      {/* Mobile Bottom Navigation Bar (< lg screens) */}
      <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-2 py-1.5 flex items-center justify-around">
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-semibold transition min-w-[56px] ${
            activeTab === 'preview' ? 'text-blue-400 font-bold bg-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-5 h-5 mb-0.5" />
          <span>Preview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-semibold transition min-w-[56px] ${
            activeTab === 'identity' ? 'text-blue-400 font-bold bg-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Identitas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-semibold transition min-w-[56px] relative ${
            activeTab === 'calendar' ? 'text-blue-400 font-bold bg-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span>Kalender</span>
          {dailyActivities.length > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-blue-500"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lampiran1_edit')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-semibold transition min-w-[56px] relative ${
            activeTab === 'lampiran1_edit' ? 'text-blue-400 font-bold bg-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Edit className="w-5 h-5 mb-0.5" />
          <span>Harian L1</span>
          {dailyActivities.length > 0 && (
            <span className="absolute top-0 right-1 text-[9px] bg-emerald-600 text-white px-1.5 rounded-full font-mono font-bold leading-tight shadow-xs">
              {dailyActivities.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lampiran2_auto')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-semibold transition min-w-[56px] ${
            activeTab === 'lampiran2_auto' ? 'text-blue-400 font-bold bg-slate-800' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Link2 className="w-5 h-5 mb-0.5" />
          <span>Bulanan L2</span>
        </button>
      </nav>

      {/* Mobile Action Drawer Sheet (< lg screens) */}
      {isMobileDrawerOpen && (
        <div className="no-print lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in">
          <div className="bg-white rounded-t-3xl shadow-2xl max-w-md w-full p-5 border-t border-slate-200 animate-in slide-in-from-bottom max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Menu &amp; Pengaturan Lengkap</h3>
                <p className="text-[11px] text-slate-500">{teacher.name} &bull; {config.monthName} {config.year}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 text-left rounded-2xl hover:bg-slate-50 border border-slate-100 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Edit Identitas Guru, Kepala &amp; SE</div>
                  <div className="text-[10px] text-slate-500">Nama, NIP, Jabatan, Unit Kerja, Pangkat/Golongan</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsBackupModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 text-left rounded-2xl hover:bg-sky-50 border border-sky-100 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Pindah Perangkat / Backup Data</div>
                  <div className="text-[10px] text-slate-500">Ekspor/impor cadangan file saat ganti laptop/HP</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsDewaHosterModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 text-left rounded-2xl hover:bg-emerald-50 border border-emerald-100 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Deploy Dewa Hoster (MySQL Cloud)</div>
                  <div className="text-[10px] text-slate-500">Koneksi database online &amp; panduan cPanel</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  handlePrint();
                }}
                className="w-full flex items-center gap-3 p-3 text-left rounded-2xl hover:bg-slate-50 border border-slate-100 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Cetak Dokumen / Simpan PDF</div>
                  <div className="text-[10px] text-slate-500">Cetak Lampiran I &amp; II langsung atau cetak ke PDF</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  handleAutoSyncLampiran2();
                }}
                className="w-full flex items-center gap-3 p-3 text-left rounded-2xl hover:bg-emerald-50 border border-emerald-100 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Sinkronkan Lampiran 1 &rarr; Lampiran 2</div>
                  <div className="text-[10px] text-slate-500">Perbarui otomatis seluruh volume capaian bulanan</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsConfirmClearDataOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 text-left rounded-2xl hover:bg-rose-50 border border-rose-100 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-700">Kosongkan Semua Data Kegiatan</div>
                  <div className="text-[10px] text-slate-400">Hapus baris Lampiran 1 &amp; 2 untuk mulai periode baru</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
