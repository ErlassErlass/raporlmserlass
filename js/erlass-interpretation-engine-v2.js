/**
 * ERLASS — MASTER INTERPRETATION ENGINE v2 (Full Master Edition)
 * =============================================================
 * Menyelaraskan seluruh modul asesmen Erlass dengan dokumen resmi:
 * "MASTER INTERPRETASI Minat & Potensi, EQ, SQ, dan IQ / Kognitif"
 *
 * Cakupan:
 *  1. Minat & Potensi (6 Sumbu A-F: Preferensi, Kedalaman, Kognitif, Kreatif, Motorik, Sosial)
 *     - Matriks Minat A+B (M1–M9)
 *     - 15 Pola Kombinasi Potensi C-F (1 Tinggi, 2 Tinggi, 3 Tinggi, 4 Tinggi / Profil Potensi Luas)
 *     - Kondisi Tanpa Nilai Tinggi (Semua Sedang, Sedang + Rendah, 1 Sedang, Semua Rendah)
 *     - 4 Jenjang: SD Kelas 1–3, SD Kelas 4–6, SMP, SMA/SMK
 *  2. SQ / Kecerdasan Reflektif-Nilai (4 Sumbu: Nilai, Tujuan, Refleksi, Kepedulian)
 *     - 15 Pola Kombinasi + Kondisi Sedang/Rendah
 *     - 3 Jenjang: SD Kelas 4–6, SMP, SMA/SMK
 *  3. EQ / Kecerdasan Emosional-Sosial (4 Sumbu: Kesadaran Diri, Pengendalian Diri, Empati, Relasi)
 *     - 15 Pola Kombinasi + Kondisi Sedang/Rendah
 *     - 3 Jenjang: SD Kelas 4–6, SMP, SMA/SMK
 *  4. IQ / Profil Kemampuan Kognitif (6 Sumbu A-F + Indeks Kognitif)
 *     - 5 Kategori Normatif (Mean 100, SD 15)
 *     - Pola Radar K1 (Merata), K2 (Kekuatan Relatif), K3 (Area Relatif Rendah), K4 (Profil Beragam / Scatter)
 *     - Sinergi Indeks + Radar
 *     - 3 Jenjang: SD Kelas 4–6, SMP, SMA/SMK
 *  5. Aturan Psikometrik Master:
 *     - Selisih <= 5 poin dianggap "relatif setara" (menghindari presisi palsu)
 *     - Bahasa non-diagnostik (anti-labeling, tidak ada vonis "IQ rendah", "anak emosional", dll)
 *     - Format Output 4 Komponen Seragam:
 *       (1) Interpretasi Profil (80–150 kata)
 *       (2) Kekuatan Utama
 *       (3) Area Pengembangan
 *       (4) Rekomendasi
 */

// =========================================================================
// 1. KLASIFIKASI R/S/T (Rendah / Sedang / Tinggi)
// =========================================================================
const RST_THRESHOLDS = { T_MIN: 70, S_MIN: 40 };

function classifyRST(score) {
  const n = parseFloat(score);
  if (isNaN(n)) return 'S';
  if (n >= RST_THRESHOLDS.T_MIN) return 'T';
  if (n >= RST_THRESHOLDS.S_MIN) return 'S';
  return 'R';
}

const RST_LABEL = { R: 'Rendah', S: 'Sedang', T: 'Tinggi' };

// =========================================================================
// 2. DETEKSI JENJANG PENDIDIKAN
// =========================================================================
function detectJenjang(namaCourse) {
  const s = (namaCourse || '').toUpperCase();
  if (/SD\s*KELAS\s*[1-3]\b|SD\s*1\s*[-–]\s*3/.test(s)) return 'SD_1_3';
  if (/SD\s*KELAS\s*[4-6]\b|SD\s*4\s*[-–]\s*6/.test(s)) return 'SD_4_6';
  if (/\bSMP\b/.test(s)) return 'SMP';
  if (/\bSMA\b|\bSMK\b/.test(s)) return 'SMA';
  return 'SD_4_6'; // Default aktif
}

const JENJANG_LABEL = {
  SD_1_3: 'SD Kelas 1–3',
  SD_4_6: 'SD Kelas 4–6',
  SMP: 'SMP',
  SMA: 'SMA/SMK'
};

// =========================================================================
// 3. ATURAN SELISIH NILAI (DELTA <= 5 POIN = RELATIF SETARA) & POLA PROFIL
// =========================================================================
function computeProfilePattern(items, tolerance = 5) {
  if (!items || items.length < 2) return null;

  const sorted = [...items].sort((a, b) => b.nilai - a.nilai);
  const max = sorted[0].nilai;
  const min = sorted[sorted.length - 1].nilai;
  const range = max - min;

  const strengths = sorted.filter(it => (max - it.nilai) <= tolerance);
  const developmentAreas = sorted.filter(it => (it.nilai - min) <= tolerance && it.nilai < RST_THRESHOLDS.T_MIN);

  let pattern;
  if (range <= tolerance) {
    pattern = 'K1_MERATA';
  } else if (range > 15 && strengths.length < sorted.length && developmentAreas.length < sorted.length) {
    pattern = 'K4_BERAGAM';
  } else if (strengths.length < sorted.length) {
    pattern = 'K2_ADA_KEKUATAN';
  } else {
    pattern = 'K3_ADA_AREA_BERKEMBANG';
  }

  return { pattern, strengths, developmentAreas, range, max, min, sorted };
}

// =========================================================================
// 4. MASTER BANK: MINAT DAN POTENSI (A–F)
// =========================================================================

// Domain Metadata
const DOMAIN_MINAT_POTENSI = {
  A: { kode: 'A', nama: 'Preferensi Minat', fungsi: 'Arah ketertarikan' },
  B: { kode: 'B', nama: 'Kedalaman Minat', fungsi: 'Kekuatan keterlibatan' },
  C: { kode: 'C', nama: 'Penalaran/Kognitif', fungsi: 'Potensi berpikir dan memecahkan masalah', labelSingkat: 'Penalaran' },
  D: { kode: 'D', nama: 'Kreatif-Visual-Musikal', fungsi: 'Potensi kreatif dan representasional', labelSingkat: 'Kreativitas' },
  E: { kode: 'E', nama: 'Motorik-Kinestetik', fungsi: 'Potensi koordinasi dan keterampilan gerak', labelSingkat: 'Praktis/Motorik' },
  F: { kode: 'F', nama: 'Sosial-Komunikasi-Kolaborasi', fungsi: 'Potensi interpersonal', labelSingkat: 'Sosial-Komunikasi' }
};

// 4.1 MASTER MINAT A+B (M1 - M9) PER JENJANG
const MASTER_MINAT_AB = {
  SMA: {
    'T+T': { kode: 'M1', teks: 'Siswa menunjukkan minat yang jelas dan mendalam. Siswa tidak hanya menunjukkan preferensi terhadap bidang tertentu, tetapi juga kecenderungan untuk terlibat, mengeksplorasi, dan mengembangkan minat tersebut.' },
    'T+S': { kode: 'M2', teks: 'Siswa telah menunjukkan arah minat yang cukup jelas, sementara kedalaman keterlibatannya masih berkembang. Pengalaman yang lebih terarah dapat membantu memperkuat minat tersebut.' },
    'T+R': { kode: 'M3', teks: 'Siswa menunjukkan preferensi yang jelas terhadap bidang tertentu, tetapi ketertarikan tersebut belum banyak disertai keterlibatan atau eksplorasi yang mendalam.' },
    'S+T': { kode: 'M4', teks: 'Siswa menunjukkan keterlibatan yang kuat dalam aktivitas yang diminati, meskipun arah preferensinya masih cukup luas. Eksplorasi lebih lanjut dapat membantu menemukan bidang yang paling sesuai.' },
    'S+S': { kode: 'M5', teks: 'Minat siswa berada dalam tahap cukup berkembang. Beberapa ketertarikan mulai terlihat, tetapi siswa masih terbuka terhadap berbagai pengalaman dan bidang kegiatan.' },
    'S+R': { kode: 'M6', teks: 'Beberapa preferensi mulai terlihat, tetapi keterlibatan terhadap bidang tersebut masih terbatas. Siswa masih membutuhkan kesempatan eksplorasi yang lebih beragam.' },
    'R+T': { kode: 'M7', teks: 'Siswa belum menunjukkan satu arah preferensi yang dominan, tetapi terdapat kemauan untuk terlibat secara mendalam pada aktivitas tertentu. Pengalaman yang lebih beragam dapat membantu memperjelas arah minat.' },
    'R+S': { kode: 'M8', teks: 'Arah minat siswa masih cukup terbuka. Ketertarikan dapat berkembang melalui kesempatan mencoba berbagai aktivitas dan pengalaman baru.' },
    'R+R': { kode: 'M9', teks: 'Profil minat siswa masih berada pada tahap eksplorasi. Belum terlihat konsentrasi minat yang kuat sehingga pengalaman yang beragam masih sangat penting.' }
  },
  SMP: {
    'T+T': { kode: 'M1', teks: 'Siswa menunjukkan arah minat yang jelas dan cukup mendalam. Ketertarikan terhadap bidang tertentu juga disertai kecenderungan untuk mengeksplorasi, terlibat, dan mengembangkannya lebih jauh.' },
    'T+S': { kode: 'M2', teks: 'Siswa telah menunjukkan arah minat yang jelas, sementara kedalaman keterlibatannya masih berkembang. Pengalaman yang lebih menantang dapat membantu memperkuat minat tersebut.' },
    'T+R': { kode: 'M3', teks: 'Preferensi terhadap bidang tertentu sudah terlihat, tetapi belum banyak disertai eksplorasi atau keterlibatan yang lebih mendalam.' },
    'S+T': { kode: 'M4', teks: 'Siswa menunjukkan keterlibatan yang kuat dalam kegiatan yang diminati, meskipun arah preferensinya masih cukup luas.' },
    'S+S': { kode: 'M5', teks: 'Minat siswa cukup berkembang, tetapi masih terbuka terhadap beberapa bidang. Masa ini baik digunakan untuk memperluas pengalaman dan mengenali bidang yang paling menarik.' },
    'S+R': { kode: 'M6', teks: 'Beberapa ketertarikan sudah terlihat, tetapi keterlibatan lebih lanjut masih terbatas. Eksplorasi berbagai kegiatan masih diperlukan.' },
    'R+T': { kode: 'M7', teks: 'Arah preferensi belum terkonsentrasi pada bidang tertentu, tetapi siswa dapat menunjukkan keterlibatan kuat ketika menemukan kegiatan yang menarik.' },
    'R+S': { kode: 'M8', teks: 'Arah minat masih cukup terbuka. Pengalaman yang lebih beragam dapat membantu siswa mengenali bidang yang ingin dipelajari lebih jauh.' },
    'R+R': { kode: 'M9', teks: 'Minat siswa masih berada pada tahap eksplorasi. Belum perlu terburu-buru menentukan satu bidang utama; pengalaman yang beragam akan membantu proses mengenal diri.' }
  },
  SD_4_6: {
    'T+T': { kode: 'M1', teks: 'Siswa menunjukkan arah minat yang cukup jelas dan mendalam. Ia tidak hanya tertarik pada bidang tertentu, tetapi juga menunjukkan keinginan untuk terlibat dan mempelajarinya lebih jauh.' },
    'T+S': { kode: 'M2', teks: 'Siswa telah menunjukkan arah minat yang cukup jelas, sementara keterlibatan lebih mendalam masih berkembang.' },
    'T+R': { kode: 'M3', teks: 'Siswa menunjukkan pilihan kegiatan yang cukup jelas, tetapi minat tersebut belum banyak disertai eksplorasi atau keterlibatan lebih lanjut.' },
    'S+T': { kode: 'M4', teks: 'Siswa masih terbuka terhadap beberapa bidang, tetapi mampu menunjukkan keterlibatan yang kuat pada kegiatan yang menarik baginya.' },
    'S+S': { kode: 'M5', teks: 'Minat siswa cukup berkembang dan masih terbuka terhadap beberapa bidang kegiatan.' },
    'S+R': { kode: 'M6', teks: 'Beberapa ketertarikan sudah mulai terlihat, tetapi siswa masih membutuhkan kesempatan untuk mencoba lebih banyak kegiatan.' },
    'R+T': { kode: 'M7', teks: 'Arah pilihan siswa belum terlalu jelas, tetapi ia dapat menunjukkan keterlibatan yang kuat ketika menemukan aktivitas yang menarik.' },
    'R+S': { kode: 'M8', teks: 'Minat siswa masih cukup luas. Pengalaman pada berbagai kegiatan dapat membantu memperjelas bidang yang paling disukai.' },
    'R+R': { kode: 'M9', teks: 'Minat siswa masih berada pada tahap eksplorasi. Kesempatan mencoba berbagai kegiatan masih lebih penting daripada menentukan satu bidang utama.' }
  },
  SD_1_3: {
    'T+T': { kode: 'M1', teks: 'Anak menunjukkan ketertarikan yang cukup jelas dan kuat pada kegiatan tertentu. Ia juga terlihat senang terlibat dan mencoba lebih jauh ketika menemukan kegiatan yang disukainya.' },
    'T+S': { kode: 'M2', teks: 'Anak mulai menunjukkan kegiatan yang lebih disukai, meskipun keterlibatannya masih dapat berubah sesuai pengalaman yang diperoleh.' },
    'T+R': { kode: 'M3', teks: 'Anak sudah menunjukkan beberapa kegiatan yang lebih disukai, tetapi ketertarikannya belum selalu diikuti keinginan untuk melakukannya lebih jauh.' },
    'S+T': { kode: 'M4', teks: 'Anak cukup terbuka terhadap berbagai kegiatan, tetapi ketika menemukan kegiatan yang menarik, ia dapat menunjukkan keterlibatan yang kuat.' },
    'S+S': { kode: 'M5', teks: 'Minat anak mulai berkembang. Ia masih tertarik mencoba berbagai kegiatan dan belum perlu diarahkan hanya pada satu bidang.' },
    'S+R': { kode: 'M6', teks: 'Beberapa ketertarikan mulai terlihat, tetapi anak masih membutuhkan banyak kesempatan mencoba kegiatan yang berbeda.' },
    'R+T': { kode: 'M7', teks: 'Anak belum menunjukkan pilihan bidang yang sangat jelas, tetapi dapat terlibat kuat ketika menemukan kegiatan yang menarik baginya.' },
    'R+S': { kode: 'M8', teks: 'Minat anak masih terbuka dan berkembang. Berbagai pengalaman bermain dan belajar dapat membantu ketertarikannya semakin terlihat.' },
    'R+R': { kode: 'M9', teks: 'Minat anak masih dalam tahap eksplorasi awal. Berikan kesempatan mencoba berbagai kegiatan tanpa terburu-buru menentukan bidang tertentu.' }
  }
};

