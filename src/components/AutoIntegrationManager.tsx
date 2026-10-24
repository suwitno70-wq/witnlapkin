import React, { useState } from 'react';
import {
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Link2,
  BookOpen,
  Users,
  Compass,
  Sparkles,
  Layers,
  Info,
  Calendar,
  Check
} from 'lucide-react';
import { ActivityCategory, DailyActivityItem, ReportConfig, SummaryActivityItem, TeacherProfile } from '../types';
import {
  countKeywordOccurrences,
  calculateTeachingSessions,
  autoGenerateLampiran2FromDaily,
  calculateReportStats,
} from '../utils/calculator';
import { ConfirmModal } from './ConfirmModal';

interface AutoIntegrationManagerProps {
  config: ReportConfig;
  teacher: TeacherProfile;
  dailyActivities: DailyActivityItem[];
  summaryActivities: SummaryActivityItem[];
  onUpdateSummaries: (summaries: SummaryActivityItem[]) => void;
  onTriggerSync: () => void;
}

export const AutoIntegrationManager: React.FC<AutoIntegrationManagerProps> = ({
  config,
  teacher,
  dailyActivities,
  summaryActivities,
  onUpdateSummaries,
  onTriggerSync,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summaryToDelete, setSummaryToDelete] = useState<SummaryActivityItem | null>(null);
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);
  const [isAutoGenerateOpen, setIsAutoGenerateOpen] = useState(false);

  // Form
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('Mengajar');
  const [matchKeyword, setMatchKeyword] = useState('');
  const [volume, setVolume] = useState<number>(1);
  const [unit, setUnit] = useState('Kegiatan');
  const [isAutoCounted, setIsAutoCounted] = useState(true);

  // Statistics
  const stats = calculateReportStats(dailyActivities, summaryActivities);

  const handleOpenAdd = () => {
    setEditingId(null);
    setTaskName('');
    setCategory('Mengajar');
    setMatchKeyword('');
    setVolume(1);
    setUnit('Kegiatan');
    setIsAutoCounted(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SummaryActivityItem) => {
    setEditingId(item.id);
    setTaskName(item.taskName);
    setCategory(item.category || 'Mengajar');
    setMatchKeyword(item.matchKeyword || '');
    setVolume(item.volume);
    setUnit(item.unit || 'Kegiatan');
    setIsAutoCounted(item.isAutoCounted !== false);
    setIsModalOpen(true);
  };

  const handleSaveSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    if (editingId) {
      const updated = summaryActivities.map((s) =>
        s.id === editingId
          ? {
              ...s,
              taskName,
              category,
              matchKeyword,
              volume: Number(volume),
              unit,
              isAutoCounted,
            }
          : s
      );
      onUpdateSummaries(updated);
    } else {
      const newSummary: SummaryActivityItem = {
        id: `sum-${Date.now()}`,
        taskName,
        category,
        matchKeyword,
        volume: Number(volume),
        unit,
        documentProof: 'Dokumen',
        isAutoCounted,
      };
      onUpdateSummaries([...summaryActivities, newSummary]);
    }

    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (!summaryToDelete) return;
    const updated = summaryActivities.filter((s) => s.id !== summaryToDelete.id);
    onUpdateSummaries(updated);
    setSummaryToDelete(null);
  };

  const confirmClearAll = () => {
    onUpdateSummaries([]);
    setIsClearAllOpen(false);
  };

  // Full intelligent auto-generation of Lampiran 2 from Lampiran 1
  const confirmAutoGenerate = () => {
    const generated = autoGenerateLampiran2FromDaily(dailyActivities, config, teacher);
    onUpdateSummaries(generated);
    setIsAutoGenerateOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">
      {/* Top Banner explaining the direct integration */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Link2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Integrasi Otomatis Lampiran 1 &rarr; Lampiran 2
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Auto-Sync Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Jumlah dan volume kegiatan dihitung secara otomatis dari kegiatan harian berdasarkan jenis kegiatan (Mengajar, Kepanitiaan, Kegiatan Lainnya).
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {dailyActivities.length > 0 && (
            <button
              onClick={() => setIsAutoGenerateOpen(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
              title="Analisis Lampiran 1 dan buat baris Lampiran 2 secara otomatis"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              Auto-Generate Lampiran 2
            </button>
          )}

          <button
            onClick={onTriggerSync}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
            title="Hitung ulang otomatis volume seluruh baris Lampiran 2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Hitung Ulang Volume
          </button>

          <button
            onClick={handleOpenAdd}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Baris
          </button>

          {summaryActivities.length > 0 && (
            <button
              onClick={() => setIsClearAllOpen(true)}
              type="button"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition"
              title="Kosongkan seluruh baris Lampiran 2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Statistical Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Hari Kerja */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Hari Kerja (Lampiran 1)</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats.totalDays}{' '}
            <span className="text-xs font-normal text-slate-500">Hari</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Jadwal kegiatan harian aktif
          </div>
        </div>

        {/* 1. Mengajar Card */}
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
          <div className="flex items-center justify-between text-blue-900 mb-1">
            <span className="text-[11px] font-semibold">1. Mengajar</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700 font-mono">
            {stats.totalTeachingSessions}{' '}
            <span className="text-xs font-normal text-blue-600">Kegiatan / Jam</span>
          </div>
          <div className="text-[10px] text-blue-600/90 mt-1">
            Dihitung dari kelas tunggal &amp; paralel (&amp;)
          </div>
        </div>

        {/* 2. Kepanitiaan Card */}
        <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50">
          <div className="flex items-center justify-between text-purple-900 mb-1">
            <span className="text-[11px] font-semibold">2. Kepanitiaan</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700 font-mono">
            {stats.kepanitiaanCount}{' '}
            <span className="text-xs font-normal text-purple-600">Kegiatan</span>
          </div>
          <div className="text-[10px] text-purple-600/90 mt-1">
            Panitia PHBI, Ujian, dll.
          </div>
        </div>

        {/* 3. Kegiatan Lainnya Card */}
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center justify-between text-emerald-900 mb-1">
            <span className="text-[11px] font-semibold">3. Kegiatan Lainnya</span>
            <Compass className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {stats.lainnyaCount}{' '}
            <span className="text-xs font-normal text-emerald-600">Kegiatan</span>
          </div>
          <div className="text-[10px] text-emerald-600/90 mt-1">
            Piket, Sholat, Laporan, dll.
          </div>
        </div>
      </div>

      {/* Info notice box */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Bagaimana Integrasi Bekerja:</strong> Tabel di bawah merepresentasikan isi resmi <strong>Lampiran 2</strong>.
          Kolom <em>Volume</em> terhubung secara dinamis dengan kegiatan harian di Lampiran 1. Jika Anda menambah atau mengubah kegiatan harian, angka volume akan langsung ter-update secara otomatis tanpa perlu input ganda.
        </div>
      </div>

      {/* Summary Table Configuration */}
      <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">No</th>
              <th className="py-2.5 px-4">Uraian Tugas / Kegiatan (Lampiran 2)</th>
              <th className="py-2.5 px-3 w-32">Jenis Kegiatan</th>
              <th className="py-2.5 px-3 w-36">Kunci Pencocokan</th>
              <th className="py-2.5 px-3 w-36 text-center">Volume Terhitung</th>
              <th className="py-2.5 px-3 w-28 text-center">Metode</th>
              <th className="py-2.5 px-3 w-20 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {summaryActivities.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <div className="max-w-md mx-auto space-y-3">
                    <p className="text-xs text-slate-600 font-medium">
                      Baris Lampiran 2 saat ini kosong.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {dailyActivities.length > 0 ? (
                        <button
                          onClick={confirmAutoGenerate}
                          className="px-3.5 py-1.5 text-xs bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 shadow-sm transition flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Otomatis Buat dari {dailyActivities.length} Kegiatan Harian
                        </button>
                      ) : (
                        <button
                          onClick={handleOpenAdd}
                          className="px-3.5 py-1.5 text-xs bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          + Tambah Baris Manual
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              summaryActivities.map((sum, index) => (
                <tr key={sum.id} className="hover:bg-slate-50/80 transition group">
                  <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                    {index + 1}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">
                    {sum.taskName}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                        sum.category === 'Mengajar'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : sum.category === 'Kepanitiaan'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {sum.category || 'Umum'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {sum.matchKeyword ? `"${sum.matchKeyword}"` : <span className="text-slate-400 italic">Otomatis</span>}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-800 rounded-md border border-indigo-200 font-mono text-xs">
                      {sum.volume} {sum.unit || 'Kegiatan'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {sum.isAutoCounted !== false ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Otomatis
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Manual
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sum)}
                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                        title="Edit baris atau rumus integrasi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummaryToDelete(sum)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit Summary Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editingId ? 'Edit Baris Capaian (Lampiran 2)' : 'Tambah Baris Capaian (Lampiran 2)'}
            </h3>

            <form onSubmit={handleSaveSummary} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Uraian Tugas / Kegiatan
                </label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Contoh: Proses Belajar Mengajar"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Jenis Kegiatan
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Mengajar">Mengajar</option>
                    <option value="Kepanitiaan">Kepanitiaan</option>
                    <option value="Kegiatan Lainnya">Kegiatan Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kata Kunci Pencocokan
                  </label>
                  <input
                    type="text"
                    value={matchKeyword}
                    onChange={(e) => setMatchKeyword(e.target.value)}
                    placeholder="Contoh: Mengajar, piket, maulid"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <input
                  type="checkbox"
                  id="autoCountCheckbox"
                  checked={isAutoCounted}
                  onChange={(e) => setIsAutoCounted(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="autoCountCheckbox" className="text-xs text-slate-700 cursor-pointer">
                  <strong>Hitung Otomatis</strong> dari kegiatan harian di Lampiran 1
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Volume
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={volume}
                    disabled={isAutoCounted}
                    onChange={(e) => setVolume(parseInt(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  {isAutoCounted && (
                    <span className="text-[10px] text-emerald-600 mt-1 block">
                      *Dihitung otomatis saat disimpan
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Kegiatan"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal for Auto-Generate */}
      <ConfirmModal
        isOpen={isAutoGenerateOpen}
        title="Generate Otomatis Baris Lampiran 2?"
        message={`Sistem akan menganalisis ${dailyActivities.length} kegiatan harian dan mengelompokkannya secara otomatis ke dalam baris rekapitulasi Lampiran 2 sesuai jenis kegiatan (Mengajar, Kepanitiaan, dan Kegiatan Lainnya).`}
        confirmText="Generate Otomatis"
        cancelText="Batal"
        isDestructive={false}
        onConfirm={confirmAutoGenerate}
        onCancel={() => setIsAutoGenerateOpen(false)}
      />

      {/* Confirm Modal for Single Summary Delete */}
      <ConfirmModal
        isOpen={summaryToDelete !== null}
        title="Hapus Baris Lampiran 2?"
        message={`Apakah Anda yakin ingin menghapus baris "${summaryToDelete?.taskName}" dari Lampiran 2?`}
        confirmText="Hapus Baris"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setSummaryToDelete(null)}
      />

      {/* Confirm Modal for Clear All Summary Rows */}
      <ConfirmModal
        isOpen={isClearAllOpen}
        title="Kosongkan Semua Baris Lampiran 2?"
        message="Semua baris capaian di Lampiran 2 akan dikosongkan. Anda dapat membuat ulang secara otomatis dari kegiatan harian kapan saja."
        confirmText="Kosongkan Baris"
        cancelText="Batal"
        isDestructive={true}
        onConfirm={confirmClearAll}
        onCancel={() => setIsClearAllOpen(false)}
      />
    </div>
  );
};
