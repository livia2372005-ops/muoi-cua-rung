window.MuoiCuaRung = window.MuoiCuaRung || {};

/**
 * Streams the bundled lo-fi background mix (./audio/lofi-bgm.mp3) on demand
 * with smooth fade-in/out and automatic volume ducking during chapter narration.
 * Works identically on file:// and https:// (GitHub Pages + mobile browsers).
 */
(function () {
  var AUDIO_SRC = './audio/lofi-bgm.mp3';
  var BASE_VOLUME = 0.28;
  var DUCKED_VOLUME = 0.075;

  function LofiPlayer() {
    this.audio = new Audio();
    this.audio.preload = 'none';
    this.audio.loop = true;
    this.audio.src = AUDIO_SRC;

    this.ctx = null;
    this.gainNode = null;
    this.useWebAudioGain = false;

    this.playing = false;
    this.ducked = false;
    this.currentVol = 0;
    this.fadeRaf = null;
  }

  LofiPlayer.prototype.ensureGainGraph = function () {
    // Avoid createMediaElementSource on file:// where Chromium treats local files as opaque origins
    if (this.ctx || window.location.protocol === 'file:') return;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      this.ctx = new Ctx();
      var srcNode = this.ctx.createMediaElementSource(this.audio);
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0;
      srcNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      this.audio.volume = 1;
      this.useWebAudioGain = true;
    } catch (e) {
      this.useWebAudioGain = false;
    }
  };

  LofiPlayer.prototype.rampTo = function (targetVol, durationMs, pauseAtZero) {
    var self = this;
    if (this.fadeRaf) {
      window.cancelAnimationFrame(this.fadeRaf);
      this.fadeRaf = null;
    }

    if (this.useWebAudioGain && this.ctx && this.gainNode) {
      var now = this.ctx.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.linearRampToValueAtTime(targetVol, now + durationMs / 1000);
      this.currentVol = targetVol;
      if (pauseAtZero && targetVol === 0) {
        setTimeout(function () {
          if (!self.playing) self.audio.pause();
        }, durationMs + 30);
      }
      return;
    }

    var startVol = this.currentVol;
    var startTime = performance.now();
    function tick(nowMs) {
      var t = Math.min(1, (nowMs - startTime) / Math.max(1, durationMs));
      var v = startVol + (targetVol - startVol) * t;
      self.currentVol = v;
      try {
        self.audio.volume = Math.max(0, Math.min(1, v));
      } catch (e) {}
      if (t < 1) {
        self.fadeRaf = window.requestAnimationFrame(tick);
      } else {
        self.fadeRaf = null;
        if (pauseAtZero && targetVol === 0 && !self.playing) {
          self.audio.pause();
        }
      }
    }
    this.fadeRaf = window.requestAnimationFrame(tick);
  };

  LofiPlayer.prototype.targetVolume = function () {
    if (!this.playing) return 0;
    return this.ducked ? DUCKED_VOLUME : BASE_VOLUME;
  };

  LofiPlayer.prototype.start = function () {
    this.ensureGainGraph();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(function () {});
    }
    if (!this.useWebAudioGain) {
      try {
        this.audio.volume = Math.max(0, Math.min(1, this.currentVol));
      } catch (e) {}
    }
    this.playing = true;
    var self = this;
    var playPromise = this.audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        self.playing = false;
      });
    }
    this.rampTo(this.targetVolume(), 450, false);
    return true;
  };

  LofiPlayer.prototype.stop = function () {
    if (!this.playing) return;
    this.playing = false;
    this.rampTo(0, 300, true);
  };

  LofiPlayer.prototype.toggle = function () {
    if (this.playing) this.stop();
    else this.start();
    return this.playing;
  };

  LofiPlayer.prototype.setDucked = function (flag) {
    this.ducked = Boolean(flag);
    if (this.playing) {
      this.rampTo(this.targetVolume(), 380, false);
    }
  };

  window.MuoiCuaRung.LofiPlayer = LofiPlayer;
})();