// 4.2 MASTER KOMBINASI POTENSI C–F PER JENJANG
const MASTER_POTENSI_CF = {
  SMA: {
    // 1 Tinggi
    single: {
      C: { profil: 'Penalaran', teks: 'Kekuatan utama terlihat pada penalaran dan pemecahan masalah. Siswa berpotensi berkembang melalui aktivitas analitis, pemecahan masalah, investigasi, dan tantangan yang membutuhkan pemikiran sistematis.', rek: ['pemecahan masalah', 'coding', 'analisis data', 'eksperimen', 'investigasi'] },
      D: { profil: 'Kreatif', teks: 'Kekuatan utama terlihat pada kreativitas dan pengolahan gagasan. Siswa layak memperoleh ruang untuk menghasilkan, memvisualisasikan, dan mengembangkan ide melalui berbagai media.', rek: ['desain', 'media digital', 'karya visual', 'musik', 'produksi kreatif'] },
      E: { profil: 'Motorik', teks: 'Kekuatan utama terlihat pada kemampuan motorik-kinestetik. Aktivitas praktik, koordinasi gerak, keterampilan fisik, dan pembelajaran melalui tindakan layak dikembangkan.', rek: ['olahraga', 'praktik teknis', 'kegiatan lapangan', 'keterampilan gerak', 'aktivitas performa'] },
      F: { profil: 'Sosial', teks: 'Kekuatan utama terlihat pada kemampuan sosial dan komunikasi. Siswa berpotensi berkembang melalui diskusi, kerja tim, presentasi, organisasi, dan kegiatan kolaboratif.', rek: ['presentasi', 'organisasi', 'diskusi', 'proyek kelompok', 'kegiatan sosial'] }
    },
    // 2 Tinggi
    pair: {
      'C+D': { profil: 'Analitis-Kreatif', teks: 'Siswa menunjukkan kombinasi kemampuan penalaran dan kreativitas yang menonjol. Ia berpotensi baik dalam aktivitas yang membutuhkan pemecahan masalah sekaligus pengembangan gagasan baru.', rek: ['desain produk', 'coding kreatif', 'media analitis', 'pemodelan konsep', 'riset inovatif'] },
      'C+E': { profil: 'Analitis-Praktis', teks: 'Siswa menunjukkan kombinasi kemampuan berpikir dan keterampilan praktik yang menonjol. Ia cenderung mendapat manfaat dari kegiatan yang menghubungkan pemecahan masalah dengan penerapan langsung.', rek: ['robotika', 'rekayasa teknologi', 'eksperimen terapan', 'coding perangkat keras', 'proyek STEM'] },
      'C+F': { profil: 'Analitis-Sosial', teks: 'Siswa menunjukkan kombinasi kemampuan penalaran dan sosial-komunikasi yang menonjol. Aktivitas yang membutuhkan analisis, diskusi, penyampaian gagasan, dan pemecahan masalah bersama layak dikembangkan.', rek: ['debat data', 'penelitian sosial', 'manajemen proyek', 'presentasi analitis', 'organisasi tim'] },
      'D+E': { profil: 'Kreatif-Praktis', teks: 'Siswa menunjukkan kombinasi kreativitas dan kemampuan motorik yang menonjol. Kegiatan membuat, merancang, mempraktikkan, atau menghasilkan karya nyata dapat menjadi sarana pengembangan yang baik.', rek: ['produksi multimedia', 'desain kerajinan/kriya', 'seni performa', 'maket & prototype', 'kreasi visual terapan'] },
      'D+F': { profil: 'Kreatif-Komunikatif', teks: 'Siswa menunjukkan kombinasi kreativitas dan kemampuan sosial-komunikasi yang menonjol. Kegiatan kreatif yang melibatkan presentasi, media, kolaborasi, dan produksi bersama layak dikembangkan.', rek: ['produksi media', 'kampanye kreatif', 'public relations', 'broadcasting', 'event management kreatif'] },
      'E+F': { profil: 'Praktis-Kolaboratif', teks: 'Siswa menunjukkan kombinasi kemampuan praktik dan sosial yang menonjol. Aktivitas berbasis tim, performa, praktik lapangan, dan koordinasi kelompok dapat menjadi lingkungan pengembangan yang sesuai.', rek: ['olahraga beregu', 'kegiatan lapangan kelompok', 'logistik organisasi', 'pelayanan komunitas', 'simulasi kerja tim'] }
    },
    // 3 Tinggi
    triple: {
      'C+D+E': { profil: 'Analitis, Kreatif, dan Praktis', teks: 'Siswa menunjukkan kombinasi yang menonjol dalam penalaran, kreativitas, dan kemampuan praktik. Profil ini mendukung aktivitas yang memungkinkan siswa memahami masalah, merancang gagasan, kemudian mewujudkannya dalam bentuk tindakan, karya, atau produk.', rek: ['proyek STEM', 'robotika', 'teknologi', 'desain produk', 'eksperimen', 'coding berbasis perangkat', 'proyek rekayasa'] },
      'C+D+F': { profil: 'Analitis, Kreatif, dan Komunikatif', teks: 'Siswa menunjukkan kombinasi yang menonjol dalam penalaran, kreativitas, dan kemampuan sosial-komunikasi. Ia berpotensi berkembang baik dalam kegiatan yang membutuhkan analisis, pengembangan ide, penyampaian gagasan, dan kolaborasi.', rek: ['proyek penelitian', 'coding kolaboratif', 'media digital', 'presentasi', 'debat berbasis data', 'pengembangan produk kreatif'] },
      'C+E+F': { profil: 'Analitis, Praktis, dan Kolaboratif', teks: 'Siswa menunjukkan kombinasi yang menonjol dalam pemecahan masalah, keterampilan praktik, dan kemampuan bekerja bersama orang lain. Profil ini mendukung kegiatan yang membutuhkan perencanaan, tindakan langsung, koordinasi, dan kerja tim.', rek: ['proyek lapangan', 'kegiatan teknologi', 'organisasi kegiatan', 'proyek STEM kelompok', 'kegiatan olahraga beregu atau aktivitas praktik kolaboratif'] },
      'D+E+F': { profil: 'Kreatif, Praktis, dan Komunikatif', teks: 'Siswa menunjukkan kombinasi yang menonjol dalam kreativitas, keterampilan praktik, dan kemampuan sosial-komunikasi. Ia berpotensi berkembang melalui kegiatan yang memungkinkan gagasan diwujudkan menjadi karya atau performa bersama orang lain.', rek: ['produksi media', 'seni pertunjukan', 'desain', 'proyek kreatif kelompok', 'event sekolah', 'kegiatan praktik berbasis karya'] }
    },
    // 4 Tinggi
    all: {
      profil: 'Profil Potensi Luas',
      teks: 'Siswa menunjukkan potensi yang menonjol pada berbagai jenis aktivitas, meliputi penalaran, kreativitas, kemampuan motorik-praktis, serta sosial-komunikasi. Profil yang luas seperti ini menunjukkan bahwa siswa memiliki beberapa jalur pengembangan yang sama-sama potensial. Karena tidak hanya satu area yang menonjol, pemilihan kegiatan sebaiknya mempertimbangkan minat yang paling kuat, pengalaman yang paling bermakna, serta bidang yang ingin dikembangkan lebih mendalam.',
      rek: ['proyek multidisiplin', 'kegiatan kepemimpinan', 'eksplorasi bidang komprehensif', 'program riset terapan dan kreasi mandiri']
    },
    // Fallback Tanpa Nilai Tinggi
    noHigh: {
      allSedang: 'Profil potensi relatif merata. Kemampuan pada berbagai bidang berada pada tingkat cukup berkembang dan belum terlihat satu area yang sangat dominan. Siswa sebaiknya memperoleh pengalaman yang beragam agar kekuatan yang lebih spesifik dapat berkembang dan semakin terlihat.',
      sedangWithRendah: 'Profil potensi cukup merata pada beberapa aspek, sementara kemampuan yang diamati pada area lainnya belum terlihat sekuat area tersebut pada asesmen saat ini. Pengembangan dapat difokuskan pada bidang yang paling diminati siswa tanpa menutup kesempatan untuk memperkuat area lainnya.',
      oneSedang: 'Profil potensi masih berkembang. Pada asesmen saat ini, area tertentu terlihat relatif lebih berkembang dibandingkan area lainnya. Pengalaman belajar yang lebih beragam dan berkelanjutan diperlukan untuk membantu potensi siswa semakin terlihat.',
      allRendah: 'Potensi yang diukur belum terlihat menonjol secara konsisten pada asesmen saat ini. Hasil ini tidak berarti siswa tidak memiliki kemampuan atau potensi. Pengalaman, kesempatan belajar, kondisi saat asesmen, dan latihan dapat memengaruhi performa. Disarankan memberikan kesempatan eksplorasi yang lebih luas dan mengamati perkembangan siswa melalui aktivitas nyata.'
    }
  },

  SMP: {
    single: {
      C: { profil: 'Penalaran', teks: 'Kekuatan utama terlihat pada kemampuan menganalisis dan memecahkan masalah. Tantangan logika, matematika, sains, coding, dan investigasi dapat menjadi sarana pengembangan.', rek: ['tantangan logika', 'matematika & sains', 'coding', 'investigasi sederhana'] },
      D: { profil: 'Kreatif', teks: 'Kekuatan utama terlihat pada pengembangan gagasan kreatif. Desain, media, seni, musik, penulisan kreatif, dan produksi karya layak dieksplorasi.', rek: ['desain digital', 'karya seni & musik', 'penulisan kreatif', 'produksi media'] },
      E: { profil: 'Praktis-Motorik', teks: 'Kekuatan utama terlihat pada kemampuan motorik dan praktik. Aktivitas olahraga, praktik, keterampilan teknis, dan kegiatan lapangan dapat dikembangkan.', rek: ['olahraga', 'kegiatan lapangan', 'keterampilan tangan teknis', 'eksperimen praktik'] },
      F: { profil: 'Sosial-Komunikatif', teks: 'Kekuatan utama terlihat pada kemampuan sosial dan komunikasi. Presentasi, organisasi, diskusi, kerja kelompok, dan kegiatan sosial dapat dikembangkan.', rek: ['organisasi siswa', 'presentasi & debat', 'kerja kelompok', 'kegiatan sosial'] }
    },
    pair: {
      'C+D': { profil: 'Analitis-Kreatif', teks: 'Siswa menunjukkan kombinasi kemampuan analitis dan kreatif. Ia berpotensi berkembang melalui kegiatan yang membutuhkan pemecahan masalah sekaligus penciptaan gagasan baru.', rek: ['coding game', 'desain berbasis logika', 'proyek sains kreatif', 'pemecahan teka-teki visual'] },
      'C+E': { profil: 'Analitis-Praktis', teks: 'Siswa menunjukkan kombinasi penalaran dan kemampuan praktik. Kegiatan STEM, robotika, eksperimen, teknologi, dan proyek berbasis produk layak dikembangkan.', rek: ['robotika pemula', 'proyek STEM', 'eksperimen sains terapan', 'perakitan model teknis'] },
      'C+F': { profil: 'Analitis-Sosial', teks: 'Siswa menunjukkan kombinasi penalaran dan kemampuan sosial-komunikasi. Diskusi berbasis data, proyek penelitian kelompok, presentasi, dan pemecahan masalah bersama dapat dikembangkan.', rek: ['proyek penelitian kelompok', 'diskusi data', 'presentasi ilmiah', 'forum diskusi siswa'] },
      'D+E': { profil: 'Kreatif-Praktis', teks: 'Siswa menunjukkan kombinasi kreativitas dan keterampilan praktik. Desain, produksi media, karya, performa, dan proyek berbasis produk dapat menjadi sarana pengembangan.', rek: ['karya kerajinan tangan', 'pembuatan konten media', 'seni performa', 'tata panggung & desain'] },
      'D+F': { profil: 'Kreatif-Komunikatif', teks: 'Siswa menunjukkan kombinasi kreativitas dan komunikasi. Media digital, presentasi kreatif, produksi konten, seni, dan proyek kolaboratif layak dieksplorasi.', rek: ['konten digital kolaboratif', 'majalah dinding/sekolah', 'teater/seni peran', 'presentasi kreatif kelompok'] },
      'E+F': { profil: 'Praktis-Kolaboratif', teks: 'Siswa menunjukkan kombinasi kemampuan praktik dan kolaborasi. Kegiatan tim, organisasi, olahraga, proyek lapangan, dan aktivitas praktik kelompok dapat dikembangkan.', rek: ['olahraga beregu', 'kepanitiaan kegiatan', 'eksplorasi alam kelompok', 'aktivitas tim lapangan'] }
    },
    triple: {
      'C+D+E': { profil: 'Analitis, Kreatif, dan Praktis', teks: 'Siswa menunjukkan kombinasi kemampuan analitis, kreatif, dan praktis yang menonjol. Proyek STEM, robotika, coding dengan perangkat, eksperimen, desain produk, dan kegiatan teknologi dapat menjadi sarana pengembangan yang baik.', rek: ['proyek STEM', 'robotika', 'coding perangkat', 'eksperimen', 'desain produk', 'kegiatan teknologi'] },
      'C+D+F': { profil: 'Analitis, Kreatif, dan Komunikatif', teks: 'Siswa menunjukkan kombinasi penalaran, kreativitas, dan komunikasi yang menonjol. Kegiatan penelitian, media digital, coding kolaboratif, presentasi, dan proyek kreatif kelompok layak dikembangkan.', rek: ['kegiatan penelitian', 'media digital', 'coding kolaboratif', 'presentasi', 'proyek kreatif kelompok'] },
      'C+E+F': { profil: 'Analitis, Praktis, dan Kolaboratif', teks: 'Siswa menunjukkan kombinasi penalaran, kemampuan praktik, dan kolaborasi yang menonjol. Proyek teknologi, kegiatan lapangan, STEM kelompok, dan aktivitas organisasi dapat menjadi pilihan pengembangan.', rek: ['proyek teknologi', 'kegiatan lapangan', 'STEM kelompok', 'aktivitas organisasi'] },
      'D+E+F': { profil: 'Kreatif, Praktis, dan Komunikatif', teks: 'Siswa menunjukkan kombinasi kreativitas, keterampilan praktik, dan kemampuan sosial yang menonjol. Produksi media, kegiatan seni, event, proyek kreatif, performa, dan kegiatan kelompok dapat dieksplorasi.', rek: ['produksi media', 'kegiatan seni', 'event sekolah', 'proyek kreatif', 'performa kelompok'] }
    },
    all: {
      profil: 'Profil Potensi Luas',
      teks: 'Siswa menunjukkan profil potensi yang luas pada kemampuan penalaran, kreativitas, praktik-motorik, serta sosial-komunikasi. Beberapa jalur pengembangan sama-sama terbuka. Minat dan pengalaman siswa dapat digunakan untuk menentukan bidang mana yang ingin dieksplorasi lebih mendalam.',
      rek: ['proyek eksplorasi multidisiplin', 'kegiatan organisasi dan minat bakat terintegrasi']
    },
    noHigh: {
      allSedang: 'Profil potensi relatif merata dan cukup berkembang. Belum terlihat satu bidang yang sangat dominan dibandingkan bidang lainnya. Kondisi ini memberikan ruang yang luas bagi siswa untuk mencoba berbagai kegiatan dan mengenali bidang yang paling sesuai dengan minatnya.',
      sedangWithRendah: 'Beberapa kemampuan sudah terlihat cukup berkembang, sementara area lainnya masih memerlukan pengalaman dan latihan. Pengembangan sebaiknya dimulai dari bidang yang paling diminati sambil tetap memberikan kesempatan untuk memperkuat kemampuan lainnya.',
      oneSedang: 'Profil potensi masih berkembang. Pada asesmen saat ini, area tertentu terlihat relatif lebih berkembang. Pengalaman belajar yang beragam akan membantu mengenali kekuatan diri.',
      allRendah: 'Potensi yang diukur belum terlihat menonjol secara konsisten pada asesmen saat ini. Hasil ini tidak berarti siswa tidak memiliki potensi. Pengalaman belajar, kesempatan mencoba, latihan, dan perkembangan dapat membantu kemampuan tertentu semakin terlihat.'
    }
  },

  SD_4_6: {
    single: {
      C: { profil: 'Penalaran', teks: 'Kekuatan utama terlihat pada penalaran dan pemecahan masalah. Kegiatan teka-teki logika, eksperimen, matematika, coding, dan penyelidikan sederhana layak dikembangkan.', rek: ['teka-teki logika', 'eksperimen sederhana', 'matematika menyenangkan', 'coding pemula (Scratch)'] },
      D: { profil: 'Kreativitas', teks: 'Kekuatan utama terlihat pada kreativitas. Kegiatan desain, menggambar, musik, membuat cerita, media, dan proyek kreatif dapat diberikan lebih banyak.', rek: ['menggambar & melukis', 'membuat cerita bergambar', 'bermain musik', 'proyek kerajinan tangan'] },
      E: { profil: 'Motorik/Praktis', teks: 'Kekuatan utama terlihat pada kemampuan motorik dan praktik. Olahraga, keterampilan praktik, aktivitas lapangan, dan kegiatan yang melibatkan koordinasi dapat dikembangkan.', rek: ['olahraga anak', 'permainan ketangkasan', 'keterampilan merakit/membuat karya nyata', 'kegiatan fisik terarah'] },
      F: { profil: 'Sosial-Komunikasi', teks: 'Kekuatan utama terlihat pada kemampuan sosial dan komunikasi. Diskusi, presentasi, kerja kelompok, dan kegiatan organisasi sederhana dapat menjadi pengalaman yang baik.', rek: ['bercerita di depan kelas', 'kerja kelompok', 'kegiatan sosial sekolah', 'permainan peran kolaboratif'] }
    },
    pair: {
      'C+D': { profil: 'Penalaran & Kreativitas', teks: 'Siswa menunjukkan kombinasi penalaran dan kreativitas yang menonjol. Kegiatan yang membutuhkan pemecahan masalah sekaligus pengembangan ide sangat baik untuk dieksplorasi.', rek: ['membuat game sederhana di Scratch', 'puzzle kreatif', 'proyek eksperimen sains-seni', 'komik logika'] },
      'C+E': { profil: 'Penalaran & Praktik', teks: 'Siswa menunjukkan kombinasi penalaran dan kemampuan praktik. Kegiatan eksperimen, robotika, membuat model, dan proyek berbasis praktik dapat dikembangkan.', rek: ['merakit lego/robotika pemula', 'membuat model bangunan', 'eksperimen sains praktik', 'kegiatan eksplorasi alam'] },
      'C+F': { profil: 'Penalaran & Sosial', teks: 'Siswa menunjukkan kombinasi penalaran dan kemampuan sosial. Diskusi pemecahan masalah, proyek kelompok, dan presentasi hasil dapat menjadi kegiatan pengembangan yang baik.', rek: ['diskusi pemecahan masalah kelompok', 'presentasi hasil proyek', 'kuis tim beregu', 'berbagi strategi belajar'] },
      'D+E': { profil: 'Kreativitas & Praktik', teks: 'Siswa menunjukkan kombinasi kreativitas dan keterampilan praktik. Kegiatan membuat karya, desain, kerajinan, performa, dan proyek kreatif dapat dikembangkan.', rek: ['membuat kerajinan tangan 3D', 'bermain musik aktif/tari', 'merancang poster/alat peraga', 'seni rupa terapan'] },
      'D+F': { profil: 'Kreativitas & Komunikasi', teks: 'Siswa menunjukkan kombinasi kreativitas dan komunikasi. Kegiatan bercerita, media, presentasi kreatif, seni, dan proyek kelompok layak dikembangkan.', rek: ['drama/bercerita kelompok', 'membuat majalah dinding', 'presentasi kreatif', 'bernyanyi/bermusik bersama'] },
      'E+F': { profil: 'Praktis & Kerja Sama', teks: 'Siswa menunjukkan kombinasi kemampuan praktik dan kerja sama. Aktivitas tim, olahraga, kegiatan lapangan, dan proyek praktik kelompok dapat menjadi sarana pengembangan yang baik.', rek: ['olahraga beregu', 'permainan luar ruangan kolaboratif', 'proyek kebun/lingkungan sekolah', 'tugas tim lapangan'] }
    },
    triple: {
      'C+D+E': { profil: 'Berpikir, Berkreasi, dan Praktik', teks: 'Siswa menunjukkan kombinasi yang menonjol dalam berpikir, berkreasi, dan melakukan kegiatan praktik. Proyek STEM, eksperimen, robotika, desain, dan kegiatan membuat produk dapat menjadi pilihan pengembangan.', rek: ['proyek STEM', 'eksperimen', 'robotika', 'desain', 'kegiatan membuat produk'] },
      'C+D+F': { profil: 'Penalaran, Kreativitas, dan Komunikasi', teks: 'Siswa menunjukkan kombinasi yang menonjol dalam penalaran, kreativitas, dan komunikasi. Proyek kelompok yang melibatkan pemecahan masalah, pembuatan karya, dan presentasi sangat baik untuk dikembangkan.', rek: ['proyek kelompok', 'pemecahan masalah bersama', 'pembuatan karya', 'presentasi kelompok'] },
      'C+E+F': { profil: 'Penalaran, Praktik, dan Kerja Sama', teks: 'Siswa menunjukkan kombinasi penalaran, kemampuan praktik, dan kerja sama. Proyek kelompok, eksperimen, kegiatan lapangan, dan aktivitas pemecahan masalah bersama layak dikembangkan.', rek: ['proyek kelompok', 'eksperimen terapan', 'kegiatan lapangan', 'aktivitas pemecahan masalah bersama'] },
      'D+E+F': { profil: 'Kreativitas, Praktik, dan Sosial', teks: 'Siswa menunjukkan kombinasi kreativitas, keterampilan praktik, dan kemampuan sosial. Proyek karya kelompok, seni pertunjukan, kegiatan lapangan, dan produksi kreatif dapat menjadi pilihan.', rek: ['proyek karya kelompok', 'seni pertunjukan', 'kegiatan lapangan kreatif', 'produksi karya bersama'] }
    },
    all: {
      profil: 'Profil Potensi Luas',
      teks: 'Siswa menunjukkan profil potensi yang luas pada penalaran, kreativitas, kemampuan praktik, dan sosial-komunikasi. Berikan kesempatan mencoba berbagai kegiatan yang lebih menantang agar siswa dapat menemukan bidang yang paling ingin dikembangkan lebih jauh.',
      rek: ['berbagai proyek kreatif, eksplorasi sains, dan kegiatan tim secara seimbang']
    },
    noHigh: {
      allSedang: 'Profil potensi siswa relatif merata. Kemampuan pada berbagai bidang cukup berkembang, tetapi belum terlihat satu area yang sangat dominan. Pengalaman yang beragam akan membantu siswa menemukan kekuatan dan bidang yang paling menarik untuk dikembangkan.',
      sedangWithRendah: 'Profil potensi cukup merata pada beberapa aspek, sementara area lainnya masih dalam proses berkembang. Pengembangan dapat difokuskan pada bidang yang paling diminati anak.',
      oneSedang: 'Profil potensi masih berkembang. Pada asesmen saat ini, area tertentu terlihat relatif lebih berkembang. Pengalaman belajar yang berkelanjutan diperlukan untuk membantu potensi siswa semakin terlihat.',
      allRendah: 'Potensi yang diukur masih berkembang dan belum terlihat secara kuat pada asesmen saat ini. Siswa tetap perlu memperoleh pengalaman belajar yang beragam agar kemampuan yang belum tampak dapat memperoleh kesempatan untuk berkembang.'
    }
  },

  SD_1_3: {
    single: {
      C: { profil: 'Berpikir & Pola', teks: 'Kemampuan berpikir dan memecahkan masalah terlihat sebagai area yang paling menonjol. Berikan permainan pola, teka-teki sederhana, kegiatan mengelompokkan, dan eksplorasi sebab-akibat.', rek: ['permainan mencocokkan pola', 'puzzle gambar', 'mengelompokkan benda', 'eksplorasi sebab-akibat sederhana'] },
      D: { profil: 'Kreativitas', teks: 'Kreativitas terlihat sebagai area yang menonjol. Berikan kesempatan menggambar, membuat karya, bermain bentuk, cerita, bunyi, dan kegiatan kreatif lainnya.', rek: ['menggambar bebas', 'mewarnai bentuk', 'bermain balok warna', 'mendengarkan & menirukan bunyi/lagu'] },
      E: { profil: 'Gerak & Koordinasi', teks: 'Kemampuan gerak dan koordinasi terlihat menonjol. Berikan kesempatan bermain aktif, melakukan permainan keseimbangan, koordinasi, dan keterampilan gerak.', rek: ['bermain lari rintangan ringan', 'lempar tangkap bola', 'meronce/melipat kertas', 'permainan keseimbangan'] },
      F: { profil: 'Sosial & Komunikasi', teks: 'Kemampuan sosial dan komunikasi terlihat menonjol. Anak dapat memperoleh manfaat dari permainan bersama, bercerita, berbagi tugas, dan kegiatan kelompok.', rek: ['bermain bersama teman', 'bercerita tentang gambar', 'bermain peran sederhana', 'berbagi mainan'] }
    },
    pair: {
      'C+D': { profil: 'Berpikir & Berkreasi', teks: 'Anak menunjukkan kombinasi kemampuan berpikir dan berkreasi yang menonjol. Permainan yang mengajak anak mencari solusi sekaligus membuat sesuatu dapat menjadi pengalaman yang baik.', rek: ['menyusun lego menjadi bentuk baru', 'menggambar pola teratur', 'teka-teki gambar kreatif'] },
      'C+E': { profil: 'Berpikir & Praktik', teks: 'Anak menunjukkan kombinasi kemampuan berpikir dan melakukan kegiatan praktik. Aktivitas belajar sambil mencoba, menyusun, bergerak, dan memecahkan masalah cocok untuk dikembangkan.', rek: ['permainan menyusun balok bertingkat', 'mencari jalan keluar (labirin fisik)', 'merakit mainan sederhana'] },
      'C+F': { profil: 'Berpikir & Berinteraksi', teks: 'Anak menunjukkan kombinasi kemampuan berpikir dan berinteraksi. Permainan pemecahan masalah bersama, bercerita, dan kegiatan kelompok dapat membantu perkembangannya.', rek: ['tebak-tebakan kata bersama teman', 'permainan papan sederhana bergiliran', 'diskusi cerita dongeng'] },
      'D+E': { profil: 'Kreativitas & Gerak', teks: 'Anak menunjukkan kombinasi kreativitas dan kemampuan gerak. Kegiatan membuat karya sambil menggunakan gerak dan keterampilan tangan dapat menjadi pilihan yang baik.', rek: ['bermain plastisin/tanah liat', 'membuat kolase dari daun/kertas', 'gerak berirama dan menari'] },
      'D+F': { profil: 'Kreativitas & Berinteraksi', teks: 'Anak menunjukkan kombinasi kreativitas dan kemampuan berinteraksi. Kegiatan bercerita, bermain peran, membuat karya bersama, dan aktivitas kelompok dapat dikembangkan.', rek: ['bermain drama boneka tangan', 'menggambar bersama di kertas besar', 'menyanyi bersama'] },
      'E+F': { profil: 'Gerak & Sosial', teks: 'Anak menunjukkan kombinasi kemampuan gerak dan sosial. Permainan kelompok dan aktivitas fisik bersama dapat menjadi lingkungan perkembangan yang baik.', rek: ['permainan kucing-kucingan/petak umpet', 'senam bersama teman', 'estafet bola mini'] }
    },
    triple: {
      'C+D+E': { profil: 'Berpikir, Berkreasi, dan Gerak Praktis', teks: 'Anak menunjukkan kemampuan yang menonjol dalam berpikir, berkreasi, dan melakukan kegiatan praktik. Berikan pengalaman yang memungkinkan anak mencari tahu, membuat, mencoba, dan bergerak.', rek: ['permainan mencari tahu, membuat karya tangan, dan bergerak aktif'] },
      'C+D+F': { profil: 'Berpikir, Berkreasi, dan Berinteraksi', teks: 'Anak menunjukkan kemampuan yang menonjol dalam berpikir, berkreasi, dan berinteraksi. Kegiatan proyek sederhana bersama teman dapat menjadi pengalaman pengembangan yang baik.', rek: ['proyek membuat karya cerita sederhana bersama teman'] },
      'C+E+F': { profil: 'Berpikir, Praktik, dan Bekerja Sama', teks: 'Anak menunjukkan kemampuan yang menonjol dalam berpikir, melakukan kegiatan praktik, dan bekerja bersama.', rek: ['permainan balok kelompok dan aktivitas praktik bersama'] },
      'D+E+F': { profil: 'Berkreasi, Bergerak, dan Berinteraksi', teks: 'Anak menunjukkan kemampuan yang menonjol dalam berkreasi, bergerak, dan berinteraksi dengan orang lain.', rek: ['kegiatan pentas seni anak, gerak lagu, dan bermain peran kelompok'] }
    },
    all: {
      profil: 'Potensi Luas & Seimbang',
      teks: 'Anak menunjukkan potensi yang cukup luas pada berbagai jenis kegiatan. Tidak perlu terburu-buru memilih satu bidang. Berikan kesempatan yang beragam agar kemampuan dan minatnya dapat terus berkembang secara alami.',
      rek: ['berbagai kegiatan bermain, bergerak, menggambar, bercerita, dan memecahkan teka-teki secara seimbang']
    },
    noHigh: {
      allSedang: 'Perkembangan anak terlihat cukup merata pada berbagai kegiatan yang diberikan. Belum perlu menentukan satu kemampuan sebagai yang paling utama. Terus berikan pengalaman belajar, bermain, bergerak, berkreasi, dan berinteraksi secara seimbang.',
      sedangWithRendah: 'Perkembangan anak cukup merata pada beberapa area, sementara area lainnya masih membutuhkan banyak kesempatan bermain dan berlatih.',
      oneSedang: 'Kemampuan anak masih dalam proses berkembang. Berikan pendampingan yang hangat dan pengalaman belajar yang menyenangkan.',
      allRendah: 'Kemampuan anak masih dalam proses berkembang dan belum terlihat secara konsisten melalui kegiatan asesmen ini. Hal tersebut tidak berarti anak tidak memiliki potensi. Pada usia ini, pengalaman, kesempatan bermain dan belajar, serta pendampingan sangat memengaruhi kemampuan yang terlihat.'
    }
  }
};

