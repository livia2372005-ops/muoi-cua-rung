window.MuoiCuaRung = window.MuoiCuaRung || {};

(function () {
  var SPEEDS = [0.85, 1.0, 1.15, 1.3];

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function NarrationController(options) {
    this.nodes = options.nodes;
    this.candidatePaths = options.candidatePaths;
    this.onNodeChange = options.onNodeChange;
    this.onPlayStateChange = options.onPlayStateChange;

    this.mode = 'demo';
    this.isPlaying = false;
    this.speedIndex = 1;
    this.activeNodeIndex = 0;
    this.objectUrl = null;
    this.demoDuration = 82;
    this.demoElapsed = 0;
    this.demoTimer = null;
    this.hasViVoice = false;
    this.ttsActive = false;

    this.audio = new Audio();
    this.audio.preload = 'metadata';

    this.playBtn = document.getElementById('audio-play-btn');
    this.miniPlayBtn = document.getElementById('mini-play-btn');
    this.modalPlayBtn = document.getElementById('modal-play-btn');
    this.playSvg = document.getElementById('play-svg-icon');
    this.inkWave = document.getElementById('ink-wave');
    this.seekInput = document.getElementById('audio-seek');
    this.clockEl = document.getElementById('audio-clock');
    this.statusEl = document.getElementById('audio-status-text');
    this.modalStatusEl = document.getElementById('modal-audio-status');
    this.speedBtn = document.getElementById('audio-speed-btn');

    this.bindEvents();
    this.detectVietnameseVoice();
    this.probeAudioCandidates(0);
  }

  NarrationController.prototype.detectVietnameseVoice = function () {
    var self = this;
    if (!('speechSynthesis' in window)) return;
    function scan() {
      try {
        var voices = window.speechSynthesis.getVoices();
        self.hasViVoice = voices.some(function (v) {
          return v.lang.toLowerCase().indexOf('vi') === 0;
        });
      } catch (e) {}
    }
    scan();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.addEventListener('voiceschanged', scan);
    }
  };

  NarrationController.prototype.bindEvents = function () {
    var self = this;

    function togglePlay() {
      if (self.isPlaying) self.pause();
      else self.play();
    }

    if (this.playBtn) this.playBtn.addEventListener('click', togglePlay);
    if (this.miniPlayBtn) this.miniPlayBtn.addEventListener('click', togglePlay);
    if (this.modalPlayBtn) this.modalPlayBtn.addEventListener('click', togglePlay);

    if (this.speedBtn) {
      this.speedBtn.addEventListener('click', function () {
        self.speedIndex = (self.speedIndex + 1) % SPEEDS.length;
        var rate = SPEEDS[self.speedIndex];
        self.audio.playbackRate = rate;
        self.speedBtn.textContent = (rate === 1 ? '1' : String(rate)) + 'x';
      });
    }

    if (this.seekInput) {
      this.seekInput.addEventListener('input', function () {
        var ratio = Number(self.seekInput.value) / 1000;
        if (self.mode === 'audio' && Number.isFinite(self.audio.duration) && self.audio.duration > 0) {
          self.audio.currentTime = ratio * self.audio.duration;
          self.syncNodeFromRatio(ratio);
        } else {
          self.demoElapsed = ratio * self.demoDuration;
          self.updateClockUI(self.demoElapsed, self.demoDuration);
          var nodeIdx = self.syncNodeFromRatio(ratio);
          if (self.isPlaying) self.playNode(nodeIdx);
        }
      });
    }

    var modalFileInput = document.getElementById('modal-audio-input');
    if (modalFileInput) {
      modalFileInput.addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (file) self.loadLocalFile(file);
      });
    }

    this.audio.addEventListener('timeupdate', function () {
      if (self.mode !== 'audio' || !self.audio.duration) return;
      var ratio = self.audio.currentTime / self.audio.duration;
      if (self.seekInput) self.seekInput.value = String(Math.round(ratio * 1000));
      self.updateClockUI(self.audio.currentTime, self.audio.duration);
      self.syncNodeFromRatio(ratio);
    });

    this.audio.addEventListener('ended', function () {
      self.isPlaying = false;
      self.updatePlayUI();
    });
  };

  NarrationController.prototype.probeAudioCandidates = function (index) {
    var self = this;
    if (index >= this.candidatePaths.length) {
      this.mode = 'demo';
      this.updateClockUI(0, this.demoDuration);
      this.setStatus('Giọng đọc tóm tắt — Nhóm 3');
      return;
    }

    var testAudio = new Audio();
    var candidate = this.candidatePaths[index];
    var settled = false;

    function cleanup() {
      testAudio.removeEventListener('loadedmetadata', onOk);
      testAudio.removeEventListener('error', onErr);
    }
    function onOk() {
      if (settled) return;
      settled = true;
      cleanup();
      self.activateAudioSource(candidate, 'Giọng đọc Nhóm 3 (' + candidate.replace('./audio/', '') + ')');
    }
    function onErr() {
      if (settled) return;
      settled = true;
      cleanup();
      self.probeAudioCandidates(index + 1);
    }

    testAudio.preload = 'metadata';
    testAudio.addEventListener('loadedmetadata', onOk);
    testAudio.addEventListener('error', onErr);
    testAudio.src = candidate;
  };

  NarrationController.prototype.loadLocalFile = function (file) {
    this.pause();
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = URL.createObjectURL(file);
    this.activateAudioSource(this.objectUrl, 'Bản thu Nhóm 3: ' + file.name);
    this.play();
  };

  NarrationController.prototype.activateAudioSource = function (src, label) {
    var self = this;
    this.mode = 'audio';
    this.audio.src = src;
    this.audio.playbackRate = SPEEDS[this.speedIndex];
    function onMeta() {
      self.updateClockUI(0, self.audio.duration || 0);
      self.setStatus(label);
      self.audio.removeEventListener('loadedmetadata', onMeta);
    }
    this.audio.addEventListener('loadedmetadata', onMeta);
    this.audio.load();
  };

  NarrationController.prototype.play = function () {
    var self = this;
    if (this.mode === 'audio') {
      this.audio
        .play()
        .then(function () {
          self.isPlaying = true;
          self.updatePlayUI();
        })
        .catch(function () {
          self.setStatus('Bấm ▶ để bật âm thanh');
        });
      return;
    }

    this.isPlaying = true;
    this.updatePlayUI();

    if (this.hasViVoice && 'speechSynthesis' in window) {
      this.setStatus('Đang phát thuyết minh tóm tắt...');
      this.speakChainFrom(this.activeNodeIndex);
    } else {
      this.setStatus('Đang trình chiếu phụ đề 5 chặng');
      this.startTimerFallback();
    }
  };

  NarrationController.prototype.pause = function () {
    this.isPlaying = false;
    this.ttsActive = false;
    if (this.mode === 'audio') {
      this.audio.pause();
    } else {
      if (this.demoTimer) {
        clearInterval(this.demoTimer);
        this.demoTimer = null;
      }
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
      this.setStatus('Giọng đọc tóm tắt — Nhóm 3');
    }
    this.updatePlayUI();
  };

  NarrationController.prototype.playNode = function (index) {
    var clamped = Math.max(0, Math.min(this.nodes.length - 1, index));
    var node = this.nodes[clamped];
    this.activeNodeIndex = clamped;
    if (this.onNodeChange) this.onNodeChange(clamped, true);

    if (this.mode === 'audio' && Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
      this.audio.currentTime = node.startRatio * this.audio.duration;
      this.play();
      return;
    }

    this.demoElapsed = node.startRatio * this.demoDuration;
    if (this.seekInput) this.seekInput.value = String(Math.round(node.startRatio * 1000));
    this.updateClockUI(this.demoElapsed, this.demoDuration);

    if (this.demoTimer) {
      clearInterval(this.demoTimer);
      this.demoTimer = null;
    }
    this.isPlaying = true;
    this.updatePlayUI();
    if (this.hasViVoice && 'speechSynthesis' in window) {
      this.setStatus('Đang đọc Chặng ' + (clamped + 1) + '...');
      this.speakChainFrom(clamped);
    } else {
      this.setStatus('Đang trình chiếu Chặng ' + (clamped + 1) + ' / 5');
      this.startTimerFallback();
    }
  };

  // Chain full sentences cleanly using utterance.onend so speech never cuts mid-word
  NarrationController.prototype.speakChainFrom = function (index) {
    var self = this;
    if (!this.isPlaying || index >= this.nodes.length) {
      this.demoElapsed = 0;
      if (this.seekInput) this.seekInput.value = '0';
      this.updateClockUI(0, this.demoDuration);
      this.pause();
      return;
    }

    this.activeNodeIndex = index;
    if (this.onNodeChange) this.onNodeChange(index, true);

    var node = this.nodes[index];
    this.demoElapsed = node.startRatio * this.demoDuration;
    if (this.seekInput) this.seekInput.value = String(Math.round(node.startRatio * 1000));
    this.updateClockUI(this.demoElapsed, this.demoDuration);

    try {
      window.speechSynthesis.cancel();
      this.ttsActive = true;
      var utter = new SpeechSynthesisUtterance(node.voiceScript);
      utter.lang = 'vi-VN';
      utter.rate = SPEEDS[this.speedIndex];
      var voices = window.speechSynthesis.getVoices();
      for (var i = 0; i < voices.length; i++) {
        if (voices[i].lang.toLowerCase().indexOf('vi') === 0) {
          utter.voice = voices[i];
          break;
        }
      }
      utter.onend = function () {
        if (!self.isPlaying || !self.ttsActive) return;
        self.speakChainFrom(index + 1);
      };
      utter.onerror = function () {
        if (self.isPlaying) self.startTimerFallback();
      };
      window.speechSynthesis.speak(utter);
    } catch (e) {
      this.startTimerFallback();
    }
  };

  NarrationController.prototype.startTimerFallback = function () {
    var self = this;
    if (this.demoTimer) clearInterval(this.demoTimer);
    this.demoTimer = setInterval(function () {
      var rate = SPEEDS[self.speedIndex];
      self.demoElapsed += 0.25 * rate;
      if (self.demoElapsed >= self.demoDuration) {
        self.demoElapsed = 0;
        if (self.seekInput) self.seekInput.value = '0';
        self.updateClockUI(0, self.demoDuration);
        self.syncNodeFromRatio(0);
        self.pause();
        return;
      }
      var ratio = self.demoElapsed / self.demoDuration;
      if (self.seekInput) self.seekInput.value = String(Math.round(ratio * 1000));
      self.updateClockUI(self.demoElapsed, self.demoDuration);
      self.syncNodeFromRatio(ratio);
    }, 250);
  };

  NarrationController.prototype.syncNodeFromRatio = function (ratio) {
    var matched = 0;
    for (var i = 0; i < this.nodes.length; i++) {
      if (ratio >= this.nodes[i].startRatio) matched = i;
    }
    if (matched !== this.activeNodeIndex) {
      this.activeNodeIndex = matched;
      if (this.onNodeChange) this.onNodeChange(matched, this.isPlaying);
    }
    return matched;
  };

  NarrationController.prototype.updateClockUI = function (current, duration) {
    if (this.clockEl) {
      this.clockEl.textContent = formatTime(current) + ' / ' + formatTime(duration);
    }
  };

  NarrationController.prototype.updatePlayUI = function () {
    if (this.playSvg) {
      this.playSvg.innerHTML = this.isPlaying
        ? '<rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor"/>'
        : '<path d="M7 5.5v13l11-6.5-11-6.5Z" fill="currentColor" stroke="none"/>';
    }
    if (this.miniPlayBtn) this.miniPlayBtn.textContent = this.isPlaying ? '⏸' : '▶';
    if (this.modalPlayBtn) this.modalPlayBtn.textContent = this.isPlaying ? '⏸ Tạm dừng tóm tắt' : '▶ Nghe toàn bộ tóm tắt';
    if (this.inkWave) this.inkWave.classList.toggle('is-playing', this.isPlaying);
    if (this.onPlayStateChange) this.onPlayStateChange(this.isPlaying);
  };

  NarrationController.prototype.setStatus = function (text) {
    if (this.statusEl) this.statusEl.textContent = text;
    if (this.modalStatusEl) this.modalStatusEl.textContent = text;
  };

  window.MuoiCuaRung.NarrationController = NarrationController;
})();
