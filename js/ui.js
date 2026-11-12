let engine = new AssessmentEngine();
let activeCharts = {};
let currentOpenEmail = null;

// API Config
const API_CONFIG = {
  endpoint: '/api_scores.php',
  token: 'Erlass101.',
  course: parseInt(sessionStorage.getItem('erlass_selected_course')) || 63
};

async function loadCourseList() {
  const select = document.getElementById('courseSelect');
  if (!select) return;

  try {
    const activeToken = sessionStorage.getItem('erlass_auth_token') || API_CONFIG.token;
    const res = await fetch(`${API_CONFIG.endpoint}?action=get_courses&token=${encodeURIComponent(activeToken)}`);
    const json = await res.json();
    if (json.status === 'ok' && json.courses && json.courses.length > 0) {
      let html = '';
      json.courses.forEach(c => {
        const isSel = (parseInt(c.id) === API_CONFIG.course) ? 'selected' : '';
        html += `<option value="${c.id}" ${isSel}>${c.fullname}</option>`;
      });
      select.innerHTML = html;
      select.value = API_CONFIG.course;
    }
  } catch (e) {
    console.warn('Gagal memuat daftar course dari API:', e);
  }
}

function handleCourseChange(courseId) {
  API_CONFIG.course = parseInt(courseId) || 63;
  sessionStorage.setItem('erlass_selected_course', API_CONFIG.course);
  fetchFromAPI();
}

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('jsonUpload');
  if (fileInput) { fileInput.addEventListener('change', handleFileUpload); }

  // Listener saat modal dibuka agar Chart.js mengukur ulang canvas yang kini visible
  const reportModalEl = document.getElementById('reportModal');
  if (reportModalEl) {
    reportModalEl.addEventListener('shown.bs.modal', () => {
      if (currentOpenEmail) {
        const student = engine.getStudentByEmail(currentOpenEmail);
        if (student) {
          populateTemplate(student);
        }
      }
    });
  }

  // Cek otentikasi passcode sebelum membuka dasbor
  checkAuth();
});

// =========================================================================
// SISTEM OTENTIKASI PASSCODE AKSES DASBOR
// =========================================================================
function checkAuth() {
  const token = sessionStorage.getItem('erlass_auth_token');
  const gateEl = document.getElementById('authGate');
  const appEl = document.getElementById('mainApp');

  const validTokens = ['Erlass101.', 'Erlass101', 'erlass101.', 'erlass101', 'ErLaSs2026Rapor', 'Erlass@2026'];
  if (token && validTokens.includes(token)) {
    if (gateEl) {
      gateEl.classList.add('d-none');
      gateEl.style.setProperty('display', 'none', 'important');
    }
    if (appEl) {
      appEl.classList.remove('d-none');
      appEl.style.setProperty('display', 'block', 'important');
    }
    const select = document.getElementById('courseSelect');
    if (select) select.value = API_CONFIG.course;
    loadCourseList();
    fetchFromAPI();
  } else {
    if (gateEl) {
      gateEl.classList.remove('d-none');
      gateEl.style.setProperty('display', 'flex', 'important');
    }
    if (appEl) {
      appEl.classList.add('d-none');
      appEl.style.setProperty('display', 'none', 'important');
    }
    const passInput = document.getElementById('passcodeInput');
    if (passInput) passInput.focus();
  }
}

