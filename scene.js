// ── scene.js ── Three.js scene, camera, renderer, lighting, particles

import * as THREE from 'three';
import { state } from './state.js';

// ── Scene ──
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e1b16);
scene.fog = new THREE.FogExp2(0x1e1b16, 0.035);

// ── Camera ──
export const camera = new THREE.PerspectiveCamera(
  60, window.innerWidth / window.innerHeight, 0.1, 100
);
camera.position.set(0, 0, 12);

// Initialize shared Vector3s for focus animation
state.focusStart = new THREE.Vector3();
state.focusEnd = new THREE.Vector3();

// ── Renderer ──
const container = document.getElementById('canvas-container');
export const renderer = new THREE.WebGLRenderer({ antialias: !state.isMobile });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, state.isMobile ? 1.5 : 2));
container.appendChild(renderer.domElement);

// ── Lighting ──
scene.add(new THREE.AmbientLight(0xb8945a, 0.5));

export const pointLight1 = new THREE.PointLight(0xb8945a, 1.5, 30);
pointLight1.position.set(5, 5, 10);
scene.add(pointLight1);

export const pointLight2 = new THREE.PointLight(0x9a8260, 0.8, 25);
pointLight2.position.set(-5, -3, 8);
scene.add(pointLight2);

// ── Particles ──
const particleCount = state.isMobile ? 60 : 200;
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 40;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particleMaterial = new THREE.PointsMaterial({
  color: 0xb8945a, size: 0.03,
  transparent: true, opacity: 0.3,
  sizeAttenuation: true,
});

export const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

/**
 * Animate floating dust particles
 */
export function updateParticles(time) {
  const pos = particleGeometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    pos[i * 3 + 1] += Math.sin(time + i) * 0.001;
    pos[i * 3] += Math.cos(time * 0.7 + i * 0.5) * 0.0005;
  }
  particleGeometry.attributes.position.needsUpdate = true;
}

/**
 * Handle window resize
 */
export function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize);
