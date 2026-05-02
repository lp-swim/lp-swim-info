(() => {
    'use strict';

    function openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        document.body.classList.add('overflow-hidden');
        modal.showModal(); 
        
        const firstFocusable = modal.querySelector('button, a, input, textarea');
        if (firstFocusable) firstFocusable.focus();
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.add('is-closing');
        
        const onAnimationEnd = (e) => {
            if (e.target !== modal) return; 
            modal.classList.remove('is-closing');
            modal.close();
            modal.removeEventListener('animationend', onAnimationEnd);
            checkBodyScroll();
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

        document.querySelectorAll('section article, section > div, section h2').forEach(el => {
            el.classList.add('transition-all', 'duration-1000', 'opacity-0', 'translate-y-8');
            observer.observe(el);
        });
    }

    function initMarquee() {
        const marquee = document.querySelector('.animate-marquee');
        if (marquee) {
            const cards = Array.from(marquee.children);
            cards.forEach(card => {
                const clone = card.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true'); 
                marquee.appendChild(clone);
            });
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
        const STORAGE_KEY = "lp_swim_consent_2026"; 
        const cookieDialog = document.getElementById('cookie-overlay'); 
        if (!cookieDialog) return;

        const decision = localStorage.getItem(STORAGE_KEY);
        
        if (!decision) {
            setTimeout(() => {
                document.body.classList.add('overflow-hidden');
                cookieDialog.showModal();
            }, 500);
        } else if (decision === 'accepted') {
            window.loadGAScript();
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
            localStorage.removeItem("lp_swim_consent_2026"); 
            window.location.reload(); 
        }
        
        const cookieAction = e.target.closest('[data-cookie-action]');
        if (cookieAction) {
            e.preventDefault();
            const action = cookieAction.getAttribute('data-cookie-action');
            
            if (action === 'accept') {
                localStorage.setItem("lp_swim_consent_2026", 'accepted');
                if (typeof window.loadGAScript === 'function') window.loadGAScript();
            } else {
                localStorage.setItem("lp_swim_consent_2026", 'declined');
            }
            
            closeModal('cookie-overlay'); 
        }

        if (e.target.tagName === 'DIALOG') {
            closeModal(e.target.id);
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        initScrollAnimations();
        initMarquee();
        initCookieBanner();
        initAudioReader();

        document.querySelectorAll('dialog').forEach(dialog => {
            dialog.addEventListener('cancel', (e) => {
                e.preventDefault(); 
                closeModal(dialog.id);
            });
        });
    });
})();