// =========================================================================
// 5. MASTER BANK: SQ (SPIRITUAL QUOTIENT / KECERDASAN REFLEKTIF-NILAI)
// =========================================================================
const DOMAIN_SQ = {
  A: { kode: 'SQ-A', nama: 'Nilai', deskripsi: 'memahami dan mempertimbangkan nilai/prinsip dalam bertindak' },
  B: { kode: 'SQ-B', nama: 'Tujuan', deskripsi: 'memahami tujuan, arah, dan alasan melakukan sesuatu' },
  C: { kode: 'SQ-C', nama: 'Refleksi', deskripsi: 'memikirkan pengalaman, tindakan, dan pembelajaran' },
  D: { kode: 'SQ-D', nama: 'Kepedulian', deskripsi: 'mempertimbangkan orang lain, lingkungan, dan dampak tindakan' }
};

const MASTER_SQ = {
  SMA: {
    single: {
      A: { profil: 'Berorientasi Prinsip', teks: 'Kekuatan utama terlihat pada pertimbangan nilai dan prinsip ketika mengambil keputusan.' },
      B: { profil: 'Berorientasi Tujuan', teks: 'Kekuatan utama terlihat pada orientasi tujuan, penyusunan prioritas, dan menghubungkan tindakan dengan arah masa depan.' },
      C: { profil: 'Reflektif', teks: 'Kekuatan utama terlihat pada kemampuan refleksi diri, mengevaluasi pengalaman, dan mengambil pembelajaran dari keputusan.' },
      D: { profil: 'Peduli Sosial', teks: 'Kekuatan utama terlihat pada kepedulian sosial, tanggung jawab terhadap lingkungan, dan pertimbangan dampak keputusan bagi orang lain.' }
    },
    pair: {
      'A+B': { profil: 'Prinsip & Tujuan', teks: 'Siswa menunjukkan kemampuan menghubungkan prinsip dengan tujuan. Ia cenderung tidak hanya mempertimbangkan hasil yang ingin dicapai, tetapi juga cara dan nilai yang mendasari pencapaiannya.' },
      'A+C': { profil: 'Prinsip & Refleksi', teks: 'Siswa menunjukkan kemampuan mempertimbangkan prinsip sekaligus mengevaluasi pengalaman dan keputusan untuk memperbaiki tindakan berikutnya.' },
      'A+D': { profil: 'Prinsip & Kepedulian', teks: 'Siswa menunjukkan kombinasi yang kuat antara pertimbangan nilai dan kepedulian sosial. Keputusan cenderung dipertimbangkan tidak hanya dari kepentingan pribadi tetapi juga dampaknya terhadap orang lain.' },
      'B+C': { profil: 'Tujuan & Refleksi', teks: 'Siswa mampu menghubungkan tujuan dengan evaluasi pengalaman. Kemampuan ini mendukung proses memperbaiki strategi ketika langkah sebelumnya belum menghasilkan hasil yang diharapkan.' },
      'B+D': { profil: 'Tujuan & Kepedulian', teks: 'Siswa menunjukkan kemampuan mempertimbangkan tujuan sekaligus dampaknya terhadap orang lain dan lingkungan sosial.' },
      'C+D': { profil: 'Refleksi & Kepedulian', teks: 'Siswa menunjukkan kemampuan belajar dari pengalaman sekaligus mempertimbangkan perspektif, kebutuhan, dan dampak terhadap orang lain.' }
    },
    triple: {
      'A+B+C': { profil: 'Prinsip, Tujuan & Refleksi', teks: 'Siswa menunjukkan kombinasi yang kuat dalam pertimbangan prinsip, orientasi tujuan, dan refleksi diri. Ia memiliki dasar yang baik untuk mempertimbangkan apa yang ingin dicapai, bagaimana mencapainya, dan apa yang dapat dipelajari dari keputusan sebelumnya.' },
      'A+B+D': { profil: 'Nilai, Tujuan & Kepedulian', teks: 'Siswa menunjukkan kombinasi yang kuat dalam nilai, tujuan, dan kepedulian sosial. Ia cenderung mampu mempertimbangkan tujuan pribadi sambil tetap memperhatikan prinsip dan dampaknya terhadap orang lain.' },
      'A+C+D': { profil: 'Nilai, Refleksi & Kepedulian', teks: 'Siswa menunjukkan kombinasi yang kuat dalam pertimbangan nilai, refleksi, dan kepedulian sosial. Kemampuan ini mendukung pengambilan keputusan yang mempertimbangkan pengalaman, prinsip, dan konsekuensi terhadap pihak lain.' },
      'B+C+D': { profil: 'Tujuan, Refleksi & Kepedulian', teks: 'Siswa menunjukkan kombinasi yang kuat dalam orientasi tujuan, refleksi, dan kepedulian sosial. Ia mampu melihat tujuan yang ingin dicapai, belajar dari pengalaman, dan mempertimbangkan dampaknya terhadap lingkungan sosial.' }
    },
    all: {
      profil: 'Profil SQ Luas dan Seimbang',
      teks: 'Siswa menunjukkan perkembangan yang kuat dan relatif seimbang dalam pertimbangan nilai, orientasi tujuan, kemampuan refleksi, dan kepedulian sosial. Profil ini mendukung kemampuan mengambil keputusan secara lebih matang dengan mempertimbangkan prinsip, tujuan, pengalaman, serta dampaknya terhadap orang lain.'
    },
    noHigh: {
      allSedang: 'Profil SQ relatif merata dan cukup berkembang. Siswa telah menunjukkan kemampuan mempertimbangkan nilai, tujuan, pengalaman, dan dampak sosial, meskipun belum ada satu aspek yang sangat dominan. Pengalaman nyata dan refleksi dapat membantu memperkuat profil tersebut.',
      allRendah: 'Beberapa kemampuan yang berkaitan dengan pertimbangan nilai, orientasi tujuan, refleksi, dan kepedulian masih berkembang. Kesempatan mengambil keputusan, menerima tanggung jawab, mengevaluasi pengalaman, dan mempertimbangkan konsekuensi dapat membantu perkembangan lebih lanjut.'
    },
    rekomendasi: 'Pengembangan dapat dilanjutkan melalui tanggung jawab nyata, proyek sosial, organisasi, perencanaan tujuan pribadi, dan kebiasaan refleksi terhadap pengalaman.'
  },

  SMP: {
    single: {
      A: { profil: 'Nilai & Prinsip', teks: 'Kekuatan utama terlihat pada pertimbangan nilai dan prinsip ketika menghadapi pilihan.' },
      B: { profil: 'Orientasi Tujuan', teks: 'Kekuatan utama terlihat pada kemampuan memahami tujuan dan melihat alasan di balik usaha yang dilakukan.' },
      C: { profil: 'Refleksi Diri', teks: 'Kekuatan utama terlihat pada kemampuan melihat kembali pengalaman dan mengambil pelajaran darinya.' },
      D: { profil: 'Kepedulian Sosial', teks: 'Kekuatan utama terlihat pada kepedulian dan pertimbangan terhadap kebutuhan orang lain.' }
    },
    pair: {
      'A+B': { profil: 'Prinsip & Tujuan', teks: 'Siswa mampu menghubungkan prinsip dengan tujuan, sehingga tujuan tidak hanya dilihat dari hasil tetapi juga cara mencapainya.' },
      'A+C': { profil: 'Prinsip & Evaluasi Diri', teks: 'Siswa menunjukkan kemampuan mempertimbangkan prinsip sekaligus mengevaluasi pengalamannya untuk memperbaiki tindakan berikutnya.' },
      'A+D': { profil: 'Nilai & Kepedulian', teks: 'Siswa menunjukkan kombinasi kesadaran nilai dan kepedulian sosial yang baik.' },
      'B+C': { profil: 'Tujuan & Refleksi', teks: 'Siswa mampu menghubungkan tujuan dengan evaluasi diri, sehingga pengalaman dapat digunakan untuk memperbaiki langkah berikutnya.' },
      'B+D': { profil: 'Tujuan & Kepedulian', teks: 'Siswa menunjukkan kemampuan mengejar tujuan sambil mempertimbangkan dampaknya terhadap orang lain.' },
      'C+D': { profil: 'Refleksi & Kepedulian', teks: 'Siswa mampu belajar dari pengalaman sekaligus mempertimbangkan perspektif dan kebutuhan orang lain.' }
    },
    triple: {
      'A+B+C': { profil: 'Prinsip, Tujuan & Refleksi', teks: 'Siswa menunjukkan kombinasi yang kuat dalam memahami prinsip, menentukan tujuan, dan mengevaluasi pengalaman. Kemampuan ini dapat membantu siswa mengambil keputusan yang semakin matang.' },
      'A+B+D': { profil: 'Nilai, Tujuan & Kepedulian', teks: 'Siswa mampu menghubungkan nilai, tujuan, dan kepedulian sosial, sehingga keputusan tidak hanya mempertimbangkan kepentingan pribadi tetapi juga dampaknya terhadap orang lain.' },
      'A+C+D': { profil: 'Nilai, Refleksi & Kepedulian', teks: 'Siswa menunjukkan kombinasi yang baik antara prinsip, refleksi diri, dan kepedulian terhadap orang lain.' },
      'B+C+D': { profil: 'Tujuan, Refleksi & Kepedulian', teks: 'Siswa menunjukkan kemampuan memahami tujuan, mengevaluasi pengalaman, dan mempertimbangkan dampak tindakannya terhadap lingkungan sosial.' }
    },
    all: {
      profil: 'Profil SQ Kuat & Seimbang',
      teks: 'Siswa menunjukkan profil yang kuat dan relatif seimbang dalam pertimbangan nilai, orientasi tujuan, refleksi diri, dan kepedulian sosial. Kemampuan ini dapat terus dikembangkan melalui tanggung jawab yang lebih besar, kegiatan sosial, organisasi, proyek kelompok, dan kebiasaan melakukan evaluasi diri.'
    },
    noHigh: {
      allSedang: 'Profil SQ siswa relatif merata pada tingkat cukup berkembang. Siswa mulai mampu mempertimbangkan nilai, tujuan, pengalaman, dan kepentingan orang lain, tetapi kemampuan tersebut masih perlu diperkuat melalui pengalaman nyata.',
      allRendah: 'Beberapa aspek dalam memahami nilai, tujuan, refleksi, dan kepedulian masih berkembang. Siswa membutuhkan kesempatan untuk menghadapi pilihan, mengambil tanggung jawab, mengevaluasi pengalaman, dan melihat dampak tindakannya terhadap orang lain.'
    },
    rekomendasi: 'Berikan kesempatan berdiskusi tentang pilihan dan konsekuensi, menetapkan target sederhana, mengevaluasi hasil kegiatan, serta terlibat dalam kegiatan sosial kelompok.'
  },

  SD_4_6: {
    single: {
      A: { profil: 'Pemahaman Nilai', teks: 'Kekuatan utama terlihat pada kemampuan memahami nilai dan prinsip yang baik dalam bertindak seperti kejujuran dan tanggung jawab.' },
      B: { profil: 'Memahami Tujuan', teks: 'Kekuatan utama terlihat pada kemampuan memahami tujuan dan alasan melakukan suatu kegiatan dengan sungguh-sungguh.' },
      C: { profil: 'Belajar dari Pengalaman', teks: 'Kekuatan utama terlihat pada kemampuan belajar dari pengalaman dan memikirkan perbaikan berikutnya.' },
      D: { profil: 'Kepedulian Lingkungan', teks: 'Kekuatan utama terlihat pada kepedulian terhadap orang lain dan lingkungan sekitar.' }
    },
    pair: {
      'A+B': { profil: 'Nilai & Tujuan', teks: 'Siswa mampu menghubungkan nilai yang diyakini dengan tujuan yang ingin dicapai.' },
      'A+C': { profil: 'Nilai & Belajar dari Pengalaman', teks: 'Siswa menunjukkan kemampuan memahami nilai sekaligus belajar dari pengalaman untuk memperbaiki tindakan.' },
      'A+D': { profil: 'Nilai & Kepedulian', teks: 'Siswa menunjukkan kombinasi yang baik antara pemahaman nilai dan kepedulian terhadap orang lain.' },
      'B+C': { profil: 'Tujuan & Evaluasi', teks: 'Siswa cukup mampu memahami tujuan serta mengevaluasi pengalaman untuk mencapai hasil yang lebih baik.' },
      'B+D': { profil: 'Tujuan & Peduli Orang Lain', teks: 'Siswa mampu mempertimbangkan tujuan sekaligus dampaknya terhadap orang lain.' },
      'C+D': { profil: 'Refleksi & Kepedulian', teks: 'Siswa menunjukkan kemampuan belajar dari pengalaman sambil mempertimbangkan perasaan dan kebutuhan orang lain.' }
    },
    triple: {
      'A+B+C': { profil: 'Nilai, Tujuan & Pembelajaran Diri', teks: 'Siswa menunjukkan kemampuan yang baik dalam memahami nilai, menentukan tujuan, dan belajar dari pengalaman. Ia mulai mampu menggunakan pengalaman untuk memperbaiki cara mencapai tujuan tanpa mengabaikan prinsip yang dianggap penting.' },
      'A+B+D': { profil: 'Nilai, Tujuan & Kepedulian', teks: 'Siswa menunjukkan pemahaman yang baik mengenai nilai dan tujuan serta mampu mempertimbangkan kepentingan orang lain dalam tindakannya.' },
      'A+C+D': { profil: 'Nilai, Refleksi & Kepedulian', teks: 'Siswa menunjukkan kombinasi yang baik antara pemahaman nilai, kemampuan belajar dari pengalaman, dan kepedulian terhadap orang lain.' },
      'B+C+D': { profil: 'Tujuan, Refleksi & Kepedulian', teks: 'Siswa mampu memahami tujuan, belajar dari pengalaman, dan mempertimbangkan dampak tindakannya terhadap orang lain.' }
    },
    all: {
      profil: 'Perkembangan Nilai & Kepedulian Seimbang',
      teks: 'Siswa menunjukkan perkembangan yang kuat dan cukup seimbang dalam memahami nilai, menentukan tujuan, belajar dari pengalaman, dan menunjukkan kepedulian.'
    },
    noHigh: {
      allSedang: 'Perkembangan pemahaman nilai, tujuan, kemampuan refleksi, dan kepedulian siswa relatif merata dan cukup berkembang, serta masih membutuhkan pembiasaan sehari-hari.',
      allRendah: 'Kemampuan yang berkaitan dengan pemahaman nilai, tujuan, refleksi, dan kepedulian masih dalam proses berkembang. Pengalaman sehari-hari, teladan, diskusi, dan kesempatan bertanggung jawab dapat membantu perkembangannya.'
    },
    rekomendasi: 'Berikan kesempatan untuk menerapkan kemampuan tersebut melalui tanggung jawab mandiri, kerja kelompok, kegiatan kepedulian sosial, dan kebiasaan berdiskusi santai di rumah/sekolah.'
  }
};

