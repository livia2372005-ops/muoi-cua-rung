window.MuoiCuaRung = window.MuoiCuaRung || {};

(function () {
  var MAX_PX = 14;
  var MAX_PY = 9;

  /**
   * Drives smooth 2.5D multi-layer parallax across all illustrated spreads via CSS variables (--px, --py).
   */
  function BookParallaxController(options) {
    this.stage = (options && options.targetEl) || document.documentElement;
    this.getIsFlipping = (options && options.getIsFlipping) || function () { return false; };
    this.targetX = 0;
    this.targetY = 0;
    this.curX = 0;
    this.curY = 0;
    this.lastOutX = null;
    this.lastOutY = null;
    this.pointerActive = false;
    this.lastPointerMs = 0;
    this.baseBeta = null;
    this.baseGamma = null;
    this.rafId = null;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.bindEvents();
    this.startLoop();
  }

  BookParallaxController.prototype.bindEvents = function () {
    var self = this;

    function updateFromClient(clientX, clientY) {
      var vw = Math.max(1, window.innerWidth);
      var vh = Math.max(1, window.innerHeight);
      var nx = ((clientX / vw) - 0.5) * 2;
      var ny = ((clientY / vh) - 0.5) * 2;
      self.targetX = Math.max(-1, Math.min(1, nx));
      self.targetY = Math.max(-1, Math.min(1, ny));
      self.pointerActive = true;
      self.lastPointerMs = performance.now();
    }

    window.addEventListener('pointermove', function (e) {
      if (document.body.dataset.scene !== 'reading') return;
      updateFromClient(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      if (document.body.dataset.scene !== 'reading') return;
      if (e.touches && e.touches[0]) {
        updateFromClient(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('pointerleave', function () {
      self.pointerActive = false;
    });

    window.addEventListener('deviceorientation', function (e) {
      if (document.body.dataset.scene !== 'reading') return;
      if (e.beta === null || e.gamma === null) return;
      if (self.baseBeta === null) self.baseBeta = e.beta;
      if (self.baseGamma === null) self.baseGamma = e.gamma;
      var dx = Math.max(-1, Math.min(1, (e.gamma - self.baseGamma) / 18));
      var dy = Math.max(-1, Math.min(1, (e.beta - self.baseBeta) / 18));
      if (Math.abs(dx) > 0.04 || Math.abs(dy) > 0.04) {
        self.targetX = dx;
        self.targetY = dy;
        self.lastPointerMs = performance.now();
      }
    }, { passive: true });
  };

  BookParallaxController.prototype.startLoop = function () {
    var self = this;
    var startMs = performance.now();

    function frame(now) {
      self.rafId = window.requestAnimationFrame(frame);

      if (document.body.dataset.scene !== 'reading') {
        if (Math.abs(self.curX) > 0.05 || Math.abs(self.curY) > 0.05) {
          self.curX = 0;
          self.curY = 0;
          self.stage.style.setProperty('--px', '0px');
          self.stage.style.setProperty('--py', '0px');
        }
        return;
      }

      var elapsed = (now - startMs) / 1000;
      var flipping = self.getIsFlipping();

      // Gentle ambient figure-8 living illustration drift
      var ambX = Math.sin(elapsed * 0.68) * 0.28;
      var ambY = Math.cos(elapsed * 0.46) * 0.22;

      var pointerWeight = 1;
      if (now - self.lastPointerMs > 4500 && !self.pointerActive) {
        pointerWeight = 0;
      }

      var goalX = flipping ? 0 : (self.targetX * pointerWeight * 0.85 + ambX) * MAX_PX;
      var goalY = flipping ? 0 : (self.targetY * pointerWeight * 0.85 + ambY) * MAX_PY;

      var rate = flipping ? 0.22 : 0.085;
      self.curX += (goalX - self.curX) * rate;
      self.curY += (goalY - self.curY) * rate;

      var outX = Math.round(self.curX * 50) / 50;
      var outY = Math.round(self.curY * 50) / 50;
      if (outX !== self.lastOutX) {
        self.lastOutX = outX;
        self.stage.style.setProperty('--px', outX.toFixed(2) + 'px');
      }
      if (outY !== self.lastOutY) {
        self.lastOutY = outY;
        self.stage.style.setProperty('--py', outY.toFixed(2) + 'px');
      }
    }

    this.rafId = window.requestAnimationFrame(frame);
  };

  window.MuoiCuaRung.BookParallaxController = BookParallaxController;
})();
