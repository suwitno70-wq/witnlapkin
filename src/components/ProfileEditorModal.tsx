import React, { useState } from 'react';
import { User, Award, Building, FileText, Check, X, MapPin, Calendar } from 'lucide-react';
import { ReportConfig, SupervisorProfile, TeacherProfile } from '../types';

interface ProfileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ReportConfig;
  teacher: TeacherProfile;
  supervisor: SupervisorProfile;
  onSave: (
    newConfig: ReportConfig,
    newTeacher: TeacherProfile,
    newSupervisor: SupervisorProfile
  ) => void;
}

export const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({
  isOpen,
  onClose,
  config,
  teacher,
  supervisor,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'teacher' | 'supervisor' | 'config'>('teacher');

  // Teacher states
  const [tName, setTName] = useState(teacher.name);
  const [tNip, setTNip] = useState(teacher.nip);
  const [tNuptk, setTNuptk] = useState(teacher.nuptk || '');
  const [tRank, setTRank] = useState(teacher.rank || '');
  const [tPos, setTPos] = useState(teacher.position);
  const [tSubject, setTSubject] = useState(teacher.subject || '');
  const [tUnit, setTUnit] = useState(teacher.unit);

  // Supervisor states
  const [sName, setSName] = useState(supervisor.name);
  const [sNip, setSNip] = useState(supervisor.nip);
  const [sRank, setSRank] = useState(supervisor.rank || '');
  const [sPos, setSPos] = useState(supervisor.position);
  const [sUnit, setSUnit] = useState(supervisor.unit || '');
  const [sCity, setSCity] = useState(supervisor.signingCity || '');
  const [sDate, setSDate] = useState(supervisor.signingDate || '');

  // Config states
  const [monthName, setMonthName] = useState(config.monthName);
  const [year, setYear] = useState(config.year);
  const [reg1, setReg1] = useState(config.lampiran1RegHeader);
  const [reg2, setReg2] = useState(config.lampiran2RegHeader);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      {
        ...config,
        monthName,
        year: Number(year),
        lampiran1RegHeader: reg1,
        lampiran2RegHeader: reg2,
      },
      {
        ...teacher,
        name: tName,
        nip: tNip,
        nuptk: tNuptk,
        rank: tRank,
        position: tPos,
        subject: tSubject,
        unit: tUnit,
      },
      {
        ...supervisor,
        name: sName,
        nip: sNip,
        rank: sRank,
        position: sPos,
        unit: sUnit,
        signingCity: sCity,
        signingDate: sDate,
      }
    );
    onClose();
  };

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pengaturan Identitas Guru &amp; Kepala
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sesuaikan data lengkap guru, kepala madrasah/sekolah, dan pengesahan laporan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/30 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('teacher')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition ${
              activeTab === 'teacher'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Identitas Guru
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('supervisor')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition ${
              activeTab === 'supervisor'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Identitas Kepala
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Bulan &amp; Regulasi SE
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'teacher' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Lengkap Guru (beserta Gelar)
                </label>
                <input
                  type="text"
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    NIP Guru
                  </label>
                  <input
                    type="text"
                    value={tNip}
                    onChange={(e) => setTNip(e.target.value)}
                    placeholder="19930221 201903 1 006 atau -"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    NUPTK
                  </label>
                  <input
                    type="text"
                    value={tNuptk}
                    onChange={(e) => setTNuptk(e.target.value)}
                    placeholder="Contoh: 8455771672130082"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pangkat / Golongan Ruang
                  </label>
                  <input
                    type="text"
                    value={tRank}
                    onChange={(e) => setTRank(e.target.value)}
                    placeholder="Penata Muda / III/a"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    value={tSubject}
                    onChange={(e) => setTSubject(e.target.value)}
                    placeholder="PJOK"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jabatan Guru
                </label>
                <input
                  type="text"
                  value={tPos}
                  onChange={(e) => setTPos(e.target.value)}
                  placeholder="Guru Pertama Bidang Studi Penjaskes / Guru Mapel PJOK MTsN 1 Kotim"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unit Kerja
                </label>
                <input
                  type="text"
                  value={tUnit}
                  onChange={(e) => setTUnit(e.target.value)}
                  placeholder="Kemenag Agama Kab.Kotim / MIN 1 Kotawaringin Timur"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>
          )}

          {activeTab === 'supervisor' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Kepala Madrasah / Sekolah (beserta Gelar)
                </label>
                <input
                  type="text"
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    NIP Kepala
                  </label>
                  <input
                    type="text"
                    value={sNip}
                    onChange={(e) => setSNip(e.target.value)}
                    placeholder="196808061994021004"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pangkat / Golongan Kepala
                  </label>
                  <input
                    type="text"
                    value={sRank}
                    onChange={(e) => setSRank(e.target.value)}
                    placeholder="Pembina Tk. I / IV/b"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Jabatan Kepala
                </label>
                <input
                  type="text"
                  value={sPos}
                  onChange={(e) => setSPos(e.target.value)}
                  placeholder="Kepala MIN 1 Kotawaringin Timur"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kota Pengesahan
                  </label>
                  <input
                    type="text"
                    value={sCity}
                    onChange={(e) => setSCity(e.target.value)}
                    placeholder="Sampit"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tanggal Pengesahan
                  </label>
                  <input
                    type="text"
                    value={sDate}
                    onChange={(e) => setSDate(e.target.value)}
                    placeholder="30 September 2026"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Bulan Laporan
                  </label>
                  <select
                    value={monthName}
                    onChange={(e) => setMonthName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tahun
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 2026)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Header Regulasi Kotak Lampiran I
                </label>
                <textarea
                  rows={3}
                  value={reg1}
                  onChange={(e) => setReg1(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Header Regulasi Kotak Lampiran II
                </label>
                <textarea
                  rows={2}
                  value={reg2}
                  onChange={(e) => setReg2(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono text-[11px]"
                />
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
            >
              <Check className="w-4 h-4" />
              Simpan Identitas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
