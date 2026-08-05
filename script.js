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
        loader.classList.add('hidden');
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
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- 7. SCROLL REVEAL ANIMATIONS (IntersectionObserver) ---
    const revealElements = document.querySelectorAll('.about-content, .feature-card, .ingredient-card, .timeline-item, .product-card, .gallery-item, .testimonial-card, .faq-item, .contact-wrapper');
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

    // --- 10. DARK MODE ---
    const darkModeSwitch = document.getElementById('dark-mode-switch');
    // Apply saved preference before first paint to avoid flash
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkModeSwitch.checked = true;
    }
    darkModeSwitch.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    // --- 11. CUSTOM CURSOR ---
const cursor = document.querySelector('.custom-cursor');
    if (window.innerWidth > 768) { // Only show custom cursor on desktop
        let lastMove = 0;
        document.addEventListener('mousemove', e => {
            if (performance.now() - lastMove > 16) { // ~60fps throttle
                lastMove = performance.now();
                cursor.setAttribute('style', `top: ${e.pageY}px; left: ${e.pageX}px;`);
            }
        }, { passive: true });

        document.addEventListener('click', () => {
            cursor.classList.add('expand');
            setTimeout(() => {
                cursor.classList.remove('expand');
            }, 500);
        });
    }

    // --- 13. FORM SUBMISSION ---
    const contactForm = document.getElementById('main-contact-form');
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        contactForm.reset();
    });

});
