// ── app.js ── Entry point: initialization, animation loop, security

import { state } from './state.js';
import { scene, camera, renderer, pointLight1, pointLight2, particles, updateParticles } from './scene.js';
import { updateChunks, updateFade } from './chunks.js';
import { buildDirectory, showGestureTutorial } from './ui.js';
import { processKeyboard, updateNavigation } from './controls.js';
import { startMusic } from './audio.js';

// ── Security ──
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });
console.log('%c⚠ This is a protected historical project.', 'font-size:18px;color:#b8945a;font-weight:bold');
console.log('%cDo not paste any code here.', 'font-size:14px;color:#9a8260');

// ── DOM References ──
const coordsDisplay = document.getElementById('coords');
const clickHint = document.getElementById('clickHint');

// ── Animation Loop ──

function animate() {
  requestAnimationFrame(animate);
  state.time += 0.01;

  // Show click/tap hint once
  if (!state.hintShown && state.time > 3) {
    clickHint.classList.add('visible');
    state.hintShown = true;
    setTimeout(() => clickHint.classList.remove('visible'), 5000);
  }

  // Process keyboard input
  processKeyboard();

  // Camera focus animation (fly to card)
  if (state.focusTarget && state.focusProgress < 1) {
    state.focusProgress += state.isMobile ? 0.018 : 0.025;
    state.focusProgress = Math.min(state.focusProgress, 1);
    const t = 1 - Math.pow(1 - state.focusProgress, 3); // ease-out cubic
    camera.position.lerpVectors(state.focusStart, state.focusEnd, t);
  } else if (!state.panelOpen && !state.dirOpen) {
    // Free navigation
    updateNavigation();
  }

  // Move lights with camera
  pointLight1.position.set(camera.position.x + 5, camera.position.y + 5, camera.position.z + 2);
  pointLight2.position.set(camera.position.x - 5, camera.position.y - 3, camera.position.z + 1);

  // Particles follow camera loosely
  particles.position.x += (camera.position.x - particles.position.x) * 0.01;
  particles.position.y += (camera.position.y - particles.position.y) * 0.01;
  updateParticles(state.time);

  // Update infinite grid
  updateChunks();
  updateFade();

  // Coordinates display
  coordsDisplay.textContent = `X: ${camera.position.x.toFixed(2)}  Y: ${camera.position.y.toFixed(2)}  Z: ${camera.position.z.toFixed(2)}`;

  // Render
  renderer.render(scene, camera);
}

// ── Initialization (on "Explore the Canvas" click) ──

document.getElementById('enterBtn').addEventListener('click', () => {
  // Hide intro
  document.getElementById('intro').classList.add('hidden');
  document.getElementById('toolbar').style.display = 'flex';

  // Mobile-specific hints
  if (state.isMobile) {
    document.getElementById('navHint').innerHTML = 'Swipe to explore · Pinch to zoom<br>Tap a card to read';
    clickHint.textContent = 'Tap on a card to learn more';
  }

  // Build directory & start
  buildDirectory();
  animate();
  startMusic();
  showGestureTutorial();
});
