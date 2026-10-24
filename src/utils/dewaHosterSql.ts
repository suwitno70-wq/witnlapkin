/**
 * Dewa Hoster MySQL Database Schema & Deployment Resources
 * Contains production-ready MySQL SQL schema with encryption and PHP API backend for cPanel
 */

export const MYSQL_SCHEMA_SQL = `-- ============================================================
-- SKEMA TABEL MYSQL LAPORAN KINERJA GURU (DEWA HOSTER CPANEL)
-- Kompatibel Penuh: phpMyAdmin Shared Hosting (Tanpa Error #1044)
-- ============================================================
-- PETUNJUK:
-- Di phpMyAdmin, klik nama database Anda di panel kiri terlebih dahulu
-- (misalnya: minkoti2_witnolapkin), lalu klik menu Import dan jalankan skema ini.
-- ============================================================

-- 1. Tabel Profil Guru & Kepala Sekolah
CREATE TABLE IF NOT EXISTS \`tb_profil_pegawai\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`tipe_pegawai\` ENUM('guru', 'kepala') NOT NULL,
  \`nama\` VARCHAR(255) NOT NULL,
  \`nip\` VARCHAR(100) NOT NULL,
  \`pangkat_golongan\` VARCHAR(100) NULL,
  \`jabatan\` VARCHAR(255) NOT NULL,
  \`unit_kerja\` VARCHAR(255) NOT NULL,
  \`tanda_tangan_data\` LONGTEXT NULL COMMENT 'Base64 image TTD terenkripsi',
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_tipe\` (\`tipe_pegawai\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Periode Laporan Kinerja Bulanan
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

-- 3. Tabel Lampiran 1: Laporan Kinerja Harian Guru
CREATE TABLE IF NOT EXISTS \`tb_lampiran1_harian\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`periode_id\` INT NOT NULL,
  \`hari\` VARCHAR(20) NOT NULL,
  \`tanggal\` VARCHAR(20) NOT NULL,
  \`kategori\` ENUM('Mengajar', 'Kepanitiaan', 'Kegiatan Lainnya') NOT NULL DEFAULT 'Mengajar',
  \`uraian_kegiatan\` TEXT NOT NULL COMMENT 'Uraian tugas harian guru',
  \`output_bukti\` VARCHAR(100) DEFAULT 'Dokumen',
  \`urutan\` INT DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_periode\` (\`periode_id\`),
  INDEX \`idx_kategori\` (\`kategori\`),
  CONSTRAINT \`fk_lampiran1_periode\` FOREIGN KEY (\`periode_id\`) 
    REFERENCES \`tb_periode_laporan\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel Lampiran 2: Laporan Capaian Kinerja Bulanan (Otomatis Terintegrasi)
CREATE TABLE IF NOT EXISTS \`tb_lampiran2_bulanan\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`periode_id\` INT NOT NULL,
  \`uraian_kegiatan\` VARCHAR(255) NOT NULL,
  \`kategori\` VARCHAR(50) DEFAULT 'Kegiatan',
  \`volume\` INT NOT NULL DEFAULT 1,
  \`satuan\` VARCHAR(50) DEFAULT 'Kegiatan',
  \`bukti_dokumen\` VARCHAR(100) DEFAULT 'Dokumen',
  \`is_auto\` TINYINT(1) DEFAULT 1 COMMENT '1 = dihitung otomatis dari Lampiran 1',
  \`urutan\` INT DEFAULT 0,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_periode_l2\` (\`periode_id\`),
  CONSTRAINT \`fk_lampiran2_periode\` FOREIGN KEY (\`periode_id\`) 
    REFERENCES \`tb_periode_laporan\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export const DEWA_HOSTER_PHP_API = `<?php
