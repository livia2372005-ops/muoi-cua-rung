(function () {
  var data = window.MuoiCuaRung.DATA;
  var ChapterAudioController = window.MuoiCuaRung.ChapterAudioController;
  var ReadingRoom3D = window.MuoiCuaRung.ReadingRoom3D;
  var BookParallaxController = window.MuoiCuaRung.BookParallaxController;
  var LofiPlayer = window.MuoiCuaRung.LofiPlayer;
  var lofi = null;

  var pageFlip = null;
  var chapterAudio = null;
  var room3D = null;
  var soundEnabled = true;
  var rainSoundEnabled = false;
  var audioCtx = null;
  var rainGainNode = null;
  var rainSourceNode = null;
  var toastTimer = null;
  var currentPageIndex = 0;
  var lastModalTrigger = null;

  function showToast(msg) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2600);
  }

  function ensureAudioCtx() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  function playPaperRustle() {
    if (!soundEnabled) return;
    try {
      var ctx = ensureAudioCtx();
      if (!ctx) return;
      var duration = 0.16;
      var len = Math.floor(ctx.sampleRate * duration);
      var buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      var channel = buffer.getChannelData(0);
      for (var i = 0; i < len; i++) {
        var env = Math.sin((i / len) * Math.PI);
        channel[i] = (Math.random() * 2 - 1) * env * 0.08;
      }
      var src = ctx.createBufferSource();
      src.buffer = buffer;

      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1520;
      filter.Q.value = 0.85;

      var gain = ctx.createGain();
      gain.gain.value = 0.22;

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function playBookLiftSound() {
    if (!soundEnabled) return;
    try {
      var ctx = ensureAudioCtx();
      if (!ctx) return;
      var duration = 0.24;
      var len = Math.floor(ctx.sampleRate * duration);
      var buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      var channel = buffer.getChannelData(0);
      for (var i = 0; i < len; i++) {
        var env = Math.sin((i / len) * Math.PI);
        channel[i] = (Math.random() * 2 - 1) * env * 0.06;
      }
      var src = ctx.createBufferSource();
      src.buffer = buffer;

      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 740;

      var gain = ctx.createGain();
      gain.gain.value = 0.25;

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch (e) {}
  }

  function toggleSpringRainAudio() {
    var btn = document.getElementById('btn-rain');
    rainSoundEnabled = !rainSoundEnabled;
    if (btn) btn.setAttribute('aria-pressed', String(rainSoundEnabled));

    if (!rainSoundEnabled) {
      if (rainSourceNode) {
        try {
          rainSourceNode.stop();
        } catch (e) {}
        rainSourceNode = null;
      }
      showToast('Đã tắt âm thanh mưa xuân');
      return;
    }

    try {
      var ctx = ensureAudioCtx();
      if (!ctx) return;
      var bufLen = ctx.sampleRate * 3;
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var ch = buf.getChannelData(0);
      var lastOut = 0;
      for (var i = 0; i < bufLen; i++) {
        var white = Math.random() * 2 - 1;
        ch[i] = (lastOut + 0.04 * white) / 1.04;
        lastOut = ch[i];
      }

      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 950;
      filter.Q.value = 0.55;

      var gain = ctx.createGain();
      gain.gain.value = chapterAudio && chapterAudio.isPlaying ? 0.05 : 0.14;

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();

      rainSourceNode = src;
      rainGainNode = gain;
      showToast('Đã bật tiếng mưa xuân dịu nhẹ');
    } catch (e) {
      showToast('Không thể phát âm thanh nền trên trình duyệt này');
    }
  }

  function isolateNoFlipControls() {
    // Only stop pointer/mouse start events so dragging a page across revealed buttons still moves and completes cleanly on window mouseup/touchend
    var els = document.querySelectorAll('[data-no-flip]');
    var evts = ['mousedown', 'touchstart', 'pointerdown'];
    els.forEach(function (el) {
      evts.forEach(function (name) {
        el.addEventListener(name, function (e) {
          e.stopPropagation();
        });
      });
    });
  }

  var pendingEnsurePage = null;

  function ensurePageVisible(targetPageIdx) {
    if (!pageFlip) return;
    // Never queue a second flip while a page is mid-turn: remember the latest target and re-evaluate once the book settles.
    if (pageFlip.getState && pageFlip.getState() !== 'read') {
      pendingEnsurePage = targetPageIdx;
      return;
    }
    pendingEnsurePage = null;
    var total = pageFlip.getPageCount();
    var cur = pageFlip.getCurrentPageIndex();
    var orientation = pageFlip.getOrientation();

    if (orientation === 'landscape') {
      if (cur === 0 && targetPageIdx === 0) return;
      if (cur >= total - 1 && targetPageIdx >= total - 1) return;
      if (cur > 0 && cur < total - 1) {
        var leftIdx = cur % 2 === 1 ? cur : cur - 1;
        if (targetPageIdx === leftIdx || targetPageIdx === leftIdx + 1) return;
      }
      if (Math.abs(targetPageIdx - cur) <= 2) pageFlip.flip(targetPageIdx, 'top');
      else pageFlip.turnToPage(targetPageIdx);
    } else {
      if (cur === targetPageIdx) return;
      if (Math.abs(targetPageIdx - cur) <= 1) pageFlip.flip(targetPageIdx, 'top');
      else pageFlip.turnToPage(targetPageIdx);
    }
  }

  function setupDiagramJumpLinks() {
    document.querySelectorAll('[data-goto-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetPage = Number(btn.dataset.gotoPage);
        if (!pageFlip || !Number.isFinite(targetPage)) return;
        pageFlip.turnToPage(targetPage);
      });
    });
  }

  function populateModals() {
    var diagramGrid = document.getElementById('modal-diagram-grid');
    if (diagramGrid) {
      diagramGrid.innerHTML = data.nodes
        .map(function (node, idx) {
          return (
            '<article class="modal-node-card" data-node="' +
            idx +
            '">' +
            '<img src="' +
            node.image +
            '" alt="' +
            node.title +
            '" loading="lazy" decoding="async" />' +
            '<span class="station-roman">CHƯƠNG ' +
            node.step +
            ' • ' +
            node.phase.toUpperCase() +
            '</span>' +
            '<h4>' +
            node.title +
            '</h4>' +
            '<p>' +
            node.detailText +
            '</p>' +
            '<div class="modal-card-actions">' +
            '<button type="button" class="jacket-btn modal-play-node" data-node="' +
            idx +
            '">Nghe chương ' +
            node.step +
            '</button>' +
            '<button type="button" class="jacket-btn jacket-btn--primary modal-open-node" data-target-page="' +
            node.targetPage +
            '">Mở trang →</button>' +
            '</div>' +
            '</article>'
          );
        })
        .join('');

      diagramGrid.querySelectorAll('.modal-play-node').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = Number(btn.dataset.node);
          if (chapterAudio) chapterAudio.playTrack('tom-tat', idx);
        });
      });

      diagramGrid.querySelectorAll('.modal-open-node').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var targetPage = Number(btn.dataset.targetPage);
          var modal = document.getElementById('modal-diagram');
          if (modal) modal.hidden = true;
          if (pageFlip && Number.isFinite(targetPage)) {
            pageFlip.turnToPage(targetPage);
          }
        });
      });
    }

    var trackList = document.getElementById('track-manager-list');
    if (trackList) {
      trackList.innerHTML = data.tracks
        .map(function (tr) {
          return (
            '<div class="track-row" data-track-row="' +
            tr.id +
            '">' +
            '<div class="track-row-meta">' +
            '<strong>' +
            tr.shortTitle +
            '</strong>' +
            '<span>' +
            tr.pageLabel +
            ' • File: <code>audio/' +
            tr.id +
            '.mp3</code></span>' +
            '</div>' +
            '<div class="track-row-actions">' +
            '<button type="button" class="jacket-btn modal-track-play" data-track="' +
            tr.id +
            '">▶ Nghe</button>' +
            '<label class="jacket-btn jacket-btn--primary">' +
            '<input type="file" class="track-file-input" data-track="' +
            tr.id +
            '" accept="audio/*" hidden />' +
            'Gắn file' +
            '</label>' +
            '</div>' +
            '</div>'
          );
        })
        .join('');

      trackList.querySelectorAll('.modal-track-play').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var trId = btn.dataset.track;
          var tr = data.tracks.find(function (t) { return t.id === trId; });
          var modal = document.getElementById('modal-script');
          if (modal) modal.hidden = true;
          if (tr) ensurePageVisible(tr.pageStart);
          if (chapterAudio) chapterAudio.toggleTrack(trId);
        });
      });

      trackList.querySelectorAll('.track-file-input').forEach(function (input) {
        input.addEventListener('change', function (e) {
          var file = e.target.files && e.target.files[0];
          if (!file) return;
          var trId = input.dataset.track;
          var tr = data.tracks.find(function (t) { return t.id === trId; });
          if (tr) ensurePageVisible(tr.pageStart);
          if (chapterAudio) {
            chapterAudio.setCustomFile(trId, file);
            showToast('Đã gắn "' + file.name + '" cho ' + (tr ? tr.shortTitle : trId));
          }
        });
      });
    }
  }

  function setupModals() {
    function openModal(id, triggerEl) {
      var el = document.getElementById(id);
      if (!el) return;
      lastModalTrigger = triggerEl || document.activeElement;
      el.hidden = false;
      var closeBtn = el.querySelector('.modal-close');
      if (closeBtn) closeBtn.focus();
    }

    function closeAllModals() {
      document.querySelectorAll('.modal-backdrop').forEach(function (m) {
        m.hidden = true;
      });
      if (lastModalTrigger && typeof lastModalTrigger.focus === 'function') {
        lastModalTrigger.focus();
        lastModalTrigger = null;
      }
    }

    document.getElementById('btn-toc')?.addEventListener('click', function () {
      openModal('modal-toc', this);
    });
    document.getElementById('btn-script')?.addEventListener('click', function () {
      openModal('modal-script', this);
    });
    document.getElementById('btn-diagram')?.addEventListener('click', function () {
      openModal('modal-diagram', this);
    });

    document.getElementById('btn-share')?.addEventListener('click', function () {
      var urlHint = document.getElementById('share-url-hint');
      var fileWarn = document.getElementById('share-file-warning');
      var nativeBtn = document.getElementById('btn-native-share');
      var isFile = window.location.protocol === 'file:';
      if (urlHint) urlHint.textContent = window.location.href;
      if (fileWarn) fileWarn.hidden = !isFile;
      if (nativeBtn) nativeBtn.hidden = !navigator.share || isFile;
      openModal('modal-share', this);
    });

    document.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.modal-backdrop').forEach(function (bd) {
      bd.addEventListener('click', function (e) {
        if (e.target === bd) closeAllModals();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllModals();
    });

    document.querySelectorAll('.toc-jump').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetPage = Number(btn.dataset.page);
        closeAllModals();
        if (pageFlip) pageFlip.turnToPage(targetPage);
      });
    });
  }

  function updatePagerUI(pageIdx, totalPages) {
    currentPageIndex = pageIdx;
    var readout = document.getElementById('page-readout');
    var scrub = document.getElementById('page-scrub');
    var prevBtn = document.getElementById('btn-prev');
    var nextBtn = document.getElementById('btn-next');
    var prevMob = document.getElementById('btn-prev-mobile');
    var nextMob = document.getElementById('btn-next-mobile');
    var wrapper = document.getElementById('book-wrapper');

    var orientation = pageFlip ? pageFlip.getOrientation() : 'landscape';
    if (wrapper) {
      wrapper.classList.toggle('is-landscape', orientation === 'landscape');
      if (pageIdx === 0) wrapper.dataset.bookPos = 'cover';
      else if (pageIdx >= totalPages - 1) wrapper.dataset.bookPos = 'back';
      else wrapper.dataset.bookPos = 'open';
    }

    if (readout) {
      if (orientation === 'landscape' && pageIdx > 0 && pageIdx < totalPages - 1) {
        var leftNum = pageIdx % 2 === 1 ? pageIdx + 1 : pageIdx;
        readout.textContent = 'Trang ' + leftNum + '–' + (leftNum + 1) + ' / ' + totalPages;
      } else if (pageIdx === 0) {
        readout.textContent = 'Bìa 1 / ' + totalPages;
      } else if (pageIdx >= totalPages - 1) {
        readout.textContent = 'Bìa ' + totalPages + ' / ' + totalPages;
      } else {
        readout.textContent = 'Trang ' + (pageIdx + 1) + ' / ' + totalPages;
      }
    }

    if (scrub) {
      scrub.max = String(totalPages - 1);
      scrub.value = String(pageIdx);
    }
    if (prevBtn) prevBtn.disabled = pageIdx <= 0;
    if (nextBtn) nextBtn.disabled = pageIdx >= totalPages - 1;
    if (prevMob) prevMob.disabled = pageIdx <= 0;
    if (nextMob) nextMob.disabled = pageIdx >= totalPages - 1;

    var tocBtns = document.querySelectorAll('.toc-jump');
    var activeToc = 0;
    tocBtns.forEach(function (b, idx) {
      if (pageIdx >= Number(b.dataset.page)) activeToc = idx;
    });
    tocBtns.forEach(function (b, idx) {
      b.classList.toggle('is-current', idx === activeToc);
    });
  }

  function initBook() {
    var container = document.getElementById('flipbook-container');
    var pages = container.querySelectorAll('.page');

    pageFlip = new window.St.PageFlip(container, {
      width: 440,
      height: 704,
      size: 'stretch',
      minWidth: 240,
      maxWidth: 460,
      minHeight: 384,
      maxHeight: 736,
      maxShadowOpacity: 0.42,
      showCover: true,
      showPageCorners: false,
      usePortrait: true,
      mobileScrollSupport: true,
      flippingTime: 740,
    });

    pageFlip.loadFromHTML(pages);

    pageFlip.on('init', function (e) {
      updatePagerUI(e.data.page, pageFlip.getPageCount());
    });

    pageFlip.on('flip', function (e) {
      playPaperRustle();
      updatePagerUI(e.data, pageFlip.getPageCount());
    });

    pageFlip.on('changeState', function (e) {
      var wrapper = document.getElementById('book-wrapper');
      if (!wrapper || !pageFlip) return;

      if (e.data === 'flipping') {
        var orientation = pageFlip.getOrientation();
        wrapper.classList.toggle('is-landscape', orientation === 'landscape');
        if (orientation === 'landscape') {
          var total = pageFlip.getPageCount();
          var cur = pageFlip.getCurrentPageIndex();
          var render = pageFlip.getRender();
          var dir = render && typeof render.getDirection === 'function' ? render.getDirection() : null;
          if (cur === 0 && dir === 0) {
            wrapper.dataset.bookPos = 'open';
          } else if (cur > 0 && cur <= 2 && dir === 1) {
            wrapper.dataset.bookPos = 'cover';
          } else if (cur >= total - 3 && cur < total - 1 && dir === 0) {
            wrapper.dataset.bookPos = 'back';
          } else if (cur >= total - 1 && dir === 1) {
            wrapper.dataset.bookPos = 'open';
          }
        }
      } else if (e.data === 'read') {
        updatePagerUI(pageFlip.getCurrentPageIndex(), pageFlip.getPageCount());
        if (pendingEnsurePage !== null) {
          var queued = pendingEnsurePage;
          pendingEnsurePage = null;
          setTimeout(function () { ensurePageVisible(queued); }, 60);
        }
      }
    });

    pageFlip.on('changeOrientation', function () {
      updatePagerUI(pageFlip.getCurrentPageIndex(), pageFlip.getPageCount());
    });

    window.addEventListener('orientationchange', function () {
      setTimeout(function () {
        if (pageFlip) pageFlip.update();
      }, 150);
    });

    function goPrev() { pageFlip.flipPrev('top'); }
    function goNext() { pageFlip.flipNext('top'); }

    document.getElementById('btn-prev')?.addEventListener('click', goPrev);
    document.getElementById('btn-next')?.addEventListener('click', goNext);
    document.getElementById('btn-prev-mobile')?.addEventListener('click', goPrev);
    document.getElementById('btn-next-mobile')?.addEventListener('click', goNext);
    document.getElementById('btn-start-read')?.addEventListener('click', goNext);
    document.getElementById('btn-restart')?.addEventListener('click', function () {
      pageFlip.turnToPage(0);
    });

    var scrub = document.getElementById('page-scrub');
    if (scrub) {
      scrub.addEventListener('change', function () {
        pageFlip.turnToPage(Number(scrub.value));
      });
      scrub.addEventListener('input', function () {
        var readout = document.getElementById('page-readout');
        if (readout) {
          readout.textContent = 'Trang ' + (Number(scrub.value) + 1) + ' / ' + pageFlip.getPageCount();
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (document.body.dataset.scene !== 'reading') return;
      if (e.target instanceof HTMLInputElement) return;
      if (document.querySelector('.modal-backdrop:not([hidden])')) return;
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    });
  }

  function setupToolbarActions() {
    var soundBtn = document.getElementById('btn-sound');
    var soundSvg = document.getElementById('sound-icon-svg');
    soundBtn?.addEventListener('click', function () {
      soundEnabled = !soundEnabled;
      soundBtn.setAttribute('aria-pressed', String(soundEnabled));
      if (soundSvg) {
        soundSvg.innerHTML = soundEnabled
          ? '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/>'
          : '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m22 9-6 6M16 9l6 6"/>';
      }
      showToast(soundEnabled ? 'Đã bật tiếng lật giấy' : 'Đã tắt tiếng lật giấy');
    });

    document.getElementById('btn-rain')?.addEventListener('click', toggleSpringRainAudio);

    document.getElementById('btn-lofi')?.addEventListener('click', function () {
      if (!LofiPlayer) return;
      if (!lofi) lofi = new LofiPlayer();
      var on = lofi.toggle();
      lofi.setDucked(Boolean(chapterAudio && chapterAudio.isPlaying));
      this.setAttribute('aria-pressed', String(on));
      this.classList.toggle('is-on', on);
      showToast(on ? 'Đã bật nhạc nền lofi' : 'Đã tắt nhạc nền lofi');
    });

    document.getElementById('btn-copy-share-msg')?.addEventListener('click', function () {
      var msg =
        'Mời thầy cô và các bạn xem Sách Điện Tử "Muối Của Rừng" (Nhóm 3): ' +
        window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(msg)
          .then(function () {
            showToast('Đã sao chép lời nhắn & link gửi nhóm lớp!');
          })
          .catch(function () {
            showToast('Hãy sao chép đường link trong khung trên.');
          });
      }
    });

    document.getElementById('btn-native-share')?.addEventListener('click', function () {
      if (!navigator.share) return;
      navigator
        .share({
          title: 'Muối Của Rừng — Sách Điện Tử | Nhóm 3',
          text: 'Mời thầy cô và các bạn đọc sách điện tử tác phẩm Muối của rừng (Nguyễn Huy Thiệp) do Nhóm 3 thực hiện.',
          url: window.location.href,
        })
        .catch(function () {});
    });

    document.getElementById('btn-play-all-book')?.addEventListener('click', function () {
      var modal = document.getElementById('modal-script');
      if (modal) modal.hidden = true;
      ensurePageVisible(1);
      if (chapterAudio) {
        chapterAudio.setAutoContinue(true);
        chapterAudio.playTrack('loi-mo-dau', 0);
      }
    });

    document.getElementById('btn-copy-script')?.addEventListener('click', function () {
      var text = data.nodes
        .map(function (n) {
          return n.voiceScript;
        })
        .join('\n\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          showToast('Đã sao chép kịch bản tóm tắt 5 chương!');
        });
      }
    });
  }

  function initSpringRainCanvas() {
    var canvas = document.getElementById('rain-canvas');
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var drops = Array.from({ length: 24 }, function () {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        len: 10 + Math.random() * 14,
        speed: 1.8 + Math.random() * 1.4,
        alpha: 0.08 + Math.random() * 0.14,
      };
    });

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var scene = document.body.dataset.scene || 'reading';

      if (scene === 'reading') {
        var showAtmosphere =
          rainSoundEnabled || currentPageIndex === 0 || currentPageIndex >= 15;

        if (showAtmosphere) {
          ctx.lineWidth = 1;
          for (var i = 0; i < drops.length; i++) {
            var d = drops[i];
            d.x -= d.speed * 0.25;
            d.y += d.speed;
            if (d.y > canvas.height + 20) {
              d.y = -20;
              d.x = Math.random() * canvas.width;
            }
            ctx.strokeStyle = 'rgba(246, 248, 244, ' + d.alpha + ')';
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - 3, d.y + d.len);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function setupDeskIntroScene() {
    var canvas3d = document.getElementById('scene-3d-canvas');
    var promptBtn = document.getElementById('desk-book-trigger');
    var returnBtn = document.getElementById('btn-desk');
    var openImmediate = window.location.search.indexOf('open=1') !== -1;

    function finishLiftToReading() {
      document.body.dataset.scene = 'reading';
      if (pageFlip) {
        pageFlip.update();
        updatePagerUI(pageFlip.getCurrentPageIndex(), pageFlip.getPageCount());
      }
    }

    function liftBookFromDesk() {
      var scene = document.body.dataset.scene;
      if (scene === 'lifting' || scene === 'reading' || scene === 'returning') return;
      playBookLiftSound();

      if (pageFlip && pageFlip.getCurrentPageIndex() !== 0) {
        pageFlip.turnToPage(0);
      }

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !room3D || !room3D.supported) {
        if (room3D) room3D.setImmediateReading();
        finishLiftToReading();
        return;
      }

      document.body.dataset.scene = 'lifting';
      room3D.triggerLift(finishLiftToReading);
    }

    function returnBookToDesk() {
      if (chapterAudio && chapterAudio.activeTrackId) {
        chapterAudio.stop();
      }
      if (pageFlip && pageFlip.getCurrentPageIndex() !== 0) {
        pageFlip.turnToPage(0);
      }

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !room3D || !room3D.supported) {
        document.body.dataset.scene = 'desk';
        return;
      }

      document.body.dataset.scene = 'returning';
      room3D.triggerReturn(function () {
        document.body.dataset.scene = 'desk';
      });
    }

    if (typeof ReadingRoom3D === 'function' && canvas3d) {
      room3D = new ReadingRoom3D({
        canvas: canvas3d,
        onRequestOpenBook: liftBookFromDesk,
      });
    }

    if (openImmediate || (room3D && !room3D.supported)) {
      if (room3D && room3D.supported) room3D.setImmediateReading();
      finishLiftToReading();
    }

    if (promptBtn) {
      promptBtn.addEventListener('click', liftBookFromDesk);
      promptBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          liftBookFromDesk();
        }
      });
    }

    if (returnBtn) {
      returnBtn.addEventListener('click', returnBookToDesk);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    isolateNoFlipControls();
    initBook();
    setupDeskIntroScene();
    setupDiagramJumpLinks();
    initSpringRainCanvas();
    if (BookParallaxController) {
      new BookParallaxController({
        targetEl: document.getElementById('flipbook-container') || document.body,
        getIsFlipping: function () {
          return Boolean(pageFlip && pageFlip.getState && pageFlip.getState() !== 'read');
        }
      });
    }

    chapterAudio = new ChapterAudioController({
      tracks: data.tracks,
      onEnsurePageVisible: ensurePageVisible,
      onSegmentChange: function (trackId, segIdx) {
        if (trackId === 'tom-tat') {
          document.querySelectorAll('.modal-node-card').forEach(function (card) {
            card.classList.toggle('is-active', Number(card.dataset.node) === segIdx);
          });
        }
      },
      onPlayStateChange: function (playing) {
        if (lofi) lofi.setDucked(playing);
        if (rainGainNode && audioCtx) {
          rainGainNode.gain.setTargetAtTime(playing ? 0.05 : 0.14, audioCtx.currentTime, 0.25);
        }
        var hintEl = document.querySelector('.footer-hint');
        if (hintEl && window.innerWidth > 820) {
          hintEl.hidden = Boolean(chapterAudio && chapterAudio.activeTrackId);
        }
      },
    });

    populateModals();
    setupModals();
    setupToolbarActions();
  });
})();
