# Rapor LMS Erlass (Rapor Hasil Belajar & Asesmen Bakat)

Aplikasi web modern terintegrasi untuk kalkulasi nilai, visualisasi radar radar/batang kompetensi, interpretasi otomatis hasil asesmen siswa, serta pencetakan dan proteksi dokumen PDF Rapor Hasil Belajar siswa Erlass Academy.

---

## 🌟 Fitur Utama

1. **Sinkronisasi & Penarikan Nilai Real-time**:
   - Terintegrasi dengan basis data Moodle LMS melalui `api_scores.php` untuk menarik nilai kuis, tugas, dan progres aktivitas kursus.
2. **Mesin Interpretasi Otomatis (Interpretation Engine v2)**:
   - Mengubah skor kuantitatif siswa menjadi narasi deskriptif kualitatif yang mendalam (analisis gaya belajar, kekuatan kognitif, minat bakat, dan rekomendasi pengembangan).
3. **Visualisasi Interaktif (Chart.js)**:
   - Grafik radar dan batang per aspek kompetensi dengan label data visual yang tajam.
4. **Pencetakan PDF Kualitas Cetak (Print-Ready)**:
   - Ditenagai oleh `html2pdf.js` dengan layout A4 proporsional standar cetak resmi.
5. **Keamanan Dokumen (PDF Password Encryption Lite)**:
   - Dukungan enkripsi kata sandi dokumen PDF (misal: menggunakan tanggal lahir atau NISN siswa) untuk menjamin privasi hasil belajar.
6. **Ekspor Massal (Bulk Zip Export)**:
   - Ditenagai oleh `JSZip` untuk mengunduh ratusan rapor siswa dalam satu file ZIP terkompresi.

---

## 🏗️ Struktur Direktori

```text
/var/www/rapor-erlass/
├── index.html                           # Antarmuka dashboard generator rapor
├── api_scores.php                       # API backend penarikan nilai dari database/LMS
├── css/
│   ├── style.css                        # Styling tampilan rapor & tata letak cetak
│   └── vendor/
│       ├── bootstrap.min.css            # Framework styling responsif
│       ├── all.min.css                  # FontAwesome icon kit
│       └── webfonts/                    # Berkas font ikon
├── js/
│   ├── ui.js                            # Manipulasi DOM, navigasi, dan interaksi form
│   ├── engine.js                        # Kalkulator skor agregat & pembobotan
│   ├── erlass-interpretation-engine-v2.js # Engine narasi interpretasi hasil belajar
│   ├── data-mapping.js                  # Pemetaan mata pelajaran, modul & kompetensi
│   └── vendor/
│       ├── bootstrap.bundle.min.js      # Bootstrap JS
│       ├── chart.js                     # Library grafik data
│       ├── chartjs-plugin-datalabels.min.js # Label angka pada grafik
│       ├── html2pdf.bundle.min.js       # Renderer HTML ke PDF
│       ├── pdf-encrypt-lite.bundle.js   # Proteksi kata sandi file PDF
│       └── jszip.min.js                 # Pembuat file arsip ZIP massal
└── img/
    ├── logo_coding.png
    ├── logo_erlass.png
    └── logoerlassacademy.png
```

---

## 🚀 Panduan Penggunaan & Akses

- **URL Akses Produksi:** [https://rapor.erlass.academy/](https://rapor.erlass.academy/)
- **Server Path:** `/var/www/rapor-erlass/` (symlink di `/root/rapor-erlass`)
- **Git Repository:** `git@github.com:ErlassErlass/raporlmserlass.git` (Branch `main`)

---

## 🔒 Lisensi & Hak Cipta
Hak Cipta © 2026 PT. Erlass Prokreatif Indonesia. Seluruh hak cipta dilindungi undang-undang.

