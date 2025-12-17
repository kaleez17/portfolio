// script.js

/* ========== Theme toggle ========== */
const themeToggle = document.getElementById('themeToggle');
function setVars(dark = true) {
  const root = document.documentElement;
  if (dark) {
    root.style.setProperty('--bg', '#0f1115');
    root.style.setProperty('--layer', '#0a0d12');
    root.style.setProperty('--card', '#121820');
    root.style.setProperty('--text', '#e6eef6');
    root.style.setProperty('--muted', '#9aa4b2');
    document.body.style.background = 'linear-gradient(180deg,#0a0d12,#0f1115)';
  } else {
    root.style.setProperty('--bg', '#f6f8fb');
    root.style.setProperty('--layer', '#eef2f8');
    root.style.setProperty('--card', '#ffffff');
    root.style.setProperty('--text', '#071021');
    root.style.setProperty('--muted', '#475569');
    document.body.style.background = 'linear-gradient(180deg,#f6f8fb,#e9eef6)';
  }
}
function toggleTheme() {
  const current = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  setVars(current === '#0f1115' ? false : true);
}
if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

/* ========== Ripple effect (buttons) ========== */
function initRipple() {
  document.querySelectorAll('[data-ripple]').forEach(btn => {
    btn.addEventListener('click', e => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}
// Ripple style injected via JS for performance
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
.ripple {
  position:absolute; border-radius:50%; transform:scale(0);
  background:rgba(255,255,255,0.35); animation:ripple .6s ease-out;
}
@keyframes ripple { to { transform:scale(2.2); opacity:0; } }
`;
document.head.appendChild(rippleStyle);

/* ========== Magnetic buttons (hero CTA) ========== */
function initMagnetButtons() {
  const magnets = document.querySelectorAll('.magnet');
  magnets.forEach(btn => {
    const strength = 20;
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x/strength}px, ${y/strength}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; });
  });
}

/* ========== Scroll reveal ========== */
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) entry.target.classList.add('show');
    }
  }, { threshold: 0.18 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ========== Tilt effect (cards) ========== */
function initTilt() {
  const cards = document.querySelectorAll('.tilt');
  cards.forEach(card => {
    const maxTilt = 6; // degrees
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const rx = ((cy / rect.height) - 0.5) * -maxTilt;
      const ry = ((cx / rect.width) - 0.5) * maxTilt;
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; });
  });
}

/* ========== Skill bars (About) ========== */
function initSkills() {
  const bars = document.querySelectorAll('.fill');
  const animateBars = () => {
    bars.forEach(bar => {
      const pct = bar.style.getPropertyValue('--pct') || '0%';
      bar.animate([{ width: '0%' }, { width: pct }], { duration: 900, easing: 'cubic-bezier(.2,.9,.3,1)' });
      bar.style.width = pct;
    });
  };
  const skillsCard = document.querySelector('.skills-card');
  if (!skillsCard) return;
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) animateBars();
  }, { threshold: 0.35 });
  io.observe(skillsCard);
}

/* ========== Particle engine (Hero) ========== */
class Particle {
  constructor(x, y, vx, vy, size, life, color, spin = 0, type = 'circle') {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.size = size; this.life = life; this.maxLife = life;
    this.color = color; this.spin = spin; this.rot = 0; this.type = type;
  }
  update(dt) {
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.vy += 6 * dt; this.rot += this.spin * dt; this.life -= dt;
  }
  draw(ctx) {
    const t = Math.max(0, this.life / this.maxLife);
    ctx.save(); ctx.globalAlpha = t; ctx.translate(this.x, this.y); ctx.rotate(this.rot);
    ctx.fillStyle = this.color;
    if (this.type === 'circle') { ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI*2); ctx.fill(); }
    else { // soft diamond
      const s = this.size;
      ctx.beginPath();
      ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
}
class Emitter {
  constructor(container) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'anim-canvas';
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.running = false;
    container.appendChild(this.canvas);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.last = performance.now();
    this._tick = this._tick.bind(this);
  }
  resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = this.canvas.parentElement.clientWidth;
    const h = this.canvas.parentElement.clientHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  burst(x, y, count = 24) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 160;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 2 + Math.random() * 8;
      const life = 1.4 + Math.random() * 1.3;
      const hue = 200 + Math.floor(Math.random() * 160);
      const color = `hsla(${hue}, 80%, 65%, ${0.14 + Math.random() * 0.3})`;
      const type = Math.random() < 0.5 ? 'circle' : 'diamond';
      this.particles.push(new Particle(x, y, vx, vy, size, life, color, (Math.random()-0.5)*1.6, type));
    }
  }
  idle(centerX, centerY) {
    // gentle drift particles
    for (let i = 0; i < 6; i++) {
      const vx = (Math.random() - 0.5) * 40;
      const vy = (Math.random() - 0.6) * 30;
      const size = 2 + Math.random() * 6;
      const life = 2.2 + Math.random() * 1.4;
      const color = `rgba(183,140,255,${0.12 + Math.random() * 0.2})`;
      this.particles.push(new Particle(centerX + (Math.random()-0.5)*80, centerY + (Math.random()-0.5)*60, vx, vy, size, life, color, (Math.random()-0.5), 'circle'));
    }
  }
  start() { if (!this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame(this._tick); } }
  stop() { this.running = false; }
  _tick(now) {
    if (!this.running) return;
    const dt = Math.min(0.04, (now - this.last) / 1000);
    this.last = now;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    for (const p of this.particles) p.draw(this.ctx);
    requestAnimationFrame(this._tick);
  }
}
let emitter;
/* Init hero particles */
function initHeroParticles() {
  const layer = document.getElementById('animLayer');
  if (!layer) return;
  emitter = new Emitter(layer);
  emitter.start();
  const center = () => {
    const rect = layer.getBoundingClientRect();
    return [rect.width * 0.5, rect.height * 0.55];
  };
  let t = 0;
  function loop() {
    const [cx, cy] = center();
    if (Math.random() < 0.7) emitter.idle(cx, cy);
    if (t % 4 === 0) emitter.burst(cx, cy, 16 + Math.floor(Math.random()*10));
    t++; setTimeout(loop, 900 + Math.random()*500);
  }
  loop();
}

/* ========== Intro animations (Home) ========== */
function introAnim() {
  const headline = document.querySelector('.headline');
  const tagline = document.querySelector('.tagline');
  const ctas = document.querySelector('.cta-row');
  const stats = document.querySelector('.stats');
  if (headline) headline.animate([{ transform: 'translateY(18px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 700, easing: 'cubic-bezier(.2,.9,.3,1)' });
  if (tagline) tagline.animate([{ transform: 'translateY(12px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 600, delay: 120, easing: 'cubic-bezier(.2,.9,.3,1)' });
  if (ctas) ctas.animate([{ transform: 'translateY(12px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 600, delay: 220, easing: 'cubic-bezier(.2,.9,.3,1)' });
  if (stats) stats.animate([{ transform: 'translateY(12px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 700, delay: 320, easing: 'cubic-bezier(.2,.9,.3,1)' });
}

/* ========== Contact form demo ========== */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const clearBtn = document.getElementById('contactClear');
  const status = document.getElementById('contactStatus');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cname').value.trim();
    const email = document.getElementById('cemail').value.trim();
    const msg = document.getElementById('cmsg').value.trim();
    if (!name || !email || !msg) {
      status.textContent = 'Please fill all fields.';
      status.style.color = 'var(--accent)';
      return;
    }
    status.textContent = `Thanks, ${name}! This is a demo form — your message is noted.`;
    status.style.color = 'var(--muted)';
    form.reset();
  });
  if (clearBtn) clearBtn.addEventListener('click', () => { form.reset(); status.textContent = ''; });
}

/* ========== Initialize ========== */
document.addEventListener('DOMContentLoaded', () => {
  setVars(true);
  initRipple();
  initMagnetButtons();
  initReveal();
  initTilt();
  initSkills();
  introAnim();
  if (document.getElementById('animLayer')) initHeroParticles();
});