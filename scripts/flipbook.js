const STATE_LABELS = [
  'Bìa sách (1/5)',
  'Khái quát (2/5)',
  'Sơ đồ & Đọc (3/5)',
  'Đi săn (4/5)',
  'Biểu tượng (5/5)',
];

export class FlipbookController {
  /**
   * @param {object} options
   * @param {HTMLElement} options.bookEl
   * @param {HTMLElement} options.stageEl
   * @param {(state: number) => void} [options.onStateChange]
   */
  constructor({ bookEl, stageEl, onStateChange }) {
    this.bookEl = bookEl;
    this.stageEl = stageEl;
    this.onStateChange = onStateChange;

    this.sheets = Array.from(bookEl.querySelectorAll('.sheet'));
    this.totalSheets = this.sheets.length;
    this.currentState = 0;
    this.viewMode = '3d';
    this.transitionTimer = null;
    this.audioCtx = null;

    this.prevBtn = document.getElementById('prev-page-btn');
    this.nextBtn = document.getElementById('next-page-btn');
    this.counterEl = document.getElementById('page-counter');
    this.tocBtns = Array.from(document.querySelectorAll('.toc-btn'));
    this.dotBtns = Array.from(document.querySelectorAll('.dot-btn'));
    this.toggleViewBtn = document.getElementById('toggle-view-btn');
    this.toggleViewLabel = document.getElementById('toggle-view-label');

    this.bindEvents();
    this.applyState(0, false);
  }

  bindEvents() {
    this.prevBtn?.addEventListener('click', () => this.prev());
    this.nextBtn?.addEventListener('click', () => this.next());

    this.tocBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = Number(btn.dataset.targetState);
        this.goTo(target);
      });
    });

    this.dotBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = Number(btn.dataset.state);
        this.goTo(target);
      });
    });

    document.getElementById('open-book-btn')?.addEventListener('click', () => {
      this.goTo(1);
    });

    document.getElementById('restart-book-btn')?.addEventListener('click', () => {
      this.goTo(0);
    });

    document.querySelectorAll('[data-jump-state]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = Number(btn.dataset.jumpState);
        this.goTo(target);
      });
    });

    this.toggleViewBtn?.addEventListener('click', () => {
      this.toggleViewMode();
    });

    document.addEventListener('keydown', (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      const openModal = document.querySelector('.modal-backdrop:not([hidden])');
      if (openModal) return;

      if (this.viewMode !== '3d' || window.innerWidth <= 920) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.next();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.prev();
      }
    });

    // Touch swipe for desktop touchscreens in 3D mode
    let startX = 0;
    let startY = 0;
    let ignoreSwipe = false;

    this.stageEl?.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length !== 1) return;
        const target = e.target;
        ignoreSwipe = Boolean(target instanceof Element && target.closest('input, button, label'));
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      },
      { passive: true },
    );

    this.stageEl?.addEventListener(
      'touchend',
      (e) => {
        if (ignoreSwipe || this.viewMode !== '3d' || window.innerWidth <= 920) return;
        const touch = e.changedTouches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        if (Math.abs(dx) > 65 && Math.abs(dy) < 42) {
          if (dx < 0) this.next();
          else this.prev();
        }
      },
      { passive: true },
    );
  }

  goTo(targetState) {
    const clamped = Math.max(0, Math.min(this.totalSheets, targetState));

    if (this.viewMode === 'scroll' || window.innerWidth <= 920) {
      this.currentState = clamped;
      this.updateIndicators();
      this.scrollToStateTarget(clamped);
      this.onStateChange?.(clamped);
      return;
    }

    if (clamped === this.currentState) return;
    this.applyState(clamped, true);
  }

  next() {
    this.goTo(this.currentState + 1);
  }

  prev() {
    this.goTo(this.currentState - 1);
  }

  applyState(nextState, animateSound) {
    const prevState = this.currentState;
    this.currentState = nextState;
    this.bookEl.dataset.state = String(nextState);

    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }

    const low = Math.min(prevState, nextState);
    const high = Math.max(prevState, nextState);

    this.sheets.forEach((sheet, idx) => {
      const isFlipped = idx < nextState;
      sheet.classList.toggle('is-flipped', isFlipped);
      sheet.classList.toggle('is-top-left', idx === nextState - 1);
      sheet.classList.toggle('is-top-right', idx === nextState);

      const isMoving = idx >= low && idx < high;
      if (isMoving && animateSound) {
        const orderBoost = nextState > prevState ? this.totalSheets - idx : idx;
        sheet.style.zIndex = String(20 + orderBoost);
      } else {
        sheet.style.zIndex = String(isFlipped ? idx + 1 : this.totalSheets - idx);
      }
    });

    if (animateSound) {
      this.playPaperTurnSound();
      this.transitionTimer = setTimeout(() => {
        this.sheets.forEach((sheet, idx) => {
          const isFlipped = idx < this.currentState;
          sheet.style.zIndex = String(isFlipped ? idx + 1 : this.totalSheets - idx);
        });
      }, 860);
    }

    this.updateIndicators();
    this.onStateChange?.(nextState);
  }

  updateIndicators() {
    if (this.prevBtn) this.prevBtn.disabled = this.currentState === 0;
    if (this.nextBtn) this.nextBtn.disabled = this.currentState === this.totalSheets;
    if (this.counterEl) this.counterEl.textContent = STATE_LABELS[this.currentState] || '';

    this.tocBtns.forEach((btn) => {
      const target = Number(btn.dataset.targetState);
      btn.classList.toggle('is-active', target === this.currentState);
    });

    this.dotBtns.forEach((btn) => {
      const target = Number(btn.dataset.state);
      btn.classList.toggle('is-active', target === this.currentState);
    });
  }

  toggleViewMode() {
    const nextMode = this.viewMode === '3d' ? 'scroll' : '3d';
    this.viewMode = nextMode;
    document.body.classList.toggle('view-3d', nextMode === '3d');
    document.body.classList.toggle('view-scroll', nextMode === 'scroll');

    if (this.toggleViewLabel) {
      this.toggleViewLabel.textContent = nextMode === '3d' ? 'Xem rộng' : 'Lật trang 3D';
    }

    if (nextMode === '3d') {
      this.applyState(this.currentState, false);
    }
  }

  scrollToStateTarget(state) {
    let targetEl = this.sheets[0]?.querySelector('.page-front');
    if (state === 1) targetEl = this.sheets[0]?.querySelector('.page-back');
    if (state === 2) targetEl = this.sheets[1]?.querySelector('.page-back');
    if (state === 3) targetEl = this.sheets[2]?.querySelector('.page-back');
    if (state === 4) targetEl = this.sheets[3]?.querySelector('.page-back');

    targetEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  playPaperTurnSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const ctx = this.audioCtx;
      const duration = 0.14;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const env = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * env * 0.08;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400;
      filter.Q.value = 0.9;

      const gain = ctx.createGain();
      gain.gain.value = 0.25;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // Ignore audio context autoplay blocks
    }
  }
}
