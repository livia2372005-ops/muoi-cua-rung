import {
  BOOK_CONFIG,
  AUTHOR_WORK_INFO,
  SUMMARY_NODES,
  HUNTING_STAGES,
  SYMBOLS_LIST,
} from './data.js';
import { FlipbookController } from './flipbook.js';
import { NarrationController } from './audio-player.js';

let activeSummaryIndex = 0;
let activeHuntIndex = 0;
let toastTimer = null;

function showToast(message) {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('is-visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('is-visible');
  }, 2600);
}

function populateAuthorInfo() {
  document.getElementById('author-name').textContent = AUTHOR_WORK_INFO.authorName;
  document.getElementById('author-bio').textContent = AUTHOR_WORK_INFO.authorBio;
  document.getElementById('work-origin').textContent = AUTHOR_WORK_INFO.workOrigin;
  document.getElementById('narrative-view').textContent = AUTHOR_WORK_INFO.narrativeView;
  document.getElementById('core-message').textContent = `“${AUTHOR_WORK_INFO.coreMessage}”`;
}

function createFlowNodeButton(node, index, onSelect) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'flow-node';
  btn.dataset.nodeIndex = String(index);
  btn.innerHTML = `
    <span class="flow-step-num">${node.step}</span>
    <span class="flow-node-body">
      <span class="flow-phase">${node.phase}</span>
      <h4>${node.title}</h4>
      <p>${node.shortText}</p>
    </span>
  `;
  btn.addEventListener('click', () => onSelect(index));
  return btn;
}

function renderFlowchart(onSelectNode) {
  const leftContainer = document.getElementById('flowchart-left');
  const rightContainer = document.getElementById('flowchart-right');
  leftContainer.innerHTML = '';
  rightContainer.innerHTML = '';

  SUMMARY_NODES.forEach((node, idx) => {
    const target = idx < 3 ? leftContainer : rightContainer;
    target.appendChild(createFlowNodeButton(node, idx, onSelectNode));

    const isLastInLeft = idx === 2;
    const isLastOverall = idx === SUMMARY_NODES.length - 1;
    if (!isLastInLeft && !isLastOverall) {
      const arrow = document.createElement('div');
      arrow.className = 'flow-connector';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↓';
      target.appendChild(arrow);
    }
  });
}

function updateFlowchartSelection(index) {
  activeSummaryIndex = index;
  const node = SUMMARY_NODES[index];

  document.querySelectorAll('.flow-node').forEach((el) => {
    el.classList.toggle('is-active', Number(el.dataset.nodeIndex) === index);
  });

  document.querySelectorAll('.modal-flow-card').forEach((el) => {
    el.classList.toggle('is-active', Number(el.dataset.nodeIndex) === index);
  });

  document.getElementById('detail-phase-badge').textContent = `Chặng ${node.step} • ${node.phase}`;
  document.getElementById('detail-node-title').textContent = node.title;
  document.getElementById('detail-node-text').textContent = node.detailText;
  document.getElementById('detail-node-quote').textContent = node.quote;
  document.getElementById('detail-node-script').textContent = node.voiceScript;
}

