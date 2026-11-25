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

    this.mode = 'probing';
    this.isPlaying = false;
    this.speedIndex = 1;
    this.activeNodeIndex = 0;
    this.objectUrl = null;
    this.demoDuration = 72;
    this.demoElapsed = 0;
    this.demoTimer = null;
    this.lastSpokenNode = -1;

    this.audio = new Audio();
    this.audio.preload = 'metadata';

    this.playBtn = document.getElementById('audio-play-btn');
    this.playIcon = document.getElementById('audio-play-icon');
    this.seekInput = document.getElementById('audio-seek');
    this.clockEl = document.getElementById('audio-clock');
    this.statusEl = document.getElementById('audio-status-text');
    this.speedBtn = document.getElementById('audio-speed-btn');

    this.bindEvents();
    this.probeAudioCandidates(0);
  }

  NarrationController.prototype.bindEvents = function () {
    var self = this;

    if (this.playBtn) {
      this.playBtn.addEventListener('click', function () {
        if (self.isPlaying) self.pause();
        else self.play();
      });
    }

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
          if (self.isPlaying) self.speakNode(nodeIdx);
        }
      });
    }

    ['local-audio-input', 'modal-audio-input'].forEach(function (id) {
      var input = document.getElementById(id);
      if (!input) return;
      input.addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (file) self.loadLocalFile(file);
      });
    });

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

  // Probe candidate audio files via HTMLAudioElement so it works on both file:// and https://
  NarrationController.prototype.probeAudioCandidates = function (index) {
    var self = this;
    if (index >= this.candidatePaths.length) {
      this.mode = 'demo';
      this.updateClockUI(0, this.demoDuration);
      this.setStatus('Giọng đọc mẫu (Chờ file Nhóm 3)');
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
      self.activateAudioSource(candidate, 'Bản thu âm Nhóm 3 (' + candidate.replace('./audio/', '') + ')');
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
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
    this.objectUrl = URL.createObjectURL(file);
    this.activateAudioSource(this.objectUrl, 'Bản thu thử: ' + file.name);
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
          self.setStatus('Nhấn ▶ để phát âm thanh');
        });
      return;
    }

    this.isPlaying = true;
    this.updatePlayUI();
    this.setStatus('Đang đọc mẫu sơ đồ...');
    this.startDemoLoop();
  };

  NarrationController.prototype.pause = function () {
    this.isPlaying = false;
    if (this.mode === 'audio') {
      this.audio.pause();
    } else {
      this.stopDemoLoop(true);
      this.setStatus('Giọng đọc mẫu (Chờ file Nhóm 3)');
    }
    this.updatePlayUI();
  };

  NarrationController.prototype.playNode = function (index) {
    var clamped = Math.max(0, Math.min(this.nodes.length - 1, index));
    var node = this.nodes[clamped];
    this.activeNodeIndex = clamped;
    if (this.onNodeChange) this.onNodeChange(clamped);

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
  };

  NarrationController.prototype.startDemoLoop = function () {
    var self = this;
    this.stopDemoLoop(false);
    var ratio = this.demoElapsed / this.demoDuration;
    var firstNode = this.syncNodeFromRatio(ratio);
    this.speakNode(firstNode);

    this.demoTimer = setInterval(function () {
      var rate = SPEEDS[self.speedIndex];
      self.demoElapsed += 0.25 * rate;
      if (self.demoElapsed >= self.demoDuration) {
        self.demoElapsed = 0;
        self.pause();
        if (self.seekInput) self.seekInput.value = '0';
        self.updateClockUI(0, self.demoDuration);
        self.syncNodeFromRatio(0);
        return;
      }
      var nextRatio = self.demoElapsed / self.demoDuration;
      if (self.seekInput) self.seekInput.value = String(Math.round(nextRatio * 1000));
      self.updateClockUI(self.demoElapsed, self.demoDuration);
      var nodeIdx = self.syncNodeFromRatio(nextRatio);
      if (nodeIdx !== self.lastSpokenNode) {
        self.speakNode(nodeIdx);
      }
    }, 250);
  };

  NarrationController.prototype.stopDemoLoop = function (cancelSpeech) {
    if (this.demoTimer) {
      clearInterval(this.demoTimer);
      this.demoTimer = null;
    }
    if (cancelSpeech && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  };

  NarrationController.prototype.speakNode = function (index) {
    this.lastSpokenNode = index;
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var node = this.nodes[index];
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
      window.speechSynthesis.speak(utter);
    } catch (e) {}
  };

  NarrationController.prototype.syncNodeFromRatio = function (ratio) {
    var matched = 0;
    for (var i = 0; i < this.nodes.length; i++) {
      if (ratio >= this.nodes[i].startRatio) {
        matched = i;
      }
    }
    if (matched !== this.activeNodeIndex) {
      this.activeNodeIndex = matched;
      if (this.onNodeChange) this.onNodeChange(matched);
    }
    return matched;
  };

  NarrationController.prototype.updateClockUI = function (current, duration) {
    if (this.clockEl) {
      this.clockEl.textContent = formatTime(current) + ' / ' + formatTime(duration);
    }
  };

  NarrationController.prototype.updatePlayUI = function () {
    if (this.playIcon) this.playIcon.textContent = this.isPlaying ? '⏸' : '▶';
  };

  NarrationController.prototype.setStatus = function (text) {
    if (this.statusEl) this.statusEl.textContent = text;
  };

  window.MuoiCuaRung.NarrationController = NarrationController;
})();