// =========================================================================
// 6. MASTER BANK: EQ (EMOTIONAL QUOTIENT / KECERDASAN EMOSIONAL-SOSIAL)
// =========================================================================
const DOMAIN_EQ = {
  A: { kode: 'EQ-A', nama: 'Kesadaran Diri', deskripsi: 'mengenali emosi, reaksi, kekuatan, dan kondisi diri' },
  B: { kode: 'EQ-B', nama: 'Pengendalian Diri', deskripsi: 'mengelola reaksi, emosi, dorongan, dan respons' },
  C: { kode: 'EQ-C', nama: 'Empati', deskripsi: 'memahami perasaan, kebutuhan, dan sudut pandang orang lain' },
  D: { kode: 'EQ-D', nama: 'Relasi', deskripsi: 'berkomunikasi, bekerja sama, menyelesaikan perbedaan, dan menjaga hubungan' }
};

const MASTER_EQ = {
  SMA: {
    single: {
      A: { profil: 'Sadar Diri', teks: 'Kekuatan utama terlihat pada kemampuan mengenali emosi, memahami pola reaksinya, serta melihat pengaruh kondisi diri terhadap keputusan dan perilaku.' },
      B: { profil: 'Pengelolaan Diri', teks: 'Kekuatan utama terlihat pada kemampuan mengelola respons emosional, menunda reaksi, dan memilih tindakan yang tepat ketika menghadapi tekanan.' },
      C: { profil: 'Empatik', teks: 'Kekuatan utama terlihat pada kemampuan memahami perasaan, kebutuhan, dan perspektif orang lain secara mendalam.' },
      D: { profil: 'Relasional-Komunikatif', teks: 'Kekuatan utama terlihat pada kemampuan membangun komunikasi, bekerja sama, dan memelihara hubungan interpersonal secara konstruktif.' }
    },
    pair: {
      'A+B': { profil: 'Kesadaran & Pengelolaan Diri', teks: 'Siswa menunjukkan kombinasi yang kuat dalam mengenali kondisi emosional dan mengelola responsnya. Kemampuan tersebut mendukung pengambilan tindakan yang lebih terarah ketika menghadapi tekanan atau situasi yang menantang.' },
      'A+C': { profil: 'Kesadaran Diri & Empati', teks: 'Siswa menunjukkan kemampuan yang baik dalam memahami kondisi dirinya sekaligus mempertimbangkan perasaan dan perspektif orang lain.' },
      'A+D': { profil: 'Kesadaran Diri & Relasi', teks: 'Siswa menunjukkan kemampuan mengenali kondisi diri dan menggunakannya secara cukup efektif dalam komunikasi dan hubungan interpersonal.' },
      'B+C': { profil: 'Pengendalian Diri & Empati', teks: 'Siswa menunjukkan kemampuan mengelola respons emosional sekaligus mempertimbangkan kebutuhan dan perspektif orang lain sebelum bertindak.' },
      'B+D': { profil: 'Pengendalian Diri & Relasi', teks: 'Siswa menunjukkan kemampuan mengelola respons secara baik sekaligus menjaga komunikasi dan hubungan ketika menghadapi perbedaan atau tekanan sosial.' },
      'C+D': { profil: 'Empati & Relasi', teks: 'Siswa menunjukkan kombinasi yang kuat dalam memahami perspektif orang lain dan membangun hubungan interpersonal yang konstruktif.' }
    },
    triple: {
      'A+B+C': { profil: 'Sadar Diri, Kendali & Empati', teks: 'Siswa menunjukkan kemampuan yang kuat dalam memahami kondisi emosional diri, mengelola respons, serta mempertimbangkan perspektif orang lain. Kombinasi ini memberikan dasar yang baik untuk menghadapi berbagai situasi interpersonal secara lebih matang.' },
      'A+B+D': { profil: 'Sadar Diri, Kendali & Relasi', teks: 'Siswa menunjukkan kombinasi yang kuat dalam kesadaran diri, pengelolaan respons, dan kemampuan membangun hubungan. Kemampuan ini mendukung komunikasi dan penyelesaian perbedaan secara lebih konstruktif.' },
      'A+C+D': { profil: 'Sadar Diri, Empati & Relasi', teks: 'Siswa menunjukkan kemampuan yang kuat dalam memahami diri, memahami orang lain, dan membangun hubungan interpersonal. Profil ini mendukung komunikasi yang terbuka dan interaksi sosial yang positif.' },
      'B+C+D': { profil: 'Kendali Diri, Empati & Relasi', teks: 'Siswa menunjukkan kombinasi yang kuat dalam pengelolaan diri, empati, dan kemampuan relasional. Ia cukup mampu mempertimbangkan respons pribadi sekaligus kebutuhan orang lain dalam hubungan sosial.' }
    },
    all: {
      profil: 'Profil EQ Luas dan Seimbang',
      teks: 'Siswa menunjukkan perkembangan yang kuat dan relatif seimbang dalam kesadaran diri, pengelolaan respons emosional, empati, serta kemampuan membangun hubungan interpersonal. Profil ini mendukung kemampuan menghadapi berbagai situasi sosial secara lebih matang dengan mempertimbangkan kondisi diri maupun orang lain.'
    },
    noHigh: {
      allSedang: 'Profil kemampuan emosional dan sosial relatif merata dan cukup berkembang. Siswa telah menunjukkan kemampuan dalam memahami diri, mengelola respons, mempertimbangkan perspektif orang lain, dan membangun hubungan, meskipun belum terdapat satu aspek yang sangat dominan.',
      sedangWithRendah: 'Beberapa kemampuan emosional dan sosial telah cukup berkembang, sementara aspek lainnya masih memerlukan pengalaman dan latihan. Pengembangan dapat difokuskan pada kemampuan yang relatif lebih kuat sambil memperkuat aspek yang belum konsisten.',
      allRendah: 'Beberapa kemampuan emosional dan sosial yang diukur belum terlihat kuat secara konsisten. Pengalaman, refleksi, latihan pengelolaan diri, serta kesempatan berinteraksi dalam berbagai situasi dapat membantu kemampuan tersebut berkembang.'
    },
    rekomendasi: 'Pengembangan dapat dilanjutkan melalui tanggung jawab organisasi, kepemimpinan kelompok, proyek kolaboratif, komunikasi publik, diskusi, kegiatan sosial, dan refleksi terhadap pengalaman interpersonal.'
  },

  SMP: {
    single: {
      A: { profil: 'Kesadaran Diri', teks: 'Kekuatan utama terlihat pada kesadaran terhadap diri, mengenali emosi, dan memahami faktor yang memengaruhi reaksi dirinya.' },
      B: { profil: 'Pengendalian Diri', teks: 'Kekuatan utama terlihat pada pengelolaan respons dan emosi saat menghadapi tekanan atau perbedaan pendapat.' },
      C: { profil: 'Empati', teks: 'Kekuatan utama terlihat pada pemahaman terhadap perasaan dan sudut pandang orang lain.' },
      D: { profil: 'Komunikasi & Relasi', teks: 'Kekuatan utama terlihat pada kemampuan komunikasi, kerja sama, dan menjaga hubungan sosial.' }
    },
    pair: {
      'A+B': { profil: 'Memahami & Mengelola Diri', teks: 'Siswa menunjukkan kemampuan yang baik dalam mengenali kondisi emosional sekaligus mengelola responsnya. Kombinasi ini membantu siswa menghadapi situasi yang menantang dengan lebih terarah.' },
      'A+C': { profil: 'Memahami Diri & Orang Lain', teks: 'Siswa menunjukkan kemampuan yang baik dalam memahami kondisi dirinya sekaligus mengenali perasaan dan perspektif orang lain.' },
      'A+D': { profil: 'Kesadaran Diri & Relasi', teks: 'Siswa mampu mengenali kondisi dirinya sekaligus menggunakan pemahaman tersebut dalam berkomunikasi dan membangun hubungan sosial.' },
      'B+C': { profil: 'Pengendalian Diri & Empati', teks: 'Siswa menunjukkan kemampuan mengelola responsnya sekaligus mempertimbangkan perasaan dan sudut pandang orang lain.' },
      'B+D': { profil: 'Pengendalian Diri & Relasi', teks: 'Siswa menunjukkan kemampuan mengelola respons emosional sekaligus menjaga komunikasi dan kerja sama dengan orang lain.' },
      'C+D': { profil: 'Empati & Relasi', teks: 'Siswa menunjukkan kombinasi yang kuat dalam memahami orang lain dan membangun hubungan sosial yang positif.' }
    },
    triple: {
      'A+B+C': { profil: 'Memahami Diri, Kendali & Empati', teks: 'Siswa menunjukkan kombinasi yang kuat dalam mengenali emosi diri, mengelola respons, dan memahami perspektif orang lain. Kemampuan ini dapat membantu siswa menghadapi berbagai situasi sosial dengan lebih matang.' },
      'A+B+D': { profil: 'Memahami Diri, Kendali & Relasi', teks: 'Siswa menunjukkan kemampuan yang baik dalam mengenali dirinya, mengelola respons, serta berkomunikasi dan membangun hubungan.' },
      'A+C+D': { profil: 'Memahami Diri, Empati & Relasi', teks: 'Siswa menunjukkan kemampuan yang baik dalam memahami dirinya, memahami perspektif orang lain, serta membangun hubungan sosial yang positif.' },
      'B+C+D': { profil: 'Kendali Diri, Empati & Relasi', teks: 'Siswa menunjukkan kombinasi yang baik dalam mengelola respons, memahami orang lain, serta berkomunikasi dan bekerja sama.' }
    },
    all: {
      profil: 'Profil EQ Kuat & Seimbang',
      teks: 'Siswa menunjukkan profil emosional dan sosial yang kuat dan relatif seimbang dalam mengenali emosi diri, mengelola respons, memahami perspektif orang lain, serta membangun hubungan.'
    },
    noHigh: {
      allSedang: 'Profil kemampuan emosional dan sosial siswa relatif merata dan cukup berkembang. Belum terlihat satu aspek yang sangat dominan, tetapi kemampuan mengenali diri, mengelola respons, memahami orang lain, dan membangun hubungan telah mulai terbentuk.',
      sedangWithRendah: 'Beberapa kemampuan emosional dan sosial sudah cukup berkembang, sementara aspek lainnya masih membutuhkan pengalaman dan latihan. Pengembangan dapat dimulai dari kemampuan yang relatif lebih kuat sambil tetap memberikan kesempatan memperkuat aspek lainnya.',
      allRendah: 'Beberapa kemampuan emosional dan sosial yang diukur belum terlihat kuat secara konsisten. Hal ini tidak berarti kemampuan tersebut tidak dapat berkembang. Pengalaman sosial, refleksi, latihan pengelolaan diri, dan komunikasi dapat membantu perkembangannya.'
    },
    rekomendasi: 'Kegiatan kelompok, organisasi, diskusi, proyek kolaboratif, penyelesaian masalah bersama, serta kebiasaan merefleksikan perasaan dan respons setelah menghadapi situasi tertentu.'
  },

  SD_4_6: {
    single: {
      A: { profil: 'Mengenali Perasaan Diri', teks: 'Kekuatan utama terlihat pada kemampuan mengenali perasaan dan reaksi diri dalam berbagai situasi.' },
      B: { profil: 'Mengelola Reaksi', teks: 'Kekuatan utama terlihat pada kemampuan mengelola reaksi dan perilaku dalam berbagai situasi.' },
      C: { profil: 'Empati', teks: 'Kekuatan utama terlihat pada kemampuan memahami dan peka terhadap perasaan orang lain.' },
      D: { profil: 'Kerja Sama & Relasi', teks: 'Kekuatan utama terlihat pada kemampuan berkomunikasi, berbagi peran, dan bekerja sama dengan orang lain.' }
    },
    pair: {
      'A+B': { profil: 'Mengenali & Mengelola Diri', teks: 'Siswa menunjukkan kombinasi yang baik antara mengenali perasaan diri dan mengelola reaksinya.' },
      'A+C': { profil: 'Peka Diri & Orang Lain', teks: 'Siswa cukup mampu memahami dirinya sekaligus mengenali perasaan orang lain.' },
      'A+D': { profil: 'Sadar Diri & Interaksi', teks: 'Siswa menunjukkan kemampuan mengenali kondisi dirinya sekaligus membangun interaksi yang baik dengan orang lain.' },
      'B+C': { profil: 'Kendali Diri & Empati', teks: 'Siswa menunjukkan kemampuan mengelola reaksinya sambil mempertimbangkan perasaan orang lain.' },
      'B+D': { profil: 'Kendali Diri & Kerja Sama', teks: 'Siswa menunjukkan kemampuan mengelola diri sekaligus berkomunikasi dan bekerja sama secara baik.' },
      'C+D': { profil: 'Empati & Kerja Sama', teks: 'Siswa menunjukkan kombinasi yang baik antara memahami perasaan orang lain dan membangun hubungan yang positif.' }
    },
    triple: {
      'A+B+C': { profil: 'Mengenali Diri, Kendali & Empati', teks: 'Siswa menunjukkan kemampuan yang baik dalam mengenali perasaan diri, mengelola reaksi, dan memahami perasaan orang lain. Kemampuan tersebut membantu siswa menghadapi berbagai situasi sosial dengan lebih baik.' },
      'A+B+D': { profil: 'Mengenali Diri, Kendali & Relasi', teks: 'Siswa menunjukkan kemampuan yang baik dalam memahami dirinya, mengelola respons, dan berinteraksi dengan orang lain.' },
      'A+C+D': { profil: 'Mengenali Diri, Empati & Relasi', teks: 'Siswa menunjukkan kombinasi yang baik dalam memahami dirinya, memahami orang lain, dan membangun hubungan sosial.' },
      'B+C+D': { profil: 'Kendali Diri, Empati & Relasi', teks: 'Siswa menunjukkan kemampuan yang baik dalam mengelola reaksi, memahami perasaan orang lain, dan bekerja sama dalam hubungan sosial.' }
    },
    all: {
      profil: 'Perkembangan Emosional & Sosial Seimbang',
      teks: 'Siswa menunjukkan perkembangan yang kuat dan relatif seimbang dalam mengenali perasaan diri, mengelola reaksi, memahami perasaan orang lain, serta membangun hubungan yang positif.'
    },
    noHigh: {
      allSedang: 'Perkembangan emosional dan sosial siswa relatif merata dan cukup berkembang. Kemampuan mengenali diri, mengelola reaksi, memahami orang lain, dan membangun hubungan mulai terlihat tetapi masih dapat diperkuat melalui pengalaman sehari-hari.',
      sedangWithRendah: 'Beberapa kemampuan emosional dan sosial mulai berkembang, sementara aspek lainnya masih membutuhkan pendampingan dan pembiasaan positif.',
      allRendah: 'Beberapa kemampuan emosional dan sosial yang diukur masih dalam proses berkembang. Pengalaman sehari-hari, pendampingan yang hangat, komunikasi yang terbuka, dan kesempatan berinteraksi dapat membantu perkembangannya.'
    },
    rekomendasi: 'Berikan kesempatan berdiskusi tentang perasaan dan pengalaman, bekerja dalam kelompok, menyelesaikan perbedaan secara bersama, serta berlatih menenangkan diri dan mempertimbangkan respons sebelum bertindak.'
  }
};

