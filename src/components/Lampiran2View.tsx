import React from 'react';
import { ReportConfig, SummaryActivityItem, SupervisorProfile, TeacherProfile } from '../types';

interface Lampiran2ViewProps {
  config: ReportConfig;
  teacher: TeacherProfile;
  supervisor: SupervisorProfile;
  summaries: SummaryActivityItem[];
  onOpenTeacherSignature?: () => void;
  onOpenSupervisorSignature?: () => void;
  isPrintMode?: boolean;
}

export const Lampiran2View: React.FC<Lampiran2ViewProps> = ({
  config,
  teacher,
  supervisor,
  summaries,
  onOpenTeacherSignature,
  onOpenSupervisorSignature,
  isPrintMode = false,
}) => {
  const totalVol = summaries.reduce((acc, curr) => acc + (Number(curr.volume) || 0), 0);

  return (
    <div
      className={`print-sheet bg-white text-black font-sans mx-auto transition-all ${
        isPrintMode
          ? 'w-full p-0 shadow-none'
          : 'max-w-4xl p-8 sm:p-12 shadow-lg border border-slate-200 rounded-sm'
      }`}
      style={{ minHeight: isPrintMode ? 'auto' : '1100px' }}
    >
      {/* Live sync badge in preview mode */}
      {!isPrintMode && (
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2 bg-emerald-50/70 border border-emerald-200 px-3 py-2 rounded-lg text-xs text-emerald-900">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Terintegrasi Langsung Otomatis:</span>
            <strong className="text-emerald-950 font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
              {totalVol} Kegiatan
            </strong>
          </div>
          <span className="text-[11px] text-emerald-700">
            {summaries.length} baris capaian terakumulasi
          </span>
        </div>
      )}

      {/* Top-Right Official Regulation Box */}
      <div className="flex justify-end mb-4">
        <div className="border border-black px-4 py-2 text-center text-xs font-serif leading-tight">
          <div className="font-bold">Lampiran II</div>
          <div>{config.lampiran2RegHeader.split('\n')[1] || 'Kep.Sekjen Kemenag Nomor 83 Tahun 2019'}</div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center font-bold text-sm tracking-wide mb-6 uppercase">
        <div className="leading-tight">LAPORAN CAPAIAN KINERJA BULANAN</div>
        <div className="leading-tight mt-1 capitalize">
          Bulan : {config.monthName} {config.year}
        </div>
      </div>

      {/* Identity Section */}
      <div className="mb-4 text-xs font-serif leading-relaxed">
        <div className="grid grid-cols-[90px_12px_1fr] items-center">
          <span className="font-medium">NAMA</span>
          <span>:</span>
          <span className="font-bold">{teacher.name}</span>
        </div>
        {teacher.nip && teacher.nip !== '-' && (
          <div className="grid grid-cols-[90px_12px_1fr] items-center">
            <span className="font-medium">NIP</span>
            <span>:</span>
            <span>{teacher.nip}</span>
          </div>
        )}
        <div className="grid grid-cols-[90px_12px_1fr] items-center">
          <span className="font-medium">JABATAN</span>
          <span>:</span>
          <span>{teacher.position}</span>
        </div>
        <div className="grid grid-cols-[90px_12px_1fr] items-center">
          <span className="font-medium">UNIT KERJA</span>
          <span>:</span>
          <span>{teacher.unit}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-black text-xs font-serif">
          <thead>
            <tr className="bg-slate-100/70 text-center font-bold">
              <th className="border border-black py-2 px-2 w-12">No</th>
              <th className="border border-black py-2 px-4 text-center">Uraian Tugas/Kegiatan</th>
              <th className="border border-black py-2 px-3 w-36 text-center">Volume</th>
              <th className="border border-black py-2 px-3 w-40 text-center">Bukti Dokumen</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((item, index) => (
              <tr key={item.id || index} className="align-middle hover:bg-slate-50/50">
                <td className="border border-black text-center py-2.5 px-2">{index + 1}</td>
                <td className="border border-black py-2.5 px-3 font-normal">{item.taskName}</td>
                <td className="border border-black text-center py-2.5 px-2 font-medium">
                  {item.volume} {item.unit || 'Kegiatan'}
                </td>
                <td className="border border-black text-center py-2.5 px-2">
                  {item.documentProof || 'Dokumen'}
                </td>
              </tr>
            ))}
            {summaries.length === 0 ? (
              <>
                <tr className="no-print">
                  <td colSpan={4} className="border border-black text-center py-6 text-slate-400 italic">
                    Belum ada baris capaian bulanan.
                    <br />
                    Buka tab <strong>"Integrasi Otomatis (Lampiran 2)"</strong> atau masukkan kegiatan di Lampiran 1 untuk sinkronisasi otomatis.
                  </td>
                </tr>
                {[1, 2, 3, 4].map((num) => (
                  <tr key={`blank-sum-${num}`} className="h-9">
                    <td className="border border-black text-center py-2.5 px-2 text-slate-300">{num}</td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                  </tr>
                ))}
              </>
            ) : (
              /* Blank decorative rows matching reference image style */
              [1, 2].map((_, i) => (
                <tr key={`blank-${i}`}>
                  <td className="border border-black py-3 text-center text-transparent">-</td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Signature Section - Precision Left & Right Alignment */}
      <div className="mt-12 pt-4">
        <div className="grid grid-cols-2 text-center text-xs font-serif">
          {/* Left: Supervisor / Kepala Sekolah */}
          <div className="flex flex-col items-center">
            <div>Mengetahui</div>
            <div className="font-medium mb-1">{supervisor.position}</div>

            {/* Signature Area */}
            <div
              className={`h-24 w-48 flex items-center justify-center my-1 relative group ${
                !isPrintMode ? 'cursor-pointer hover:bg-slate-50 border border-transparent hover:border-dashed hover:border-slate-300 rounded' : ''
              }`}
              onClick={!isPrintMode ? onOpenSupervisorSignature : undefined}
              title={!isPrintMode ? 'Klik untuk mengganti tanda tangan Kepala' : undefined}
            >
              {supervisor.signatureImage ? (
                <img
                  src={supervisor.signatureImage}
                  alt="Tanda Tangan Kepala"
                  className="max-h-20 max-w-full object-contain filter contrast-125"
                />
              ) : (
                <div className="text-slate-400 italic text-[10px] no-print">
                  (Klik untuk tanda tangan)
                </div>
              )}
            </div>

            <div className="font-bold underline text-sm tracking-wide">
              {supervisor.name}
            </div>
            <div>NIP. {supervisor.nip}</div>
          </div>

          {/* Right: Teacher / Guru */}
          <div className="flex flex-col items-center">
            <div>Guru Bidang Studi</div>
            <div className="font-medium mb-1 invisible select-none">Placeholder</div>

            {/* Signature Area */}
            <div
              className={`h-24 w-48 flex items-center justify-center my-1 relative group ${
                !isPrintMode ? 'cursor-pointer hover:bg-slate-50 border border-transparent hover:border-dashed hover:border-slate-300 rounded' : ''
              }`}
              onClick={!isPrintMode ? onOpenTeacherSignature : undefined}
              title={!isPrintMode ? 'Klik untuk mengganti tanda tangan Guru' : undefined}
            >
              {teacher.signatureImage ? (
                <img
                  src={teacher.signatureImage}
                  alt="Tanda Tangan Guru"
                  className="max-h-20 max-w-full object-contain filter contrast-125"
                />
              ) : (
                <div className="text-slate-400 italic text-[10px] no-print">
                  (Klik untuk tanda tangan)
                </div>
              )}
            </div>

            <div className="font-bold uppercase underline text-sm tracking-wide">
              {teacher.name}
            </div>
            <div>NIP. {teacher.nip}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
