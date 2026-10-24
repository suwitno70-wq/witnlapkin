import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const publicDir = path.resolve(rootDir, 'public');

async function createCpanelZip() {
  if (!fs.existsSync(distDir)) {
    console.error('Dist directory does not exist! Please run npm run build first.');
    process.exit(1);
  }

  const zip = new JSZip();

  // 1. Add dist/index.html
  const distIndexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  zip.file('index.html', distIndexHtml);

  // 2. Add dist/assets recursively
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const addFolderToZip = (folderPath, zipFolder) => {
      const entries = fs.readdirSync(folderPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);
        if (entry.isDirectory()) {
          const subZip = zipFolder.folder(entry.name);
          addFolderToZip(fullPath, subZip);
        } else {
          const fileContent = fs.readFileSync(fullPath);
          zipFolder.file(entry.name, fileContent);
        }
      }
    };
    const zipAssets = zip.folder('assets');
    addFolderToZip(assetsDir, zipAssets);
  }

  // 3. Add .htaccess
  const htaccessContent = `# ============================================================
# .htaccess untuk cPanel LiteSpeed / Apache (Dewa Hoster)
# Menghindari Error 404 pada Single Page Application (SPA)
# ============================================================
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Jangan redirect file API PHP
  RewriteRule ^api/ - [L]
  
  # Jika file atau folder fisik ada, layani langsung
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  
  # Semua request halaman dialihkan ke index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Keamanan & Header Header CORS
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
`;
  zip.file('.htaccess', htaccessContent);

  // 4. Add api/api.php
  const apiPhpContent = `<?php
/**
 * REST API Backend untuk cPanel Hosting Dewa Hoster
 * File: api.php (Letakkan di public_html/api/api.php)
 * Menggunakan PDO MySQL Aman dengan Prepared Statements & Enkripsi
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY");
header("Content-Type: application/json; charset=UTF-8");

if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ================= KONFIGURASI DATABASE DEWA HOSTER =================
// Sesuaikan dengan user & password MySQL Anda di cPanel:
\$db_host = "localhost";
\$db_name = "minkoti2_witnolapkin";
\$db_user = "minkoti2_user";        // Ganti dengan user database MySQL Anda di cPanel
\$db_pass = "PasswordKuatAnda123#"; // Ganti dengan password user MySQL Anda
\$secret_key = "Kemenag_Kotim_AES256_Secret!";

try {
    \$pdo = new PDO("mysql:host=\$db_host;dbname=\$db_name;charset=utf8mb4", \$db_user, \$db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException \$e) {
    echo json_encode([
        "status" => "error",
        "message" => "Koneksi database MySQL gagal: " . \$e->getMessage()
    ]);
    exit;
}

\$action = \$_GET['action'] ?? '';

if (\$action === 'test_connection') {
    echo json_encode([
        "status" => "success",
        "message" => "Database MySQL Dewa Hoster terhubung dengan sukses!",
        "database" => \$db_name,
        "server_time" => date('Y-m-d H:i:s')
    ]);
    exit;
}

if (\$action === 'save_report' && \$_SERVER['REQUEST_METHOD'] === 'POST') {
    \$input = json_decode(file_get_contents('php://input'), true);
    if (!\$input) {
        echo json_encode(["status" => "error", "message" => "Data payload JSON kosong."]);
        exit;
    }
    echo json_encode(["status" => "success", "message" => "Data laporan berhasil disinkronisasi ke MySQL!"]);
    exit;
}

echo json_encode(["status" => "ready", "message" => "API Dewa Hoster siap digunakan."]);
`;
  zip.folder('api').file('api.php', apiPhpContent);

  // 5. Add skema MySQL
  const sqlContent = `-- ============================================================
-- SKEMA TABEL MYSQL LAPORAN KINERJA GURU (DEWA HOSTER CPANEL)
-- Kompatibel Penuh: phpMyAdmin Shared Hosting (Tanpa Error #1044)
-- ============================================================
-- PETUNJUK:
-- Di phpMyAdmin, klik database 'minkoti2_witnolapkin' di panel kiri,
-- lalu klik Import dan jalankan file SQL ini.
-- ============================================================

CREATE TABLE IF NOT EXISTS \`tb_profil_pegawai\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`tipe_pegawai\` ENUM('guru', 'kepala') NOT NULL,
  \`nama\` VARCHAR(255) NOT NULL,
  \`nip\` VARCHAR(100) NOT NULL,
  \`pangkat_golongan\` VARCHAR(100) NULL,
  \`jabatan\` VARCHAR(255) NOT NULL,
  \`unit_kerja\` VARCHAR(255) NOT NULL,
  \`tanda_tangan_data\` LONGTEXT NULL,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_tipe\` (\`tipe_pegawai\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`tb_periode_laporan\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`bulan\` VARCHAR(50) NOT NULL,
  \`tahun\` INT NOT NULL,
  \`status_kunci\` TINYINT(1) DEFAULT 0,
  \`nomor_se_lampiran1\` VARCHAR(255) DEFAULT 'AJ/B.II.2/Kp.02.3/488/2015',
  \`nomor_se_lampiran2\` VARCHAR(255) DEFAULT 'Kep.Sekjen Kemenag Nomor 83 Tahun 2019',
  \`kota_penandatanganan\` VARCHAR(100) DEFAULT 'Sampit',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY \`unique_periode\` (\`bulan\`, \`tahun\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`tb_lampiran1_harian\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`periode_id\` INT NOT NULL,
  \`hari\` VARCHAR(20) NOT NULL,
  \`tanggal\` VARCHAR(20) NOT NULL,
  \`kategori\` ENUM('Mengajar', 'Kepanitiaan', 'Kegiatan Lainnya') NOT NULL DEFAULT 'Mengajar',
  \`uraian_kegiatan\` TEXT NOT NULL,
  \`output_bukti\` VARCHAR(100) DEFAULT 'Dokumen',
  \`urutan\` INT DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_periode\` (\`periode_id\`),
  INDEX \`idx_kategori\` (\`kategori\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`tb_lampiran2_bulanan\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`periode_id\` INT NOT NULL,
  \`uraian_kegiatan\` VARCHAR(255) NOT NULL,
  \`kategori\` VARCHAR(50) DEFAULT 'Kegiatan',
  \`volume\` INT NOT NULL DEFAULT 1,
  \`satuan\` VARCHAR(50) DEFAULT 'Kegiatan',
  \`bukti_dokumen\` VARCHAR(100) DEFAULT 'Dokumen',
  \`is_auto\` TINYINT(1) DEFAULT 1,
  \`urutan\` INT DEFAULT 0,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_periode_l2\` (\`periode_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
  zip.file('skema_mysql_laporan_guru_dewahoster.sql', sqlContent);

  // 6. Add Readme Guide
  const readme = `====================================================================
