import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import { DailyActivityItem, ReportConfig, SummaryActivityItem, SupervisorProfile, TeacherProfile } from '../types';

/**
 * Converts a data URL (SVG, PNG, JPG) to Uint8Array for docx ImageRun
 */
async function dataUrlToImageBytes(dataUrl?: string): Promise<Uint8Array | null> {
  if (!dataUrl) return null;

  try {
    // If it's a PNG or JPEG base64 directly
    if (dataUrl.startsWith('data:image/png;base64,') || dataUrl.startsWith('data:image/jpeg;base64,')) {
      const base64 = dataUrl.split(',')[1];
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }

    // If it's SVG data url, render it onto an offscreen canvas to produce PNG bytes
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 90;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            resolve(new Uint8Array(arrayBuffer));
          };
          reader.onerror = () => resolve(null);
          reader.readAsArrayBuffer(blob);
        }, 'image/png');
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  } catch (e) {
    console.error('Failed to convert image to bytes:', e);
    return null;
  }
}

const standardTableBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
};

const invisibleBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

/**
 * Creates the top-right regulation box
 */
function createRegulationBox(textLines: string[]): Table {
  return new Table({
    width: { size: 38, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.RIGHT,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: textLines.map(
              (line, idx) =>
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: line,
                      bold: idx === 0,
                      size: 16, // 8pt
                      font: 'Arial',
                    }),
                  ],
                })
            ),
          }),
        ],
      }),
    ],
  });
}

/**
 * Creates the Left-Right signature block table
 */
function createSignatureBlock(
  teacher: TeacherProfile,
  supervisor: SupervisorProfile,
  teacherSigBytes: Uint8Array | null,
  supervisorSigBytes: Uint8Array | null
): Table {
  const supervisorSigParagraph = supervisorSigBytes
    ? new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: supervisorSigBytes,
            transformation: { width: 140, height: 55 },
            type: 'png',
          }),
        ],
      })
    : new Paragraph({
        children: [
          new TextRun({ text: '\n\n\n', size: 20 }),
        ],
      });

  const teacherSigParagraph = teacherSigBytes
    ? new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: teacherSigBytes,
            transformation: { width: 140, height: 55 },
            type: 'png',
          }),
        ],
      })
    : new Paragraph({
        children: [
          new TextRun({ text: '\n\n\n', size: 20 }),
        ],
      });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: invisibleBorders,
    rows: [
      new TableRow({
        children: [
          // Left: Kepala Sekolah
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 120, bottom: 60, left: 60, right: 60 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Mengetahui', size: 19, font: 'Arial' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: supervisor.position, size: 19, font: 'Arial' }),
                ],
              }),
              supervisorSigParagraph,
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: supervisor.name,
                    bold: true,
                    underline: {},
                    size: 19,
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `NIP. ${supervisor.nip}`, size: 18, font: 'Arial' }),
                ],
              }),
            ],
          }),
          // Right: Guru Bidang Studi
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: { top: 120, bottom: 60, left: 60, right: 60 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Guru Bidang Studi', size: 19, font: 'Arial' }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '', size: 19, font: 'Arial' }),
                ],
              }),
              teacherSigParagraph,
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: teacher.name,
                    bold: true,
                    underline: {},
                    size: 19,
                    font: 'Arial',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `NIP. ${teacher.nip}`, size: 18, font: 'Arial' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Builds Lampiran 1 content elements
 */
function buildLampiran1Elements(
  config: ReportConfig,
  teacher: TeacherProfile,
  supervisor: SupervisorProfile,
  dailyActivities: DailyActivityItem[],
  teacherSigBytes: Uint8Array | null,
  supervisorSigBytes: Uint8Array | null
) {
  const regLines = config.lampiran1RegHeader.split('\n');

  // Table rows for Lampiran 1
  const tableRows = [
    // Header row
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'NO', bold: true, size: 18, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'HARI', bold: true, size: 18, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 16, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'TANGGAL', bold: true, size: 18, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 44, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'URAIAN KEGIATAN', bold: true, size: 18, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Output / Hasil /', bold: true, size: 17, font: 'Arial' }),
                new TextRun({ text: '\nBukti Dokumen', bold: true, size: 17, font: 'Arial' }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  // Add data rows
  dailyActivities.forEach((act, idx) => {
    const descLines = act.taskDescription.split('\n');
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `${idx + 1}`, size: 17, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: act.day, size: 17, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: act.date, size: 17, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: descLines.map(
              (line) =>
                new Paragraph({
                  children: [new TextRun({ text: line, size: 17, font: 'Arial' })],
                })
            ),
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: act.documentProof || 'Dokumen', size: 17, font: 'Arial' })],
              }),
            ],
          }),
        ],
      })
    );
  });

  return [
    createRegulationBox(regLines),
    new Paragraph({ spacing: { before: 100, after: 80 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'LAPORAN KINERJA HARIAN',
          bold: true,
          size: 22,
          font: 'Arial',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'SASARAN KINERJA PEGAWAI',
          bold: true,
          size: 22,
          font: 'Arial',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
      children: [
        new TextRun({
          text: `BULAN : ${config.monthName.toUpperCase()} ${config.year}`,
          bold: true,
          size: 22,
          font: 'Arial',
        }),
      ],
    }),

    // Identity block
    new Paragraph({
      children: [
        new TextRun({ text: 'NAMA      : ', font: 'Arial', size: 18 }),
        new TextRun({ text: teacher.name, bold: true, font: 'Arial', size: 18 }),
      ],
      indent: { left: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `NIP         : ${teacher.nip}`, font: 'Arial', size: 18 }),
      ],
      indent: { left: 400 },
    }),
    ...(teacher.rank
      ? [
          new Paragraph({
            children: [
              new TextRun({ text: `PANGKAT : ${teacher.rank}`, font: 'Arial', size: 18 }),
            ],
            indent: { left: 400 },
          }),
        ]
      : []),
    new Paragraph({
      children: [
        new TextRun({ text: `JABATAN : ${teacher.position}`, font: 'Arial', size: 18 }),
      ],
      indent: { left: 400 },
    }),
    ...(teacher.unit
      ? [
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({ text: `UNIT        : ${teacher.unit}`, font: 'Arial', size: 18 }),
            ],
            indent: { left: 400 },
          }),
        ]
      : [
          new Paragraph({
            spacing: { after: 140 },
            children: [],
          }),
        ]),

    // Daily Activities Table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: standardTableBorders,
      rows: tableRows,
    }),

    new Paragraph({ spacing: { before: 200 } }),

    // Signature Block
    createSignatureBlock(teacher, supervisor, teacherSigBytes, supervisorSigBytes),
  ];
}

