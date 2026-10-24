import React, { useState } from 'react';
import {
  Database,
  Server,
  Lock,
  Download,
  Copy,
  Check,
  FileCode,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  X,
  AlertCircle,
  Globe,
  FolderArchive,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { MYSQL_SCHEMA_SQL, DEWA_HOSTER_PHP_API, DEWA_HOSTER_HTACCESS, PRODUCTION_INDEX_HTML } from '../utils/dewaHosterSql';
import { DailyActivityItem, MySQLConfig, ReportConfig, SummaryActivityItem, SupervisorProfile, TeacherProfile } from '../types';

interface DewaHosterMySQLModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ReportConfig;
  teacher: TeacherProfile;
  supervisor: SupervisorProfile;
  dailyActivities: DailyActivityItem[];
  summaryActivities: SummaryActivityItem[];
  mySQLConfig: MySQLConfig;
  onUpdateMySQLConfig: (cfg: MySQLConfig) => void;
  onLoadDataFromRemote?: (data: any) => void;
}

export const DewaHosterMySQLModal: React.FC<DewaHosterMySQLModalProps> = ({
  isOpen,
  onClose,
  config,
  teacher,
  supervisor,
  dailyActivities,
  summaryActivities,
  mySQLConfig,
  onUpdateMySQLConfig,
  onLoadDataFromRemote,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'index_html' | 'htaccess' | 'sql' | 'api' | 'connect'>('guide');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedApi, setCopiedApi] = useState(false);
  const [copiedHtaccess, setCopiedHtaccess] = useState(false);
  const [copiedIndexHtml, setCopiedIndexHtml] = useState(false);
  const [zipDownloadStatus, setZipDownloadStatus] = useState<string>('');
  const [testStatus, setTestStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  // Local connection form state
  const [endpointUrl, setEndpointUrl] = useState(mySQLConfig.apiEndpoint || '');
  const [encKey, setEncKey] = useState(mySQLConfig.encryptionKey || 'Kemenag_Kotim_AES256_Secret!');
  const [dbName, setDbName] = useState(mySQLConfig.database || 'minkoti2_witnolapkin');
  const [dbUser, setDbUser] = useState(mySQLConfig.username || 'minkoti2_user');

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(MYSQL_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([MYSQL_SCHEMA_SQL], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'skema_mysql_laporan_guru_dewahoster.sql');
  };

  const handleCopyApi = () => {
    navigator.clipboard.writeText(DEWA_HOSTER_PHP_API);
    setCopiedApi(true);
    setTimeout(() => setCopiedApi(false), 2000);
  };

  const handleDownloadApi = () => {
    const blob = new Blob([DEWA_HOSTER_PHP_API], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'api.php');
  };

  const handleCopyHtaccess = () => {
    navigator.clipboard.writeText(DEWA_HOSTER_HTACCESS);
    setCopiedHtaccess(true);
    setTimeout(() => setCopiedHtaccess(false), 2000);
  };

  const handleDownloadHtaccess = () => {
    const blob = new Blob([DEWA_HOSTER_HTACCESS], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, '.htaccess');
  };

  const handleCopyIndexHtml = () => {
    navigator.clipboard.writeText(PRODUCTION_INDEX_HTML);
    setCopiedIndexHtml(true);
    setTimeout(() => setCopiedIndexHtml(false), 2000);
  };

  const handleDownloadIndexHtml = () => {
    const blob = new Blob([PRODUCTION_INDEX_HTML], { type: 'text/html;charset=utf-8' });
    saveAs(blob, 'index.html');
  };

  const handleDownloadCpanelZip = async () => {
    setZipDownloadStatus('Mengunduh ZIP...');
    try {
      const res = await fetch('./dewahoster_deploy_public_html.zip');
      if (res.ok) {
        const blob = await res.blob();
        saveAs(blob, 'dewahoster_deploy_public_html.zip');
        setZipDownloadStatus('File ZIP Berhasil Diunduh!');
        setTimeout(() => setZipDownloadStatus(''), 4000);
        return;
      }
      const res2 = await fetch('/dewahoster_deploy_public_html.zip');
      if (res2.ok) {
        const blob2 = await res2.blob();
        saveAs(blob2, 'dewahoster_deploy_public_html.zip');
        setZipDownloadStatus('File ZIP Berhasil Diunduh!');
        setTimeout(() => setZipDownloadStatus(''), 4000);
        return;
      }
      throw new Error('Gagal mengunduh file zip');
    } catch {
      // Direct link fallback
      const link = document.createElement('a');
      link.href = '/dewahoster_deploy_public_html.zip';
      link.download = 'dewahoster_deploy_public_html.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setZipDownloadStatus('Sedang mengunduh via link...');
      setTimeout(() => setZipDownloadStatus(''), 4000);
    }
  };

  const handleSaveConfig = () => {
    onUpdateMySQLConfig({
      ...mySQLConfig,
      apiEndpoint: endpointUrl,
      encryptionKey: encKey,
      database: dbName,
      username: dbUser,
    });
  };

  const handleTestConnection = async () => {
    if (!endpointUrl) {
      setTestStatus({
        type: 'error',
        message: 'Silakan masukkan URL API Dewa Hoster Anda terlebih dahulu (misal: https://domainanda.com/api/api.php)',
      });
      return;
    }

    setTestStatus({ type: 'loading', message: 'Menghubungkan ke MySQL Server Dewa Hoster...' });
    try {
      const url = endpointUrl.includes('?')
        ? `${endpointUrl}&action=test_connection`
        : `${endpointUrl}?action=test_connection`;

      const res = await fetch(url, { method: 'GET' });
      const data = await res.json();
      if (data.status === 'success') {
        setTestStatus({
          type: 'success',
          message: `Koneksi Berhasil! Database: ${data.database || dbName}. MySQL terhubung dengan aman.`,
        });
        handleSaveConfig();
      } else {
        setTestStatus({
          type: 'error',
          message: data.message || 'Koneksi gagal ditolak oleh server hosting.',
        });
      }
    } catch (err: any) {
      setTestStatus({
        type: 'error',
        message: `Gagal menghubungi endpoint: ${err.message || 'Pastikan file api.php sudah di-upload ke hosting Dewa Hoster dan CORS diizinkan.'}`,
      });
    }
  };

  const handleSyncToRemote = async () => {
    if (!endpointUrl) {
      alert('Silakan isi URL API Endpoint Dewa Hoster Anda di tab Koneksi.');
      return;
    }

    setTestStatus({ type: 'loading', message: 'Menyimpan laporan ke database MySQL Dewa Hoster...' });
    try {
      const url = endpointUrl.includes('?')
        ? `${endpointUrl}&action=save_report`
        : `${endpointUrl}?action=save_report`;

      const payload = {
        config,
        teacher,
        supervisor,
        dailyActivities,
        summaryActivities,
        secretKey: encKey,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.status === 'success') {
        setTestStatus({
          type: 'success',
          message: 'Data Lampiran 1 & 2 berhasil disimpan dan terenkripsi di MySQL Dewa Hoster!',
        });
      } else {
        setTestStatus({
          type: 'error',
          message: data.message || 'Gagal menyimpan ke MySQL Dewa Hoster.',
        });
      }
    } catch (err: any) {
      setTestStatus({
        type: 'error',
        message: `Gagal mengirim ke hosting: ${err.message}`,
      });
    }
  };

  const handleExportJsonBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      config,
      teacher,
      supervisor,
      dailyActivities,
      summaryActivities,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    saveAs(blob, `backup_laporan_guru_${config.monthName}_${config.year}.json`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                Integrasi &amp; Panduan Deploy MySQL Dewa Hoster
              </h3>
              <p className="text-xs text-slate-300">
                Data Lampiran 1 &amp; 2 tersimpan di database MySQL yang aman dan terenkripsi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Panduan Deploy Dewa Hoster
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('index_html')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'index_html'
                ? 'border-emerald-600 text-emerald-700 font-bold bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            File index.html &amp; Web dist
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('htaccess')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'htaccess'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Fix 404 (.htaccess)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Skema Database (.sql)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'api'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Backend PHP (api.php)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('connect')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'connect'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Koneksi &amp; Enkripsi Live
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'guide' && (
            <div className="space-y-4">
              {/* Solusi Error 404 Box */}
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-rose-950 text-xs flex items-center gap-2">
                    <span>Solusi Error 404 Not Found &amp; Lokasi File index.html</span>
                  </h4>
                  <p className="text-rose-900 text-[11px] mt-1 leading-relaxed">
                    <strong>Pertanyaan: File index.html ada di mana?</strong><br />
                    File <code>index.html</code> untuk hosting berada di dalam folder <strong><code>dist/index.html</code></strong>. Saat diupload ke cPanel Dewa Hoster, posisinya <strong>harus ditaruh langsung di dalam folder <code>/home/minkoti2/public_html/index.html</code></strong> (BUKAN di dalam <code>public_html/dist/</code>).
                  </p>
                  <ul className="list-disc list-inside text-rose-900 text-[11px] space-y-1 mt-1.5">
                    <li>
                      <strong>Paling Mudah:</strong> Unduh paket ZIP 1-klik di tab <strong>"File index.html &amp; Web dist"</strong>, lalu upload dan klik Extract di cPanel.
                    </li>
                    <li>
                      <strong>File .htaccess:</strong> Pastikan file <code>.htaccess</code> juga ada di <code>public_html/</code> agar server LiteSpeed tidak memunculkan 404 saat membuka halaman.
                    </li>
                  </ul>
                  <div className="mt-2.5 pt-2 border-t border-rose-200 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('index_html')}
                      className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-800 shadow-xs flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Buka Tab File index.html &amp; Paket Web
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCpanelZip}
                      className="px-3 py-1.5 bg-rose-700 text-white rounded-lg text-[11px] font-semibold hover:bg-rose-800 shadow-xs flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh Paket ZIP Siap Upload (600 KB)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('htaccess')}
                      className="px-3 py-1.5 bg-white border border-rose-300 text-rose-800 rounded-lg text-[11px] font-semibold hover:bg-rose-100 shadow-xs"
                    >
                      Buka .htaccess
                    </button>
                  </div>
                </div>
              </div>

              {/* Solusi Error #1044 Box */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950 text-xs">
                    Solusi Error #1044 ("Access denied for user to database 'db_laporan_guru'")
                  </h4>
                  <p className="text-amber-800 text-[11px] mt-1 leading-relaxed">
                    Penyebab: Pada shared hosting cPanel Dewa Hoster, akun hosting tidak diizinkan membuat database baru lewat query SQL (nama database sudah dibuat cPanel: <code>minkoti2_witnolapkin</code>).
                  </p>
                  <p className="text-amber-900 text-[11px] mt-1 font-semibold">
                    Cara Mengatasinya:
                  </p>
                  <ol className="list-decimal list-inside text-amber-900 text-[11px] space-y-0.5 mt-0.5">
                    <li>Unduh skema SQL terbaru di tab <strong>"Skema Database (.sql)"</strong> di atas (perintah <code>CREATE DATABASE</code> sudah kami hapus).</li>
                    <li>Di phpMyAdmin, klik database Anda di panel kiri (misalnya: <strong>minkoti2_witnolapkin</strong>).</li>
                    <li>Klik tab <strong>"Import"</strong> &gt; pilih file SQL yang baru diunduh &gt; klik <strong>"Kirim / Go"</strong>. Berhasil 100%!</li>
                  </ol>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs">
                    Arsitektur Aman &amp; Terenkripsi untuk Hosting Dewa Hoster (cPanel)
                  </h4>
                  <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                    Aplikasi ini dirancang khusus untuk berjalan di hosting Dewa Hoster dengan 2 pilihan:
                    Frontend statis super cepat + backend API PHP PDO aman dengan prepared statements, atau Fullstack Node.js.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      1
                    </span>
                    Database MySQL di cPanel Dewa Hoster
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-2">
                    <li>Database Anda di cPanel: <code>minkoti2_witnolapkin</code>.</li>
                    <li>Pastikan user MySQL telah ditautkan ke database tersebut dengan hak akses <strong>ALL PRIVILEGES</strong>.</li>
                  </ol>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      2
                    </span>
                    Import Skema SQL via phpMyAdmin (Langsung ke Database)
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-2">
                    <li>Buka phpMyAdmin dari cPanel Dewa Hoster Anda.</li>
                    <li>Klik database <code>minkoti2_witnolapkin</code> di sidebar sebelah kiri.</li>
                    <li>Klik tab <strong>"Import"</strong>, pilih file <code>skema_mysql_laporan_guru_dewahoster.sql</code> terbaru.</li>
                    <li>Klik tombol <strong>"Kirim / Go"</strong>. Keempat tabel (profil, periode, lampiran 1, lampiran 2) akan langsung terbentuk tanpa error!</li>
                  </ol>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      3
                    </span>
                    Upload File Backend API &amp; Web
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-2">
                    <li>Buka <strong>"File Manager"</strong> di cPanel, masuk ke folder <code>public_html</code>.</li>
                    <li>Buat folder <code>api</code> dan upload file <code>api.php</code> (unduh di tab Backend PHP).</li>
                    <li>Edit file <code>api.php</code> dan masukkan nama database, user, dan password MySQL Anda.</li>
                    <li>Build frontend aplikasi (<code>npm run build</code>) lalu upload isi folder <code>dist/</code> ke <code>public_html/</code>.</li>
                  </ol>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      4
                    </span>
                    Aktifkan SSL Gratis di Dewa Hoster
                  </div>
                  <p className="text-slate-600 pl-2">
                    Buka menu <strong>"SSL/TLS Status"</strong> di cPanel Dewa Hoster dan klik <strong>"Run AutoSSL"</strong> untuk memastikan semua data ditransmisikan lewat enkripsi HTTPS secara gratis.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    File Skema MySQL (MariaDB / MySQL 5.7+)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Mencakup struktur tabel tb_periode_laporan, tb_lampiran1_harian, tb_lampiran2_bulanan, dan AES Stored Procedure.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium text-slate-700"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSql ? 'Tersalin' : 'Salin SQL'}
                  </button>
                  <button
                    onClick={handleDownloadSql}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh .sql
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-96 custom-scrollbar leading-relaxed">
                <pre>{MYSQL_SCHEMA_SQL}</pre>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Script REST API PHP PDO (api.php)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    File ini diletakkan di <code>public_html/api/api.php</code> di hosting Dewa Hoster Anda.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyApi}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium text-slate-700"
                  >
                    {copiedApi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedApi ? 'Tersalin' : 'Salin PHP'}
                  </button>
                  <button
                    onClick={handleDownloadApi}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh api.php
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-96 custom-scrollbar leading-relaxed">
                <pre>{DEWA_HOSTER_PHP_API}</pre>
              </div>
            </div>
          )}

          {activeTab === 'index_html' && (
            <div className="space-y-4">
              {/* Jawaban Langsung */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-300 rounded-2xl">
                <div className="flex items-start gap-3">
                  <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                    <Globe className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Lokasi File index.html &amp; Paket Web Siap Upload
                    </h4>
                    <p className="text-slate-700 text-xs mt-1 leading-relaxed">
                      Pertanyaan: <strong className="text-emerald-900">"File index.html di mana?"</strong>
                    </p>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px]">
                      <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200">
                        <span className="font-bold text-slate-800 block text-xs">💻 Di Proyek Sumber (Build)</span>
                        <p className="text-slate-600 mt-0.5">
                          File siap pakai ada di folder: <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono font-bold">dist/index.html</code> (bersama folder <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono">dist/assets/</code>).
                        </p>
                      </div>
                      <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200">
                        <span className="font-bold text-slate-800 block text-xs">🌐 Di cPanel Dewa Hoster</span>
                        <p className="text-slate-600 mt-0.5">
                          Wajib ditaruh langsung di: <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono font-bold">/home/minkoti2/public_html/index.html</code> (BUKAN di dalam subfolder <code className="bg-rose-100 text-rose-800 px-1 py-0.5 rounded font-mono line-through">public_html/dist/</code>).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solusi Instan 1-Klik: ZIP Lengkap */}
              <div className="p-4 bg-emerald-900 text-white rounded-2xl shadow-lg border border-emerald-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-emerald-700/60 rounded-xl border border-emerald-500/30">
                      <FolderArchive className="w-6 h-6 text-emerald-300" />
                    </span>
                    <div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider">
                        Rekomendasi Terbaik
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        Paket ZIP Lengkap Siap Upload cPanel
                      </h4>
                      <p className="text-xs text-emerald-200">
                        Berisi: <code>index.html</code> + folder <code>assets/</code> + <code>.htaccess</code> + <code>api/api.php</code>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadCpanelZip}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-900 rounded-xl font-bold text-xs shadow-md transition hover:scale-102 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-700" />
                      Unduh dewahoster_deploy.zip (600 KB)
                    </button>
                    {zipDownloadStatus && (
                      <span className="text-[10px] text-emerald-200 font-semibold animate-pulse">
                        {zipDownloadStatus}
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-emerald-950/60 border border-emerald-700/50 rounded-xl p-3 text-[11px] text-emerald-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Cara Pasang:</strong> Login ke cPanel &gt; buka <strong>File Manager</strong> &gt; masuk ke <strong>public_html</strong> &gt; klik <strong>Upload</strong> file zip ini &gt; klik kanan pada zip dan pilih <strong>Extract</strong>.
                  </div>
                </div>
              </div>

              {/* Bantuan Khusus Jika ZIP Gagal di-Extract */}
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="p-1.5 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                  <div>
                    <h5 className="font-bold text-amber-950 text-xs">
                      File ZIP Tidak Berhasil di-Extract di cPanel? Ini 3 Solusinya:
                    </h5>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Masalah ini sangat sering terjadi di cPanel karena server LiteSpeed/hosting shared membatasi extract file ZIP atau tampilan cPanel belum dimuat ulang.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-[11px]">
                  {/* Solusi 1 */}
                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold">1</span>
                      Solusi Terbaik: Ekstrak di Komputer/Laptop Dulu, Lalu Upload (100% Pasti Berhasil)
                    </span>
                    <ol className="list-decimal list-inside text-slate-700 space-y-1 mt-1 pl-1">
                      <li>Buka folder <strong>Downloads</strong> di laptop/komputer Anda.</li>
                      <li><strong>Klik kanan</strong> file <code>dewahoster_deploy_public_html.zip</code> &gt; pilih <strong>"Extract All..." / "Ekstrak ke sini"</strong> (bisa pakai Windows Explorer, WinRAR, atau 7-Zip).</li>
                      <li>Hasil ekstrak berisi: <code>index.html</code>, folder <code>assets/</code>, <code>.htaccess</code>, dan folder <code>api/</code>.</li>
                      <li>Di cPanel File Manager (folder <code>public_html</code>), klik tombol <strong>Upload</strong> lalu unggah file-file hasil ekstrak tersebut secara langsung!</li>
                    </ol>
                  </div>

                  {/* Solusi 2 */}
                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">2</span>
                      Cek Tombol Pop-up "Extract File(s)" &amp; Tombol "Reload" di cPanel
                    </span>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      Di cPanel File Manager, saat klik kanan &gt; <strong>Extract</strong>, muncul jendela pop-up. Anda <strong>WAJIB mengklik tombol biru "Extract File(s)"</strong> di sudut kanan bawah jendela pop-up tersebut.
                    </p>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      Setelah jendela hasil extract ditutup, cPanel <strong>TIDAK otomatis me-refresh layar</strong>. Anda harus mengklik tombol <strong>"Reload" (Muat Ulang)</strong> di bilah menu paling atas cPanel File Manager agar file yang diekstrak muncul.
                    </p>
                  </div>

                  {/* Solusi 3 */}
                  <div className="p-3 bg-white rounded-xl border border-amber-200">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] flex items-center justify-center font-bold">3</span>
                      Buat File index.html Langsung di cPanel (+ File)
                    </span>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      Di cPanel File Manager (folder <code>public_html</code>), klik tombol <strong>+ File</strong> di pojok kiri atas, beri nama <code>index.html</code>. Lalu klik kanan file tersebut &gt; <strong>Edit</strong> &gt; salin kode di bawah ini lalu Paste dan klik Simpan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Opsi Unduh File index.html Secara Terpisah */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">
                      Atau Unduh File index.html Produksi Saja
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Jika Anda ingin membuat atau mengunggah file <code>index.html</code> secara mandiri di File Manager cPanel.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyIndexHtml}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700 text-xs"
                    >
                      {copiedIndexHtml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedIndexHtml ? 'Tersalin!' : 'Salin Kode'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadIndexHtml}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh index.html
                    </button>
                  </div>
                </div>

                {/* Struktur Folder Visual */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-800 text-xs block">
                    📁 Penempatan yang Benar di File Manager Dewa Hoster:
                  </span>
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg font-mono text-[11px] text-slate-200 space-y-1">
                    <div className="text-sky-400 font-bold">/home/minkoti2/public_html/</div>
                    <div className="pl-4 text-emerald-400 font-semibold">├── index.html &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &larr; (Tepat di sini! BUKAN di dalam folder dist/)</div>
                    <div className="pl-4 text-amber-300 font-semibold">├── .htaccess &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &larr; (Mencegah 404 pada LiteSpeed)</div>
                    <div className="pl-4 text-slate-300">├── assets/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &larr; (Folder berisi file JS &amp; CSS dari folder dist/assets)</div>
                    <div className="pl-4 text-purple-300 font-semibold">└── api/</div>
                    <div className="pl-8 text-purple-300">└── api.php &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &larr; (File REST API ke MySQL Dewa Hoster)</div>
                  </div>
                </div>

                {/* Code Preview */}
                <div className="bg-slate-950 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 custom-scrollbar leading-relaxed">
                  <pre>{PRODUCTION_INDEX_HTML}</pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'htaccess' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    File Konfigurasi .htaccess (Solusi Error 404 Not Found)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    File ini wajib ditaruh di folder <code>public_html/.htaccess</code> di hosting Dewa Hoster.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyHtaccess}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium text-slate-700"
                  >
                    {copiedHtaccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedHtaccess ? 'Tersalin' : 'Salin .htaccess'}
                  </button>
                  <button
                    onClick={handleDownloadHtaccess}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh .htaccess
                  </button>
                </div>
              </div>

              {/* Diagram Struktur Folder di public_html */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 text-xs block">
                  📁 Struktur Folder yang Benar di cPanel Dewa Hoster (File Manager):
                </span>
                <div className="bg-white border border-slate-300 p-3 rounded-lg font-mono text-[11px] text-slate-800 space-y-1">
                  <div className="text-blue-700 font-bold">/home/minkoti2/public_html/</div>
                  <div className="pl-4 text-emerald-700 font-semibold">├── index.html &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &larr; (File utama web, JANGAN di dalam folder dist/)</div>
                  <div className="pl-4 text-amber-700 font-semibold">├── .htaccess &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &larr; (Mencegah error 404 pada LiteSpeed/Apache)</div>
                  <div className="pl-4 text-slate-600">├── assets/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &larr; (Folder file Javascript &amp; CSS)</div>
                  <div className="pl-4 text-purple-700 font-semibold">└── api/</div>
                  <div className="pl-8 text-purple-700">└── api.php &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &larr; (File REST API MySQL)</div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tip: Jika Anda mengupload file zip build, ekstrak zip tersebut, lalu buka folder <code>dist</code>, pilih semua file, dan <strong>Move</strong> (pindahkan) keluar langsung ke dalam <code>public_html/</code>.
                </p>
              </div>

              <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-72 custom-scrollbar leading-relaxed">
                <pre>{DEWA_HOSTER_HTACCESS}</pre>
              </div>
            </div>
          )}

          {activeTab === 'connect' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                Masukkan URL API hosting Dewa Hoster Anda untuk menguji koneksi langsung dan menyimpan laporan secara realtime ke database MySQL terenkripsi.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    URL API Endpoint di Dewa Hoster
                  </label>
                  <input
                    type="url"
                    placeholder="https://namadomainanda.com/api/api.php"
                    value={endpointUrl}
                    onChange={(e) => setEndpointUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Contoh: <code>https://laporanguru.sch.id/api/api.php</code>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nama Database MySQL
                  </label>
                  <input
                    type="text"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    placeholder="u12345_laporanguru"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kunci Enkripsi AES-256 (Passphrase)
                  </label>
                  <input
                    type="text"
                    value={encKey}
                    onChange={(e) => setEncKey(e.target.value)}
                    placeholder="KunciRahasiaGuru123!"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Status Message */}
              {testStatus.type !== 'idle' && (
                <div
                  className={`p-3 rounded-lg border flex items-center gap-2 text-xs ${
                    testStatus.type === 'loading'
                      ? 'bg-slate-100 border-slate-300 text-slate-700'
                      : testStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {testStatus.type === 'loading' && <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />}
                  {testStatus.type === 'success' && <Check className="w-4 h-4 text-emerald-600" />}
                  {testStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{testStatus.message}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleExportJsonBackup}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition"
                  title="Unduh backup data dalam format JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  Backup JSON Offline
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Uji Koneksi
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncToRemote}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Simpan ke MySQL Dewa Hoster
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Dewa Hoster cPanel MySQL Ready &bull; AES-256 Encrypted
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