function renderModalFlowchart(narration) {
  const container = document.getElementById('modal-diagram-canvas');
  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'modal-diagram-grid';

  SUMMARY_NODES.forEach((node, idx) => {
    const card = document.createElement('article');
    card.className = `modal-flow-card ${idx === activeSummaryIndex ? 'is-active' : ''}`;
    card.dataset.nodeIndex = String(idx);
    card.innerHTML = `
      <span class="flow-phase">Chặng ${node.step} • ${node.phase}</span>
      <h4>${node.title}</h4>
      <p>${node.detailText}</p>
      <blockquote class="inspector-quote">${node.quote}</blockquote>
      <button type="button" class="mini-tool-btn">🔊 Nghe chặng ${node.step}</button>
    `;
    card.querySelector('button').addEventListener('click', () => {
      updateFlowchartSelection(idx);
      narration.playNode(idx);
    });
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function renderHuntingTrail() {
  const nav = document.getElementById('hunting-trail-nav');
  nav.innerHTML = '';

  HUNTING_STAGES.forEach((item, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'trail-btn';
    btn.role = 'tab';
    btn.dataset.stageIndex = String(idx);
    btn.textContent = item.shortLabel;
    btn.addEventListener('click', () => selectHuntingStage(idx));
    nav.appendChild(btn);
  });
}

function renderPsychologyChart() {
  const wrap = document.getElementById('psychology-chart');
  const width = 460;
  const height = 210;
  const padL = 36;
  const padR = 24;
  const padT = 22;
  const padB = 34;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const getX = (i) => padL + (i / (HUNTING_STAGES.length - 1)) * plotW;
  const getY = (score) => padT + ((100 - score) / 100) * plotH;

  const arrogancePoints = HUNTING_STAGES.map((s, i) => `${getX(i)},${getY(s.arroganceScore)}`).join(' ');
  const humanityPoints = HUNTING_STAGES.map((s, i) => `${getX(i)},${getY(s.humanityScore)}`).join(' ');

  const gridLines = [0, 25, 50, 75, 100]
    .map((val) => {
      const y = getY(val);
      return `
        <line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="rgba(26,36,31,0.12)" stroke-dasharray="3,3" />
        <text x="${padL - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#697970">${val}</text>
      `;
    })
    .join('');

  const pointsMarkup = HUNTING_STAGES.map((s, i) => {
    const cx = getX(i);
    const cyA = getY(s.arroganceScore);
    const cyH = getY(s.humanityScore);
    const isActive = i === activeHuntIndex;
    return `
      <g class="chart-point-hit" data-stage-index="${i}">
        <line x1="${cx}" y1="${padT}" x2="${cx}" y2="${height - padB}" stroke="${isActive ? '#b88c3e' : 'transparent'}" stroke-width="1.5" stroke-dasharray="3,3" />
        <circle cx="${cx}" cy="${cyA}" r="${isActive ? 7 : 5}" fill="#9c3b2c" stroke="#fff" stroke-width="2" />
        <circle cx="${cx}" cy="${cyH}" r="${isActive ? 7 : 5}" fill="#275e44" stroke="#fff" stroke-width="2" />
        <text x="${cx}" y="${height - 10}" text-anchor="middle" font-size="10.5" font-weight="${isActive ? '700' : '500'}" fill="${isActive ? '#132820' : '#697970'}">Chặng ${i + 1}</text>
      </g>
    `;
  }).join('');

  wrap.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Biểu đồ chuyển biến tâm lý ông Diểu qua 5 chặng">
      ${gridLines}
      <polyline fill="none" stroke="#9c3b2c" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" points="${arrogancePoints}" />
      <polyline fill="none" stroke="#275e44" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" points="${humanityPoints}" />
      ${pointsMarkup}
    </svg>
  `;

  wrap.querySelectorAll('.chart-point-hit').forEach((g) => {
    g.addEventListener('click', () => {
      selectHuntingStage(Number(g.dataset.stageIndex));
    });
  });
}

function selectHuntingStage(index) {
  activeHuntIndex = Math.max(0, Math.min(HUNTING_STAGES.length - 1, index));
  const data = HUNTING_STAGES[activeHuntIndex];

  document.querySelectorAll('.trail-btn').forEach((btn) => {
    const active = Number(btn.dataset.stageIndex) === activeHuntIndex;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });

  document.getElementById('hunt-stage-chip').textContent = `Chặng ${data.stage} / ${HUNTING_STAGES.length}`;
  document.getElementById('hunt-stage-loc').textContent = `📍 ${data.location}`;
  document.getElementById('hunt-stage-title').textContent = data.title;
  document.getElementById('hunt-stage-quote').textContent = data.quote;
  document.getElementById('hunt-outer-action').textContent = data.outerAction;
  document.getElementById('hunt-stripped').textContent = data.strippedAway;
  document.getElementById('hunt-inner-psych').textContent = data.innerPsychology;

  document.getElementById('bar-arrogance').style.width = `${data.arroganceScore}%`;
  document.getElementById('bar-humanity').style.width = `${data.humanityScore}%`;

  document.getElementById('hunt-prev-btn').disabled = activeHuntIndex === 0;
  document.getElementById('hunt-next-btn').disabled = activeHuntIndex === HUNTING_STAGES.length - 1;

  renderPsychologyChart();
}

function renderSymbols() {
  const grid = document.getElementById('symbols-grid');
  grid.innerHTML = SYMBOLS_LIST.map(
    (sym) => `
      <article class="symbol-card">
        <span class="symbol-tag">${sym.tag}</span>
        <h4>${sym.title}</h4>
        <p>${sym.meaning}</p>
      </article>
    `,
  ).join('');
}

function populateScriptModal() {
  const container = document.getElementById('modal-script-list');
  container.innerHTML = SUMMARY_NODES.map(
    (node) => `
      <div class="script-item">
        <strong>Chặng ${node.step}: ${node.title}</strong>
        <p>${node.voiceScript}</p>
      </div>
    `,
  ).join('');
}

function setupModals() {
  const openModal = (id) => {
    const el = document.getElementById(id);
    if (el) el.hidden = false;
  };
  const closeModal = (id) => {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  };

  document.getElementById('open-diagram-btn')?.addEventListener('click', () => openModal('diagram-modal'));
  document.getElementById('open-script-btn')?.addEventListener('click', () => openModal('script-modal'));

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) backdrop.hidden = true;
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop').forEach((m) => {
        m.hidden = true;
      });
    }
  });
}

function setupShareAndCopy() {
  const copyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Đã sao chép đường link sách điện tử để gửi nhóm lớp!');
    } catch {
      showToast(`Link trang web: ${url}`);
    }
  };

  document.getElementById('copy-link-btn')?.addEventListener('click', copyLink);
  document.getElementById('back-copy-link-btn')?.addEventListener('click', copyLink);

  document.getElementById('copy-script-btn')?.addEventListener('click', async () => {
    const fullText = SUMMARY_NODES.map((n) => n.voiceScript).join('\n\n');
    try {
      await navigator.clipboard.writeText(fullText);
      showToast('Đã sao chép toàn bộ kịch bản 5 chặng!');
    } catch {
      showToast('Không thể truy cập clipboard, hãy bôi đen đoạn văn để sao chép.');
    }
  });
}

function initPetalAtmosphere() {
  const canvas = document.getElementById('petal-canvas');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const particles = Array.from({ length: 24 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: 1.5 + Math.random() * 2.4,
    vx: -0.2 + Math.random() * 0.45,
    vy: 0.28 + Math.random() * 0.48,
    alpha: 0.16 + Math.random() * 0.3,
  }));

  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > canvas.height + 10) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 250, 236, ${p.alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function bootstrap() {
  populateAuthorInfo();
  renderSymbols();
  populateScriptModal();
  setupModals();
  setupShareAndCopy();
  initPetalAtmosphere();

  const narration = new NarrationController({
    nodes: SUMMARY_NODES,
    candidatePaths: BOOK_CONFIG.audioPaths,
    onNodeChange: (idx) => {
      updateFlowchartSelection(idx);
    },
  });

  renderFlowchart((idx) => {
    updateFlowchartSelection(idx);
  });
  updateFlowchartSelection(0);
  renderModalFlowchart(narration);

  document.getElementById('play-node-btn')?.addEventListener('click', () => {
    narration.playNode(activeSummaryIndex);
  });

  renderHuntingTrail();
  selectHuntingStage(0);

  document.getElementById('hunt-prev-btn')?.addEventListener('click', () => {
    selectHuntingStage(activeHuntIndex - 1);
  });
  document.getElementById('hunt-next-btn')?.addEventListener('click', () => {
    selectHuntingStage(activeHuntIndex + 1);
  });

  new FlipbookController({
    bookEl: document.getElementById('flipbook'),
    stageEl: document.getElementById('book-stage'),
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);
