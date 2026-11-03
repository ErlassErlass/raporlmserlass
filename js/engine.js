class AssessmentEngine {
  constructor() {
    this.rawData = [];
    this.students = [];
  }

  // Menyiapkan struktur subtopik kanonik baku untuk 1 peserta
  initCanonicalSubtopics() {
    const subtopics = {};
    const modules = ['IQ', 'EQ', 'SQ', 'Minat', 'Bakat', 'Lingkungan'];
    modules.forEach(m => { subtopics[m] = []; });

    if (typeof KUIS_MAPPING !== 'undefined') {
      KUIS_MAPPING.forEach(m => {
        if (!subtopics[m.modul]) subtopics[m.modul] = [];
        subtopics[m.modul].push({
          key: m.key,
          label: m.label,
          nilai: 0,
          attempted: false,
          levelStatus: this.classifyScore(0)
        });
      });
    }
    return subtopics;
  }

  processData() {
    let studentMap = {};

    let dataArray = this.rawData;
    if (Array.isArray(this.rawData)) {
      const tableNode = this.rawData.find(item => item.type === 'table' && item.data);
      if (tableNode) dataArray = tableNode.data;
    } else if (this.rawData && Array.isArray(this.rawData.data)) {
      dataArray = this.rawData.data;
    }

    if (!Array.isArray(dataArray)) {
      this.students = [];
      return;
    }

    // Flatten data bila format dari API berupa objek siswa dengan kuis bersarang
    let flatRows = [];
    dataArray.forEach(item => {
      if (item && Array.isArray(item.kuis)) {
        // Objek siswa dari api_scores.php
        const email = item.email || '';
        const namaDepan = item.nama_depan || '';
        const namaBelakang = item.nama_belakang || '';
        const program = this.rawData.course_name || item.program || 'Profil Potensi & Karakter SD Kelas 4-6';

        // Pastikan entri siswa terbuat meski kuis kosong
        if (email && !studentMap[email]) {
          studentMap[email] = {
            namaLengkap: `${namaDepan} ${namaBelakang}`.trim() || email,
            email: email,
            program: program,
            scores: {},
            modulCounts: { IQ: 0, EQ: 0, SQ: 0, Minat: 0, Bakat: 0, Lingkungan: 0 },
            subtopics: this.initCanonicalSubtopics()
          };
        }

        item.kuis.forEach(q => {
          flatRows.push({
            email: email,
            nama_depan: namaDepan,
            nama_belakang: namaBelakang,
            nama_course: program,
            nama_kuis: q.nama_kuis,
            nilai: q.nilai
          });
        });
      } else if (item) {
        flatRows.push(item);
      }
    });

    // Proses setiap baris kuis
    flatRows.forEach(row => {
      const email = row.email || row['Email address'] || row['Email'] || '';
      if (!email || email.trim() === '') return;

      if (!studentMap[email]) {
        studentMap[email] = {
          namaLengkap: `${row.nama_depan || row['First name'] || row['Nama Depan'] || ''} ${row.nama_belakang || row['Last name'] || row['Nama Belakang'] || ''}`.trim() || email,
          email: email,
          program: row.nama_course || row['Course name'] || row['Nama Course'] || (this.rawData && this.rawData.course_name) || 'Profil Potensi & Karakter SD Kelas 4-6',
          scores: {},
          modulCounts: { IQ: 0, EQ: 0, SQ: 0, Minat: 0, Bakat: 0, Lingkungan: 0 },
          subtopics: this.initCanonicalSubtopics()
        };
      }

      // Bersihkan nama kuis dari emoji & spasi ganda untuk pencocokan akurat
      const rawNama = (row.nama_kuis || row['Item name'] || row['Nama Kuis'] || '');
      const namaKuis = rawNama.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
      const nilai = parseFloat(row.nilai !== undefined ? row.nilai : (row.nilai_persen || row.nilai_akhir || row['Grade/10.00'] || row['Nilai Akhir'] || 0));

      if (typeof KUIS_MAPPING !== 'undefined') {
        const mapping = KUIS_MAPPING.find(m => 
          m.keywords.some(kw => {
            const kwClean = kw.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
            return namaKuis.includes(kwClean);
          })
        );

        if (mapping) {
          studentMap[email].scores[mapping.key] = {
            nilai: nilai,
            levelStatus: this.classifyScore(nilai)
          };
          studentMap[email].modulCounts[mapping.modul]++;

          // Update entri subtopik yang bersangkutan
          if (!studentMap[email].subtopics[mapping.modul]) {
            studentMap[email].subtopics[mapping.modul] = [];
          }
          const existingItem = studentMap[email].subtopics[mapping.modul].find(it => it.key === mapping.key);
          if (existingItem) {
            existingItem.nilai = nilai;
            existingItem.attempted = true;
            existingItem.levelStatus = this.classifyScore(nilai);
          } else {
            studentMap[email].subtopics[mapping.modul].push({
              key: mapping.key,
              label: mapping.label,
              nilai: nilai,
              attempted: true,
              levelStatus: this.classifyScore(nilai)
            });
          }
        }
      }
    });

    this.students = Object.values(studentMap);
    this.processTop3();
  }

  classifyScore(score) {
    if (score >= 80) return { label: 'Sangat Tinggi', colorClass: 'bg-sangat-tinggi', interpretasiKey: 'sangatTinggi' };
    if (score >= 65) return { label: 'Tinggi', colorClass: 'bg-tinggi', interpretasiKey: 'tinggi' };
    if (score >= 40) return { label: 'Cukup', colorClass: 'bg-cukup', interpretasiKey: 'cukup' };
    return { label: 'Kurang', colorClass: 'bg-kurang', interpretasiKey: 'kurang' };
  }

  processTop3() {
    this.students.forEach(student => {
      // Sort Minat
      if (student.subtopics['Minat']) {
        // Buat salinan terurut untuk top 3
        const sortedMinat = [...student.subtopics['Minat']].sort((a, b) => b.nilai - a.nilai);
        const top3Keys = new Set(sortedMinat.slice(0, 3).map(it => it.key));
        student.subtopics['Minat'].forEach(item => {
          item.isTop3 = top3Keys.has(item.key);
        });
      }

      // Sort Bakat
      if (student.subtopics['Bakat']) {
        const sortedBakat = [...student.subtopics['Bakat']].sort((a, b) => b.nilai - a.nilai);
        const top3Keys = new Set(sortedBakat.slice(0, 3).map(it => it.key));
        student.subtopics['Bakat'].forEach(item => {
          item.isTop3 = top3Keys.has(item.key);
        });
      }

      this.calculateCombinations(student);
    });
  }

  calculateCombinations(student) {
    student.kombinasi = [];

    if (typeof KOMBINASI_IQ !== 'undefined') {
      KOMBINASI_IQ.forEach(kombo => {
        const v1 = student.scores[kombo.keys[0]];
        const v2 = student.scores[kombo.keys[1]];
        if (v1 && v2) {
          if (kombo.requiredStatus.includes('Tinggi')) {
            if (v1.nilai >= 65 && v2.nilai >= 65) student.kombinasi.push(kombo.teks);
          } else if (kombo.requiredStatus === 'Kurang') {
            if (v1.nilai < 40 && v2.nilai < 40) student.kombinasi.push(kombo.teks);
          }
        }
      });
    }

    if (typeof KOMBINASI_EQ !== 'undefined') {
      KOMBINASI_EQ.forEach(kombo => {
        const v1 = student.scores[kombo.keys[0]];
        const v2 = student.scores[kombo.keys[1]];
        if (v1 && v2) {
          if (kombo.requiredStatus.includes('Tinggi')) {
            if (v1.nilai >= 65 && v2.nilai >= 65) student.kombinasi.push(kombo.teks);
          } else if (kombo.requiredStatus === 'Kurang') {
            if (v1.nilai < 40 && v2.nilai < 40) student.kombinasi.push(kombo.teks);
          }
        }
      });
    }

    // Dynamic Top Synergy (Menjamin setiap siswa memiliki sinergi unik terkuat)
    const iqItems = student.subtopics['IQ'] ? [...student.subtopics['IQ']].sort((a, b) => b.nilai - a.nilai) : [];
    const bakatItems = student.subtopics['Bakat'] ? [...student.subtopics['Bakat']].sort((a, b) => b.nilai - a.nilai) : [];

    if (iqItems.length > 0 && bakatItems.length > 0 && (iqItems[0].nilai > 0 || bakatItems[0].nilai > 0)) {
      student.kombinasi.push(`Sinergi Potensi Utama: Terdapat perpaduan dominan antara kapasitas nalar pada <strong>"${iqItems[0].label}"</strong> (${Math.round(iqItems[0].nilai)}%) dan talenta bawaan pada <strong>"${bakatItems[0].label}"</strong> (${Math.round(bakatItems[0].nilai)}%). Integrasi perlintasan ini merupakan modalitas terkuat peserta didik dalam memecahkan masalah kompleks dan mengolah informasi di masa depan.`);
    }

    // Fallback bila data kuis belum lengkap
    if (student.kombinasi.length === 0) {
      student.kombinasi.push("Proses asesmen silang belum memadai untuk ditarik matriks kombinasinya. Dibutuhkan kelengkapan modul tes penuh.");
    }
  }

  getStudentByEmail(email) {
    return this.students.find(s => s.email === email);
  }
}
