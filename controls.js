// ── controls.js ── Mouse, touch, keyboard navigation & toolbar

import * as THREE from 'three';
import { state } from './state.js';
import { camera, renderer, scene } from './scene.js';
import { showDetail, openDirectory, hideDetail } from './ui.js';

// ── Raycasting ──
const raycaster = new THREE.Raycaster();
const mouseVec = new THREE.Vector2();

// ── Physics Constants (slower on mobile) ──
const DAMPING = state.isMobile ? 0.88 : 0.92;
const DRAG_SPEED = state.isMobile ? 0.008 : 0.012;
const DRAG_THRESHOLD = state.isMobile ? 12 : 6;

// ── Prevent iOS bounce ──
document.addEventListener('touchmove', e => {
  if (!state.panelOpen && !state.dirOpen) e.preventDefault();
}, { passive: false });

// ── Pointer Events (unified mouse + touch) ──

renderer.domElement.addEventListener('pointerdown', e => {
  if (state.panelOpen || state.dirOpen) return;
  state.dragging = true;
  state.canvasClick = true;
  state.wasDrag = false;
  state.prevMouse = { x: e.clientX, y: e.clientY };
  state.clickStart = { x: e.clientX, y: e.clientY };
});

window.addEventListener('pointermove', e => {
  if (!state.dragging || state.panelOpen || state.dirOpen) return;

  state.velocity.x -= (e.clientX - state.prevMouse.x) * DRAG_SPEED;
  state.velocity.y += (e.clientY - state.prevMouse.y) * DRAG_SPEED;
  state.prevMouse = { x: e.clientX, y: e.clientY };

  const totalMove = Math.abs(e.clientX - state.clickStart.x) + Math.abs(e.clientY - state.clickStart.y);
  if (totalMove > DRAG_THRESHOLD) state.wasDrag = true;
});

window.addEventListener('pointerup', e => {
  state.dragging = false;

  // Only raycast if pointer started on canvas (not toolbar/UI)
  if (state.canvasClick && !state.wasDrag && !state.panelOpen && !state.dirOpen) {
    mouseVec.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseVec.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouseVec, camera);

    const meshes = [];
    scene.traverse(child => {
      if (child.isMesh && child.userData.cardIndex !== undefined) meshes.push(child);
    });

    const hits = raycaster.intersectObjects(meshes);
    if (hits.length > 0) {
      const hitObject = hits[0].object;

      // Animate camera toward clicked card
      state.focusTarget = hitObject;
      state.focusProgress = 0;
      state.focusStart.copy(camera.position);
      state.focusEnd.set(hitObject.position.x, hitObject.position.y, hitObject.position.z + 5);
      state.velocity.x = 0;
      state.velocity.y = 0;
      state.velocity.z = 0;

      setTimeout(() => showDetail(hitObject.userData.cardIndex), 400);
    }
  }

  state.canvasClick = false;
});

// ── Mouse Wheel ──
renderer.domElement.addEventListener('wheel', e => {
  if (state.panelOpen || state.dirOpen) return;
  e.preventDefault();
  state.velocity.z += e.deltaY * 0.003;
}, { passive: false });

// ── Touch Pinch Zoom ──
renderer.domElement.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    state.lastTouchDist = Math.sqrt(dx * dx + dy * dy);
  }
}, { passive: true });

renderer.domElement.addEventListener('touchmove', e => {
  if (e.touches.length === 2 && !state.panelOpen && !state.dirOpen) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    state.velocity.z += (state.lastTouchDist - dist) * 0.006;
    state.lastTouchDist = dist;
  }
}, { passive: true });

// ── Keyboard ──
window.addEventListener('keydown', e => {
  if (!state.panelOpen && !state.dirOpen) state.keys[e.key] = true;
});
window.addEventListener('keyup', e => { state.keys[e.key] = false; });

export function processKeyboard() {
  if (state.panelOpen || state.dirOpen) return;
  const speed = 0.04;
  if (state.keys.ArrowLeft || state.keys.a) state.velocity.x -= speed;
  if (state.keys.ArrowRight || state.keys.d) state.velocity.x += speed;
  if (state.keys.ArrowUp || state.keys.w) state.velocity.y += speed;
  if (state.keys.ArrowDown || state.keys.s) state.velocity.y -= speed;
}

// ── Toolbar (prevent bubbling to canvas) ──
document.getElementById('toolbar').addEventListener('pointerdown', e => e.stopPropagation());

document.getElementById('btnHome').addEventListener('click', e => {
  e.stopPropagation();
  state.focusTarget = { position: { x: 0, y: 0, z: 0 } };
  state.focusProgress = 0;
  state.focusStart.copy(camera.position);
  state.focusEnd.set(0, 0, 12);
  state.velocity.x = 0;
  state.velocity.y = 0;
  state.velocity.z = 0;
});

document.getElementById('btnDir').addEventListener('click', e => {
  e.stopPropagation();
  openDirectory();
});

document.getElementById('btnZoomIn').addEventListener('click', e => {
  e.stopPropagation();
  state.velocity.z -= 0.3;
});

document.getElementById('btnZoomOut').addEventListener('click', e => {
  e.stopPropagation();
  state.velocity.z += 0.3;
});

// ── Physics Update (called each frame) ──

export function updateNavigation() {
  const { velocity: vel } = state;
  vel.x *= DAMPING;
  vel.y *= DAMPING;
  vel.z *= DAMPING;
  camera.position.x += vel.x;
  camera.position.y += vel.y;
  camera.position.z = Math.max(4, Math.min(20, camera.position.z + vel.z));
}

export { DAMPING };