// =========================================================================
// 7. MASTER BANK: IQ / KOGNITIF (PROFIL KEMAMPUAN KOGNITIF)
// =========================================================================
// 5 Kategori Normatif (Mean 100, SD 15)
//  <= 69   : Jauh di bawah rerata
//  70 - 84 : Di bawah rerata
//  85 - 115: Sekitar rerata
//  116 - 130: Di atas rerata
//  >= 131  : Jauh di atas rerata

function classifyNormativeCognitive(score) {
  const s = parseFloat(score);
  if (s >= 131) return { levelKey: 'jauhDiAtas', label: 'Jauh di atas rerata', code: 'VERY_HIGH' };
  if (s >= 116) return { levelKey: 'diAtas', label: 'Di atas rerata', code: 'HIGH' };
  if (s >= 85) return { levelKey: 'sekitarRerata', label: 'Sekitar rerata', code: 'AVERAGE' };
  if (s >= 70) return { levelKey: 'diBawah', label: 'Di bawah rerata', code: 'LOW' };
  return { levelKey: 'jauhDiBawah', label: 'Jauh di bawah rerata', code: 'VERY_LOW' };
}

const MASTER_KOGNITIF = {
  SMA: {
    normatif: {
      jauhDiAtas: 'Kemampuan kognitif secara umum berada jauh di atas rerata kelompok usia berdasarkan norma yang digunakan. Siswa menunjukkan kapasitas yang sangat kuat dalam mengolah informasi dan menghadapi berbagai tuntutan penalaran.',
      diAtas: 'Kemampuan kognitif secara umum berada di atas rerata kelompok usia. Siswa menunjukkan kapasitas yang baik dalam memahami informasi, mengenali hubungan, dan menyelesaikan masalah yang membutuhkan penalaran.',
      sekitarRerata: 'Kemampuan kognitif secara umum berada dalam rentang rerata kelompok usia. Siswa menunjukkan kapasitas penalaran yang berada pada tingkat yang umum ditemukan pada kelompok pembanding seusianya.',
      diBawah: 'Performa kognitif pada asesmen berada di bawah rerata kelompok usia. Strategi belajar yang terstruktur, latihan bertahap, dan pemanfaatan area kemampuan yang relatif lebih kuat dapat membantu menghadapi tuntutan belajar.',
      jauhDiBawah: 'Performa pada tugas kognitif berada cukup jauh di bawah rerata kelompok usia berdasarkan norma yang digunakan. Interpretasi perlu mempertimbangkan kondisi pelaksanaan, pengalaman pendidikan, serta informasi lain mengenai proses belajar siswa. Hasil asesmen tidak sebaiknya digunakan sebagai satu-satunya dasar dalam menentukan kemampuan atau arah pendidikan.'
    },
    radar: {
      K1_MERATA: 'Profil kemampuan kognitif terlihat relatif seimbang, tanpa perbedaan yang sangat besar antarjenis kemampuan yang diukur.',
      K2_ADA_KEKUATAN: 'Profil menunjukkan kekuatan relatif pada {STRENGTHS}. Kemampuan tersebut terlihat lebih menonjol dibandingkan profil kognitif siswa secara keseluruhan dan dapat menjadi modal dalam aktivitas akademik maupun pemecahan masalah yang relevan.',
      K3_ADA_AREA_BERKEMBANG: '{DEV_AREAS} berada relatif lebih rendah dibandingkan kemampuan siswa lainnya. Hal ini menunjukkan area yang mungkin membutuhkan strategi, latihan, atau pendekatan belajar yang berbeda.',
      K4_BERAGAM: 'Profil menunjukkan variasi kemampuan yang cukup nyata. Siswa memiliki kekuatan pada beberapa bentuk penalaran dan membutuhkan strategi berbeda pada bentuk tugas lainnya. Profil seperti ini lebih tepat dipahami dari pola kemampuan daripada hanya dari skor keseluruhan.'
    },
    scatterHighText: 'Terdapat variasi yang cukup besar antar kemampuan yang diukur. Oleh karena itu, skor keseluruhan sebaiknya dibaca bersama profil masing-masing kemampuan, karena satu angka komposit belum sepenuhnya menggambarkan pola kemampuan siswa.'
  },

  SMP: {
    normatif: {
      jauhDiAtas: 'Kemampuan kognitif siswa berada jauh di atas rerata kelompok usia berdasarkan norma yang digunakan. Siswa menunjukkan kapasitas yang sangat baik dalam memahami informasi, menemukan hubungan, dan menyelesaikan berbagai bentuk masalah.',
      diAtas: 'Kemampuan kognitif siswa berada di atas rerata kelompok usia. Siswa menunjukkan kemampuan yang baik dalam menganalisis informasi dan menggunakan penalaran untuk menyelesaikan masalah.',
      sekitarRerata: 'Kemampuan kognitif siswa berada dalam rentang rerata kelompok usia. Kemampuan memahami informasi dan memecahkan masalah berkembang pada tingkat yang umum ditemukan pada siswa seusianya.',
      diBawah: 'Performa kognitif yang terlihat melalui asesmen berada di bawah rerata kelompok usia. Pengembangan strategi belajar, latihan bertahap, dan pengalaman menghadapi berbagai bentuk masalah dapat membantu memperkuat kemampuan tersebut.',
      jauhDiBawah: 'Performa pada tugas kognitif berada cukup jauh di bawah rerata kelompok usia berdasarkan norma yang digunakan. Hasil sebaiknya dipahami bersama informasi lain mengenai proses belajar, kondisi saat asesmen, dan perkembangan siswa, serta tidak digunakan sebagai satu-satunya dasar untuk menarik kesimpulan mengenai kemampuan siswa.'
    },
    radar: {
      K1_MERATA: 'Profil kemampuan kognitif terlihat relatif merata. Siswa menunjukkan tingkat kemampuan yang cukup konsisten pada berbagai jenis tugas penalaran.',
      K2_ADA_KEKUATAN: 'Profil menunjukkan kekuatan relatif pada {STRENGTHS}. Kemampuan tersebut lebih menonjol dibandingkan beberapa kemampuan lain dalam profil dan dapat menjadi modal dalam menghadapi kegiatan belajar yang membutuhkan jenis penalaran tersebut.',
      K3_ADA_AREA_BERKEMBANG: '{DEV_AREAS} terlihat relatif kurang kuat dibandingkan kemampuan kognitif siswa lainnya. Pengembangan strategi dan latihan yang lebih terarah dapat membantu memperkuat area tersebut.',
      K4_BERAGAM: 'Profil menunjukkan variasi kemampuan yang cukup jelas antarbidang. Siswa dapat menunjukkan performa yang kuat pada jenis tugas tertentu tetapi membutuhkan usaha atau strategi berbeda pada jenis tugas lainnya.'
    },
    scatterHighText: 'Terdapat variasi yang cukup besar antar kemampuan yang diukur. Skor keseluruhan sebaiknya dibaca bersama profil pola kemampuan masing-masing subtes.'
  },

  SD_4_6: {
    normatif: {
      jauhDiAtas: 'Kemampuan kognitif yang terlihat melalui asesmen berada jauh di atas rerata kelompok usia berdasarkan norma yang digunakan. Siswa menunjukkan kemampuan yang sangat baik dalam memahami dan menyelesaikan berbagai tugas berpikir yang diberikan.',
      diAtas: 'Kemampuan kognitif yang terlihat melalui asesmen berada di atas rerata kelompok usia. Siswa menunjukkan kemampuan yang baik dalam memahami informasi, mengenali hubungan, dan menyelesaikan berbagai tugas penalaran.',
      sekitarRerata: 'Kemampuan kognitif siswa berada dalam rentang yang umum ditemukan pada kelompok usianya. Kemampuan berpikir berkembang sesuai dengan tingkat yang diharapkan berdasarkan norma yang digunakan.',
      diBawah: 'Performa pada tugas kognitif yang diberikan berada di bawah rerata kelompok usia berdasarkan norma yang digunakan. Kemampuan tersebut masih dapat berkembang melalui pengalaman belajar, strategi yang sesuai, dan latihan yang terarah.',
      jauhDiBawah: 'Performa pada tugas kognitif yang diberikan berada cukup jauh di bawah rerata kelompok usia berdasarkan norma yang digunakan. Hasil perlu dipahami bersama kondisi saat asesmen, pengalaman belajar, dan informasi perkembangan lainnya. Pendampingan dan pengalaman belajar yang sesuai dapat membantu perkembangan kemampuan siswa.'
    },
    radar: {
      K1_MERATA: 'Profil kemampuan siswa terlihat relatif seimbang pada berbagai jenis tugas kognitif. Tidak terdapat satu kemampuan yang sangat dominan dibandingkan kemampuan lainnya.',
      K2_ADA_KEKUATAN: 'Profil menunjukkan kekuatan relatif pada {STRENGTHS}. Kemampuan ini terlihat lebih menonjol dibandingkan beberapa kemampuan lain dalam profil siswa dan dapat terus dikembangkan melalui kegiatan yang sesuai.',
      K3_ADA_AREA_BERKEMBANG: 'Kemampuan pada {DEV_AREAS} terlihat relatif kurang menonjol dibandingkan kemampuan siswa lainnya. Area tersebut dapat diperkuat melalui pengalaman belajar dan latihan yang sesuai.',
      K4_BERAGAM: 'Profil menunjukkan variasi kemampuan yang cukup jelas. Beberapa jenis tugas dapat diselesaikan lebih kuat dibandingkan jenis tugas lainnya. Perbedaan ini dapat membantu guru dan orang tua memahami cara belajar yang mungkin lebih sesuai bagi siswa.'
    },
    scatterHighText: 'Terdapat perbedaan yang cukup nyata antar kemampuan yang diukur, sehingga pola kekuatan dan cara belajar siswa lebih informatif dilihat melalui grafik profil.'
  }
};

