(function () {
  var data = window.MuoiCuaRung.DATA;
  var NarrationController = window.MuoiCuaRung.NarrationController;

  var pageFlip = null;
  var narration = null;
  var soundEnabled = true;
  var audioCtx = null;
  var toastTimer = null;
  var activeNodeIdx = 0;

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

  function playPaperRustle() {
    if (!soundEnabled) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(function () {});
      }

      var duration = 0.16;
      var len = Math.floor(audioCtx.sampleRate * duration);
      var buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      var channel = buffer.getChannelData(0);
      for (var i = 0; i < len; i++) {
        var env = Math.sin((i / len) * Math.PI);
        channel[i] = (Math.random() * 2 - 1) * env * 0.09;
      }

      var src = audioCtx.createBufferSource();
      src.buffer = buffer;

      var filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1550;
      filter.Q.value = 0.8;

      var gain = audioCtx.createGain();
      gain.gain.value = 0.26;

      src.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      src.start();
    } catch (e) {}
  }

  function isolateNoFlipControls() {
    var els = document.querySelectorAll('[data-no-flip]');
    var evts = ['mousedown', 'touchstart', 'pointerdown', 'mouseup', 'touchend', 'click'];
    els.forEach(function (el) {
      evts.forEach(function (name) {
        el.addEventListener(name, function (e) {
          e.stopPropagation();
        });
      });
    });
  }

  function updateActiveNodeUI(index) {
    activeNodeIdx = index;
    var node = data.nodes[index];

    document.querySelectorAll('.mindmap-node').forEach(function (btn) {
      btn.classList.toggle('is-active', Number(btn.dataset.node) === index);
    });

    document.querySelectorAll('.modal-node-card').forEach(function (card) {
      card.classList.toggle('is-active', Number(card.dataset.node) === index);
    });

    var badge = document.getElementById('caption-badge');
    var scriptText = document.getElementById('caption-script-text');
    if (badge) badge.textContent = 'Đang chọn: Chặng ' + node.step + ' • ' + node.phase;
    if (scriptText) scriptText.textContent = '“' + node.voiceScript + '”';
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
            '" />' +
            '<span class="node-step">Chặng ' +
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
            '<button type="button" class="paper-pill-btn modal-play-node" data-node="' +
            idx +
            '">🔊 Nghe chặng ' +
            node.step +
            '</button>' +
            '</article>'
          );
        })
        .join('');

      diagramGrid.querySelectorAll('.modal-play-node').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = Number(btn.dataset.node);
          updateActiveNodeUI(idx);
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
    function openModal(id) {
      var el = document.getElementById(id);
      if (el) el.hidden = false;
    }
    function closeAllModals() {
      document.querySelectorAll('.modal-backdrop').forEach(function (m) {
        m.hidden = true;
      });
    }

    document.getElementById('btn-toc')?.addEventListener('click', function () {
      openModal('modal-toc');
    });
    document.getElementById('btn-script')?.addEventListener('click', function () {
      openModal('modal-script');
    });
    document.getElementById('btn-back-script')?.addEventListener('click', function () {
      openModal('modal-script');
    });
    document.getElementById('btn-diagram')?.addEventListener('click', function () {
      openModal('modal-diagram');
    });
    document.getElementById('btn-diagram-inline')?.addEventListener('click', function () {
      openModal('modal-diagram');
    });

    document.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var el = document.getElementById(btn.dataset.close);
        if (el) el.hidden = true;
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(function (bd) {
      bd.addEventListener('click', function (e) {
        if (e.target === bd) bd.hidden = true;
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllModals();
    });

    document.querySelectorAll('.toc-jump').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetPage = Number(btn.dataset.page);
        closeAllModals();
        if (pageFlip) {
          pageFlip.turnToPage(targetPage);
        }
      });
    });
  }

  function updatePagerUI(currentPage, totalPages) {
    var readout = document.getElementById('page-readout');
    var scrub = document.getElementById('page-scrub');
    var prevBtn = document.getElementById('btn-prev');
    var nextBtn = document.getElementById('btn-next');

    if (readout) {
      readout.textContent = 'Trang ' + (currentPage + 1) + ' / ' + totalPages;
    }
    if (scrub) {
      scrub.max = String(totalPages - 1);
      scrub.value = String(currentPage);
    }
    if (prevBtn) prevBtn.disabled = currentPage <= 0;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages - 1;
  }

  function initBook() {
    var container = document.getElementById('flipbook-container');
    var pages = container.querySelectorAll('.page');

    pageFlip = new window.St.PageFlip(container, {
      width: 495,
      height: 700,
      size: 'stretch',
      minWidth: 290,
      maxWidth: 530,
      minHeight: 410,
      maxHeight: 740,
      maxShadowOpacity: 0.48,
      showCover: true,
      showPageCorners: true,
      usePortrait: true,
      mobileScrollSupport: false,
      flippingTime: 780,
    });

    pageFlip.loadFromHTML(pages);

    pageFlip.on('init', function (e) {
      updatePagerUI(e.data.page, pageFlip.getPageCount());
    });

    pageFlip.on('flip', function (e) {
      playPaperRustle();
      updatePagerUI(e.data, pageFlip.getPageCount());
    });

    document.getElementById('btn-prev')?.addEventListener('click', function () {
      pageFlip.flipPrev('top');
    });

    document.getElementById('btn-next')?.addEventListener('click', function () {
      pageFlip.flipNext('top');
    });

    document.getElementById('btn-start-read')?.addEventListener('click', function () {
      pageFlip.flipNext('top');
    });

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
      if (e.key === 'ArrowRight') pageFlip.flipNext('top');
      else if (e.key === 'ArrowLeft') pageFlip.flipPrev('top');
    });
  }

  function setupToolbarActions() {
    var soundBtn = document.getElementById('btn-sound');
    var soundIcon = document.getElementById('sound-icon');
    soundBtn?.addEventListener('click', function () {
      soundEnabled = !soundEnabled;
      soundBtn.setAttribute('aria-pressed', String(soundEnabled));
      if (soundIcon) soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
      showToast(soundEnabled ? 'Đã bật tiếng lật trang' : 'Đã tắt tiếng lật trang');
    });

    function shareLink() {
      var url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(url)
          .then(function () {
            showToast('Đã sao chép link sách điện tử để gửi nhóm lớp!');
          })
          .catch(function () {
            showToast('Link trang web: ' + url);
          });
      } else {
        showToast('Link trang web: ' + url);
      }
    }

    document.getElementById('btn-share')?.addEventListener('click', shareLink);
    document.getElementById('btn-back-share')?.addEventListener('click', shareLink);

    document.getElementById('btn-copy-script')?.addEventListener('click', function () {
      var text = data.nodes
        .map(function (n) {
          return n.voiceScript;
        })
        .join('\n\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          showToast('Đã sao chép toàn bộ kịch bản 5 chặng!');
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    isolateNoFlipControls();
    initBook();

    narration = new NarrationController({
      nodes: data.nodes,
      candidatePaths: data.audioPaths,
      onNodeChange: updateActiveNodeUI,
    });

    document.querySelectorAll('.mindmap-node').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = Number(btn.dataset.node);
        updateActiveNodeUI(idx);
        narration.playNode(idx);
      });
    });

    updateActiveNodeUI(0);
    populateModals();
    setupModals();
    setupToolbarActions();
  });
})();