async function handlePasscodeSubmit(e) {
  e.preventDefault();
  const inputEl = document.getElementById('passcodeInput');
  const errorEl = document.getElementById('authErrorMsg');
  const cardEl = document.querySelector('.auth-card');
  const btnEl = document.getElementById('btnAuthSubmit');
  const passcode = (inputEl.value || '').trim();

  if (!passcode) return;

  btnEl.disabled = true;
  btnEl.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Memverifikasi...';
  if (errorEl) errorEl.classList.add('d-none');

  try {
    const res = await fetch(`${API_CONFIG.endpoint}?action=verify_passcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: passcode })
    });
    const data = await res.json();

    if (res.ok && data.status === 'ok') {
      sessionStorage.setItem('erlass_auth_token', data.token);
      btnEl.innerHTML = '<i class="fas fa-check me-2"></i> Akses Diberikan!';
      btnEl.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      setTimeout(() => {
        checkAuth();
        btnEl.disabled = false;
        btnEl.style.background = '';
        btnEl.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i> Buka Akses Dasbor';
      }, 300);
    } else {
      throw new Error(data.message || 'Passcode salah.');
    }
  } catch (err) {
    if (errorEl) {
      errorEl.innerHTML = `<i class="fas fa-exclamation-circle me-1"></i> ${err.message || 'Passcode salah. Silakan coba lagi.'}`;
      errorEl.classList.remove('d-none');
    }
    if (cardEl) {
      cardEl.classList.add('shake');
      setTimeout(() => cardEl.classList.remove('shake'), 400);
    }
    inputEl.focus();
    inputEl.select();
    btnEl.disabled = false;
    btnEl.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i> Buka Akses Dasbor';
  }
}

function togglePasscodeVisibility() {
  const input = document.getElementById('passcodeInput');
  const icon = document.getElementById('togglePasscodeIcon');
  if (!input || !icon) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

function lockDashboard() {
  sessionStorage.removeItem('erlass_auth_token');
  engine.students = [];
  engine.rawData = [];
  const passInput = document.getElementById('passcodeInput');
  if (passInput) passInput.value = '';
  checkAuth();
}

async function fetchFromAPI() {
  const statusEl = document.getElementById('uploadStatus');
  const tbodyEl = document.getElementById('studentTableBody');

  statusEl.innerHTML = '<i class="fas fa-sync fa-spin text-primary"></i> Memuat data dari Moodle...';
  tbodyEl.innerHTML = '<tr><td colspan="5" class="text-center p-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Menghubungkan ke database Moodle...</p></td></tr>';

  try {
    const activeToken = sessionStorage.getItem('erlass_auth_token') || API_CONFIG.token;
    const url = `${API_CONFIG.endpoint}?token=${encodeURIComponent(activeToken)}&course=${API_CONFIG.course}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (json.status !== 'ok') throw new Error(json.error || 'API error');

    engine.rawData = json;
    engine.processData();
    renderTable(engine.students);

    const info = `<i class="fas fa-check text-success"></i> <strong>${json.course_name}</strong> — ${engine.students.length} peserta dimuat`;
    statusEl.innerHTML = info;
    document.getElementById('btnBulkPrint').disabled = engine.students.length === 0;

  } catch (err) {
    statusEl.innerHTML = '<i class="fas fa-exclamation-triangle text-warning"></i> Gagal memuat API — gunakan unggah JSON manual';
    tbodyEl.innerHTML = '<tr><td colspan="5" class="text-center p-5 text-muted"><i class="fas fa-upload fa-2x mb-3 d-block"></i>Unggah file u(2).json untuk mode offline.</td></tr>';
    console.warn('API fetch error:', err);
  }
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsedData = JSON.parse(e.target.result);
      engine.rawData = parsedData;
      engine.processData();
      renderTable(engine.students);
      document.getElementById('uploadStatus').innerHTML = `<i class="fas fa-check text-success"></i> ${file.name} diproses (${engine.students.length} peserta)`;
      document.getElementById('btnBulkPrint').disabled = false;
    } catch (err) {
      alert("Format JSON error!");
    }
  };
  reader.readAsText(file);
}

