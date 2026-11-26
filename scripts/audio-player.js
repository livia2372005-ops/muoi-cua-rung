window.MuoiCuaRung = window.MuoiCuaRung || {};

(function () {
  var SPEEDS = [0.85, 1.0, 1.15, 1.3];

  function splitSentences(text) {
    var cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned) return [];
    var parts = cleaned.match(/[^.!?…]+[.!?…]*\s*/g);
    if (!parts) return [cleaned];
    return parts.map(function (s) {
      return s.trim();
    }).filter(Boolean);
  }

  function ChapterAudioController(options) {
    this.tracks = options.tracks;
    this.onEnsurePageVisible = options.onEnsurePageVisible;
    this.onPlayStateChange = options.onPlayStateChange;
    this.onSegmentChange = options.onSegmentChange;

    this.trackMap = {};
    for (var i = 0; i < this.tracks.length; i++) {
      this.trackMap[this.tracks[i].id] = this.tracks[i];
    }

    this.customFiles = {}; // trackId -> { url, name }
    this.resolvedHosted = {}; // trackId -> string | false

    this.activeTrackId = null;
    this.activeSegIdx = 0;
    this.isPlaying = false;
    this.speedIndex = 1;
    this.mode = 'idle'; // 'audio' | 'tts' | 'timer' | 'idle'
    this.hasViVoice = false;
    this.timerId = null;
    this.ttsToken = 0;

    this.audio = new Audio();
    this.audio.preload = 'metadata';

    this.footerPill = document.getElementById('footer-audio-pill');
    this.pillPlayBtn = document.getElementById('pill-play-btn');
    this.pillNameEl = document.getElementById('pill-track-name');
    this.pillSpeedBtn = document.getElementById('pill-speed-btn');
    this.pillStopBtn = document.getElementById('pill-stop-btn');
    this.modalPlayBtn = document.getElementById('modal-play-btn');
    this.modalStatusEl = document.getElementById('modal-audio-status');

    this.detectVietnameseVoice();
    this.bindEvents();
  }

  ChapterAudioController.prototype.detectVietnameseVoice = function () {
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

  ChapterAudioController.prototype.bindEvents = function () {
    var self = this;

    document.querySelectorAll('[data-play-track]').forEach(function (btn) {
      if (!btn.dataset.defaultLabel) {
        var span = btn.querySelector('span');
        btn.dataset.defaultLabel = span ? span.textContent : btn.textContent;
      }
      btn.addEventListener('click', function () {
        self.toggleTrack(btn.dataset.playTrack);
      });
    });

    if (this.pillPlayBtn) {
      this.pillPlayBtn.addEventListener('click', function () {
        if (self.isPlaying) self.pause();
        else if (self.activeTrackId) self.resume();
      });
    }

    if (this.pillStopBtn) {
      this.pillStopBtn.addEventListener('click', function () {
        self.stop();
      });
    }

    if (this.pillSpeedBtn) {
      this.pillSpeedBtn.addEventListener('click', function () {
        self.speedIndex = (self.speedIndex + 1) % SPEEDS.length;
        var rate = SPEEDS[self.speedIndex];
        self.audio.playbackRate = rate;
        self.pillSpeedBtn.textContent = (rate === 1 ? '1' : String(rate)) + 'x';
      });
    }

    if (this.modalPlayBtn) {
      this.modalPlayBtn.addEventListener('click', function () {
        self.toggleTrack('tom-tat');
      });
    }

    this.audio.addEventListener('timeupdate', function () {
      if (self.mode !== 'audio' || !self.audio.duration || self.activeTrackId !== 'tom-tat') return;
      var segs = self.getSegments('tom-tat');
      if (!segs.length) return;
      var ratio = self.audio.currentTime / self.audio.duration;
      var idx = Math.min(segs.length - 1, Math.floor(ratio * segs.length));
      if (idx !== self.activeSegIdx) {
        self.highlightSegment('tom-tat', idx);
      }
    });

    this.audio.addEventListener('ended', function () {
      self.stop();
    });
  };

  ChapterAudioController.prototype.getSegments = function (trackId) {
    return Array.from(document.querySelectorAll('[data-track-seg="' + trackId + '"]'));
  };

  ChapterAudioController.prototype.setCustomFile = function (trackId, file) {
    if (this.customFiles[trackId]) {
      URL.revokeObjectURL(this.customFiles[trackId].url);
    }
    this.customFiles[trackId] = {
      url: URL.createObjectURL(file),
      name: file.name,
    };
    this.playTrack(trackId, 0);
  };

  ChapterAudioController.prototype.toggleTrack = function (trackId) {
    if (this.activeTrackId === trackId) {
      if (this.isPlaying) this.pause();
      else this.resume();
    } else {
      this.playTrack(trackId, 0);
    }
  };

  ChapterAudioController.prototype.playTrack = function (trackId, startSegIdx) {
    var self = this;
    var track = this.trackMap[trackId];
    if (!track) return;

    this.stop(true);
    this.activeTrackId = trackId;
    this.activeSegIdx = startSegIdx || 0;
    this.isPlaying = true;
    this.updateAllUI();

    if (this.customFiles[trackId]) {
      this.startHtmlAudio(trackId, this.customFiles[trackId].url);
      return;
    }

    // Check cache or lazily probe ./audio/<trackId>.mp3 / .m4a on demand
    if (this.resolvedHosted[trackId]) {
      this.startHtmlAudio(trackId, this.resolvedHosted[trackId]);
      return;
    }

    if (this.resolvedHosted[trackId] === false) {
      this.startDomNarration(trackId, this.activeSegIdx);
      return;
    }

    this.probeTrackFiles(trackId, 0, function (foundSrc) {
      if (!self.isPlaying || self.activeTrackId !== trackId) return;
      if (foundSrc) {
        self.resolvedHosted[trackId] = foundSrc;
        self.startHtmlAudio(trackId, foundSrc);
      } else {
        self.resolvedHosted[trackId] = false;
        self.startDomNarration(trackId, self.activeSegIdx);
      }
    });
  };

  ChapterAudioController.prototype.probeTrackFiles = function (trackId, idx, cb) {
    var track = this.trackMap[trackId];
    if (!track || idx >= track.audioCandidates.length) {
      cb(null);
      return;
    }
    var self = this;
    var testAudio = new Audio();
    var src = track.audioCandidates[idx];
    var done = false;

    function finish(ok) {
      if (done) return;
      done = true;
      testAudio.removeEventListener('loadedmetadata', onOk);
      testAudio.removeEventListener('error', onErr);
      if (ok) cb(src);
      else self.probeTrackFiles(trackId, idx + 1, cb);
    }
    function onOk() { finish(true); }
    function onErr() { finish(false); }

    testAudio.preload = 'metadata';
    testAudio.addEventListener('loadedmetadata', onOk);
    testAudio.addEventListener('error', onErr);
    testAudio.src = src;
  };

  ChapterAudioController.prototype.startHtmlAudio = function (trackId, src) {
    this.mode = 'audio';
    this.audio.src = src;
    this.audio.playbackRate = SPEEDS[this.speedIndex];
    this.highlightSegment(trackId, this.activeSegIdx);
    this.audio.play().catch(function () {});
  };

  ChapterAudioController.prototype.startDomNarration = function (trackId, segIdx) {
    var segs = this.getSegments(trackId);
    if (!segs.length || segIdx >= segs.length) {
      this.stop();
      return;
    }

    this.highlightSegment(trackId, segIdx);
    var segEl = segs[segIdx];
    var text = segEl.innerText.replace(/\s+/g, ' ').trim();

    if (this.hasViVoice && 'speechSynthesis' in window) {
      this.mode = 'tts';
      this.speakSentences(trackId, segIdx, splitSentences(text), 0, ++this.ttsToken);
    } else {
      this.mode = 'timer';
      this.startSegmentTimer(trackId, segIdx, text.length);
    }
  };

  ChapterAudioController.prototype.speakSentences = function (trackId, segIdx, sentences, sIdx, token) {
    var self = this;
    if (!this.isPlaying || token !== this.ttsToken) return;
    if (sIdx >= sentences.length) {
      this.startDomNarration(trackId, segIdx + 1);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      var utter = new SpeechSynthesisUtterance(sentences[sIdx]);
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
        if (!self.isPlaying || token !== self.ttsToken) return;
        self.speakSentences(trackId, segIdx, sentences, sIdx + 1, token);
      };
      utter.onerror = function () {
        if (!self.isPlaying || token !== self.ttsToken) return;
        self.startSegmentTimer(trackId, segIdx, sentences.join(' ').length);
      };
      window.speechSynthesis.speak(utter);
    } catch (e) {
      this.startSegmentTimer(trackId, segIdx, sentences.join(' ').length);
    }
  };

  ChapterAudioController.prototype.startSegmentTimer = function (trackId, segIdx, charCount) {
    var self = this;
    if (this.timerId) clearTimeout(this.timerId);
    var rate = SPEEDS[this.speedIndex];
    var durationMs = Math.max(3600, Math.round((charCount * 54) / rate));
    this.timerId = setTimeout(function () {
      if (!self.isPlaying || self.activeTrackId !== trackId) return;
      self.startDomNarration(trackId, segIdx + 1);
    }, durationMs);
  };

  ChapterAudioController.prototype.highlightSegment = function (trackId, segIdx) {
    this.activeSegIdx = segIdx;
    document.querySelectorAll('.is-reading').forEach(function (el) {
      el.classList.remove('is-reading');
    });

    var segs = this.getSegments(trackId);
    var target = segs[segIdx];
    if (target) {
      target.classList.add('is-reading');
      var targetPage = Number(target.dataset.segPage);
      if (Number.isFinite(targetPage) && this.onEnsurePageVisible) {
        this.onEnsurePageVisible(targetPage);
      }
    }

    if (this.onSegmentChange) {
      this.onSegmentChange(trackId, segIdx);
    }
  };

  ChapterAudioController.prototype.pause = function () {
    this.isPlaying = false;
    this.ttsToken++;
    if (this.mode === 'audio') {
      this.audio.pause();
    } else {
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    }
    this.updateAllUI();
  };

  ChapterAudioController.prototype.resume = function () {
    if (!this.activeTrackId) return;
    this.isPlaying = true;
    this.updateAllUI();
    if (this.mode === 'audio') {
      this.audio.play().catch(function () {});
    } else {
      this.startDomNarration(this.activeTrackId, this.activeSegIdx);
    }
  };

  ChapterAudioController.prototype.stop = function (silent) {
    this.isPlaying = false;
    this.ttsToken++;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.mode === 'audio') {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.mode = 'idle';
    document.querySelectorAll('.is-reading').forEach(function (el) {
      el.classList.remove('is-reading');
    });

    if (!silent) {
      this.activeTrackId = null;
      this.activeSegIdx = 0;
      this.updateAllUI();
    }
  };

  ChapterAudioController.prototype.updateAllUI = function () {
    var activeId = this.activeTrackId;
    var playing = this.isPlaying;
    var track = activeId ? this.trackMap[activeId] : null;

    document.querySelectorAll('[data-play-track]').forEach(function (btn) {
      var isThis = btn.dataset.playTrack === activeId;
      var isThisPlaying = isThis && playing;
      btn.classList.toggle('is-playing', isThisPlaying);
      var span = btn.querySelector('span');
      var svg = btn.querySelector('svg');
      if (span) {
        if (isThisPlaying) span.textContent = 'Tạm dừng đọc';
        else if (isThis) span.textContent = 'Đọc tiếp';
        else span.textContent = btn.dataset.defaultLabel;
      }
      if (svg) {
        svg.innerHTML = isThisPlaying
          ? '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>'
          : '<path d="M7 5.5v13l11-6.5-11-6.5Z" fill="currentColor" stroke="none"/>';
      }
    });

    if (this.footerPill) {
      this.footerPill.hidden = !track;
      if (track) {
        if (this.pillNameEl) {
          this.pillNameEl.textContent = (playing ? 'Đang đọc: ' : 'Tạm dừng: ') + track.shortTitle;
        }
        if (this.pillPlayBtn) {
          this.pillPlayBtn.textContent = playing ? '⏸' : '▶';
        }
      }
    }

    if (this.modalPlayBtn) {
      var isMapPlaying = activeId === 'tom-tat' && playing;
      this.modalPlayBtn.textContent = isMapPlaying ? '⏸ Tạm dừng tóm tắt' : '▶ Nghe tóm tắt 5 chặng';
    }

    if (this.modalStatusEl) {
      this.modalStatusEl.textContent = track
        ? (playing ? 'Đang đọc: ' : 'Tạm dừng: ') + track.shortTitle
        : 'Bấm vào từng chặng để nghe giọng đọc hoặc lật tới chương tương ứng';
    }

    if (this.onPlayStateChange) {
      this.onPlayStateChange(playing);
    }
  };

  window.MuoiCuaRung.ChapterAudioController = ChapterAudioController;
})();
