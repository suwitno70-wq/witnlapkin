import { DailyActivityItem, ReportConfig, SummaryActivityItem, TeacherProfile } from '../types';

/**
 * Calculates total teaching sessions across all daily activities.
 * Handles:
 * - Direct category 'Mengajar'
 * - Multi-class combinations with '&', 'dan', or ',' (e.g., "VR2 & VIR3" = 2 sessions)
 * - Teaching keywords in any category
 */
export function calculateTotalTeachingSessions(dailyActivities: DailyActivityItem[]): number {
  let total = 0;

  for (const act of dailyActivities) {
    const lines = act.taskDescription.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase();
      // Check if line is a teaching activity
      const isTeaching =
        act.category === 'Mengajar' ||
        lower.includes('mengajar') ||
        lower.includes('bdr') ||
        lower.includes('pembelajaran') ||
        lower.includes('tatap muka') ||
        lower.includes('kbm') ||
        lower.includes('pjok');

      // Exclude secondary non-teaching tasks that might be written on the same day
      const isOtherTask =
        lower.includes('piket') ||
        lower.includes('sholat') ||
        lower.includes('dzuhur') ||
        lower.includes('panitia') ||
        lower.includes('maulid') ||
        lower.includes('laporan bulanan') ||
        lower.includes('rapat') ||
        lower.includes('upacara');

      if (isTeaching && !isOtherTask) {
        if (line.includes('&')) {
          total += line.split('&').length;
        } else if (lower.includes(' dan ')) {
          total += lower.split(' dan ').length;
        } else if (line.includes(',')) {
          total += line.split(',').length;
        } else {
          total += 1;
        }
      }
    }
  }

  return total;
}

/**
 * Checks how many times a keyword or phrase appears across all daily activity logs
 */
export function countKeywordOccurrences(activities: DailyActivityItem[], keyword: string): number {
  if (!keyword || !keyword.trim()) return 0;
  const lowerKw = keyword.toLowerCase().trim();
  let total = 0;

  for (const act of activities) {
    const lines = act.taskDescription.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes(lowerKw)) {
        total += 1;
      }
    }
  }
  return total;
}

/**
 * Calculates teaching sessions for a single text block
 */
export function calculateTeachingSessions(text: string): number {
  if (!text) return 0;
  const lines = text.split('\n');
  let count = 0;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (
      lower.includes('mengajar') ||
      lower.includes('bdr') ||
      lower.includes('pembelajaran') ||
      lower.includes('tatap muka') ||
      lower.includes('pjok')
    ) {
      if (line.includes('&')) {
        count += line.split('&').length;
      } else if (lower.includes(' dan ')) {
        count += lower.split(' dan ').length;
      } else if (line.includes(',')) {
        count += line.split(',').length;
      } else {
        count += 1;
      }
    }
  }
  return count > 0 ? count : 1;
}

/**
 * Smart Synchronizer: Automatically transforms and synchronizes Lampiran 1 daily activities
 * into Lampiran 2 monthly achievement rows according to Indonesian school/madrasah performance standards.
 */