function renderTable(students) {
  const tbody = document.getElementById('studentTableBody');
  tbody.innerHTML = '';

  const expectedTotal = (engine.rawData && engine.rawData.total_kuis)
    ? parseInt(engine.rawData.total_kuis, 10)
    : 30;

  students.forEach((s, idx) => {
    // Hitung kuis riil yang sudah diselesaikan (kecuali sub-dimensi turunan)
    let attemptedCount = 0;
    Object.values(s.subtopics || {}).forEach(arr => {
      attemptedCount += arr.filter(it => it.attempted && !it.isSubdimension).length;
    });
    const finalAttempted = Math.max(attemptedCount, s.completedQuizzes || 0);

    const isLengkap = expectedTotal > 0 && finalAttempted >= expectedTotal;
    const badge = isLengkap
      ? `<span class="badge bg-success">Siap (${finalAttempted}/${expectedTotal})</span>`
      : `<span class="badge bg-warning text-dark">Parsial (${finalAttempted}/${expectedTotal})</span>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td class="fw-bold">${s.namaLengkap || s.email}</td>
      <td class="text-muted small">${s.email}</td>
      <td>${badge}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-dark" onclick="openReport('${s.email}')">
          <i class="fas fa-book-open me-1"></i> Mode Rapor PDF
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openReport(email) {
  const student = engine.getStudentByEmail(email);
  if (!student) return;

  currentOpenEmail = email;
  populateTemplate(student);

  const modalEl = document.getElementById('reportModal');
  const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modal.show();

  // Redraw setelah modal muncul untuk memastikan dimensi canvas terhitung sempurna
  setTimeout(() => {
    populateTemplate(student);
  }, 180);
}

function populateTemplate(student) {
  // Header Bio
  document.getElementById('pdfNama').textContent = (student.namaLengkap || "N/A").toUpperCase();
  document.getElementById('pdfEmail').textContent = student.email.toUpperCase();

  // Create Unique Hash for Certificate ID
  const dt = new Date();
  let hash = 0;
  for (let i = 0; i < student.email.length; i++) hash = ((hash << 5) - hash) + student.email.charCodeAt(i);
  const certId = "ERL/TPA/" + String(dt.getFullYear()) + ('0' + (dt.getMonth() + 1)).slice(-2) + "/" + Math.abs(hash).toString().substring(0, 5);
  document.getElementById('pdfSertifikat').textContent = certId;
  document.getElementById('pdfProgramTes').textContent = student.program || "Potensi, Minat, dan Bakat SD Kelas 4-6";
  const tglTeks = new Date().toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'});
  document.getElementById('pdfTanggal').textContent = tglTeks;
  document.getElementById('sigTanggal').textContent = tglTeks;

  // Halaman 1 Charts (5 Charts)
  const jenjangDetected = (typeof detectJenjang === 'function') ? detectJenjang(student.program) : 'SD_4_6';
  const iqData = student.subtopics['IQ'] || [];
  const attemptedBakat = (student.subtopics['Bakat'] || []).filter(x => x.attempted);
  const nonSubBakat = attemptedBakat.filter(x => !x.isSubdimension);
  const minatDepthDims = attemptedBakat.filter(x => x.isSubdimension);

  const eqData = (student.subtopics['EQ'] || []).filter(x => x.attempted);
  const sqData = (student.subtopics['SQ'] || []).filter(x => x.attempted);

  const allAttemptedMinat = (student.subtopics['Minat'] || []).filter(x => x.attempted);
  const domainMinat = allAttemptedMinat.filter(x => !['Minat.preferensi', 'Minat.kedalaman'].includes(x.key));
  const minData = domainMinat.length > 0 ? domainMinat : allAttemptedMinat;

  // Radar kanan: Untuk SD 4-6 tampilkan 6 Bakat Aptitude. Untuk SMA/SMK tampilkan Potensi + Kedalaman Minat jika subtes Bakat < 3.
  let bakatDisplay = [];
  const bakatRadarTitleEl = document.getElementById('bakatRadarTitle');
  const bakatTop3TitleEl = document.getElementById('bakatTop3Title');

  if (jenjangDetected === 'SMA' || jenjangDetected === 'SMP') {
    const prefItem = allAttemptedMinat.find(m => m.key === 'Minat.preferensi');
    const smaRadarPool = [...nonSubBakat];
    if (nonSubBakat.length < 4) {
      if (prefItem) {
        smaRadarPool.push({ ...prefItem, label: 'Kejelasan Minat' });
      }
      minatDepthDims.forEach(d => smaRadarPool.push(d));
    }
    bakatDisplay = smaRadarPool;

    if (bakatRadarTitleEl) {
      bakatRadarTitleEl.textContent = (nonSubBakat.length >= 4) ? 'Pemetaan Potensi & Bakat' : 'Profil Potensi & Komitmen Minat';
    }
    if (bakatTop3TitleEl) {
      bakatTop3TitleEl.innerHTML = `<i class="fas fa-gem text-danger me-2"></i> ${(nonSubBakat.length >= 4) ? 'Tiga Potensi Paling Dominan' : 'Potensi & Komitmen Dominan'}`;
    }
  } else {
    bakatDisplay = nonSubBakat;
    if (bakatRadarTitleEl) bakatRadarTitleEl.textContent = 'Pemetaan Bakat (Aptitude)';
    if (bakatTop3TitleEl) bakatTop3TitleEl.innerHTML = '<i class="fas fa-gem text-danger me-2"></i> Tiga Bakat Paling Dominan';
  }

  const hasIqAttempt = iqData.some(x => x.attempted);
  renderChart('iqRadarChart', 'radar', hasIqAttempt ? iqData : [], 'Kemampuan Kognitif', 'rgba(79, 70, 229, 0.25)', '#4F46E5', null);
  renderChart('bakatRadarChart', 'radar', bakatDisplay, 'Potensi & Bakat', 'rgba(236, 72, 153, 0.25)', '#EC4899', null);

  // Bar EQ, SQ, Minat
  renderChart('eqBarChart', 'bar', eqData, 'Kematangan Emosi', 'rgba(34, 197, 94, 0.75)', '#16A34A', false);
  renderChart('sqBarChart', 'bar', sqData, 'Kesadaran Batin', 'rgba(14, 165, 233, 0.75)', '#0284C7', false);
  renderChart('minatBarChart', 'bar', minData, 'Minat', 'rgba(245, 158, 11, 0.85)', '#D97706', true); // Minat Horizontal Bar

  // Dynamic Jenjang Tagline & Branding
  const JENJANG_TITLES = {
    'SD_1_3': 'MENGENALI DIRIKU (Discovering Me)',
    'SD_4_6': 'MENGENALI POTENSIKU (Discovering My Potential)',
    'SMP': 'MENGEKSPLORASI POTENSIKU (Exploring My Potential)',
    'SMA': 'MENEMUKAN ARAHKU (Exploring My Direction)'
  };
  const jenjangPillEl = document.getElementById('pdfReportJenjangPill');
  if (jenjangPillEl) {
    jenjangPillEl.textContent = JENJANG_TITLES[jenjangDetected] || 'MENGENALI POTENSIKU';
  }

  // Halaman 2 & 3 Text & Interpretasi Master V2 (Adaptif Jenjang & Usia)
  let full = null;
  if (typeof updateStudentReportFull !== 'undefined') {
    try {
      full = updateStudentReportFull(student);
    } catch (err) {
      console.warn("Master interpretation engine error:", err);
    }
  }

  updateKognitifDomain(student, full);
  updateEQDomain(student, full);
  updateSQDomain(student, full);

  // Halaman 3 Top 3 & Sinergi
  renderTop3ListHtml('minatTop3List', minData, '#D97706');
  renderTop3ListHtml('bakatTop3List', bakatDisplay, '#EC4899');
  updateSinergiMinatPotensi(student, full);
}

function updateKognitifDomain(student, full) {
  const values = student.subtopics['IQ'] || [];
  const badgeEl = document.getElementById('pdfIqBadge');
  const normBadgeEl = document.getElementById('pdfIqNormBadge');
  const textEl = document.getElementById('pdfIqText');
  const pointsEl = document.getElementById('pdfIqPoints');
  if (!badgeEl || !textEl) return;

  const attemptedValues = values.filter(x => x.attempted);
  if (attemptedValues.length > 0) {
    const avg = attemptedValues.reduce((sum, item) => sum + item.nilai, 0) / attemptedValues.length;
    const lvl = engine.classifyScore(avg);

    badgeEl.textContent = `${lvl.label} (${avg.toFixed(1)}%)`;
    badgeEl.className = `score-badge badge-level ${lvl.colorClass} mb-0`;

    if (full && full.kognitif) {
      if (normBadgeEl && full.kognitif.posisiNormatif) {
        normBadgeEl.textContent = `Indeks: ${full.kognitif.cognitiveIndex} • ${full.kognitif.posisiNormatif}`;
        normBadgeEl.style.display = 'inline-block';
      }
      textEl.innerText = full.kognitif.interpretasi;

      if (pointsEl) {
        let htmlPoints = [];
        if (full.kognitif.kekuatanRelatif && full.kognitif.kekuatanRelatif.length > 0) {
          const badges = full.kognitif.kekuatanRelatif.map(k => `<span class="badge bg-success-subtle text-success border border-success-subtle me-1" style="font-size: 7.5pt;">${k}</span>`).join('');
          htmlPoints.push(`<div><strong class="text-success"><i class="fas fa-arrow-trend-up me-1"></i>Kekuatan Berpikir:</strong> ${badges}</div>`);
        }
        if (full.kognitif.areaPengembangan && full.kognitif.areaPengembangan.length > 0) {
          const badges = full.kognitif.areaPengembangan.map(a => `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle me-1" style="font-size: 7.5pt;">${a}</span>`).join('');
          htmlPoints.push(`<div class="mt-1"><strong class="text-warning-emphasis"><i class="fas fa-seedling me-1"></i>Area Stimulasi:</strong> ${badges}</div>`);
        }
        if (full.kognitif.rekomendasi && full.kognitif.rekomendasi.length > 0) {
          htmlPoints.push(`<div class="mt-1 text-muted" style="font-size: 7.8pt;"><i class="fas fa-lightbulb text-warning me-1"></i><em>Saran Belajar: ${full.kognitif.rekomendasi[0]}</em></div>`);
        }
        if (htmlPoints.length > 0) {
          pointsEl.innerHTML = htmlPoints.join('');
          pointsEl.style.display = 'block';
        } else {
          pointsEl.style.display = 'none';
        }
      }
    } else if (typeof INTERPRETASI !== 'undefined' && INTERPRETASI['IQ'] && INTERPRETASI['IQ'][lvl.interpretasiKey]) {
      textEl.innerText = INTERPRETASI['IQ'][lvl.interpretasiKey];
      if (pointsEl) pointsEl.style.display = 'none';
    } else {
      textEl.innerText = "Data evaluasi subtopik sedang dalam proses standardisasi.";
      if (pointsEl) pointsEl.style.display = 'none';
    }
  } else {
    badgeEl.textContent = "Belum Mengikuti";
    badgeEl.className = "score-badge bg-secondary mb-0";
    if (normBadgeEl) normBadgeEl.style.display = 'none';
    textEl.innerText = "Asesmen kemampuan kognitif belum diselesaikan oleh peserta didik.";
    if (pointsEl) pointsEl.style.display = 'none';
  }
}

