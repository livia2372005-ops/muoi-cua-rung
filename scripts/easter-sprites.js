window.MuoiCuaRung = window.MuoiCuaRung || {};

/**
 * Custom Pixel-Art Sprite Sheet Builder, Parallax Forest Renderer & 8-bit Chiptune SFX
 * Hand-crafted pixel matrices for "Muối Của Rừng" Easter Egg Mini-Game.
 */
(function () {
  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { c: c, ctx: ctx };
  }

  function drawMatrix(ctx, rows, palette, ox, oy) {
    for (var y = 0; y < rows.length; y++) {
      var row = rows[y];
      for (var x = 0; x < row.length; x++) {
        var ch = row[x];
        if (ch === '.' || !palette[ch]) continue;
        ctx.fillStyle = palette[ch];
        ctx.fillRect((ox || 0) + x, (oy || 0) + y, 1, 1);
      }
    }
  }

  var PAL_DIEU = {
    'H': '#3a2e25', // fur ushanka dark
    'h': '#5c4938', // fur ushanka trim
    'S': '#eac096', // skin
    's': '#cfa076', // skin shade
    'E': '#1a1c1a', // eyes/boots dark
    'G': '#9aa0a6', // grey hair/brow
    'C': '#465945', // quilted olive coat
    'c': '#314030', // coat shade/quilts
    'B': '#7d5634', // belt/pouch
    'P': '#293036', // dark trousers
    'T': '#4a3525'  // tall hunting boots
  };

  function buildDieuFrame(pose) {
    var m = makeCanvas(20, 22);
    var headAndTorso = [
      '......HHHHHH........',
      '.....HHHHHHHH.......',
      '....HHhhhhhhHH......',
      '....HHhGGGGhHH......',
      '....HHSSSSSShH......',
      '....HSSESSSESH......',
      '.....SSSSSSSS.......',
      '......ssssss........',
      '.....CCCCCCCC.......',
      '....CCcCCCCcCC......',
      '...CCCcCCCCcCCC.....',
      '...CCCBBBBBBCCC.....',
      '...CCcCCCCCCcCC.....',
      '....CcCCCCCCcC......',
      '.....CCCCCCCC.......'
    ];
    drawMatrix(m.ctx, headAndTorso, PAL_DIEU, 0, pose === 'run1' || pose === 'run3' ? 1 : 0);

    var legs;
    if (pose === 'run1') {
      legs = [
        '.....PPPPPPPP.......',
        '....PPPP..PPPP......',
        '...PPP.....PPPP.....',
        '..TTT.......TTT.....',
        '..TTT........TTT....',
        '.EEEE........EEEE...'
      ];
    } else if (pose === 'run2') {
      legs = [
        '.....PPPPPPPP.......',
        '.....PPPPPPPP.......',
        '......PPPPPP........',
        '......TTTTTT........',
        '......TTTTTT........',
        '......EEEEEE........'
      ];
    } else if (pose === 'run3') {
      legs = [
        '.....PPPPPPPP.......',
        '.....PPPP.PPPP......',
        '....PPPP...PPP......',
        '...TTT......TTT.....',
        '..TTT........TTT....',
        '..EEEE.......EEEE...'
      ];
    } else if (pose === 'jump') {
      legs = [
        '....PPPPPPPPPP......',
        '...PPPP....PPPP.....',
        '...TTT......TTT.....',
        '..EEEE......EEEE....',
        '....................',
        '....................'
      ];
    } else {
      legs = [
        '.....PPPPPPPP.......',
        '.....PPP..PPP.......',
        '.....PPP..PPP.......',
        '.....TTT..TTT.......',
        '.....TTT..TTT.......',
        '.....EEEE.EEEE......'
      ];
    }
    drawMatrix(m.ctx, legs, PAL_DIEU, 0, 15);
    return m.c;
  }

  function buildCoinFrames() {
    var frames = [];
    var widths = [10, 7, 3, 7];
    for (var i = 0; i < 4; i++) {
      var m = makeCanvas(14, 14);
      var ctx = m.ctx;
      var w = widths[i];
      var x0 = Math.floor((14 - w) / 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x0, 2, w, 10);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x0 + 1, 1, Math.max(1, w - 2), 12);
      if (w >= 7) {
        ctx.fillStyle = '#fffbeb';
        ctx.fillRect(x0 + 1, 3, 2, 3);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(6, 5, 2, 4);
      }
      frames.push(m.c);
    }
    return frames;
  }

  function buildMonkeySprite(rescued) {
    var m = makeCanvas(18, 18);
    var pal = {
      'B': '#7c4d2b',
      'b': '#59341b',
      'F': '#e0b187',
      'E': '#18181b',
      'V': '#365314', // vine
      'G': '#84cc16', // healing herb bandage
      'W': '#f8fafc',
      'R': '#ef4444'
    };
    var rows = rescued
      ? [
          '.......RRR........',
          '......RRRRR.......',
          '.......RRR........',
          '....BBBBBBBB......',
          '..BBbFFFFFFbBB....',
          '..BBFEEEEEEFBB....',
          '...BBFFFFFFBB.....',
          '..BB..BBBB..BB....',
          '.BB..GGGGGG..BB...',
          '.....WWWWWW.......',
          '.....BBBBBB.......',
          '....BBB..BBB..bb..',
          '....BB....BB.bb...',
          '...bb......bbb....'
        ]
      : [
          '.....BBBBBB.......',
          '...BBbFFFFbBB.....',
          '...BBFEEFEFBB.....',
          '....BBFFFFBB......',
          '...VVBBBBBBVV.....',
          '..VVVBBBBBBVVV....',
          '...VVbBBBBbVV.....',
          '....VVBBBBVV..bb..',
          '....BBBBBBBB.bb...',
          '....BBB..BBBbb....',
          '....bb....bb......'
        ];
    drawMatrix(m.ctx, rows, pal, 0, rescued ? 2 : 5);
    return m.c;
  }

  function buildNpcSprite(id) {
    if (id === 'duoi') {
      var m = makeCanvas(38, 44);
      var ctx = m.ctx;
      // Gnarled trunk
      ctx.fillStyle = '#5c4033';
      ctx.fillRect(14, 18, 10, 26);
      ctx.fillRect(11, 36, 16, 8);
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(19, 20, 4, 24);
      // Wise eyes & smile on bark
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(16, 25, 2, 2);
      ctx.fillRect(20, 25, 2, 2);
      ctx.fillStyle = '#271714';
      ctx.fillRect(17, 29, 4, 1);
      // Leafy canopy
      ctx.fillStyle = '#2d5a3c';
      ctx.fillRect(4, 4, 30, 15);
      ctx.fillRect(8, 1, 22, 5);
      ctx.fillStyle = '#4d7c5b';
      ctx.fillRect(6, 5, 24, 9);
      // Hanging branch + Ông Diểu's folded coat!
      ctx.fillStyle = '#5c4033';
      ctx.fillRect(24, 17, 10, 3);
      ctx.fillStyle = '#465945';
      ctx.fillRect(28, 20, 5, 7);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(29, 22, 3, 1);
      return m.c;
    }

    if (id === 'khime') {
      var m2 = makeCanvas(24, 28);
      var ctx2 = m2.ctx;
      // Mossy boulder pedestal
      ctx2.fillStyle = '#64748b';
      ctx2.fillRect(3, 18, 18, 10);
      ctx2.fillStyle = '#4d7c5b';
      ctx2.fillRect(3, 17, 18, 3);
      var rows = [
        '......BBBBBB......',
        '....BBbFFFFbBB....',
        '....BBFEFFEFBB....',
        '.....BBFFFFBB.....',
        '.....BBBBBBBB.RR..',
        '....BBBBBBBBBBrr..',
        '....BBB....BBB....',
        '....BBB....BBB.bb.',
        '.....bb....bb.bb..'
      ];
      drawMatrix(ctx2, rows, {
        'B': '#854d27', 'b': '#5c3317', 'F': '#eab896', 'E': '#18181b', 'R': '#ef4444', 'r': '#991b1b'
      }, 2, 8);
      return m2.c;
    }

    if (id === 'thiep') {
      var m3 = makeCanvas(26, 30);
      var ctx3 = m3.ctx;
      // Flat sitting stone
      ctx3.fillStyle = '#6b7280';
      ctx3.fillRect(3, 21, 20, 9);
      ctx3.fillStyle = '#4b5563';
      ctx3.fillRect(5, 24, 16, 6);
      var rows3 = [
        '.......HHHHHH.......',
        '......HHHHHHHH......',
        '......HSSSSSSH......',
        '......SGGGGGGS......',
        '......SSSSSSSS......',
        '.......ssssss.......',
        '.....CCCCCCCCCC.....',
        '....CCCCCCCCCCCC.WW.',
        '....CCCCcCCCCCCc.WW.',
        '.....PPPPPPPPPP.....',
        '.....PPP....PPP.....',
        '.....EEE....EEE.....'
      ];
      drawMatrix(ctx3, rows3, {
        'H': '#27272a', 'S': '#eac096', 's': '#c69468', 'G': '#e2e8f0',
        'C': '#78350f', 'c': '#92400e', 'W': '#f8fafc', 'P': '#1e293b', 'E': '#0f172a'
      }, 2, 10);
      // Steam above teacup
      ctx3.fillStyle = 'rgba(255,255,255,0.75)';
      ctx3.fillRect(20, 14, 1, 2);
      ctx3.fillRect(21, 11, 1, 2);
      return m3.c;
    }

    // Linh Hồn Hoa Tử Huyền
    var m4 = makeCanvas(24, 30);
    var ctx4 = m4.ctx;
    ctx4.fillStyle = 'rgba(224, 242, 254, 0.35)';
    ctx4.fillRect(4, 3, 16, 22);
    var rows4 = [
      '.........WW.........',
      '.......WWWWWW.......',
      '.....WWWWWWWWWW.....',
      '......WWYYYYWW......',
      '.......WWWWWW.......',
      '......CCCCCCCC......',
      '.....CCCCCCCCCC.....',
      '.....CCcCCCCcCC.....',
      '......CCCCCCCC......',
      '.......CC..CC.......',
      '....WW..C..C..WW....',
      '...WWWW......WWWW...'
    ];
    drawMatrix(ctx4, rows4, {
      'W': '#ffffff', 'Y': '#fef08a', 'C': '#bae6fd', 'c': '#38bdf8'
    }, 2, 5);
    return m4.c;
  }

  function buildSprites() {
    var boulder = makeCanvas(16, 16);
    drawMatrix(boulder.ctx, [
      '....GGGGGGGG....',
      '..GGGGggggGGGG..',
      '.GGGggggggggGGG.',
      '.GGggDDDDDDggGG.',
      'GGGgDDDDDDDDgGGG',
      'GGGgDDDDDDDDgGGG',
      'GGGggDDDDDDggGGG',
      '.GGGggggggggGGG.',
      '..GGGGddddGGGG..',
      '....GGGGGGGG....'
    ], { 'G': '#57534e', 'g': '#78716c', 'D': '#a8a29e', 'd': '#44403c' }, 0, 3);

    var thorns = makeCanvas(20, 14);
    drawMatrix(thorns.ctx, [
      '..R....R....R....R..',
      '.TGT..TGT..TGT..TGT.',
      '.TTT..TTT..TTT..TTT.',
      'TTTTGTTTTGTTTTGTTTTG',
      'TTTTTTTTTTTTTTTTTTTT',
      'gggggggggggggggggggg'
    ], { 'R': '#dc2626', 'T': '#365314', 'G': '#65a30d', 'g': '#1a2e05' }, 0, 8);

    var mound = makeCanvas(18, 16);
    drawMatrix(mound.ctx, [
      '.......RRRR.......',
      '......RRRRRR......',
      '....RRRRrRRRRR....',
      '...RRRRrrrRRRRR...',
      '..RRRRrrrrrRRRRR..',
      '.RRRRRrrrrrrRRRRR.',
      'RRRRddddddddddRRRR'
    ], { 'R': '#9a3412', 'r': '#c2410c', 'd': '#7c2d12' }, 0, 9);

    var herb = makeCanvas(14, 14);
    drawMatrix(herb.ctx, [
      '......GG......',
      '....GGGGGG....',
      '..GGGggggGGG..',
      '..GGgWWWWgGG..',
      '...GGgWWgGG...',
      '....GGGGGG....',
      '......bb......'
    ], { 'G': '#4ade80', 'g': '#16a34a', 'W': '#dcfce7', 'b': '#854d0e' }, 0, 3);

    var flower = makeCanvas(16, 16);
    drawMatrix(flower.ctx, [
      '.......WW.......',
      '.....WWWWWW.....',
      '...WWWWYYWWWW...',
      '....WWWWWWWW....',
      '......GGGG......',
      '....GGGGGGGG....',
      '......GGGG......'
    ], { 'W': '#ffffff', 'Y': '#fde047', 'G': '#34d399' }, 0, 4);

    var tree = makeCanvas(44, 62);
    var tctx = tree.ctx;
    tctx.fillStyle = '#5c4033';
    tctx.fillRect(19, 30, 6, 32);
    tctx.fillRect(16, 56, 12, 6);
    tctx.fillStyle = '#3f2b22';
    tctx.fillRect(22, 32, 3, 30);
    // Layered pixel foliage (inspired by reference screenshot's lush pixel trees)
    tctx.fillStyle = '#2d4f38';
    tctx.fillRect(6, 14, 32, 20);
    tctx.fillRect(11, 6, 22, 12);
    tctx.fillStyle = '#477653';
    tctx.fillRect(8, 12, 28, 15);
    tctx.fillRect(13, 5, 18, 9);
    tctx.fillStyle = '#689f71';
    tctx.fillRect(11, 10, 20, 8);
    // Ripe dâu da fruit clusters
    tctx.fillStyle = '#f97316';
    tctx.fillRect(14, 26, 2, 2);
    tctx.fillRect(27, 24, 2, 2);
    tctx.fillRect(20, 28, 2, 2);

    return {
      dieu: {
        idle: buildDieuFrame('idle'),
        run: [buildDieuFrame('run1'), buildDieuFrame('run2'), buildDieuFrame('run3'), buildDieuFrame('run2')],
        jump: buildDieuFrame('jump')
      },
      coin: buildCoinFrames(),
      monkeyTrapped: buildMonkeySprite(false),
      monkeyRescued: buildMonkeySprite(true),
      npcs: {
        duoi: buildNpcSprite('duoi'),
        khime: buildNpcSprite('khime'),
        thiep: buildNpcSprite('thiep'),
        tuhuyen: buildNpcSprite('tuhuyen')
      },
      boulder: boulder.c,
      thorns: thorns.c,
      mound: mound.c,
      herb: herb.c,
      flower: flower.c,
      tree: tree.c
    };
  }

  function PixelSfx() {
    this.ctx = null;
    this.muted = false;
  }

  PixelSfx.prototype.ensure = function () {
    if (this.muted) return null;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!this.ctx) this.ctx = new Ctx();
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(function () {});
    return this.ctx;
  };

  PixelSfx.prototype.beep = function (freq0, freq1, dur, type, vol) {
    var ctx = this.ensure();
    if (!ctx) return;
    var now = ctx.currentTime;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq0, now);
    if (freq1) o.frequency.exponentialRampToValueAtTime(freq1, now + dur);
    g.gain.setValueAtTime(vol || 0.08, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(now);
    o.stop(now + dur + 0.01);
  };

  PixelSfx.prototype.coin = function (combo) {
    var boost = Math.min(320, (combo || 0) * 18);
    this.beep(880 + boost, 1320 + boost, 0.09, 'triangle', 0.09);
  };

  PixelSfx.prototype.jump = function (isDouble) {
    this.beep(isDouble ? 340 : 240, isDouble ? 660 : 480, 0.12, 'square', 0.06);
  };

  PixelSfx.prototype.dash = function () {
    this.beep(520, 180, 0.11, 'sawtooth', 0.06);
  };

  PixelSfx.prototype.rescue = function () {
    var self = this;
    this.beep(523, 659, 0.1, 'triangle', 0.1);
    setTimeout(function () { self.beep(659, 1046, 0.18, 'triangle', 0.11); }, 90);
  };

  PixelSfx.prototype.hurt = function () {
    this.beep(190, 75, 0.2, 'sawtooth', 0.1);
  };

  window.MuoiCuaRung.buildEasterSprites = buildSprites;
  window.MuoiCuaRung.PixelSfx = PixelSfx;
})();