// =========================================================================
// 8. MESIN ORCHESTRATOR UTAMA: PENYUSUN LAPORAN LENGKAP
// =========================================================================

/**
 * 8.1 Menghasilkan Laporan Minat & Potensi (6 Sumbu A-F)
 * @param {Object} scores - { A: 76, B: 81, C: 84, D: 78, E: 53, F: 73 } (nilai 0-100)
 * @param {string} jenjangKey - 'SD_1_3' | 'SD_4_6' | 'SMP' | 'SMA'
 */
function generateMinatPotensiReport(scores, jenjangKey = 'SD_4_6') {
  const j = MASTER_MINAT_AB[jenjangKey] ? jenjangKey : 'SD_4_6';

  // 1. Kategorisasi A-F (R/S/T)
  const cat = {};
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach(k => {
    cat[k] = classifyRST(scores[k] ?? 50);
  });

  // 2. Lapisan 1: Minat A+B (M1–M9)
  const comboAB = `${cat.A}+${cat.B}`;
  const minatObj = MASTER_MINAT_AB[j][comboAB] || MASTER_MINAT_AB[j]['S+S'];
  const kalimatMinat = minatObj.teks;

  // 3. Lapisan 2: Potensi C, D, E, F (Cari High)
  const potensiKeys = ['C', 'D', 'E', 'F'];
  const highPotensi = potensiKeys.filter(k => cat[k] === 'T');
  const sedangPotensi = potensiKeys.filter(k => cat[k] === 'S');
  const rendahPotensi = potensiKeys.filter(k => cat[k] === 'R');

  const bankPotensi = MASTER_POTENSI_CF[j];
  let kalimatPotensi = '';
  let namaProfil = '';
  let kekuatanList = [];
  let rekomendasiList = [];

  if (highPotensi.length === 4) {
    kalimatPotensi = bankPotensi.all.teks;
    namaProfil = bankPotensi.all.profil;
    kekuatanList = potensiKeys.map(k => DOMAIN_MINAT_POTENSI[k].labelSingkat);
    rekomendasiList = bankPotensi.all.rek;
  } else if (highPotensi.length === 3) {
    const key = highPotensi.sort().join('+');
    const item = bankPotensi.triple[key] || bankPotensi.triple['C+D+E'];
    kalimatPotensi = item.teks;
    namaProfil = item.profil;
    kekuatanList = highPotensi.map(k => DOMAIN_MINAT_POTENSI[k].labelSingkat);
    rekomendasiList = item.rek;
  } else if (highPotensi.length === 2) {
    const key = highPotensi.sort().join('+');
    const item = bankPotensi.pair[key] || bankPotensi.pair['C+D'];
    kalimatPotensi = item.teks;
    namaProfil = item.profil;
    kekuatanList = highPotensi.map(k => DOMAIN_MINAT_POTENSI[k].labelSingkat);
    rekomendasiList = item.rek;
  } else if (highPotensi.length === 1) {
    const key = highPotensi[0];
    const item = bankPotensi.single[key];
    kalimatPotensi = item.teks;
    namaProfil = item.profil;
    kekuatanList = [DOMAIN_MINAT_POTENSI[key].labelSingkat];
    rekomendasiList = item.rek;
  } else {
    // Tidak ada yang Tinggi -> Cek Relatif Tertinggi dari nilai numerik
    const sortedPotensi = potensiKeys.map(k => ({ key: k, nilai: scores[k] ?? 50, label: DOMAIN_MINAT_POTENSI[k].labelSingkat })).sort((a, b) => b.nilai - a.nilai);
    const maxVal = sortedPotensi[0].nilai;
    const topSedang = sortedPotensi.filter(it => (maxVal - it.nilai) <= 5);

    if (rendahPotensi.length === 0) {
      kalimatPotensi = bankPotensi.noHigh.allSedang;
    } else if (sedangPotensi.length === 1 && rendahPotensi.length === 3) {
      kalimatPotensi = bankPotensi.noHigh.oneSedang;
    } else if (rendahPotensi.length === 4) {
      kalimatPotensi = bankPotensi.noHigh.allRendah;
    } else {
      kalimatPotensi = bankPotensi.noHigh.sedangWithRendah;
    }

    kekuatanList = topSedang.map(it => it.label);
    rekomendasiList = [
      'Eksplorasi melalui proyek kelompok terarah',
      'Latihan pemecahan masalah bertahap',
      'Mencoba aktivitas kreatif dan praktik lapangan yang bervariasi'
    ];
  }

  // 4. Lapisan 3: Catatan Sedang yang Relevan (hanya dari domain potensi yang benar-benar diuji)
  let kalimatSedang = '';
  const testedSedang = Array.isArray(scores._testedPotensi)
    ? sedangPotensi.filter(k => scores._testedPotensi.includes(k))
    : sedangPotensi;
  if (highPotensi.length > 0 && testedSedang.length > 0 && highPotensi.length < 4) {
    const namaSedang = testedSedang.map(k => DOMAIN_MINAT_POTENSI[k].labelSingkat).join(' serta ');
    if (j === 'SD_1_3') {
      kalimatSedang = ` Kemampuan ${namaSedang.toLowerCase()} berkembang cukup baik dan dapat terus dilatih melalui permainan yang menyenangkan.`;
    } else if (j === 'SD_4_6') {
      kalimatSedang = ` Kemampuan ${namaSedang.toLowerCase()} berada pada tingkat cukup berkembang dan dapat diperkuat melalui pengalaman praktik.`;
    } else {
      kalimatSedang = ` Kemampuan ${namaSedang.toLowerCase()} berada pada tingkat cukup berkembang dan dapat menjadi kemampuan pendukung yang baik.`;
    }
  }

  // 5. Satukan Paragraf Narasi (80-150 kata)
  const potensiLead = kalimatPotensi ? (kalimatPotensi.charAt(0).toLowerCase() + kalimatPotensi.slice(1)) : '';
  const interpretasiLengkap = `${kalimatMinat} Pada sisi potensi, ${potensiLead}${kalimatSedang}`;

  // 6. Siapkan Area Pengembangan (hanya dari domain yang diuji)
  let areaPengembanganList = [];
  const testedRendah = Array.isArray(scores._testedPotensi)
    ? rendahPotensi.filter(k => scores._testedPotensi.includes(k))
    : rendahPotensi;
  if (testedRendah.length > 0 && testedRendah.length < 4) {
    areaPengembanganList = testedRendah.map(k => DOMAIN_MINAT_POTENSI[k].labelSingkat);
  }

  return {
    jenjang: JENJANG_LABEL[j],
    kategoriMap: cat,
    profilPotensi: namaProfil,
    interpretasi: interpretasiLengkap.trim(),
    kekuatanUtama: kekuatanList,
    areaPengembangan: areaPengembanganList,
    rekomendasi: rekomendasiList
  };
}