function updateEQDomain(student, full) {
  const values = student.subtopics['EQ'] || [];
  const badgeEl = document.getElementById('pdfEqBadge');
  const textEl = document.getElementById('pdfEqText');
  const pointsEl = document.getElementById('pdfEqPoints');
  if (!badgeEl || !textEl) return;

  const attemptedValues = values.filter(x => x.attempted);
  if (attemptedValues.length > 0) {
    const avg = attemptedValues.reduce((sum, item) => sum + item.nilai, 0) / attemptedValues.length;
    const lvl = engine.classifyScore(avg);

    badgeEl.textContent = `${lvl.label} (${avg.toFixed(1)}%)`;
    badgeEl.className = `score-badge badge-level ${lvl.colorClass} mb-0`;

    if (full && full.eq) {
      textEl.innerText = full.eq.interpretasi;

      if (pointsEl) {
        let htmlPoints = [];
        if (full.eq.kekuatanUtama && full.eq.kekuatanUtama.length > 0) {
          const badges = full.eq.kekuatanUtama.map(k => `<span class="badge bg-success-subtle text-success border border-success-subtle me-1" style="font-size: 7.5pt;">${k}</span>`).join('');
          htmlPoints.push(`<div><strong class="text-success"><i class="fas fa-check-circle me-1"></i>Karakter Unggul:</strong> ${badges}</div>`);
        }
        if (full.eq.areaPengembangan && full.eq.areaPengembangan.length > 0) {
          const badges = full.eq.areaPengembangan.map(a => `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle me-1" style="font-size: 7.5pt;">${a}</span>`).join('');
          htmlPoints.push(`<div class="mt-1"><strong class="text-warning-emphasis"><i class="fas fa-seedling me-1"></i>Area Stimulasi:</strong> ${badges}</div>`);
        }
        if (full.eq.rekomendasi && full.eq.rekomendasi.length > 0) {
          htmlPoints.push(`<div class="mt-1 text-muted" style="font-size: 7.8pt;"><i class="fas fa-lightbulb text-warning me-1"></i><em>Saran Pendampingan: ${full.eq.rekomendasi[0]}</em></div>`);
        }
        if (htmlPoints.length > 0) {
          pointsEl.innerHTML = htmlPoints.join('');
          pointsEl.style.display = 'block';
        } else {
          pointsEl.style.display = 'none';
        }
      }
    } else if (typeof INTERPRETASI !== 'undefined' && INTERPRETASI['EQ'] && INTERPRETASI['EQ'][lvl.interpretasiKey]) {
      textEl.innerText = INTERPRETASI['EQ'][lvl.interpretasiKey];
      if (pointsEl) pointsEl.style.display = 'none';
    } else {
      textEl.innerText = "Data evaluasi subtopik sedang dalam proses standardisasi.";
      if (pointsEl) pointsEl.style.display = 'none';
    }
  } else {
    badgeEl.textContent = "Belum Mengikuti";
    badgeEl.className = "score-badge bg-secondary mb-0";
    textEl.innerText = "Asesmen kematangan emosi (EQ) belum diselesaikan oleh peserta didik.";
    if (pointsEl) pointsEl.style.display = 'none';
  }
}

