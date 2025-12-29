'use strict';

// Constants
const START_DATE = new Date('2025-06-09T00:00:00');
const MAX_ROCKETS = 20;
const GRAVITY = 0.05;
const FIREWORK_COLORS = ['#d4af37', '#f0d875', '#faf8f5', '#ff6b6b', '#4ecdc4', '#ffe66d'];

// DOM Elements
const elements = {
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    unlockBtn: document.getElementById('unlock-btn'),
    fireworksPage: document.getElementById('fireworks-page'),
    spotlightPage: document.getElementById('spotlight-page'),
    canvas: document.getElementById('fireworks-canvas'),
    fireworksTitle: document.getElementById('fireworks-title'),
    fireworksSubtitle: document.getElementById('fireworks-subtitle'),
    continueBtn: document.getElementById('continue-btn'),
    spotlightOverlay: document.getElementById('spotlight-overlay'),
    flashlightCursor: document.getElementById('flashlight-cursor'),
    backBtn: document.getElementById('back-btn')
};

// State
let ctx = null;
let firework = null;
let animationId = null;
let isAnimating = false;

// Counter
function updateCounter() {
    const now = new Date();
    let diff = Math.abs(now - START_DATE);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    elements.days.textContent = String(days).padStart(2, '0');
    elements.hours.textContent = String(hours).padStart(2, '0');
    elements.minutes.textContent = String(minutes).padStart(2, '0');
    elements.seconds.textContent = String(seconds).padStart(2, '0');
}

updateCounter();
setInterval(updateCounter, 1000);

// Scroll Reveal
function revealOnScroll() {
    const paragraphs = document.querySelectorAll('.letter-content p');

    paragraphs.forEach((p, index) => {
        const rect = p.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.85) {
            setTimeout(() => p.classList.add('visible'), index * 150);
        }
    });
}

window.addEventListener('scroll', revealOnScroll);
revealOnScroll();

// Firework Class
class Firework {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particles = [];
        this.rockets = [];
    }

    createRocket() {
        this.rockets.push({
            x: Math.random() * this.canvas.width,
            y: this.canvas.height,
            targetY: Math.random() * (this.canvas.height * 0.4) + 50,
            speed: 8 + Math.random() * 4,
            color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)]
        });
    }

    explode(x, y, color) {
        const particleCount = 80 + Math.floor(Math.random() * 40);
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                alpha: 1,
                decay: 0.015 + Math.random() * 0.01,
                size: 2 + Math.random() * 2
            });
        }
    }

    update() {
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const rocket = this.rockets[i];
            rocket.y -= rocket.speed;
            if (rocket.y <= rocket.targetY) {
                this.explode(rocket.x, rocket.y, rocket.color);
                this.rockets.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += GRAVITY;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.rockets.forEach(rocket => {
            this.ctx.beginPath();
            this.ctx.arc(rocket.x, rocket.y, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = rocket.color;
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.moveTo(rocket.x, rocket.y);
            this.ctx.lineTo(rocket.x, rocket.y + 20);
            this.ctx.strokeStyle = rocket.color;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        this.particles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${this.hexToRgb(p.color)}, ${p.alpha})`;
            this.ctx.fill();
        });
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : '255, 255, 255';
    }
}

// Canvas Resize
function resizeCanvas() {
    if (elements.canvas) {
        elements.canvas.width = window.innerWidth;
        elements.canvas.height = window.innerHeight;
    }
}

window.addEventListener('resize', resizeCanvas);

// Spotlight Update
function updateSpotlightPosition(x, y) {
    elements.spotlightOverlay.style.setProperty('--mouse-x', `${x}px`);
    elements.spotlightOverlay.style.setProperty('--mouse-y', `${y}px`);
    elements.flashlightCursor.style.left = `${x}px`;
    elements.flashlightCursor.style.top = `${y}px`;
}

// Unlock Button
elements.unlockBtn.addEventListener('click', () => {
    if (isAnimating) return;
    isAnimating = true;

    document.body.classList.add('celebration-active');
    elements.fireworksPage.classList.add('visible');
    window.scrollTo(0, 0);

    setTimeout(() => {
        resizeCanvas();
        ctx = elements.canvas.getContext('2d');
        firework = new Firework(elements.canvas, ctx);

        let rocketCount = 0;

        function animate() {
            firework.update();
            firework.draw();
            animationId = requestAnimationFrame(animate);
        }

        function launchRocket() {
            if (rocketCount < MAX_ROCKETS) {
                firework.createRocket();
                rocketCount++;
                setTimeout(launchRocket, 250 + Math.random() * 400);
            } else {
                setTimeout(() => cancelAnimationFrame(animationId), 4000);
            }
        }

        animate();
        launchRocket();

        setTimeout(() => {
            elements.fireworksTitle.classList.add('visible');
            elements.fireworksSubtitle.classList.add('visible');
        }, 500);

        setTimeout(() => elements.continueBtn.classList.add('visible'), 2000);
    }, 500);
});

// Continue Button
elements.continueBtn.addEventListener('click', () => {
    // Add fade-out effect to fireworks page
    elements.fireworksPage.classList.add('fading-out');
    
    // Delay spotlight page appearance for smooth transition
    setTimeout(() => {
        elements.fireworksPage.classList.remove('visible');
        elements.fireworksPage.classList.remove('fading-out');
        elements.spotlightPage.classList.add('visible');

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        updateSpotlightPosition(centerX, centerY);
    }, 800);
});

// Spotlight Events
elements.spotlightPage.addEventListener('mouseenter', () => {
    elements.flashlightCursor.classList.add('active');
});

elements.spotlightPage.addEventListener('mouseleave', () => {
    elements.flashlightCursor.classList.remove('active');
});

elements.spotlightPage.addEventListener('mousemove', (e) => {
    updateSpotlightPosition(e.clientX, e.clientY);
});

elements.spotlightPage.addEventListener('touchstart', (e) => {
    e.preventDefault();
    updateSpotlightPosition(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

elements.spotlightPage.addEventListener('touchmove', (e) => {
    e.preventDefault();
    updateSpotlightPosition(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

// Back Button
elements.backBtn.addEventListener('click', () => {
    elements.spotlightPage.classList.remove('visible');
    elements.fireworksPage.classList.remove('visible');
    document.body.classList.remove('celebration-active');

    elements.fireworksTitle.classList.remove('visible');
    elements.fireworksSubtitle.classList.remove('visible');
    elements.continueBtn.classList.remove('visible');
    elements.flashlightCursor.classList.remove('active');
    isAnimating = false;

    window.scrollTo(0, 0);
});