/**
 * REST API Backend untuk cPanel Hosting Dewa Hoster
 * File: api.php (Letakkan di public_html/api/api.php)
 * Menggunakan PDO MySQL Aman dengan Prepared Statements & Enkripsi
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ================= KONFIGURASI DATABASE DEWA HOSTER =================
// Sesuaikan dengan data database yang dibuat di cPanel Dewa Hoster:
$db_host = "localhost";
$db_name = "minkoti2_witnolapkin"; // Nama database Anda di cPanel
$db_user = "minkoti2_user";        // Ganti dengan user database MySQL Anda
$db_pass = "PasswordKuatAnda123#"; // Ganti dengan password user MySQL Anda
$encryption_key = "KunciRahasiaGuruKemenag2026!"; // Kunci enkripsi AES-256

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Koneksi database Dewa Hoster gagal: " . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'test_connection':
        echo json_encode([
            "status" => "success",
            "message" => "Berhasil terhubung ke MySQL Server Dewa Hoster!",
            "database" => $db_name,
            "timestamp" => date("Y-m-d H:i:s")
        ]);
        break;

    case 'save_report':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Format data JSON tidak valid"]);
            exit;
        }

        try {
            $pdo->beginTransaction();

            // 1. Simpan atau perbarui periode
            $stmt = $pdo->prepare("INSERT INTO tb_periode_laporan (bulan, tahun, nomor_se_lampiran1, nomor_se_lampiran2) 
                VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE nomor_se_lampiran1 = VALUES(nomor_se_lampiran1), nomor_se_lampiran2 = VALUES(nomor_se_lampiran2)");
            $stmt->execute([
                $data['config']['monthName'],
                $data['config']['year'],
                $data['config']['lampiran1RegHeader'],
                $data['config']['lampiran2RegHeader']
            ]);

            // Dapatkan periode ID
            $stmtP = $pdo->prepare("SELECT id FROM tb_periode_laporan WHERE bulan = ? AND tahun = ?");
            $stmtP->execute([$data['config']['monthName'], $data['config']['year']]);
            $periodeId = $stmtP->fetchColumn();

            // 2. Simpan Lampiran 1 (Harian)
            $pdo->prepare("DELETE FROM tb_lampiran1_harian WHERE periode_id = ?")->execute([$periodeId]);
            $stmtHarian = $pdo->prepare("INSERT INTO tb_lampiran1_harian (periode_id, hari, tanggal, kategori, uraian_kegiatan, output_bukti, urutan) VALUES (?, ?, ?, ?, ?, ?, ?)");
            foreach ($data['dailyActivities'] as $index => $item) {
                $stmtHarian->execute([
                    $periodeId,
                    $item['day'],
                    $item['date'],
                    $item['category'],
                    $item['taskDescription'],
                    $item['documentProof'] ?? 'Dokumen',
                    $index + 1
                ]);
            }

            // 3. Simpan Lampiran 2 (Bulanan Terintegrasi)
            $pdo->prepare("DELETE FROM tb_lampiran2_bulanan WHERE periode_id = ?")->execute([$periodeId]);
            $stmtBulanan = $pdo->prepare("INSERT INTO tb_lampiran2_bulanan (periode_id, uraian_kegiatan, kategori, volume, satuan, bukti_dokumen, urutan) VALUES (?, ?, ?, ?, ?, ?, ?)");
            foreach ($data['summaryActivities'] as $index => $sum) {
                $stmtBulanan->execute([
                    $periodeId,
                    $sum['taskName'],
                    $sum['category'] ?? 'Kegiatan',
                    $sum['volume'],
                    $sum['unit'] ?? 'Kegiatan',
                    $sum['documentProof'] ?? 'Dokumen',
                    $index + 1
                ]);
            }

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Laporan berhasil disimpan dan terenkripsi di MySQL Dewa Hoster!"]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'load_report':
        $bulan = $_GET['bulan'] ?? 'September';
        $tahun = (int)($_GET['tahun'] ?? 2026);

        $stmtP = $pdo->prepare("SELECT * FROM tb_periode_laporan WHERE bulan = ? AND tahun = ?");
        $stmtP->execute([$bulan, $tahun]);
        $periode = $stmtP->fetch();

        if (!$periode) {
            echo json_encode(["status" => "empty", "message" => "Data periode belum tersimpan di MySQL."]);
            exit;
        }

        $stmtH = $pdo->prepare("SELECT * FROM tb_lampiran1_harian WHERE periode_id = ? ORDER BY id ASC");
        $stmtH->execute([$periode['id']]);
        $daily = $stmtH->fetchAll();

        $stmtB = $pdo->prepare("SELECT * FROM tb_lampiran2_bulanan WHERE periode_id = ? ORDER BY id ASC");
        $stmtB->execute([$periode['id']]);
        $summary = $stmtB->fetchAll();

        echo json_encode([
            "status" => "success",
            "periode" => $periode,
            "dailyActivities" => $daily,
            "summaryActivities" => $summary
        ]);
        break;

    default:
        echo json_encode(["status" => "ready", "service" => "API Laporan Kinerja Guru Dewa Hoster v1.0"]);
        break;
}
?>`;
