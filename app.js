(() => {
    'use strict';
    
    let lastFocusedElement;

    document.addEventListener('DOMContentLoaded', () => {
        function startTypeWriter(element, text, speed = 40) {
            let i = 0;
            element.placeholder = "";
            function type() {
                if (i < text.length) {
                    element.placeholder += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                }
            }
            setTimeout(type, 500);
        }

        let typingStarted = false;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                const el = entry.target;

                if (el.id === 'message') {
                    if (!typingStarted) {
                        typingStarted = true;
                        el.classList.remove('opacity-0'); 
                        el.classList.add('transition-opacity', 'duration-[1500ms]', 'ease-in-out');
                        el.style.opacity = '1';
                        
                        startTypeWriter(el, "Ich würde gerne meine Technik verbessern. Wie läuft die Buchung ab?");
                    }
                } else {
                    el.classList.remove('opacity-0', 'translate-y-8');
                }
                
                observer.unobserve(el);
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('section article, section > div, section h2').forEach(el => {
            el.classList.add('transition-all', 'duration-1000', 'opacity-0', 'translate-y-8');
            observer.observe(el);
        });

        const msgField = document.getElementById("message");
        if (msgField) observer.observe(msgField);
        
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

    function openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;

        lastFocusedElement = document.activeElement;

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
            
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
            
            checkBodyScroll();
        };
        
        modal.addEventListener('animationend', onAnimationEnd);
    }

    function checkBodyScroll() {
        const anyOpen = document.querySelectorAll('dialog[open]').length > 0;
        const cookieBanner = document.getElementById('cookie-overlay');
        
        if (!anyOpen && (!cookieBanner || cookieBanner.classList.contains('hidden'))) {
            document.body.classList.remove('overflow-hidden');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('dialog').forEach(dialog => {
            dialog.addEventListener('cancel', (e) => {
                e.preventDefault(); 
                closeModal(dialog.id);
            });
        });
    });

    document.addEventListener('DOMContentLoaded', () => {
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
                    if (res.ok) {
                        form.reset();
                        openModal('confirmationPopup');
                        formMessage.innerHTML = '<div class="text-green-600 font-bold bg-green-50 p-4 rounded-xl text-center mt-4" role="alert">Nachricht erfolgreich gesendet!</div>';
                        formMessage.classList.remove('hidden');
                    } else {
                        const data = await res.json().catch(() => ({}));
                        console.error('Formular-API Fehler:', data);
                        throw new Error(data.error || 'Serverfehler aufgetreten.');
                    }
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
    });

    document.addEventListener('DOMContentLoaded', () => {
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
                    'ad_storage': 'denied'
                });

                gtag('consent', 'update', {
                    'analytics_storage': 'granted'
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
                
                setTimeout(() => {
                    cookieOverlay.classList.remove('opacity-0');
                    if (card) {
                        card.classList.remove('scale-95', 'translate-y-8');
                        card.classList.add('scale-100', 'translate-y-0');
                    }
                    
                    const btnAccept = document.getElementById('cookie-accept');
                    if (btnAccept) btnAccept.focus();
                }, 50);
            }

            function hideBanner() {
                cookieOverlay.classList.add('opacity-0');
                if (card) {
                    card.classList.remove('scale-100', 'translate-y-0');
                    card.classList.add('scale-95', 'translate-y-8');
                }
                setTimeout(() => {
                    cookieOverlay.classList.remove('flex');
                    cookieOverlay.classList.add('hidden');
                    checkBodyScroll();
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
    });

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

        if (e.target.tagName === 'DIALOG') {
            closeModal(e.target.id);
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        const readButtons = document.querySelectorAll('[data-read-target]');
        let currentTarget = null;
        let voices = [];

        function loadVoices() {
            voices = window.speechSynthesis.getVoices();
        }
        
        loadVoices();
        
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        function getBestGermanVoice() {
            if (voices.length === 0) return null;
            
            const germanVoices = voices.filter(v => v.lang.startsWith('de'));
            const preferredNames = ['Markus', 'Daniel', 'Stefan', 'Conrad', 'Google Deutsch'];
            
            for (let name of preferredNames) {
                const voice = germanVoices.find(v => v.name.includes(name));
                if (voice) return voice;
            }
            
            if (germanVoices.length > 0) return germanVoices[0];
            
            return voices[0];
        }

        window.addEventListener('beforeunload', () => {
            window.speechSynthesis.cancel();
        });

        function resetAllButtons() {
            readButtons.forEach(btn => {
                const playIcon = btn.querySelector('.icon-play');
                const stopIcon = btn.querySelector('.icon-stop');
                if (playIcon) playIcon.classList.remove('hidden');
                if (stopIcon) stopIcon.classList.add('hidden');
                btn.setAttribute('aria-label', btn.getAttribute('data-original-aria'));
            });
        }

        readButtons.forEach(button => {
            const originalAriaLabel = button.getAttribute('aria-label');
            button.setAttribute('data-original-aria', originalAriaLabel);

            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-read-target');
                const textElement = document.getElementById(targetId);
                const playIcon = button.querySelector('.icon-play');
                const stopIcon = button.querySelector('.icon-stop');
                
                if (!textElement) return;

                if (currentTarget === targetId) {
                    window.speechSynthesis.cancel();
                    currentTarget = null;
                    resetAllButtons();
                    return;
                }

                window.speechSynthesis.cancel();
                resetAllButtons();
                currentTarget = targetId;

                const textToRead = textElement.innerText; 
                const utterance = new SpeechSynthesisUtterance(textToRead);
                const bestVoice = getBestGermanVoice();
                
                if (bestVoice) {
                    utterance.voice = bestVoice;
                }
                
                utterance.lang = 'de-DE'; 
                utterance.rate = 0.9; 
                utterance.pitch = 0.8; 

                utterance.onend = () => {
                    if (currentTarget === targetId) {
                        currentTarget = null;
                        resetAllButtons();
                    }
                };

                utterance.onerror = (e) => {
                    console.error(e);
                    if (currentTarget === targetId) {
                        currentTarget = null;
                        resetAllButtons();
                    }
                };

                window.speechSynthesis.speak(utterance);
                
                if (playIcon) playIcon.classList.add('hidden');
                if (stopIcon) stopIcon.classList.remove('hidden');
                button.setAttribute('aria-label', 'Vorlesen stoppen');
            });
        });
    });

})();
