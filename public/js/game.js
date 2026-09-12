// Main Game Manager for POWER CUT
class PowerCutGame {
  constructor() {
    this.sessionId = null;
    this.state = 'HOME'; // HOME, HOW_TO_PLAY, MEMORIZATION, POWER_CUT, BLACKOUT_SEARCH, TIME_UP, ANALYSIS, REVEAL
    
    this.sessionData = null;
    this.roomRenderer = new RoomRenderer('room-container');
    
    // Flashlight State — EXACTLY 1 USE AVAILABLE, EXACTLY 2 SECONDS
    this.flashlightActive = false;
    this.flashlightUsesRemaining = 1;
    this.flashlightUsesCount = 0;
    this.flashlightDurationTimer = null;
    this.flashlightActiveInterval = null;

    // Timers & Search Duration
    this.memoInterval = null;
    this.searchInterval = null;
    this.ambientEventInterval = null;
    this.searchTimeRemaining = 120; // 120 SECONDS (2 MINUTES)

    this.initSparksCanvas();
    this.bindEvents();
  }

  // 1. Particle Sparks Background
  initSparksCanvas() {
    const canvas = document.getElementById('sparks-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      size: Math.random() * 2.5 + 1,
      alpha: Math.random(),
      color: Math.random() > 0.5 ? '#f59e0b' : '#38bdf8'
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      requestAnimationFrame(render);
    };
    render();
  }

