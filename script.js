// ── Helpers ───────────────────────────────────────────────

function pickRandom(arr, n) {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

// ── Breathing ─────────────────────────────────────────────
const butterflyVideo = document.getElementById('butterflyVideo');

function startBreathing() {
    if (butterflyVideo) {
        butterflyVideo.currentTime = 0;
        butterflyVideo.play();
    }
}

// ── Camera / SEE  (5 photos) ──────────────────────────────

const PROMPTS = [
    'Find a spoon',        'Find headphones',     'Find a plant',
    'Find a mirror',       'Find your keys',      'Find a pencil',
    'Find some fruit',     'Find something soft', 'Find your phone charger',
    'Find a cup or mug',   'Find a book',         'Find something red',
    'Find something wooden','Find a clock',        'Find a pillow',
    'Find a window',       'Find something circular','Find a bag',
    'Find a light switch', 'Find something you love','Find a photograph',
    'Find something blue', 'Find a shoe',         'Find something that sparkles',
    'Find a remote control',
];

const TOTAL_PHOTOS    = 5;
let   cameraStream    = null;
let   photosTaken     = 0;
const capturedPhotos  = [];
let   selectedPrompts = [];

const cameraFeedEl  = document.getElementById('cameraFeed');
const photoCounter  = document.getElementById('photoCounter');
const cameraFlash   = document.getElementById('cameraFlash');
const cameraError   = document.getElementById('cameraError');
const captureCanvas = document.getElementById('captureCanvas');
const btnCapture    = document.getElementById('btnCapture');
const cameraPrompt  = document.getElementById('cameraPrompt');

async function initCamera() {
    capturedPhotos.length = 0;
    photosTaken = 0;
    selectedPrompts = pickRandom(PROMPTS, TOTAL_PHOTOS);
    updatePhotoCounter();
    setPrompt(selectedPrompts[0], false);
    cameraError.classList.remove('visible');
    btnCapture.disabled = false;

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } }
        });
        cameraFeedEl.srcObject = cameraStream;
    } catch (err) {
        cameraError.classList.add('visible');
        btnCapture.disabled = true;
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
        cameraFeedEl.srcObject = null;
    }
}

function capturePhoto() {
    if (photosTaken >= TOTAL_PHOTOS || !cameraStream) return;

    captureCanvas.width  = cameraFeedEl.videoWidth  || 640;
    captureCanvas.height = cameraFeedEl.videoHeight || 480;
    captureCanvas.getContext('2d').drawImage(cameraFeedEl, 0, 0);
    capturedPhotos.push(captureCanvas.toDataURL('image/jpeg', 0.85));
    photosTaken++;
    triggerFlash();

    if (photosTaken >= TOTAL_PHOTOS) {
        btnCapture.disabled = true;
        setTimeout(() => { stopCamera(); showScreen(screenTouch); initTouch(); }, 500);
    } else {
        updatePhotoCounter();
        setPrompt(selectedPrompts[photosTaken], true);
    }
}

function updatePhotoCounter() {
    photoCounter.textContent = `${photosTaken + 1} of ${TOTAL_PHOTOS}`;
}

function setPrompt(text, fade) {
    if (!fade) { cameraPrompt.textContent = text; return; }
    cameraPrompt.style.opacity = '0';
    setTimeout(() => { cameraPrompt.textContent = text; cameraPrompt.style.opacity = '1'; }, 220);
}

function triggerFlash() {
    cameraFlash.style.transition = 'none';
    cameraFlash.style.opacity = '0.8';
    requestAnimationFrame(() => requestAnimationFrame(() => {
        cameraFlash.style.transition = 'opacity 0.35s ease';
        cameraFlash.style.opacity = '0';
    }));
}

// ── Touch / FEEL  (4 of 12 items) ─────────────────────────

const TOUCH_POOL = [
    { emoji: '🔑', label: 'keys'       },
    { emoji: '📱', label: 'phone'      },
    { emoji: '✏️', label: 'pencil'     },
    { emoji: '📖', label: 'book'       },
    { emoji: '🧸', label: 'soft thing' },
    { emoji: '👕', label: 'clothing'   },
    { emoji: '💧', label: 'water'      },
    { emoji: '🪴', label: 'plant'      },
    { emoji: '🪞', label: 'mirror'     },
    { emoji: '🎧', label: 'headphones' },
    { emoji: '🍎', label: 'fruit'      },
    { emoji: '🔌', label: 'charger'    },
    { emoji: '🧦', label: 'socks'      },
    { emoji: '🎒', label: 'bag'        },
    { emoji: '🕶️', label: 'shades'     },
];

