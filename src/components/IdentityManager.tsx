import React, { useState } from 'react';
import {
  User,
  Award,
  Building2,
  Calendar,
  PenTool,
  Check,
  Sparkles,
  ShieldCheck,
  FileBadge,
  MapPin,
  Clock,
  Briefcase
} from 'lucide-react';
import { ReportConfig, SupervisorProfile, TeacherProfile } from '../types';

interface IdentityManagerProps {
  config: ReportConfig;
  teacher: TeacherProfile;
  supervisor: SupervisorProfile;
  onUpdateTeacher: (teacher: TeacherProfile) => void;
  onUpdateSupervisor: (supervisor: SupervisorProfile) => void;
  onUpdateConfig: (config: ReportConfig) => void;
  onOpenTeacherSignature: () => void;
  onOpenSupervisorSignature: () => void;
}

export const IdentityManager: React.FC<IdentityManagerProps> = ({
  config,
  teacher,
  supervisor,
  onUpdateTeacher,
  onUpdateSupervisor,
  onUpdateConfig,
  onOpenTeacherSignature,
  onOpenSupervisorSignature,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'teacher' | 'supervisor' | 'periode'>('teacher');

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Presets for quick autofill
  const handleApplyPreset = (type: 'pns' | 'pppk' | 'honorer') => {
    if (type === 'pns') {
      onUpdateTeacher({
        ...teacher,
        rank: 'Penata Muda / III/a',
        position: 'Guru Pertama Bidang Studi Penjaskes',
      });
    } else if (type === 'pppk') {
      onUpdateTeacher({
        ...teacher,
        rank: 'Ahli Pertama / Golongan IX',
        position: 'Guru Pertama Penjaskes PPPK',
      });
    } else if (type === 'honorer') {
      onUpdateTeacher({
        ...teacher,
        nip: '-',
        rank: 'Guru Honorer / GTT',
        position: 'Guru Bidang Studi Penjaskes',
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <User className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Pengelolaan Identitas Guru, Kepala &amp; Regulasi
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data identitas ini langsung ditampilkan secara presisi pada kop identitas dan kolom tanda tangan Lampiran 1 &amp; Lampiran 2 serta ekspor Word.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveSubTab('teacher')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeSubTab === 'teacher'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Identitas Guru
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('supervisor')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeSubTab === 'supervisor'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Identitas Kepala
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('periode')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeSubTab === 'periode'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Periode &amp; Regulasi
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: IDENTITAS GURU */}
      {activeSubTab === 'teacher' && (
        <div className="space-y-6">
          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs bg-blue-50/60 p-3 rounded-xl border border-blue-100">
            <span className="text-[11px] font-semibold text-blue-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Template Status Guru:
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('pns')}
              className="px-2.5 py-1 bg-white border border-blue-200 hover:border-blue-400 rounded-md text-slate-700 font-medium"
            >
              Guru PNS (Golongan III)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('pppk')}
              className="px-2.5 py-1 bg-white border border-blue-200 hover:border-blue-400 rounded-md text-slate-700 font-medium"
            >
              Guru PPPK (Golongan IX)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('honorer')}
              className="px-2.5 py-1 bg-white border border-blue-200 hover:border-blue-400 rounded-md text-slate-700 font-medium"
            >
              Guru Non-PNS / Honorer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Guru (beserta Gelar Akademik)
              </label>
              <input
                type="text"
                value={teacher.name}
                onChange={(e) => onUpdateTeacher({ ...teacher, name: e.target.value })}
                placeholder="Contoh: ACHMAD NURICHSAN, S.Pd"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Ditampilkan di bagian atas dokumen dan di bawah tanda tangan kanan.
              </span>
            </div>

            {/* NIP */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIP (Nomor Induk Pegawai)
              </label>
              <input
                type="text"
                value={teacher.nip}
                onChange={(e) => onUpdateTeacher({ ...teacher, nip: e.target.value })}
                placeholder="19930221 201903 1 006 (atau '-' jika Non-PNS)"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Isi dengan 18 digit NIP atau tanda strip (-) jika bukan PNS.
              </span>
            </div>

            {/* NUPTK */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NUPTK (Nomor Unik Pendidik &amp; Tenaga Kependidikan)
              </label>
              <input
                type="text"
                value={teacher.nuptk || ''}
                onChange={(e) => onUpdateTeacher({ ...teacher, nuptk: e.target.value })}
                placeholder="Contoh: 8455771672130082"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
              />
            </div>

            {/* Pangkat / Golongan Ruang */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pangkat / Golongan Ruang
              </label>
              <input
                type="text"
                value={teacher.rank || ''}
                onChange={(e) => onUpdateTeacher({ ...teacher, rank: e.target.value })}
                placeholder="Contoh: Penata Muda / III/a atau Ahli Pertama / IX"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Jabatan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan Guru
              </label>
              <input
                type="text"
                value={teacher.position}
                onChange={(e) => onUpdateTeacher({ ...teacher, position: e.target.value })}
                placeholder="Guru Pertama Bidang Studi Penjaskes / Guru Mapel PJOK MTsN 1 Kotim"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Mata Pelajaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Pelajaran yang Diampu
              </label>
              <input
                type="text"
                value={teacher.subject || ''}
                onChange={(e) => onUpdateTeacher({ ...teacher, subject: e.target.value })}
                placeholder="Contoh: PJOK / Pendidikan Jasmani Olahraga dan Kesehatan"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Unit Kerja */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Kerja / Satuan Pendidikan
              </label>
              <input
                type="text"
                value={teacher.unit}
                onChange={(e) => onUpdateTeacher({ ...teacher, unit: e.target.value })}
                placeholder="Contoh: Kemenag Agama Kab.Kotim / MIN 1 Kotawaringin Timur"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Tanda Tangan Guru Box */}
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-12 bg-white border border-slate-300 rounded-lg flex items-center justify-center p-1 overflow-hidden shadow-xs">
                {teacher.signatureImage ? (
                  <img
                    src={teacher.signatureImage}
                    alt="TTD Guru"
                    className="max-h-full max-w-full object-contain filter contrast-125"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Belum ada</span>
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Tanda Tangan Guru Bidang Studi
                </div>
                <div className="text-[11px] text-slate-500">
                  {teacher.signatureImage ? 'Tanda tangan aktif terpasang' : 'Tanda tangan belum diatur'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenTeacherSignature}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-xs transition"
            >
              <PenTool className="w-3.5 h-3.5 text-blue-600" />
              Ganti / Gores Tanda Tangan Guru
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: IDENTITAS KEPALA */}
      {activeSubTab === 'supervisor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Kepala */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kepala Madrasah / Sekolah (beserta Gelar)
              </label>
              <input
                type="text"
                value={supervisor.name}
                onChange={(e) => onUpdateSupervisor({ ...supervisor, name: e.target.value })}
                placeholder="Contoh: Drs. Aceng Abudin, MM"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Ditampilkan di bagian kiri bawah dokumen tanda tangan.
              </span>
            </div>

            {/* NIP Kepala */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIP Kepala
              </label>
              <input
                type="text"
                value={supervisor.nip}
                onChange={(e) => onUpdateSupervisor({ ...supervisor, nip: e.target.value })}
                placeholder="Contoh: 196808061994021004"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
              />
            </div>

            {/* Jabatan Kepala */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan Kepala
              </label>
              <input
                type="text"
                value={supervisor.position}
                onChange={(e) => onUpdateSupervisor({ ...supervisor, position: e.target.value })}
                placeholder="Contoh: Kepala MIN 1 Kotawaringin Timur"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Pangkat / Golongan Kepala */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pangkat / Golongan Ruang Kepala
              </label>
              <input
                type="text"
                value={supervisor.rank || ''}
                onChange={(e) => onUpdateSupervisor({ ...supervisor, rank: e.target.value })}
                placeholder="Contoh: Pembina Tk. I / IV/b"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Kota Penandatanganan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tempat / Kota Pengesahan Laporan
              </label>
              <input
                type="text"
                value={supervisor.signingCity || ''}
                onChange={(e) => onUpdateSupervisor({ ...supervisor, signingCity: e.target.value })}
                placeholder="Contoh: Sampit / Kotawaringin Timur"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Tanggal Penandatanganan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pengesahan Laporan
              </label>
              <input
                type="text"
                value={supervisor.signingDate || ''}
                onChange={(e) => onUpdateSupervisor({ ...supervisor, signingDate: e.target.value })}
                placeholder="Contoh: 30 September 2026"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Instansi Induk */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instansi / Kantor Wilayah
              </label>
              <input
                type="text"
                value={supervisor.unit || ''}
                onChange={(e) => onUpdateSupervisor({ ...supervisor, unit: e.target.value })}
                placeholder="Contoh: Kantor Kementerian Agama Kabupaten Kotawaringin Timur"
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Tanda Tangan Kepala Box */}
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-12 bg-white border border-slate-300 rounded-lg flex items-center justify-center p-1 overflow-hidden shadow-xs">
                {supervisor.signatureImage ? (
                  <img
                    src={supervisor.signatureImage}
                    alt="TTD Kepala"
                    className="max-h-full max-w-full object-contain filter contrast-125"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Belum ada</span>
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Tanda Tangan Kepala Madrasah / Sekolah
                </div>
                <div className="text-[11px] text-slate-500">
                  {supervisor.signatureImage ? 'Tanda tangan aktif terpasang' : 'Tanda tangan belum diatur'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenSupervisorSignature}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-xs transition"
            >
              <PenTool className="w-3.5 h-3.5 text-blue-600" />
              Ganti / Gores Tanda Tangan Kepala
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PERIODE & REGULASI */}
      {activeSubTab === 'periode' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bulan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bulan Pelaporan Kinerja
              </label>
              <select
                value={config.monthName}
                onChange={(e) => onUpdateConfig({ ...config, monthName: e.target.value })}
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Tahun */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tahun
              </label>
              <input
                type="number"
                value={config.year}
                onChange={(e) => onUpdateConfig({ ...config, year: parseInt(e.target.value) || 2026 })}
                className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
              />
            </div>

            {/* Regulasi Lampiran I */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Header Kotak Regulasi Lampiran I
              </label>
              <textarea
                rows={3}
                value={config.lampiran1RegHeader}
                onChange={(e) => onUpdateConfig({ ...config, lampiran1RegHeader: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
              />
            </div>

            {/* Regulasi Lampiran II */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Header Kotak Regulasi Lampiran II
              </label>
              <textarea
                rows={3}
                value={config.lampiran2RegHeader}
                onChange={(e) => onUpdateConfig({ ...config, lampiran2RegHeader: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
