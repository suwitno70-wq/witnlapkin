export type ActivityCategory = 'Mengajar' | 'Kepanitiaan' | 'Kegiatan Lainnya';

export interface DailyActivityItem {
  id: string;
  day: string; // e.g. 'Selasa', 'Rabu'
  date: string; // e.g. '01/09/2026'
  taskDescription: string; // can contain multiline activities
  category: ActivityCategory;
  documentProof: string; // default 'Dokumen'
}

export interface SummaryActivityItem {
  id: string;
  taskName: string; // e.g. 'Proses Belajar Mengajar'
  category: ActivityCategory;
  volume: number; // e.g. 39
  unit: string; // 'Kegiatan'
  documentProof: string; // 'Dokumen'
  // Auto-grouping matching keyword or rule (optional)
  matchKeyword?: string;
  isAutoCounted?: boolean;
}

export interface TeacherProfile {
  name: string;
  nip: string;
  nuptk?: string;
  rank?: string; // Pangkat / Golongan Ruang (misal: Penata Muda / III/a)
  position: string; // Jabatan (misal: Guru Pertama Bidang Studi Penjaskes)
  subject?: string; // Mata Pelajaran (misal: PJOK)
  unit: string; // Unit Kerja (misal: MIN 1 Kotawaringin Timur / Kemenag Agama Kab.Kotim)
  signatureImage?: string; // base64 or SVG
}

export interface SupervisorProfile {
  name: string;
  nip: string;
  rank?: string; // Pangkat / Golongan Ruang (misal: Pembina / IV/a)
  position: string; // Jabatan (misal: Kepala MIN 1 Kotawaringin Timur)
  unit?: string; // Instansi (misal: Kantor Kemenag Kab. Kotawaringin Timur)
  signingCity?: string; // Kota penandatanganan (misal: Sampit)
  signingDate?: string; // Tanggal penandatanganan (misal: 30 September 2026)
  showDateAboveSignature?: boolean;
  signatureImage?: string; // base64 or SVG
}

export interface ReportConfig {
  monthName: string; // e.g. 'September'
  year: number; // e.g. 2026
  lampiran1RegHeader: string; // 'Lampiran I\nSE Sekjen Nomor :\nAJ/B.II.2/Kp.02.3/488/2015'
  lampiran2RegHeader: string; // 'Lampiran II\nKep.Sekjen Kemenag Nomor 83 Tahun 2019'
  cityDateFooter: string; // optional city string, or empty
  autoSyncLampiran2: boolean;
}

export interface MySQLConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  tablePrefix: string;
  encryptionKey: string;
  apiEndpoint?: string;
}