const TOTAL_TOUCH = 4;
let   touchDoneCount = 0;

const touchGridEl   = document.getElementById('touchGrid');
const touchProgress = document.getElementById('touchProgress');

function initTouch() {
    touchDoneCount = 0;
    touchProgress.textContent = `0 of ${TOTAL_TOUCH} touched`;
    touchProgress.classList.remove('complete');
    touchGridEl.innerHTML = '';

    pickRandom(TOUCH_POOL, 12).forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'touch-item';
        btn.innerHTML = `
            <span class="touch-emoji">${item.emoji}</span>
            <span class="touch-label">${item.label}</span>
        `;
        btn.addEventListener('click', () => {
            if (btn.classList.contains('checked')) return;
            btn.classList.add('popping');
            btn.addEventListener('animationend', () => {
                btn.classList.remove('popping');
                btn.classList.add('checked');
                touchDoneCount++;
                updateTouchProgress();
                if (touchDoneCount >= TOTAL_TOUCH) {
                    setTimeout(() => { showScreen(screenHear); initHear(); }, 700);
                }
            }, { once: true });
        });
        touchGridEl.appendChild(btn);
    });
}

function updateTouchProgress() {
    touchProgress.textContent = `${touchDoneCount} of ${TOTAL_TOUCH} touched`;
    if (touchDoneCount >= TOTAL_TOUCH) {
        touchProgress.classList.add('complete');
        touchProgress.textContent = 'All done ✓';
    }
}

// ── Hear / SOUND  (3 recordings) ─────────────────────────

const TOTAL_RECORDINGS = 3;
let recordingCount  = 0;
let mediaRecorder   = null;
let audioStream     = null;
let audioCtx        = null;
let analyser        = null;
let audioAnimFrame  = null;
let isRecording     = false;
let autoStopTimer   = null;
const recordedBlobs = [];

const audioBarsEl  = document.getElementById('audioBars');
const recordingBar = document.getElementById('recordingBar');
const hearProgress = document.getElementById('hearProgress');
const hearStatus   = document.getElementById('hearStatus');
const btnRecord    = document.getElementById('btnRecord');

function initHear() {
    recordingCount = 0;
    recordedBlobs.length = 0;
    isRecording = false;
    updateHearProgress();
    hearStatus.textContent = 'Tap to record';
    btnRecord.classList.remove('recording');
    btnRecord.disabled = false;
    resetBars();
    resetProgressBar();
}

async function toggleRecording() {
    isRecording ? stopRecording() : await startRecording();
}

async function startRecording() {
    if (!audioStream) {
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            hearStatus.textContent = 'Microphone access needed.';
            return;
        }
    }
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        audioCtx.createMediaStreamSource(audioStream).connect(analyser);
    }

    const chunks = [];
    mediaRecorder = new MediaRecorder(audioStream);
    mediaRecorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
        recordedBlobs.push(new Blob(chunks, { type: 'audio/webm' }));
        recordingCount++;
        isRecording = false;
        btnRecord.classList.remove('recording');
        cancelAnimationFrame(audioAnimFrame);
        resetBars();
        resetProgressBar();
        audioBarsEl.classList.remove('recording');
        updateHearProgress();

        if (recordingCount >= TOTAL_RECORDINGS) {
            hearStatus.textContent = 'Beautiful. Well done.';
            btnRecord.disabled = true;
            setTimeout(() => { stopAudio(); showScreen(screenSmell); initSmell(); }, 900);
        } else {
            hearStatus.textContent = 'Nice one! Record another.';
        }
    };

    mediaRecorder.start();
    isRecording = true;
    btnRecord.classList.add('recording');
    audioBarsEl.classList.add('recording');
    hearStatus.textContent = 'Recording… tap to stop';
    startProgressBar();
    animateBars();
    autoStopTimer = setTimeout(() => { if (isRecording) stopRecording(); }, 5000);
}

function stopRecording() {
    clearTimeout(autoStopTimer);
    audioBarsEl.classList.remove('recording');
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
}

function animateBars() {
    const bars = audioBarsEl.querySelectorAll('.audio-bar');
    const data = new Uint8Array(analyser.frequencyBinCount);
    (function draw() {
        audioAnimFrame = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(data);
        bars.forEach((bar, i) => {
            const h = Math.max(4, (data[Math.floor(i * data.length / bars.length)] / 255) * 48 + 4);
            bar.style.height = h + 'px';
        });
    })();
}

