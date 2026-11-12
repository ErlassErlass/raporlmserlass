// KUIS_MAPPING — Keywords presisi & bebas tabrakan untuk SD 1–3, SD 4–6, SMP, SMA/SMK
const KUIS_MAPPING = [
  // MODUL A: Kemampuan Kognitif (IQ) - 6 Subtes
  { key: 'IQ.nonVerbal',       modul: 'IQ',    label: 'Penalaran Non Verbal',    keywords: ['PKB A', 'NON VERBAL', 'NON-VERBAL', 'IQ: BAGIAN A', 'PENALARAN ABSTRAK', 'QUIZ-IQ_SD13'] },
  { key: 'IQ.verbal',          modul: 'IQ',    label: 'Penalaran Verbal',        keywords: ['PKB B', 'IQ: BAGIAN B', 'PENALARAN VERBAL'] },
  { key: 'IQ.numerik',         modul: 'IQ',    label: 'Kemampuan Numerik',       keywords: ['PKB C', 'KEMAMPUAN NUMERIK', 'IQ: BAGIAN C', 'PENALARAN KUANTITATIF'] },
  { key: 'IQ.spasial',         modul: 'IQ',    label: 'Penalaran Spasial',       keywords: ['PKB D', 'PENALARAN SPASIAL', 'IQ: BAGIAN D', 'PENALARAN RUANG'] },
  { key: 'IQ.workingMemory',   modul: 'IQ',    label: 'Memori Kerja',            keywords: ['PKB E', 'IQ: BAGIAN E', 'MEMORI KERJA', 'WORKING MEMORY'] },
  { key: 'IQ.processingSpeed', modul: 'IQ',    label: 'Kecepatan Pemrosesan',    keywords: ['PKB F', 'IQ: BAGIAN F', 'KECEPATAN PEMROSESAN', 'PEMROSESAN', 'PROCESSING SPEED'] },

  // MODUL B: Kematangan Emosi (EQ) - 5 Subtes (Course 63 + Course 51)
  { key: 'EQ.kesadaranDiri',   modul: 'EQ',    label: 'Kesadaran Diri',          keywords: ['EQ: BAGIAN A', 'SELF-AWARENESS', 'QUIZ-EQ_SD13'] },
  { key: 'EQ.regulasi',        modul: 'EQ',    label: 'Pengelolaan Diri',        keywords: ['EQ: BAGIAN B', 'PENGELOLAAN DIRI', 'PPD 2', 'REGULASI EMOSI'] },
  { key: 'EQ.empati',          modul: 'EQ',    label: 'Kesadaran Sosial & Empati', keywords: ['EQ: BAGIAN C', 'KESADARAN SOSIAL', 'PPD 1', 'EMPATI'] },
  { key: 'EQ.relasi',          modul: 'EQ',    label: 'Keterampilan Berelasi',   keywords: ['EQ: BAGIAN D', 'KETERAMPILAN BERELASI', 'PPD 3'] },
  { key: 'EQ.keputusan',       modul: 'EQ',    label: 'Pengambilan Keputusan',   keywords: ['EQ: BAGIAN E', 'PENGAMBILAN KEPUTUSAN'] },

  // MODUL C: Kesadaran Batin (SQ) - 5 Subtes (Course 63 + Course 51)
  { key: 'SQ.kesadaranDiri',   modul: 'SQ',    label: 'Kesadaran Makna & Diri',  keywords: ['SQ: BAGIAN A', 'KESADARAN MAKNA', 'PKD&R 1', 'KESADARAN DIRI & MAKNA', 'QUIZ-SQ_SD13'] },
  { key: 'SQ.nilaiNiat',       modul: 'SQ',    label: 'Nilai & Integritas',      keywords: ['SQ: BAGIAN B', 'NILAI, INTEGRITAS', 'PKD&R 2', 'PKD&R  2', 'NILAI & NIAT'] },
  { key: 'SQ.tujuanMakna',     modul: 'SQ',    label: 'Tujuan & Arah Makna',     keywords: ['SQ: BAGIAN C', 'TUJUAN, ARAH', 'TUJUAN & MAKNA', 'TUJUAN HIDUP'] },
  { key: 'SQ.tanggungJawab',   modul: 'SQ',    label: 'Kepedulian & Tanggung Jawab', keywords: ['SQ: BAGIAN D', 'KETERHUBUNGAN, KEPEDULIAN', 'PKD&R 3', 'PKD&R  3', 'TANGGUNG JAWAB'] },
  { key: 'SQ.refleksi',        modul: 'SQ',    label: 'Refleksi & Perspektif',   keywords: ['SQ: BAGIAN E', 'REFLEKSI, PERSPEKTIF'] },

  // MODUL D: Minat - SMA Meta (A & B), 7 Domain SMA (MI-1..MI-7), & 8 Subtes SD 4-6
  { key: 'Minat.preferensi',   modul: 'Minat', label: 'Preferensi Minat',        keywords: ['BAGIAN A - PREFERENSI MINAT', 'PREFERENSI MINAT'] },
  { key: 'Minat.kedalaman',    modul: 'Minat', label: 'Kedalaman Minat',         keywords: ['BAGIAN B - KEDALAMAN', 'KEDALAMAN, EKSPLORASI', 'KEDALAMAN MINAT'] },
  { key: 'Minat.mi1',          modul: 'Minat', label: 'Verbal & Komunikasi',     keywords: ['MINAT (MI-1)', 'VERBAL & KOMUNIKASI'] },
  { key: 'Minat.mi2',          modul: 'Minat', label: 'Logika & Data',           keywords: ['MINAT (MI-2)', 'LOGIKA & DATA'] },
  { key: 'Minat.mi3',          modul: 'Minat', label: 'Sains & Investigasi',     keywords: ['MINAT (MI-3)', 'SAINS & INVESTIGASI'] },
  { key: 'Minat.mi4',          modul: 'Minat', label: 'Visual & Desain',         keywords: ['MINAT (MI-4)', 'VISUAL & DESAIN'] },
  { key: 'Minat.mi5',          modul: 'Minat', label: 'Musikal & Auditori',      keywords: ['MINAT (MI-5)', 'MUSIKAL & AUDITORI'] },
  { key: 'Minat.mi6',          modul: 'Minat', label: 'Kinestetik & Praktis',    keywords: ['MINAT (MI-6)', 'KINESTETIK & PRAKTIS'] },
  { key: 'Minat.mi7',          modul: 'Minat', label: 'Sosial & Kolaborasi',     keywords: ['MINAT (MI-7)', 'SOSIAL & KOLABORASI'] },
  { key: 'Minat.akademik',     modul: 'Minat', label: 'Akademik',                keywords: ['MINAT AKADEMIK'] },
  { key: 'Minat.seni',         modul: 'Minat', label: 'Seni & Kreativitas',      keywords: ['MINAT SENI', 'SENI & KREATIVITAS'] },
  { key: 'Minat.sosial',       modul: 'Minat', label: 'Sosial',                  keywords: ['MINAT SOSIAL'] },
  { key: 'Minat.teknik',       modul: 'Minat', label: 'Teknik',                  keywords: ['MINAT TEKNIK', 'TEKNIK DAN MEMBANGUN'] },
  { key: 'Minat.alam',         modul: 'Minat', label: 'Alam & Lingkungan',       keywords: ['MINAT ALAM', 'ALAM DAN LINGKUNGAN'] },
  { key: 'Minat.praktis',      modul: 'Minat', label: 'Praktis / Life Skills',   keywords: ['MINAT PRAKTIS', 'LIFE SKILLS'] },
  { key: 'Minat.olahraga',     modul: 'Minat', label: 'Olahraga',                keywords: ['MINAT OLAHRAGA'] },
  { key: 'Minat.kepemimpinan', modul: 'Minat', label: 'Kepemimpinan',            keywords: ['MINAT KEPEMIMPINAN', 'KEPEMIMPINAN DAN ORGANISASI'] },

  // MODUL E: Bakat / Potensi - SMA Potensi & 5 Dimensi Komitmen + 6 Bakat SD 4-6
  { key: 'Bakat.potensiKognitif', modul: 'Bakat', label: 'Potensi Kognitif & Penalaran', keywords: ['BAGIAN C - POTENSI KOGNITIF', 'POTENSI KOGNITIF & PENALARAN', 'POTENSI KOGNITIF'] },
  { key: 'Bakat.potensiKreatif',  modul: 'Bakat', label: 'Potensi Kreatif & Visual',     keywords: ['BAGIAN D - POTENSI KREATIF', 'POTENSI KREATIF'] },
  { key: 'Bakat.potensiMotorik',  modul: 'Bakat', label: 'Potensi Motorik & Praktis',    keywords: ['BAGIAN E - POTENSI MOTORIK', 'POTENSI MOTORIK'] },
  { key: 'Bakat.potensiSosial',   modul: 'Bakat', label: 'Potensi Sosial & Kolaborasi',  keywords: ['BAGIAN D - POTENSI SOSIAL', 'BAGIAN F - POTENSI SOSIAL', 'POTENSI SOSIAL, KOMUNIKASI', 'POTENSI SOSIAL'] },
  { key: 'Bakat.minatCur',        modul: 'Bakat', label: 'Rasa Ingin Tahu',              keywords: ['MINAT (B1)', '(B1): RASA INGIN TAHU'] },
  { key: 'Bakat.minatPer',        modul: 'Bakat', label: 'Ketekunan Minat',              keywords: ['MINAT (B2)', '(B2): KETEKUNAN'] },
  { key: 'Bakat.minatExp',        modul: 'Bakat', label: 'Eksplorasi Minat',             keywords: ['MINAT (B3)', '(B3): EKSPLORASI'] },
  { key: 'Bakat.minatInv',        modul: 'Bakat', label: 'Investasi Waktu',              keywords: ['MINAT (B4)', '(B4): INVESTASI'] },
  { key: 'Bakat.minatAut',        modul: 'Bakat', label: 'Otonomi & Inisiatif',          keywords: ['MINAT (B5)', '(B5): OTONOMI'] },
  { key: 'Bakat.numerik',       modul: 'Bakat', label: 'Bakat Numerik',          keywords: ['BAKAT NUMERIK'] },
  { key: 'Bakat.logika',        modul: 'Bakat', label: 'Logika',                 keywords: ['LOGIKA (11', 'BAKAT LOGIKA'] },
  { key: 'Bakat.bahasa',        modul: 'Bakat', label: 'Bahasa',                 keywords: ['BAHASA (21', 'BAKAT BAHASA'] },
  { key: 'Bakat.visualSpasial', modul: 'Bakat', label: 'Visual Spasial',         keywords: ['VISUAL SPASIAL (31', 'VISUAL SPASIAL'] },
  { key: 'Bakat.musikRitme',    modul: 'Bakat', label: 'Musik / Ritme',          keywords: ['MUSIK / RITME', 'BAGIAN 5 MUSIK'] },
  { key: 'Bakat.sosialPemimpin',modul: 'Bakat', label: 'Sosial & Kepemimpinan',  keywords: ['SOSIAL & KEPEMIMPINAN', 'BAGIAN 6 SOSIAL'] },

  // MODUL F: Lingkungan (Faktor Eksternal) - 4 Subtes
  { key: 'Lingkungan.fasilitas',    modul: 'Lingkungan', label: 'Lingkungan Belajar',     keywords: ['LINGKUNGAN BELAJAR', 'DIMENSI 1'] },
  { key: 'Lingkungan.orangTua',     modul: 'Lingkungan', label: 'Hubungan dg Orang Tua',  keywords: ['HUBUNGAN DENGAN ORANG TUA', 'ORANG TUA', 'DUKUNGAN EMOSIONAL'] },
  { key: 'Lingkungan.dukunganMinat',modul: 'Lingkungan', label: 'Dukungan Minat',         keywords: ['DUKUNGAN MINAT', 'DIMENSI 3', 'EKSPLORASI MINAT DAN BAKAT'] },
  { key: 'Lingkungan.kegiatanRumah',modul: 'Lingkungan', label: 'Kegiatan di Rumah',      keywords: ['KEGIATAN DI RUMAH', 'DIMENSI 4', 'POLA PENGASUHAN'] }
];

