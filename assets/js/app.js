(() => {
  "use strict";

  const STORAGE_KEY = "mpi_informatika_kelas10_v1";
  const PASS_SCORE = 70;
  const TOPICS = [
    { id: "system", label: "Sistem Komputer", short: "01" },
    { id: "os", label: "Peran Sistem Operasi", short: "02" },
    { id: "boot", label: "Proses Booting", short: "03" },
    { id: "design", label: "Perancangan Komputer", short: "04" }
  ];

  const initialState = {
    name: "",
    completedTopics: [],
    quizAnswers: [],
    quizFinished: false,
    quizScore: null,
    soundOn: true
  };

  let state = loadState();
  let currentView = "home";
  let currentTopic = "system";
  let quizIndex = 0;
  let dragStep = null;
  let toastTimer = null;
  const content = document.getElementById("appContent");

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { ...initialState, ...saved };
    } catch {
      return { ...initialState };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateHeader();
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function playClick() {
    if (!state.soundOn) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(660, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.045);
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.09);
      oscillator.onended = () => ctx.close();
    } catch { /* Audio tidak wajib tersedia pada semua browser. */ }
  }

  function speak(text) {
    if (!state.soundOn || !("speechSynthesis" in window)) {
      showToast("Audio narasi tidak tersedia atau sedang dinonaktifkan.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 0.94;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function getProgress() {
    const done = new Set(state.completedTopics);
    const completed = TOPICS.filter(topic => done.has(topic.id)).length + (state.quizFinished ? 1 : 0);
    return Math.round((completed / 5) * 100);
  }

  function updateHeader() {
    const percent = getProgress();
    document.getElementById("progressPercent").textContent = `${percent}%`;
    document.getElementById("progressBar").style.width = `${percent}%`;
    const nameInput = document.getElementById("userNameInput");
    if (document.activeElement !== nameInput) nameInput.value = state.name || "";
    document.getElementById("userInitial").textContent = (state.name.trim()[0] || "P").toUpperCase();
    document.getElementById("soundToggle").textContent = state.soundOn ? "♫" : "♪̸";
    document.getElementById("soundToggle").setAttribute("aria-label", state.soundOn ? "Nonaktifkan suara" : "Aktifkan suara");
  }

  const pageTitles = {
    home: "Sistem Operasi & Perancangan Sistem Komputer",
    objectives: "Tujuan Pembelajaran",
    guide: "Panduan Penggunaan",
    material: "Materi Interaktif",
    quiz: "Kuis Pemahaman",
    certificate: "Sertifikat Penyelesaian",
    profile: "Profil Pengembang",
    references: "Referensi Pembelajaran"
  };

  function navigate(view) {
    if (!pageTitles[view]) return;
    currentView = view;
    document.querySelectorAll(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    document.getElementById("pageTitle").textContent = pageTitles[view];
    document.getElementById("breadcrumbCurrent").textContent = pageTitles[view];
    document.getElementById("sidebar").classList.remove("open");
    render();
    updateHeader();
    content.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function pageIntro(eyebrow, title, lead) {
    return `<div class="eyebrow">${eyebrow}</div><h2 class="page-heading">${title}</h2><p class="page-lead">${lead}</p>`;
  }

  function render() {
    const renderers = {
      home: renderHome,
      objectives: renderObjectives,
      guide: renderGuide,
      material: renderMaterial,
      quiz: renderQuiz,
      certificate: renderCertificate,
      profile: renderProfile,
      references: renderReferences
    };
    content.innerHTML = renderers[currentView]();
  }

  function renderHome() {
    const percent = getProgress();
    const doneCount = state.completedTopics.length;
    const cards = [
      ["◎", "Tujuan", "CP dan target kompetensi yang akan dicapai.", "objectives", "#55e4e8", "rgba(85,228,232,.12)"],
      ["▤", "Panduan", "Kenali navigasi dan cara belajar di MPI.", "guide", "#6c8cff", "rgba(108,140,255,.13)"],
      ["▣", "Materi", "Empat topik dengan ilustrasi dan simulasi.", "material", "#a78bfa", "rgba(167,139,250,.13)"],
      ["✦", "Kuis", "Uji pemahaman dengan umpan balik langsung.", "quiz", "#f4c96b", "rgba(244,201,107,.13)"],
      ["▧", "Sertifikat", "Lihat status kelulusan dan cetak sertifikat.", "certificate", "#6de3ae", "rgba(109,227,174,.13)"],
      ["♙", "Profil", "Informasi pengembang media pembelajaran.", "profile", "#ff9fbd", "rgba(255,159,189,.13)"],
      ["⌘", "Referensi", "Sumber belajar dan keterangan penggunaan AI.", "references", "#78c7ff", "rgba(120,199,255,.13)"]
    ];
    return `
      <section class="hero card">
        <div class="hero-copy">
          <span class="eyebrow">LEARNING EXPERIENCE • FASE E</span>
          <h2>Kenali cara kerja komputer. <span>Rancang sistemmu.</span></h2>
          <p>Selamat datang${state.name ? `, ${escapeHTML(state.name)}` : ", peserta didik"}! Jelajahi hubungan perangkat keras, perangkat lunak, dan sistem operasi melalui materi, latihan, serta simulasi perancangan komputer.</p>
          <div class="hero-actions">
            <button class="btn" data-action="navigate" data-target="material">Mulai belajar <span>→</span></button>
            <button class="btn secondary" data-action="navigate" data-target="objectives">Lihat tujuan</button>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><strong>04</strong><span>Topik materi</span></div>
            <div class="hero-stat"><strong>10</strong><span>Soal evaluasi</span></div>
            <div class="hero-stat"><strong>${percent}%</strong><span>Progres belajar</span></div>
          </div>
        </div>
        <div class="hero-visual"><img src="assets/img/system-hero.svg" alt="Ilustrasi sistem komputer dan konektivitas komponen"></div>
      </section>

      <div class="section-head">
        <div><h2>Aktivitas belajar</h2><p>Pilih aktivitas untuk memulai eksplorasi.</p></div>
        <span class="tag cyan">7 MENU PEMBELAJARAN</span>
      </div>
      <section class="menu-grid">
        ${cards.map(card => `
          <button class="menu-card" data-action="navigate" data-target="${card[3]}" style="--icon-color:${card[4]};--icon-bg:${card[5]};--glow:${card[5]}">
            <span class="card-arrow">↗</span><span class="menu-card-icon">${card[0]}</span>
            <strong>${card[1]}</strong><p>${card[2]}</p>
          </button>`).join("")}
      </section>

      <section class="home-bottom-grid">
        <div class="continue-card card">
          <div class="continue-row"><div><h3>Perjalanan belajarmu</h3><p>${doneCount} dari 4 topik materi ditandai selesai${state.quizFinished ? " • Kuis telah dikerjakan" : ""}.</p></div><strong class="budget-value">${percent}%</strong></div>
          <div class="topic-progress-list">${TOPICS.map(topic => `<span class="${state.completedTopics.includes(topic.id) ? "done" : ""}"></span>`).join("")}<span class="${state.quizFinished ? "done" : ""}"></span></div>
          <div style="margin-top:15px"><button class="btn ghost" data-action="navigate" data-target="material">Lanjutkan belajar →</button></div>
        </div>
        <div class="tip-card card">
          <div class="tip-icon">✧</div><h3>Insight hari ini</h3>
          <p>Sistem operasi bertindak sebagai pengelola sumber daya komputer. Tanpanya, aplikasi tidak dapat berinteraksi dengan perangkat keras secara teratur.</p>
        </div>
      </section>`;
  }

  function renderObjectives() {
    const objectives = [
      "Mengidentifikasi komponen utama sistem komputer serta membedakan perangkat keras, perangkat lunak, dan pengguna (brainware).",
      "Menjelaskan fungsi CPU, memori utama, media penyimpanan, serta perangkat input dan output dalam alur kerja komputer.",
      "Menguraikan peran sistem operasi dalam mengelola proses, memori, berkas, perangkat, dan interaksi pengguna.",
      "Menyusun urutan umum proses booting dari pemeriksaan awal perangkat hingga sistem operasi siap digunakan.",
      "Memilih komponen komputer berdasarkan kebutuhan pengguna, kompatibilitas antarkomponen, dan batas anggaran."
    ];
    return `${pageIntro("ARAH PEMBELAJARAN", "Apa yang akan kamu kuasai?", "Setelah menyelesaikan modul ini, peserta didik diharapkan mampu memahami cara kerja sistem komputer dan mengambil keputusan dasar dalam merancang konfigurasi komputer.")}
      <div class="two-column" style="margin-top:22px">
        <article class="card info-card">
          <span class="tag cyan">CAPAIAN PEMBELAJARAN • FASE E</span>
          <h3>Elemen Sistem Komputer</h3>
          <p>Peserta didik mampu menjelaskan cara kerja komputer dan komponen-komponennya, peran sistem operasi, serta mekanisme internal yang terjadi pada interaksi antara perangkat keras, perangkat lunak, dan pengguna. Rumusan ini disajikan sebagai ringkasan operasional untuk modul dan perlu diselaraskan dengan dokumen CP/ATP yang digunakan satuan pendidikan.</p>
        </article>
        <article class="card info-card">
          <span class="tag green">ALOKASI YANG DISARANKAN</span>
          <h3>2 × 45 menit</h3>
          <p>Eksplorasi konsep, praktik simulasi, diskusi skenario, dan evaluasi. Guru dapat menyesuaikan durasi berdasarkan kebutuhan kelas dan perangkat yang tersedia.</p>
        </article>
      </div>
      <div class="section-head"><div><h2>Tujuan pembelajaran terukur</h2><p>Gunakan daftar ini sebagai indikator ketercapaian belajar.</p></div></div>
      <div class="objective-list">${objectives.map((item, index) => `<div class="objective-item"><span class="objective-num">${String(index + 1).padStart(2,"0")}</span><p>${item}</p></div>`).join("")}</div>
      <div class="callout" style="margin-top:16px"><strong>Indikator keberhasilan:</strong> peserta didik dapat menjelaskan konsep dengan contoh yang tepat, menyelesaikan latihan urutan booting, dan menghasilkan konfigurasi komputer yang kompatibel sesuai anggaran simulasi.</div>
      <div style="margin-top:18px"><button class="btn" data-action="navigate" data-target="material">Mulai dari materi pertama →</button></div>`;
  }

  function renderGuide() {
    const steps = [
      ["01", "Isi nama peserta", "Masukkan nama pada kolom di kanan atas. Nama digunakan pada halaman sertifikat dan tersimpan di perangkat."],
      ["02", "Pelajari materi", "Buka Materi Interaktif, pilih subtopik, baca ringkasan, lalu coba komponen simulasi dan aktivitas."],
      ["03", "Tandai penyelesaian", "Setelah memahami satu topik, tekan tombol Tandai topik selesai agar progres belajar bertambah."],
      ["04", "Kerjakan kuis", "Jawab 10 soal. Setiap jawaban memperoleh umpan balik yang menjelaskan konsep di balik jawaban."],
      ["05", "Cetak sertifikat", "Sertifikat dapat dicetak atau disimpan sebagai PDF melalui fitur cetak browser jika skor mencapai batas kelulusan."]
    ];
    return `${pageIntro("MULAI DI SINI", "Panduan menggunakan MPI", "Media ini dirancang untuk eksplorasi mandiri maupun pembelajaran terpandu bersama guru. Ikuti langkah berikut agar seluruh fitur dapat digunakan.")}
      <div class="steps">${steps.map(s => `<article class="step-card"><div class="step-number">${s[0]}</div><h3>${s[1]}</h3><p>${s[2]}</p></article>`).join("")}</div>
      <div class="two-column" style="margin-top:18px">
        <div class="card info-card"><div class="info-icon">♫</div><h3>Kontrol audio</h3><p>Tombol ikon musik di bagian atas mengaktifkan atau menonaktifkan efek suara klik dan narasi. Narasi tersedia pada materi tertentu melalui tombol Dengarkan ringkasan.</p></div>
        <div class="card info-card"><div class="info-icon">⛶</div><h3>Layar penuh</h3><p>Gunakan tombol layar penuh di bagian atas untuk memperluas tampilan. Pada perangkat seluler, menu navigasi dapat dibuka melalui tombol ☰.</p></div>
      </div>
      <div class="callout" style="margin-top:16px"><strong>Catatan penyimpanan:</strong> nama, progres topik, dan hasil kuis disimpan pada localStorage browser di perangkat yang digunakan. Data tidak otomatis tersinkron ke perangkat lain. Hindari menggunakan mode privat jika ingin progres tetap tersimpan.</div>`;
  }

  const topicDetails = {
    system: {
      title: "Sistem komputer: tiga unsur yang saling bekerja",
      intro: "Sistem komputer merupakan kesatuan perangkat keras, perangkat lunak, dan pengguna yang bekerja bersama untuk menerima input, memproses data, menyimpan hasil, serta menghasilkan output.",
      image: "assets/img/system-architecture.svg",
      imageAlt: "Diagram hubungan hardware, software, dan brainware",
      body: `
        <h3>Komponen utama sistem komputer</h3>
        <p>Pilih salah satu komponen untuk melihat peran dan contohnya. Komputer tidak bekerja hanya karena memiliki perangkat keras; instruksi perangkat lunak dan tindakan pengguna juga diperlukan.</p>
        <div class="component-grid">
          <button class="component-button active" data-action="component" data-component="cpu"><strong>▦</strong>CPU</button>
          <button class="component-button" data-action="component" data-component="memory"><strong>▤</strong>Memori</button>
          <button class="component-button" data-action="component" data-component="storage"><strong>▣</strong>Penyimpanan</button>
          <button class="component-button" data-action="component" data-component="io"><strong>⇄</strong>Input/Output</button>
        </div>
        <div class="detail-panel" id="componentDetail"><strong>CPU (Central Processing Unit):</strong> mengeksekusi instruksi program dan mengoordinasikan operasi komputasi. CPU sering disebut pusat pemrosesan, tetapi tetap membutuhkan memori, penyimpanan, dan perangkat I/O.</div>
        <h3>Alur Input – Process – Output</h3>
        <p>Contoh: ketika peserta didik mengetik angka pada kalkulator, keyboard mengirim input, CPU memproses instruksi aplikasi dengan bantuan memori, lalu hasil ditampilkan pada layar.</p>
        <div class="three-column">
          <div class="info-card card"><div class="info-icon">⌨</div><h3>Input</h3><p>Data atau instruksi masuk melalui keyboard, mouse, mikrofon, atau sensor.</p></div>
          <div class="info-card card"><div class="info-icon">⚙</div><h3>Process</h3><p>CPU menjalankan instruksi dan mengolah data dengan dukungan memori.</p></div>
          <div class="info-card card"><div class="info-icon">▣</div><h3>Output</h3><p>Informasi disajikan melalui monitor, speaker, printer, atau perangkat lain.</p></div>
        </div>
        <div class="activity-box"><h3>Uji pemahaman singkat</h3><p>Ketika kamu menyimpan dokumen, komponen yang berperan menyimpan data agar tetap tersedia setelah komputer dimatikan adalah...</p>
          <div class="scenario-row"><button class="btn ghost" data-action="mini-check" data-answer="storage">Media penyimpanan</button><button class="btn secondary" data-action="mini-check" data-answer="ram">RAM</button><button class="btn secondary" data-action="mini-check" data-answer="cpu">CPU</button></div>
          <div id="miniCheckOutput" class="scenario-output" hidden></div>
        </div>`
    },
    os: {
      title: "Sistem operasi: pengelola sumber daya komputer",
      intro: "Sistem operasi (Operating System/OS) adalah perangkat lunak sistem yang menjadi perantara antara pengguna, aplikasi, dan perangkat keras. OS mengatur sumber daya agar aplikasi dapat berjalan secara terkoordinasi.",
      image: "assets/img/os-stack.svg",
      imageAlt: "Lapisan interaksi pengguna aplikasi sistem operasi dan hardware",
      body: `
        <div class="scenario-row"><button class="btn ghost" data-speak="Sistem operasi adalah perangkat lunak sistem yang mengelola sumber daya komputer. Fungsinya mencakup manajemen proses, memori, sistem berkas, dan perangkat.">♫ Dengarkan ringkasan</button></div><h3>Fungsi utama sistem operasi</h3>
        <div class="two-column">
          <div class="info-card card"><div class="info-icon">◷</div><h3>Manajemen proses</h3><p>Mengatur proses yang berjalan, penjadwalan CPU, dan perpindahan antarproses.</p></div>
          <div class="info-card card"><div class="info-icon">▥</div><h3>Manajemen memori</h3><p>Mengalokasikan dan membebaskan ruang memori untuk proses yang aktif.</p></div>
          <div class="info-card card"><div class="info-icon">▤</div><h3>Sistem berkas</h3><p>Mengatur pembuatan, penamaan, penyimpanan, dan akses file serta direktori.</p></div>
          <div class="info-card card"><div class="info-icon">⛭</div><h3>Manajemen perangkat</h3><p>Menghubungkan aplikasi dengan perangkat melalui driver dan layanan I/O.</p></div>
        </div>
        <h3>Simulasi: apa yang dilakukan OS?</h3>
        <p>Pilih skenario sehari-hari. Perhatikan bagaimana sistem operasi mengatur sumber daya di balik aktivitas tersebut.</p>
        <div class="scenario-row">
          <select id="osScenarioSelect" aria-label="Pilih skenario sistem operasi">
            <option value="browser">Membuka browser dan aplikasi musik</option>
            <option value="save">Menyimpan tugas ke folder</option>
            <option value="print">Mencetak dokumen</option>
            <option value="usb">Menghubungkan flashdisk</option>
          </select>
          <button class="btn" data-action="run-os-scenario">Analisis skenario</button>
        </div>
        <div class="scenario-output" id="osScenarioOutput">Pilih skenario, lalu tekan Analisis skenario untuk melihat peran sistem operasi.</div>
        <div class="callout" style="margin-top:14px"><strong>Contoh sistem operasi:</strong> Microsoft Windows, GNU/Linux (misalnya Ubuntu), macOS, Android, dan iOS. Masing-masing memiliki desain dan ekosistem berbeda, tetapi menjalankan fungsi dasar pengelolaan sistem.</div>`
    },
    boot: {
      title: "Proses booting: dari tombol daya hingga siap digunakan",
      intro: "Booting adalah rangkaian proses awal saat komputer dinyalakan atau di-restart. Firmware melakukan inisialisasi awal, memeriksa perangkat, lalu memulai pemuatan sistem operasi.",
      image: "assets/img/boot-flow.svg",
      imageAlt: "Ilustrasi tahapan proses booting komputer",
      body: `
        <h3>Urutan umum proses booting</h3>
        <p>Susun langkah berikut dari tahap paling awal hingga komputer siap digunakan. Seret kartu untuk memindahkan posisi, atau gunakan tombol panah untuk perangkat layar sentuh.</p>
        <div class="activity-box">
          <div class="sort-list" id="bootSortList">
            ${[
              ["os-ready", "Sistem operasi siap digunakan"],
              ["firmware", "Firmware BIOS/UEFI berjalan"],
              ["kernel", "Bootloader memuat kernel sistem operasi"],
              ["power", "Komputer menerima daya dan dinyalakan"],
              ["post", "POST memeriksa komponen dasar"]
            ].map((s, i) => `<div class="sort-item" draggable="true" data-step="${s[0]}"><span class="grip">⠿</span><span>${s[1]}</span><span class="sort-controls"><button type="button" data-action="move-step" data-direction="up" aria-label="Pindah ke atas">↑</button><button type="button" data-action="move-step" data-direction="down" aria-label="Pindah ke bawah">↓</button></span></div>`).join("")}
          </div>
          <div class="scenario-row"><button class="btn" data-action="check-boot-order">Periksa urutan</button><button class="btn secondary" data-action="reset-boot-order">Acak ulang</button></div>
          <div class="scenario-output" id="bootOrderOutput">Susun urutan, lalu periksa jawabanmu.</div>
        </div>
        <h3>Hal yang perlu diingat</h3>
        <ul><li>BIOS/UEFI adalah firmware yang menjalankan inisialisasi perangkat keras dasar.</li><li>POST (Power-On Self-Test) memeriksa komponen penting pada tahap awal.</li><li>Bootloader membantu memulai pemuatan kernel sistem operasi.</li><li>Urutan dan detail implementasi dapat berbeda bergantung pada perangkat dan konfigurasi firmware.</li></ul>`
    },
    design: {
      title: "Perancangan sistem komputer berdasarkan kebutuhan",
      intro: "Merancang komputer bukan sekadar memilih komponen paling mahal. Pilihan harus sesuai beban kerja, kompatibilitas teknis, kebutuhan peningkatan, dan anggaran yang tersedia.",
      image: "assets/img/hardware-components.svg",
      imageAlt: "Ilustrasi komponen perangkat keras komputer",
      body: `
        <h3>Computer Builder Simulation</h3>
        <p>Rancang konfigurasi komputer untuk kebutuhan tertentu. Pilih komponen dan anggaran, lalu periksa kompatibilitas socket prosesor, jenis memori, serta total biaya simulasi.</p>
        <div class="builder-grid">
          <div class="builder-form">
            <div class="builder-fields">
              <div class="field-group"><label class="field-label" for="buildUse">KEBUTUHAN PENGGUNA</label><select id="buildUse"><option value="office">Belajar &amp; produktivitas</option><option value="creative">Desain &amp; editing</option><option value="gaming">Gaming</option></select></div>
              <div class="field-group"><label class="field-label" for="buildCpu">PROSESOR</label><select id="buildCpu"><option value="r5">AMD Ryzen 5 5600 (AM4)</option><option value="i5">Intel Core i5-12400F (LGA1700)</option></select></div>
              <div class="field-group"><label class="field-label" for="buildBoard">MOTHERBOARD</label><select id="buildBoard"><option value="b550">B550 (AM4 • DDR4)</option><option value="h610">H610 (LGA1700 • DDR4)</option><option value="b760">B760 (LGA1700 • DDR5)</option></select></div>
              <div class="field-group"><label class="field-label" for="buildRam">MEMORI RAM</label><select id="buildRam"><option value="ram16d4">16 GB DDR4</option><option value="ram32d4">32 GB DDR4</option><option value="ram16d5">16 GB DDR5</option></select></div>
              <div class="field-group"><label class="field-label" for="buildStorage">PENYIMPANAN</label><select id="buildStorage"><option value="ssd1">SSD NVMe 1 TB</option><option value="ssd512">SSD NVMe 512 GB</option></select></div>
              <div class="field-group"><label class="field-label" for="buildGpu">KARTU GRAFIS</label><select id="buildGpu"><option value="none">Tanpa GPU diskrit</option><option value="rtx">GeForce RTX 4060</option><option value="rx">Radeon RX 7600</option></select></div>
            </div>
            <div class="budget-row"><label class="field-label" for="buildBudget">BATAS ANGGARAN</label><strong class="budget-value" id="budgetLabel">Rp12.000.000</strong></div>
            <input id="buildBudget" type="range" min="6000000" max="18000000" step="500000" value="12000000" aria-label="Batas anggaran">
            <p class="builder-note">Harga adalah angka ilustratif untuk latihan pengambilan keputusan, bukan penawaran atau harga pasar terkini.</p>
          </div>
          <div class="builder-result">
            <span class="tag cyan">RINGKASAN KONFIGURASI</span>
            <div class="total-value" id="buildTotal">Rp0</div>
            <p class="muted small">Estimasi total komponen yang dipilih</p>
            <div id="buildStatus" class="builder-status">Memeriksa konfigurasi...</div>
            <div id="buildBreakdown" class="small muted" style="margin-top:12px;line-height:1.9"></div>
          </div>
        </div>
        <div class="activity-box"><h3>Refleksi desain</h3><p>Untuk komputer belajar dan produktivitas, kapasitas RAM dan SSD yang memadai biasanya lebih berdampak pada kenyamanan penggunaan harian dibanding membeli GPU diskrit kelas tinggi yang tidak dibutuhkan.</p></div>`
    }
  };

  function renderMaterial() {
    const topic = topicDetails[currentTopic] || topicDetails.system;
    return `${pageIntro("EXPLORE • LEARN • APPLY", "Materi pembelajaran interaktif", "Pilih salah satu subtopik. Setiap bagian memadukan konsep inti, ilustrasi, dan aktivitas untuk menguji pemahaman.")}
      <div class="material-layout">
        <aside class="topic-nav card">
          <div class="topic-nav-title">DAFTAR SUBTOPIK</div>
          ${TOPICS.map(item => `<button class="topic-link ${item.id === currentTopic ? "active" : ""}" data-action="topic" data-topic="${item.id}"><span>${item.short}</span>${item.label}<b class="topic-check">${state.completedTopics.includes(item.id) ? "✓" : ""}</b></button>`).join("")}
        </aside>
        <article class="topic-content card">
          <span class="tag cyan">TOPIK ${TOPICS.findIndex(t => t.id === currentTopic) + 1} / 4</span>
          <h2>${topic.title}</h2><p class="topic-intro">${topic.intro}</p>
          <img class="topic-image" src="${topic.image}" alt="${topic.imageAlt}">
          ${topic.body}
          <div class="topic-footer">
            <span class="small muted">${state.completedTopics.includes(currentTopic) ? "✓ Topik telah ditandai selesai" : "Tandai setelah kamu memahami materi."}</span>
            <button class="btn ${state.completedTopics.includes(currentTopic) ? "secondary" : ""}" data-action="complete-topic" data-topic="${currentTopic}">${state.completedTopics.includes(currentTopic) ? "Selesai ✓" : "Tandai topik selesai"}</button>
          </div>
        </article>
      </div>`;
  }

  const componentInfo = {
    cpu: "<strong>CPU (Central Processing Unit):</strong> mengeksekusi instruksi program dan mengoordinasikan operasi komputasi. CPU membutuhkan dukungan memori, penyimpanan, dan perangkat I/O.",
    memory: "<strong>RAM (Random Access Memory):</strong> menyimpan sementara instruksi dan data yang sedang digunakan. RAM bersifat volatil; isinya umumnya hilang ketika daya dimatikan.",
    storage: "<strong>Media penyimpanan:</strong> SSD atau HDD menyimpan sistem operasi, aplikasi, dan file secara persisten. Data tetap tersimpan setelah komputer dimatikan.",
    io: "<strong>Perangkat input/output:</strong> input memasukkan data (keyboard, mouse, mikrofon), sedangkan output menyajikan hasil (monitor, speaker, printer)."
  };

  const osScenarios = {
    browser: "<strong>Manajemen proses dan memori.</strong> OS membuat proses untuk browser dan aplikasi musik, mengalokasikan memori, menjadwalkan penggunaan CPU, serta mengatur perpindahan fokus antaraplikasi.",
    save: "<strong>Manajemen sistem berkas.</strong> OS menerjemahkan permintaan aplikasi menjadi operasi penyimpanan, mengelola direktori dan metadata, serta meneruskan penulisan data ke perangkat penyimpanan.",
    print: "<strong>Manajemen perangkat dan antrean.</strong> OS menggunakan driver printer dan layanan pencetakan untuk mengirim pekerjaan ke perangkat, mengatur antrean, dan melaporkan status proses.",
    usb: "<strong>Deteksi perangkat dan driver.</strong> OS mendeteksi perangkat yang terhubung, mengidentifikasi kelas perangkat, memuat driver yang sesuai, lalu menyediakan akses ke perangkat atau file."
  };

  const bootCorrect = ["power", "firmware", "post", "kernel", "os-ready"];
  const bootInitial = ["os-ready", "firmware", "kernel", "power", "post"];

  const questions = [
    { q: "Komponen yang mengeksekusi instruksi program dan melakukan operasi komputasi adalah...", options: ["SSD", "CPU", "Monitor", "Keyboard"], answer: 1, explain: "CPU (Central Processing Unit) menjalankan instruksi dan operasi komputasi. SSD menyimpan data, sedangkan monitor dan keyboard merupakan perangkat I/O." },
    { q: "Mengapa RAM disebut sebagai memori volatil?", options: ["Data tetap tersimpan tanpa listrik", "RAM hanya digunakan untuk gambar", "Isi RAM umumnya hilang saat daya dimatikan", "RAM tidak dapat ditulis ulang"], answer: 2, explain: "RAM menyimpan data sementara ketika komputer aktif. Karena bersifat volatil, data di RAM umumnya hilang ketika daya dimatikan." },
    { q: "Perangkat lunak yang mengelola sumber daya dan menjadi perantara aplikasi dengan perangkat keras disebut...", options: ["Sistem operasi", "Pengolah kata", "Peramban web", "Driver grafis saja"], answer: 0, explain: "Sistem operasi mengelola proses, memori, sistem berkas, dan perangkat, sekaligus menyediakan layanan bagi aplikasi." },
    { q: "Manakah contoh perangkat input?", options: ["Monitor", "Speaker", "Printer", "Keyboard"], answer: 3, explain: "Keyboard memasukkan karakter dan perintah ke komputer sehingga termasuk perangkat input." },
    { q: "Pada proses booting, firmware BIOS/UEFI berperan untuk...", options: ["Membuat dokumen", "Melakukan inisialisasi awal perangkat keras", "Mengedit foto", "Menghapus semua file pengguna"], answer: 1, explain: "BIOS/UEFI merupakan firmware yang menjalankan inisialisasi perangkat keras dan membantu memulai proses boot." },
    { q: "Urutan yang paling tepat untuk gambaran umum booting adalah...", options: ["Kernel → daya → POST → firmware → OS", "Daya → firmware → POST → bootloader/kernel → OS siap", "OS siap → POST → daya → kernel", "POST → OS siap → daya → firmware"], answer: 1, explain: "Secara umum komputer menerima daya, menjalankan firmware, melakukan POST, memulai bootloader dan kernel, kemudian sistem operasi siap digunakan." },
    { q: "Komponen yang menyimpan file agar tetap tersedia setelah komputer dimatikan adalah...", options: ["RAM", "Register CPU", "SSD", "Cache CPU"], answer: 2, explain: "SSD merupakan media penyimpanan nonvolatil. File tetap tersimpan ketika komputer dimatikan." },
    { q: "Ketika aplikasi mengirim dokumen ke printer, OS terutama berperan dalam...", options: ["Mengubah printer menjadi RAM", "Mengelola driver dan antrean pencetakan", "Mengganti fungsi CPU", "Mematikan perangkat input"], answer: 1, explain: "OS mengoordinasikan komunikasi dengan printer melalui driver dan layanan pencetakan, termasuk pengelolaan antrean." },
    { q: "Dua hal penting untuk memeriksa kompatibilitas CPU dan motherboard adalah...", options: ["Warna casing dan ukuran monitor", "Socket prosesor dan dukungan chipset/platform", "Merek keyboard dan mouse", "Kapasitas speaker dan webcam"], answer: 1, explain: "CPU dan motherboard harus memiliki socket serta dukungan platform yang sesuai. Pemeriksaan lanjutan juga perlu mencakup dukungan BIOS dan spesifikasi lain." },
    { q: "Seseorang merancang PC untuk tugas sekolah, browsing, dan aplikasi perkantoran. Prinsip keputusan yang paling tepat adalah...", options: ["Selalu memilih GPU paling mahal", "Mengabaikan kompatibilitas agar lebih murah", "Menyesuaikan CPU, RAM, dan SSD dengan kebutuhan serta anggaran", "Memilih komponen berdasarkan warna saja"], answer: 2, explain: "Perancangan sistem harus berangkat dari kebutuhan pengguna, kompatibilitas komponen, kemampuan peningkatan, dan anggaran. Komponen termahal tidak selalu paling tepat." }
  ];

  function renderQuiz() {
    if (state.quizFinished && state.quizAnswers.length >= questions.length) return renderQuizResult();
    if (!state.quizAnswers.length && quizIndex >= questions.length) quizIndex = 0;
    const index = Math.min(quizIndex, questions.length - 1);
    const q = questions[index];
    const selected = state.quizAnswers[index];
    const answered = selected !== undefined;
    return `${pageIntro("CHECK YOUR UNDERSTANDING", "Kuis pemahaman", "Jawab setiap pertanyaan. Umpan balik akan muncul setelah kamu memilih jawaban. Skor kelulusan modul adalah 70 dari 100.")}
      <section class="quiz-card card">
        <div class="quiz-top"><span class="quiz-counter">PERTANYAAN ${index + 1} / ${questions.length}</span><span class="tag">${state.quizAnswers.filter(a => a !== undefined).length} dijawab</span></div>
        <div class="quiz-progress"><span style="width:${((index + (answered ? 1 : 0)) / questions.length) * 100}%"></span></div>
        <h2 class="quiz-question">${q.q}</h2>
        <div class="answer-list">
          ${q.options.map((option, i) => {
            let cls = "answer-option";
            if (answered && i === q.answer) cls += " correct";
            if (answered && i === selected && i !== q.answer) cls += " wrong";
            return `<button class="${cls}" data-action="answer" data-index="${i}" ${answered ? "disabled" : ""}><span class="answer-letter">${"ABCD"[i]}</span>${option}${answered && i === q.answer ? " ✓" : ""}</button>`;
          }).join("")}
        </div>
        ${answered ? `<div class="feedback ${selected === q.answer ? "good" : "bad"}"><strong>${selected === q.answer ? "Jawaban tepat!" : "Belum tepat."}</strong> ${q.explain}</div>` : ""}
        <div class="quiz-actions"><span class="small muted">Pilih satu jawaban terbaik.</span>${answered ? `<button class="btn" data-action="next-question">${index === questions.length - 1 ? "Lihat hasil" : "Pertanyaan berikutnya →"}</button>` : ""}</div>
      </section>`;
  }

  function renderQuizResult() {
    const score = state.quizScore ?? 0;
    const passed = score >= PASS_SCORE;
    const correct = state.quizAnswers.reduce((sum, answer, index) => sum + (answer === questions[index].answer ? 1 : 0), 0);
    return `${pageIntro("HASIL EVALUASI", "Kuis telah diselesaikan", "Tinjau hasil evaluasi dan gunakan penjelasan untuk memperkuat pemahaman konsep.")}
      <div class="quiz-card card result-score">
        <div class="score-ring"><strong>${score}</strong></div>
        <h2>${passed ? "Hebat, kamu lulus!" : "Tetap semangat belajar!"}</h2>
        <p>${passed ? "Kamu telah mencapai batas kelulusan modul." : `Skor belum mencapai batas kelulusan ${PASS_SCORE}. Pelajari kembali materi, lalu coba lagi.`}</p>
        <div class="three-column" style="margin:20px 0">
          <div class="info-card card"><strong class="total-value">${correct}/10</strong><p>Jawaban benar</p></div>
          <div class="info-card card"><strong class="total-value">${score}</strong><p>Skor akhir</p></div>
          <div class="info-card card"><strong class="total-value">${passed ? "LULUS" : "ULANG"}</strong><p>Status</p></div>
        </div>
        <div class="callout">${passed ? "Sertifikat penyelesaian telah tersedia. Pastikan nama peserta didik sudah benar sebelum mencetak." : "Saran: buka kembali subtopik yang belum dikuasai, kemudian kerjakan kuis ulang."}</div>
        <div class="hero-actions" style="justify-content:center;margin-top:18px"><button class="btn" data-action="retry-quiz">Ulangi kuis</button>${passed ? `<button class="btn secondary" data-action="navigate" data-target="certificate">Lihat sertifikat →</button>` : `<button class="btn secondary" data-action="navigate" data-target="material">Pelajari materi</button>`}</div>
      </div>`;
  }

  function renderCertificate() {
    const finished = state.quizFinished && typeof state.quizScore === "number";
    const passed = finished && state.quizScore >= PASS_SCORE;
    if (!finished || !passed) {
      return `${pageIntro("APRESIASI PEMBELAJAR", "Sertifikat penyelesaian", "Sertifikat diberikan sebagai apresiasi setelah peserta didik menyelesaikan evaluasi dan mencapai skor minimal 70.")}
        <div class="certificate-wrap card cert-locked"><div class="lock-icon">▣</div><h3>${finished ? "Sertifikat belum dapat diterbitkan" : "Sertifikat masih terkunci"}</h3>
          <p>${finished ? `Skor saat ini ${state.quizScore}. Kamu perlu mencapai skor minimal ${PASS_SCORE}.` : "Selesaikan kuis terlebih dahulu untuk melihat status kelulusan."}</p>
          <button class="btn" data-action="navigate" data-target="quiz">${finished ? "Ulangi kuis" : "Mulai kuis"} →</button>
        </div>`;
    }
    const name = state.name.trim() || "Peserta Didik";
    const date = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
    return `${pageIntro("RECOGNITION OF ACHIEVEMENT", "Sertifikat penyelesaian", "Selamat atas pencapaianmu. Periksa nama peserta didik, lalu cetak atau simpan sertifikat sebagai PDF.")}
      <div class="certificate-wrap">
        <div class="certificate" id="certificatePrint">
          <div class="cert-brand">MPI LAB • INFORMATIKA KELAS X</div>
          <h2>SERTIFIKAT PENYELESAIAN</h2>
          <div class="cert-subtitle">Diberikan kepada peserta didik yang telah menyelesaikan modul pembelajaran interaktif</div>
          <div class="cert-name">${escapeHTML(name)}</div>
          <p class="cert-topic">Atas keberhasilan menyelesaikan materi<br><strong>Sistem Operasi &amp; Perancangan Sistem Komputer</strong><br>pada mata pelajaran Informatika Kelas X.</p>
          <div class="cert-meta"><div><strong>${state.quizScore}/100</strong><span>Skor akhir</span></div><div><strong>LULUS</strong><span>Status</span></div><div><strong>${date}</strong><span>Tanggal penyelesaian</span></div></div>
          <div class="cert-seal">✦</div>
          <div class="cert-signature"><div><span>Peserta didik</span></div><div><span>Tim pengembang MPI</span></div></div>
        </div>
        <div class="certificate-actions"><button class="btn" data-action="print-certificate">Cetak / Simpan PDF</button><button class="btn secondary" data-action="navigate" data-target="home">Kembali ke menu utama</button></div>
      </div>`;
  }

  function renderProfile() {
    return `${pageIntro("ABOUT THIS LEARNING MEDIA", "Profil pengembang", "Informasi identitas pengembangan media pembelajaran. Bagian institusi dan nama tim dapat disesuaikan sebelum media dipublikasikan secara resmi.")}
      <div class="profile-grid">
        <section class="profile-identity card"><div class="profile-avatar">MPI</div><h3>Tim Pengembang MPI Informatika</h3><p>Media Pembelajaran Interaktif • Kelas X</p><span class="tag cyan">Educational Technology</span></section>
        <section class="profile-detail card">
          <div class="profile-row"><span>Nama media</span><strong>MPI LAB – Informatika</strong></div>
          <div class="profile-row"><span>Mata pelajaran</span><strong>Informatika</strong></div>
          <div class="profile-row"><span>Jenjang</span><strong>SMA / SMK / MA Kelas X</strong></div>
          <div class="profile-row"><span>Topik</span><strong>Sistem Operasi &amp; Perancangan Sistem Komputer</strong></div>
          <div class="profile-row"><span>Teknologi</span><strong>HTML5, CSS3, JavaScript</strong></div>
          <div class="profile-row"><span>Institusi</span><strong>Sesuaikan dengan sekolah / lembaga</strong></div>
          <div class="profile-row"><span>Versi</span><strong>1.0 • 2026</strong></div>
        </section>
      </div>
      <div class="callout" style="margin-top:16px"><strong>Catatan kustomisasi:</strong> ganti identitas tim, nama institusi, logo, dan informasi kontak pada halaman ini sesuai data resmi pengembang sebelum digunakan sebagai produk institusi.</div>`;
  }

  function renderReferences() {
    return `${pageIntro("LEARN MORE", "Referensi pembelajaran", "Gunakan sumber berikut untuk memperdalam materi. Guru disarankan memeriksa kesesuaian CP, ATP, dan buku ajar dengan kurikulum yang berlaku di satuan pendidikan.")}
      <div class="reference-list">
        <article class="reference-item"><div class="reference-number">01</div><div><h3>Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi. (2021). Informatika untuk SMA Kelas X.</h3><p>Wahyono, Irya Wisnubhadra, dan Heni Pratiwi. Pusat Kurikulum dan Perbukuan. ISBN 978-602-244-506-7. Rujukan untuk Bab Sistem Komputer, interaksi hardware-software-pengguna, dan peran sistem operasi.</p><a href="https://mahari.sch.id/wp-content/uploads/2024/01/INFORMATIKA-BS-KLS_X_Rev.pdf" target="_blank" rel="noopener">Akses buku siswa (PDF) ↗</a></div></article>
        <article class="reference-item"><div class="reference-number">02</div><div><h3>Pusat Perbukuan. Panduan Guru Informatika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi).</h3><p>Katalog resmi Sistem Informasi Perbukuan Indonesia (SIBI). ISBN 978-623-118-495-5.</p><a href="https://buku.kemendikdasmen.go.id/katalog/panduan-guru-informatika-untuk-smamasmkmak-kelas-x-edisi-revisi" target="_blank" rel="noopener">Buka katalog SIBI ↗</a></div></article>
        <article class="reference-item"><div class="reference-number">03</div><div><h3>Silberschatz, A., Galvin, P. B., &amp; Gagne, G. (2018). Operating System Concepts (10th ed.).</h3><p>Wiley. Referensi konseptual mengenai proses, manajemen memori, sistem berkas, dan pengelolaan perangkat pada sistem operasi.</p><a href="https://www.os-book.com/OS10/" target="_blank" rel="noopener">Situs pendamping buku ↗</a></div></article>
        <article class="reference-item"><div class="reference-number">04</div><div><h3>Stallings, W. (2018). Operating Systems: Internals and Design Principles (9th ed.).</h3><p>Pearson. Referensi tambahan untuk struktur sistem operasi, proses, penjadwalan, dan manajemen sumber daya.</p></div></article>
      </div>
      <div class="section-head"><div><h2>Catatan penggunaan AI</h2><p>Transparansi proses penyusunan media.</p></div></div>
      <div class="callout"><strong>Keterangan:</strong> AI digunakan sebagai alat bantu dalam penyusunan struktur antarmuka, contoh penjelasan, skenario latihan, dan kode aplikasi. Materi tetap perlu ditelaah oleh guru atau ahli mata pelajaran sebelum digunakan. Rumusan CP/TP pada media ini merupakan ringkasan operasional, bukan pengganti dokumen kurikulum resmi. Harga komponen pada simulasi hanya angka ilustratif. Tidak ada data peserta didik yang dikirim ke server; progres disimpan secara lokal di browser.</div>`;
  }

  function updateBuilder() {
    const cpuData = {
      r5: { name: "AMD Ryzen 5 5600", socket: "AM4", price: 1450000 },
      i5: { name: "Intel Core i5-12400F", socket: "LGA1700", price: 1650000 }
    };
    const boardData = {
      b550: { name: "B550", socket: "AM4", memory: "DDR4", price: 1300000 },
      h610: { name: "H610", socket: "LGA1700", memory: "DDR4", price: 1200000 },
      b760: { name: "B760", socket: "LGA1700", memory: "DDR5", price: 2000000 }
    };
    const ramData = {
      ram16d4: { name: "16 GB DDR4", type: "DDR4", price: 850000 },
      ram32d4: { name: "32 GB DDR4", type: "DDR4", price: 1450000 },
      ram16d5: { name: "16 GB DDR5", type: "DDR5", price: 1100000 }
    };
    const storageData = {
      ssd1: { name: "SSD NVMe 1 TB", price: 1200000 },
      ssd512: { name: "SSD NVMe 512 GB", price: 650000 }
    };
    const gpuData = {
      none: { name: "Tanpa GPU diskrit", price: 0 },
      rtx: { name: "GeForce RTX 4060", price: 4800000 },
      rx: { name: "Radeon RX 7600", price: 4500000 }
    };
    const get = id => document.getElementById(id);
    if (!get("buildCpu")) return;
    const cpu = cpuData[get("buildCpu").value];
    const board = boardData[get("buildBoard").value];
    const ram = ramData[get("buildRam").value];
    const storage = storageData[get("buildStorage").value];
    const gpu = gpuData[get("buildGpu").value];
    const budget = Number(get("buildBudget").value);
    const fixedCost = 1300000; // casing + PSU ilustratif
    const total = cpu.price + board.price + ram.price + storage.price + gpu.price + fixedCost;
    const issues = [];
    if (cpu.socket !== board.socket) issues.push(`Socket CPU (${cpu.socket}) tidak sesuai dengan motherboard (${board.socket}).`);
    if (ram.type !== board.memory) issues.push(`Jenis RAM ${ram.type} tidak didukung oleh motherboard yang dipilih (${board.memory}).`);
    if (total > budget) issues.push("Total konfigurasi melebihi batas anggaran.");
    const use = get("buildUse").value;
    if (use === "creative" && gpu.price === 0) issues.push("Untuk desain/editing tertentu, GPU diskrit dapat membantu. Periksa kebutuhan aplikasi yang digunakan.");
    if (use === "gaming" && gpu.price === 0) issues.push("Untuk gaming 3D modern, pertimbangkan GPU diskrit yang sesuai kebutuhan.");
    get("budgetLabel").textContent = formatRupiah(budget);
    get("buildTotal").textContent = formatRupiah(total);
    get("buildBreakdown").innerHTML = [
      ["Prosesor", cpu.name, cpu.price], ["Motherboard", board.name, board.price],
      ["RAM", ram.name, ram.price], ["Penyimpanan", storage.name, storage.price],
      ["Grafis", gpu.name, gpu.price], ["Casing + PSU", "Paket ilustratif", fixedCost]
    ].map(row => `<div style="display:flex;justify-content:space-between;gap:8px"><span>${row[0]}: ${row[1]}</span><strong>${formatRupiah(row[2])}</strong></div>`).join("");
    const status = get("buildStatus");
    if (issues.length) {
      const hardIssue = issues.some(issue => issue.includes("tidak sesuai") || issue.includes("tidak didukung"));
      status.className = `builder-status ${hardIssue ? "bad" : "warn"}`;
      status.innerHTML = `<strong>${hardIssue ? "Kompatibilitas perlu diperbaiki" : "Perlu penyesuaian"}</strong><br>${issues.map(issue => `• ${issue}`).join("<br>")}`;
    } else {
      status.className = "builder-status ok";
      status.innerHTML = `<strong>Konfigurasi kompatibel dan sesuai anggaran.</strong><br>Socket prosesor, jenis RAM, dan batas biaya sesuai dengan pilihan saat ini. Tetap periksa spesifikasi rinci dan kebutuhan daya sebelum pembelian nyata.`;
    }
  }

  function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
  }

  function renderQuizStart() {
    state.quizAnswers = [];
    state.quizFinished = false;
    state.quizScore = null;
    quizIndex = 0;
    saveState();
    render();
  }

  function renderBootList() {
    const list = document.getElementById("bootSortList");
    if (!list) return;
    list.querySelectorAll(".sort-item").forEach(item => {
      if (item.dataset.dndBound === "true") return;
      item.dataset.dndBound = "true";
      item.addEventListener("dragstart", () => {
        dragStep = item;
        item.classList.add("dragging");
      });
      item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        dragStep = null;
      });
      item.addEventListener("dragover", event => event.preventDefault());
      item.addEventListener("drop", event => {
        event.preventDefault();
        if (!dragStep || dragStep === item) return;
        const rect = item.getBoundingClientRect();
        const after = event.clientY > rect.top + rect.height / 2;
        list.insertBefore(dragStep, after ? item.nextSibling : item);
      });
    });
  }

  function completeTopic(topic) {
    if (!state.completedTopics.includes(topic)) {
      state.completedTopics.push(topic);
      saveState();
      showToast("Topik ditandai selesai. Progres belajar diperbarui.");
    } else {
      showToast("Topik ini sudah ditandai selesai.");
    }
    render();
  }

  function handleClick(event) {
    const button = event.target.closest("[data-action], [data-view]");
    if (!button) return;
    if (button.dataset.view) {
      playClick();
      navigate(button.dataset.view);
      return;
    }
    const action = button.dataset.action;
    playClick();
    switch (action) {
      case "navigate": navigate(button.dataset.target); break;
      case "topic":
        currentTopic = button.dataset.topic;
        render();
        break;
      case "complete-topic": completeTopic(button.dataset.topic); break;
      case "component":
        document.querySelectorAll(".component-button").forEach(el => el.classList.toggle("active", el === button));
        document.getElementById("componentDetail").innerHTML = componentInfo[button.dataset.component];
        break;
      case "mini-check": {
        const output = document.getElementById("miniCheckOutput");
        output.hidden = false;
        output.innerHTML = button.dataset.answer === "storage"
          ? "<strong>Benar.</strong> SSD/HDD menyimpan file secara persisten. RAM bersifat sementara, sedangkan CPU memproses instruksi."
          : "<strong>Belum tepat.</strong> RAM menyimpan data sementara dan CPU memproses instruksi. Pilih media penyimpanan seperti SSD atau HDD untuk menyimpan file secara persisten.";
        break;
      }
      case "run-os-scenario": {
        const scenario = document.getElementById("osScenarioSelect").value;
        document.getElementById("osScenarioOutput").innerHTML = osScenarios[scenario];
        break;
      }
      case "move-step": {
        const item = button.closest(".sort-item");
        const list = document.getElementById("bootSortList");
        if (!item || !list) break;
        if (button.dataset.direction === "up" && item.previousElementSibling) list.insertBefore(item, item.previousElementSibling);
        if (button.dataset.direction === "down" && item.nextElementSibling) list.insertBefore(item.nextElementSibling, item);
        renderBootList();
        break;
      }
      case "check-boot-order": {
        const current = [...document.querySelectorAll("#bootSortList .sort-item")].map(el => el.dataset.step);
        const correct = current.every((value, index) => value === bootCorrect[index]);
        const output = document.getElementById("bootOrderOutput");
        output.innerHTML = correct
          ? "<strong>Urutan benar!</strong> Kamu telah menyusun gambaran umum booting dengan tepat."
          : "<strong>Belum tepat.</strong> Petunjuk: komputer menerima daya terlebih dahulu, lalu firmware berjalan dan POST memeriksa komponen sebelum proses pemuatan sistem operasi.";
        break;
      }
      case "reset-boot-order": {
        const list = document.getElementById("bootSortList");
        const shuffled = [...bootCorrect].sort(() => Math.random() - 0.5);
        const labels = {
          power: "Komputer menerima daya dan dinyalakan",
          firmware: "Firmware BIOS/UEFI berjalan",
          post: "POST memeriksa komponen dasar",
          kernel: "Bootloader memuat kernel sistem operasi",
          "os-ready": "Sistem operasi siap digunakan"
        };
        list.innerHTML = shuffled.map(step => `<div class="sort-item" draggable="true" data-step="${step}"><span class="grip">⠿</span><span>${labels[step]}</span><span class="sort-controls"><button type="button" data-action="move-step" data-direction="up" aria-label="Pindah ke atas">↑</button><button type="button" data-action="move-step" data-direction="down" aria-label="Pindah ke bawah">↓</button></span></div>`).join("");
        document.getElementById("bootOrderOutput").textContent = "Urutan diacak. Susun kembali langkah-langkahnya.";
        renderBootList();
        break;
      }
      case "answer": {
        if (state.quizAnswers[quizIndex] !== undefined) break;
        state.quizAnswers[quizIndex] = Number(button.dataset.index);
        saveState();
        render();
        break;
      }
      case "next-question":
        if (quizIndex < questions.length - 1) {
          quizIndex++;
          render();
        } else {
          const correct = state.quizAnswers.reduce((sum, answer, index) => sum + (answer === questions[index].answer ? 1 : 0), 0);
          state.quizScore = correct * 10;
          state.quizFinished = true;
          saveState();
          render();
        }
        break;
      case "retry-quiz": renderQuizStart(); break;
      case "print-certificate":
        document.body.classList.add("printing-certificate");
        window.print();
        setTimeout(() => document.body.classList.remove("printing-certificate"), 500);
        break;
    }
  }

  function handleChange(event) {
    if (event.target.id === "buildCpu" || event.target.id === "buildBoard" || event.target.id === "buildRam" ||
        event.target.id === "buildStorage" || event.target.id === "buildGpu" || event.target.id === "buildUse" ||
        event.target.id === "buildBudget") {
      updateBuilder();
    }
  }

  function init() {
    document.addEventListener("click", handleClick);
    document.addEventListener("change", handleChange);
    document.getElementById("userNameInput").addEventListener("input", event => {
      state.name = event.target.value.slice(0, 40);
      saveState();
    });
    document.getElementById("soundToggle").addEventListener("click", () => {
      state.soundOn = !state.soundOn;
      if (!state.soundOn && "speechSynthesis" in window) window.speechSynthesis.cancel();
      saveState();
      showToast(state.soundOn ? "Suara diaktifkan." : "Suara dinonaktifkan.");
    });
    document.getElementById("fullscreenToggle").addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      } catch {
        showToast("Mode layar penuh tidak didukung oleh browser ini.");
      }
    });
    document.getElementById("homeButton").addEventListener("click", () => navigate("home"));
    document.getElementById("mobileMenu").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("open"));
    window.addEventListener("afterprint", () => document.body.classList.remove("printing-certificate"));
    updateHeader();
    if (!state.quizFinished && state.quizAnswers.length) {
      const firstUnanswered = questions.findIndex((_, index) => state.quizAnswers[index] === undefined);
      quizIndex = firstUnanswered === -1 ? questions.length - 1 : firstUnanswered;
    }
    render();
  }

  // Narasi ringkasan tersedia sebagai fungsi global yang dipanggil melalui tombol di materi bila ditambahkan.
  window.MPILab = { speak, navigate, showToast };
  document.addEventListener("click", event => {
    const speakButton = event.target.closest("[data-speak]");
    if (speakButton) speak(speakButton.dataset.speak);
  });

  init();

  // Inisialisasi ulang komponen yang memerlukan binding setelah setiap render.
  const originalRender = render;
  render = function wrappedRender() {
    originalRender();
    if (currentView === "material" && currentTopic === "boot") renderBootList();
    if (currentView === "material" && currentTopic === "design") updateBuilder();
  };
  render();
})();