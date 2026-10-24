import React from 'react';
import { DailyActivityItem, ReportConfig, SupervisorProfile, TeacherProfile } from '../types';

interface Lampiran1ViewProps {
  config: ReportConfig;
  teacher: TeacherProfile;
  supervisor: SupervisorProfile;
  activities: DailyActivityItem[];
  onOpenTeacherSignature?: () => void;
  onOpenSupervisorSignature?: () => void;
  isPrintMode?: boolean;
}

export const Lampiran1View: React.FC<Lampiran1ViewProps> = ({
  config,
  teacher,
  supervisor,
  activities,
  onOpenTeacherSignature,
  onOpenSupervisorSignature,
  isPrintMode = false,
}) => {
  return (
    <div
      className={`print-sheet bg-white text-black font-sans mx-auto transition-all ${
        isPrintMode
          ? 'w-full p-0 shadow-none'
          : 'max-w-4xl p-3 sm:p-6 md:p-12 shadow-lg border border-slate-200 rounded-lg'
      }`}
      style={{ minHeight: isPrintMode ? 'auto' : '1100px' }}
    >
      {/* Top-Right Official Regulation Box */}
      <div className="flex justify-end mb-4">
        <div className="border border-black px-4 py-2 text-center text-xs font-serif leading-tight">
          <div className="font-bold">Lampiran I</div>
          <div>SE Sekjen Nomor :</div>
          <div>{config.lampiran1RegHeader.split('\n')[2] || 'AJ/B.II.2/Kp.02.3/488/2015'}</div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center font-bold text-sm tracking-wide mb-6 uppercase">
        <div className="leading-tight">LAPORAN KINERJA HARIAN</div>
        <div className="leading-tight">SASARAN KINERJA PEGAWAI</div>
        <div className="leading-tight">
          BULAN : {config.monthName} {config.year}
        </div>
      </div>

      {/* Identity Section */}
      <div className="mb-4 text-xs font-serif leading-relaxed">
        <div className="grid grid-cols-[90px_12px_1fr] items-center">
          <span className="font-medium">NAMA</span>
          <span>:</span>
          <span className="font-bold uppercase">{teacher.name}</span>
        </div>
        <div className="grid grid-cols-[90px_12px_1fr] items-center">
          <span className="font-medium">NIP</span>
          <span>:</span>
          <span>{teacher.nip}</span>
        </div>
        {teacher.rank && (
          <div className="grid grid-cols-[90px_12px_1fr] items-center">
            <span className="font-medium">PANGKAT/GOL</span>
            <span>:</span>
            <span>{teacher.rank}</span>
          </div>
        )}
        <div className="grid grid-cols-[90px_12px_1fr] items-center">
          <span className="font-medium">JABATAN</span>
          <span>:</span>
          <span>{teacher.position}</span>
        </div>
        {teacher.unit && (
          <div className="grid grid-cols-[90px_12px_1fr] items-center">
            <span className="font-medium">UNIT KERJA</span>
            <span>:</span>
            <span>{teacher.unit}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-black text-xs font-serif">
          <thead>
            <tr className="bg-slate-100/70 text-center font-bold">
              <th className="border border-black py-2 px-2 w-12">NO</th>
              <th className="border border-black py-2 px-3 w-24">HARI</th>
              <th className="border border-black py-2 px-3 w-28">TANGGAL</th>
              <th className="border border-black py-2 px-4 text-center">URAIAN KEGIATAN</th>
              <th className="border border-black py-2 px-3 w-36 text-center leading-tight">
                Output / Hasil /<br />Bukti Dokumen
              </th>
            </tr>
          </thead>
          <tbody>
            {activities.map((act, index) => (
              <tr key={act.id || index} className="align-top hover:bg-slate-50/50">
                <td className="border border-black text-center py-2 px-2">{index + 1}</td>
                <td className="border border-black text-center py-2 px-2">{act.day}</td>
                <td className="border border-black text-center py-2 px-2 whitespace-nowrap">{act.date}</td>
                <td className="border border-black py-2 px-3 leading-snug">
                  {act.taskDescription.split('\n').map((line, lIdx) => (
                    <div key={lIdx} className={lIdx > 0 ? 'mt-1 pt-1 border-t border-slate-100' : ''}>
                      {line}
                    </div>
                  ))}
                </td>
                <td className="border border-black text-center py-2 px-2">{act.documentProof || 'Dokumen'}</td>
              </tr>
            ))}
            {activities.length === 0 && (
              <>
                <tr className="no-print">
                  <td colSpan={5} className="border border-black text-center py-8 text-slate-400 italic">
                    Belum ada data kegiatan harian.
                    <br />
                    Silakan buka tab <strong>"Kelola Kegiatan Harian (Lampiran 1)"</strong> untuk mulai mengisi kegiatan Anda.
                  </td>
                </tr>
                {/* Printable blank rows */}
                {[1, 2, 3, 4, 5].map((num) => (
                  <tr key={`blank-init-${num}`} className="h-9">
                    <td className="border border-black text-center py-2 px-2 text-slate-300">{num}</td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                  </tr>
                ))}
              </>
            )}

            {/* Blank row at bottom matching the physical document */}
            {activities.length > 0 && (
              <tr>
                <td className="border border-black py-3 text-center text-slate-300">
                  {activities.length + 1}
                </td>
                <td className="border border-black"></td>
                <td className="border border-black"></td>
                <td className="border border-black"></td>
                <td className="border border-black"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Signature Section - Precision Left & Right Alignment */}
      <div className="mt-8 pt-4">
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
