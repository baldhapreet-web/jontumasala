document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const use3D = !prefersReducedMotion && supportsFinePointer;

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
    // Hide as soon as the page is ready, but never make the user wait longer
    // than ~1.3s even if some below-the-fold asset is still loading.
    const loader = document.getElementById('loader');
    const LOADER_MAX_MS = 1300;
    let loaderHidden = false;
    const hideLoader = () => {
        if (loaderHidden) return;
        loaderHidden = true;
        if (loader) {
            loader.classList.add('hidden');
            loader.setAttribute('aria-hidden', 'true');
        }
        // Kicks off the premium navbar + hero text reveal sequence.
        document.body.classList.add('page-ready');
    };
    if (loader) {
        if (document.readyState === 'complete') {
            hideLoader();
        } else {
            window.addEventListener('load', hideLoader, { once: true });
        }
        setTimeout(hideLoader, LOADER_MAX_MS);
    } else {
        hideLoader();
    }

    // --- 2 & 4 & 5 & 12: STICKY NAV, PROGRESS BAR, ACTIVE LINK, BACK-TO-TOP, HERO PARALLAX ---
    const header = document.getElementById('header');
    const scrollProgressBar = document.getElementById('scroll-progress-bar');
    const sections = document.querySelectorAll('section[id]');
    const navLi = document.querySelectorAll('.nav-links li a');
    const backToTopButton = document.getElementById('back-to-top');
    const heroSection = document.getElementById('home');
    const heroBgParallax = document.getElementById('hero-bg-parallax');

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

        // Subtle hero background parallax - only while the hero is actually in view
        if (heroBgParallax && !prefersReducedMotion && scrollY < window.innerHeight) {
            heroBgParallax.style.transform = `translateY(${scrollY * 0.15}px)`;
        }
    });
    window.addEventListener('scroll', updateScrollUI, { passive: true });
    updateScrollUI();

    // --- 3. HAMBURGER MENU ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    const setMenuOpen = (open) => {
        navLinks.classList.toggle('active', open);
        hamburger.classList.toggle('active', open);
        hamburger.setAttribute('aria-expanded', String(open));
    };

    hamburger.addEventListener('click', () => {
        setMenuOpen(!navLinks.classList.contains('active'));
    });
    navLinks.addEventListener('click', (e) => {
        if (e.target.closest('a')) {
            setMenuOpen(false);
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            setMenuOpen(false);
            hamburger.focus();
        }
    });

    // --- 6. SMOOTH SCROLLING ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Placeholder social links (Instagram/Facebook/YouTube) are marked
            // aria-disabled until real URLs are confirmed - do nothing on click.
            if (this.getAttribute('aria-disabled') === 'true') {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href === '#') {
                // Back-to-top / brand links -> scroll to top
                window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
                return;
            }
            try {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
                }
            } catch (err) {
                // Invalid selector (e.g. unusual href) - ignore
            }
        });
    });

    // --- 7. SCROLL REVEAL ANIMATIONS (IntersectionObserver) ---
    // Cards that own an interactive 3D-tilt transform (feature/ingredient/
    // gallery) get ONLY the 'revealed' class: their own CSS composes the
    // reveal-in via --reveal-y/--reveal-o custom properties inside their
    // single `transform` declaration, so the generic .reveal class is
    // deliberately never added to them - it would set a competing `transform`
    // on the same element and silently override the tilt effect.
    // .product-card is excluded: its own tilt/hover transform is not wired
    // for the --reveal-y/--reveal-o composition.
    // .testimonial-card is excluded entirely: its carousel crossfade already
    // provides its entrance animation, and stacking the generic reveal on
    // top of it fights the same active/inactive opacity logic.
    const bespokeTiltSelector = '.feature-card, .ingredient-card, .gallery-item';
    const revealElements = document.querySelectorAll(
        `.about-content, .about-image, .about-text, ${bespokeTiltSelector}, .faq-item, .contact-grid`
    );
    const activateReveal = (el) => {
        if (el.classList.contains('reveal-left') || el.classList.contains('reveal-right') || el.matches(bespokeTiltSelector)) {
            el.classList.add('revealed');
        } else {
            el.classList.add('reveal', 'revealed');
        }
    };
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    activateReveal(entry.target);
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        revealElements.forEach(el => revealObserver.observe(el));
    } else {
        // Fallback: simply show all
        revealElements.forEach(activateReveal);
    }

    // --- 8. FAQ ACCORDION ---
    const faqItems = document.querySelectorAll('.faq-item');
    const toggleFaqItem = (item) => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const currentlyActive = document.querySelector('.faq-item.active');
        if (currentlyActive && currentlyActive !== item) {
            currentlyActive.classList.remove('active');
            currentlyActive.querySelector('.faq-answer').style.maxHeight = 0;
            currentlyActive.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }

        const isOpen = item.classList.toggle('active');
        question.setAttribute('aria-expanded', String(isOpen));
        answer.style.maxHeight = isOpen ? answer.scrollHeight + 'px' : 0;
    };

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => toggleFaqItem(item));
        question.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFaqItem(item);
            }
        });
    });

    // --- 9. GALLERY LIGHTBOX (with prev/next navigation) ---
    const galleryItems = Array.from(document.querySelectorAll('.gallery-item img'));
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeLightboxBtn = document.querySelector('.close-lightbox');
    const lightboxPrevBtn = document.querySelector('.lightbox-prev');
    const lightboxNextBtn = document.querySelector('.lightbox-next');
    let lastFocusedElement = null;
    let currentGalleryIndex = -1;

    const showGalleryIndex = (index) => {
        if (!galleryItems.length) return;
        currentGalleryIndex = (index + galleryItems.length) % galleryItems.length;
        const imgEl = galleryItems[currentGalleryIndex];
        lightboxImg.src = imgEl.currentSrc || imgEl.src;
        lightboxImg.alt = imgEl.alt || '';
    };

    const openLightbox = (index) => {
        lastFocusedElement = document.activeElement;
        showGalleryIndex(index);
        lightbox.classList.remove('hidden');
        lightbox.setAttribute('aria-hidden', 'false');
        closeLightboxBtn.focus();
    };

    const closeLightbox = () => {
        if (lightbox.classList.contains('hidden')) return;
        lightbox.classList.add('hidden');
        lightbox.setAttribute('aria-hidden', 'true');
        lightboxImg.src = '';
        if (lastFocusedElement) lastFocusedElement.focus();
    };

    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => openLightbox(index));
    });

    closeLightboxBtn.addEventListener('click', closeLightbox);
    if (lightboxPrevBtn) lightboxPrevBtn.addEventListener('click', () => showGalleryIndex(currentGalleryIndex - 1));
    if (lightboxNextBtn) lightboxNextBtn.addEventListener('click', () => showGalleryIndex(currentGalleryIndex + 1));

    lightbox.addEventListener('click', (e) => {
        if (e.target !== lightboxImg && e.target !== lightboxPrevBtn && e.target !== lightboxNextBtn) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('hidden')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showGalleryIndex(currentGalleryIndex - 1);
        if (e.key === 'ArrowRight') showGalleryIndex(currentGalleryIndex + 1);
    });

    // --- 10. PREMIUM 3D TILT (hero bottle + cards) - desktop, fine-pointer only ---
    if (use3D) {
        // Hero bottle: mouse-driven tilt/parallax, bounded to a small, realistic range.
        const heroStage = document.getElementById('hero-tilt-stage');
        if (heroStage && heroSection) {
            const MAX_TILT = 8; // degrees
            let heroTiltTicking = false;
            let lastHeroEvent = null;

            const applyHeroTilt = () => {
                heroTiltTicking = false;
                if (!lastHeroEvent) return;
                const rect = heroSection.getBoundingClientRect();
                const relX = (lastHeroEvent.clientX - rect.left) / rect.width; // 0..1
                const relY = (lastHeroEvent.clientY - rect.top) / rect.height; // 0..1
                const tiltX = (relX - 0.5) * 2 * MAX_TILT; // rotateY
                const tiltY = (0.5 - relY) * 2 * (MAX_TILT * 0.75); // rotateX
                heroStage.style.setProperty('--tiltX', `${tiltX.toFixed(2)}deg`);
                heroStage.style.setProperty('--tiltY', `${tiltY.toFixed(2)}deg`);
                heroStage.style.setProperty('--shine-x', `${(30 + relX * 40).toFixed(1)}%`);
                heroStage.style.setProperty('--shine-y', `${(20 + relY * 40).toFixed(1)}%`);
            };

            heroSection.addEventListener('mousemove', (e) => {
                lastHeroEvent = e;
                if (!heroTiltTicking) {
                    heroTiltTicking = true;
                    requestAnimationFrame(applyHeroTilt);
                }
            }, { passive: true });

            heroSection.addEventListener('mouseleave', () => {
                lastHeroEvent = null;
                heroStage.style.setProperty('--tiltX', '0deg');
                heroStage.style.setProperty('--tiltY', '0deg');
                heroStage.style.setProperty('--shine-x', '50%');
                heroStage.style.setProperty('--shine-y', '35%');
            });
        }

        // Generic reusable 3D card tilt (feature/ingredient/product/gallery cards)
        const initCardTilt = (elements, maxDeg) => {
            elements.forEach(card => {
                let ticking = false;
                let lastEvent = null;

                const apply = () => {
                    ticking = false;
                    if (!lastEvent) return;
                    const rect = card.getBoundingClientRect();
                    const relX = (lastEvent.clientX - rect.left) / rect.width;
                    const relY = (lastEvent.clientY - rect.top) / rect.height;
                    const ry = (relX - 0.5) * 2 * maxDeg;
                    const rx = (0.5 - relY) * 2 * maxDeg;
                    card.style.setProperty('--rx', `${ry.toFixed(2)}deg`);
                    card.style.setProperty('--ry', `${rx.toFixed(2)}deg`);
                };

                card.addEventListener('mousemove', (e) => {
                    lastEvent = e;
                    if (!ticking) {
                        ticking = true;
                        requestAnimationFrame(apply);
                    }
                }, { passive: true });

                card.addEventListener('mouseleave', () => {
                    lastEvent = null;
                    card.style.setProperty('--rx', '0deg');
                    card.style.setProperty('--ry', '0deg');
                });
            });
        };

        initCardTilt(document.querySelectorAll('.feature-card'), 8);
        initCardTilt(document.querySelectorAll('.ingredient-card'), 8);
        initCardTilt(document.querySelectorAll('.product-card'), 6);
        initCardTilt(document.querySelectorAll('.gallery-item'), 6);
    }

    // --- 11a. HOW-TO-USE SCROLL STORY ---
    // Native scroll only (no scroll-jacking). A step is "active" once it crosses
    // the vertical center of the viewport; the shared visual reacts accordingly.
    const chhaasStory = document.getElementById('chhaas-story');
    const storySteps = document.querySelectorAll('.story-step');
    const storyParticlesHost = document.getElementById('story-particles');

    const spawnStoryParticles = () => {
        if (prefersReducedMotion || !storyParticlesHost) return;
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('span');
            particle.className = 'story-particle';
            const px = (Math.random() - 0.5) * 40;
            const py = 90 + Math.random() * 40;
            particle.style.setProperty('--px', `${px}px`);
            particle.style.setProperty('--py', `${py}px`);
            particle.style.left = `${Math.random() * 10 - 5}px`;
            particle.style.animationDelay = `${Math.random() * 0.3}s`;
            storyParticlesHost.appendChild(particle);
            setTimeout(() => particle.remove(), 1400);
        }
    };

    if (chhaasStory && storySteps.length && 'IntersectionObserver' in window) {
        let lastActiveStep = null;
        const stepObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                entry.target.classList.toggle('in-view', entry.isIntersecting);
                if (entry.isIntersecting) {
                    const stepNum = entry.target.dataset.step;
                    chhaasStory.setAttribute('data-active-step', stepNum);
                    if (stepNum === '2' && lastActiveStep !== '2') {
                        spawnStoryParticles();
                    }
                    lastActiveStep = stepNum;
                }
            });
        }, { threshold: 0.5, rootMargin: '-40% 0px -40% 0px' });
        storySteps.forEach(step => stepObserver.observe(step));
    } else if (storySteps.length) {
        storySteps.forEach(step => step.classList.add('in-view'));
    }

    // --- 11c. TESTIMONIAL CAROUSEL ---
    const testimonialTrack = document.getElementById('testimonial-track');
    const testimonialCarousel = document.getElementById('testimonial-carousel');
    const testimonialPrev = document.getElementById('testimonial-prev');
    const testimonialNext = document.getElementById('testimonial-next');
    const testimonialDots = document.querySelectorAll('#testimonial-dots .carousel-dot');

    if (testimonialTrack) {
        const testimonialCards = Array.from(testimonialTrack.querySelectorAll('.testimonial-card'));
        let activeTestimonial = 0;
        let autoplayTimer = null;

        const setTrackHeight = () => {
            const tallest = Math.max(...testimonialCards.map(c => c.scrollHeight));
            testimonialTrack.style.minHeight = `${tallest}px`;
        };

        const goToTestimonial = (index) => {
            activeTestimonial = (index + testimonialCards.length) % testimonialCards.length;
            testimonialCards.forEach((card, i) => card.classList.toggle('active', i === activeTestimonial));
            testimonialDots.forEach((dot, i) => dot.classList.toggle('active', i === activeTestimonial));
        };

        const startAutoplay = () => {
            if (prefersReducedMotion || autoplayTimer) return;
            autoplayTimer = setInterval(() => goToTestimonial(activeTestimonial + 1), 6000);
        };
        const stopAutoplay = () => {
            if (autoplayTimer) {
                clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
        };

        if (testimonialPrev) testimonialPrev.addEventListener('click', () => { goToTestimonial(activeTestimonial - 1); stopAutoplay(); startAutoplay(); });
        if (testimonialNext) testimonialNext.addEventListener('click', () => { goToTestimonial(activeTestimonial + 1); stopAutoplay(); startAutoplay(); });
        testimonialDots.forEach(dot => {
            dot.addEventListener('click', () => { goToTestimonial(Number(dot.dataset.index)); stopAutoplay(); startAutoplay(); });
        });

        if (testimonialCarousel) {
            testimonialCarousel.addEventListener('mouseenter', stopAutoplay);
            testimonialCarousel.addEventListener('mouseleave', startAutoplay);
            testimonialCarousel.addEventListener('focusin', stopAutoplay);
            testimonialCarousel.addEventListener('focusout', startAutoplay);
            testimonialCarousel.addEventListener('touchstart', stopAutoplay, { passive: true });
        }

        window.addEventListener('resize', onScroll(setTrackHeight));
        setTrackHeight();
        goToTestimonial(0);
        startAutoplay();
    }

    // --- 12. CUSTOM CURSOR WITH MASALA SPRINKLE EFFECT ---
    // Desktop-only, and skipped entirely for reduced-motion or touch/coarse-pointer devices.
    const cursor = document.querySelector('.custom-cursor');
    if (cursor && use3D && window.innerWidth > 768) {
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
            if (!cursor.classList.contains('ready')) {
                cursor.classList.add('ready');
            }
            if (performance.now() - lastMove > 16) { // ~60fps throttle
                lastMove = performance.now();
                // Cursor uses position:fixed, so use viewport coords (clientX/clientY)
                // to keep it tracking correctly across all sections while scrolling.
                cursor.setAttribute('style', `top: ${e.clientY}px; left: ${e.clientX}px;`);
                cursor.classList.add('ready');
                spawnParticles(e.clientX, e.clientY, 2);
            }
        }, { passive: true });

        document.addEventListener('click', e => {
            cursor.classList.add('expand');
            spawnParticles(e.clientX, e.clientY, 12);
            setTimeout(() => {
                cursor.classList.remove('expand');
            }, 300);
        });
    }

    // --- 13. CONTACT FORM: VALIDATE, THEN HAND OFF TO WHATSAPP (no backend) ---
    const contactForm = document.getElementById('main-contact-form');
    if (contactForm) {
        const WHATSAPP_NUMBER = '917016674697';
        const fields = {
            name: document.getElementById('cf-name'),
            phone: document.getElementById('cf-phone'),
            email: document.getElementById('cf-email'),
            subject: document.getElementById('cf-subject'),
            message: document.getElementById('cf-message'),
        };
        const successEl = document.getElementById('cf-success');

        const setError = (field, message) => {
            const errorEl = document.getElementById(`${field.id}-error`);
            if (message) {
                field.classList.add('invalid');
                if (errorEl) errorEl.textContent = message;
            } else {
                field.classList.remove('invalid');
                if (errorEl) errorEl.textContent = '';
            }
        };

        const validateForm = () => {
            let isValid = true;

            const name = fields.name.value.trim();
            if (name.length < 2) {
                setError(fields.name, 'Please enter your full name.');
                isValid = false;
            } else {
                setError(fields.name, '');
            }

            const phoneDigits = fields.phone.value.replace(/\D/g, '');
            if (phoneDigits.length < 7 || phoneDigits.length > 15) {
                setError(fields.phone, 'Please enter a valid phone number.');
                isValid = false;
            } else {
                setError(fields.phone, '');
            }

            const email = fields.email.value.trim();
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                setError(fields.email, 'Please enter a valid email address.');
                isValid = false;
            } else {
                setError(fields.email, '');
            }

            const message = fields.message.value.trim();
            if (message.length < 10) {
                setError(fields.message, 'Please enter a message of at least 10 characters.');
                isValid = false;
            } else {
                setError(fields.message, '');
            }

            return isValid;
        };

        // Clear an error as soon as the user fixes it
        [fields.name, fields.phone, fields.email, fields.message].forEach(field => {
            field.addEventListener('input', () => {
                if (field.classList.contains('invalid')) validateForm();
            });
        });

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            successEl.classList.add('hidden');

            if (!validateForm()) {
                const firstInvalid = contactForm.querySelector('.invalid');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            const name = fields.name.value.trim();
            const phone = fields.phone.value.trim();
            const email = fields.email.value.trim();
            const subject = fields.subject.value;
            const message = fields.message.value.trim();

            const whatsappText =
                `New Contact Form Message\n\n` +
                `Name: ${name}\n` +
                `Phone: ${phone}\n` +
                `Email: ${email}\n` +
                `Subject: ${subject}\n\n` +
                `Message:\n${message}`;

            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;

            // Opened synchronously within the submit handler so browsers don't block it as a popup.
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

            successEl.classList.remove('hidden');
            contactForm.reset();
        });
    }

    // --- 14. WHATSAPP CTA RIPPLE EFFECT ---
    if (!prefersReducedMotion) {
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
    }

});
