// KUIS_MAPPING — Keywords disesuaikan dengan nama kuis aktual di Moodle Course 63 (SD Kelas 4-6)
const KUIS_MAPPING = [
  // MODUL A: Kemampuan Kognitif (IQ) - 6 Subtes
  { key: 'IQ.nonVerbal',       modul: 'IQ',    label: 'Penalaran Non Verbal',    keywords: ['PKB A', 'NON VERBAL'] },
  { key: 'IQ.verbal',          modul: 'IQ',    label: 'Penalaran Verbal',        keywords: ['PKB B', 'PENALARAN VERBAL'] },
  { key: 'IQ.numerik',         modul: 'IQ',    label: 'Kemampuan Numerik',       keywords: ['PKB C', 'KEMAMPUAN NUMERIK'] },
  { key: 'IQ.spasial',         modul: 'IQ',    label: 'Penalaran Spasial',       keywords: ['PKB D', 'PENALARAN SPASIAL'] },
  { key: 'IQ.workingMemory',   modul: 'IQ',    label: 'Memori Kerja',            keywords: ['PKB E', 'MEMORI KERJA'] },
  { key: 'IQ.processingSpeed', modul: 'IQ',    label: 'Kecepatan Pemrosesan',    keywords: ['PKB F', 'PEMROSESAN'] },

  // MODUL B: Kematangan Emosi (EQ) - 3 Subtes
  { key: 'EQ.empati',          modul: 'EQ',    label: 'Empati',                  keywords: ['PPD 1', 'EMPATI'] },
  { key: 'EQ.regulasi',        modul: 'EQ',    label: 'Regulasi Emosi',          keywords: ['PPD 2', 'REGULASI'] },
  { key: 'EQ.integritas',      modul: 'EQ',    label: 'Integritas',              keywords: ['PPD 3', 'INTEGRITAS'] },

  // MODUL C: Kesadaran Batin (SQ) - 3 Subtes
  { key: 'SQ.kesadaranDiri',   modul: 'SQ',    label: 'Kesadaran Diri',          keywords: ['PKD&R 1', 'PKD&R  1', 'KESADARAN DIRI'] },
  { key: 'SQ.nilaiNiat',       modul: 'SQ',    label: 'Nilai & Niat',            keywords: ['PKD&R 2', 'PKD&R  2', 'NILAI & NIAT'] },
  { key: 'SQ.tanggungJawab',   modul: 'SQ',    label: 'Tanggung Jawab',          keywords: ['PKD&R 3', 'PKD&R  3', 'TANGGUNG JAWAB'] },

  // MODUL D: Minat (Pola Minat Utama) - 8 Subtes
  { key: 'Minat.akademik',     modul: 'Minat', label: 'Akademik',                keywords: ['MINAT AKADEMIK', 'AKADEMIK'] },
  { key: 'Minat.seni',         modul: 'Minat', label: 'Seni & Kreativitas',      keywords: ['MINAT SENI', 'SENI & KREATIVITAS'] },
  { key: 'Minat.sosial',       modul: 'Minat', label: 'Sosial',                  keywords: ['MINAT SOSIAL'] },
  { key: 'Minat.teknik',       modul: 'Minat', label: 'Teknik',                  keywords: ['MINAT TEKNIK', 'TEKNIK DAN MEMBANGUN'] },
  { key: 'Minat.alam',         modul: 'Minat', label: 'Alam & Lingkungan',       keywords: ['MINAT ALAM', 'ALAM DAN LINGKUNGAN'] },
  { key: 'Minat.praktis',      modul: 'Minat', label: 'Praktis / Life Skills',   keywords: ['MINAT PRAKTIS', 'LIFE SKILLS'] },
  { key: 'Minat.olahraga',     modul: 'Minat', label: 'Olahraga',                keywords: ['MINAT OLAHRAGA'] },
  { key: 'Minat.kepemimpinan', modul: 'Minat', label: 'Kepemimpinan',            keywords: ['MINAT KEPEMIMPINAN', 'KEPEMIMPINAN DAN ORGANISASI'] },

  // MODUL E: Bakat (Aptitude Spesifik) - 6 Subtes
  { key: 'Bakat.numerik',       modul: 'Bakat', label: 'Bakat Numerik',          keywords: ['BAKAT NUMERIK'] },
  { key: 'Bakat.logika',        modul: 'Bakat', label: 'Logika',                 keywords: ['LOGIKA (11', 'LOGIKA'] },
  { key: 'Bakat.bahasa',        modul: 'Bakat', label: 'Bahasa',                 keywords: ['BAHASA (21', 'BAHASA'] },
  { key: 'Bakat.visualSpasial', modul: 'Bakat', label: 'Visual Spasial',         keywords: ['VISUAL SPASIAL (31', 'VISUAL SPASIAL'] },
  { key: 'Bakat.musikRitme',    modul: 'Bakat', label: 'Musik / Ritme',          keywords: ['MUSIK / RITME', 'MUSIK'] },
  { key: 'Bakat.sosialPemimpin',modul: 'Bakat', label: 'Sosial & Kepemimpinan',  keywords: ['SOSIAL & KEPEMIMPINAN', 'SOSIAL (51'] },

  // MODUL F: Lingkungan (Faktor Eksternal) - 4 Subtes
  { key: 'Lingkungan.fasilitas',    modul: 'Lingkungan', label: 'Lingkungan Belajar',     keywords: ['LINGKUNGAN BELAJAR'] },
  { key: 'Lingkungan.orangTua',     modul: 'Lingkungan', label: 'Hubungan dg Orang Tua',  keywords: ['HUBUNGAN DENGAN ORANG TUA', 'ORANG TUA'] },
  { key: 'Lingkungan.dukunganMinat',modul: 'Lingkungan', label: 'Dukungan Minat',         keywords: ['DUKUNGAN MINAT'] },
  { key: 'Lingkungan.kegiatanRumah',modul: 'Lingkungan', label: 'Kegiatan di Rumah',      keywords: ['KEGIATAN DI RUMAH'] }
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
