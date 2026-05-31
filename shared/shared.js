// Campus Intelligence Suite - Shared Utilities

// 1. Web Audio API Synthesizer for Audio Feedback
class AudioSynth {
  constructor() {
    this.ctx = null;
    this.enabled = true; // Enabled by default, can toggle
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playScribble() {
    this.init();
    if (!this.enabled) return;

    const sampleRate = this.ctx.sampleRate;
    const duration = 0.12 + Math.random() * 0.08; // 120-200ms
    const bufferSize = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate brown-ish noise for soft friction sound
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain boost
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, this.ctx.currentTime);
    // Add tiny frequency wiggle
    filter.frequency.exponentialRampToValueAtTime(750 + Math.random() * 200, this.ctx.currentTime + duration);
    filter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration - 0.01);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    noiseNode.start();
  }

  playFlip() {
    this.init();
    if (!this.enabled) return;

    const duration = 0.35;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.015 * white)) / 1.015;
      lastOut = data[i];
      data[i] *= 2.0;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + duration);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    noiseNode.start();
  }

  playSqueak() {
    this.init();
    if (!this.enabled) return;

    // A cute whiteboard marker squeak for match/draw success
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.quadraticRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }
}

const synth = new AudioSynth();

// 2. Dark Mode Toggle
function initTheme() {
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  // Set up button toggles if they exist on the page
  const toggles = document.querySelectorAll('.theme-toggle');
  toggles.forEach(toggle => {
    updateToggleIcon(toggle, currentTheme);
    toggle.addEventListener('click', () => {
      synth.playFlip();
      const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      updateToggleIcon(toggle, theme);
    });
  });
}

function updateToggleIcon(btn, theme) {
  // Simple update of icon content inside the SVG toggle button
  if (theme === 'dark') {
    btn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <!-- Sun icon for switching back to light -->
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
    btn.setAttribute('title', 'Switch to Vintage Paper');
  } else {
    btn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <!-- Moon icon for switching to blueprint -->
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
    btn.setAttribute('title', 'Switch to Blueprint Map');
  }
}

// 3. Screen Wipe & Navigations
function initPageTransitions() {
  // Create overlay element if it doesn't exist
  let overlay = document.querySelector('.page-transition-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay exit';
    document.body.appendChild(overlay);
    
    // Clear exit class on load
    setTimeout(() => {
      overlay.classList.remove('exit');
    }, 100);
  }

  // Intercept navigation links with '.nav-transition' class
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-transition');
    if (link) {
      e.preventDefault();
      const targetUrl = link.getAttribute('href');
      synth.playFlip();
      
      overlay.classList.add('active');
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 500); // Must match CSS transition duration (0.6s is safe at 500ms trigger)
    }
  });
}

// 4. Attach general audio triggers to UI actions
function initAudioListeners() {
  document.addEventListener('click', (e) => {
    // If we click a button, check standard sound feedback
    if (e.target.closest('.sketch-btn') || e.target.closest('.theme-toggle')) {
      if (!e.target.closest('.nav-transition')) {
        synth.playScribble();
      }
    }
  });

  // Attach keypress audio on textarea inputs for mechanical keyboard/scribble effect
  document.addEventListener('keydown', (e) => {
    const textarea = e.target.closest('.sketch-textarea, .sketch-input');
    if (textarea && e.key.length === 1) {
      synth.playScribble();
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initPageTransitions();
  initAudioListeners();
});
