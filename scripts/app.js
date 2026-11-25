(function () {
  var data = window.MuoiCuaRung.DATA;
  var NarrationController = window.MuoiCuaRung.NarrationController;

  var pageFlip = null;
  var narration = null;
  var soundEnabled = true;
  var rainSoundEnabled = false;
  var audioCtx = null;
  var rainGainNode = null;
  var rainSourceNode = null;
  var toastTimer = null;
  var activeNodeIdx = 0;
  var currentPageIndex = 0;
  var lastModalTrigger = null;

  var FLOWER_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
    '<circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/>' +
    '<path d="M12 3.2C13.6 6 13.6 8.6 12 10.4C10.4 8.6 10.4 6 12 3.2Z"/>' +
    '<path d="M20.4 9.3C18.2 11.7 15.7 12.5 13.5 11.5C14.7 9.4 17.2 8.6 20.4 9.3Z"/>' +
    '<path d="M17.2 19.2C14.3 17.8 12.8 15.7 13 13.3C15.3 13.8 16.9 15.9 17.2 19.2Z"/>' +
    '<path d="M6.8 19.2C7.1 15.9 8.7 13.8 11 13.3C11.2 15.7 9.7 17.8 6.8 19.2Z"/>' +
    '<path d="M3.6 9.3C6.8 8.6 9.3 9.4 10.5 11.5C8.3 12.5 5.8 11.7 3.6 9.3Z"/>' +
    '</svg>';

  function showToast(msg) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2700);
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
        channel[i] = (Math.random() * 2 - 1) * env * 0.085;
      }
      var src = ctx.createBufferSource();
      src.buffer = buffer;

      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1520;
      filter.Q.value = 0.85;

      var gain = ctx.createGain();
      gain.gain.value = 0.24;

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
        // Soft pink-ish spring drizzle filter
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
      gain.gain.value = narration && narration.isPlaying ? 0.05 : 0.14;

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
    var els = document.querySelectorAll('[data-no-flip]');
    var evts = [
      'mousedown',
      'touchstart',
      'pointerdown',
      'mousemove',
      'touchmove',
      'pointermove',
      'mouseup',
      'touchend',
      'click',
    ];
    els.forEach(function (el) {
      evts.forEach(function (name) {
        el.addEventListener(name, function (e) {
          e.stopPropagation();
        });
      });
    });
  }

  function updateActiveNodeUI(index, fromPlayback) {
    activeNodeIdx = index;
    var node = data.nodes[index];

    document.querySelectorAll('.trail-station').forEach(function (btn) {
      btn.classList.toggle('is-active', Number(btn.dataset.node) === index);
    });

    document.querySelectorAll('.modal-node-card').forEach(function (card) {
      card.classList.toggle('is-active', Number(card.dataset.node) === index);
    });

    var badge = document.getElementById('caption-badge');
    var scriptText = document.getElementById('caption-script-text');
    var inlineCap = document.getElementById('inline-live-caption');
    var miniStatus = document.getElementById('mini-sync-status');

    if (badge) badge.textContent = 'Lời đọc • Chặng ' + node.step + ' (' + node.phase + ')';
    if (scriptText) scriptText.textContent = '“' + node.voiceScript + '”';
    if (inlineCap) inlineCap.textContent = '“' + node.voiceScript + '”';
    if (miniStatus) miniStatus.textContent = 'Đang chọn: Chặng ' + node.step + ' / 5';

    // Auto-flip from Page 4 (idx 3) to Page 5 (idx 4) when reaching Station 4 on mobile portrait
    if (fromPlayback && pageFlip && pageFlip.getOrientation() === 'portrait') {
      var cur = pageFlip.getCurrentPageIndex();
      if (index >= 3 && cur === 3) {
        pageFlip.flip(4, 'top');
      } else if (index < 3 && cur === 4) {
        pageFlip.flip(3, 'top');
      }
    }
  }

  function renderCompassStage(stageIdx) {
    var stages = data.compassStages;
    var item = stages[stageIdx];
    if (!item) return;

    document.querySelectorAll('.compass-tab').forEach(function (btn) {
      btn.classList.toggle('is-active', Number(btn.dataset.stage) === stageIdx);
    });

    var locEl = document.getElementById('compass-loc');
    var modeEl = document.getElementById('compass-mode');
    var outerEl = document.getElementById('compass-outer-note');
    var innerEl = document.getElementById('compass-inner-note');
    var quoteEl = document.getElementById('compass-quote');
    var meterEl = document.getElementById('blossom-meter');

    if (locEl) locEl.textContent = item.location;
    if (modeEl) modeEl.textContent = item.modeLabel;
    if (outerEl) outerEl.textContent = item.outerNote;
    if (innerEl) innerEl.textContent = item.innerNote;
    if (quoteEl) quoteEl.textContent = item.quote;

    document.querySelectorAll('.artifact-token').forEach(function (tok) {
      var idx = Number(tok.dataset.idx);
      tok.classList.toggle('is-lost', Boolean(item.lostTokens[idx]));
    });

    if (meterEl) {
      var html = '';
      for (var i = 0; i < 5; i++) {
        html +=
          '<span style="opacity:' +
          (i < item.humanityLevel ? '1' : '0.22') +
          '">' +
          FLOWER_SVG +
          '</span>';
      }
      meterEl.innerHTML = html;
    }
  }

  function populateModals() {
    var diagramGrid = document.getElementById('modal-diagram-grid');
    if (diagramGrid) {
      diagramGrid.innerHTML = data.nodes
        .map(function (node, idx) {
          return (
            '<article class="modal-node-card ' +
            (idx === activeNodeIdx ? 'is-active' : '') +
            '" data-node="' +
            idx +
            '">' +
            '<img src="' +
            node.image +
            '" alt="' +
            node.title +
            '" loading="lazy" decoding="async" />' +
            '<span class="station-tag">0' +
            node.step +
            ' • ' +
            node.phase +
            '</span>' +
            '<h4>' +
            node.title +
            '</h4>' +
            '<p>' +
            node.detailText +
            '</p>' +
            '<button type="button" class="jacket-btn modal-play-node" data-node="' +
            idx +
            '">Nghe chặng ' +
            node.step +
            '</button>' +
            '</article>'
          );
        })
        .join('');

      diagramGrid.querySelectorAll('.modal-play-node').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = Number(btn.dataset.node);
          updateActiveNodeUI(idx, false);
          if (narration) narration.playNode(idx);
        });
      });
    }

    var scriptCards = document.getElementById('modal-script-cards');
    if (scriptCards) {
      scriptCards.innerHTML = data.nodes
        .map(function (node) {
          return (
            '<div class="script-card-item">' +
            '<strong>Chặng ' +
            node.step +
            ': ' +
            node.title +
            '</strong>' +
            '<em class="script-tone">Gợi ý ngữ điệu: ' +
            node.toneGuide +
            '</em>' +
            '<p>' +
            node.voiceScript +
            '</p>' +
            '</div>'
          );
        })
        .join('');
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
    document.getElementById('btn-back-script')?.addEventListener('click', function () {
      openModal('modal-script', this);
    });
    document.getElementById('btn-diagram')?.addEventListener('click', function () {
      openModal('modal-diagram', this);
    });
    document.getElementById('btn-diagram-inline')?.addEventListener('click', function () {
      openModal('modal-diagram', this);
    });

    function openShareModal(triggerEl) {
      var urlHint = document.getElementById('share-url-hint');
      var fileWarn = document.getElementById('share-file-warning');
      var nativeBtn = document.getElementById('btn-native-share');
      var isFile = window.location.protocol === 'file:';
      if (urlHint) urlHint.textContent = window.location.href;
      if (fileWarn) fileWarn.hidden = !isFile;
      if (nativeBtn) nativeBtn.hidden = !navigator.share || isFile;
      openModal('modal-share', triggerEl);
    }

    document.getElementById('btn-share')?.addEventListener('click', function () {
      openShareModal(this);
    });
    document.getElementById('btn-back-share')?.addEventListener('click', function () {
      openShareModal(this);
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

    // Highlight active TOC item
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
      minWidth: 270,
      maxWidth: 470,
      minHeight: 432,
      maxHeight: 752,
      maxShadowOpacity: 0.44,
      showCover: true,
      showPageCorners: true,
      usePortrait: true,
      mobileScrollSupport: true,
      flippingTime: 760,
    });

    pageFlip.loadFromHTML(pages);

    pageFlip.on('init', function (e) {
      updatePagerUI(e.data.page, pageFlip.getPageCount());
    });

    pageFlip.on('flip', function (e) {
      playPaperRustle();
      updatePagerUI(e.data, pageFlip.getPageCount());
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

    document.getElementById('btn-copy-script')?.addEventListener('click', function () {
      var text = data.nodes
        .map(function (n) {
          return 'Chặng ' + n.step + ' (' + n.title + '):\n' + n.voiceScript;
        })
        .join('\n\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          showToast('Đã sao chép kịch bản 5 chặng!');
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

    var drops = Array.from({ length: 26 }, function () {
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
      var showAtmosphere =
        rainSoundEnabled || currentPageIndex === 0 || currentPageIndex >= 11;

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
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  document.addEventListener('DOMContentLoaded', function () {
    isolateNoFlipControls();
    initBook();
    initSpringRainCanvas();

    narration = new NarrationController({
      nodes: data.nodes,
      candidatePaths: data.audioPaths,
      onNodeChange: updateActiveNodeUI,
      onPlayStateChange: function (playing) {
        if (rainGainNode && audioCtx) {
          rainGainNode.gain.setTargetAtTime(playing ? 0.05 : 0.14, audioCtx.currentTime, 0.25);
        }
      },
    });

    document.querySelectorAll('.trail-station').forEach(function (btn) {
      btn.addEventListener('click', function () {
        narration.playNode(Number(btn.dataset.node));
      });
    });

    document.querySelectorAll('.compass-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        renderCompassStage(Number(btn.dataset.stage));
      });
    });

    renderCompassStage(0);
    updateActiveNodeUI(0, false);
    populateModals();
    setupModals();
    setupToolbarActions();
  });
})();