function updateSQDomain(student, full) {
  const values = student.subtopics['SQ'] || [];
  const badgeEl = document.getElementById('pdfSqBadge');
  const textEl = document.getElementById('pdfSqText');
  const pointsEl = document.getElementById('pdfSqPoints');
  if (!badgeEl || !textEl) return;

  const attemptedValues = values.filter(x => x.attempted);
  if (attemptedValues.length > 0) {
    const avg = attemptedValues.reduce((sum, item) => sum + item.nilai, 0) / attemptedValues.length;
    const lvl = engine.classifyScore(avg);

    badgeEl.textContent = `${lvl.label} (${avg.toFixed(1)}%)`;
    badgeEl.className = `score-badge badge-level ${lvl.colorClass} mb-0`;

    if (full && full.sq) {
      textEl.innerText = full.sq.interpretasi;

      if (pointsEl) {
        let htmlPoints = [];
        if (full.sq.kekuatanUtama && full.sq.kekuatanUtama.length > 0) {
          const badges = full.sq.kekuatanUtama.map(k => `<span class="badge bg-info-subtle text-info-emphasis border border-info-subtle me-1" style="font-size: 7.5pt;">${k}</span>`).join('');
          htmlPoints.push(`<div><strong class="text-info-emphasis"><i class="fas fa-star me-1"></i>Nilai Dominan:</strong> ${badges}</div>`);
        }
        if (full.sq.areaPengembangan && full.sq.areaPengembangan.length > 0) {
          const badges = full.sq.areaPengembangan.map(a => `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle me-1" style="font-size: 7.5pt;">${a}</span>`).join('');
          htmlPoints.push(`<div class="mt-1"><strong class="text-warning-emphasis"><i class="fas fa-seedling me-1"></i>Area Stimulasi:</strong> ${badges}</div>`);
        }
        if (full.sq.rekomendasi && full.sq.rekomendasi.length > 0) {
          htmlPoints.push(`<div class="mt-1 text-muted" style="font-size: 7.8pt;"><i class="fas fa-lightbulb text-warning me-1"></i><em>Saran Pembiasaan: ${full.sq.rekomendasi[0]}</em></div>`);
        }
        if (htmlPoints.length > 0) {
          pointsEl.innerHTML = htmlPoints.join('');
          pointsEl.style.display = 'block';
        } else {
          pointsEl.style.display = 'none';
        }
      }
    } else if (typeof INTERPRETASI !== 'undefined' && INTERPRETASI['SQ'] && INTERPRETASI['SQ'][lvl.interpretasiKey]) {
      textEl.innerText = INTERPRETASI['SQ'][lvl.interpretasiKey];
      if (pointsEl) pointsEl.style.display = 'none';
    } else {
      textEl.innerText = "Data evaluasi subtopik sedang dalam proses standardisasi.";
      if (pointsEl) pointsEl.style.display = 'none';
    }
  } else {
    badgeEl.textContent = "Belum Mengikuti";
    badgeEl.className = "score-badge bg-secondary mb-0";
    textEl.innerText = "Asesmen kesadaran batin (SQ) belum diselesaikan oleh peserta didik.";
    if (pointsEl) pointsEl.style.display = 'none';
  }
}

