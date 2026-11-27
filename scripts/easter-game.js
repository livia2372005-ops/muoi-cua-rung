window.MuoiCuaRung = window.MuoiCuaRung || {};

/**
 * "Muối Của Rừng — Hõm Chết 1986" Side-Scrolling Pixel Mini-Game Engine
 * Triggered from the Back Cover glitch anomaly on Page 22.
 */
(function () {
  var PIXELS_PER_METER = 10;
  var GOAL_METERS = 600;
  var GOAL_WORLD_X = GOAL_METERS * PIXELS_PER_METER; // 6000px
  var GRAVITY = 1580;
  var MOVE_SPEED = 245;
  var JUMP_VEL = -565;
  var DASH_SPEED = 590;
  var DASH_DURATION = 0.21;
  var DASH_COOLDOWN = 1.35;

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function ForestEasterGame() {
    this.overlay = document.getElementById('easter-game-overlay');
    this.canvas = document.getElementById('pixel-game-canvas');
    if (!this.overlay || !this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.npcCtrl = window.MuoiCuaRung.EasterNpcController
      ? new window.MuoiCuaRung.EasterNpcController()
      : null;
    this.sfx = window.MuoiCuaRung.PixelSfx
      ? new window.MuoiCuaRung.PixelSfx()
      : null;
    this.sprites = null;

    // HUD refs
    this.elScore = document.getElementById('pg-score');
    this.elDist = document.getElementById('pg-dist');
    this.elCoins = document.getElementById('pg-coins');
    this.elMonkeys = document.getElementById('pg-monkeys');
    this.elHpText = document.getElementById('pg-hp-text');
    this.elHpFill = document.getElementById('pg-hp-fill');
    this.elDashFill = document.getElementById('pg-dash-fill');
    this.elCombo = document.getElementById('pg-combo');
    this.elMult = document.getElementById('pg-mult');
    this.elDashStatus = document.getElementById('pg-dash-status');

    // Dialogue modal refs
    this.npcModal = document.getElementById('pg-npc-modal');
    this.npcPortrait = document.getElementById('pg-npc-portrait');
    this.npcName = document.getElementById('pg-npc-name');
    this.npcRole = document.getElementById('pg-npc-role');
    this.npcSpeech = document.getElementById('pg-npc-speech');
    this.npcChips = document.getElementById('pg-npc-chips');
    this.npcForm = document.getElementById('pg-npc-form');
    this.npcInput = document.getElementById('pg-npc-input');
    this.npcSend = document.getElementById('pg-npc-send');

    // Banner modal refs
    this.bannerModal = document.getElementById('pg-banner-modal');
    this.bannerTitle = document.getElementById('pg-banner-title');
    this.bannerDesc = document.getElementById('pg-banner-desc');
    this.btnEndless = document.getElementById('pg-btn-endless');

    this.active = false;
    this.pausedForModal = false;
    this.activeNpc = null;
    this.nearbyNpc = null;
    this.rafId = null;
    this.lastTs = 0;
    this.animClock = 0;

    this.keys = { left: false, right: false };
    this.viewW = 960;
    this.viewH = 540;
    this.groundY = 430;

    this.bindEvents();
  }

  ForestEasterGame.prototype.ensureSprites = function () {
    if (!this.sprites && window.MuoiCuaRung.buildEasterSprites) {
      this.sprites = window.MuoiCuaRung.buildEasterSprites();
    }
  };

  ForestEasterGame.prototype.resize = function () {
    // Render on crisp internal low-res pixel canvas (height ~360px) scaled up with nearest-neighbor!
    var vw = Math.max(320, window.innerWidth);
    var vh = Math.max(260, window.innerHeight);
    var targetH = 340;
    var targetW = Math.round((vw / vh) * targetH);
    this.viewW = clamp(targetW, 280, 780);
    this.viewH = targetH;
    this.canvas.width = this.viewW;
    this.canvas.height = this.viewH;
    this.ctx.imageSmoothingEnabled = false;
    this.groundY = this.viewH - 54;
  };

  ForestEasterGame.prototype.resetWorld = function () {
    this.ensureSprites();
    if (this.npcCtrl) this.npcCtrl.resetSession();

    this.player = {
      x: 110,
      y: this.groundY - 62,
      vx: 0,
      vy: 0,
      w: 32,
      h: 58,
      facing: 1,
      onGround: false,
      jumpsLeft: 2,
      dashTimer: 0,
      dashCd: 0,
      invuln: 0,
      flowerBuff: 0,
      trail: []
    };

    this.score = 0;
    this.coins = 0;
    this.monkeysSaved = 0;
    this.totalMonkeys = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.combo = 0;
    this.comboTimer = 0;
    this.maxDist = 0;
    this.victoryShown = false;
    this.endlessMode = false;
    this.generatedUntilX = 0;

    this.pits = [];
    this.coinsList = [];
    this.monkeysList = [];
    this.hazards = [];
    this.items = [];
    this.trees = [];
    this.particles = [];
    this.popups = [];
    this.npcs = this.npcCtrl ? this.npcCtrl.getNpcs() : [];

    // Seed initial trees from 0..240
    this.trees.push({ x: 45, scale: 1.4 }, { x: 215, scale: 1.25 });
    this.extendWorldTo(GOAL_WORLD_X + 600);
    this.totalMonkeys = this.monkeysList.length;

    this.camX = 0;
    this.pausedForModal = false;
    this.activeNpc = null;
    if (this.npcModal) this.npcModal.hidden = true;
    if (this.bannerModal) this.bannerModal.hidden = true;
    this.syncHud();
  };

  ForestEasterGame.prototype.isNearNpcClearing = function (wx) {
    for (var i = 0; i < this.npcs.length; i++) {
      if (Math.abs(wx - this.npcs[i].worldX) < 155) return true;
    }
    if (Math.abs(wx - GOAL_WORLD_X) < 190) return true;
    return false;
  };

  ForestEasterGame.prototype.extendWorldTo = function (targetX) {
    var x = Math.max(280, this.generatedUntilX);
    var chunkIdx = Math.floor(x / 320);

    while (x < targetX) {
      chunkIdx++;
      // Background pixel trees along the trail
      this.trees.push({
        x: x + 30 + ((chunkIdx * 53) % 95),
        scale: 1.2 + ((chunkIdx * 17) % 4) * 0.14
      });
      if (chunkIdx % 2 === 0) {
        this.trees.push({
          x: x + 190 + ((chunkIdx * 29) % 70),
          scale: 1.15 + ((chunkIdx * 11) % 3) * 0.15
        });
      }

      if (this.isNearNpcClearing(x + 140)) {
        // Gentle coin trail leading to NPC clearing
        for (var c0 = 0; c0 < 4; c0++) {
          this.coinsList.push({ x: x + 35 + c0 * 34, y: this.groundY - 30, taken: false });
        }
        x += 290;
        continue;
      }

      var pat = chunkIdx % 5;
      if (pat === 0) {
        // Bramble bush + overhead coin arc
        this.hazards.push({ type: 'thorns', x: x + 120, y: this.groundY - 18, w: 40, h: 18, dmg: 16 });
        for (var i = 0; i < 5; i++) {
          var arc = Math.sin((i / 4) * Math.PI) * 56;
          this.coinsList.push({ x: x + 76 + i * 26, y: this.groundY - 34 - arc, taken: false });
        }
      } else if (pat === 1) {
        // Hõm Chết chasm pit + trapped monkey right after!
        var pitW = x > 2000 ? 78 : 64;
        this.pits.push({ x: x + 95, w: pitW });
        for (var j = 0; j < 4; j++) {
          this.coinsList.push({ x: x + 88 + j * 24, y: this.groundY - 76 - (j === 1 || j === 2 ? 14 : 0), taken: false });
        }
        this.monkeysList.push({ x: x + 95 + pitW + 46, y: this.groundY - 38, saved: false });
      } else if (pat === 2) {
        // Rolling limestone boulder + herb or flower pickup
        this.hazards.push({
          type: 'boulder',
          x: x + 190,
          baseX: x + 190,
          y: this.groundY - 30,
          w: 30,
          h: 30,
          vx: -62,
          range: 95,
          dmg: 20,
          rot: 0
        });
        for (var k = 0; k < 4; k++) {
          this.coinsList.push({ x: x + 40 + k * 28, y: this.groundY - 28, taken: false });
        }
        if (chunkIdx % 2 === 0) {
          this.items.push({ type: 'herb', x: x + 255, y: this.groundY - 68, taken: false });
        } else {
          this.items.push({ type: 'flower', x: x + 255, y: this.groundY - 78, taken: false });
        }
      } else if (pat === 3) {
        // Red termite mound + rescued monkey + high jump coin line
        this.hazards.push({ type: 'mound', x: x + 95, y: this.groundY - 22, w: 34, h: 22, dmg: 15 });
        if (chunkIdx % 3 !== 0) {
          this.monkeysList.push({ x: x + 205, y: this.groundY - 38, saved: false });
        }
        for (var m = 0; m < 5; m++) {
          this.coinsList.push({ x: x + 65 + m * 28, y: this.groundY - 82, taken: false });
        }
      } else {
        // Double obstacle sprint (encourages Dash!)
        this.hazards.push({ type: 'thorns', x: x + 80, y: this.groundY - 18, w: 38, h: 18, dmg: 16 });
        this.hazards.push({ type: 'mound', x: x + 195, y: this.groundY - 22, w: 34, h: 22, dmg: 15 });
        for (var n = 0; n < 6; n++) {
          this.coinsList.push({ x: x + 55 + n * 32, y: this.groundY - 52, taken: false });
        }
      }

      x += 310;
    }

    this.generatedUntilX = x;
  };

  ForestEasterGame.prototype.open = function () {
    if (!this.overlay) return;
    this.overlay.hidden = false;
    this.overlay.classList.add('is-entering');
    var self = this;
    setTimeout(function () {
      self.overlay.classList.remove('is-entering');
    }, 460);

    this.active = true;
    this.resize();
    this.resetWorld();
    this.lastTs = performance.now();
    if (this.rafId) window.cancelAnimationFrame(this.rafId);
    function loop(ts) {
      if (!self.active) return;
      var dt = Math.min(0.05, Math.max(0.001, (ts - self.lastTs) / 1000));
      self.lastTs = ts;
      self.update(dt);
      self.render();
      self.rafId = window.requestAnimationFrame(loop);
    }
    this.rafId = window.requestAnimationFrame(loop);
  };

  ForestEasterGame.prototype.close = function () {
    this.active = false;
    this.keys.left = false;
    this.keys.right = false;
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.overlay) this.overlay.hidden = true;
  };

  ForestEasterGame.prototype.triggerJump = function () {
    if (!this.active || this.pausedForModal) return;
    var p = this.player;
    if (p.jumpsLeft > 0) {
      var isDouble = !p.onGround && p.jumpsLeft === 1;
      p.vy = isDouble ? JUMP_VEL * 0.92 : JUMP_VEL;
      p.onGround = false;
      p.jumpsLeft--;
      if (this.sfx) this.sfx.jump(isDouble);
      this.spawnBurst(p.x + p.w / 2, p.y + p.h, '#e2e8f0', 5);
    }
  };

  ForestEasterGame.prototype.triggerDash = function () {
    if (!this.active || this.pausedForModal) return;
    var p = this.player;
    if (p.dashCd <= 0 && p.dashTimer <= 0) {
      p.dashTimer = DASH_DURATION;
      p.dashCd = DASH_COOLDOWN;
      p.invuln = Math.max(p.invuln, DASH_DURATION + 0.08);
      p.vy = Math.min(p.vy, 0);
      if (this.sfx) this.sfx.dash();
      this.spawnBurst(p.x + p.w / 2, p.y + p.h / 2, '#38bdf8', 8);
    }
  };

  ForestEasterGame.prototype.openNpcChat = function (npc) {
    if (!npc || !this.npcModal) return;
    this.pausedForModal = true;
    this.keys.left = false;
    this.keys.right = false;
    this.activeNpc = npc;

    // Render crisp NPC portrait
    if (this.npcPortrait && this.sprites && this.sprites.npcs[npc.id]) {
      var pctx = this.npcPortrait.getContext('2d');
      pctx.imageSmoothingEnabled = false;
      pctx.clearRect(0, 0, this.npcPortrait.width, this.npcPortrait.height);
      pctx.drawImage(this.sprites.npcs[npc.id], 4, 4, this.npcPortrait.width - 8, this.npcPortrait.height - 8);
    }

    var bonusHp = this.npcCtrl ? this.npcCtrl.claimGreetingHeal(npc) : 0;
    if (bonusHp > 0) {
      this.hp = Math.min(this.maxHp, this.hp + bonusHp);
      this.syncHud();
    }

    if (this.npcName) {
      this.npcName.innerHTML =
        npc.name +
        (bonusHp > 0 ? '<span class="pg-npc-HealBadge">+' + bonusHp + ' HP quà tặng</span>' : '');
    }
    if (this.npcRole) this.npcRole.textContent = npc.role + ' • AI qwen3.8-27b';
    if (this.npcSpeech) this.npcSpeech.textContent = '“' + npc.greeting + '”';

    var self = this;
    if (this.npcChips) {
      this.npcChips.innerHTML = '';
      (npc.quickPrompts || []).forEach(function (q) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pg-chip-btn';
        btn.textContent = q;
        btn.addEventListener('click', function () {
          self.sendNpcPrompt(q);
        });
        self.npcChips.appendChild(btn);
      });
    }

    this.npcModal.hidden = false;
    if (this.npcInput) {
      this.npcInput.value = '';
      setTimeout(function () {
        if (self.npcInput && window.innerWidth > 820) self.npcInput.focus();
      }, 60);
    }
  };

  ForestEasterGame.prototype.sendNpcPrompt = function (promptText) {
    if (!this.activeNpc || !this.npcCtrl || !promptText.trim()) return;
    var self = this;
    var npc = this.activeNpc;
    if (this.npcSend) this.npcSend.disabled = true;
    if (this.npcSpeech) {
      this.npcSpeech.textContent = 'Bạn: “' + promptText.trim() + '”\n⏳ ' + npc.name + ' đang ngẫm nghĩ...';
    }

    this.npcCtrl
      .askNpc(npc, promptText, {
        distMeters: this.maxDist,
        hp: this.hp,
        coins: this.coins,
        monkeysSaved: this.monkeysSaved
      })
      .then(function (reply) {
        if (self.activeNpc !== npc) return;
        if (self.npcSpeech) {
          self.npcSpeech.textContent = '“' + reply + '”';
        }
      })
      .finally(function () {
        if (self.npcSend) self.npcSend.disabled = false;
      });
  };

  ForestEasterGame.prototype.closeNpcChat = function () {
    if (this.npcModal) this.npcModal.hidden = true;
    this.activeNpc = null;
    this.pausedForModal = false;
    this.lastTs = performance.now();
  };

  ForestEasterGame.prototype.showEndBanner = function (isVictory) {
    this.pausedForModal = true;
    this.keys.left = false;
    this.keys.right = false;
    if (!this.bannerModal) return;

    if (isVictory) {
      this.victoryShown = true;
      this.bannerTitle.textContent = '✦ Rừng Nở Trắng Hoa Tử Huyền! ✦';
      this.bannerDesc.textContent =
        'Ông Diểu đã vượt 600m rừng Nam Xung, cứu được ' +
        this.monkeysSaved +
        ' chú khỉ và gom ' +
        this.coins +
        ' đồng xu vàng (Tổng điểm: ' +
        Math.round(this.score) +
        '). Bạn muốn đi tiếp chế độ vô tận hay quay về trang sách?';
      if (this.btnEndless) this.btnEndless.hidden = false;
    } else {
      this.bannerTitle.textContent = 'Lạc Giữa Sương Mù Hõm Chết';
      this.bannerDesc.textContent =
        'Ông Diểu đã kiệt sức ở cự ly ' +
        Math.round(this.maxDist) +
        'm (Điểm: ' +
        Math.round(this.score) +
        ' • Đã cứu ' +
        this.monkeysSaved +
        ' khỉ). Hãy thử sức lại nhé!';
      if (this.btnEndless) this.btnEndless.hidden = true;
    }
    this.bannerModal.hidden = false;
  };

  ForestEasterGame.prototype.isOverPit = function (footX) {
    for (var i = 0; i < this.pits.length; i++) {
      var pit = this.pits[i];
      if (footX > pit.x + 8 && footX < pit.x + pit.w - 8) return true;
    }
    return false;
  };

  ForestEasterGame.prototype.spawnBurst = function (x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      var spd = 40 + Math.random() * 95;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 35,
        life: 0.45 + Math.random() * 0.25,
        color: color
      });
    }
  };

  ForestEasterGame.prototype.damagePlayer = function (amount) {
    var p = this.player;
    if (p.invuln > 0 || p.flowerBuff > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    p.invuln = 1.05;
    p.vy = -260;
    this.combo = 0;
    if (this.sfx) this.sfx.hurt();
    this.spawnBurst(p.x + p.w / 2, p.y + p.h / 2, '#f43f5e', 10);
    this.popups.push({ x: p.x, y: p.y - 8, text: '-' + amount + ' HP', color: '#fda4af', life: 0.85 });
    if (this.hp <= 0) {
      this.showEndBanner(false);
    }
  };

  ForestEasterGame.prototype.update = function (dt) {
    this.animClock += dt;
    if (this.pausedForModal) return;

    var p = this.player;
    if (p.dashCd > 0) p.dashCd = Math.max(0, p.dashCd - dt);
    if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);
    if (p.flowerBuff > 0) p.flowerBuff = Math.max(0, p.flowerBuff - dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    // Horizontal control
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.vx = p.facing * DASH_SPEED;
      p.vy = 0;
      p.trail.push({ x: p.x, y: p.y, life: 0.18 });
    } else {
      var dir = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
      if (dir !== 0) p.facing = dir;
      p.vx = dir * MOVE_SPEED;
      p.vy += GRAVITY * dt;
    }

    p.x = Math.max(24, p.x + p.vx * dt);
    p.y += p.vy * dt;

    var footCenter = p.x + p.w * 0.5;
    var overPit = this.isOverPit(footCenter);

    if (!overPit && p.y + p.h >= this.groundY && p.vy >= 0) {
      var prevBottom = p.y + p.h - p.vy * dt;
      if (prevBottom <= this.groundY + 14) {
        p.y = this.groundY - p.h;
        p.vy = 0;
        p.onGround = true;
        p.jumpsLeft = 2;
      }
    } else {
      p.onGround = false;
    }

    // Fell into Hõm Chết chasm
    if (p.y > this.viewH + 36) {
      this.hp = Math.max(0, this.hp - 28);
      this.combo = 0;
      if (this.sfx) this.sfx.hurt();
      if (this.hp <= 0) {
        this.showEndBanner(false);
        return;
      }
      // Respawn safely just before pit
      p.x = Math.max(40, p.x - 95);
      p.y = this.groundY - p.h - 45;
      p.vy = 0;
      p.invuln = 1.3;
      this.popups.push({ x: p.x, y: p.y, text: '-28 HP Vực Sâu!', color: '#fda4af', life: 0.95 });
    }

    var curMeters = Math.max(0, (p.x - 110) / PIXELS_PER_METER);
    if (curMeters > this.maxDist) {
      this.score += (curMeters - this.maxDist) * 2.5;
      this.maxDist = curMeters;
    }

    if (this.endlessMode && p.x + 900 > this.generatedUntilX) {
      this.extendWorldTo(this.generatedUntilX + 1200);
    }

    if (!this.victoryShown && p.x >= GOAL_WORLD_X) {
      this.score += 500;
      this.showEndBanner(true);
    }

    // Check nearby NPC
    this.nearbyNpc = null;
    for (var n = 0; n < this.npcs.length; n++) {
      if (Math.abs(p.x - this.npcs[n].worldX) < 68) {
        this.nearbyNpc = this.npcs[n];
        break;
      }
    }

    var mult = 1 + Math.min(3, Math.floor(this.combo / 5) * 0.25);

    // Collect coins (with magnet aura during Hoa Tử Huyền buff!)
    for (var c = 0; c < this.coinsList.length; c++) {
      var coin = this.coinsList[c];
      if (coin.taken) continue;
      if (p.flowerBuff > 0) {
        var dx = p.x + p.w / 2 - coin.x;
        var dy = p.y + p.h / 2 - coin.y;
        var dist = Math.hypot(dx, dy);
        if (dist < 155 && dist > 1) {
          coin.x += (dx / dist) * 340 * dt;
          coin.y += (dy / dist) * 340 * dt;
        }
      }
      if (rectsOverlap(p.x - 4, p.y - 4, p.w + 8, p.h + 8, coin.x - 9, coin.y - 9, 18, 18)) {
        coin.taken = true;
        this.coins++;
        this.combo++;
        this.comboTimer = 3.2;
        var pts = Math.round(25 * mult);
        this.score += pts;
        if (this.sfx) this.sfx.coin(this.combo);
        this.spawnBurst(coin.x, coin.y, '#fde047', 6);
        this.popups.push({ x: coin.x, y: coin.y - 8, text: '+' + pts, color: '#fef08a', life: 0.55 });
      }
    }

    // Rescue monkeys
    for (var m = 0; m < this.monkeysList.length; m++) {
      var mk = this.monkeysList[m];
      if (mk.saved) continue;
      if (rectsOverlap(p.x - 6, p.y - 6, p.w + 12, p.h + 12, mk.x - 10, mk.y - 10, 38, 42)) {
        mk.saved = true;
        this.monkeysSaved++;
        this.hp = Math.min(this.maxHp, this.hp + 10);
        this.score += Math.round(300 * mult);
        if (this.sfx) this.sfx.rescue();
        this.spawnBurst(mk.x + 14, mk.y + 8, '#4ade80', 12);
        this.popups.push({ x: mk.x - 6, y: mk.y - 14, text: 'CỨU KHỈ +300 ♥', color: '#86efac', life: 1.1 });
      }
    }

    // Collect herbs & Hoa Tử Huyền
    for (var it = 0; it < this.items.length; it++) {
      var item = this.items[it];
      if (item.taken) continue;
      if (rectsOverlap(p.x, p.y, p.w, p.h, item.x - 10, item.y - 10, 26, 26)) {
        item.taken = true;
        if (item.type === 'herb') {
          this.hp = Math.min(this.maxHp, this.hp + 25);
          if (this.sfx) this.sfx.rescue();
          this.popups.push({ x: item.x, y: item.y - 10, text: 'Cỏ Lào +25 HP', color: '#4ade80', life: 0.9 });
        } else {
          p.flowerBuff = 5.5;
          this.score += 150;
          if (this.sfx) this.sfx.rescue();
          this.popups.push({ x: item.x - 12, y: item.y - 10, text: 'Hoa Tử Huyền! Bất tử 5s', color: '#e0f2fe', life: 1.1 });
        }
      }
    }

    // Update hazards
    for (var h = 0; h < this.hazards.length; h++) {
      var hz = this.hazards[h];
      if (hz.type === 'boulder') {
        hz.x += hz.vx * dt;
        hz.rot += hz.vx * dt * 0.08;
        if (hz.x < hz.baseX - hz.range) hz.vx = Math.abs(hz.vx);
        else if (hz.x > hz.baseX + hz.range) hz.vx = -Math.abs(hz.vx);
      }
      if (rectsOverlap(p.x + 5, p.y + 6, p.w - 10, p.h - 8, hz.x + 3, hz.y + 3, hz.w - 6, hz.h - 4)) {
        this.damagePlayer(hz.dmg);
      }
    }

    // Particles & trail decay
    for (var tr = p.trail.length - 1; tr >= 0; tr--) {
      p.trail[tr].life -= dt;
      if (p.trail[tr].life <= 0) p.trail.splice(tr, 1);
    }
    for (var pt = this.particles.length - 1; pt >= 0; pt--) {
      var part = this.particles[pt];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.life -= dt;
      if (part.life <= 0) this.particles.splice(pt, 1);
    }
    for (var pp = this.popups.length - 1; pp >= 0; pp--) {
      this.popups[pp].y -= 28 * dt;
      this.popups[pp].life -= dt;
      if (this.popups[pp].life <= 0) this.popups.splice(pp, 1);
    }

    // Smooth camera follow
    var targetCam = Math.max(0, p.x - this.viewW * 0.34);
    this.camX += (targetCam - this.camX) * Math.min(1, dt * 8.5);
    this.syncHud();
  };

  ForestEasterGame.prototype.syncHud = function () {
    var mult = 1 + Math.min(3, Math.floor(this.combo / 5) * 0.25);
    if (this.elScore) this.elScore.textContent = String(Math.round(this.score));
    if (this.elDist) this.elDist.textContent = 'DIST ' + Math.round(this.maxDist) + 'm';
    if (this.elCoins) this.elCoins.textContent = 'XU ' + this.coins;
    if (this.elMonkeys) this.elMonkeys.textContent = 'KHỈ ' + this.monkeysSaved;
    if (this.elHpText) this.elHpText.textContent = 'HP ' + Math.round(this.hp) + '/' + this.maxHp;
    if (this.elHpFill) this.elHpFill.style.width = clamp((this.hp / this.maxHp) * 100, 0, 100) + '%';

    var dashPct = this.player ? clamp((1 - this.player.dashCd / DASH_COOLDOWN) * 100, 0, 100) : 100;
    if (this.elDashFill) this.elDashFill.style.width = dashPct + '%';
    if (this.elDashStatus) {
      this.elDashStatus.textContent =
        this.player && this.player.flowerBuff > 0
          ? '✦ HOA TỬ HUYỀN (' + this.player.flowerBuff.toFixed(1) + 's)'
          : dashPct >= 99.5
          ? 'DASH READY'
          : 'DASH RECHARGING';
    }
    if (this.elCombo) this.elCombo.textContent = 'COMBO x' + this.combo;
    if (this.elMult) this.elMult.textContent = 'MULT ' + mult.toFixed(2);
  };

  ForestEasterGame.prototype.render = function () {
    var ctx = this.ctx;
    var w = this.viewW;
    var h = this.viewH;
    var cam = Math.round(this.camX);

    // Sky gradient shifts subtly by forest zone
    var zoneProg = clamp(this.camX / GOAL_WORLD_X, 0, 1);
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    if (zoneProg < 0.45) {
      grad.addColorStop(0, '#7dd3fc');
      grad.addColorStop(0.65, '#bae6fd');
      grad.addColorStop(1, '#dcfce7');
    } else if (zoneProg < 0.78) {
      grad.addColorStop(0, '#64748b');
      grad.addColorStop(0.65, '#94a3b8');
      grad.addColorStop(1, '#cbd5e1');
    } else {
      grad.addColorStop(0, '#93c5fd');
      grad.addColorStop(0.65, '#e0f2fe');
      grad.addColorStop(1, '#f8fafc');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Pixel clouds drifting across sky (parallax 0.08)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
    var cOff = -((cam * 0.08 + this.animClock * 4) % 220);
    for (var clx = cOff - 110; clx < w + 220; clx += 145) {
      var cly = 28 + ((Math.abs(Math.floor((clx - cOff) / 145)) * 29) % 48);
      ctx.fillRect(Math.round(clx), cly, 46, 8);
      ctx.fillRect(Math.round(clx + 8), cly - 6, 28, 6);
    }

    // Distant Nam Xung tapered limestone karst peaks (parallax 0.18)
    ctx.fillStyle = zoneProg >= 0.45 && zoneProg < 0.78 ? '#475569' : '#648b82';
    var mOffset = -((cam * 0.18) % 190);
    for (var mx = mOffset - 95; mx < w + 190; mx += 95) {
      var seed = Math.abs(Math.floor((mx - mOffset) / 95));
      var mh = 92 + ((seed * 41) % 68);
      var bx0 = Math.round(mx);
      // Stepped karst cone silhouette instead of flat rectangles
      ctx.fillRect(bx0, this.groundY - Math.round(mh * 0.52), 74, Math.round(mh * 0.52));
      ctx.fillRect(bx0 + 9, this.groundY - Math.round(mh * 0.78), 54, Math.round(mh * 0.28));
      ctx.fillRect(bx0 + 19, this.groundY - mh, 34, Math.round(mh * 0.24));
      ctx.fillRect(bx0 + 27, this.groundY - mh - 14, 16, 14);
    }

    // Soft valley mist ribbon between mountains and trees
    ctx.fillStyle = 'rgba(241, 245, 249, 0.28)';
    ctx.fillRect(0, this.groundY - 68, w, 14);

    // Midground misty forest ridge (parallax 0.42)
    ctx.fillStyle = '#3b5e4b';
    var fOffset = -((cam * 0.42) % 120);
    for (var fx = fOffset - 60; fx < w + 120; fx += 60) {
      var fh = 52 + ((Math.abs(Math.floor((fx - fOffset) / 60)) * 23) % 28);
      ctx.fillRect(Math.round(fx), this.groundY - fh, 64, fh);
    }

    // Pixel trees along the trail
    if (this.sprites && this.sprites.tree) {
      for (var t = 0; t < this.trees.length; t++) {
        var tr = this.trees[t];
        var sx = Math.round(tr.x - cam);
        if (sx < -90 || sx > w + 90) continue;
        var tw = Math.round(44 * tr.scale * 1.45);
        var th = Math.round(62 * tr.scale * 1.45);
        ctx.drawImage(this.sprites.tree, sx, this.groundY - th + 4, tw, th);
      }
    }

    // Ground stone trail & Hõm Chết chasm gaps
    ctx.fillStyle = '#365314';
    ctx.fillRect(0, this.groundY, w, 8);
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(0, this.groundY + 8, w, h - this.groundY - 8);
    // Pixel stone bricks on ground
    ctx.fillStyle = '#52525b';
    var brickOff = -(cam % 28);
    for (var bx = brickOff; bx < w; bx += 28) {
      ctx.fillRect(bx + 2, this.groundY + 12, 22, 7);
      ctx.fillRect(bx + 12, this.groundY + 23, 20, 7);
    }

    // Carve out Hõm Chết pits with eerie mist
    for (var pi = 0; pi < this.pits.length; pi++) {
      var pit = this.pits[pi];
      var px = Math.round(pit.x - cam);
      if (px + pit.w < -20 || px > w + 20) continue;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px, this.groundY, pit.w, h - this.groundY);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      var mistY = this.groundY + 6 + Math.sin(this.animClock * 3 + pi) * 4;
      ctx.fillRect(px + 4, mistY, pit.w - 8, 10);
    }

    // White Hoa Tử Huyền carpet & Goal Sanctuary Gate at 600m
    var gateX = Math.round(GOAL_WORLD_X - cam);
    if (gateX > -240 && gateX < w + 240) {
      ctx.fillStyle = '#ffffff';
      for (var fl = -160; fl < 160; fl += 14) {
        ctx.fillRect(gateX + fl, this.groundY - 3, 3, 3);
        ctx.fillRect(gateX + fl + 5, this.groundY - 5, 2, 2);
      }
      // Ancient moss stone sanctuary pillars
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(gateX - 24, this.groundY - 96, 12, 96);
      ctx.fillRect(gateX + 24, this.groundY - 96, 12, 96);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(gateX - 32, this.groundY - 106, 76, 12);
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('MUỐI CỦA RỪNG', gateX - 28, this.groundY - 97);
    }

    // Draw NPCs + floating prompt
    if (this.sprites) {
      for (var n = 0; n < this.npcs.length; n++) {
        var npc = this.npcs[n];
        var nx = Math.round(npc.worldX - cam);
        if (nx < -80 || nx > w + 80) continue;
        var spr = this.sprites.npcs[npc.id];
        if (spr) {
          var nw = spr.width * 2;
          var nh = spr.height * 2;
          var bob = npc.id === 'tuhuyen' ? Math.round(Math.sin(this.animClock * 3) * 4) : 0;
          ctx.drawImage(spr, nx - Math.floor(nw / 2), this.groundY - nh + bob, nw, nh);

          var isNear = this.nearbyNpc && this.nearbyNpc.id === npc.id;
          ctx.fillStyle = isNear ? 'rgba(250, 204, 21, 0.95)' : 'rgba(15, 23, 42, 0.8)';
          var tagW = isNear ? 96 : 68;
          ctx.fillRect(nx - Math.floor(tagW / 2), this.groundY - nh - 19 + bob, tagW, 14);
          ctx.fillStyle = isNear ? '#0f172a' : '#f8fafc';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(isNear ? '[E] Trò chuyện' : npc.name.split(' ').slice(0, 2).join(' '), nx, this.groundY - nh - 9 + bob);
          ctx.textAlign = 'left';
        }
      }

      // Draw Coins with golden halo (just like reference screenshot!)
      var coinFrame = this.sprites.coin[Math.floor(this.animClock * 8) % 4];
      for (var c = 0; c < this.coinsList.length; c++) {
        var coin = this.coinsList[c];
        if (coin.taken) continue;
        var cx = Math.round(coin.x - cam);
        if (cx < -24 || cx > w + 24) continue;
        var cy = Math.round(coin.y + Math.sin(this.animClock * 4 + c) * 2.5);
        ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(coinFrame, cx - 10, cy - 10, 20, 20);
      }

      // Draw Monkeys
      for (var m = 0; m < this.monkeysList.length; m++) {
        var mk = this.monkeysList[m];
        var mkx = Math.round(mk.x - cam);
        if (mkx < -40 || mkx > w + 40) continue;
        var mspr = mk.saved ? this.sprites.monkeyRescued : this.sprites.monkeyTrapped;
        var jumpY = mk.saved ? Math.abs(Math.sin(this.animClock * 7 + m)) * -10 : 0;
        ctx.drawImage(mspr, mkx, Math.round(mk.y + jumpY), 36, 36);
        if (!mk.saved) {
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 8px monospace';
          ctx.fillText('Cứu!', mkx + 6, mk.y - 3);
        }
      }

      // Draw Herbs & Flowers
      for (var it = 0; it < this.items.length; it++) {
        var item = this.items[it];
        if (item.taken) continue;
        var ix = Math.round(item.x - cam);
        if (ix < -24 || ix > w + 24) continue;
        var iy = Math.round(item.y + Math.sin(this.animClock * 3.5 + it) * 3);
        var ispr = item.type === 'herb' ? this.sprites.herb : this.sprites.flower;
        ctx.drawImage(ispr, ix - 12, iy - 12, 24, 24);
      }

      // Draw Hazards
      for (var hzIdx = 0; hzIdx < this.hazards.length; hzIdx++) {
        var hz = this.hazards[hzIdx];
        var hx = Math.round(hz.x - cam);
        if (hx < -50 || hx > w + 50) continue;
        if (hz.type === 'boulder') {
          ctx.save();
          ctx.translate(hx + hz.w / 2, hz.y + hz.h / 2);
          ctx.rotate(hz.rot);
          ctx.drawImage(this.sprites.boulder, -hz.w / 2, -hz.h / 2, hz.w, hz.h);
          ctx.restore();
        } else if (hz.type === 'thorns') {
          ctx.drawImage(this.sprites.thorns, hx, hz.y - 8, hz.w, hz.h + 8);
        } else {
          ctx.drawImage(this.sprites.mound, hx, hz.y - 8, hz.w, hz.h + 8);
        }
      }

      // Draw Ông Diểu + dash afterimages
      var p = this.player;
      for (var ti = 0; ti < p.trail.length; ti++) {
        var ghost = p.trail[ti];
        ctx.globalAlpha = ghost.life * 2.2;
        ctx.drawImage(this.sprites.dieu.jump, Math.round(ghost.x - cam) - 8, Math.round(ghost.y) + 2, 48, 58);
      }
      ctx.globalAlpha = 1;

      if (p.flowerBuff > 0) {
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(Math.round(p.x - cam + p.w / 2), Math.round(p.y + p.h / 2), 34, 0, Math.PI * 2);
        ctx.stroke();
      }

      var blinkSkip = p.invuln > 0 && Math.floor(this.animClock * 18) % 2 === 0;
      if (!blinkSkip) {
        var dFrame = !p.onGround
          ? this.sprites.dieu.jump
          : Math.abs(p.vx) > 5
          ? this.sprites.dieu.run[Math.floor(this.animClock * 10) % 4]
          : this.sprites.dieu.idle;

        ctx.save();
        var drawX = Math.round(p.x - cam + p.w / 2);
        ctx.translate(drawX, Math.round(p.y));
        if (p.facing < 0) ctx.scale(-1, 1);
        // Subtle ground shadow like reference screenshot
        if (p.onGround) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
          ctx.fillRect(-13, p.h - 2, 26, 4);
        }
        ctx.drawImage(dFrame, -24, 2, 48, 58);
        ctx.restore();
      }
    }

    // Spring rain streaks in Zone 3 (> 380m)
    if (zoneProg > 0.6) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      for (var r = 0; r < 22; r++) {
        var rx = ((r * 67 - Math.floor(this.animClock * 90)) % w + w) % w;
        var ry = ((r * 43 + Math.floor(this.animClock * 210)) % h);
        ctx.fillRect(rx, ry, 1, 7);
      }
    }

    // Particles & floating popups
    for (var pt = 0; pt < this.particles.length; pt++) {
      var part = this.particles[pt];
      ctx.fillStyle = part.color;
      ctx.fillRect(Math.round(part.x - cam), Math.round(part.y), 3, 3);
    }
    ctx.font = 'bold 9px sans-serif';
    for (var pp = 0; pp < this.popups.length; pp++) {
      var pop = this.popups[pp];
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, Math.round(pop.x - cam), Math.round(pop.y));
    }
  };

  ForestEasterGame.prototype.bindEvents = function () {
    var self = this;

    document.getElementById('btn-easter-glitch')?.addEventListener('click', function (e) {
      e.stopPropagation();
      // Pause chapter narration if currently speaking
      var pillStop = document.getElementById('pill-stop-btn');
      var pill = document.getElementById('footer-audio-pill');
      if (pill && !pill.hidden && pillStop) pillStop.click();
      self.open();
    });

    document.getElementById('pg-btn-exit')?.addEventListener('click', function () {
      self.close();
    });
    document.getElementById('pg-btn-restart')?.addEventListener('click', function () {
      self.resetWorld();
    });

    document.getElementById('pg-npc-close')?.addEventListener('click', function () {
      self.closeNpcChat();
    });

    if (this.npcForm) {
      this.npcForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!self.npcInput) return;
        var val = self.npcInput.value;
        self.npcInput.value = '';
        self.sendNpcPrompt(val);
      });
    }

    document.getElementById('pg-btn-retry')?.addEventListener('click', function () {
      self.resetWorld();
    });
    document.getElementById('pg-btn-backbook')?.addEventListener('click', function () {
      self.close();
    });
    this.btnEndless?.addEventListener('click', function () {
      self.endlessMode = true;
      self.pausedForModal = false;
      if (self.bannerModal) self.bannerModal.hidden = true;
      self.extendWorldTo(self.player.x + 1800);
      self.lastTs = performance.now();
    });

    // Click directly on NPC sprite on canvas to open chat!
    this.canvas.addEventListener('click', function (e) {
      if (!self.active || self.pausedForModal) return;
      var rect = self.canvas.getBoundingClientRect();
      var cx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * self.viewW + self.camX;
      var cy = ((e.clientY - rect.top) / Math.max(1, rect.height)) * self.viewH;
      if (cy < self.groundY - 110 || cy > self.groundY + 12) return;
      for (var i = 0; i < self.npcs.length; i++) {
        if (Math.abs(cx - self.npcs[i].worldX) < 42) {
          self.openNpcChat(self.npcs[i]);
          break;
        }
      }
    });

    window.addEventListener('resize', function () {
      if (self.active) self.resize();
    });

    window.addEventListener('keydown', function (e) {
      if (!self.active) return;
      if (e.target === self.npcInput) {
        if (e.key === 'Escape') self.closeNpcChat();
        return;
      }
      if (e.key === 'Escape') {
        if (self.activeNpc) self.closeNpcChat();
        else self.close();
        return;
      }
      if (self.pausedForModal) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        self.keys.left = true;
        e.preventDefault();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        self.keys.right = true;
        e.preventDefault();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        self.triggerJump();
        e.preventDefault();
      } else if (e.key === 'Shift' || e.key === 'k' || e.key === 'K' || e.key === 'l' || e.key === 'L') {
        self.triggerDash();
        e.preventDefault();
      } else if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && self.nearbyNpc) {
        self.openNpcChat(self.nearbyNpc);
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', function (e) {
      if (!self.active) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') self.keys.left = false;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') self.keys.right = false;
    });

    // Touch buttons
    function bindHold(id, dirKey) {
      var btn = document.getElementById(id);
      if (!btn) return;
      var start = function (ev) { ev.preventDefault(); self.keys[dirKey] = true; };
      var end = function (ev) { ev.preventDefault(); self.keys[dirKey] = false; };
      btn.addEventListener('touchstart', start, { passive: false });
      btn.addEventListener('touchend', end, { passive: false });
      btn.addEventListener('touchcancel', end, { passive: false });
      btn.addEventListener('mousedown', start);
      btn.addEventListener('mouseup', end);
      btn.addEventListener('mouseleave', end);
    }
    bindHold('pg-touch-left', 'left');
    bindHold('pg-touch-right', 'right');

    document.getElementById('pg-touch-jump')?.addEventListener('click', function () {
      self.triggerJump();
    });
    document.getElementById('pg-touch-dash')?.addEventListener('click', function () {
      self.triggerDash();
    });
    document.getElementById('pg-touch-talk')?.addEventListener('click', function () {
      if (self.nearbyNpc) self.openNpcChat(self.nearbyNpc);
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.MuoiCuaRung.easterGame = new ForestEasterGame();
  });
})();
