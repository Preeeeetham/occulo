"use strict";
// OCCULO — main.ts
// Animations: hero line reveal, liquid canvas flow, scroll fade-ins, EmailJS
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
function qs(selector, root = document) {
    const el = root.querySelector(selector);
    if (!el)
        throw new Error(`Element not found: ${selector}`);
    return el;
}
function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}
(function initNav() {
    const nav = document.getElementById('nav');
    const onScroll = () => {
        nav.style.borderBottomColor = window.scrollY > 8 ? '#e8e8ed' : 'transparent';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
})();
(function initHeroRule() {
    const rule = document.getElementById('heroRule');
    if (!rule)
        return;
    requestAnimationFrame(() => {
        setTimeout(() => rule.classList.add('drawn'), 200);
    });
})();
// ── Hero Canvas — Liquid Particle Flow ─────────────────────────────────────
(function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas)
        return;
    const ctx = canvas.getContext('2d');
    if (!ctx)
        return;
    let width = 0, height = 0;
    let scrollY = 0;
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.baseX = this.x;
            this.baseY = this.y;
            this.size = Math.random() * 1.5 + 0.5;
            this.speed = Math.random() * 0.02 + 0.01;
            this.offset = Math.random() * Math.PI * 2;
        }
        update(time, scrollOffset) {
            const waveX = Math.sin(time * this.speed + this.offset) * 20;
            const waveY = Math.cos(time * this.speed + this.offset * 0.8) * 20;
            const scrollDrag = scrollOffset * (this.size * 0.15);
            this.x = this.baseX + waveX;
            this.y = this.baseY + waveY - scrollDrag;
            if (this.y < -50)
                this.y = height + 50;
        }
        draw() {
            if (!ctx)
                return;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.15 * (this.size / 2)})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    let particles = [];
    const particleCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 40 : 100;
    function init() {
        width = canvas.width = canvas.clientWidth;
        height = canvas.height = canvas.clientHeight;
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }
    function render(time) {
        if (!ctx)
            return;
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
(function initReveal() {
    const items = qsa('[data-reveal]');
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            var _a;
            if (!entry.isIntersecting)
                return;
            const el = entry.target;
            const delay = parseInt((_a = el.dataset.delay) !== null && _a !== void 0 ? _a : '0', 10);
            setTimeout(() => el.classList.add('revealed'), delay);
            io.unobserve(el);
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });
    items.forEach(el => io.observe(el));
})();
(function initActiveSection() {
    const sections = qsa('section[id]');
    const navCta = document.querySelector('.nav-cta');
    if (!navCta)
        return;
    const onScroll = () => {
        let current = '';
        sections.forEach(sec => {
            if (sec.getBoundingClientRect().top <= 80)
                current = sec.id;
        });
        navCta.style.color = current === 'contact' ? '#000' : '';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
})();
(function initHeroReveal() {
    const lines = qsa('#heroTitle .line');
    lines.forEach((line, i) => {
        const delay = i * 130;
        setTimeout(() => line.classList.add('revealed'), 80 + delay);
    });
    const eyebrow = document.querySelector('.hero-eyebrow');
    if (eyebrow)
        setTimeout(() => eyebrow.classList.add('revealed'), 40);
    const sub = document.querySelector('.hero-sub');
    if (sub)
        setTimeout(() => sub.classList.add('revealed'), 450);
    const actions = document.querySelector('.hero-actions');
    if (actions)
        setTimeout(() => actions.classList.add('revealed'), 580);
})();
(function initWhatGrid() {
    const items = qsa('.what-item[data-reveal]');
    if (!items.length)
        return;
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            var _a;
            if (!entry.isIntersecting)
                return;
            const el = entry.target;
            const baseDelay = parseInt((_a = el.dataset.delay) !== null && _a !== void 0 ? _a : '0', 10);
            setTimeout(() => el.classList.add('revealed'), baseDelay);
            io.unobserve(el);
        });
    }, { threshold: 0.08 });
    items.forEach(el => io.observe(el));
})();
(function initForm() {
    const form = document.getElementById('contactForm');
    const btn = document.getElementById('formBtn');
    const status = document.getElementById('formStatus');
    if (!form || !btn || !status)
        return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = form.elements.namedItem('user_name').value.trim();
        const email = form.elements.namedItem('user_email').value.trim();
        const msg = form.elements.namedItem('message').value.trim();
        if (!name || !email || !msg) {
            status.textContent = 'Please fill in all fields.';
            return;
        }
        btn.disabled = true;
        btn.textContent = 'Sending…';
        status.textContent = '';
        try {
            await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form);
            btn.textContent = 'Sent ✓';
            status.textContent = 'Message received. We will respond shortly.';
            form.reset();
        }
        catch (err) {
            btn.disabled = false;
            btn.textContent = 'Send message';
            status.textContent = 'Something went wrong. Try emailing us directly.';
            console.error('EmailJS error:', err);
        }
    });
})();