function updateSinergiMinatPotensi(student, full) {
  const jenjangBadgeEl = document.getElementById('pdfJenjangBadge');
  const profilWrapperEl = document.getElementById('pdfProfilPotensiWrapper');
  const profilBadgeEl = document.getElementById('pdfProfilPotensiBadge');
  const textEl = document.getElementById('pdfKombinasiText');
  const rekWrapperEl = document.getElementById('pdfMinatPotensiRekWrapper');
  const rekListEl = document.getElementById('pdfMinatPotensiRekList');
  if (!textEl) return;

  if (full && full.minatPotensi) {
    if (jenjangBadgeEl) {
      jenjangBadgeEl.textContent = full.minatPotensi.jenjang || full.jenjang || "SD Kelas 4–6";
    }

    if (full.minatPotensi.profilPotensi && profilWrapperEl && profilBadgeEl) {
      profilBadgeEl.textContent = "Profil: " + full.minatPotensi.profilPotensi;
      profilWrapperEl.style.display = 'block';
    } else if (profilWrapperEl) {
      profilWrapperEl.style.display = 'none';
    }

    textEl.innerText = full.minatPotensi.interpretasi;

    if (rekWrapperEl && rekListEl && full.minatPotensi.rekomendasi && full.minatPotensi.rekomendasi.length > 0) {
      rekListEl.innerHTML = full.minatPotensi.rekomendasi.slice(0, 4).map(r => `<li class="mb-1">${r}</li>`).join('');
      rekWrapperEl.style.display = 'block';
    } else if (rekWrapperEl) {
      rekWrapperEl.style.display = 'none';
    }
  } else {
    if (profilWrapperEl) profilWrapperEl.style.display = 'none';
    if (rekWrapperEl) rekWrapperEl.style.display = 'none';
    textEl.innerText = "Asesmen minat dan potensi belum diselesaikan oleh peserta didik.";
  }
}

function renderTop3ListHtml(elementId, items, color) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = '';

  if (!items || items.length === 0) {
    el.innerHTML = '<div class="text-muted small py-2"><em>Data asesmen belum diselesaikan.</em></div>';
    return;
  }

  // Sort descending
  const sorted = [...items].sort((a, b) => b.nilai - a.nilai);
  const top3 = sorted.slice(0, 3);

  top3.forEach((item, idx) => {
    el.innerHTML += `
      <div class="top-3-item d-flex justify-content-between py-2 border-bottom">
        <span style="color:${color}; font-weight: 600;"><i class="fas fa-caret-right me-1"></i> #${idx+1} ${item.label}</span>
        <span class="badge bg-secondary" style="font-size: 9.5pt;">${parseFloat(item.nilai).toFixed(0)}%</span>
      </div>
    `;
  });
}