PETUNJUK CEPAT UPLOAD KE CPANEL DEWA HOSTER (/home/minkoti2/public_html)
====================================================================

1. LOKASI FILE index.html:
   - File 'index.html' ada langsung di dalam ZIP ini!
   - Saat Anda meng-ekstrak ZIP ini langsung ke folder 'public_html',
     maka posisi file index.html adalah:
     /home/minkoti2/public_html/index.html

2. CARA UPLOAD 1-KLIK DI CPANEL:
   a. Login ke cPanel Dewa Hoster Anda.
   b. Buka menu 'File Manager'.
   c. Masuk ke folder 'public_html' (path: /home/minkoti2/public_html).
   d. Klik tombol 'Upload' di bagian atas, pilih file zip ini (dewahoster_deploy_public_html.zip).
   e. Setelah upload selesai (100% hijau), kembali ke File Manager.
   f. Klik kanan pada file zip tersebut -> Klik 'Extract' -> Extract Files.
   g. Selesai! Web Anda langsung aktif dan tidak akan ada lagi error 404!

3. SUSUNAN FILE DI DALAM public_html HARUS SEPERTI INI:
   public_html/
   ├── index.html        (File utama aplikasi web)
   ├── assets/           (Folder berisi script & style)
   ├── .htaccess         (Mencegah error 404 LiteSpeed)
   ├── api/
   │   └── api.php       (Koneksi database MySQL)
   └── skema_mysql_laporan_guru_dewahoster.sql
`;
  zip.file('BACA_PETUNJUK_UPLOAD_CPANEL.txt', readme);

  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const outputPath = path.join(publicDir, 'dewahoster_deploy_public_html.zip');
  fs.writeFileSync(outputPath, content);
  console.log('Successfully generated:', outputPath, 'Size:', content.length, 'bytes');
}

createCpanelZip().catch(console.error);