/**
 * Builds Lampiran 2 content elements
 */
function buildLampiran2Elements(
  config: ReportConfig,
  teacher: TeacherProfile,
  supervisor: SupervisorProfile,
  summaryActivities: SummaryActivityItem[],
  teacherSigBytes: Uint8Array | null,
  supervisorSigBytes: Uint8Array | null
) {
  const regLines = config.lampiran2RegHeader.split('\n');

  // Table rows for Lampiran 2
  const tableRows = [
    // Header row
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'No', bold: true, size: 18, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 52, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Uraian Tugas/Kegiatan', bold: true, size: 18, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Volume', bold: true, size: 18, font: 'Arial' })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Bukti Dokumen', bold: true, size: 18, font: 'Arial' })],
            }),
          ],
        }),
      ],
    }),
  ];

  // Add data rows
  summaryActivities.forEach((sum, idx) => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `${idx + 1}`, size: 18, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [new TextRun({ text: sum.taskName, size: 18, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `${sum.volume} ${sum.unit || 'Kegiatan'}`, size: 18, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: sum.documentProof || 'Dokumen', size: 18, font: 'Arial' })],
              }),
            ],
          }),
        ],
      })
    );
  });

  return [
    createRegulationBox(regLines),
    new Paragraph({ spacing: { before: 100, after: 80 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'LAPORAN CAPAIAN KINERJA BULANAN',
          bold: true,
          size: 22,
          font: 'Arial',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
      children: [
        new TextRun({
          text: `Bulan : ${config.monthName} ${config.year}`,
          bold: true,
          size: 22,
          font: 'Arial',
        }),
      ],
    }),

    // Identity block
    new Paragraph({
      children: [
        new TextRun({ text: 'NAMA         : ', font: 'Arial', size: 18 }),
        new TextRun({ text: teacher.name, bold: true, font: 'Arial', size: 18 }),
      ],
      indent: { left: 400 },
    }),
    ...(teacher.nip && teacher.nip !== '-'
      ? [
          new Paragraph({
            children: [
              new TextRun({ text: `NIP            : ${teacher.nip}`, font: 'Arial', size: 18 }),
            ],
            indent: { left: 400 },
          }),
        ]
      : []),
    new Paragraph({
      children: [
        new TextRun({ text: `JABATAN    : ${teacher.position}`, font: 'Arial', size: 18 }),
      ],
      indent: { left: 400 },
    }),
    new Paragraph({
      spacing: { after: 140 },
      children: [
        new TextRun({ text: `UNIT KERJA : ${teacher.unit}`, font: 'Arial', size: 18 }),
      ],
      indent: { left: 400 },
    }),

    // Summary Table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: standardTableBorders,
      rows: tableRows,
    }),

    new Paragraph({ spacing: { before: 200 } }),

    // Signature Block
    createSignatureBlock(teacher, supervisor, teacherSigBytes, supervisorSigBytes),
  ];
}

/**
 * Main function to export Word (.docx) document
 */
export async function exportToDocx(
  mode: 'all' | 'lampiran1' | 'lampiran2',
  config: ReportConfig,
  teacher: TeacherProfile,
  supervisor: SupervisorProfile,
  dailyActivities: DailyActivityItem[],
  summaryActivities: SummaryActivityItem[]
): Promise<void> {
  const teacherSigBytes = await dataUrlToImageBytes(teacher.signatureImage);
  const supervisorSigBytes = await dataUrlToImageBytes(supervisor.signatureImage);

  const sections: any[] = [];

  if (mode === 'lampiran1' || mode === 'all') {
    sections.push({
      properties: {
        page: {
          margin: { top: 1100, bottom: 1100, left: 1100, right: 1100 },
        },
      },
      children: buildLampiran1Elements(
        config,
        teacher,
        supervisor,
        dailyActivities,
        teacherSigBytes,
        supervisorSigBytes
      ),
    });
  }

  if (mode === 'lampiran2' || mode === 'all') {
    sections.push({
      properties: {
        page: {
          margin: { top: 1100, bottom: 1100, left: 1100, right: 1100 },
        },
      },
      children: buildLampiran2Elements(
        config,
        teacher,
        supervisor,
        summaryActivities,
        teacherSigBytes,
        supervisorSigBytes
      ),
    });
  }

  const doc = new Document({
    sections,
  });

  const blob = await Packer.toBlob(doc);
  const filename =
    mode === 'lampiran1'
      ? `Lampiran_I_Laporan_Kinerja_Harian_${config.monthName}_${config.year}.docx`
      : mode === 'lampiran2'
      ? `Lampiran_II_Laporan_Kinerja_Bulanan_${config.monthName}_${config.year}.docx`
      : `Laporan_Kinerja_Guru_Lengkap_${config.monthName}_${config.year}.docx`;

  saveAs(blob, filename);
}
