(() => {
    'use strict';
    let lastActiveElement = null;
    function handleFocusTrap(e) {
        if (e.key !== 'Tab') return; 
        const modal = e.currentTarget;
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length === 0) return;
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }
    function openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        lastActiveElement = document.activeElement;
        document.body.classList.add('overflow-hidden');
        modal.showModal(); 
        const focusableElements = modal.querySelectorAll('button, a, input, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) focusableElements[0].focus();
        modal.addEventListener('keydown', handleFocusTrap);
    }
    function closeModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.add('is-closing');
        modal.removeEventListener('keydown', handleFocusTrap);
        const onAnimationEnd = (e) => {
            if (e.target !== modal) return; 
            modal.classList.remove('is-closing');
            modal.close();
            modal.removeEventListener('animationend', onAnimationEnd);
            checkBodyScroll();
            if (lastActiveElement) {
                lastActiveElement.focus();
                lastActiveElement = null;
            }
        };
        modal.addEventListener('animationend', onAnimationEnd);
    }
    function checkBodyScroll() {
        const anyOpen = document.querySelectorAll('dialog[open]').length > 0;
        if (!anyOpen) {
            document.body.classList.remove('overflow-hidden');
        }
    }
    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            const intersectingEntries = entries.filter(e => e.isIntersecting);
            intersectingEntries.forEach((entry, index) => {
                const el = entry.target;    
                el.style.transitionDelay = `${index * 150}ms`;
                el.classList.remove('opacity-0', 'translate-y-8');
                setTimeout(() => {
                    if (el) el.style.transitionDelay = '0ms';
                }, 1000 + (index * 150));
                observer.unobserve(el);
            });
        }, { threshold: 0.1 });
        const scrollElements = document.querySelectorAll('section article, section > div, section h2');
        requestAnimationFrame(() => {
            scrollElements.forEach(el => {
                el.classList.add('transition-all', 'duration-1000', 'opacity-0', 'translate-y-8');
                observer.observe(el);
            });
        });
    }
    function initMarquee() {
        const marquee = document.querySelector('.animate-marquee');
        if (marquee) {
            const cards = Array.from(marquee.children);
            for (let i = 0; i < 2; i++) {
                cards.forEach(card => {
                    const clone = card.cloneNode(true);
                    clone.setAttribute('aria-hidden', 'true'); 
                    marquee.appendChild(clone);
                });
            }
        }
    }
    window.loadGAScript = function() {
        const GA_MEASUREMENT_ID = "G-T5H2XMBKFL"; 
        window.dataLayer = window.dataLayer || [];
        function gtag(){ window.dataLayer.push(arguments); }
        window.gtag = gtag;
        gtag('consent', 'default', { 'analytics_storage': 'denied', 'ad_storage': 'denied' });
        gtag('consent', 'update', { 'analytics_storage': 'granted' });
        const script = document.createElement('script');
        script.async = true;
        script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
        document.head.appendChild(script);
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, { 'anonymize_ip': true });
    };
    function initCookieBanner() {
        const STORAGE_KEY = "lp_swim_consent_einstellungen"; 
        const cookieDialog = document.getElementById('cookie-overlay'); 
        if (!cookieDialog) return;
        const storedData = localStorage.getItem(STORAGE_KEY);
        let decision = null;
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                const now = Date.now();
                const sixMonthsInMillis = 180 * 24 * 60 * 60 * 1000;
                if (now - parsedData.timestamp < sixMonthsInMillis) {
                    decision = parsedData.value;
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch (e) {
                decision = storedData; 
            }
        }
        if (!decision) {
            setTimeout(() => {
                document.body.classList.add('overflow-hidden');
                cookieDialog.showModal();
                cookieDialog.focus();
            }, 500);
        } else if (decision === 'accepted') {
            if (typeof window.loadGAScript === 'function') {
                window.loadGAScript();
            }
        }
    }
    function initAudioReader() {
        const readButtons = document.querySelectorAll('[data-read-target]');
        let currentAudio = null;
        let currentTarget = null;
        const audioCache = {};
        function resetAllButtons() {
            readButtons.forEach(btn => {
                const playIcon = btn.querySelector('.icon-play');
                const stopIcon = btn.querySelector('.icon-stop');
                if (playIcon) playIcon.classList.remove('hidden');
                if (stopIcon) stopIcon.classList.add('hidden');
                btn.classList.remove('animate-pulse');
                const originalLabel = btn.getAttribute('data-original-label');
                if (originalLabel) {
                    btn.setAttribute('aria-label', originalLabel);
                    btn.setAttribute('aria-pressed', 'false');
                }
            });
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
        }
        readButtons.forEach(button => {
            const targetId = button.getAttribute('data-read-target');
            const audioUrl = `./audio/${targetId}.mp3`;
            if (!button.hasAttribute('data-original-label')) {
                button.setAttribute('data-original-label', button.getAttribute('aria-label'));
            }
            button.addEventListener('click', () => {
                const playIcon = button.querySelector('.icon-play');
                const stopIcon = button.querySelector('.icon-stop');
                if (currentTarget === targetId && currentAudio && !currentAudio.paused) {
                    resetAllButtons();
                    currentTarget = null;
                    return;
                }
                resetAllButtons();
                currentTarget = targetId;
                
                if (!audioCache[targetId]) {
                    audioCache[targetId] = new Audio(audioUrl);
                    audioCache[targetId].preload = 'metadata'; 
                }
                currentAudio = audioCache[targetId];
                currentAudio.addEventListener('ended', () => { resetAllButtons(); currentTarget = null; });
                currentAudio.addEventListener('error', () => { resetAllButtons(); currentTarget = null; });
                currentAudio.play().then(() => {
                    if (playIcon) playIcon.classList.add('hidden');
                    if (stopIcon) stopIcon.classList.remove('hidden');
                    button.classList.add('animate-pulse');
                    button.setAttribute('aria-label', 'Vorlesen stoppen');
                    button.setAttribute('aria-pressed', 'true');
                }).catch(() => resetAllButtons());
            });
        });
    }
    document.addEventListener('click', (e) => {
        const openBtn = e.target.closest('[data-open-modal]');
        if (openBtn) {
            e.preventDefault(); 
            openModal(openBtn.getAttribute('data-open-modal'));
        }
        const closeBtn = e.target.closest('[data-close-modal]');
        if (closeBtn) {
            e.preventDefault();
            closeModal(closeBtn.getAttribute('data-close-modal'));
        }
        const revokeBtn = e.target.closest('[data-revoke-cookies]');
        if (revokeBtn) {
            e.preventDefault();
            localStorage.removeItem("lp_swim_consent_einstellungen"); 
            closeModal('datenschutzModal');
            setTimeout(() => {
                const cookieDialog = document.getElementById('cookie-overlay');
                if (cookieDialog) {
                    document.body.classList.add('overflow-hidden');
                    cookieDialog.showModal();
                    cookieDialog.focus();
                }
            }, 300);
        }
        const cookieAction = e.target.closest('[data-cookie-action]');
        if (cookieAction) {
            e.preventDefault();
            const action = cookieAction.getAttribute('data-cookie-action');
            const consentData = {
                value: action === 'accept' ? 'accepted' : 'declined',
                timestamp: Date.now()
            };
            localStorage.setItem("lp_swim_consent_einstellungen", JSON.stringify(consentData));            
            if (action === 'accept' && typeof window.loadGAScript === 'function') {
                window.loadGAScript();
            }
            closeModal('cookie-overlay'); 
        }
        if (e.target.tagName === 'DIALOG') {
            if (e.target.id !== 'cookie-overlay') {
                closeModal(e.target.id);
            }
        }
    });
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                })
                .catch((error) => {
                });
        });
    }
        document.addEventListener('DOMContentLoaded', () => {
        initScrollAnimations();
        initMarquee();
        initCookieBanner();
        initAudioReader();
        document.querySelectorAll('dialog').forEach(dialog => {
            dialog.addEventListener('cancel', (e) => {
                e.preventDefault(); 
                if (dialog.id !== 'cookie-overlay') {
                    closeModal(dialog.id);
                }
            });
        });
        const glassElements = document.querySelectorAll('.glass-card, .animate-marquee figure');
        if ('IntersectionObserver' in window) {
            const obs = new IntersectionObserver((entries, observerInstance) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        requestAnimationFrame(() => {
                            entry.target.classList.add('is-visible');
                        });
                        observerInstance.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.01, rootMargin: '0px 0px 50px 0px' });
            
            glassElements.forEach(el => obs.observe(el));
            
            setTimeout(() => {
                requestAnimationFrame(() => {
                    glassElements.forEach(el => el.classList.add('is-visible'));
                });
            }, 2500);
        } else {
            glassElements.forEach(el => el.classList.add('is-visible'));
        }
    });

})();
