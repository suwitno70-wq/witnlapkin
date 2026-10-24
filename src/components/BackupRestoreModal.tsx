import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  HardDrive,
  Laptop,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  RefreshCw,
  FileCheck,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import {
  DailyActivityItem,
  MySQLConfig,
  ReportConfig,
  SummaryActivityItem,
  SupervisorProfile,
  TeacherProfile,
} from '../types';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ReportConfig;
  teacher: TeacherProfile;
  supervisor: SupervisorProfile;
  dailyActivities: DailyActivityItem[];
  summaryActivities: SummaryActivityItem[];
  mySQLConfig: MySQLConfig;
  onRestoreData: (data: {
    config?: ReportConfig;
    teacher?: TeacherProfile;
    supervisor?: SupervisorProfile;
    dailyActivities?: DailyActivityItem[];
    summaryActivities?: SummaryActivityItem[];
    mySQLConfig?: MySQLConfig;
  }) => void;
  onOpenDewaHosterModal: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  config,
  teacher,
  supervisor,
  dailyActivities,
  summaryActivities,
  mySQLConfig,
  onRestoreData,
  onOpenDewaHosterModal,
}) => {
  const [activeTab, setActiveTab] = useState<'backup_restore' | 'cloud' | 'guide'>('backup_restore');
  const [restoreNotice, setRestoreNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [customEndpoint, setCustomEndpoint] = useState(mySQLConfig.apiEndpoint || '');
  const [cloudStatus, setCloudStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // 1. Export JSON Backup
  const handleExportBackup = () => {
    const backupPayload = {
      app: 'Sistem Laporan Kinerja Guru (Lampiran 1 & 2)',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      summary: {
        teacherName: teacher.name,
        period: `${config.monthName} ${config.year}`,
        dailyActivitiesCount: dailyActivities.length,
        summaryActivitiesCount: summaryActivities.length,
        hasTeacherSignature: !!teacher.signatureImage,
        hasSupervisorSignature: !!supervisor.signatureImage,
      },
      data: {
        config,
        teacher,
        supervisor,
        dailyActivities,
        summaryActivities,
        mySQLConfig,
      },
    };

    const fileName = `cadangan_laporan_guru_${config.monthName.toLowerCase()}_${config.year}_${teacher.name.replace(/\s+/g, '_')}.json`;
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json;charset=utf-8' });
    saveAs(blob, fileName);

    setRestoreNotice({
      type: 'success',
      message: `File cadangan berhasil diunduh (${fileName}). Simpan file ini di flashdisk, email, atau kirim ke WhatsApp diri sendiri untuk dibuka di laptop lain!`,
    });
  };

  // 2. Import / Restore JSON Backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation: verify structure
        const sourceData = parsed.data || parsed;
        if (!sourceData.dailyActivities && !sourceData.teacher && !sourceData.config) {
          throw new Error('Format file JSON tidak sesuai dengan data Laporan Kinerja Guru.');
        }

        onRestoreData({
          config: sourceData.config,
          teacher: sourceData.teacher,
          supervisor: sourceData.supervisor,
          dailyActivities: sourceData.dailyActivities,
          summaryActivities: sourceData.summaryActivities,
          mySQLConfig: sourceData.mySQLConfig,
        });

        const teacherName = sourceData.teacher?.name || teacher.name;
        const count = Array.isArray(sourceData.dailyActivities) ? sourceData.dailyActivities.length : 0;
        const month = sourceData.config?.monthName || config.monthName;
        const year = sourceData.config?.year || config.year;

        setRestoreNotice({
          type: 'success',
          message: `Berhasil Memulihkan Data! Laporan periode ${month} ${year} milik ${teacherName} (${count} kegiatan Lampiran 1 & tanda tangan) telah siap digunakan di perangkat ini!`,
        });
      } catch (err: any) {
        setRestoreNotice({
          type: 'error',
          message: `Gagal membaca file cadangan: ${err.message || 'Pastikan Anda memilih file .json cadangan yang benar.'}`,
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Save endpoint URL to MySQL Config
  const handleSaveEndpoint = (endpointToSave?: string) => {
    const val = (endpointToSave !== undefined ? endpointToSave : customEndpoint).trim();
    setCustomEndpoint(val);
    onRestoreData({
      mySQLConfig: {
        ...mySQLConfig,
        apiEndpoint: val,
      },
    });
    setCloudStatus({
      type: 'success',
      message: val ? `URL API berhasil disimpan: ${val}` : 'URL API telah dikosongkan.',
    });
    setTimeout(() => {
      setCloudStatus((prev) => (prev.type === 'success' ? { type: 'idle', message: '' } : prev));
    }, 3000);
  };

  // 3. Save to Dewa Hoster Cloud MySQL
  const handleSaveToCloud = async () => {
    const endpoint = customEndpoint.trim() || mySQLConfig.apiEndpoint;
    if (!endpoint) {
      setCloudStatus({
        type: 'error',
        message: 'Silakan isi URL API domain hosting Anda pada kolom di bawah (misal: https://domainanda.com/api/api.php) lalu klik Simpan URL.',
      });
      return;
    }

    // Auto save if user typed without clicking Simpan URL
    if (customEndpoint.trim() && customEndpoint.trim() !== mySQLConfig.apiEndpoint) {
      handleSaveEndpoint(customEndpoint.trim());
    }

    setCloudStatus({ type: 'loading', message: 'Menyimpan data ke server MySQL Dewa Hoster...' });
    try {
      const url = endpoint.includes('?')
        ? `${endpoint}&action=save_report`
        : `${endpoint}?action=save_report`;

      const payload = {
        config,
        teacher,
        supervisor,
        dailyActivities,
        summaryActivities,
        secretKey: mySQLConfig.encryptionKey,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.status === 'success') {
        setCloudStatus({
          type: 'success',
          message: 'Data berhasil tersimpan online di database MySQL Dewa Hoster! Sekarang Anda dapat membukanya dari perangkat mana pun.',
        });
      } else {
        setCloudStatus({
          type: 'error',
          message: result.message || 'Gagal menyimpan data ke MySQL.',
        });
      }
    } catch (err: any) {
      setCloudStatus({
        type: 'error',
        message: `Koneksi gagal: ${err.message}. Pastikan file api.php sudah aktif di folder public_html/api/api.php hosting Anda.`,
      });
    }
  };

  // 4. Fetch from Dewa Hoster Cloud MySQL
  const handleFetchFromCloud = async () => {
    const endpoint = customEndpoint.trim() || mySQLConfig.apiEndpoint;
    if (!endpoint) {
      setCloudStatus({
        type: 'error',
        message: 'Silakan isi URL API domain hosting Anda pada kolom di bawah (misal: https://domainanda.com/api/api.php) lalu klik Simpan URL.',
      });
      return;
    }

    // Auto save if user typed without clicking Simpan URL
    if (customEndpoint.trim() && customEndpoint.trim() !== mySQLConfig.apiEndpoint) {
      handleSaveEndpoint(customEndpoint.trim());
    }

    setCloudStatus({ type: 'loading', message: 'Mengambil data terbaru dari database MySQL Dewa Hoster...' });
    try {
      const url = endpoint.includes('?')
        ? `${endpoint}&action=get_report&bulan=${encodeURIComponent(config.monthName)}&tahun=${config.year}`
        : `${endpoint}?action=get_report&bulan=${encodeURIComponent(config.monthName)}&tahun=${config.year}`;

      const res = await fetch(url, { method: 'GET' });
      const result = await res.json();

      if (result.status === 'success' && result.dailyActivities) {
        onRestoreData({
          dailyActivities: result.dailyActivities,
          summaryActivities: result.summaryActivities || [],
        });
        setCloudStatus({
          type: 'success',
          message: `Berhasil menarik ${result.dailyActivities.length} data kegiatan dari server MySQL Dewa Hoster!`,
        });
      } else {
        setCloudStatus({
          type: 'error',
          message: result.message || 'Data untuk periode ini belum ditemukan di server hosting.',
        });
      }
    } catch (err: any) {
      setCloudStatus({
        type: 'error',
        message: `Gagal memuat data dari hosting: ${err.message}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
              <Laptop className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                Solusi Pindah Perangkat &amp; Cadangkan Data
              </h3>
              <p className="text-xs text-slate-300">
                Akses laporan kinerja Anda dari laptop rumah, komputer sekolah, atau smartphone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-slate-50 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('backup_restore')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'backup_restore'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            Cadangkan &amp; Pulihkan (File JSON)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'cloud'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Sinkronisasi MySQL Dewa Hoster
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Panduan Pindah Perangkat
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Mengapa data hilang di perangkat lain callout */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-blue-900">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <strong className="block text-xs text-blue-950 font-bold mb-0.5">
                Mengapa Data Awalnya Kosong Saat Pindah Perangkat?
              </strong>
              Secara standar, demi keamanan dan privasi guru, browser menyimpan data laporan di memori lokal (<em>Local Storage</em>) perangkat yang sedang Anda pakai. Agar data dapat muncul di perangkat lain (laptop lain, HP, dsb.), gunakan salah satu dari <strong>2 cara di bawah ini</strong>:
            </div>
          </div>

          {restoreNotice && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                restoreNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {restoreNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium leading-relaxed">{restoreNotice.message}</div>
              <button
                onClick={() => setRestoreNotice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: Backup & Restore File JSON */}
          {activeTab === 'backup_restore' && (
            <div className="space-y-4">
              {/* Ringkasan Data Saat Ini */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] font-bold text-slate-700 block mb-1">
                  📊 Ringkasan Data Siap Cadang Saat Ini:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 font-medium">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Guru</span>
                    <span className="font-bold text-slate-800 truncate block">{teacher.name}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Periode</span>
                    <span className="font-bold text-slate-800">{config.monthName} {config.year}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Lampiran 1</span>
                    <span className="font-bold text-emerald-700">{dailyActivities.length} Kegiatan</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Lampiran 2</span>
                    <span className="font-bold text-blue-700">{summaryActivities.length} Capaian</span>
                  </div>
                </div>
              </div>

              {/* Dua Tombol Aksi Utama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* 1. Cadangkan Data */}
                <div className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-2xl p-4 flex flex-col justify-between hover:bg-blue-50 transition">
                  <div className="space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Download className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      1. Cadangkan Data (Di Komputer Lama)
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Unduh 1 file cadangan <code>.json</code> yang berisi seluruh data identitas, kegiatan, dan tanda tangan digital Anda.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="mt-3.5 w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition"
                  >
                    <Download className="w-4 h-4" />
                    Unduh File Cadangan (.json)
                  </button>
                </div>

                {/* 2. Pulihkan Data */}
                <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-2xl p-4 flex flex-col justify-between hover:bg-emerald-50 transition">
                  <div className="space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Upload className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      2. Pulihkan Data (Di Komputer Baru)
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Di perangkat baru Anda, pilih file <code>.json</code> yang telah diunduh. Seketika semua data akan pulih 100%!
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".json"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3.5 w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition"
                    >
                      <Upload className="w-4 h-4" />
                      Pilih &amp; Pulihkan File (.json)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Cloud Sync MySQL Dewa Hoster */}
          {activeTab === 'cloud' && (
            <div className="space-y-3.5">
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-400">
                    <Database className="w-4 h-4" />
                    Sinkronisasi Online Database MySQL Dewa Hoster
                  </div>
                  <button
                    type="button"
                    onClick={onOpenDewaHosterModal}
                    className="text-[10px] text-emerald-300 hover:text-white underline font-semibold"
                  >
                    Buka Panduan Lengkap MySQL &rarr;
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Dengan menghubungkan ke domain hosting Dewa Hoster Anda, Anda tidak perlu lagi repot mengirim file cadangan. Cukup klik <strong>"Simpan ke Cloud"</strong> di satu laptop, lalu klik <strong>"Tarik Data"</strong> di laptop atau HP lain!
                </p>

                {/* Form Input URL API Langsung */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">
                      🌐 Masukkan URL API Domain Dewa Hoster Anda:
                    </label>
                    {customEndpoint && (
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                        URL Tersimpan
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={customEndpoint}
                      onChange={(e) => setCustomEndpoint(e.target.value)}
                      placeholder="https://namadomainanda.com/api/api.php"
                      className="flex-1 text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEndpoint()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition shrink-0 cursor-pointer"
                    >
                      Simpan URL
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                    <span>💡 Format URL:</span>
                    <button
                      type="button"
                      onClick={() => setCustomEndpoint('https://domainanda.com/api/api.php')}
                      className="font-mono text-emerald-300 hover:underline"
                    >
                      https://[domain-anda]/api/api.php
                    </button>
                    <span>(Pastikan file <code>api.php</code> sudah ada di <code>public_html/api/</code>)</span>
                  </div>
                </div>
              </div>

              {cloudStatus.message && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    cloudStatus.type === 'loading'
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : cloudStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {cloudStatus.type === 'loading' && <RefreshCw className="w-4 h-4 animate-spin shrink-0 mt-0.5" />}
                  {cloudStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                  {cloudStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                  <span className="font-medium">{cloudStatus.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleSaveToCloud}
                  className="p-3.5 bg-white border border-slate-300 hover:border-emerald-500 rounded-xl text-left hover:bg-emerald-50/30 transition group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-xs group-hover:text-emerald-700">
                      Simpan ke Cloud MySQL
                    </span>
                    <Upload className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Kirim data saat ini ke server database Dewa Hoster agar tersimpan secara online.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={handleFetchFromCloud}
                  className="p-3.5 bg-white border border-slate-300 hover:border-blue-500 rounded-xl text-left hover:bg-blue-50/30 transition group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-xs group-hover:text-blue-700">
                      Tarik Data dari Cloud MySQL
                    </span>
                    <Download className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Muat data laporan dari server Dewa Hoster ke perangkat ini secara langsung.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Panduan Langkah Demi Langkah */}
          {activeTab === 'guide' && (
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  Cara Termudah: Kirim File Cadangan via WhatsApp / Email
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] pl-2">
                  <li>Di laptop yang sudah ada datanya, klik tab <strong>"Cadangkan &amp; Pulihkan"</strong> &gt; klik <strong>"Unduh File Cadangan (.json)"</strong>.</li>
                  <li>Kirim file <code>.json</code> yang terunduh tersebut ke WhatsApp Anda sendiri, Telegram, Google Drive, atau flashdisk.</li>
                  <li>Buka aplikasi ini di laptop baru / HP baru Anda.</li>
                  <li>Klik tombol <strong>"Cadangkan &amp; Pindah Perangkat"</strong> di atas &gt; klik <strong>"Pilih &amp; Pulihkan File (.json)"</strong>.</li>
                  <li>Pilih file yang tadi dikirim. Seluruh data identitas, kegiatan, dan tanda tangan langsung terisi otomatis!</li>
                </ol>
              </div>

              <div className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    2
                  </span>
                  Cara Otomatis: Pakai Hosting Dewa Hoster
                </div>
                <p className="text-slate-600 text-[11px] pl-2">
                  Jika web sudah Anda upload ke <code>public_html</code> Dewa Hoster dan database MySQL sudah aktif, Anda cukup menekan tombol <strong>Simpan ke Cloud</strong> di laptop sekolah, lalu saat di rumah cukup buka website Anda dan tekan <strong>Tarik Data dari Cloud</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Cadangan menyertakan profil guru, kepala sekolah, kegiatan harian, dan tanda tangan
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
