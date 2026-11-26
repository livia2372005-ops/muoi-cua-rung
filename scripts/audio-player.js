window.MuoiCuaRung = window.MuoiCuaRung || {};

(function () {
  var SPEEDS = [0.85, 1.0, 1.15, 1.3];
  var STORAGE_KEY = 'mcr_reading_progress_v1';
  var HAS_WORD_CHAR = /[0-9A-Za-zÀ-ỹ]/;

  function splitSentences(text) {
    var cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned) return [];
    var parts = cleaned.match(/[^.!?…]+[.!?…]*\s*/g);
    if (!parts) return [cleaned];
    return parts.map(function (s) {
      return s.trim();
    }).filter(Boolean);
  }

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    var total = Math.floor(sec);
    var mins = Math.floor(total / 60);
    var secs = total % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function loadProgress() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            completedTracks: parsed.completedTracks && typeof parsed.completedTracks === 'object' ? parsed.completedTracks : {},
            lastTrackId: parsed.lastTrackId || null,
          };
        }
      }
    } catch (e) {}
    return { completedTracks: {}, lastTrackId: null };
  }

  function saveProgress(progress) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {}
  }

  /**
   * deterministically splits all readable words inside a segment element into inline <span class="tts-word">
   * while preserving whitespace, inline tags (<strong>, <em>, <cite>), and CSS ::first-letter drop-caps.
   */
  function wrapSegmentWords(segEl) {
    if (!segEl) return [];
    if (segEl.dataset.wordsWrapped === '1') {
      return Array.from(segEl.querySelectorAll('.tts-word'));
    }

    var textNodes = [];
    var walker = document.createTreeWalker(segEl, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var p = node.parentElement;
      if (p && p.closest('[data-tts-ignore]')) continue;
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      textNodes.push(node);
    }

    var wordIdx = 0;
    var lastBlock = null;

    textNodes.forEach(function (textNode) {
      var parentEl = textNode.parentElement;
      var blockEl = parentEl ? parentEl.closest('p, cite, .station-roman, .station-heading, .station-desc, .stanza-num') || segEl : segEl;
      var parts = textNode.nodeValue.split(/(\s+)/);
      var frag = document.createDocumentFragment();

      for (var i = 0; i < parts.length; i++) {
        var tok = parts[i];
        if (!tok) continue;
        if (/^\s+$/.test(tok)) {
          frag.appendChild(document.createTextNode(tok));
        } else if (HAS_WORD_CHAR.test(tok)) {
          var span = document.createElement('span');
          span.className = 'tts-word';
          span.dataset.w = String(wordIdx++);
          if (blockEl !== lastBlock && wordIdx > 1) {
            span.dataset.blockBreak = '1';
          }
          lastBlock = blockEl;
          span.textContent = tok;
          frag.appendChild(span);
        } else {
          frag.appendChild(document.createTextNode(tok));
        }
      }

      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(frag, textNode);
      }
    });

    segEl.dataset.wordsWrapped = '1';
    return Array.from(segEl.querySelectorAll('.tts-word'));
  }

  /**
   * Exports exact DOM word lists grouped by track and segment for offline TTS timestamp alignment.
   */
  function extractTrackTokens() {
    var result = {};
    var tracks = (window.MuoiCuaRung.DATA && window.MuoiCuaRung.DATA.tracks) || [];
    tracks.forEach(function (tr) {
      var segEls = Array.from(document.querySelectorAll('[data-track-seg="' + tr.id + '"]'));
      result[tr.id] = segEls.map(function (segEl, sIdx) {
        var words = wrapSegmentWords(segEl);
        return {
          segIdx: sIdx,
          segPage: Number(segEl.dataset.segPage) || 0,
          words: words.map(function (w) {
            return {
              text: w.textContent,
              blockBreak: w.dataset.blockBreak === '1',
            };
          }),
        };
      });
    });
    return result;
  }

  function ChapterAudioController(options) {
    this.tracks = options.tracks;
    this.onEnsurePageVisible = options.onEnsurePageVisible;
    this.onPlayStateChange = options.onPlayStateChange;
    this.onSegmentChange = options.onSegmentChange;

    this.trackMap = {};
    this.trackOrder = [];
    for (var i = 0; i < this.tracks.length; i++) {
      this.trackMap[this.tracks[i].id] = this.tracks[i];
      this.trackOrder.push(this.tracks[i].id);
    }

    this.customFiles = {};
    this.resolvedHosted = {};
    this.wordCache = {}; // trackId -> Array<Array<HTMLElement>>

    this.activeTrackId = null;
    this.activeSegIdx = 0;
    this.isPlaying = false;
    this.speedIndex = 1;
    this.autoContinue = true;
    this.mode = 'idle'; // 'audio' | 'tts' | 'timer' | 'idle'
    this.usingTimestamps = false;
    this.hasViVoice = false;
    this.timerId = null;
    this.autoTimerId = null;
    this.syncRafId = null;
    this.ttsToken = 0;

    this.progress = loadProgress();

    this.audio = new Audio();
    this.audio.preload = 'metadata';

    this.footerPill = document.getElementById('footer-audio-pill');
    this.pillPlayBtn = document.getElementById('pill-play-btn');
    this.pillNameEl = document.getElementById('pill-track-name');
    this.pillTimeEl = document.getElementById('pill-time');
    this.pillAutoBtn = document.getElementById('pill-auto-btn');
    this.pillSpeedBtn = document.getElementById('pill-speed-btn');
    this.pillStopBtn = document.getElementById('pill-stop-btn');
    this.pillProgress = document.getElementById('pill-progress');
    this.pillProgressFill = document.getElementById('pill-progress-fill');
    this.modalPlayBtn = document.getElementById('modal-play-btn');
    this.modalStatusEl = document.getElementById('modal-audio-status');

    this.detectVietnameseVoice();
    this.bindEvents();
    this.restoreCompletedVisuals();
    this.updateAllUI();
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

  ChapterAudioController.prototype.getSegments = function (trackId) {
    return Array.from(document.querySelectorAll('[data-track-seg="' + trackId + '"]'));
  };

  ChapterAudioController.prototype.ensureTrackWords = function (trackId) {
    var segs = this.getSegments(trackId);
    if (!this.wordCache[trackId] || this.wordCache[trackId].length !== segs.length) {
      this.wordCache[trackId] = segs.map(function (segEl) {
        return wrapSegmentWords(segEl);
      });
    }
    return { segs: segs, wordsBySeg: this.wordCache[trackId] };
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

    if (this.pillAutoBtn) {
      this.pillAutoBtn.addEventListener('click', function () {
        self.setAutoContinue(!self.autoContinue);
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

    if (this.pillProgress) {
      this.pillProgress.addEventListener('click', function (e) {
        if (self.mode !== 'audio' || !self.audio.duration) return;
        var rect = self.pillProgress.getBoundingClientRect();
        if (rect.width <= 0) return;
        var ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        self.audio.currentTime = ratio * self.audio.duration;
        self.syncAudioFrame(true);
      });
    }

    if (this.modalPlayBtn) {
      this.modalPlayBtn.addEventListener('click', function () {
        self.toggleTrack('tom-tat');
      });
    }

    // Allow clicking any word inside an actively playing chapter to seek directly to that word
    ['mousedown', 'touchstart', 'pointerdown'].forEach(function (evtName) {
      document.addEventListener(evtName, function (e) {
        if (!self.activeTrackId || !self.usingTimestamps) return;
        var wordEl = e.target && e.target.closest ? e.target.closest('.tts-word') : null;
        if (!wordEl) return;
        var segEl = wordEl.closest('[data-track-seg]');
        if (segEl && segEl.dataset.trackSeg === self.activeTrackId) {
          e.stopPropagation();
        }
      }, true);
    });

    document.addEventListener('click', function (e) {
      if (!self.activeTrackId || self.mode !== 'audio' || !self.usingTimestamps) return;
      var wordEl = e.target && e.target.closest ? e.target.closest('.tts-word') : null;
      if (!wordEl) return;
      var segEl = wordEl.closest('[data-track-seg]');
      if (!segEl || segEl.dataset.trackSeg !== self.activeTrackId) return;

      e.stopPropagation();
      var segs = self.getSegments(self.activeTrackId);
      var sIdx = segs.indexOf(segEl);
      var wIdx = Number(wordEl.dataset.w);
      var tsMap = window.MuoiCuaRung.AUDIO_TIMESTAMPS || {};
      var tsTrack = tsMap[self.activeTrackId];
      if (!tsTrack || !tsTrack.segments[sIdx] || !tsTrack.segments[sIdx].words[wIdx]) return;

      var targetTime = tsTrack.segments[sIdx].words[wIdx][0];
      self.audio.currentTime = Math.max(0, targetTime);
      if (!self.isPlaying) {
        self.resume();
      } else {
        self.syncAudioFrame(true);
      }
    }, true);

    this.audio.addEventListener('loadedmetadata', function () {
      self.updateProgressBarUI(self.audio.currentTime, self.audio.duration);
    });

    this.audio.addEventListener('seeked', function () {
      self.syncAudioFrame(true);
    });

    this.audio.addEventListener('timeupdate', function () {
      if (self.mode !== 'audio' || !self.audio.duration) return;
      self.updateProgressBarUI(self.audio.currentTime, self.audio.duration);
      if (!self.usingTimestamps) {
        var segs = self.getSegments(self.activeTrackId);
        if (!segs.length) return;
        var ratio = self.audio.currentTime / self.audio.duration;
        var idx = Math.min(segs.length - 1, Math.floor(ratio * segs.length));
        if (idx !== self.activeSegIdx) {
          self.highlightSegment(self.activeTrackId, idx);
        }
      }
    });

    this.audio.addEventListener('ended', function () {
      self.handleTrackEnded();
    });
  };

  ChapterAudioController.prototype.setAutoContinue = function (val) {
    this.autoContinue = Boolean(val);
    if (this.pillAutoBtn) {
      this.pillAutoBtn.classList.toggle('is-on', this.autoContinue);
      this.pillAutoBtn.setAttribute('aria-pressed', String(this.autoContinue));
    }
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
    this.progress.lastTrackId = trackId;
    saveProgress(this.progress);
    this.updateAllUI();

    if (this.customFiles[trackId]) {
      this.startHtmlAudio(trackId, this.customFiles[trackId].url, true);
      return;
    }

    if (this.resolvedHosted[trackId]) {
      this.startHtmlAudio(trackId, this.resolvedHosted[trackId], false);
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
        self.startHtmlAudio(trackId, foundSrc, false);
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

  ChapterAudioController.prototype.startHtmlAudio = function (trackId, src, isCustom) {
    var tsMap = window.MuoiCuaRung.AUDIO_TIMESTAMPS || {};
    var tsTrack = !isCustom ? tsMap[trackId] : null;
    this.usingTimestamps = Boolean(tsTrack && Array.isArray(tsTrack.segments) && tsTrack.segments.length);
    this.mode = 'audio';

    var pack = this.ensureTrackWords(trackId);
    this.clearTrackWords(pack);

    this.audio.src = src;
    this.audio.playbackRate = SPEEDS[this.speedIndex];
    this.highlightSegment(trackId, this.activeSegIdx);
    this.updateProgressBarUI(0, tsTrack ? tsTrack.duration : 0);

    var self = this;
    this.audio.play().catch(function () {});
    this.startSyncLoop();
    if (!this.usingTimestamps && this.audio.readyState >= 1) {
      self.updateProgressBarUI(self.audio.currentTime, self.audio.duration);
    }
  };

  ChapterAudioController.prototype.startSyncLoop = function () {
    var self = this;
    if (this.syncRafId) window.cancelAnimationFrame(this.syncRafId);

    function step() {
      if (self.mode !== 'audio' || !self.activeTrackId) return;
      if (self.isPlaying) {
        self.syncAudioFrame(false);
        self.syncRafId = window.requestAnimationFrame(step);
      }
    }
    this.syncRafId = window.requestAnimationFrame(step);
  };

  ChapterAudioController.prototype.clearTrackWords = function (pack) {
    if (!pack) return;
    for (var s = 0; s < pack.segs.length; s++) {
      pack.segs[s].classList.remove('is-reading', 'is-seg-done');
      var words = pack.wordsBySeg[s];
      for (var w = 0; w < words.length; w++) {
        words[w].classList.remove('is-read', 'is-current');
      }
    }
  };

  ChapterAudioController.prototype.syncAudioFrame = function (forceAll) {
    if (this.mode !== 'audio' || !this.activeTrackId || !this.usingTimestamps) return;
    var trackId = this.activeTrackId;
    var tsMap = window.MuoiCuaRung.AUDIO_TIMESTAMPS || {};
    var tsTrack = tsMap[trackId];
    if (!tsTrack || !tsTrack.segments || !tsTrack.segments.length) return;

    var dur = Number.isFinite(this.audio.duration) && this.audio.duration > 0
      ? this.audio.duration
      : tsTrack.duration;
    var t = this.audio.currentTime || 0;
    this.updateProgressBarUI(t, dur);

    var segsData = tsTrack.segments;
    var activeIdx = 0;
    for (var s = 0; s < segsData.length; s++) {
      if (segsData[s].start <= t + 0.04) {
        activeIdx = s;
      } else {
        break;
      }
    }

    var pack = this.ensureTrackWords(trackId);
    if (activeIdx !== this.activeSegIdx || forceAll) {
      this.highlightSegment(trackId, activeIdx);
    }

    for (var i = 0; i < pack.segs.length; i++) {
      var segEl = pack.segs[i];
      var wordEls = pack.wordsBySeg[i];
      var sData = segsData[i];
      if (!sData || !wordEls) continue;

      if (i < activeIdx) {
        segEl.classList.remove('is-reading');
        segEl.classList.add('is-seg-done');
        for (var k = 0; k < wordEls.length; k++) {
          wordEls[k].classList.add('is-read');
          wordEls[k].classList.remove('is-current');
        }
      } else if (i > activeIdx) {
        segEl.classList.remove('is-reading', 'is-seg-done');
        for (var m = 0; m < wordEls.length; m++) {
          wordEls[m].classList.remove('is-read', 'is-current');
        }
      } else {
        segEl.classList.remove('is-seg-done');
        segEl.classList.add('is-reading');
        var wTimings = sData.words || [];
        var curW = -1;
        for (var j = 0; j < wTimings.length; j++) {
          if (wTimings[j][0] <= t + 0.03) {
            curW = j;
          } else {
            break;
          }
        }
        var inPause = curW >= 0 && t > wTimings[curW][1] + 0.35;
        for (var w = 0; w < wordEls.length; w++) {
          var we = wordEls[w];
          if (w < curW || (w === curW && inPause)) {
            we.classList.add('is-read');
            we.classList.remove('is-current');
          } else if (w === curW) {
            we.classList.remove('is-read');
            we.classList.add('is-current');
          } else {
            we.classList.remove('is-read', 'is-current');
          }
        }
      }
    }
  };

  ChapterAudioController.prototype.updateProgressBarUI = function (currentSec, totalSec) {
    if (this.pillTimeEl) {
      this.pillTimeEl.textContent = formatTime(currentSec) + ' / ' + formatTime(totalSec);
    }
    var pct = totalSec > 0 ? Math.max(0, Math.min(100, (currentSec / totalSec) * 100)) : 0;
    if (this.pillProgressFill) {
      this.pillProgressFill.style.width = pct.toFixed(1) + '%';
    }
    if (this.pillProgress) {
      this.pillProgress.setAttribute('aria-valuenow', String(Math.round(pct)));
    }
  };

  ChapterAudioController.prototype.handleTrackEnded = function () {
    var finishedId = this.activeTrackId;
    if (finishedId) {
      this.markTrackCompleted(finishedId);
    }
    var nextId = null;
    if (finishedId && this.autoContinue) {
      var idx = this.trackOrder.indexOf(finishedId);
      if (idx >= 0 && idx + 1 < this.trackOrder.length) {
        nextId = this.trackOrder[idx + 1];
      }
    }

    this.stop();
    if (finishedId) {
      this.applyCompletedStateToTrack(finishedId);
    }

    if (nextId) {
      var self = this;
      this.autoTimerId = setTimeout(function () {
        self.playTrack(nextId, 0);
      }, 650);
    }
  };

  ChapterAudioController.prototype.markTrackCompleted = function (trackId) {
    if (!trackId) return;
    this.progress.completedTracks[trackId] = true;
    this.progress.lastTrackId = trackId;
    saveProgress(this.progress);
    this.applyCompletedStateToTrack(trackId);
    this.updateAllUI();
  };

  ChapterAudioController.prototype.applyCompletedStateToTrack = function (trackId) {
    var pack = this.ensureTrackWords(trackId);
    for (var s = 0; s < pack.segs.length; s++) {
      pack.segs[s].classList.remove('is-reading');
      pack.segs[s].classList.add('is-seg-done');
      var words = pack.wordsBySeg[s];
      for (var w = 0; w < words.length; w++) {
        words[w].classList.add('is-read');
        words[w].classList.remove('is-current');
      }
    }
  };

  ChapterAudioController.prototype.restoreCompletedVisuals = function () {
    var self = this;
    var completed = this.progress.completedTracks || {};
    Object.keys(completed).forEach(function (trackId) {
      if (completed[trackId] && self.trackMap[trackId]) {
        self.applyCompletedStateToTrack(trackId);
      }
    });
  };

  ChapterAudioController.prototype.startDomNarration = function (trackId, segIdx) {
    var segs = this.getSegments(trackId);
    if (!segs.length || segIdx >= segs.length) {
      this.markTrackCompleted(trackId);
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
    if (this.syncRafId) {
      window.cancelAnimationFrame(this.syncRafId);
      this.syncRafId = null;
    }
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
      this.startSyncLoop();
    } else {
      this.startDomNarration(this.activeTrackId, this.activeSegIdx);
    }
  };

  ChapterAudioController.prototype.stop = function (silent) {
    this.isPlaying = false;
    this.ttsToken++;
    if (this.autoTimerId) {
      clearTimeout(this.autoTimerId);
      this.autoTimerId = null;
    }
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.syncRafId) {
      window.cancelAnimationFrame(this.syncRafId);
      this.syncRafId = null;
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
    this.usingTimestamps = false;

    if (this.activeTrackId && !this.progress.completedTracks[this.activeTrackId]) {
      this.clearTrackWords(this.ensureTrackWords(this.activeTrackId));
    }
    document.querySelectorAll('.is-reading').forEach(function (el) {
      el.classList.remove('is-reading');
    });
    document.querySelectorAll('.tts-word.is-current').forEach(function (el) {
      el.classList.remove('is-current');
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
    var completed = this.progress.completedTracks || {};

    document.querySelectorAll('[data-play-track]').forEach(function (btn) {
      var tid = btn.dataset.playTrack;
      var isThis = tid === activeId;
      var isThisPlaying = isThis && playing;
      var isDone = Boolean(completed[tid]);
      btn.classList.toggle('is-playing', isThisPlaying);
      btn.classList.toggle('is-completed', isDone && !isThisPlaying);
      var span = btn.querySelector('span');
      var svg = btn.querySelector('svg');
      if (span) {
        if (isThisPlaying) span.textContent = 'Tạm dừng đọc';
        else if (isThis) span.textContent = 'Đọc tiếp';
        else if (isDone) span.textContent = btn.dataset.defaultLabel + ' ✓';
        else span.textContent = btn.dataset.defaultLabel;
      }
      if (svg) {
        svg.innerHTML = isThisPlaying
          ? '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>'
          : '<path d="M7 5.5v13l11-6.5-11-6.5Z" fill="currentColor" stroke="none"/>';
      }
    });

    document.querySelectorAll('.toc-jump[data-track-id]').forEach(function (tocBtn) {
      var isDone = Boolean(completed[tocBtn.dataset.trackId]);
      tocBtn.classList.toggle('is-completed', isDone);
    });

    document.querySelectorAll('.track-row[data-track-row]').forEach(function (row) {
      var isDone = Boolean(completed[row.dataset.trackRow]);
      row.classList.toggle('is-completed', isDone);
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
      this.modalPlayBtn.textContent = isMapPlaying ? '⏸ Tạm dừng tóm tắt' : '▶ Nghe tóm tắt 5 chương';
    }

    if (this.modalStatusEl) {
      this.modalStatusEl.textContent = track
        ? (playing ? 'Đang đọc: ' : 'Tạm dừng: ') + track.shortTitle
        : 'Bấm vào từng chương để nghe giọng đọc hoặc lật tới trang tương ứng';
    }

    if (this.onPlayStateChange) {
      this.onPlayStateChange(playing);
    }
  };

  window.MuoiCuaRung.ChapterAudioController = ChapterAudioController;
  window.MuoiCuaRung.extractTrackTokens = extractTrackTokens;
})();