/**
 * 8.2 Menghasilkan Laporan SQ (4 Sumbu: Nilai, Tujuan, Refleksi, Kepedulian)
 * @param {Object} scores - { A: 81, B: 65, C: 76, D: 79 }
 * @param {string} jenjangKey - 'SD_4_6' | 'SMP' | 'SMA'
 */
function generateSQReport(scores, jenjangKey = 'SD_4_6') {
  const j = MASTER_SQ[jenjangKey] ? jenjangKey : (jenjangKey === 'SD_1_3' ? 'SD_4_6' : 'SD_4_6');
  const cat = {};
  ['A', 'B', 'C', 'D'].forEach(k => {
    cat[k] = classifyRST(scores[k] ?? 50);
  });

  const highKeys = ['A', 'B', 'C', 'D'].filter(k => cat[k] === 'T');
  const sedangKeys = ['A', 'B', 'C', 'D'].filter(k => cat[k] === 'S');
  const rendahKeys = ['A', 'B', 'C', 'D'].filter(k => cat[k] === 'R');

  const bank = MASTER_SQ[j];
  let kalimat = '';
  let kekuatanList = [];

  if (highKeys.length === 4) {
    kalimat = bank.all.teks;
    kekuatanList = ['Nilai', 'Tujuan', 'Refleksi', 'Kepedulian'];
  } else if (highKeys.length === 3) {
    const key = highKeys.sort().join('+');
    kalimat = (bank.triple[key] || bank.triple['A+B+C']).teks;
    kekuatanList = highKeys.map(k => DOMAIN_SQ[k].nama);
  } else if (highKeys.length === 2) {
    const key = highKeys.sort().join('+');
    kalimat = (bank.pair[key] || bank.pair['A+B']).teks;
    kekuatanList = highKeys.map(k => DOMAIN_SQ[k].nama);
  } else if (highKeys.length === 1) {
    const key = highKeys[0];
    kalimat = bank.single[key].teks;
    kekuatanList = [DOMAIN_SQ[key].nama];
  } else {
    // Tidak ada high
    const sorted = ['A', 'B', 'C', 'D'].map(k => ({ key: k, nilai: scores[k] ?? 50, nama: DOMAIN_SQ[k].nama })).sort((a, b) => b.nilai - a.nilai);
    const top = sorted.filter(it => (sorted[0].nilai - it.nilai) <= 5);
    kekuatanList = top.map(it => it.nama);
    kalimat = (rendahKeys.length >= 3) ? bank.noHigh.allRendah : bank.noHigh.allSedang;
  }

  // Kalimat area sedang pendukung
  if (highKeys.length > 0 && sedangKeys.length > 0 && highKeys.length < 4) {
    const namaSedang = sedangKeys.map(k => DOMAIN_SQ[k].nama).join(' dan ');
    kalimat += ` Pemahaman terhadap ${namaSedang} berada pada tingkat cukup berkembang dan dapat terus diperkuat melalui pembiasaan sehari-hari.`;
  }

  const areaPengembanganList = rendahKeys.map(k => DOMAIN_SQ[k].nama);

  return {
    jenjang: JENJANG_LABEL[j],
    kategoriMap: cat,
    interpretasi: kalimat.trim(),
    kekuatanUtama: kekuatanList,
    areaPengembangan: areaPengembanganList,
    rekomendasi: [
      'Berikan kesempatan berdiskusi mengenai nilai dan konsekuensi dari suatu tindakan',
      'Latihan menetapkan tujuan pribadi sederhana dan merencanakan langkah mencapainya',
      'Membiasakan evaluasi/refleksi positif setelah menyelesaikan kegiatan bersama',
      'Melibatkan siswa dalam aktivitas kepedulian sosial atau tanggung jawab kelompok'
    ]
  };
}

/**
 * 8.3 Menghasilkan Laporan EQ (4 Sumbu: Kesadaran Diri, Pengendalian Diri, Empati, Relasi)
 * @param {Object} scores - { A: 84, B: 78, C: 82, D: 67 }
 * @param {string} jenjangKey - 'SD_4_6' | 'SMP' | 'SMA'
 */
