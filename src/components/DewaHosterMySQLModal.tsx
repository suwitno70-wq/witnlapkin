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
  AlertCircle
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { MYSQL_SCHEMA_SQL, DEWA_HOSTER_PHP_API } from '../utils/dewaHosterSql';
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
  const [activeTab, setActiveTab] = useState<'guide' | 'sql' | 'api' | 'connect'>('guide');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedApi, setCopiedApi] = useState(false);
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
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition ${
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
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition ${
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
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition ${
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
            className={`py-3 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition ${
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
              {/* Solusi Error #1044 Box */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950 text-xs">
                    Solusi Error #1044 ("Access denied for user to database 'db_laporan_guru'")
                  </h4>
                  <p className="text-amber-800 text-[11px] mt-1 leading-relaxed">
                    Penyebab error tersebut: Pada shared hosting cPanel Dewa Hoster, akun hosting tidak diizinkan membuat database baru lewat query SQL (karena nama database sudah di-generate cPanel dengan format <code>minkoti2_nama</code>).
                  </p>
                  <p className="text-amber-900 text-[11px] mt-1 font-semibold">
                    Cara Mengatasinya (Sangat Mudah):
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