function resetBars() {
    cancelAnimationFrame(audioAnimFrame);
    audioBarsEl.querySelectorAll('.audio-bar').forEach(b => b.style.height = '4px');
}

function startProgressBar() {
    recordingBar.style.transition = 'none';
    recordingBar.style.width = '0%';
    void recordingBar.offsetHeight;
    recordingBar.style.transition = 'width 5s linear';
    recordingBar.style.width = '100%';
}

function resetProgressBar() {
    recordingBar.style.transition = 'none';
    recordingBar.style.width = '0%';
}

function stopAudio() {
    clearTimeout(autoStopTimer);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') { isRecording = false; mediaRecorder.stop(); }
    cancelAnimationFrame(audioAnimFrame);
    audioBarsEl.classList.remove('recording');
    if (audioStream) { audioStream.getTracks().forEach(t => t.stop()); audioStream = null; }
    if (audioCtx)    { audioCtx.close(); audioCtx = null; analyser = null; }
}

function updateHearProgress() {
    hearProgress.textContent = `${recordingCount} of ${TOTAL_RECORDINGS} recorded`;
}

// ── Smell / SMELL  (2 found) ──────────────────────────────

const TOTAL_SMELLS = 2;
let   smellCount   = 0;

const smellDot1      = document.getElementById('smellDot1');
const smellDot2      = document.getElementById('smellDot2');
const btnSmellFound  = document.getElementById('btnSmellFound');

function initSmell() {
    smellCount = 0;
    smellDot1.classList.remove('found');
    smellDot2.classList.remove('found');
    btnSmellFound.disabled = false;
    btnSmellFound.textContent = 'Found one';
}

function foundSmell() {
    if (smellCount >= TOTAL_SMELLS) return;
    smellCount++;

    if (smellCount === 1) smellDot1.classList.add('found');
    if (smellCount === 2) smellDot2.classList.add('found');

    if (smellCount >= TOTAL_SMELLS) {
        btnSmellFound.disabled = true;
        setTimeout(() => { showScreen(screenTaste); initTaste(); }, 600);
    }
}

// ── Taste / TASTE  (1 selection) ─────────────────────────

function initTaste() {
    // Reset any previous selection
    document.querySelectorAll('.taste-opt').forEach(b => b.classList.remove('selected'));
}

function selectTaste(btn) {
    document.querySelectorAll('.taste-opt').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    setTimeout(() => showScreen(screenGrounded), 450);
}

// ── Screen navigation ─────────────────────────────────────

const screenBreathing = document.getElementById('screen-breathing');
const screenCamera    = document.getElementById('screen-camera');
const screenTouch     = document.getElementById('screen-touch');
const screenHear      = document.getElementById('screen-hear');
const screenSmell     = document.getElementById('screen-smell');
const screenTaste     = document.getElementById('screen-taste');
const screenGrounded  = document.getElementById('screen-grounded');

const btnKeep  = document.getElementById('btnKeep');
const btnReady = document.getElementById('btnReady');
const btnBack  = document.getElementById('btnBack');

function showScreen(screenEl) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screenEl.classList.add('active');
}

// ── Event listeners ───────────────────────────────────────

btnKeep.addEventListener('click', startBreathing);

btnReady.addEventListener('click', () => { showScreen(screenCamera); initCamera(); });

btnCapture.addEventListener('click', capturePhoto);

btnRecord.addEventListener('click', toggleRecording);

btnSmellFound.addEventListener('click', foundSmell);

document.querySelectorAll('.taste-opt').forEach(btn => {
    btn.addEventListener('click', () => selectTaste(btn));
});

// Back arrows
document.getElementById('btnBackCamera').addEventListener('click', () => {
    stopCamera();
    showScreen(screenBreathing);
    startBreathing();
});

document.getElementById('btnBackTouch').addEventListener('click', () => {
    showScreen(screenCamera);
    initCamera();
});

document.getElementById('btnBackHear').addEventListener('click', () => {
    stopAudio();
    showScreen(screenTouch);
    initTouch();
});

document.getElementById('btnBackSmell').addEventListener('click', () => {
    showScreen(screenHear);
    initHear();
});

document.getElementById('btnBackTaste').addEventListener('click', () => {
    showScreen(screenSmell);
    initSmell();
});

// Close from completion screen
btnBack.addEventListener('click', () => {
    stopCamera();
    stopAudio();
    showScreen(screenBreathing);
    startBreathing();
});

// ── Init ──────────────────────────────────────────────────
startBreathing();