// Tabel Lookup Teks Interpretasi Standar
const INTERPRETASI = {
  IQ: {
    sangatTinggi: "Kapasitas mental unggul dalam melihat pola abstrak, cocok untuk bidang lanjut. Potensi luar biasa di bidang analitis dengan memori kerja yang sangat kuat dan kecepatan pemrosesan informasi kognitif yang efisien.",
    tinggi: "Kemampuan kognitif berkembang dengan sangat baik. Daya ingat jangka pendek baik dan efisien dalam tugas rutin. Nyaman dengan pemecahan masalah kuantitatif dan penalaran visual.",
    cukup: "Kapasitas kognitif dasar masih dalam tahap berkembang. Mungkin butuh waktu lebih serta strategi seperti catatan atau pengulangan untuk menyerap pelajaran. Perlu pendekatan konkret dan visual.",
    kurang: "Perhatian terhadap pengembangan kognitif perlu ditambah. Berikan waktu ekstra dan hindari situasi yang terlalu menekan kecepatan tingkat berpikir anak."
  },
  EQ: {
    sangatTinggi: "Kematangan emosional yang terpola luar biasa. Mampu mengelola rasa dengan baik, tenang dalam tekanan, konsisten dalam kebenaran, serta peka terhadap orang lain (potensi pemimpin suportif).",
    tinggi: "Secara mental peduli dan jujur. Kadang kala masih perlu sedikit bimbingan tambahan saat menghadapi rasa frustrasi bertubi-tubi.",
    cukup: "Masih belajar mengelola rasa, memahami perspektif orang lain, dan melatih kendali. Perlu terus diingatkan tentang komitmen dan strategi menenangkan diri.",
    kurang: "Sering butuh waktu lama untuk tenang dan meregulasi rasa. Sangat disarankan untuk banyak dibimbing cara mengekspresikan diri tanpa harus meledak-ledak."
  },
  SQ: {
    sangatTinggi: "Memiliki kepekaan batin dan refleksi diri yang luar biasa. Sangat berbudi pada lingkungan, konsisten menjalankan nilai-nilai luhur dan empati esensial yang tinggi.",
    tinggi: "Mulai bertanya secara aktif mengenai tujuan dan makna hidupnya. Memahami pentingnya nilai asasi dan umumnya sangat bertanggung jawab di segala tugas kebatinan.",
    cukup: "Masih dalam tahap mencari jati diri. Terkadang masih perlu diingatkan mengenai pentingnya kewajiban sebagai manusia terhadap sesamanya.",
    kurang: "Sangat butuh pendampingan aktif untuk mengenali hati nurani. Fokuskan pada teladan kuat serta konsekuensi dasar tentang baik & benar di tahap fundamental."
  }
};

