/**
 * Virginia Page & Co. Hair Studio
 * Animation Engine
 */

// ============================================
// GLOBAL VISIBILITY STATE
// ============================================
let isPageVisible = !document.hidden;

document.addEventListener('visibilitychange', () => {
  isPageVisible = !document.hidden;
});

// ============================================
// CURSOR FOLLOWER
// ============================================
class CursorFollower {
  constructor() {
    this.cursor = null;
    this.cursorDot = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.cursorX = 0;
    this.cursorY = 0;
    this.dotX = 0;
    this.dotY = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.lastUpdate = 0;
    this.init();
  }

  init() {
    // Only on desktop
    if (window.matchMedia('(pointer: fine)').matches) {
      this.createCursor();
      this.bindEvents();
      this.animate();
    }
  }

  createCursor() {
    this.cursor = document.createElement('div');
    this.cursor.className = 'cursor-follower';

    const inner = document.createElement('div');
    inner.className = 'cursor-follower-inner';
    this.cursor.appendChild(inner);
    document.body.appendChild(this.cursor);

    this.cursorDot = document.createElement('div');
    this.cursorDot.className = 'cursor-dot';
    document.body.appendChild(this.cursorDot);
  }

  bindEvents() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    // Hover effects on interactive elements
    const interactives = document.querySelectorAll('a, button, [data-magnetic]');
    interactives.forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.cursor?.classList.add('cursor-hover');
        this.cursorDot?.classList.add('cursor-hover');
      });
      el.addEventListener('mouseleave', () => {
        this.cursor?.classList.remove('cursor-hover');
        this.cursorDot?.classList.remove('cursor-hover');
      });
    });
  }

  animate() {
    // Pause when tab is hidden
    if (!isPageVisible) {
      requestAnimationFrame(() => this.animate());
      return;
    }

    // Throttle to 30fps
    const now = performance.now();
    if (now - this.lastUpdate < 33) {
      requestAnimationFrame(() => this.animate());
      return;
    }

    // Skip if mouse hasn't moved and cursors caught up
    if (this.lastMouseX === this.mouseX && this.lastMouseY === this.mouseY) {
      const diff = Math.abs(this.cursorX - this.mouseX) + Math.abs(this.cursorY - this.mouseY);
      if (diff < 0.5) {
        requestAnimationFrame(() => this.animate());
        return;
      }
    }

    this.lastUpdate = now;
    this.lastMouseX = this.mouseX;
    this.lastMouseY = this.mouseY;

    // Smooth follow with different speeds
    this.cursorX += (this.mouseX - this.cursorX) * 0.15;
    this.cursorY += (this.mouseY - this.cursorY) * 0.15;
    this.dotX += (this.mouseX - this.dotX) * 0.5;
    this.dotY += (this.mouseY - this.dotY) * 0.5;

    if (this.cursor) {
      this.cursor.style.transform = `translate(${this.cursorX}px, ${this.cursorY}px)`;
    }
    if (this.cursorDot) {
      this.cursorDot.style.transform = `translate(${this.dotX}px, ${this.dotY}px)`;
    }

    requestAnimationFrame(() => this.animate());
  }
}

// ============================================
// SCROLL REVEAL
// ============================================
class ScrollReveal {
  constructor() {
    this.elements = [];
    this.init();
  }

  init() {
    this.elements = document.querySelectorAll('[data-reveal]');
    if (this.elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.dataset.revealDelay || 0;
            setTimeout(() => {
              entry.target.classList.add('revealed');
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    this.elements.forEach((el) => observer.observe(el));
  }
}

// ============================================
// PARALLAX
// ============================================
class Parallax {
  constructor() {
    this.elements = [];
    this.init();
  }

  init() {
    this.elements = document.querySelectorAll('[data-parallax]');
    if (this.elements.length === 0) return;

    window.addEventListener('scroll', () => this.update(), { passive: true });
    this.update();
  }

  update() {
    const scrollY = window.scrollY;

    this.elements.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.5;
      const rect = el.getBoundingClientRect();
      const elementTop = rect.top + scrollY;
      const offset = (scrollY - elementTop) * speed;

      el.style.transform = `translateY(${offset}px)`;
    });
  }
}

// ============================================
// MAGNETIC BUTTONS
// ============================================
class MagneticButtons {
  constructor() {
    this.buttons = [];
    this.init();
  }

  init() {
    this.buttons = document.querySelectorAll('[data-magnetic]');
    if (this.buttons.length === 0) return;

    this.buttons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => this.handleMove(e, btn));
      btn.addEventListener('mouseleave', (e) => this.handleLeave(e, btn));
    });
  }

  handleMove(e, btn) {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const strength = parseFloat(btn.dataset.magnetic) || 0.3;

    btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  }

  handleLeave(e, btn) {
    btn.style.transform = 'translate(0, 0)';
  }
}

// ============================================
// TEXT SPLIT ANIMATION (safe DOM manipulation)
// ============================================
class TextSplit {
  constructor() {
    this.init();
  }

