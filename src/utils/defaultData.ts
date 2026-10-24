import { DailyActivityItem, ReportConfig, SummaryActivityItem, SupervisorProfile, TeacherProfile } from '../types';

// Preset signature SVGs inspired by the official signatures in the reference images
export const DEFAULT_SUPERVISOR_SIGNATURE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 90" width="200" height="90">
  <path d="M 30,55 Q 45,20 60,50 T 80,65 Q 95,20 105,45 T 120,60" fill="none" stroke="%231e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 50,48 L 130,52" fill="none" stroke="%231e293b" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M 40,75 C 60,65 110,68 150,58" fill="none" stroke="%231e293b" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="85" cy="30" r="2.5" fill="%231e293b"/>
</svg>`;

export const DEFAULT_TEACHER_SIGNATURE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 90" width="200" height="90">
  <path d="M 40,30 L 70,75 L 55,20 L 80,70 L 100,25" fill="none" stroke="%231e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 35,50 Q 80,45 115,48" fill="none" stroke="%231e293b" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M 90,20 L 75,80" fill="none" stroke="%231e293b" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 70,60 C 85,75 110,65 125,50" fill="none" stroke="%231e293b" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  monthName: 'September',
  year: 2026,
  lampiran1RegHeader: `Lampiran I\nSE Sekjen Nomor :\nAJ/B.II.2/Kp.02.3/488/2015`,
  lampiran2RegHeader: `Lampiran II\nKep.Sekjen Kemenag Nomor 83 Tahun 2019`,
  cityDateFooter: '',
  autoSyncLampiran2: true,
};

export const DEFAULT_TEACHER: TeacherProfile = {
  name: 'ACHMAD NURICHSAN, S.Pd',
  nip: '19930221 201903 1 006',
  nuptk: '8455771672130082',
  rank: 'Penata Muda / III/a',
  position: 'Guru Pertama Bidang Studi Penjaskes',
  subject: 'PJOK',
  unit: 'Kemenag Agama Kab.Kotim',
  signatureImage: DEFAULT_TEACHER_SIGNATURE,
};

export const DEFAULT_SUPERVISOR: SupervisorProfile = {
  name: 'Drs. Aceng Abudin, MM',
  nip: '196808061994021004',
  rank: 'Pembina Tk. I / IV/b',
  position: 'Kepala MIN 1 Kotawaringin Timur',
  unit: 'Kantor Kementerian Agama Kab. Kotawaringin Timur',
  signingCity: 'Sampit',
  signingDate: '30 September 2026',
  showDateAboveSignature: false,
  signatureImage: DEFAULT_SUPERVISOR_SIGNATURE,
};

// Default activities are empty for production use
export const DEFAULT_DAILY_ACTIVITIES: DailyActivityItem[] = [];

export const DEFAULT_SUMMARY_ACTIVITIES: SummaryActivityItem[] = [];
