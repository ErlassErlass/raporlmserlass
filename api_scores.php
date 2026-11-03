<?php
/**
 * Erlass API Scores - Read-Only Proxy
 * Connects to Moodle DB and returns student quiz grades for Course 63
 * Format output: compatible with erlass-interpretation-engine-v2.js
 */

// CORS untuk akses dari subdomain yang sama
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://rapor.erlass.academy');
header('X-Content-Type-Options: nosniff');

// Muat konfigurasi dari berkas lokal jika tersedia
$localConfigFile = __DIR__ . '/config.local.php';
if (file_exists($localConfigFile)) {
    $config = require $localConfigFile;
} else {
    $config = [
        'db_host' => getenv('DB_HOST') ?: 'localhost',
        'db_name' => getenv('DB_NAME') ?: 'moodle',
        'db_user' => getenv('DB_USER') ?: 'DB_USER',
        'db_pass' => getenv('DB_PASS') ?: 'DB_PASS',
        'db_prefix' => getenv('DB_PREFIX') ?: 'mdlbq_',
        'valid_passcodes' => [],
        'valid_tokens' => [],
        'token' => 'auth-token'
    ];
}

// Handle Passcode Verification
$action = $_GET['action'] ?? $_POST['action'] ?? '';
if ($action === 'verify_passcode') {
    $input_data = json_decode(file_get_contents('php://input'), true);
    $passcode = trim($_POST['passcode'] ?? $_GET['passcode'] ?? $input_data['passcode'] ?? '');
    
    // Passcode resmi pengaman dasbor
    $valid_passcodes = $config['valid_passcodes'] ?? [];
    
    if (in_array($passcode, $valid_passcodes, true)) {
        echo json_encode([
            'status' => 'ok',
            'token' => $config['token'] ?? 'authenticated',
            'message' => 'Autentikasi berhasil'
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Passcode salah. Akses ditolak.'
        ]);
    }
    exit;
}

// Token protection untuk fetch data
$token = $_GET['token'] ?? '';
$valid_tokens = $config['valid_tokens'] ?? [];
if (!in_array($token, $valid_tokens, true)) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized', 'code' => 403]);
    exit;
}

// DB Config (read-only dari Moodle)
$host   = $config['db_host'] ?? 'localhost';
$dbname = $config['db_name'] ?? 'moodle';
$user   = $config['db_user'] ?? '';
$pass   = $config['db_pass'] ?? '';
$prefix = $config['db_prefix'] ?? 'mdlbq_';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB Connection failed']);
    exit;
}

// Whitelist course IDs dari kategori 39 (ASESMEN)
try {
    $stmtAllowed = $pdo->query("SELECT id FROM {$prefix}course WHERE category = 39 AND id > 1");
    $allowed_courses = $stmtAllowed->fetchAll(PDO::FETCH_COLUMN);
} catch (Exception $e) {
    $allowed_courses = [63, 48, 50, 51, 46];
}
if (empty($allowed_courses)) {
    $allowed_courses = [63, 48, 50, 51, 46];
}

// Action untuk mendapatkan daftar course kategori Asesmen
if ($action === 'get_courses') {
    $stmtCourses = $pdo->query("
        SELECT id, fullname, shortname 
        FROM {$prefix}course 
        WHERE category = 39 AND id > 1 
        ORDER BY id DESC
    ");
    echo json_encode([
        'status' => 'ok',
        'courses' => $stmtCourses->fetchAll()
    ]);
    exit;
}

$course_id = intval($_GET['course'] ?? 63);
if (!in_array($course_id, $allowed_courses)) {
    $course_id = 63;
}

// =====================================================================
// QUERY 1: Ambil semua quiz attempts yang finished di course ini
// =====================================================================
$sql = "
SELECT
    u.id        AS user_id,
    u.firstname AS nama_depan,
    u.lastname  AS nama_belakang,
    u.email     AS email,
    q.id        AS quiz_id,
    q.name      AS quiz_name,
    qa.sumgrades AS raw_score,
    q.sumgrades  AS max_score,
    qa.timefinish AS waktu_selesai
FROM {$prefix}user u
JOIN {$prefix}quiz_attempts qa ON qa.userid = u.id AND qa.state = 'finished'
JOIN {$prefix}quiz q ON q.id = qa.quiz AND q.course = :course_id
WHERE u.deleted = 0
  AND u.suspended = 0
  AND qa.attempt = (
      SELECT MAX(qa2.attempt)
      FROM {$prefix}quiz_attempts qa2
      WHERE qa2.userid = u.id AND qa2.quiz = q.id AND qa2.state = 'finished'
  )
ORDER BY u.lastname, u.firstname, q.id
";

$stmt = $pdo->prepare($sql);
$stmt->execute([':course_id' => $course_id]);
$rows = $stmt->fetchAll();

// =====================================================================
// QUERY 2: Ambil info course
// =====================================================================
$stmtC = $pdo->prepare("SELECT fullname, shortname FROM {$prefix}course WHERE id = :cid");
$stmtC->execute([':cid' => $course_id]);
$courseInfo = $stmtC->fetch();

// =====================================================================
// PROSES: Kelompokkan per siswa → format u(2).json
// =====================================================================
$students = [];

foreach ($rows as $row) {
    $email = $row['email'];
    if (!isset($students[$email])) {
        $students[$email] = [
            'user_id'     => $row['user_id'],
            'nama_depan'  => $row['nama_depan'],
            'nama_belakang' => $row['nama_belakang'],
            'email'       => $email,
            'kuis'        => []
        ];
    }

    // Hitung persentase score (0-100)
    $max = floatval($row['max_score']);
    $score = $max > 0 ? round((floatval($row['raw_score']) / $max) * 100, 2) : 0;

    $students[$email]['kuis'][] = [
        'quiz_id'   => $row['quiz_id'],
        'nama_kuis' => $row['quiz_name'],
        'nilai'     => $score,
        'max'       => $max,
        'raw'       => floatval($row['raw_score']),
        'selesai'   => $row['waktu_selesai'] ? date('Y-m-d H:i:s', $row['waktu_selesai']) : null
    ];
}

// Re-index array
$output = array_values($students);

// =====================================================================
// RESPONSE
// =====================================================================
echo json_encode([
    'status'      => 'ok',
    'course_id'   => $course_id,
    'course_name' => $courseInfo['fullname'] ?? 'Unknown',
    'generated'   => date('Y-m-d H:i:s'),
    'total_siswa' => count($output),
    'data'        => $output
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

