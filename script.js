document.addEventListener('DOMContentLoaded', () => {

    // --- Utility: throttle scroll listeners with requestAnimationFrame ---
    function onScroll(callback) {
        let ticking = false;
        return function () {
            if (!ticking) {
                requestAnimationFrame(() => {
                    callback();
                    ticking = false;
                });
                ticking = true;
            }
        };
    }

    // --- 1. LOADER ---
    const loader = document.getElementById('loader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 3000); // 3 seconds
    });

    // --- 2 & 4 & 5 & 12: STICKY NAV, PROGRESS BAR, ACTIVE LINK, BACK-TO-TOP ---
    const header = document.getElementById('header');
    const scrollProgressBar = document.getElementById('scroll-progress-bar');
    const sections = document.querySelectorAll('section[id]');
    const navLi = document.querySelectorAll('.nav-links li a');
    const backToTopButton = document.getElementById('back-to-top');

    const updateScrollUI = onScroll(() => {
        const scrollY = window.scrollY || window.pageYOffset;
        const docEl = document.documentElement;

        // Sticky nav
        header.classList.toggle('scrolled', scrollY > 50);

        // Progress bar
        const scrollHeight = docEl.scrollHeight - docEl.clientHeight;
        const scrollPercentage = scrollHeight > 0 ? (scrollY / scrollHeight) * 100 : 0;
        scrollProgressBar.style.width = `${scrollPercentage}%`;

        // Active nav link
        let current = '';
        sections.forEach(section => {
            if (scrollY >= section.offsetTop - 150) {
                current = section.getAttribute('id');
            }
        });
        navLi.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
        });

        // Back to top
        backToTopButton.classList.toggle('hidden', scrollY <= 300);
    });
    window.addEventListener('scroll', updateScrollUI, { passive: true });
    updateScrollUI();

    // --- 3. HAMBURGER MENU ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
    navLinks.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
    });

    // --- 6. SMOOTH SCROLLING ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href === '#') {
                // Back-to-top / brand links -> scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            try {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            } catch (err) {
                // Invalid selector (e.g. unusual href) - ignore
            }
        });
    });

    // --- 7. SCROLL REVEAL ANIMATIONS (IntersectionObserver) ---
const revealElements = document.querySelectorAll('.about-content, .feature-card, .ingredient-card, .timeline-item, .product-card, .gallery-item, .testimonial-card, .faq-item, .contact-grid');
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal', 'active');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        // Fallback: simply show all
        revealElements.forEach(el => el.classList.add('reveal', 'active'));
    }

    // --- 8. FAQ ACCORDION ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const currentlyActive = document.querySelector('.faq-item.active');
            if (currentlyActive && currentlyActive !== item) {
                currentlyActive.classList.remove('active');
                currentlyActive.querySelector('.faq-answer').style.maxHeight = 0;
            }
            
            item.classList.toggle('active');
            const answer = item.querySelector('.faq-answer');
            if (item.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                answer.style.maxHeight = 0;
            }
        });
    });

    // --- 9. GALLERY LIGHTBOX ---
    const galleryItems = document.querySelectorAll('.gallery-item img');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeLightbox = document.querySelector('.close-lightbox');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            lightbox.classList.remove('hidden');
            lightboxImg.src = item.dataset.src;
        });
    });

    closeLightbox.addEventListener('click', () => {
        lightbox.classList.add('hidden');
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) {
            lightbox.classList.add('hidden');
        }
    });

    // --- 11. CUSTOM CURSOR WITH MASALA SPRINKLE EFFECT ---
    const cursor = document.querySelector('.custom-cursor');
    if (window.innerWidth > 768) { // Only show custom cursor on desktop
        // Masala particle palette (spice colors: orange, red, brown, green, yellow)
        const masalaColors = ['#F57C00', '#D84315', '#6D4C41', '#43A047', '#FDD835', '#E65100'];

        const spawnParticles = (x, y, count) => {
            for (let i = 0; i < count; i++) {
                const particle = document.createElement('span');
                particle.className = 'masala-particle';
                const size = Math.random() * 4 + 3; // 3-7px
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                particle.style.background = masalaColors[Math.floor(Math.random() * masalaColors.length)];
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';

                // Random scatter direction
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 40 + 15;
                particle.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
                particle.style.setProperty('--dy', Math.sin(angle) * distance + Math.random() * 20 + 'px');
                particle.style.animationDuration = (Math.random() * 0.5 + 0.6) + 's';

                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 1200);
            }
        };

let lastMove = 0;
        document.addEventListener('mousemove', e => {
            if (performance.now() - lastMove > 16) { // ~60fps throttle
                lastMove = performance.now();
                // Cursor uses position:fixed, so use viewport coords (clientX/clientY)
                // to keep it tracking correctly across all sections while scrolling.
                // Particles are absolutely positioned in body, so use page coords for them.
cursor.setAttribute('style', `top: ${e.clientY}px; left: ${e.clientX}px;`);
                // Sprinkle a few masala particles as the cursor moves.
                // Particles use position:fixed, so spawn at viewport coords so
                // the sprinkle works in every section while scrolling.
                spawnParticles(e.clientX, e.clientY, 2);
            }
        }, { passive: true });

        document.addEventListener('click', e => {
cursor.classList.add('expand');
            // Burst of particles on click (viewport coords for fixed positioning)
            spawnParticles(e.clientX, e.clientY, 12);
            setTimeout(() => {
                cursor.classList.remove('expand');
            }, 300);
        });
    }

// --- 13. FORM SUBMISSION ---
    const contactForm = document.getElementById('main-contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        });
    }

    // --- 14. WHATSAPP CTA RIPPLE EFFECT ---
    document.querySelectorAll('.cta-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            const size = Math.max(rect.width, rect.height);
            ripple.className = 'cta-ripple';
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

});
