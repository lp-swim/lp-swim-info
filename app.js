(() => {
    'use strict';
    
    // ==========================================
    // 1. ANIMATIONEN (Intersection Observer)
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        let typingStarted = false; 
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target.id === 'message') {
                        if (!typingStarted) {
                            typingStarted = true;
                            entry.target.classList.add('transition-opacity', 'duration-1000');
                            entry.target.style.opacity = '1';
                            
                            const text = "Ich würde gerne meine Technik verbessern. Wie läuft die Buchung ab?";
                            let i = 0;
                            entry.target.placeholder = ""; 
                            
                            function typeWriter() {
                                if (i < text.length) {
                                    entry.target.placeholder += text.charAt(i);
                                    i++;
                                    setTimeout(typeWriter, 40);
                                }
                            }
                            setTimeout(typeWriter, 500); 
                        }
                        observer.unobserve(entry.target);
                    } else {
                        entry.target.classList.remove('opacity-0', 'translate-y-8');
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('section article, section > div, section h2').forEach(el => {
            el.classList.add('transition-all', 'duration-1000', 'opacity-0', 'translate-y-8');
            observer.observe(el);
        });

        const msgField = document.getElementById("message");
        if(msgField) observer.observe(msgField);
        
        const marquee = document.querySelector('.animate-marquee');
        if (marquee) {
            const cards = Array.from(marquee.children);
            cards.forEach(card => {
                const clone = card.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true'); 
                marquee.appendChild(clone);
            });
        }
    });

    // ==========================================
    // 2. MODAL-FUNKTIONEN (Popups)
    // ==========================================
    let lastFocusedElement = null;

    function openModal(id) {
        lastFocusedElement = document.activeElement; 
        
        const modal = document.getElementById(id);
        if (!modal) return;

        const overlay = document.getElementById('modal-overlay');
        const content = modal.querySelector('.modal-anim');
        const cookieBanner = document.getElementById('cookie-overlay');
        
        if(cookieBanner && !cookieBanner.classList.contains('hidden')) {
            cookieBanner.classList.add('opacity-0', 'pointer-events-none');
        }

        modal.setAttribute('data-state', 'open');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        document.querySelectorAll('nav, header, main, footer').forEach(el => el.setAttribute('aria-hidden', 'true'));

        overlay.classList.remove('hidden');
        modal.classList.remove('hidden');
        modal.classList.add('flex'); 
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.classList.remove('opacity-0');
                if(content) {
                    content.classList.remove('scale-95', 'opacity-0');
                    content.classList.add('scale-100', 'opacity-100');
                }
                const closeBtn = modal.querySelector('[data-close-modal]');
                if (closeBtn) closeBtn.focus();
            });
        });
        
        document.body.classList.add('overflow-hidden');
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;

        const overlay = document.getElementById('modal-overlay');
        const content = modal.querySelector('.modal-anim');

        modal.removeAttribute('data-state');

        if(content) {
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
        }

        const onTransitionEnd = (e) => {
            if (e && e.target !== content) return; 
            if (content) content.removeEventListener('transitionend', onTransitionEnd);

            modal.classList.add('hidden');
            modal.classList.remove('flex');
            
            const anyOpen = document.querySelectorAll('[data-state="open"]').length > 0;
            const cookieBanner = document.getElementById('cookie-overlay');
            
            if (!anyOpen) {
                overlay.classList.add('opacity-0');
                
                const onOverlayEnd = (e2) => {
                    if (e2 && e2.target !== overlay) return;
                    overlay.removeEventListener('transitionend', onOverlayEnd);
                    overlay.classList.add('hidden');
                };
                overlay.addEventListener('transitionend', onOverlayEnd);
                
                document.querySelectorAll('nav, header, main, footer').forEach(el => el.removeAttribute('aria-hidden'));
                
                if(!cookieBanner || cookieBanner.classList.contains('hidden')) {
                    document.body.classList.remove('overflow-hidden');
                } else {
                    cookieBanner.classList.remove('opacity-0', 'pointer-events-none');
                }
                
                if (lastFocusedElement) {
                    lastFocusedElement.focus();
                    lastFocusedElement = null;
                }
            }
        };

        if (content) {
            content.addEventListener('transitionend', onTransitionEnd);
        } else {
            onTransitionEnd();
        }
    }

    function closeAllModals() {
        document.querySelectorAll('[data-state="open"]').forEach(m => closeModal(m.id));
    }

    // ==========================================
    // 3. FORMULAR-VERSAND (AJAX zu Formspree)
    // ==========================================
    const form = document.getElementById('contactForm');
    if (form) {
        const formMessage = document.getElementById('form-message');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const btnSpan = btn.querySelector('span');
            const orgText = btnSpan.innerText;
            
            btn.disabled = true;
            btn.setAttribute('aria-busy', 'true'); 
            btnSpan.innerText = 'Senden...';
            
            try {
                const res = await fetch(form.action, { 
                    method: 'POST', 
                    body: new FormData(form), 
                    headers: {'Accept': 'application/json'} 
                });
                if(res.ok) {
                    form.reset();
                    openModal('confirmationPopup');
                    formMessage.innerHTML = '<div class="text-green-600 font-bold bg-green-50 p-4 rounded-xl text-center mt-4" role="alert">Nachricht erfolgreich gesendet!</div>';
                    formMessage.classList.remove('hidden');
                } else throw new Error();
            } catch (error) {
                console.error('LP-SWIM Formular-Fehler:', error);
                formMessage.innerHTML = '<div class="text-red-600 font-bold bg-red-50 p-4 rounded-xl text-center mt-4" role="alert">Fehler beim Senden. Bitte versuche es später erneut.</div>';
                formMessage.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.removeAttribute('aria-busy');
                btnSpan.innerText = orgText;
            }
        });
    }

    // ==========================================
    // 4. COOKIE CONSENT & GOOGLE ANALYTICS
    // ==========================================
    const GA_MEASUREMENT_ID = "G-T5H2XMBKFL"; 
    const STORAGE_KEY = "lp_swim_consent_2026"; 
    const cookieOverlay = document.getElementById('cookie-overlay'); 
    
    if (cookieOverlay) { 
        const card = cookieOverlay.querySelector('div');

        function loadGAScript() {
            window.dataLayer = window.dataLayer || [];
            function gtag(){ window.dataLayer.push(arguments); }
            window.gtag = gtag;

            gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied'
            });

            gtag('consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied'
            });

            const script = document.createElement('script');
            script.async = true;
            script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
            document.head.appendChild(script);

            gtag('js', new Date());
            gtag('config', GA_MEASUREMENT_ID, { 'anonymize_ip': true });
        }

        function showBanner() {
            document.body.classList.add('overflow-hidden');
            cookieOverlay.classList.remove('hidden');
            cookieOverlay.classList.add('flex');
            cookieOverlay.setAttribute('role', 'dialog');
            cookieOverlay.setAttribute('aria-modal', 'true');
            cookieOverlay.setAttribute('aria-label', 'Cookie-Einstellungen');
            
            setTimeout(() => {
                cookieOverlay.classList.remove('opacity-0');
                if(card) {
                    card.classList.remove('scale-95', 'translate-y-8');
                    card.classList.add('scale-100', 'translate-y-0');
                }
            }, 50);
        }

        function hideBanner() {
            cookieOverlay.classList.add('opacity-0');
            if(card) {
                card.classList.remove('scale-100', 'translate-y-0');
                card.classList.add('scale-95', 'translate-y-8');
            }
            setTimeout(() => {
                cookieOverlay.classList.remove('flex');
                cookieOverlay.classList.add('hidden');
                const anyModalOpen = document.querySelectorAll('[data-state="open"]').length > 0;
                if(!anyModalOpen) {
                    document.body.classList.remove('overflow-hidden');
                }
            }, 500);
        }

        const decision = localStorage.getItem(STORAGE_KEY);
        if (!decision) setTimeout(showBanner, 500);
        else if (decision === 'accepted') loadGAScript();

        const btnAccept = document.getElementById('cookie-accept');
        const btnDecline = document.getElementById('cookie-decline');

        if (btnAccept) btnAccept.onclick = () => { localStorage.setItem(STORAGE_KEY, 'accepted'); loadGAScript(); hideBanner(); };
        if (btnDecline) btnDecline.onclick = () => { localStorage.setItem(STORAGE_KEY, 'declined'); hideBanner(); };
    }

    // ==========================================
    // 5. ZENTRALE KLICK- & TASTATUR-STEUERUNG
    // ==========================================
    document.addEventListener('click', (e) => {
        const openBtn = e.target.closest('[data-open-modal]');
        if (openBtn) {
            if (openBtn.tagName === 'A' || openBtn.tagName === 'BUTTON') e.preventDefault(); 
            openModal(openBtn.getAttribute('data-open-modal'));
        }

        const closeBtn = e.target.closest('[data-close-modal]');
        if (closeBtn) {
            if (closeBtn.tagName === 'A' || closeBtn.tagName === 'BUTTON') e.preventDefault();
            closeModal(closeBtn.getAttribute('data-close-modal'));
        }

        const revokeBtn = e.target.closest('[data-revoke-cookies]');
        if (revokeBtn) {
            e.preventDefault();
            localStorage.removeItem(STORAGE_KEY); 
            
            const cookies = document.cookie.split("; ");
            for (let c = 0; c < cookies.length; c++) {
                const d = window.location.hostname.split(".");
                while (d.length > 0) {
                    const cookieBase = encodeURIComponent(cookies[c].split(";")[0].split("=")[0]) + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' + d.join('.') + ' ;path=';
                    const p = location.pathname.split('/');
                    document.cookie = cookieBase + '/';
                    while (p.length > 0) {
                        document.cookie = cookieBase + p.join('/');
                        p.pop();
                    };
                    d.shift();
                }
            }
            window.location.reload(); 
        }

        if (e.target.id === 'modal-overlay') closeAllModals();
    });

    document.addEventListener('keydown', (e) => {
        const openModal = document.querySelector('[data-state="open"]');

        if (e.key === 'Escape' && openModal) {
            closeAllModals();
            return;
        }

        if (e.key === 'Tab' && openModal) {
            const focusableElements = Array.from(openModal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )).filter(el => el.offsetParent !== null); 
            
            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) { 
                if (document.activeElement === firstElement || document.activeElement === openModal) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else { 
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    });

})();