// Tabel Matrix Kombinasi IQ
const KOMBINASI_IQ = [
  { 
    keys: ['IQ.nonVerbal', 'IQ.spasial'], requiredStatus: 'Tinggi/Sangat Tinggi', 
    teks: "Kombinasi Logis & Spasial Kuat: Individu bertumbuh kuat secara visual kognitif. Arahkan secara aktif ke bidang desain, arsitektur, teknik, atau pemrograman."
  },
  { 
    keys: ['IQ.verbal', 'IQ.numerik'], requiredStatus: 'Tinggi/Sangat Tinggi', 
    teks: "Kombinasi Berpikir Kuantitatif Kuat: Terdeteksi kapasitas nalar yang sangat baik. Direkomendasikan untuk studi sains, hukum, rekayasa logika lisan, maupun numerik."
  },
  { 
    keys: ['IQ.workingMemory', 'IQ.processingSpeed'], requiredStatus: 'Tinggi/Sangat Tinggi', 
    teks: "Kombinasi Memori & Kecepatan Kuat: Mengelola abstraksi sangat baik. Anak ini mampu mengikuti ritme materi berpikir cepat, sehingga butuh porsi tantangan ekstra."
  },
  { 
    keys: ['IQ.numerik', 'IQ.spasial'], requiredStatus: 'Kurang', 
    teks: "Kombinasi Mental & Penalaran Rendah: Perhatikan pola asuh dan materi konkret. Sangat membutuhkan alat peraga nyata dalam tiap melatih fungsi daya pikirnya."
  }
];

// Tabel Matrix Kombinasi EQ
const KOMBINASI_EQ = [
  {
    keys: ['EQ.empati', 'EQ.regulasi'], requiredStatus: 'Tinggi/Sangat Tinggi',
    teks: "Sinergi Kematangan Emosi Stabil Luar Biasa: Individu ini memiliki kelenturan rasa yang baik di atas rata-rata usia. Cocok memegang peran fasilitasi/pengurus kelas."
  },
  {
    keys: ['EQ.regulasi', 'EQ.integritas'], requiredStatus: 'Tinggi/Sangat Tinggi',
    teks: "Keunggulan Ketangguhan Emosi Penuh: Karakter asasi sangat mantap. Jangan terlalu mengatur anak ini, berikan ia tanggung jawab moral mandiri sedikit demi sedikit."
  },
  {
    keys: ['EQ.empati', 'EQ.regulasi'], requiredStatus: 'Kurang',
    teks: "Potensi Kepekaan Kurang Berkembang: Butuh pembinaan agar terhindar dari tantrum berlebih. Ajarkan teknik regulasi pernapasan rutin pada setiap siklus belajar."
  }
];
