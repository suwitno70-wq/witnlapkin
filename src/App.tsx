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
  const [signatureModalRole, setSignatureModalRole] = useState<'teacher' | 'supervisor' | null>(null);
  const [isDocxMenuOpen, setIsDocxMenuOpen] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [saveBannerMessage, setSaveBannerMessage] = useState<string | null>(null);

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
      <header className="no-print bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-emerald-400/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-white sm:text-base">
                    Laporan Kinerja Bulanan Guru
                  </h1>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                    Lampiran I &amp; II Terintegrasi
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  {config.monthName} {config.year} &bull; {teacher.name}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Dewa Hoster MySQL Button */}
              <button
                type="button"
                onClick={() => setIsDewaHosterModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-600/50 rounded-lg transition"
                title="Integrasi & Panduan Deploy Database MySQL Dewa Hoster"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Deploy Dewa Hoster (MySQL)</span>
                <span className="md:hidden">MySQL</span>
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
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
          </div>
        </div>

        {/* Sub-Navigation Bar */}
        <div className="bg-slate-800/80 border-t border-slate-700/80 px-4 sm:px-6 lg:px-8">
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* TAB 1: Preview Documents (Ready to print & accurate to user photos) */}
        {activeTab === 'preview' && (
          <div className="space-y-8">
            {/* Informative helper banner in preview */}
            <div className="no-print bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Eye className="w-4 h-4" />
                </span>
                <div>
                  <strong className="text-slate-900">Format Resmi Sesuai Foto:</strong> Tanda tangan Kepala (kiri) dan Guru (kanan) sejajar presisi. Klik pada area tanda tangan untuk mengubah tanda tangan secara langsung.
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
                  <Lampiran1View
                    config={config}
                    teacher={teacher}
                    supervisor={supervisor}
                    activities={dailyActivities}
                    onOpenTeacherSignature={() => setSignatureModalRole('teacher')}
                    onOpenSupervisorSignature={() => setSignatureModalRole('supervisor')}
                  />
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
                  <Lampiran2View
                    config={config}
                    teacher={teacher}
                    supervisor={supervisor}
                    summaries={summaryActivities}
                    onOpenTeacherSignature={() => setSignatureModalRole('teacher')}
                    onOpenSupervisorSignature={() => setSignatureModalRole('supervisor')}
                  />
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
    </div>
  );
}
