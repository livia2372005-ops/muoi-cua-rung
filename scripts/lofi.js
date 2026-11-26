window.MuoiCuaRung = window.MuoiCuaRung || {};

/**
 * Procedural lo-fi background loop built entirely with the Web Audio API
 * (no audio files, no licensing, identical on file:// and GitHub Pages).
 */
(function () {
  var BPM = 70;
  var STEP = 60 / BPM / 2; // eighth note
  var BASE_VOLUME = 0.22;
  var DUCKED_VOLUME = 0.065;

  // Fmaj9 - Em7 - Dm9 - Cmaj7, two bars each (eighth-note grid, 16 steps per chord)
  var CHORDS = [
    { root: 41, notes: [57, 60, 64, 67] },
    { root: 40, notes: [55, 59, 62, 67] },
    { root: 38, notes: [57, 60, 64, 65] },
    { root: 36, notes: [55, 59, 64, 67] },
  ];
  var MELODY = [76, null, 79, null, 77, null, null, 74, 72, null, null, 76, null, 74, null, null];

  function mtof(n) {
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  function LofiPlayer() {
    this.ctx = null;
    this.master = null;
    this.bus = null;
    this.noiseBuf = null;
    this.timer = null;
    this.nextTime = 0;
    this.step = 0;
    this.playing = false;
    this.ducked = false;
  }

  LofiPlayer.prototype.init = function () {
    if (this.ctx) return true;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    this.ctx = new Ctx();
    var ctx = this.ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2050;
    lp.Q.value = 0.35;
    lp.connect(this.master);

    // soft tape-style echo
    var delay = ctx.createDelay(1);
    delay.delayTime.value = STEP * 3;
    var fb = ctx.createGain();
    fb.gain.value = 0.28;
    var wet = ctx.createGain();
    wet.gain.value = 0.32;
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(lp);

    this.bus = ctx.createGain();
    this.bus.gain.value = 1;
    this.bus.connect(lp);
    this.bus.connect(delay);

    var len = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = this.noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return true;
  };

  LofiPlayer.prototype.tone = function (freq, t, dur, vol, type) {
    var ctx = this.ctx;
    var o1 = ctx.createOscillator();
    var o2 = ctx.createOscillator();
    o1.type = type || 'triangle';
    o2.type = 'sine';
    o1.frequency.value = freq;
    o2.frequency.value = freq * 2.003;
    o1.detune.value = (Math.random() - 0.5) * 12;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(vol * 0.35, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var g2 = ctx.createGain();
    g2.gain.value = 0.28;
    o1.connect(g);
    o2.connect(g2);
    g2.connect(g);
    g.connect(this.bus);
    o1.start(t);
    o2.start(t);
    o1.stop(t + dur + 0.05);
    o2.stop(t + dur + 0.05);
  };

  LofiPlayer.prototype.kick = function (t) {
    var ctx = this.ctx;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.frequency.setValueAtTime(112, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(0.32, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    o.connect(g);
    g.connect(this.bus);
    o.start(t);
    o.stop(t + 0.3);
  };

  LofiPlayer.prototype.noiseHit = function (t, dur, vol, hp, lpHz) {
    var ctx = this.ctx;
    var src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    var f = ctx.createBiquadFilter();
    f.type = hp ? 'highpass' : 'bandpass';
    f.frequency.value = hp || lpHz || 1800;
    var g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.bus);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.02);
  };

  LofiPlayer.prototype.scheduleStep = function (s, t) {
    var chord = CHORDS[Math.floor(s / 16) % CHORDS.length];
    var pos = s % 16;

    if (pos === 0) {
      for (var i = 0; i < chord.notes.length; i++) {
        this.tone(mtof(chord.notes[i]), t + i * 0.022, STEP * 7.6, 0.095, 'triangle');
      }
    }
    if (pos === 10) {
      for (var j = 1; j < chord.notes.length; j++) {
        this.tone(mtof(chord.notes[j]), t + j * 0.016, STEP * 4.6, 0.06, 'triangle');
      }
    }
    if (pos === 0 || pos === 7 || pos === 10) {
      this.tone(mtof(chord.root), t, STEP * (pos === 7 ? 2.5 : 4), 0.15, 'sine');
    }
    var m = MELODY[pos];
    if (m && (Math.floor(s / 16) % 2 === 1 || pos % 8 === 2)) {
      var shift = chord.root === 41 || chord.root === 36 ? 0 : -2;
      this.tone(mtof(m + shift), t, STEP * 2.8, 0.052, 'sine');
    }

    if (pos === 0 || pos === 6 || pos === 10) this.kick(t);
    if (pos === 4 || pos === 12) this.noiseHit(t, 0.15, 0.11, 0, 1550);
    if (pos % 2 === 0) this.noiseHit(t, 0.038, pos % 4 === 0 ? 0.036 : 0.022, 7400);
    if (Math.random() < 0.25) this.noiseHit(t + Math.random() * STEP, 0.01, 0.016, 3600);
  };

  LofiPlayer.prototype.pump = function () {
    if (!this.playing) return;
    var ctx = this.ctx;
    while (this.nextTime < ctx.currentTime + 0.35) {
      var swing = this.step % 2 === 1 ? STEP * 0.14 : 0;
      this.scheduleStep(this.step, this.nextTime + swing);
      this.nextTime += STEP;
      this.step = (this.step + 1) % (CHORDS.length * 16);
    }
  };

  LofiPlayer.prototype.applyVolume = function () {
    if (!this.ctx) return;
    var now = this.ctx.currentTime;
    var target = this.playing ? (this.ducked ? DUCKED_VOLUME : BASE_VOLUME) : 0;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(target, now, this.playing ? 0.35 : 0.2);
  };

  LofiPlayer.prototype.start = function () {
    if (!this.init()) return false;
    var self = this;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.playing) return true;
    this.playing = true;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.step = 0;
    this.pump();
    this.timer = setInterval(function () { self.pump(); }, 120);
    this.applyVolume();
    return true;
  };

  LofiPlayer.prototype.stop = function () {
    if (!this.playing) return;
    this.playing = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.applyVolume();
  };

  LofiPlayer.prototype.toggle = function () {
    if (this.playing) this.stop();
    else if (!this.start()) return false;
    return this.playing;
  };

  LofiPlayer.prototype.setDucked = function (flag) {
    this.ducked = Boolean(flag);
    this.applyVolume();
  };

  window.MuoiCuaRung.LofiPlayer = LofiPlayer;
})();
