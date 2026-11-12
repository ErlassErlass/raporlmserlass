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
    u.id          AS user_id,
    u.firstname   AS nama_depan,
    u.lastname    AS nama_belakang,
    u.email       AS email,
    q.id          AS quiz_id,
    q.name        AS quiz_name,
    qa.uniqueid   AS usage_id,
    qa.sumgrades  AS raw_score,
    q.sumgrades   AS max_score,
    qa.timefinish AS waktu_selesai
FROM {$prefix}user u
JOIN {$prefix}quiz_attempts qa ON qa.userid = u.id AND qa.state = 'finished'
JOIN {$prefix}quiz q ON q.id = qa.quiz AND q.course = :course_id
JOIN {$prefix}course_modules cm ON cm.instance = q.id AND cm.course = q.course AND cm.deletioninprogress = 0
JOIN {$prefix}modules m ON m.id = cm.module AND m.name = 'quiz'
JOIN {$prefix}course_sections cs ON cs.id = cm.section AND cs.section > 0
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
// QUERY 2: Ambil info course & jumlah kuis asesmen aktif
// =====================================================================
$stmtC = $pdo->prepare("SELECT fullname, shortname FROM {$prefix}course WHERE id = :cid");
$stmtC->execute([':cid' => $course_id]);
$courseInfo = $stmtC->fetch();