function renderChart(canvasId, type, itemData, title, bgColor, borderColor, isHorizontalBar) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (activeCharts[canvasId]) {
    activeCharts[canvasId].destroy();
    delete activeCharts[canvasId];
  }

  // Jika data benar-benar kosong (misal peserta belum mengerjakan modul EQ/SQ/Minat)
  if (!itemData || itemData.length === 0) {
    const context2d = ctx.getContext('2d');
    const parentW = (ctx.parentElement && ctx.parentElement.clientWidth) ? ctx.parentElement.clientWidth : 340;
    const parentH = (ctx.parentElement && ctx.parentElement.clientHeight) ? ctx.parentElement.clientHeight : 165;
    ctx.width = parentW;
    ctx.height = parentH;
    context2d.clearRect(0, 0, ctx.width, ctx.height);
    context2d.fillStyle = '#f8fafc';
    context2d.fillRect(0, 0, ctx.width, ctx.height);
    context2d.strokeStyle = '#e2e8f0';
    context2d.strokeRect(1, 1, ctx.width - 2, ctx.height - 2);
    context2d.fillStyle = '#94a3b8';
    context2d.font = '600 12px "Plus Jakarta Sans", Inter, sans-serif';
    context2d.textAlign = 'center';
    context2d.textBaseline = 'middle';
    context2d.fillText('Asesmen Belum Diselesaikan', ctx.width / 2, ctx.height / 2);
    return;
  }

  // Register DataLabels globally if available
  if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
  }

  let options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        color: (context) => {
          if (type !== 'bar') return '#0f172a';
          const val = context.dataset.data[context.dataIndex] || 0;
          return val >= 35 ? '#ffffff' : '#0f172a';
        },
        font: { weight: 'bold', size: type === 'radar' ? 10 : 11 },
        formatter: (value) => Math.round(value) + '%',
        anchor: type === 'bar' ? 'end' : 'center',
        align: (context) => {
          if (type !== 'bar') return 'start';
          const val = context.dataset.data[context.dataIndex] || 0;
          if (isHorizontalBar) return val >= 35 ? 'start' : 'end';
          return val >= 35 ? 'bottom' : 'top';
        },
        offset: 4,
        backgroundColor: type === 'radar' ? 'rgba(255, 255, 255, 0.85)' : null,
        borderRadius: 3,
        padding: 2
      }
    }
  };

  const wrapLabel2Lines = (lbl) => {
    const clean = (lbl || '').trim();
    const words = clean.split(/\s+/);
    if (words.length <= 2) return clean.length > 14 ? words : clean;
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  };

  if (type === 'radar') {
    options.scales = {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          display: false
        },
        grid: { color: 'rgba(100, 116, 139, 0.25)' },
        angleLines: { color: 'rgba(100, 116, 139, 0.3)' },
        pointLabels: {
          font: { size: 9.5, weight: 'bold' },
          color: '#1e293b'
        }
      }
    };

    // Format short labels max 2 lines for radar axes
    itemData.forEach(c => {
      let sl = c.label.replace(/Penalaran |Kemampuan |Bakat |Potensi /g, '');
      const words = sl.trim().split(/\s+/);
      if (words.length <= 2) {
        c.shortLabel = words;
      } else {
        const mid = Math.ceil(words.length / 2);
        c.shortLabel = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
      }
    });
  } else if (type === 'bar') {
    options.indexAxis = isHorizontalBar ? 'y' : 'x';
    options.scales = {
      x: {
        min: 0,
        max: 100,
        ticks: {
          font: { size: isHorizontalBar ? 10 : 8.5, weight: 'bold' },
          autoSkip: false,
          maxRotation: 0
        },
        grid: { color: 'rgba(100, 116, 139, 0.15)' }
      },
      y: {
        min: isHorizontalBar ? undefined : 0,
        max: isHorizontalBar ? undefined : 100,
        ticks: {
          font: { size: 9.5, weight: 'bold' },
          autoSkip: false
        },
        grid: { color: 'rgba(100, 116, 139, 0.15)' }
      }
    };
  }

  activeCharts[canvasId] = new Chart(ctx, {
    type: type,
    data: {
      labels: type === 'radar'
        ? itemData.map(d => d.shortLabel || d.label)
        : (isHorizontalBar ? itemData.map(d => d.label) : itemData.map(d => wrapLabel2Lines(d.label))),
      datasets: [{
        label: title,
        data: itemData.map(d => d.nilai),
        backgroundColor: bgColor,
        borderColor: borderColor,
        borderWidth: 2,
        pointBackgroundColor: borderColor,
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: borderColor,
        pointRadius: type === 'radar' ? 4 : 0
      }]
    },
    options: options
  });
}

// Helper: Menukar elemen canvas menjadi <img> PNG sebelum HTML2PDF render agar tidak pernah blank
function swapCanvasesWithImages(container) {
  const canvases = container.querySelectorAll('canvas');
  const swaps = [];

  canvases.forEach(canvas => {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const img = document.createElement('img');
      img.src = dataUrl;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      img.className = 'chart-img-rendered';
      
      canvas.parentNode.insertBefore(img, canvas);
      canvas.style.display = 'none';
      swaps.push({ canvas, img });
    } catch (e) {
      console.warn('Canvas toDataURL failed for:', canvas.id, e);
    }
  });

  return function restore() {
    swaps.forEach(({ canvas, img }) => {
      canvas.style.display = '';
      if (img.parentNode) {
        img.parentNode.removeChild(img);
      }
    });
  };
}

