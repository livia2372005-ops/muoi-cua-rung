const SPEEDS = [0.85, 1.0, 1.15, 1.3];

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export class NarrationController {
  /**
   * @param {object} options
   * @param {Array} options.nodes
   * @param {string[]} options.candidatePaths
   * @param {(index: number) => void} options.onNodeChange
   */
  constructor({ nodes, candidatePaths, onNodeChange }) {
    this.nodes = nodes;
    this.candidatePaths = candidatePaths;
    this.onNodeChange = onNodeChange;

    this.mode = 'probing'; // 'audio' | 'demo' | 'probing'
    this.isPlaying = false;
    this.speedIndex = 1;
    this.activeNodeIndex = 0;
    this.objectUrl = null;

    // Demo playback state
    this.demoDuration = 70; // 70 seconds simulated narration
    this.demoElapsed = 0;
    this.demoTimer = null;
    this.lastSpokenNode = -1;

    this.audio = new Audio();
    this.audio.preload = 'metadata';

    this.playBtn = document.getElementById('audio-play-btn');
    this.playIcon = document.getElementById('audio-play-icon');
    this.seekInput = document.getElementById('audio-seek');
    this.currentTimeEl = document.getElementById('audio-current-time');
    this.durationTimeEl = document.getElementById('audio-duration-time');
    this.activeLabelEl = document.getElementById('audio-active-label');
    this.statusDot = document.getElementById('audio-status-dot');
    this.statusText = document.getElementById('audio-status-text');
    this.speedBtn = document.getElementById('audio-speed-btn');
    this.localFileInput = document.getElementById('local-audio-input');

    this.bindEvents();
    this.probeHostedAudio();
  }

  bindEvents() {
    this.playBtn?.addEventListener('click', () => {
      if (this.isPlaying) this.pause();
      else this.play();
    });

    this.speedBtn?.addEventListener('click', () => {
      this.speedIndex = (this.speedIndex + 1) % SPEEDS.length;
      const rate = SPEEDS[this.speedIndex];
      this.audio.playbackRate = rate;
      if (this.speedBtn) this.speedBtn.textContent = `${rate.toFixed(rate === 1 ? 1 : 2)}x`;
    });

    this.seekInput?.addEventListener('input', () => {
      const ratio = Number(this.seekInput.value) / 1000;
      if (this.mode === 'audio' && Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
        this.audio.currentTime = ratio * this.audio.duration;
        this.syncNodeFromRatio(ratio);
      } else {
        this.demoElapsed = ratio * this.demoDuration;
        this.updateClockUI(this.demoElapsed, this.demoDuration);
        const nodeIdx = this.syncNodeFromRatio(ratio);
        if (this.isPlaying) this.speakNode(nodeIdx);
      }
    });

    this.localFileInput?.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      this.loadLocalFile(file);
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.mode !== 'audio' || !this.audio.duration) return;
      const ratio = this.audio.currentTime / this.audio.duration;
      if (this.seekInput) this.seekInput.value = String(Math.round(ratio * 1000));
      this.updateClockUI(this.audio.currentTime, this.audio.duration);
      this.syncNodeFromRatio(ratio);
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.updatePlayUI();
    });
  }

  async probeHostedAudio() {
    for (const path of this.candidatePaths) {
      const exists = await this.checkAudioCandidate(path);
      if (exists) {
        this.activateAudioSource(path, `Sẵn sàng phát file thu âm (${path.replace('./audio/', '')})`);
        return;
      }
    }

    // Fallback gracefully to Demo Narration while waiting for Nhóm 3's recording
    this.mode = 'demo';
    this.updateClockUI(0, this.demoDuration);
    this.setStatus('Đọc mẫu (Chờ file thu âm Nhóm 3)', 'ready');
  }

  async checkAudioCandidate(url) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }

  loadLocalFile(file) {
    this.pause();
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
    this.objectUrl = URL.createObjectURL(file);
    this.activateAudioSource(this.objectUrl, `Đang dùng bản thu thử: ${file.name}`);
    this.play();
  }

  activateAudioSource(src, label) {
    this.mode = 'audio';
    this.audio.src = src;
    this.audio.playbackRate = SPEEDS[this.speedIndex];

    const onLoaded = () => {
      this.updateClockUI(0, this.audio.duration || 0);
      this.setStatus(label, 'ready');
      this.audio.removeEventListener('loadedmetadata', onLoaded);
    };
    this.audio.addEventListener('loadedmetadata', onLoaded);
    this.audio.load();
  }

  play() {
    if (this.mode === 'audio') {
      this.audio
        .play()
        .then(() => {
          this.isPlaying = true;
          this.updatePlayUI();
          this.setStatus(this.statusText?.textContent || 'Đang phát giọng đọc', 'playing');
        })
        .catch(() => {
          this.setStatus('Nhấn ▶ để trình duyệt cho phép phát âm thanh', 'ready');
        });
      return;
    }

    // Demo narration mode
    this.isPlaying = true;
    this.updatePlayUI();
    this.setStatus('Đang phát giọng đọc mẫu...', 'playing');
    this.startDemoLoop();
  }

  pause() {
    this.isPlaying = false;
    if (this.mode === 'audio') {
      this.audio.pause();
      this.setStatus(this.statusText?.textContent?.replace('Đang phát', 'Tạm dừng') || 'Đã tạm dừng', 'ready');
    } else {
      this.stopDemoLoop();
      this.setStatus('Đọc mẫu (Chờ file thu âm Nhóm 3)', 'ready');
    }
    this.updatePlayUI();
  }

  playNode(index) {
    const clamped = Math.max(0, Math.min(this.nodes.length - 1, index));
    const node = this.nodes[clamped];
    this.activeNodeIndex = clamped;
    this.onNodeChange?.(clamped);

    if (this.mode === 'audio' && Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
      this.audio.currentTime = node.startRatio * this.audio.duration;
      this.play();
      return;
    }

    this.demoElapsed = node.startRatio * this.demoDuration;
    this.lastSpokenNode = -1;
    if (this.seekInput) this.seekInput.value = String(Math.round(node.startRatio * 1000));
    this.updateClockUI(this.demoElapsed, this.demoDuration);
    this.play();
  }

  startDemoLoop() {
    this.stopDemoLoop(false);
    const ratio = this.demoElapsed / this.demoDuration;
    const initialNode = this.syncNodeFromRatio(ratio);
    this.speakNode(initialNode);

    this.demoTimer = setInterval(() => {
      const rate = SPEEDS[this.speedIndex];
      this.demoElapsed += 0.25 * rate;
      if (this.demoElapsed >= this.demoDuration) {
        this.demoElapsed = 0;
        this.pause();
        if (this.seekInput) this.seekInput.value = '0';
        this.updateClockUI(0, this.demoDuration);
        this.syncNodeFromRatio(0);
        return;
      }
      const nextRatio = this.demoElapsed / this.demoDuration;
      if (this.seekInput) this.seekInput.value = String(Math.round(nextRatio * 1000));
      this.updateClockUI(this.demoElapsed, this.demoDuration);
      const nodeIdx = this.syncNodeFromRatio(nextRatio);
      if (nodeIdx !== this.lastSpokenNode) {
        this.speakNode(nodeIdx);
      }
    }, 250);
  }

  stopDemoLoop(cancelSpeech = true) {
    if (this.demoTimer) {
      clearInterval(this.demoTimer);
      this.demoTimer = null;
    }
    if (cancelSpeech && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore TTS cancel errors
      }
    }
  }

  speakNode(index) {
    this.lastSpokenNode = index;
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const node = this.nodes[index];
      const utterance = new SpeechSynthesisUtterance(node.voiceScript);
      utterance.lang = 'vi-VN';
      utterance.rate = SPEEDS[this.speedIndex];
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find((v) => v.lang.toLowerCase().startsWith('vi'));
      if (viVoice) utterance.voice = viVoice;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Headless or blocked TTS silently degrades to timed highlight
    }
  }

  syncNodeFromRatio(ratio) {
    let matched = 0;
    for (let i = 0; i < this.nodes.length; i++) {
      if (ratio >= this.nodes[i].startRatio) {
        matched = i;
      }
    }
    if (matched !== this.activeNodeIndex) {
      this.activeNodeIndex = matched;
      this.onNodeChange?.(matched);
    }
    if (this.activeLabelEl) {
      this.activeLabelEl.textContent = `Chặng ${matched + 1}/${this.nodes.length}`;
    }
    return matched;
  }

  updateClockUI(current, duration) {
    if (this.currentTimeEl) this.currentTimeEl.textContent = formatTime(current);
    if (this.durationTimeEl) this.durationTimeEl.textContent = formatTime(duration);
  }

  updatePlayUI() {
    if (this.playIcon) this.playIcon.textContent = this.isPlaying ? '⏸' : '▶';
    if (this.statusDot) {
      this.statusDot.classList.toggle('is-playing', this.isPlaying);
    }
  }

  setStatus(text, state) {
    if (this.statusText) this.statusText.textContent = text;
    if (this.statusDot) {
      this.statusDot.classList.toggle('is-ready', state === 'ready');
      this.statusDot.classList.toggle('is-playing', state === 'playing');
    }
  }
}
