// ── ui.js ── Detail panel, directory drawer, gesture tutorial

import { state } from './state.js';
import { CARDS } from './data.js';
import { fetchPhoto } from './photos.js';

// ── DOM References ──
const detailOverlay = document.getElementById('detailOverlay');
const detailPanel = document.getElementById('detailPanel');
const detailClose = document.getElementById('detailClose');
const detailBackdrop = document.getElementById('detailBackdrop');
const directory = document.getElementById('directory');
const directoryBackdrop = document.getElementById('dirBackdrop');

// ── Detail Panel ──

export async function showDetail(index) {
  const card = CARDS[index];
  const photo = document.getElementById('detailPhoto');
  const loadingText = document.getElementById('loadingText');
  const locationEl = document.getElementById('detailLocation');

  // Populate text content
  document.getElementById('detailType').textContent = card.type;
  document.getElementById('detailNameAr').textContent = card.name;
  document.getElementById('detailNameLatin').textContent = card.latin;
  document.getElementById('detailYears').textContent = card.year;
  document.getElementById('detailRole').textContent = card.role;
  document.getElementById('detailSummaryEn').textContent = card.summary;
  document.getElementById('detailSummaryAr').textContent = card.summaryAr;
  document.getElementById('detailQuote').textContent = `« ${card.quote} »`;

  // Location (events only)
  if (card.location) {
    locationEl.textContent = card.location;
    locationEl.style.display = 'flex';
  } else {
    locationEl.style.display = 'none';
  }

  // Reset photo
  photo.classList.remove('loaded', 'is-person');
  photo.src = '';
  loadingText.textContent = 'Loading photo...';
  if (card.isPerson) photo.classList.add('is-person');

  // Show panel
  detailOverlay.classList.add('visible');
  document.body.classList.add('panel-open');
  state.panelOpen = true;
  detailPanel.scrollTop = 0;

  // Load photo: try directPhoto first, then Wikipedia API
  if (card.directPhoto) {
    photo.src = card.directPhoto;
    photo.onload = () => { photo.classList.add('loaded'); loadingText.textContent = ''; };
    photo.onerror = async () => {
      if (card.wiki) {
        const url = await fetchPhoto(card.wiki, card.wikiAlt);
        if (url) {
          photo.src = url;
          photo.onload = () => { photo.classList.add('loaded'); loadingText.textContent = ''; };
          photo.onerror = () => { loadingText.textContent = 'Photo unavailable'; };
        } else {
          loadingText.textContent = 'Photo unavailable';
        }
      }
    };
  } else if (card.wiki) {
    const url = await fetchPhoto(card.wiki, card.wikiAlt);
    if (url) {
      photo.src = url;
      photo.onload = () => { photo.classList.add('loaded'); loadingText.textContent = ''; };
      photo.onerror = () => { loadingText.textContent = 'Photo unavailable'; };
    } else {
      loadingText.textContent = 'Photo unavailable';
    }
  }
}

export function hideDetail() {
  detailOverlay.classList.remove('visible');
  document.body.classList.remove('panel-open');
  state.panelOpen = false;
  state.focusTarget = null;
}

// Close handlers
detailClose.addEventListener('click', hideDetail);
detailBackdrop.addEventListener('click', hideDetail);

// ── Mobile Swipe to Dismiss ──
let swipeStartY = 0;
detailPanel.addEventListener('touchstart', e => {
  if (detailPanel.scrollTop <= 0) swipeStartY = e.touches[0].clientY;
}, { passive: true });

detailPanel.addEventListener('touchmove', e => {
  if (detailPanel.scrollTop <= 0) {
    const dy = e.touches[0].clientY - swipeStartY;
    if (dy > 80) { hideDetail(); swipeStartY = 9999; }
  }
}, { passive: true });

// ── Directory Drawer ──

export function buildDirectory() {
  const content = document.getElementById('dirContent');
  const groups = {};

  CARDS.forEach((card, index) => {
    const type = card.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push({ ...card, idx: index });
  });

  let html = '';
  for (const [type, items] of Object.entries(groups)) {
    html += `<div class="directory-section">${type}</div>`;
    items.forEach(card => {
      html += `<div class="directory-item" data-idx="${card.idx}">
        <div class="di-dot" style="background:${card.color}"></div>
        <div class="di-info">
          <div class="di-name">${card.name}</div>
          <div class="di-latin">${card.latin} · ${card.year}</div>
        </div>
      </div>`;
    });
  }

  content.innerHTML = html;

  // Click handler for each directory item
  content.querySelectorAll('.directory-item').forEach(el => {
    el.addEventListener('click', () => {
      const index = parseInt(el.dataset.idx);
      closeDirectory();
      showDetail(index);
    });
  });
}

export function openDirectory() {
  directory.classList.add('open');
  directoryBackdrop.classList.add('visible');
  state.dirOpen = true;
}

export function closeDirectory() {
  directory.classList.remove('open');
  directoryBackdrop.classList.remove('visible');
  state.dirOpen = false;
}

document.getElementById('dirClose').addEventListener('click', closeDirectory);
directoryBackdrop.addEventListener('click', closeDirectory);

// ── Gesture Tutorial (mobile only) ──

export function showGestureTutorial() {
  if (!state.isMobile) return;

  const overlay = document.getElementById('gestureOverlay');
  const phase1 = document.getElementById('gesturePhase1');
  const phase2 = document.getElementById('gesturePhase2');
  const skipBtn = document.getElementById('gestureSkip');

  overlay.classList.add('visible');

  // Phase 2 after 3.5s
  setTimeout(() => {
    phase1.classList.remove('active');
    phase2.classList.add('active');
  }, 3500);

  // Auto-dismiss after 7.5s
  const dismiss = () => overlay.classList.remove('visible');
  setTimeout(dismiss, 7500);
  skipBtn.addEventListener('click', dismiss);
  overlay.addEventListener('click', e => { if (e.target === overlay) dismiss(); });
}

// ── Keyboard Shortcuts ──
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (state.panelOpen) hideDetail();
    else if (state.dirOpen) closeDirectory();
  }
});