async function printReport() {
  try {
    const e = document.getElementById('printTemplate');
    const nama = document.getElementById('pdfNama').textContent.trim();
    const namaFile = nama.replace(/\s+/g, '_');
    const certId = document.getElementById('pdfSertifikat').textContent.replace(/\//g,'_');
    const filename = `Rapor_${certId}_${namaFile}.pdf`;

    const opt = {
      margin: [0, 0, 0, 0],
      filename: filename,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'legacy' }
    };
    
    const suggestedPass = generateRandomPassword();
    const pass = prompt(`Masukkan password rahasia untuk PDF Rapor peserta [${nama}]:\n(Salin dan berikan sandi ini ke orang tua)`, suggestedPass);
    
    if (pass === null) {
      return;
    }

    e.classList.add('printing');

    // Berikan jeda sejenak untuk DOM update
    await new Promise(r => setTimeout(r, 120));

    // Tukar canvas dengan gambar statis PNG agar rendering html2pdf 100% sempurna
    const restoreCanvases = swapCanvasesWithImages(e);

    const pdfBlob = await window.html2pdf().set(opt).from(e).output('blob');
    
    // Kembalikan canvas asli
    restoreCanvases();
    e.classList.remove('printing');
    
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    
    const encryptedBytes = await PDFEncrypt.encryptPDF(pdfBytes, pass, pass + "ERL");
    const encryptedBlob = new Blob([encryptedBytes], { type: 'application/pdf' });
    
    const url = URL.createObjectURL(encryptedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);

  } catch (err) {
    document.getElementById('printTemplate').classList.remove('printing');
    alert("Terjadi kesalahan sistem saat mengekspor/mengunduh PDF:\n" + err.message);
    console.error(err);
  }
}

function generateRandomPassword(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function printBulkReport() {
  if (!engine.students || engine.students.length === 0) return;

  const zip = new JSZip();
  const e = document.getElementById('printTemplate');
  
  // Persiapkan modal progress
  const modalProgress = new bootstrap.Modal(document.getElementById('bulkProgressModal'));
  modalProgress.show();
  const pBar = document.getElementById('bulkProgressBar');
  const pText = document.getElementById('bulkProgressText');
  
  // Tampilkan report modal off-screen agar canvas/css bisa dirender oleh html2canvas
  const reportModalEl = document.getElementById('reportModal');
  reportModalEl.style.display = 'block';
  reportModalEl.style.position = 'absolute';
  reportModalEl.style.top = '-10000px';

  let csvContent = "Sertifikat,Nama Peserta,Email,Password PDF\n";

  const total = engine.students.length;
  let current = 0;

  for (let student of engine.students) {
    current++;
    pText.innerText = `Menyiapkan PDF ${current} dari ${total} (${student.namaLengkap || student.email})...`;
    let percent = Math.round((current / total) * 100);
    pBar.style.width = percent + '%';
    pBar.innerText = percent + '%';

    populateTemplate(student);

    // Beri waktu browser untuk merender DOM & Chart.js
    await new Promise(r => setTimeout(r, 200));

    e.classList.add('printing');
    const nama = (student.namaLengkap || "Siswa").replace(/\s+/g, '_');
    const certId = document.getElementById('pdfSertifikat').textContent.replace(/\//g,'_');
    
    const opt = {
      margin: [0, 0, 0, 0],
      filename: `Rapor_${certId}_${nama}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'legacy' }
    };

    // Swap canvas to PNG
    const restoreCanvases = swapCanvasesWithImages(e);

    const pdfBlob = await window.html2pdf().set(opt).from(e).output('blob');
    
    restoreCanvases();
    e.classList.remove('printing');
    
    // Enkripsi byte array
    const pass = generateRandomPassword();
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);
    const encryptedBytes = await PDFEncrypt.encryptPDF(pdfBytes, pass, pass + "ERL");

    zip.file(`Rapor_${certId}_${nama}.pdf`, encryptedBytes);
    csvContent += `="${certId.replace(/_/g, '/')}",${student.namaLengkap || student.email},${student.email},${pass}\n`;
  }

  // Masukkan rekapan sandi ke zip file (Pakai bom UTF8 untuk excel)
  const csvBlob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  zip.file("Daftar_Password_Rapor.csv", csvBlob);

  pText.innerText = `Memampatkan ${total} Rapor menjadi 1 file ZIP...`;
  
  const zipContent = await zip.generateAsync({type: "blob"});
  const dt = new Date();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  
  const zipName = `Erlass_Rapor_Massal_${dt.getFullYear()}${m}${d}.zip`;
  
  const url = URL.createObjectURL(zipContent);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Kembalikan style report modal
  reportModalEl.style.display = '';
  reportModalEl.style.position = '';
  reportModalEl.style.top = '';

  modalProgress.hide();
}