export function smartSyncLampiran1ToLampiran2(
  dailyActivities: DailyActivityItem[],
  currentSummaries: SummaryActivityItem[],
  config: ReportConfig,
  teacher: TeacherProfile
): SummaryActivityItem[] {
  if (dailyActivities.length === 0) {
    return [];
  }

  // 1. Calculate Teaching volume
  const teachingVolume = calculateTotalTeachingSessions(dailyActivities);

  // 2. Extract Committees (Kepanitiaan)
  const panitiaMap = new Map<string, number>();
  for (const act of dailyActivities) {
    const lines = act.taskDescription.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (act.category === 'Kepanitiaan' || lower.includes('panitia') || lower.includes('maulid')) {
        let cleanName = line.trim();
        if (lower.includes('maulid') && !cleanName.toLowerCase().startsWith('panitia')) {
          cleanName = 'Panitia Acara Maulid Nabi Muhammad SAW';
        } else if (!cleanName.toLowerCase().startsWith('panitia') && cleanName.length > 0) {
          cleanName = `Panitia ${cleanName}`;
        }
        if (cleanName) {
          panitiaMap.set(cleanName, (panitiaMap.get(cleanName) || 0) + 1);
        }
      }
    }
  }

  // 3. Extract Kegiatan Lainnya
  const piketCount = countKeywordOccurrences(dailyActivities, 'piket');
  const sholatCount = countKeywordOccurrences(dailyActivities, 'sholat') || countKeywordOccurrences(dailyActivities, 'dzuhur');
  const laporanCount = countKeywordOccurrences(dailyActivities, 'laporan bulanan') || countKeywordOccurrences(dailyActivities, 'laporan');
  const rapatCount = countKeywordOccurrences(dailyActivities, 'rapat');
  const upacaraCount = countKeywordOccurrences(dailyActivities, 'upacara');

  // Other unique non-teaching tasks
  const otherCustomMap = new Map<string, number>();
  for (const act of dailyActivities) {
    if (act.category === 'Kegiatan Lainnya') {
      const lines = act.taskDescription.split('\n');
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (
          !lower.includes('piket') &&
          !lower.includes('sholat') &&
          !lower.includes('dzuhur') &&
          !lower.includes('laporan') &&
          !lower.includes('rapat') &&
          !lower.includes('upacara') &&
          !lower.includes('mengajar') &&
          !lower.includes('panitia')
        ) {
          const trimmed = line.trim();
          if (trimmed) {
            otherCustomMap.set(trimmed, (otherCustomMap.get(trimmed) || 0) + 1);
          }
        }
      }
    }
  }

  const result: SummaryActivityItem[] = [];

  // 1. Mengajar Row
  const existingTeaching = currentSummaries.find(
    (s) =>
      s.category === 'Mengajar' ||
      s.taskName.toLowerCase().includes('mengajar') ||
      s.taskName.toLowerCase().includes('belajar')
  );
  let teachingTaskName = 'Proses Belajar Mengajar';
  if (existingTeaching && existingTeaching.taskName) {
    if (
      existingTeaching.taskName === 'Mengajar Mapel PJOK Kelas IV, V, & VI' ||
      existingTeaching.taskName.includes('Mengajar Mapel PJOK')
    ) {
      teachingTaskName = 'Proses Belajar Mengajar';
    } else {
      teachingTaskName = existingTeaching.taskName;
    }
  }

  if (teachingVolume > 0 || existingTeaching) {
    result.push({
      id: existingTeaching ? existingTeaching.id : 'sum-mengajar',
      taskName: teachingTaskName,
      category: 'Mengajar',
      volume: teachingVolume > 0 ? teachingVolume : 1,
      unit: existingTeaching?.unit || 'Kegiatan',
      documentProof: existingTeaching?.documentProof || 'Dokumen',
      matchKeyword: 'Mengajar',
      isAutoCounted: true,
    });
  }

  // 2. Kepanitiaan Rows
  if (panitiaMap.size > 0) {
    panitiaMap.forEach((vol, name) => {
      const existing = currentSummaries.find(
        (s) =>
          s.taskName.toLowerCase() === name.toLowerCase() ||
          (name.toLowerCase().includes('maulid') && s.taskName.toLowerCase().includes('maulid'))
      );
      result.push({
        id: existing ? existing.id : `sum-panitia-${result.length + 1}`,
        taskName: existing ? existing.taskName : name,
        category: 'Kepanitiaan',
        volume: vol,
        unit: 'Kegiatan',
        documentProof: 'Dokumen',
        matchKeyword: 'Panitia',
        isAutoCounted: true,
      });
    });
  } else {
    // If user has existing Kepanitiaan row preserved
    const existingPanitia = currentSummaries.find((s) => s.category === 'Kepanitiaan');
    if (existingPanitia && existingPanitia.isAutoCounted === false) {
      result.push(existingPanitia);
    }
  }

  // 3. Guru Piket
  if (piketCount > 0) {
    const existing = currentSummaries.find((s) => s.taskName.toLowerCase().includes('piket'));
    result.push({
      id: existing ? existing.id : 'sum-piket',
      taskName: existing ? existing.taskName : 'Bertugas sebagai guru piket',
      category: 'Kegiatan Lainnya',
      volume: piketCount,
      unit: 'Kegiatan',
      documentProof: 'Dokumen',
      matchKeyword: 'piket',
      isAutoCounted: true,
    });
  }

  // 4. Sholat Dzuhur
  if (sholatCount > 0) {
    const existing = currentSummaries.find(
      (s) => s.taskName.toLowerCase().includes('sholat') || s.taskName.toLowerCase().includes('dzuhur')
    );
    result.push({
      id: existing ? existing.id : 'sum-sholat',
      taskName: existing ? existing.taskName : 'Mendampingi Sholat Dzuhur Berjamaah',
      category: 'Kegiatan Lainnya',
      volume: sholatCount,
      unit: 'Kegiatan',
      documentProof: 'Dokumen',
      matchKeyword: 'Sholat Dzuhur',
      isAutoCounted: true,
    });
  }

  // 5. Rapat Dinas
  if (rapatCount > 0) {
    const existing = currentSummaries.find((s) => s.taskName.toLowerCase().includes('rapat'));
    result.push({
      id: existing ? existing.id : 'sum-rapat',
      taskName: existing ? existing.taskName : 'Mengikuti Rapat Dinas Dewan Guru',
      category: 'Kegiatan Lainnya',
      volume: rapatCount,
      unit: 'Kegiatan',
      documentProof: 'Dokumen',
      matchKeyword: 'rapat',
      isAutoCounted: true,
    });
  }

  // 6. Upacara Bendera
  if (upacaraCount > 0) {
    const existing = currentSummaries.find((s) => s.taskName.toLowerCase().includes('upacara'));
    result.push({
      id: existing ? existing.id : 'sum-upacara',
      taskName: existing ? existing.taskName : 'Mengikuti Upacara Bendera',
      category: 'Kegiatan Lainnya',
      volume: upacaraCount,
      unit: 'Kegiatan',
      documentProof: 'Dokumen',
      matchKeyword: 'upacara',
      isAutoCounted: true,
    });
  }

  // 7. Laporan Bulanan
  if (laporanCount > 0) {
    const existing = currentSummaries.find((s) => s.taskName.toLowerCase().includes('laporan'));
    result.push({
      id: existing ? existing.id : 'sum-laporan',
      taskName: existing ? existing.taskName : `Membuat laporan Bulanan ${config.monthName} ${config.year}`,
      category: 'Kegiatan Lainnya',
      volume: laporanCount,
      unit: 'Kegiatan',
      documentProof: 'Dokumen',
      matchKeyword: 'laporan',
      isAutoCounted: true,
    });
  }

  // 8. Other custom non-teaching tasks
  otherCustomMap.forEach((vol, name) => {
    const existing = currentSummaries.find((s) => s.taskName.toLowerCase() === name.toLowerCase());
    result.push({
      id: existing ? existing.id : `sum-other-${result.length + 1}`,
      taskName: existing ? existing.taskName : name,
      category: 'Kegiatan Lainnya',
      volume: vol,
      unit: 'Kegiatan',
      documentProof: 'Dokumen',
      matchKeyword: name,
      isAutoCounted: true,
    });
  });

  // Preserve any manually locked custom rows
  currentSummaries.forEach((cur) => {
    if (cur.isAutoCounted === false && !result.some((r) => r.id === cur.id)) {
      result.push(cur);
    }
  });

  return result;
}