function generateEQReport(scores, jenjangKey = 'SD_4_6') {
  const j = MASTER_EQ[jenjangKey] ? jenjangKey : (jenjangKey === 'SD_1_3' ? 'SD_4_6' : 'SD_4_6');
  const cat = {};
  ['A', 'B', 'C', 'D'].forEach(k => {
    cat[k] = classifyRST(scores[k] ?? 50);
  });

  const highKeys = ['A', 'B', 'C', 'D'].filter(k => cat[k] === 'T');
  const sedangKeys = ['A', 'B', 'C', 'D'].filter(k => cat[k] === 'S');
  const rendahKeys = ['A', 'B', 'C', 'D'].filter(k => cat[k] === 'R');

  const bank = MASTER_EQ[j];
  let kalimat = '';
  let kekuatanList = [];

  if (highKeys.length === 4) {
    kalimat = bank.all.teks;
    kekuatanList = ['Kesadaran Diri', 'Pengendalian Diri', 'Empati', 'Relasi'];
  } else if (highKeys.length === 3) {
    const key = highKeys.sort().join('+');
    kalimat = (bank.triple[key] || bank.triple['A+B+C']).teks;
    kekuatanList = highKeys.map(k => DOMAIN_EQ[k].nama);
  } else if (highKeys.length === 2) {
    const key = highKeys.sort().join('+');
    kalimat = (bank.pair[key] || bank.pair['A+B']).teks;
    kekuatanList = highKeys.map(k => DOMAIN_EQ[k].nama);
  } else if (highKeys.length === 1) {
    const key = highKeys[0];
    kalimat = bank.single[key].teks;
    kekuatanList = [DOMAIN_EQ[key].nama];
  } else {
    // Tidak ada high
    const sorted = ['A', 'B', 'C', 'D'].map(k => ({ key: k, nilai: scores[k] ?? 50, nama: DOMAIN_EQ[k].nama })).sort((a, b) => b.nilai - a.nilai);
    const top = sorted.filter(it => (sorted[0].nilai - it.nilai) <= 5);
    kekuatanList = top.map(it => it.nama);
    kalimat = (rendahKeys.length >= 3) ? bank.noHigh.allRendah : bank.noHigh.allSedang;
  }

  // Kalimat area sedang / transisi
  if (highKeys.length > 0 && sedangKeys.length > 0 && highKeys.length < 4) {
    const namaSedang = sedangKeys.map(k => DOMAIN_EQ[k].nama).join(' dan ');
    kalimat += ` Kemampuan ${namaSedang.toLowerCase()} berada pada tingkat cukup berkembang dan masih dapat diperkuat ketika menghadapi situasi sosial yang lebih kompleks.`;
  }

  const areaPengembanganList = rendahKeys.map(k => DOMAIN_EQ[k].nama);

  return {
    jenjang: JENJANG_LABEL[j],
    kategoriMap: cat,
    interpretasi: kalimat.trim(),
    kekuatanUtama: kekuatanList,
    areaPengembangan: areaPengembanganList,
    rekomendasi: [
      'Memberikan ruang untuk berdiskusi tentang perasaan dan pengalaman harian',
      'Membiasakan kerja kelompok dan penyelesaian perbedaan pendapat secara terbuka',
      'Melatih strategi menenangkan diri dan mempertimbangkan respons sebelum bertindak',
      'Terlibat dalam proyek kolaboratif, kegiatan organisasi, atau kegiatan sosial'
    ]
  };
}

/**
 * 8.4 Menghasilkan Laporan Kognitif / IQ
 * @param {Array} subtests - [{ key: 'A', label: 'Penalaran Non Verbal', nilai: 108 }, ...] (Standard Scores / %)
 * @param {number} cognitiveIndex - Indeks Kognitif (mis. 112)
 * @param {string} jenjangKey - 'SD_4_6' | 'SMP' | 'SMA'
 */
function generateKognitifReport(subtests, cognitiveIndex = 100, jenjangKey = 'SD_4_6') {
  const j = MASTER_KOGNITIF[jenjangKey] ? jenjangKey : (jenjangKey === 'SD_1_3' ? 'SD_4_6' : 'SD_4_6');
  const bank = MASTER_KOGNITIF[j];

  // 1. Kategori Normatif Indeks Kognitif
  const normatifInfo = classifyNormativeCognitive(cognitiveIndex);
  const kalimatNormatif = bank.normatif[normatifInfo.levelKey];

  // 2. Analisis Radar Subtes & Pola Profil
  const profileInfo = computeProfilePattern(subtests, 5);
  let kalimatRadar = '';
  let kekuatanList = [];
  let devList = [];
  let isScatterHigh = false;

  if (profileInfo) {
    kekuatanList = profileInfo.strengths.map(s => s.label);
    devList = profileInfo.developmentAreas.map(d => d.label);

    if (profileInfo.range > 20) {
      isScatterHigh = true;
    }

    const strText = kekuatanList.join(' dan ');
    const devText = devList.join(' dan ');

    let template = bank.radar[profileInfo.pattern] || bank.radar.K1_MERATA;
    kalimatRadar = template.replace('{STRENGTHS}', strText).replace('{DEV_AREAS}', devText);
  }

  // 3. Sinergi Indeks + Radar
  let narasiFinal = `${kalimatNormatif} ${kalimatRadar}`;
  if (isScatterHigh) {
    narasiFinal += ` ${bank.scatterHighText}`;
  }

  return {
    jenjang: JENJANG_LABEL[j],
    cognitiveIndex: Math.round(cognitiveIndex),
    posisiNormatif: normatifInfo.label,
    kategoriKode: normatifInfo.code,
    interpretasi: narasiFinal.trim(),
    kekuatanRelatif: kekuatanList,
    areaPengembangan: devList,
    isScatterHigh: isScatterHigh,
    rekomendasi: [
      'Latihan penalaran dan pemecahan masalah bertahap sesuai tingkat usia',
      'Pendekatan belajar yang memanfaatkan modalitas kekuatan relatif siswa',
      'Memberikan variasi tugas berpikir analitis, visual, dan verbal secara seimbang'
    ]
  };
}

// =========================================================================
// 9. ADAPTER DROP-IN UNTUK UI.JS APLIKASI YANG SUDAH ADA
// =========================================================================
function updateStudentReportFull(student, uiHelpers = {}) {
  const jenjang = detectJenjang(student.program);

  // 1. Minat & Potensi Adapter
  let minatPotensiResult = null;
  const minatItems = student.subtopics?.['Minat'] || [];
  const bakatItems = student.subtopics?.['Bakat'] || [];
  const attemptedMinat = minatItems.filter(x => x.attempted);
  const attemptedBakat = bakatItems.filter(x => x.attempted);

  // Hanya susun narasi jika siswa benar-benar telah mengikuti asesmen Minat / Bakat
  if (attemptedMinat.length > 0 || attemptedBakat.length > 0) {
    const prefItem = attemptedMinat.find(m => m.key === 'Minat.preferensi' || /PREFERENSI/i.test(m.label));
    const depthItem = attemptedMinat.find(m => m.key === 'Minat.kedalaman' || /KEDALAMAN/i.test(m.label));

    let avgMinatPref = prefItem ? prefItem.nilai : null;
    let avgMinatDepth = depthItem ? depthItem.nilai : null;

    if (avgMinatPref === null && attemptedMinat.length > 0) {
      const domainMinat = attemptedMinat.filter(m => !m.isSubdimension);
      const pool = domainMinat.length > 0 ? domainMinat : attemptedMinat;
      const sorted = [...pool].sort((a, b) => b.nilai - a.nilai);
      avgMinatPref = sorted[0].nilai;
      avgMinatDepth = sorted.length > 1 ? (sorted[0].nilai + sorted[1].nilai) / 2 : sorted[0].nilai;
    }

    // Potensi C–F hanya diambil dari instrumen potensi/bakat nyata (bukan sub-dimensi ipsatif MI-1..MI-7)
    const realMinatCompetency = attemptedMinat.filter(m => !m.isSubdimension && !['Minat.preferensi', 'Minat.kedalaman'].includes(m.key));
    const realBakat = attemptedBakat.filter(b => !b.isSubdimension);
    const allAptitude = [...realBakat, ...realMinatCompetency];

    const findMatch = (regex) => allAptitude.find(b => regex.test(b.key) || regex.test(b.label));
    const matchC = findMatch(/potensiKognitif|KOGNITIF|LOGIKA|NUMERIK|PENALARAN/i);
    const matchD = findMatch(/potensiKreatif|KREATIF|SENI|VISUAL|MUSIK/i);
    const matchE = findMatch(/potensiMotorik|MOTORIK|PRAKTIS|OLAHRAGA/i);
    const matchF = findMatch(/potensiSosial|SOSIAL|KOMUNIKASI|PEMIMPIN/i);

    const testedPotensi = [];
    if (matchC) testedPotensi.push('C');
    if (matchD) testedPotensi.push('D');
    if (matchE) testedPotensi.push('E');
    if (matchF) testedPotensi.push('F');

    const neutralFallback = 55; // Sedang netral untuk subtes potensi yang belum diujikan
    minatPotensiResult = generateMinatPotensiReport({
      A: avgMinatPref ?? neutralFallback,
      B: avgMinatDepth ?? neutralFallback,
      C: matchC ? matchC.nilai : neutralFallback,
      D: matchD ? matchD.nilai : neutralFallback,
      E: matchE ? matchE.nilai : neutralFallback,
      F: matchF ? matchF.nilai : neutralFallback,
      _testedPotensi: testedPotensi.length > 0 ? testedPotensi : null
    }, jenjang);
  }

  // 2. EQ Adapter
  let eqResult = null;
  const eqItems = student.subtopics?.['EQ'] || [];
  const attemptedEQ = eqItems.filter(x => x.attempted);
  if (attemptedEQ.length > 0) {
    const eqAvg = attemptedEQ.reduce((acc, it) => acc + it.nilai, 0) / attemptedEQ.length;
    const itemA = attemptedEQ.find(it => it.key === 'EQ.kesadaranDiri' || (/KESADARAN DIRI/i.test(it.label) && !/EMPATI/i.test(it.label)));
    const itemB = attemptedEQ.find(it => it.key === 'EQ.regulasi' || /REGULASI|PENGENDALIAN|PENGELOLAAN/i.test(it.label));
    const itemC = attemptedEQ.find(it => it.key === 'EQ.empati' || /EMPATI/i.test(it.label));
    const itemsD = attemptedEQ.filter(it => it.key === 'EQ.relasi' || it.key === 'EQ.keputusan' || /RELASI|INTEGRITAS|KEPUTUSAN/i.test(it.label));

    const sA = itemA ? itemA.nilai : eqAvg;
    const sB = itemB ? itemB.nilai : eqAvg;
    const sC = itemC ? itemC.nilai : eqAvg;
    const sD = itemsD.length > 0 ? (itemsD.reduce((acc, it) => acc + it.nilai, 0) / itemsD.length) : eqAvg;

    eqResult = generateEQReport({ A: sA, B: sB, C: sC, D: sD }, jenjang);
  }

  // 3. SQ Adapter
  let sqResult = null;
  const sqItems = student.subtopics?.['SQ'] || [];
  const attemptedSQ = sqItems.filter(x => x.attempted);
  if (attemptedSQ.length > 0) {
    const sqAvg = attemptedSQ.reduce((acc, it) => acc + it.nilai, 0) / attemptedSQ.length;
    const itemNilai = attemptedSQ.find(it => it.key === 'SQ.nilaiNiat' || /NILAI|INTEGRITAS/i.test(it.label));
    const itemTujuan = attemptedSQ.find(it => it.key === 'SQ.tujuanMakna' || /TUJUAN|NIAT/i.test(it.label));
    const itemsRefleksi = attemptedSQ.filter(it => it.key === 'SQ.refleksi' || it.key === 'SQ.kesadaranDiri' || /REFLEKSI|KESADARAN MAKNA/i.test(it.label));
    const itemPeduli = attemptedSQ.find(it => it.key === 'SQ.tanggungJawab' || /PEDULI|TANGGUNG/i.test(it.label));

    const sA = itemNilai ? itemNilai.nilai : sqAvg;
    const sB = itemTujuan ? itemTujuan.nilai : sqAvg;
    const sC = itemsRefleksi.length > 0 ? (itemsRefleksi.reduce((acc, it) => acc + it.nilai, 0) / itemsRefleksi.length) : sqAvg;
    const sD = itemPeduli ? itemPeduli.nilai : sqAvg;

    sqResult = generateSQReport({ A: sA, B: sB, C: sC, D: sD }, jenjang);
  }

  // 4. Kognitif Adapter
  let kognitifResult = null;
  const iqItems = student.subtopics?.['IQ'] || [];
  const attemptedIQ = iqItems.filter(x => x.attempted);
  if (attemptedIQ.length > 0) {
    // Hitung rerata hanya dari subtes yang telah dikerjakan
    const avg = attemptedIQ.reduce((acc, it) => acc + it.nilai, 0) / attemptedIQ.length;
    // Standard score scaled approx (Fase I developmental, Mean 100, SD 15)
    const devIndex = 100 + ((avg - 50) / 10) * 5;
    kognitifResult = generateKognitifReport(attemptedIQ, devIndex, jenjang);
  }

  return {
    jenjang,
    minatPotensi: minatPotensiResult,
    eq: eqResult,
    sq: sqResult,
    kognitif: kognitifResult
  };
}

// Global Export untuk Node / Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RST_THRESHOLDS, classifyRST, RST_LABEL,
    detectJenjang, JENJANG_LABEL,
    computeProfilePattern,
    classifyNormativeCognitive,
    DOMAIN_MINAT_POTENSI, MASTER_MINAT_AB, MASTER_POTENSI_CF,
    DOMAIN_SQ, MASTER_SQ,
    DOMAIN_EQ, MASTER_EQ,
    MASTER_KOGNITIF,
    generateMinatPotensiReport,
    generateSQReport,
    generateEQReport,
    generateKognitifReport,
    updateStudentReportFull
  };
}