  // 2. Bind DOM Events & Keyboard Controls
  bindEvents() {
    // Sound Toggle
    const btnSound = document.getElementById('btn-sound-toggle');
    btnSound.addEventListener('click', () => {
      const isMuted = sounds.toggleMute();
      btnSound.innerHTML = isMuted ? '🔇 MUTE' : '🔊 SOUND ON';
    });

    // Navigation & Screen Buttons
    document.getElementById('btn-start-game').addEventListener('click', () => {
      sounds.playButtonClick();
      this.showScreen('screen-how-to-play');
    });

    document.getElementById('btn-how-to-play').addEventListener('click', () => {
      sounds.playButtonClick();
      this.showScreen('screen-how-to-play');
    });

    document.getElementById('btn-confirm-ready').addEventListener('click', () => {
      sounds.playButtonClick();
      this.startLevel();
    });

    document.getElementById('btn-logo').addEventListener('click', () => {
      sounds.playButtonClick();
      this.resetToHome();
    });

    // Flashlight UI Button Click
    document.getElementById('btn-flashlight').addEventListener('click', () => {
      this.triggerFlashlight();
    });

    // Final Reveal Action Buttons
    document.getElementById('btn-play-again').addEventListener('click', () => {
      sounds.playButtonClick();
      this.startLevel();
    });

    document.getElementById('btn-waste-more').addEventListener('click', () => {
      sounds.playButtonClick();
      this.startLevel();
    });

    document.getElementById('btn-exit').addEventListener('click', () => {
      sounds.playButtonClick();
      document.getElementById('modal-exit').classList.remove('hidden');
    });

    document.getElementById('btn-exit-yes').addEventListener('click', () => {
      sounds.playButtonClick();
      document.getElementById('modal-exit').classList.add('hidden');
      this.resetToHome();
    });

    document.getElementById('btn-exit-no').addEventListener('click', () => {
      sounds.playButtonClick();
      document.getElementById('modal-exit').classList.add('hidden');
      this.startLevel();
    });

    // Room Object Clicks
    this.roomRenderer.onObjectClickCallback = (obj, clickX, clickY) => {
      if (this.state === 'BLACKOUT_SEARCH') {
        this.handleObjectClick(obj, clickX, clickY);
      }
    };

    // Spacebar Listener for Flashlight Activation
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.state === 'BLACKOUT_SEARCH') {
        e.preventDefault();
        this.triggerFlashlight();
      }
    });
  }

  // Helper: Format Seconds into MM:SS
  formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // 3. Screen Switching Helper
  showScreen(screenId) {
    document.querySelectorAll('.game-screen').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(screenId);
    if (target) target.classList.remove('hidden');

    const topWidgets = document.getElementById('game-status-widgets');
    if (screenId === 'screen-gameplay') {
      topWidgets.classList.remove('hidden');
    } else {
      topWidgets.classList.add('hidden');
    }
  }

  // 4. Start Game Session (Level Setup)
  async startLevel() {
    this.clearAllTimers();
    
    try {
      const res = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 1 })
      });
      const data = await res.json();
      if (!data.success) return;

      this.sessionId = data.sessionId;
      this.sessionData = data;
      this.flashlightUsesRemaining = 1;
      this.flashlightUsesCount = 0;
      this.flashlightActive = false;
      this.updateFlashlightUI();

      // Set Target Display (Visible ONLY during memorization)
      document.getElementById('target-name-display').innerText = `FIND THE ${data.target.name}`;
      document.getElementById('memo-target-area').classList.remove('hidden');

      // Render 59 House Objects
      this.roomRenderer.renderRoom(data.roomObjects);

      // Reset Room Lighting Container to 100% Bright
      const roomContainer = document.getElementById('room-container');
      roomContainer.className = 'room-canvas room-lighting-100';

      // Reset HUD Overlays
      document.getElementById('blackout-title-popup').classList.add('hidden');
      document.getElementById('flashlight-hud').classList.add('hidden');
      document.getElementById('flashlight-active-banner').classList.add('hidden');
      document.getElementById('whole-room-glow').classList.add('hidden');
      document.getElementById('timer-badge').classList.remove('timer-pulse');

      this.showScreen('screen-gameplay');
      this.startMemorizationPhase(3);
    } catch (e) {
      console.error('Failed to start session:', e);
    }
  }

  // 5. Memorization Phase (3-Second Countdown) — TARGET NAME IS VISIBLE HERE
  startMemorizationPhase(seconds) {
    this.state = 'MEMORIZATION';
    let count = seconds;
    
    const bannerTimer = document.getElementById('memo-timer-display');
    const memoSecEl = document.getElementById('memo-seconds');
    const hudTimer = document.getElementById('search-timer-hud');

    bannerTimer.classList.remove('hidden');
    hudTimer.classList.add('hidden');
    memoSecEl.innerText = count.toString();

    sounds.playClockTick();

    this.memoInterval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        memoSecEl.innerText = count.toString();
        sounds.playClockTick();
      } else {
        clearInterval(this.memoInterval);
        bannerTimer.classList.add('hidden');
        hudTimer.classList.remove('hidden');
        this.triggerPowerCutSequence();
      }
    }, 1000);
  }

  // 6. ⚡ POWER CUT LIGHTING SEQUENCE (Step 1: Bright -> Step 2: Fading -> Step 3: Dark Search)
  triggerPowerCutSequence() {
    this.state = 'POWER_CUT';
    const roomContainer = document.getElementById('room-container');
    const titlePop = document.getElementById('blackout-title-popup');

    // Play Spark Sound
    sounds.playSpark();
    
    // STEP 1 — POWER CUT: Popup appears, ENTIRE ROOM remains 100% bright for 1.5 seconds!
    titlePop.classList.remove('hidden');
    roomContainer.className = 'room-canvas room-lighting-100';

    setTimeout(() => {
      // Sound Power Cut Outage
      sounds.playPowerCut();

      // STEP 2 — GRADUAL DARKENING: Smooth fade over 3.5 seconds
      roomContainer.className = 'room-canvas room-lighting-fading';
      document.getElementById('flashlight-hud').classList.remove('hidden');

      setTimeout(() => {
        // STEP 3 — SEARCH DARKNESS: Room stays faintly dark & recognizable
        titlePop.classList.add('hidden');
        roomContainer.className = 'room-canvas room-lighting-dark';

        // ❌ HIDE THE TARGET NAME COMPLETELY DURING SEARCH MODE!
        document.getElementById('memo-target-area').classList.add('hidden');

        this.startBlackoutSearchPhase(120); // 120 SECONDS SEARCH
      }, 2000);

    }, 1500);
  }

  // 7. 120-Second Search Phase (Target Name is COMPLETELY HIDDEN)
  startBlackoutSearchPhase(totalSeconds) {
    this.state = 'BLACKOUT_SEARCH';
    this.searchTimeRemaining = totalSeconds;

    const timerVal = document.getElementById('timer-val');
    const hudTimerVal = document.getElementById('hud-timer-display');
    const timerBadge = document.getElementById('timer-badge');

    timerVal.innerText = this.formatTime(this.searchTimeRemaining);
    hudTimerVal.innerText = this.formatTime(this.searchTimeRemaining);

    // Main 120-Second Search Interval (updates every 100ms)
    this.searchInterval = setInterval(() => {
      this.searchTimeRemaining -= 0.1;

      if (this.searchTimeRemaining > 0) {
        const timeStr = this.formatTime(this.searchTimeRemaining);
        timerVal.innerText = timeStr;
        hudTimerVal.innerText = timeStr;

        // Check tension alerts
        if (Math.abs(this.searchTimeRemaining - 60) < 0.15 && !this.alert60Shown) {
          this.alert60Shown = true;
          this.showToast("🕐 ONE MINUTE GONE.");
        } else if (Math.abs(this.searchTimeRemaining - 30) < 0.15 && !this.alert30Shown) {
          this.alert30Shown = true;
          this.showToast("⚠️ ONLY 30 SECONDS LEFT!");
        }

        // Pulse timer at last 10 seconds
        if (this.searchTimeRemaining <= 10) {
          timerBadge.classList.add('timer-pulse');
          if (Math.floor(this.searchTimeRemaining * 10) % 10 === 0) {
            sounds.playClockTick();
          }
        }

      } else {
        timerVal.innerText = '00:00';
        hudTimerVal.innerText = '00:00';
        this.finishSearchPhase();
      }
    }, 100);

    // Ambient Random Distractor Events Interval
    this.ambientEventInterval = setInterval(() => {
      if (this.state === 'BLACKOUT_SEARCH') {
        this.roomRenderer.triggerRandomEvent();
        if (Math.random() > 0.4) {
          this.triggerAmbientVoicePrompt();
        }
      }
    }, 5500);
  }

  // Ambient Funny Voice Hints
  triggerAmbientVoicePrompt() {
    const prompts = [
      "Maybe check behind the sofa.",
      "Have you tried turning the electricity back on?",
      "Interesting strategy...",
      "You're getting closer.",
      "Probably.",
      "Check somewhere else.",
      "Are you sure you remember what you're looking for?"
    ];
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    const el = document.getElementById('ambient-prompt');
    el.innerText = `💬 "${prompt}"`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3500);
  }

  // 8. 🔦 FLASHLIGHT ACTIVATION (ONLY 1 USE, EXACTLY 2 SECONDS, WHOLE ROOM ILLUMINATION)
  triggerFlashlight() {
    if (this.flashlightActive || this.flashlightUsesRemaining <= 0 || this.state !== 'BLACKOUT_SEARCH') return;

    this.flashlightActive = true;
    this.flashlightUsesRemaining = 0;
    this.flashlightUsesCount = 1;
    sounds.playFlashlight();

    const roomContainer = document.getElementById('room-container');
    const glowOverlay = document.getElementById('whole-room-glow');
    const btnFlashlight = document.getElementById('btn-flashlight');
    const badge = document.getElementById('flashlight-cooldown-badge');
    const activeBanner = document.getElementById('flashlight-active-banner');
    const countSpan = document.getElementById('fl-seconds-count');

    // 1. Button glows & whole room glow overlay activates
    btnFlashlight.classList.add('active-glowing');
    glowOverlay.classList.remove('hidden');
    activeBanner.classList.remove('hidden');

    // 2. Room smoothly transitions to 100% FULL ROOM ILLUMINATION!
    roomContainer.className = 'room-canvas room-lighting-flashlight';

    // Notify backend
    fetch(`/api/game/${this.sessionId}/flashlight`, { method: 'POST' }).catch(() => {});

    // 3. EXACTLY 2 SECONDS Active Illumination Countdown
    let activeSecRemaining = 2;
    countSpan.innerText = activeSecRemaining.toString();

    this.flashlightActiveInterval = setInterval(() => {
      activeSecRemaining -= 1;
      if (activeSecRemaining > 0) {
        countSpan.innerText = activeSecRemaining.toString();
        sounds.playClockTick();
      } else {
        clearInterval(this.flashlightActiveInterval);
      }
    }, 1000);

    // 4. At EXACTLY 2 Seconds Expiry -> POWER CUT CONTINUES -> Button Permanently Disabled
    this.flashlightDurationTimer = setTimeout(() => {
      this.flashlightActive = false;
      btnFlashlight.classList.remove('active-glowing');
      btnFlashlight.disabled = true;
      badge.classList.remove('hidden');
      badge.innerText = '(USED)';

      glowOverlay.classList.add('hidden');
      activeBanner.classList.add('hidden');

      this.showToast("⚡ POWER CUT CONTINUES!");
      sounds.playSpark();

      // Gradual darkening animation back to dark search mode
      roomContainer.className = 'room-canvas room-lighting-fading';
      
      setTimeout(() => {
        if (this.state === 'BLACKOUT_SEARCH') {
          roomContainer.className = 'room-canvas room-lighting-dark';
        }
      }, 2500);

    }, 2000); // EXACTLY 2000 MS (2 SECONDS)
  }

  updateFlashlightUI() {
    const btn = document.getElementById('btn-flashlight');
    const badge = document.getElementById('flashlight-cooldown-badge');
    btn.disabled = false;
    btn.classList.remove('active-glowing');
    badge.classList.remove('hidden');
    badge.innerText = '(1 USE)';
  }

  // 9. Object Click Handler (Funny Escalating Responses)
  async handleObjectClick(obj, clickX, clickY) {
    sounds.playWrongClick();

    try {
      const res = await fetch(`/api/game/${this.sessionId}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId: obj.id, objectName: obj.name })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast(data.message);
      }
    } catch (e) {
      this.showToast("❌ Nope! Keep searching.");
    }
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 2400);
  }

  // 10. Finish Search Phase & Transition to Scanner
  async finishSearchPhase() {
    this.clearAllTimers();
    this.state = 'TIME_UP';
    sounds.playBuzzer();

    try {
      const res = await fetch(`/api/game/${this.sessionId}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchDuration: 120 })
      });
      const data = await res.json();
      if (data.success) {
        this.startAnalysisPhase(data.results);
      }
    } catch (e) {
      console.error('Error completing session:', e);
    }
  }

  // 11. Scanner & Room Analysis Sequence with Target Reveal
  startAnalysisPhase(results) {
    this.state = 'ANALYSIS';
    this.showScreen('screen-analysis');

    document.getElementById('res-checked').innerText = results.objectsChecked;
    document.getElementById('res-clicks').innerText = results.wrongClicks;
    document.getElementById('res-flashlight').innerText = results.flashlightUses;

    // Set Target Name for Reveal
    document.getElementById('reveal-target-name').innerText = results.targetName;

    const statusText = document.getElementById('scanner-status-text');
    const progressBar = document.getElementById('scanner-progress-bar');
    const dramaticDiv = document.getElementById('analysis-revelation');

    dramaticDiv.classList.add('hidden');
    progressBar.style.width = '0%';

    const scanSteps = [
      { text: "Checking sofa, coffee table and TV...", pct: "25%" },
      { text: "Checking kitchen fridge, microwave and cups...", pct: "50%" },
      { text: "Checking bookshelf, storage boxes and dark corners...", pct: "75%" },
      { text: "Checking every possible location...", pct: "100%" }
    ];

    let idx = 0;
    const scanInterval = setInterval(() => {
      if (idx < scanSteps.length) {
        statusText.innerText = scanSteps[idx].text;
        progressBar.style.width = scanSteps[idx].pct;
        sounds.playClockTick();
        idx++;
      } else {
        clearInterval(scanInterval);
        setTimeout(() => {
          dramaticDiv.classList.remove('hidden');
          sounds.playBuzzer();

          // Dramatic delay before opening uselessness reveal screen
          setTimeout(() => {
            this.showGrandUselessnessReveal(results);
          }, 3800);
        }, 600);
      }
    }, 900);
  }

  // 12. Grand Uselessness Reveal Screen
  showGrandUselessnessReveal(results) {
    this.state = 'REVEAL';
    this.showScreen('screen-reveal');
    sounds.playRevealFanfare();

    document.getElementById('metric-time').innerText = `120 seconds`;
    document.getElementById('metric-searched').innerText = results.objectsChecked;
    document.getElementById('metric-clicks').innerText = results.wrongClicks;
    document.getElementById('metric-flashlight').innerText = `${results.flashlightUses}`;
  }

  resetToHome() {
    this.clearAllTimers();
    this.state = 'HOME';
    this.showScreen('screen-landing');
  }

  clearAllTimers() {
    if (this.memoInterval) clearInterval(this.memoInterval);
    if (this.searchInterval) clearInterval(this.searchInterval);
    if (this.ambientEventInterval) clearInterval(this.ambientEventInterval);
    if (this.flashlightDurationTimer) clearTimeout(this.flashlightDurationTimer);
    if (this.flashlightActiveInterval) clearInterval(this.flashlightActiveInterval);
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new PowerCutGame();
});