/**
 * Backward-compatible helper for re-sync
 */
export function syncLampiran2WithDaily(
  currentSummaries: SummaryActivityItem[],
  dailyActivities: DailyActivityItem[]
): SummaryActivityItem[] {
  // If no summaries exist yet, return empty
  if (dailyActivities.length === 0) return [];
  const fakeConfig: ReportConfig = {
    monthName: 'September',
    year: 2026,
    lampiran1RegHeader: '',
    lampiran2RegHeader: '',
    cityDateFooter: '',
    autoSyncLampiran2: true,
  };
  const fakeTeacher: TeacherProfile = {
    name: '',
    nip: '',
    position: '',
    unit: '',
  };
  return smartSyncLampiran1ToLampiran2(dailyActivities, currentSummaries, fakeConfig, fakeTeacher);
}

/**
 * Backward-compatible helper for full auto-generate
 */
export function autoGenerateLampiran2FromDaily(
  dailyActivities: DailyActivityItem[],
  config: ReportConfig,
  teacher: TeacherProfile
): SummaryActivityItem[] {
  return smartSyncLampiran1ToLampiran2(dailyActivities, [], config, teacher);
}

/**
 * Computes comprehensive statistical totals for the report
 */
export function calculateReportStats(dailyActivities: DailyActivityItem[], summaries: SummaryActivityItem[]) {
  const totalDays = dailyActivities.length;
  const totalTeachingSessions = calculateTotalTeachingSessions(dailyActivities);
  const kepanitiaanCount = dailyActivities.filter(
    (a) =>
      a.category === 'Kepanitiaan' ||
      a.taskDescription.toLowerCase().includes('panitia') ||
      a.taskDescription.toLowerCase().includes('maulid')
  ).length;

  const lainnyaCount = dailyActivities.filter((a) => a.category === 'Kegiatan Lainnya').length;
  const totalVolumeLampiran2 = summaries.reduce((acc, curr) => acc + (Number(curr.volume) || 0), 0);

  return {
    totalDays,
    totalTeachingSessions,
    kepanitiaanCount,
    lainnyaCount,
    totalVolumeLampiran2,
  };
}
