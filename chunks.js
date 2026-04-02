// ── chunks.js ── Infinite grid: chunk creation, removal, fading, card textures

import * as THREE from 'three';
import { state } from './state.js';
import { CARDS } from './data.js';
import { scene, camera, renderer } from './scene.js';

// ── Constants ──
const CHUNK_SIZE = 6;
const RENDER_RADIUS = state.isMobile ? 2 : 3;
const CARD_WIDTH = 2.4;
const CARD_HEIGHT = 3;

// ── State ──
const activeChunks = new Map();
const geometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT);

// ── Card Texture Generation ──

function darken(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount)) | 0;
  const g = Math.max(0, ((n >> 8) & 0xff) * (1 - amount)) | 0;
  const b = Math.max(0, (n & 0xff) * (1 - amount)) | 0;
  return `rgb(${r},${g},${b})`;
}

function drawStar(ctx, cx, cy, r, color, alpha) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = alpha * 0.8;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawCorner(ctx, px, py, dx, dy) {
  ctx.strokeStyle = 'rgba(201,169,110,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px, py + dy * 20);
  ctx.lineTo(px, py);
  ctx.lineTo(px + dx * 20, py);
  ctx.stroke();
}

function createCardTexture(card) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 640);
  gradient.addColorStop(0, card.color);
  gradient.addColorStop(1, darken(card.color, 0.4));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 640);

  // Aged paper noise
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 1500; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
    ctx.fillRect(Math.random() * 512, Math.random() * 640, 1, 1);
  }
  ctx.globalAlpha = 1;

  // Double border
  ctx.strokeStyle = 'rgba(201,169,110,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, 480, 608);
  ctx.strokeRect(20, 20, 472, 600);

  // Star emblem
  drawStar(ctx, 256, 150, 50, '#c9a96e', 0.25);

  // Type label
  ctx.fillStyle = 'rgba(201,169,110,0.45)';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText((card.type || '').toUpperCase(), 256, 210);

  // Separator line
  ctx.strokeStyle = 'rgba(201,169,110,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, 230); ctx.lineTo(392, 230); ctx.stroke();

  // Arabic name
  ctx.fillStyle = '#e8d5a8';
  ctx.font = 'bold 36px Amiri, serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(card.name, 256, 285);

  // Latin name
  ctx.fillStyle = 'rgba(201,169,110,0.9)';
  ctx.font = '22px Playfair Display, serif';
  ctx.fillText(card.latin, 256, 335);

  // Year
  ctx.fillStyle = 'rgba(201,169,110,0.6)';
  ctx.font = '18px serif';
  ctx.fillText(card.year, 256, 385);

  // Lower separator
  ctx.strokeStyle = 'rgba(201,169,110,0.25)';
  ctx.beginPath(); ctx.moveTo(160, 415); ctx.lineTo(352, 415); ctx.stroke();

  // Role
  ctx.fillStyle = 'rgba(232,213,168,0.6)';
  ctx.font = '15px serif';
  ctx.fillText(card.role, 256, 450);

  // Click hint
  ctx.fillStyle = 'rgba(201,169,110,0.3)';
  ctx.font = state.isMobile ? '12px sans-serif' : '11px sans-serif';
  ctx.fillText(state.isMobile ? '— TAP TO READ —' : '— CLICK TO READ —', 256, 520);

  // Corner ornaments
  drawCorner(ctx, 30, 30, 1, 1);
  drawCorner(ctx, 482, 30, -1, 1);
  drawCorner(ctx, 30, 610, 1, -1);
  drawCorner(ctx, 482, 610, -1, -1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

// Pre-generate all textures
const textures = CARDS.map(card => createCardTexture(card));

// ── Chunk Logic ──

function chunkKey(cx, cy) {
  return `${cx},${cy}`;
}

function cardIndexForChunk(cx, cy) {
  return Math.abs(((cx * 73856093) ^ (cy * 19349663)) % CARDS.length);
}

function createChunk(cx, cy) {
  const key = chunkKey(cx, cy);
  if (activeChunks.has(key)) return;

  const group = new THREE.Group();
  const seed = Math.abs((cx * 7 + cy * 13) % 17);
  const count = 2 + (seed % 2);

  for (let i = 0; i < count; i++) {
    const cardIndex = cardIndexForChunk(cx + i * 3, cy + i * 7);
    const material = new THREE.MeshStandardMaterial({
      map: textures[cardIndex],
      roughness: 0.7, metalness: 0.1,
      transparent: true, opacity: 0,
    });

    const mesh = new THREE.Mesh(geometry, material);
    const offsetX = ((i * 2.7 + seed * 0.3) % CHUNK_SIZE) - CHUNK_SIZE / 2;
    const offsetY = ((i * 3.1 + seed * 0.7) % CHUNK_SIZE) - CHUNK_SIZE / 2;

    mesh.position.set(
      cx * CHUNK_SIZE + offsetX,
      cy * CHUNK_SIZE + offsetY,
      -Math.random() * 3
    );
    mesh.rotation.z = (Math.random() - 0.5) * 0.08;
    mesh.rotation.x = (Math.random() - 0.5) * 0.04;
    mesh.userData = { material, cardIndex };

    group.add(mesh);
  }

  scene.add(group);
  activeChunks.set(key, group);
}

function removeChunk(cx, cy) {
  const key = chunkKey(cx, cy);
  const group = activeChunks.get(key);
  if (!group) return;

  group.traverse(child => {
    if (child.isMesh) child.material.dispose();
  });
  scene.remove(group);
  activeChunks.delete(key);
}

/**
 * Create/remove chunks based on camera position
 */
export function updateChunks() {
  const ccx = Math.round(camera.position.x / CHUNK_SIZE);
  const ccy = Math.round(camera.position.y / CHUNK_SIZE);

  // Create nearby chunks
  for (let dx = -RENDER_RADIUS; dx <= RENDER_RADIUS; dx++) {
    for (let dy = -RENDER_RADIUS; dy <= RENDER_RADIUS; dy++) {
      createChunk(ccx + dx, ccy + dy);
    }
  }

  // Remove distant chunks
  for (const [key] of activeChunks) {
    const [cx, cy] = key.split(',').map(Number);
    if (Math.abs(cx - ccx) > RENDER_RADIUS + 1 || Math.abs(cy - ccy) > RENDER_RADIUS + 1) {
      removeChunk(cx, cy);
    }
  }
}

/**
 * Fade cards based on distance from camera
 */
export function updateFade() {
  const camPos = camera.position;

  scene.traverse(child => {
    if (!child.isMesh || !child.userData.material) return;
    const dist = child.position.distanceTo(camPos);
    let opacity = dist > 14 ? 1 - Math.min(1, (dist - 14) / 8) : 1;
    opacity = Math.max(0, Math.min(1, opacity));
    child.userData.material.opacity += (opacity - child.userData.material.opacity) * 0.08;
  });
}
