// ── audio.js ── Background music management

import { state } from './state.js';

const bgMusic = document.getElementById('bgMusic');
const musicIcon = document.getElementById('musicIcon');

// Set initial volume (low but audible)
bgMusic.volume = 0.18;

/**
 * Start music (requires user interaction first — called on "Explore" click)
 */
export function startMusic() {
  bgMusic.play()
    .then(() => {
      state.musicPlaying = true;
      musicIcon.style.opacity = '1';
    })
    .catch(() => {
      musicIcon.style.opacity = '0.4';
    });
}

/**
 * Toggle music on/off
 */
export function toggleMusic() {
  if (state.musicPlaying) {
    bgMusic.pause();
    state.musicPlaying = false;
    musicIcon.style.opacity = '0.4';
  } else {
    bgMusic.play()
      .then(() => {
        state.musicPlaying = true;
        musicIcon.style.opacity = '1';
      })
      .catch(() => {});
  }
}

// Toolbar button
document.getElementById('btnMusic').addEventListener('click', e => {
  e.stopPropagation();
  toggleMusic();
});
