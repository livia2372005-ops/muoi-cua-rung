window.MuoiCuaRung = window.MuoiCuaRung || {};

(function () {
  var BOOK_W = 0.78;
  var BOOK_H = 1.248; // matches 440 / 704 aspect ratio
  var BOOK_THICK = 0.085;
  var TABLE_Y = 0.78;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Generates a procedural walnut wood grain CanvasTexture without external files.
   */
  function createWoodTexture(baseHex, streakHex, width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width || 512;
    canvas.height = height || 512;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = baseHex || '#4e3120';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle longitudinal planks and organic grain
    for (var i = 0; i < 160; i++) {
      var y = (i / 160) * canvas.height;
      var h = 2 + (i % 5);
      ctx.fillStyle = i % 3 === 0 ? 'rgba(24, 12, 6, 0.11)' : streakHex || 'rgba(138, 92, 56, 0.08)';
      ctx.fillRect(0, y, canvas.width, h);
    }

    for (var p = 0; p < 8; p++) {
      var seamY = Math.floor((p / 8) * canvas.height);
      ctx.fillStyle = 'rgba(18, 9, 4, 0.25)';
      ctx.fillRect(0, seamY, canvas.width, 2);
    }

    var tex = new window.THREE.CanvasTexture(canvas);
    tex.wrapS = window.THREE.RepeatWrapping;
    tex.wrapT = window.THREE.RepeatWrapping;
    if ('encoding' in tex && window.THREE.sRGBEncoding) {
      tex.encoding = window.THREE.sRGBEncoding;
    }
    return tex;
  }

  /**
   * Generates a stacked paper page-edge texture (cream Dó paper ridges).
   */
  function createPageEdgeTexture(horizontal) {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#efe3cb';
    ctx.fillRect(0, 0, 256, 256);

    for (var i = 0; i < 256; i += 3) {
      ctx.fillStyle = i % 6 === 0 ? '#cdb996' : '#e6d7b9';
      if (horizontal) ctx.fillRect(0, i, 256, 1.5);
      else ctx.fillRect(i, 0, 1.5, 256);
    }

    var tex = new window.THREE.CanvasTexture(canvas);
    if ('encoding' in tex && window.THREE.sRGBEncoding) {
      tex.encoding = window.THREE.sRGBEncoding;
    }
    return tex;
  }

  /**
   * Generates a soft radial/directional sunbeam alpha texture for volumetric shafts.
   */
  function createSunbeamTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');

    var vGrad = ctx.createLinearGradient(0, 0, 0, 512);
    vGrad.addColorStop(0, 'rgba(255, 240, 200, 0.42)');
    vGrad.addColorStop(0.55, 'rgba(255, 232, 182, 0.16)');
    vGrad.addColorStop(1, 'rgba(255, 224, 165, 0)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, 256, 512);

    var hGrad = ctx.createLinearGradient(0, 0, 256, 0);
    hGrad.addColorStop(0, 'rgba(0,0,0,1)');
    hGrad.addColorStop(0.25, 'rgba(0,0,0,0.2)');
    hGrad.addColorStop(0.5, 'rgba(0,0,0,0)');
    hGrad.addColorStop(0.75, 'rgba(0,0,0,0.2)');
    hGrad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 0, 256, 512);

    return new window.THREE.CanvasTexture(canvas);
  }

  /**
   * Builds the high-res 3D front cover CanvasTexture from inline base64 art + title typography.
   */
  function createBookCoverTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 960;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1b2b25';
    ctx.fillRect(0, 0, 600, 960);

    var tex = new window.THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    if ('encoding' in tex && window.THREE.sRGBEncoding) {
      tex.encoding = window.THREE.sRGBEncoding;
    }

    function paintCoverOverlay() {
      // Top warm cream header readability glow
      var topGrad = ctx.createLinearGradient(0, 0, 0, 260);
      topGrad.addColorStop(0, 'rgba(250, 244, 230, 0.88)');
      topGrad.addColorStop(0.6, 'rgba(250, 244, 230, 0.45)');
      topGrad.addColorStop(1, 'rgba(250, 244, 230, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, 600, 260);

      // Spine hinge shadow & gold foil edge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, 14, 960);
      ctx.fillStyle = 'rgba(218, 182, 114, 0.55)';
      ctx.fillRect(15, 0, 2, 960);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#46574c';
      ctx.font = '700 16px "Be Vietnam Pro", sans-serif';
      ctx.fillText('NGỮ VĂN 12  •  ẤN BẢN SÁCH ĐIỆN TỬ', 306, 58);

      ctx.fillStyle = '#182422';
      ctx.font = '800 66px "Playfair Display", Georgia, serif';
      ctx.fillText('MUỐI', 306, 126);

      ctx.font = '700 48px "Playfair Display", Georgia, serif';
      ctx.fillText('CỦA RỪNG', 306, 180);

      ctx.strokeStyle = 'rgba(158, 83, 62, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(212, 204);
      ctx.lineTo(286, 204);
      ctx.moveTo(326, 204);
      ctx.lineTo(400, 204);
      ctx.stroke();

      ctx.fillStyle = '#9e533e';
      ctx.font = '700 18px Georgia, serif';
      ctx.fillText('✦', 306, 210);

      ctx.fillStyle = '#843a25';
      ctx.font = 'italic 600 28px "Lora", Georgia, serif';
      ctx.fillText('Nguyễn Huy Thiệp', 306, 246);

      // Bottom dark obi band
      var botGrad = ctx.createLinearGradient(0, 790, 0, 960);
      botGrad.addColorStop(0, 'rgba(18, 28, 25, 0)');
      botGrad.addColorStop(0.45, 'rgba(18, 28, 25, 0.82)');
      botGrad.addColorStop(1, 'rgba(14, 22, 19, 0.96)');
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, 790, 600, 170);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#d3b279';
      ctx.font = '700 14px "Be Vietnam Pro", sans-serif';
      ctx.fillText('THỰC HIỆN', 42, 886);

      ctx.fillStyle = '#f6efe0';
      ctx.font = '700 28px "Playfair Display", Georgia, serif';
      ctx.fillText('NHÓM 3', 42, 922);

      // Brass pill button hint
      ctx.strokeStyle = 'rgba(201, 156, 88, 0.78)';
      ctx.fillStyle = 'rgba(34, 54, 46, 0.92)';
      ctx.lineWidth = 2;
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(386, 876, 172, 46, 23);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(386, 876, 172, 46);
        ctx.strokeRect(386, 876, 172, 46);
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f9f3e5';
      ctx.font = '600 18px "Be Vietnam Pro", sans-serif';
      ctx.fillText('Mở sách đọc →', 472, 905);

      tex.needsUpdate = true;
    }

    var loadedImg = null;
    paintCoverOverlay();

    function repaintWithFonts() {
      if (loadedImg) ctx.drawImage(loadedImg, 0, 0, 600, 960);
      paintCoverOverlay();
    }

    var dataUri = window.MuoiCuaRung.COVER_DATA_URI;
    if (dataUri) {
      var img = new Image();
      img.onload = function () {
        loadedImg = img;
        repaintWithFonts();
      };
      img.src = dataUri;
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        repaintWithFonts();
      });
    }

    return tex;
  }

  /**
   * Builds spine cloth texture with vertical gold embossed lettering.
   */
  function createSpineTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 1024;
    var ctx = canvas.getContext('2d');

    var grad = ctx.createLinearGradient(0, 0, 128, 0);
    grad.addColorStop(0, '#121d18');
    grad.addColorStop(0.5, '#22372e');
    grad.addColorStop(1, '#101a16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 1024);

    ctx.fillStyle = '#d4af6e';
    ctx.fillRect(14, 48, 100, 4);
    ctx.fillRect(14, 972, 100, 4);

    ctx.save();
    ctx.translate(64, 500);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e7c98d';
    ctx.font = '700 28px "Playfair Display", Georgia, serif';
    ctx.fillText('MUỐI CỦA RỪNG   •   NGUYỄN HUY THIỆP', 0, 0);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#d4af6e';
    ctx.font = '700 20px "Be Vietnam Pro", sans-serif';
    ctx.fillText('NHÓM 3', 64, 932);

    var tex = new window.THREE.CanvasTexture(canvas);
    if ('encoding' in tex && window.THREE.sRGBEncoding) {
      tex.encoding = window.THREE.sRGBEncoding;
    }
    return tex;
  }

  /**
   * Builds misty Nam Xung limestone mountain backdrop seen through the window.
   */
  function createMountainSkyTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    var ctx = canvas.getContext('2d');

    var sky = ctx.createLinearGradient(0, 0, 0, 768);
    sky.addColorStop(0, '#fff5dc');
    sky.addColorStop(0.38, '#f7e6c4');
    sky.addColorStop(0.7, '#d8e3db');
    sky.addColorStop(1, '#a9bdb2');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1024, 768);

    // Warm morning sun glow
    var sun = ctx.createRadialGradient(340, 190, 20, 340, 190, 300);
    sun.addColorStop(0, 'rgba(255, 250, 224, 0.96)');
    sun.addColorStop(0.4, 'rgba(255, 232, 178, 0.45)');
    sun.addColorStop(1, 'rgba(255, 220, 160, 0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, 1024, 768);

    // Distant limestone peaks
    var layers = [
      { color: '#9ab0a7', pts: [[0, 560], [130, 340], [260, 460], [410, 270], [560, 440], [720, 295], [880, 410], [1024, 310], [1024, 768], [0, 768]] },
      { color: '#6b857b', pts: [[0, 620], [90, 430], [210, 540], [340, 380], [480, 520], [630, 370], [790, 510], [940, 420], [1024, 520], [1024, 768], [0, 768]] },
      { color: '#395246', pts: [[0, 690], [160, 575], [310, 650], [490, 540], [670, 620], [870, 565], [1024, 650], [1024, 768], [0, 768]] },
    ];
    layers.forEach(function (layer) {
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.moveTo(layer.pts[0][0], layer.pts[0][1]);
      for (var i = 1; i < layer.pts.length; i++) {
        ctx.lineTo(layer.pts[i][0], layer.pts[i][1]);
      }
      ctx.closePath();
      ctx.fill();
    });

    // Soft valley mist band
    var mist = ctx.createLinearGradient(0, 450, 0, 680);
    mist.addColorStop(0, 'rgba(246, 242, 232, 0)');
    mist.addColorStop(0.5, 'rgba(246, 242, 232, 0.36)');
    mist.addColorStop(1, 'rgba(246, 242, 232, 0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 450, 1024, 230);

    var tex = new window.THREE.CanvasTexture(canvas);
    if ('encoding' in tex && window.THREE.sRGBEncoding) {
      tex.encoding = window.THREE.sRGBEncoding;
    }
    return tex;
  }

  function ReadingRoom3D(options) {
    this.canvas = options.canvas;
    this.onRequestOpenBook = options.onRequestOpenBook;
    this.supported = false;
    this.sceneState = 'desk'; // 'desk' | 'lifting' | 'reading' | 'returning'
    this.animProgress = 0;
    this.hovered = false;
    this.pointer = { x: 0, y: 0 };
    this.pointerNdc = new window.THREE.Vector2(0, 0);
    this.rafId = null;
    this.clock = new window.THREE.Clock();

    this.init();
  }

  ReadingRoom3D.prototype.init = function () {
    var THREE = window.THREE;
    if (!THREE || !this.canvas) return;

    var isMobile =
      window.innerWidth <= 820 ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    this.isMobile = isMobile;

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: !isMobile,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      return;
    }

    this.supported = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if ('outputEncoding' in this.renderer && THREE.sRGBEncoding) {
      this.renderer.outputEncoding = THREE.sRGBEncoding;
    }
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1b140f);
    this.scene.fog = new THREE.FogExp2(0x1b140f, 0.055);

    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 40);
    this.raycaster = new THREE.Raycaster();

    this.buildLights();
    this.buildRoomAndWindow();
    this.buildDeskAndProps();
    this.buildBook3D();
    this.buildSunbeamsAndDust();

    this.updateResponsiveCameraPreset();
    this.camera.position.copy(this.camDeskPos);
    this.camera.lookAt(this.camDeskLook);

    this.bindEvents();
    this.startLoop();
  };

  ReadingRoom3D.prototype.buildLights = function () {
    var THREE = window.THREE;

    // Warm indoor ambient & oak bounce fill
    var hemi = new THREE.HemisphereLight(0xffebd0, 0x3b2618, 0.72);
    this.scene.add(hemi);

    // Subtle interior study lamp fill from right-above
    var roomFill = new THREE.PointLight(0xffddb0, 0.52, 9);
    roomFill.position.set(1.8, 3.1, 2.2);
    this.scene.add(roomFill);

    // Primary morning sun streaming diagonally through the left window (x = -2.1)
    this.sunLight = new THREE.DirectionalLight(0xffe7bd, 2.35);
    this.sunLight.position.set(-5.8, 4.15, 1.35);
    this.sunLight.target.position.set(0.15, TABLE_Y, 0.2);
    var shadowRes = this.isMobile ? 1024 : 2048;
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = shadowRes;
    this.sunLight.shadow.mapSize.height = shadowRes;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 14;
    this.sunLight.shadow.camera.left = -2.6;
    this.sunLight.shadow.camera.right = 2.6;
    this.sunLight.shadow.camera.top = 2.6;
    this.sunLight.shadow.camera.bottom = -2.6;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  };

  ReadingRoom3D.prototype.buildRoomAndWindow = function () {
    var THREE = window.THREE;
    var room = new THREE.Group();

    var floorTex = createWoodTexture('#2e1c12', 'rgba(18, 9, 4, 0.16)', 512, 512);
    floorTex.repeat.set(4, 4);
    var floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85, metalness: 0.05 });
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.35;
    floor.receiveShadow = true;
    room.add(floor);

    var wallMat = new THREE.MeshStandardMaterial({ color: 0x3b3129, roughness: 0.92, metalness: 0.02 });
    var wainscotMat = new THREE.MeshStandardMaterial({
      map: createWoodTexture('#3a2417', 'rgba(20, 10, 5, 0.14)', 256, 256),
      roughness: 0.78,
    });

    // Back wall (z = -1.65)
    var backWall = new THREE.Mesh(new THREE.BoxGeometry(10.5, 4.8, 0.14), wallMat);
    backWall.position.set(1.2, 2.05, -1.72);
    backWall.receiveShadow = true;
    room.add(backWall);

    var backWainscot = new THREE.Mesh(new THREE.BoxGeometry(10.5, 1.25, 0.17), wainscotMat);
    backWainscot.position.set(1.2, 0.27, -1.7);
    backWainscot.receiveShadow = true;
    room.add(backWainscot);

    // Subtle framed literary landscape calligraphy scroll on back wall behind the table
    var frameGroup = new THREE.Group();
    var frameOuter = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 1.15, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.65 })
    );
    var scrollCanvas = document.createElement('canvas');
    scrollCanvas.width = 256;
    scrollCanvas.height = 340;
    var sctx = scrollCanvas.getContext('2d');
    sctx.fillStyle = '#e7dcc5';
    sctx.fillRect(0, 0, 256, 340);
    sctx.fillStyle = 'rgba(42, 60, 52, 0.25)';
    sctx.beginPath();
    sctx.moveTo(0, 260);
    sctx.lineTo(68, 175);
    sctx.lineTo(132, 232);
    sctx.lineTo(192, 148);
    sctx.lineTo(256, 224);
    sctx.lineTo(256, 340);
    sctx.lineTo(0, 340);
    sctx.closePath();
    sctx.fill();
    sctx.fillStyle = 'rgba(28, 42, 36, 0.34)';
    sctx.beginPath();
    sctx.moveTo(0, 295);
    sctx.lineTo(95, 225);
    sctx.lineTo(175, 268);
    sctx.lineTo(256, 210);
    sctx.lineTo(256, 340);
    sctx.lineTo(0, 340);
    sctx.closePath();
    sctx.fill();
    sctx.strokeStyle = 'rgba(143, 61, 40, 0.55)';
    sctx.strokeRect(26, 28, 18, 28);
    sctx.fillStyle = 'rgba(143, 61, 40, 0.65)';
    sctx.fillRect(29, 32, 12, 20);
    sctx.fillStyle = '#26342e';
    sctx.font = 'italic 600 20px Georgia, serif';
    sctx.textAlign = 'center';
    sctx.fillText('Xuân Sơn', 132, 76);
    var scrollTex = new THREE.CanvasTexture(scrollCanvas);
    if ('encoding' in scrollTex && THREE.sRGBEncoding) scrollTex.encoding = THREE.sRGBEncoding;

    var framePaper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.76, 0.98),
      new THREE.MeshStandardMaterial({ map: scrollTex, roughness: 0.92 })
    );
    framePaper.position.z = 0.022;
    frameGroup.add(frameOuter, framePaper);
    frameGroup.position.set(0.68, 2.08, -1.62);
    room.add(frameGroup);

    // Left Window Wall at x = -2.05 with real opening: z in [-1.15, 1.15], y in [0.95, 2.75]
    var winX = -2.05;
    var winFrameMat = new THREE.MeshStandardMaterial({
      map: createWoodTexture('#523421', 'rgba(22, 12, 6, 0.18)', 256, 256),
      roughness: 0.64,
      metalness: 0.06,
    });

    // Wall segments around window opening (with castShadow=true so sunlight streams strictly through the window!)
    var segBottom = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.32, 6.4), wainscotMat);
    segBottom.position.set(winX, 0.31, 0.1);
    segBottom.castShadow = true;
    segBottom.receiveShadow = true;

    var segTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.65, 6.4), wallMat);
    segTop.position.set(winX, 3.57, 0.1);
    segTop.castShadow = true;

    var segBack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.82, 2.1), wallMat);
    segBack.position.set(winX, 1.85, -2.2);
    segBack.castShadow = true;

    var segFront = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.82, 2.2), wallMat);
    segFront.position.set(winX, 1.85, 2.25);
    segFront.castShadow = true;

    room.add(segBottom, segTop, segBack, segFront);

    // Window Sill & Outer Trim Box
    var sill = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.07, 2.48), winFrameMat);
    sill.position.set(winX + 0.08, 0.96, 0);
    sill.castShadow = true;
    sill.receiveShadow = true;
    room.add(sill);

    var headerTrim = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 2.46), winFrameMat);
    headerTrim.position.set(winX + 0.04, 2.76, 0);
    headerTrim.castShadow = true;
    room.add(headerTrim);

    [-1.16, 1.16].forEach(function (pz) {
      var sidePost = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.82, 0.09), winFrameMat);
      sidePost.position.set(winX + 0.04, 1.86, pz);
      sidePost.castShadow = true;
      room.add(sidePost);
    });

    // Center mullion post (casts subtle crossbar shadow across tabletop)
    var centerMullion = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.76, 0.055), winFrameMat);
    centerMullion.position.set(winX, 1.86, 0);
    centerMullion.castShadow = true;
    room.add(centerMullion);

    // Two hinged casement sashes swung gently open
    function buildSash(widthZ, hingeZ, openAngle) {
      var pivot = new THREE.Group();
      pivot.position.set(winX + 0.06, 1.86, hingeZ);
      pivot.rotation.y = openAngle;

      var dirZ = hingeZ < 0 ? 1 : -1;
      var sashBarH = 1.72;
      var railThick = 0.05;

      var topRail = new THREE.Mesh(new THREE.BoxGeometry(0.045, railThick, widthZ), winFrameMat);
      topRail.position.set(0, sashBarH / 2 - railThick / 2, dirZ * (widthZ / 2));
      var botRail = new THREE.Mesh(new THREE.BoxGeometry(0.045, railThick, widthZ), winFrameMat);
      botRail.position.set(0, -sashBarH / 2 + railThick / 2, dirZ * (widthZ / 2));
      var outerStile = new THREE.Mesh(new THREE.BoxGeometry(0.045, sashBarH, railThick), winFrameMat);
      outerStile.position.set(0, 0, dirZ * (widthZ - railThick / 2));
      var hingeStile = new THREE.Mesh(new THREE.BoxGeometry(0.045, sashBarH, railThick), winFrameMat);
      hingeStile.position.set(0, 0, dirZ * (railThick / 2));
      var midBar = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.032, widthZ - 0.06), winFrameMat);
      midBar.position.set(0, 0.06, dirZ * (widthZ / 2));

      var glassMat = new THREE.MeshPhysicalMaterial
        ? new THREE.MeshStandardMaterial({
            color: 0xeef5ef,
            transparent: true,
            opacity: 0.16,
            roughness: 0.12,
            metalness: 0.1,
          })
        : new THREE.MeshBasicMaterial({ color: 0xeef5ef, transparent: true, opacity: 0.14 });
      var glass = new THREE.Mesh(new THREE.BoxGeometry(0.01, sashBarH - 0.1, widthZ - 0.1), glassMat);
      glass.position.set(0, 0, dirZ * (widthZ / 2));

      [topRail, botRail, outerStile, hingeStile, midBar].forEach(function (m) {
        m.castShadow = true;
      });
      pivot.add(topRail, botRail, outerStile, hingeStile, midBar, glass);
      return pivot;
    }

    room.add(buildSash(1.06, -1.11, 0.56));
    room.add(buildSash(1.06, 1.11, -0.46));

    // Soft linen curtain draped on far edge of window
    var curtainMat = new THREE.MeshStandardMaterial({
      color: 0xe8dec9,
      roughness: 0.92,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
    });
    this.curtainMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 2.02, 8, 8), curtainMat);
    this.curtainMesh.position.set(winX + 0.18, 1.88, -1.02);
    this.curtainMesh.rotation.y = Math.PI / 2 - 0.18;
    room.add(this.curtainMesh);

    // Outdoor mountain backdrop plane outside window (emissive so always brightly lit like morning outdoors)
    var outdoorTex = createMountainSkyTexture();
    var outdoorMat = new THREE.MeshBasicMaterial({ map: outdoorTex });
    var outdoorPlane = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 4.4), outdoorMat);
    outdoorPlane.position.set(winX - 2.35, 1.95, 0.05);
    outdoorPlane.rotation.y = Math.PI / 2;
    room.add(outdoorPlane);

    this.scene.add(room);
  };

  ReadingRoom3D.prototype.buildDeskAndProps = function () {
    var THREE = window.THREE;
    var desk = new THREE.Group();

    var oakTex = createWoodTexture('#5e3b24', 'rgba(28, 15, 7, 0.15)', 512, 512);
    oakTex.repeat.set(2, 1.5);
    var tableMat = new THREE.MeshStandardMaterial({
      map: oakTex,
      roughness: 0.56,
      metalness: 0.04,
    });
    var trimMat = new THREE.MeshStandardMaterial({
      map: createWoodTexture('#452a19', 'rgba(18, 9, 4, 0.2)', 256, 256),
      roughness: 0.66,
    });

    // Main tabletop (x: -1.45 .. +1.95, z: -1.05 .. +1.25, top face y = TABLE_Y)
    var topPlate = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.09, 2.3), tableMat);
    topPlate.position.set(0.25, TABLE_Y - 0.045, 0.1);
    topPlate.castShadow = true;
    topPlate.receiveShadow = true;
    desk.add(topPlate);

    var apron = new THREE.Mesh(new THREE.BoxGeometry(3.16, 0.11, 2.08), trimMat);
    apron.position.set(0.25, TABLE_Y - 0.145, 0.1);
    apron.castShadow = true;
    desk.add(apron);

    // Four tapered wooden legs resting on floor (y = -0.35)
    var legHeight = TABLE_Y - 0.09 - (-0.35);
    var legGeo = new THREE.BoxGeometry(0.11, legHeight, 0.11);
    [
      [-1.24, -0.84],
      [1.74, -0.84],
      [-1.24, 1.04],
      [1.74, 1.04],
    ].forEach(function (pos) {
      var leg = new THREE.Mesh(legGeo, trimMat);
      leg.position.set(pos[0], -0.35 + legHeight / 2, pos[1]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      desk.add(leg);
    });

    // Brass bookmark ribbon & plate resting beside book
    var brassMat = new THREE.MeshStandardMaterial({ color: 0xc29552, roughness: 0.35, metalness: 0.72 });
    var bookmark = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.006, 0.34), brassMat);
    bookmark.position.set(0.76, TABLE_Y + 0.004, 0.44);
    bookmark.rotation.y = -0.22;
    bookmark.castShadow = true;
    desk.add(bookmark);

    // Celadon ceramic teacup on wooden saucer (right-rear corner of desk)
    var teaGroup = new THREE.Group();
    teaGroup.position.set(1.18, TABLE_Y, -0.42);
    var saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.02, 24), trimMat);
    saucer.position.y = 0.01;
    saucer.castShadow = true;
    saucer.receiveShadow = true;

    var cupMat = new THREE.MeshStandardMaterial({ color: 0x738d80, roughness: 0.28, metalness: 0.08 });
    var cup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.062, 0.11, 24), cupMat);
    cup.position.y = 0.072;
    cup.castShadow = true;

    var teaSurface = new THREE.Mesh(
      new THREE.CircleGeometry(0.072, 20),
      new THREE.MeshStandardMaterial({ color: 0x8b4c24, roughness: 0.15 })
    );
    teaSurface.rotation.x = -Math.PI / 2;
    teaSurface.position.y = 0.128;

    teaGroup.add(saucer, cup, teaSurface);
    desk.add(teaGroup);

    // Small ceramic vase with forest leaves & tiny white Hoa Tu Huyen blossoms near the sunlit window side
    var vaseGroup = new THREE.Group();
    vaseGroup.position.set(-0.92, TABLE_Y, -0.44);
    var vase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.095, 0.24, 20),
      new THREE.MeshStandardMaterial({ color: 0xd9cdb8, roughness: 0.65 })
    );
    vase.position.y = 0.12;
    vase.castShadow = true;
    vaseGroup.add(vase);

    var stemMat = new THREE.MeshStandardMaterial({ color: 0x2e4a38, roughness: 0.8 });
    var blossomMat = new THREE.MeshStandardMaterial({ color: 0xf7f8f2, roughness: 0.45 });
    for (var s = 0; s < 5; s++) {
      var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.007, 0.34, 8), stemMat);
      var angle = (s / 5) * Math.PI * 2;
      stem.position.set(Math.cos(angle) * 0.03, 0.34, Math.sin(angle) * 0.03);
      stem.rotation.z = (s - 2) * 0.14;
      stem.rotation.x = (s % 2 === 0 ? 1 : -1) * 0.12;
      stem.castShadow = true;
      vaseGroup.add(stem);

      var flower = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), blossomMat);
      flower.position.set(stem.position.x * 2.2, 0.49 + (s % 2) * 0.03, stem.position.z * 2.2);
      vaseGroup.add(flower);
    }
    desk.add(vaseGroup);

    this.scene.add(desk);
  };

  ReadingRoom3D.prototype.buildBook3D = function () {
    var THREE = window.THREE;
    this.bookGroup = new THREE.Group();

    // Resting position & rotation on tabletop (facing upward toward viewer & catching window light)
    this.bookRestPos = new THREE.Vector3(0.06, TABLE_Y + BOOK_THICK / 2 + 0.002, 0.26);
    this.bookRestQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-Math.PI / 2, 0, -0.26, 'YXZ')
    );

    this.bookGroup.position.copy(this.bookRestPos);
    this.bookGroup.quaternion.copy(this.bookRestQuat);

    var coverTex = createBookCoverTexture();
    var spineTex = createSpineTexture();
    var pageVTex = createPageEdgeTexture(false);
    var pageHTex = createPageEdgeTexture(true);

    var clothMat = new THREE.MeshStandardMaterial({ color: 0x192a23, roughness: 0.72, metalness: 0.08 });
    var spineMat = new THREE.MeshStandardMaterial({ map: spineTex, roughness: 0.62, metalness: 0.12 });
    var frontMat = new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.48, metalness: 0.05 });
    var pageVMat = new THREE.MeshStandardMaterial({ map: pageVTex, roughness: 0.88 });
    var pageHMat = new THREE.MeshStandardMaterial({ map: pageHTex, roughness: 0.88 });

    // Front cover board (+Z face in local book frame -> faces UP when rotated -PI/2 around X)
    var boardThick = 0.012;
    var frontBoard = new THREE.Mesh(
      new THREE.BoxGeometry(BOOK_W, BOOK_H, boardThick),
      [clothMat, clothMat, clothMat, clothMat, frontMat, clothMat]
    );
    frontBoard.position.set(0, 0, BOOK_THICK / 2 - boardThick / 2);
    frontBoard.castShadow = true;
    frontBoard.receiveShadow = true;

    // Back cover board
    var backBoard = new THREE.Mesh(new THREE.BoxGeometry(BOOK_W, BOOK_H, boardThick), clothMat);
    backBoard.position.set(0, 0, -BOOK_THICK / 2 + boardThick / 2);
    backBoard.castShadow = true;
    backBoard.receiveShadow = true;

    // Inner cream page block (slightly inset from hardcover overhang)
    var pageBlock = new THREE.Mesh(
      new THREE.BoxGeometry(BOOK_W - 0.025, BOOK_H - 0.032, BOOK_THICK - boardThick * 1.9),
      [pageVMat, clothMat, pageHMat, pageHMat, pageVMat, pageVMat]
    );
    pageBlock.position.set(0.008, 0, 0);
    pageBlock.castShadow = true;
    pageBlock.receiveShadow = true;

    // Left spine slab (-X edge)
    var spineMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, BOOK_H, BOOK_THICK),
      [clothMat, spineMat, clothMat, clothMat, clothMat, clothMat]
    );
    spineMesh.position.set(-BOOK_W / 2 + 0.005, 0, 0);
    spineMesh.castShadow = true;
    spineMesh.receiveShadow = true;

    // Invisible slightly padded touch hitbox so tapping the book on small mobile screens never misses
    var touchHitPad = new THREE.Mesh(
      new THREE.BoxGeometry(BOOK_W * 1.36, BOOK_H * 1.24, BOOK_THICK * 1.6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );

    this.bookHitMeshes = [touchHitPad, frontBoard, backBoard, pageBlock, spineMesh];
    this.bookGroup.add(touchHitPad, frontBoard, backBoard, pageBlock, spineMesh);
    this.scene.add(this.bookGroup);
  };

  ReadingRoom3D.prototype.buildSunbeamsAndDust = function () {
    var THREE = window.THREE;
    var beamTex = createSunbeamTexture();

    // Volumetric soft shafts slanting from the open window across the book and tabletop
    var beamMat = new THREE.MeshBasicMaterial({
      map: beamTex,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.sunbeams = new THREE.Group();
    [-0.45, 0.35].forEach(function (offsetZ) {
      var shaft = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 3.8), beamMat);
      shaft.position.set(-0.78, 1.75, offsetZ);
      shaft.rotation.z = -0.94;
      shaft.rotation.y = 0.18;
      this.sunbeams.add(shaft);
    }, this);
    this.scene.add(this.sunbeams);

    // Floating 3D golden dust motes in the sunlight
    var count = this.isMobile ? 28 : 56;
    var positions = new Float32Array(count * 3);
    this.dustSeeds = [];
    for (var i = 0; i < count; i++) {
      var x = -1.75 + Math.random() * 2.8;
      var y = TABLE_Y + 0.1 + Math.random() * 1.9;
      var z = -0.95 + Math.random() * 2.0;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      this.dustSeeds.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.6,
      });
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var moteCanvas = document.createElement('canvas');
    moteCanvas.width = 32;
    moteCanvas.height = 32;
    var mctx = moteCanvas.getContext('2d');
    var mg = mctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    mg.addColorStop(0, 'rgba(255, 245, 210, 1)');
    mg.addColorStop(0.45, 'rgba(255, 236, 186, 0.55)');
    mg.addColorStop(1, 'rgba(255, 236, 186, 0)');
    mctx.fillStyle = mg;
    mctx.fillRect(0, 0, 32, 32);
    var moteTex = new THREE.CanvasTexture(moteCanvas);

    var ptsMat = new THREE.PointsMaterial({
      color: 0xffebc0,
      map: moteTex,
      size: 0.036,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.dustPoints = new THREE.Points(geo, ptsMat);
    this.scene.add(this.dustPoints);
  };

  ReadingRoom3D.prototype.updateResponsiveCameraPreset = function () {
    var THREE = window.THREE;
    var aspect = window.innerWidth / Math.max(1, window.innerHeight);

    if (aspect < 0.85) {
      // Portrait mobile framing: pull back & widen angle slightly so both window & book fit
      this.camera.fov = 50;
      this.camDeskPos = new THREE.Vector3(1.15, 2.38, 4.72);
      this.camDeskLook = new THREE.Vector3(-0.36, 1.06, -0.05);
    } else if (aspect < 1.35) {
      this.camera.fov = 44;
      this.camDeskPos = new THREE.Vector3(1.42, 2.28, 3.85);
      this.camDeskLook = new THREE.Vector3(-0.32, 1.05, -0.08);
    } else {
      // Wide laptop / desktop framing: clearly shows left sunlit window & desk legs/surface + book
      this.camera.fov = 40;
      this.camDeskPos = new THREE.Vector3(1.48, 2.18, 3.55);
      this.camDeskLook = new THREE.Vector3(-0.34, 1.04, -0.08);
    }
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  };

  ReadingRoom3D.prototype.computeLiftedBookTarget = function (camPos, camLook) {
    var THREE = window.THREE;
    var tempCam = this.camera.clone();
    tempCam.position.copy(camPos);
    tempCam.lookAt(camLook);
    tempCam.updateMatrixWorld();

    var forward = new THREE.Vector3().subVectors(camLook, camPos).normalize();
    var targetDist = this.camera.aspect < 0.85 ? 2.35 : 2.12;
    var pos = camPos.clone().addScaledVector(forward, targetDist);
    var quat = tempCam.quaternion.clone();
    return { pos: pos, quat: quat };
  };

  ReadingRoom3D.prototype.triggerLift = function (onComplete) {
    if (!this.supported) {
      if (onComplete) onComplete();
      return;
    }
    this.sceneState = 'lifting';
    this.animStartMs = performance.now();
    this.animProgress = 0;
    this.readingFrozen = false;
    this.onLiftDone = onComplete || null;
  };

  ReadingRoom3D.prototype.triggerReturn = function (onComplete) {
    if (!this.supported) {
      if (onComplete) onComplete();
      return;
    }
    this.sceneState = 'returning';
    this.animStartMs = performance.now();
    this.animProgress = 0;
    this.readingFrozen = false;
    this.onReturnDone = onComplete || null;
  };

  ReadingRoom3D.prototype.setImmediateReading = function () {
    this.sceneState = 'reading';
    this.readingFrozen = false;
    if (this.bookGroup) this.bookGroup.visible = false;
  };

  ReadingRoom3D.prototype.bindEvents = function () {
    var self = this;

    window.addEventListener('resize', function () {
      if (!self.supported) return;
      var mob =
        window.innerWidth <= 820 ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      self.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mob ? 1.5 : 2));
      self.renderer.setSize(window.innerWidth, window.innerHeight, false);
      self.updateResponsiveCameraPreset();
      self.readingFrozen = false;
    });

    window.addEventListener('pointermove', function (e) {
      if (!self.supported || self.sceneState !== 'desk') return;
      var nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      var ny = -(e.clientY / Math.max(1, window.innerHeight)) * 2 + 1;
      self.pointer.x = nx;
      self.pointer.y = ny;
      self.pointerNdc.set(nx, ny);

      self.raycaster.setFromCamera(self.pointerNdc, self.camera);
      var hits = self.raycaster.intersectObjects(self.bookHitMeshes || [], false);
      self.hovered = hits.length > 0;
      self.canvas.style.cursor = self.hovered ? 'pointer' : 'default';
    });

    var downX = 0;
    var downY = 0;
    this.canvas.addEventListener('pointerdown', function (e) {
      downX = e.clientX;
      downY = e.clientY;
    });

    function tryOpenAt(clientX, clientY) {
      if (!self.supported || self.sceneState !== 'desk') return;
      var nx = (clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      var ny = -(clientY / Math.max(1, window.innerHeight)) * 2 + 1;
      self.pointerNdc.set(nx, ny);
      self.raycaster.setFromCamera(self.pointerNdc, self.camera);
      var hits = self.raycaster.intersectObjects(self.bookHitMeshes || [], false);
      if (hits.length > 0 && self.onRequestOpenBook) {
        self.onRequestOpenBook();
      }
    }

    this.canvas.addEventListener('pointerup', function (e) {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 14) return;
      tryOpenAt(e.clientX, e.clientY);
    });

    this.canvas.addEventListener('click', function (e) {
      tryOpenAt(e.clientX, e.clientY);
    });
  };

  ReadingRoom3D.prototype.startLoop = function () {
    var self = this;
    var THREE = window.THREE;
    var currentParallaxX = 0;
    var currentParallaxY = 0;
    var hoverAmount = 0;

    function tick() {
      self.rafId = window.requestAnimationFrame(tick);
      if (document.hidden || document.body.classList.contains('is-easter-open')) {
        return;
      }
      var dt = Math.min(0.05, self.clock.getDelta());
      var elapsed = self.clock.elapsedTime;

      // Freeze static dimmed 3D room render once entered reading mode so StPageFlip runs at full 60fps
      if (self.sceneState === 'reading' && self.readingFrozen) {
        return;
      }

      // Keep curtain & sun dust alive while desk / animating
      if (self.curtainMesh) {
        self.curtainMesh.rotation.y = Math.PI / 2 - 0.18 + Math.sin(elapsed * 0.85) * 0.028;
      }

      if (self.dustPoints && self.dustSeeds) {
        var posAttr = self.dustPoints.geometry.getAttribute('position');
        for (var i = 0; i < self.dustSeeds.length; i++) {
          var s = self.dustSeeds[i];
          posAttr.setXYZ(
            i,
            s.baseX + Math.sin(elapsed * s.speed + s.phase) * 0.06,
            s.baseY + Math.cos(elapsed * s.speed * 0.8 + s.phase) * 0.045,
            s.baseZ + Math.sin(elapsed * s.speed * 0.6 + s.phase) * 0.05
          );
        }
        posAttr.needsUpdate = true;
      }

      var pGoalX = self.sceneState === 'desk' ? self.pointer.x * 0.18 : 0;
      var pGoalY = self.sceneState === 'desk' ? self.pointer.y * 0.1 : 0;
      currentParallaxX += (pGoalX - currentParallaxX) * Math.min(1, dt * 4.5);
      currentParallaxY += (pGoalY - currentParallaxY) * Math.min(1, dt * 4.5);

      var camPos = self.camDeskPos.clone();
      camPos.x += currentParallaxX;
      camPos.y += currentParallaxY;
      var camLook = self.camDeskLook.clone();

      var camReadPos = new THREE.Vector3(0.45, 2.02, 2.85);
      var camReadLook = new THREE.Vector3(-0.08, 1.08, 0.05);

      if (self.sceneState === 'desk') {
        self.bookGroup.visible = true;
        hoverAmount += ((self.hovered ? 1 : 0) - hoverAmount) * Math.min(1, dt * 8);
        self.bookGroup.position.copy(self.bookRestPos);
        self.bookGroup.position.y += hoverAmount * 0.032;
        self.bookGroup.quaternion.copy(self.bookRestQuat);
        var hoverTilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(hoverAmount * 0.06, 0, 0));
        self.bookGroup.quaternion.multiply(hoverTilt);
      } else if (self.sceneState === 'lifting') {
        self.bookGroup.visible = true;
        self.animProgress = Math.min(1, (performance.now() - (self.animStartMs || performance.now())) / 880);
        var k = easeOutCubic(self.animProgress);
        var liftedCamPos = camPos.clone().lerp(camReadPos, k);
        var liftedCamLook = camLook.clone().lerp(camReadLook, k);
        camPos.copy(liftedCamPos);
        camLook.copy(liftedCamLook);

        var targetPose = self.computeLiftedBookTarget(liftedCamPos, liftedCamLook);
        var arcPos = self.bookRestPos.clone().lerp(targetPose.pos, k);
        arcPos.y += Math.sin(k * Math.PI) * 0.16;
        self.bookGroup.position.copy(arcPos);
        self.bookGroup.quaternion.copy(self.bookRestQuat).slerp(targetPose.quat, k);

        if (self.animProgress >= 1) {
          self.sceneState = 'reading';
          self.bookGroup.visible = false;
          if (self.onLiftDone) {
            var cb = self.onLiftDone;
            self.onLiftDone = null;
            cb();
          }
        }
      } else if (self.sceneState === 'returning') {
        self.bookGroup.visible = true;
        self.animProgress = Math.min(1, (performance.now() - (self.animStartMs || performance.now())) / 800);
        var r = easeInOutCubic(self.animProgress);
        var retCamPos = camReadPos.clone().lerp(self.camDeskPos, r);
        var retCamLook = camReadLook.clone().lerp(self.camDeskLook, r);
        camPos.copy(retCamPos);
        camLook.copy(retCamLook);

        var startPose = self.computeLiftedBookTarget(camReadPos, camReadLook);
        var downPos = startPose.pos.clone().lerp(self.bookRestPos, r);
        downPos.y += Math.sin(r * Math.PI) * 0.14;
        self.bookGroup.position.copy(downPos);
        self.bookGroup.quaternion.copy(startPose.quat).slerp(self.bookRestQuat, r);

        if (self.animProgress >= 1) {
          self.sceneState = 'desk';
          self.bookGroup.position.copy(self.bookRestPos);
          self.bookGroup.quaternion.copy(self.bookRestQuat);
          if (self.onReturnDone) {
            var rcb = self.onReturnDone;
            self.onReturnDone = null;
            rcb();
          }
        }
      } else {
        self.bookGroup.visible = false;
        camPos.copy(camReadPos);
        camLook.copy(camReadLook);
        self.readingFrozen = true;
      }

      self.camera.position.copy(camPos);
      self.camera.lookAt(camLook);
      self.renderer.render(self.scene, self.camera);
    }

    tick();
  };

  window.MuoiCuaRung.ReadingRoom3D = ReadingRoom3D;
})();
