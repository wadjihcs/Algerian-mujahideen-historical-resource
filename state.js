// ── state.js ── Shared mutable state across all modules
// All modules import this and read/write the same object

export const state = {
  // Device
  isMobile: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),

  // UI state
  panelOpen: false,
  dirOpen: false,

  // Camera focus animation
  focusTarget: null,
  focusProgress: 0,
  focusStart: null,  // THREE.Vector3 (set in scene.js)
  focusEnd: null,    // THREE.Vector3 (set in scene.js)

  // Navigation velocity
  velocity: { x: 0, y: 0, z: 0 },

  // Drag tracking
  dragging: false,
  canvasClick: false,
  wasDrag: false,
  prevMouse: { x: 0, y: 0 },
  clickStart: { x: 0, y: 0 },

  // Pinch zoom
  lastTouchDist: 0,

  // Keyboard
  keys: {},

  // Animation
  time: 0,
  hintShown: false,

  // Music
  musicPlaying: false,
};