  init() {
    const elements = document.querySelectorAll('[data-split]');
    if (elements.length === 0) return;

    elements.forEach((el) => {
      const text = el.textContent || '';
      const type = el.dataset.split || 'chars';

      // Clear existing content
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }

      if (type === 'chars') {
        text.split('').forEach((char, i) => {
          const span = document.createElement('span');
          span.className = 'split-char';
          span.style.setProperty('--char-index', i.toString());
          span.textContent = char === ' ' ? '\u00A0' : char;
          el.appendChild(span);
        });
      } else if (type === 'words') {
        text.split(' ').forEach((word, i) => {
          if (i > 0) {
            el.appendChild(document.createTextNode(' '));
          }
          const span = document.createElement('span');
          span.className = 'split-word';
          span.style.setProperty('--word-index', i.toString());
          span.textContent = word;
          el.appendChild(span);
        });
      }

      // Observe for reveal
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('split-revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(el);
    });
  }
}

// ============================================
// IMAGE REVEAL
// ============================================
class ImageReveal {
  constructor() {
    this.init();
  }

  init() {
    const images = document.querySelectorAll('[data-img-reveal]');
    if (images.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('img-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    images.forEach((img) => observer.observe(img));
  }
}

// ============================================
// SCROLL PROGRESS BAR
// ============================================
class ScrollProgress {
  constructor() {
    this.bar = null;
    this.init();
  }

  init() {
    this.bar = document.querySelector('[data-scroll-progress]');
    if (!this.bar) return;

    window.addEventListener('scroll', () => this.update(), { passive: true });
    this.update();
  }

  update() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / docHeight) * 100;
    this.bar.style.width = `${scrolled}%`;
  }
}

// ============================================
// TILT EFFECT
// ============================================
class TiltEffect {
  constructor() {
    this.init();
  }

  init() {
    const elements = document.querySelectorAll('[data-tilt]');
    if (elements.length === 0) return;

    elements.forEach((el) => {
      el.addEventListener('mousemove', (e) => this.handleMove(e, el));
      el.addEventListener('mouseleave', (e) => this.handleLeave(e, el));
    });
  }

  handleMove(e, el) {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const strength = parseFloat(el.dataset.tilt) || 10;

    const rotateX = ((y - centerY) / centerY) * -strength;
    const rotateY = ((x - centerX) / centerX) * strength;

    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  handleLeave(e, el) {
    el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  }
}

// ============================================
// COUNTER ANIMATION
// ============================================
class CounterAnimation {
  constructor() {
    this.init();
  }

  init() {
    const counters = document.querySelectorAll('[data-counter]');
    if (counters.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((counter) => observer.observe(counter));
  }

  animateCounter(el) {
    const target = parseInt(el.dataset.counter, 10);
    const duration = parseInt(el.dataset.counterDuration, 10) || 2000;
    const start = 0;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * eased);

      el.textContent = current.toString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toString();
      }
    };

    requestAnimationFrame(update);
  }
}

// ============================================
// SMOOTH SCROLL
// ============================================
class SmoothScroll {
  constructor() {
    this.init();
  }

  init() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      });
    });
  }
}

// ============================================
// STAGGER CHILDREN
// ============================================
class StaggerChildren {
  constructor() {
    this.init();
  }

  init() {
    const parents = document.querySelectorAll('[data-stagger]');
    if (parents.length === 0) return;

    parents.forEach((parent) => {
      const delay = parseFloat(parent.dataset.stagger) || 0.1;
      const children = parent.children;

      Array.from(children).forEach((child, index) => {
        child.style.setProperty('--stagger-delay', `${index * delay}s`);
        child.classList.add('stagger-child');
      });
    });

    // Observe for reveal
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('stagger-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    parents.forEach((parent) => observer.observe(parent));
  }
}

// ============================================
// HORIZONTAL SCROLL
// ============================================
class HorizontalScroll {
  constructor() {
    this.init();
  }

  init() {
    const sections = document.querySelectorAll('[data-horizontal-scroll]');
    if (sections.length === 0) return;

    sections.forEach((section) => {
      const wrapper = section.querySelector('[data-horizontal-wrapper]');
      if (!wrapper) return;

      window.addEventListener('scroll', () => {
        const rect = section.getBoundingClientRect();
        const sectionHeight = section.offsetHeight - window.innerHeight;
        const progress = Math.max(0, Math.min(1, -rect.top / sectionHeight));
        const wrapperWidth = wrapper.scrollWidth - window.innerWidth;

        wrapper.style.transform = `translateX(${-progress * wrapperWidth}px)`;
      }, { passive: true });
    });
  }
}

// ============================================
// LAZY BACKGROUND
// ============================================
class LazyBackground {
  constructor() {
    this.init();
  }

  init() {
    const elements = document.querySelectorAll('[data-bg]');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const bg = entry.target.dataset.bg;
            entry.target.style.backgroundImage = `url(${bg})`;
            entry.target.classList.add('bg-loaded');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '100px' }
    );

    elements.forEach((el) => observer.observe(el));
  }
}

// ============================================
// INIT ALL
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Core animations
  new ScrollReveal();
  new TextSplit();
  new ImageReveal();
  new StaggerChildren();

  // Interactive effects
  new CursorFollower();
  new MagneticButtons();
  new TiltEffect();

  // Scroll-based
  new Parallax();
  new ScrollProgress();
  new HorizontalScroll();

  // Utilities
  new SmoothScroll();
  new CounterAnimation();
  new LazyBackground();
});

// ============================================
// LENIS SMOOTH SCROLL (if loaded)
// ============================================
if (typeof Lenis !== 'undefined') {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}