$stmtTotalQ = $pdo->prepare("
    SELECT COUNT(DISTINCT q.id)
    FROM {$prefix}quiz q
    JOIN {$prefix}course_modules cm ON cm.instance = q.id AND cm.course = q.course
    JOIN {$prefix}modules m ON m.id = cm.module AND m.name = 'quiz'
    JOIN {$prefix}course_sections cs ON cs.id = cm.section
    WHERE q.course = :cid AND cm.visible = 1 AND cm.deletioninprogress = 0 AND cs.section > 0
");
$stmtTotalQ->execute([':cid' => $course_id]);
$totalKuis = intval($stmtTotalQ->fetchColumn());

// Helper: Ambil detail jawaban per slot pada question_attempts untuk usage_id tertentu
function getAttemptSlotDetails($pdo, $prefix, $usageId) {
    $stmt = $pdo->prepare("
        SELECT
            qat.id AS qattemptid,
            qat.slot,
            qat.questionid,
            qat.maxmark,
            q.name AS qname,
            qat.responsesummary,
            (
                SELECT qas2.fraction
                FROM {$prefix}question_attempt_steps qas2
                WHERE qas2.questionattemptid = qat.id AND qas2.fraction IS NOT NULL
                ORDER BY qas2.sequencenumber DESC LIMIT 1
            ) AS step_fraction,
            (
                SELECT qasd.value
                FROM {$prefix}question_attempt_steps qas
                JOIN {$prefix}question_attempt_step_data qasd ON qasd.attemptstepid = qas.id
                WHERE qas.questionattemptid = qat.id AND qasd.name = '_order'
                ORDER BY qas.sequencenumber DESC LIMIT 1
            ) AS order_ids,
            (
                SELECT qasd.value
                FROM {$prefix}question_attempt_steps qas
                JOIN {$prefix}question_attempt_step_data qasd ON qasd.attemptstepid = qas.id
                WHERE qas.questionattemptid = qat.id AND qasd.name = 'answer'
                ORDER BY qas.sequencenumber DESC LIMIT 1
            ) AS ans_idx
        FROM {$prefix}question_attempts qat
        JOIN {$prefix}question q ON q.id = qat.questionid
        WHERE qat.questionusageid = :uid
        ORDER BY qat.slot
    ");
    $stmt->execute([':uid' => $usageId]);
    return $stmt->fetchAll();
}

function resolveSelectedAnswerRecord($pdo, $prefix, $slotRow, &$answersCache) {
    $qid = intval($slotRow['questionid']);
    if (!isset($answersCache[$qid])) {
        $stA = $pdo->prepare("SELECT id, answer, fraction, feedback FROM {$prefix}question_answers WHERE question = :qid ORDER BY id");
        $stA->execute([':qid' => $qid]);
        $byId = [];
        foreach ($stA->fetchAll() as $a) {
            $byId[intval($a['id'])] = $a;
        }
        $answersCache[$qid] = $byId;
    }
    $options = $answersCache[$qid];
    if (!empty($slotRow['order_ids']) && $slotRow['ans_idx'] !== null && $slotRow['ans_idx'] !== '') {
        $orderArr = explode(',', $slotRow['order_ids']);
        $idx = intval($slotRow['ans_idx']);
        if (isset($orderArr[$idx])) {
            $ansId = intval($orderArr[$idx]);
            if (isset($options[$ansId])) {
                return $options[$ansId];
            }
        }
    }
    $summaryClean = trim(strip_tags((string)($slotRow['responsesummary'] ?? '')));
    if ($summaryClean !== '') {
        foreach ($options as $a) {
            if (trim(strip_tags($a['answer'])) === $summaryClean) {
                return $a;
            }
        }
    }
    return null;
}

$answersCache = [];
$likertWeights = [
    'hampir tidak pernah' => 0.00,
    'jarang'              => 0.25,
    'kadang-kadang'       => 0.50,
    'sering'              => 0.75,
    'hampir selalu'       => 1.00,
];
$miLabels = [
    'MI-1' => 'Minat (MI-1): Verbal & Komunikasi',
    'MI-2' => 'Minat (MI-2): Logika & Data',
    'MI-3' => 'Minat (MI-3): Sains & Investigasi',
    'MI-4' => 'Minat (MI-4): Visual & Desain',
    'MI-5' => 'Minat (MI-5): Musikal & Auditori',
    'MI-6' => 'Minat (MI-6): Kinestetik & Praktis',
    'MI-7' => 'Minat (MI-7): Sosial & Kolaborasi',
];
$bSubLabels = [
    'CUR' => 'Minat (B1): Rasa Ingin Tahu',
    'PER' => 'Minat (B2): Ketekunan Minat',
    'EXP' => 'Minat (B3): Eksplorasi Minat',
    'INV' => 'Minat (B4): Investasi Waktu',
    'AUT' => 'Minat (B5): Otonomi & Inisiatif',
];

// =====================================================================
// PROSES: Kelompokkan per siswa → format u(2).json
// =====================================================================
$students = [];

foreach ($rows as $row) {
    $email = $row['email'];
    if (!isset($students[$email])) {
        $students[$email] = [
            'user_id'       => $row['user_id'],
            'nama_depan'    => $row['nama_depan'],
            'nama_belakang' => $row['nama_belakang'],
            'email'         => $email,
            'kuis'          => []
        ];
    }

    $quizName = $row['quiz_name'];
    $raw = floatval($row['raw_score']);
    $max = floatval($row['max_score']);
    $score = $max > 0 ? round(($raw / $max) * 100, 2) : 0;
    $usageId = intval($row['usage_id']);
    $extraSubItems = [];

    // 1. Penanganan khusus Kuis Ipsatif Forced-Choice "Preferensi Minat" (MI-1..MI-7)
    if (stripos($quizName, 'PREFERENSI MINAT') !== false || ($max > 0 && $raw == 0.0 && stripos($quizName, 'Minat') !== false)) {
        $slots = getAttemptSlotDetails($pdo, $prefix, $usageId);
        $miAppearances = [];
        $miSelected = [];
        foreach (array_keys($miLabels) as $code) {
            $miAppearances[$code] = 0;
            $miSelected[$code] = 0;
        }
        $hasMiTags = false;
        foreach ($slots as $slotRow) {
            $chosen = resolveSelectedAnswerRecord($pdo, $prefix, $slotRow, $answersCache);
            $qid = intval($slotRow['questionid']);
            foreach ($answersCache[$qid] ?? [] as $opt) {
                $tag = strtoupper(trim(strip_tags((string)$opt['feedback'])));
                if (isset($miAppearances[$tag])) {
                    $miAppearances[$tag]++;
                    $hasMiTags = true;
                }
            }
            if ($chosen) {
                $chosenTag = strtoupper(trim(strip_tags((string)$chosen['feedback'])));
                if (isset($miSelected[$chosenTag])) {
                    $miSelected[$chosenTag]++;
                }
            }
        }
        if ($hasMiTags) {
            $counts = array_values($miSelected);
            rsort($counts);
            $top2 = ($counts[0] ?? 0) + ($counts[1] ?? 0);
            $maxPair = max(1, round(count($slots) * 18 / 21));
            $score = min(100, round(($top2 / $maxPair) * 100, 2));
            $raw = $top2;

            foreach ($miLabels as $code => $label) {
                $app = max(1, $miAppearances[$code]);
                $cnt = $miSelected[$code];
                $extraSubItems[] = [
                    'quiz_id'         => $row['quiz_id'] . '_' . $code,
                    'nama_kuis'       => $label,
                    'nilai'           => round(($cnt / $app) * 100, 2),
                    'max'             => $app,
                    'raw'             => $cnt,
                    'selesai'         => $row['waktu_selesai'] ? date('Y-m-d H:i:s', $row['waktu_selesai']) : null,
                    'is_subdimension' => true,
                ];
            }
        }
    }
    // 2. Penanganan sub-dimensi Kedalaman Minat (CUR, PER, EXP, INV, AUT)
    else if (stripos($quizName, 'KEDALAMAN') !== false && stripos($quizName, 'MINAT') !== false) {
        $slots = getAttemptSlotDetails($pdo, $prefix, $usageId);
        $subSum = [];
        $subCnt = [];
        foreach ($slots as $slotRow) {
            if (preg_match('/[—-]\s*(CUR|PER|EXP|INV|AUT)\b/i', $slotRow['qname'], $m)) {
                $code = strtoupper($m[1]);
                if (!isset($subSum[$code])) {
                    $subSum[$code] = 0.0;
                    $subCnt[$code] = 0;
                }
                $frac = $slotRow['step_fraction'] !== null ? floatval($slotRow['step_fraction']) : 0.0;
                $subSum[$code] += $frac * 100.0;
                $subCnt[$code]++;
            }
        }
        foreach ($bSubLabels as $code => $label) {
            if (!empty($subCnt[$code])) {
                $extraSubItems[] = [
                    'quiz_id'         => $row['quiz_id'] . '_' . $code,
                    'nama_kuis'       => $label,
                    'nilai'           => round($subSum[$code] / $subCnt[$code], 2),
                    'max'             => $subCnt[$code],
                    'raw'             => round($subSum[$code] / 100.0, 2),
                    'selesai'         => $row['waktu_selesai'] ? date('Y-m-d H:i:s', $row['waktu_selesai']) : null,
                    'is_subdimension' => true,
                ];
            }
        }
    }
    // 3. Kompensasi read-only item Likert 5-opsi di Moodle yang fraction-nya 0.00 semua (mis. EQ A, B, C)
    else if ($max > 0 && $raw < $max && stripos($quizName, 'EQ:') !== false) {
        $slots = getAttemptSlotDetails($pdo, $prefix, $usageId);
        $adjustedRaw = 0.0;
        $hasCompensated = false;
        foreach ($slots as $slotRow) {
            $slotMax = floatval($slotRow['maxmark'] ?? 1.0);
            $stepFrac = $slotRow['step_fraction'] !== null ? floatval($slotRow['step_fraction']) : 0.0;
            $chosen = resolveSelectedAnswerRecord($pdo, $prefix, $slotRow, $answersCache);
            $qid = intval($slotRow['questionid']);
            $maxOptFrac = 0.0;
            $isStandardLikert = true;
            $opts = $answersCache[$qid] ?? [];
            if (count($opts) === 5) {
                foreach ($opts as $opt) {
                    $maxOptFrac = max($maxOptFrac, floatval($opt['fraction']));
                    $txt = strtolower(trim(strip_tags($opt['answer'])));
                    if (!array_key_exists($txt, $likertWeights)) {
                        $isStandardLikert = false;
                    }
                }
            } else {
                $isStandardLikert = false;
            }
            if ($isStandardLikert && $maxOptFrac == 0.0 && $chosen) {
                $txt = strtolower(trim(strip_tags($chosen['answer'])));
                $w = $likertWeights[$txt] ?? 0.0;
                $adjustedRaw += $w * $slotMax;
                $hasCompensated = true;
            } else {
                $adjustedRaw += $stepFrac * $slotMax;
            }
        }
        if ($hasCompensated) {
            $raw = round($adjustedRaw, 2);
            $score = min(100, round(($raw / $max) * 100, 2));
        }
    }

    $students[$email]['kuis'][] = [
        'quiz_id'   => $row['quiz_id'],
        'nama_kuis' => $quizName,
        'nilai'     => $score,
        'max'       => $max,
        'raw'       => $raw,
        'selesai'   => $row['waktu_selesai'] ? date('Y-m-d H:i:s', $row['waktu_selesai']) : null
    ];

    foreach ($extraSubItems as $sub) {
        $students[$email]['kuis'][] = $sub;
    }
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
    'total_kuis'  => $totalKuis,
    'generated'   => date('Y-m-d H:i:s'),
    'total_siswa' => count($output),
    'data'        => $output
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

