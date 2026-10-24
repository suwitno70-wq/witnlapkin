import React, { useState } from 'react';
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
} from 'lucide-react';
import { ActivityCategory, DailyActivityItem, ReportConfig } from '../types';
import { ConfirmModal } from './ConfirmModal';

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
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formDay, setFormDay] = useState<string>('Senin');
  const [formDate, setFormDate] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ActivityCategory>('Mengajar');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formProof, setFormProof] = useState<string>('Dokumen');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Deletion modal state (replaces blocked window.confirm)
  const [itemToDelete, setItemToDelete] = useState<DailyActivityItem | null>(null);
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);
  const [isConfirmGenerateOpen, setIsConfirmGenerateOpen] = useState(false);

  // Selection state for batch actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];

  const filteredActivities = activities.filter((act) => {
    if (filterCategory === 'all') return true;
    return act.category === filterCategory;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormDay('Senin');
    setFormDate('');
    setFormCategory('Mengajar');
    setFormDesc('');
    setFormProof('Dokumen');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (act: DailyActivityItem) => {
    setEditingId(act.id);
    setFormDay(act.day);
    setFormDate(act.date);
    setFormCategory(act.category);
    setFormDesc(act.taskDescription);
    setFormProof(act.documentProof || 'Dokumen');
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

      {/* Filter and selection actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              filterCategory === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({activities.length})
          </button>
          <button
            onClick={() => setFilterCategory('Mengajar')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              filterCategory === 'Mengajar'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            Mengajar
          </button>
          <button
            onClick={() => setFilterCategory('Kepanitiaan')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              filterCategory === 'Kepanitiaan'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-600'
            }`}
          >
            Kepanitiaan
          </button>
          <button
            onClick={() => setFilterCategory('Kegiatan Lainnya')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              filterCategory === 'Kegiatan Lainnya'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-600'
            }`}
          >
            Kegiatan Lainnya
          </button>
        </div>

        {/* Batch selection button */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg text-xs animate-in fade-in">
            <span className="text-rose-800 font-medium">
              {selectedIds.length} item dipilih
            </span>
            <button
              onClick={handleDeleteSelected}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline flex items-center gap-1 ml-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Terpilih
            </button>
          </div>
        )}
      </div>

      {/* Activities Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-xs text-left border-collapse">
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
                      Belum ada kegiatan harian yang tercatat.
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
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                          act.category === 'Mengajar'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : act.category === 'Kepanitiaan'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
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
                          title="Hapus kegiatan ini"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editingId ? 'Edit Kegiatan Harian' : 'Tambah Kegiatan Harian (Lampiran 1)'}
            </h3>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hari
                  </label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {daysOfWeek.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tanggal (DD/MM/YYYY)
                  </label>
                  <input
                    type="text"
                    placeholder="01/09/2026"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jenis Kegiatan
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
                  Template Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Mengajar');
                      setFormDesc('Mengajar PJOK kelas IVR2 & IVR1');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + Mengajar Kelas IV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Mengajar');
                      setFormDesc('BDR Mengajar PJOK kelas VR2 & VIR3');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + BDR Mengajar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Kegiatan Lainnya');
                      setFormDesc('Bertugas sebagai guru piket');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + Guru Piket
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Kegiatan Lainnya');
                      setFormDesc('Mendampingi Sholat Dzuhur Berjamaah');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + Sholat Dzuhur
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Kepanitiaan');
                      setFormDesc('Acara Maulid Nabi di MIN 1 Kotim');
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + Panitia Maulid
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('Kegiatan Lainnya');
                      setFormDesc(`Membuat laporan Bulanan ${config.monthName} ${config.year}`);
                    }}
                    className="text-[10px] bg-white border border-slate-300 hover:border-blue-500 px-2 py-1 rounded text-slate-700"
                  >
                    + Laporan Bulanan
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  {editingId ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
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
