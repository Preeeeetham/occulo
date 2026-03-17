// OCCULO — main.ts
// Animations: hero line reveal, liquid canvas flow, scroll fade-ins, EmailJS

const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

declare const emailjs: {
  init(opts: { publicKey: string }): void;
  sendForm(serviceId: string, templateId: string, form: HTMLFormElement): Promise<void>;
};
emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

function qs<T extends Element>(selector: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el;
}
function qsa<T extends Element>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

(function initNav(): void {
  const nav = document.getElementById('nav') as HTMLElement;
  const onScroll = () => {
    nav.style.borderBottomColor = window.scrollY > 8 ? '#e8e8ed' : 'transparent';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

(function initHeroRule(): void {
  const rule = document.getElementById('heroRule');
  if (!rule) return;
  requestAnimationFrame(() => {
    setTimeout(() => rule.classList.add('drawn'), 200);
  });
})();

// ── Hero Canvas — Liquid Particle Flow ─────────────────────────────────────
(function initHeroCanvas(): void {
  const canvas = document.getElementById('heroCanvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0, height = 0;
  let scrollY = 0;

  class Particle {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    size: number;
    speed: number;
    offset: number;

    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.baseX = this.x;
      this.baseY = this.y;
      this.size = Math.random() * 1.5 + 0.5;
      this.speed = Math.random() * 0.02 + 0.01;
      this.offset = Math.random() * Math.PI * 2;
    }

    update(time: number, scrollOffset: number) {
      const waveX = Math.sin(time * this.speed + this.offset) * 20;
      const waveY = Math.cos(time * this.speed + this.offset * 0.8) * 20;
      const scrollDrag = scrollOffset * (this.size * 0.15);

      this.x = this.baseX + waveX;
      this.y = this.baseY + waveY - scrollDrag;

      if (this.y < -50) this.y = height + 50;
    }

    draw() {
      if (!ctx) return;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.15 * (this.size / 2)})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let particles: Particle[] = [];
  const particleCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 40 : 100;

  function init() {
    width = canvas!.width = canvas!.clientWidth;
    height = canvas!.height = canvas!.clientHeight;
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }

  function render(time: number) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update(time, scrollY);
      p.draw();
    });
    requestAnimationFrame(render);
  }

  window.addEventListener('resize', init);
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  init();
  requestAnimationFrame(render);
})();

(function initReveal(): void {
  const items = qsa<HTMLElement>('[data-reveal]');
  const io = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target as HTMLElement;
      const delay = parseInt(el.dataset.delay ?? '0', 10);
      setTimeout(() => el.classList.add('revealed'), delay);
      io.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });
  items.forEach(el => io.observe(el));
})();

(function initActiveSection(): void {
  const sections = qsa<HTMLElement>('section[id]');
  const navCta = document.querySelector<HTMLAnchorElement>('.nav-cta');
  if (!navCta) return;

  // Prevent URL change and scroll smoothly
  navCta.addEventListener('click', (e) => {
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  const onScroll = () => {
    let current = '';
    sections.forEach(sec => {
      if (sec.getBoundingClientRect().top <= 80) current = sec.id;
    });
    navCta.style.color = current === 'contact' ? '#000' : '';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
})();

(function initHeroReveal(): void {
  const lines = qsa<HTMLElement>('#heroTitle .line');
  lines.forEach((line, i) => {
    const delay = i * 130;
    setTimeout(() => line.classList.add('revealed'), 80 + delay);
  });
  const eyebrow = document.querySelector<HTMLElement>('.hero-eyebrow');
  if (eyebrow) setTimeout(() => eyebrow.classList.add('revealed'), 40);
  const sub = document.querySelector<HTMLElement>('.hero-sub');
  if (sub) setTimeout(() => sub.classList.add('revealed'), 450);
  const actions = document.querySelector<HTMLElement>('.hero-actions');
  if (actions) setTimeout(() => actions.classList.add('revealed'), 580);
})();

(function initWhatGrid(): void {
  const items = qsa<HTMLElement>('.what-item[data-reveal]');
  if (!items.length) return;
  const io = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target as HTMLElement;
      const baseDelay = parseInt(el.dataset.delay ?? '0', 10);
      setTimeout(() => el.classList.add('revealed'), baseDelay);
      io.unobserve(el);
    });
  }, { threshold: 0.08 });
  items.forEach(el => io.observe(el));
})();

(function initForm(): void {
  const form = document.getElementById('contactForm') as HTMLFormElement | null;
  const btn = document.getElementById('formBtn') as HTMLButtonElement | null;
  const status = document.getElementById('formStatus') as HTMLElement | null;
  if (!form || !btn || !status) return;

  let lastSentTime = 0;

  // Remove red border instantly when user starts typing
  const fields = [
    form.elements.namedItem('user_name') as HTMLInputElement,
    form.elements.namedItem('user_email') as HTMLInputElement,
    form.elements.namedItem('message') as HTMLTextAreaElement
  ];
  fields.forEach(field => {
    if (field) field.addEventListener('input', () => field.classList.remove('input-error'));
  });

  form.addEventListener('submit', async (e: Event) => {
    e.preventDefault();

    // Spam / Rate limit check (30 seconds)
    const now = Date.now();
    if (now - lastSentTime < 30000) {
      status.textContent = 'Please wait 30 seconds before sending another message.';
      return;
    }

    const nameInput = form.elements.namedItem('user_name') as HTMLInputElement;
    const emailInput = form.elements.namedItem('user_email') as HTMLInputElement;
    const msgInput = form.elements.namedItem('message') as HTMLTextAreaElement;

    // Clear previous errors
    [nameInput, emailInput, msgInput].forEach(el => el.classList.remove('input-error'));

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const msg = msgInput.value.trim();

    if (!name || !email || !msg) {
      status.textContent = 'Please fill in all fields.';
      if (!name) nameInput.classList.add('input-error');
      if (!email) emailInput.classList.add('input-error');
      if (!msg) msgInput.classList.add('input-error');
      return;
    }

    // Strict Email Regex Validation
    const emailRef = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRef.test(email)) {
      status.textContent = 'Please enter a valid email address.';
      emailInput.classList.add('input-error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending…';
    status.textContent = '';

    try {
      await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form);

      btn.textContent = 'Sent ✓';
      status.textContent = 'Message received. We will respond shortly.';
      lastSentTime = Date.now(); // Record success time
      form.reset();

      // Re-enable button gracefully after 3 seconds so it's not permanently locked
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Send message';
      }, 3000);

    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Send message';
      status.textContent = 'Something went wrong. Try emailing us directly.';
      console.error('EmailJS error:', err);
    }
  });
})();
