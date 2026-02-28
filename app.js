        // Animationen bei Sichtbarkeit (Intersection Observer)
        document.addEventListener('DOMContentLoaded', () => {
            let typingStarted = false; 
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (entry.target.id === 'message') {
                            // Typing-Effekt für die Textarea im Formular
                            if (!typingStarted) {
                                typingStarted = true;
                                entry.target.placeholder = ""; 
                                const text = "Ich würde gerne meine Technik verbessern. Wie läuft die Buchung ab?";
                                let i = 0;
                                setTimeout(() => {
                                    const interval = setInterval(() => {
                                        entry.target.placeholder += text.charAt(i);
                                        i++;
                                        if (i >= text.length) clearInterval(interval);
                                    }, 40);
                                }, 500); 
                            }
                            observer.unobserve(entry.target);
                        } else {
                            // Allgemeine Fade-in Animation
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
            if(msgField) {
                observer.observe(msgField);
            }
        });

        // Modals (Popups) öffnen
        function openModal(id) {
            const modal = document.getElementById(id);
            const overlay = document.getElementById('modal-overlay');
            const content = modal.querySelector('.modal-anim');
            
            const cookieBanner = document.getElementById('cookie-overlay');
            if(cookieBanner && !cookieBanner.classList.contains('hidden')) {
                cookieBanner.classList.add('opacity-0', 'pointer-events-none');
            }

            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.remove('opacity-0'), 10);
            
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }, 50);
            
            document.body.classList.add('overflow-hidden');
        }

        // Modals schließen
        function closeModal(id) {
            const modal = document.getElementById(id);
            const overlay = document.getElementById('modal-overlay');
            const content = modal.querySelector('.modal-anim');

            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');

            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                
                const anyOpen = document.querySelectorAll('[id$="Modal"].flex, #confirmationPopup.flex').length > 0;
                const cookieBanner = document.getElementById('cookie-overlay');
                
                if (!anyOpen) {
                    overlay.classList.add('opacity-0');
                    setTimeout(() => overlay.classList.add('hidden'), 300);
                    if(!cookieBanner || cookieBanner.classList.contains('hidden')) {
                        document.body.classList.remove('overflow-hidden');
                    } else {
                        cookieBanner.classList.remove('opacity-0', 'pointer-events-none');
                    }
                }
            }, 300);
        }

        // Alle offenen Modals schließen (bei Klick ins Leere)
        function closeAllModals() {
            document.querySelectorAll('[id$="Modal"].flex, #confirmationPopup.flex').forEach(m => closeModal(m.id));
        }

        // Formular-Versand (AJAX zu Formspree)
        const form = document.getElementById('contactForm');
        const formMessage = document.getElementById('form-message');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = form.querySelector('button[type="submit"]');
                const btnSpan = btn.querySelector('span');
                const orgText = btnSpan.innerText;
                
                btn.disabled = true;
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
                        formMessage.innerHTML = '<div class="text-green-600 font-bold bg-green-50 p-4 rounded-xl text-center mt-4">Nachricht erfolgreich gesendet!</div>';
                        formMessage.classList.remove('hidden');
                    } else throw new Error();
                } catch {
                    formMessage.innerHTML = '<div class="text-red-600 font-bold bg-red-50 p-4 rounded-xl text-center mt-4">Fehler beim Senden. Bitte versuche es später erneut.</div>';
                    formMessage.classList.remove('hidden');
                } finally {
                    btn.disabled = false;
                    btnSpan.innerText = orgText;
                }
            });
        }

        // Cookie Consent Logik inkl. Google Analytics Einbindung
        (function() {
            const GA_MEASUREMENT_ID = "G-T5H2XMBKFL"; 
            const STORAGE_KEY = "lp_swim_consent_2026"; 
            const overlay = document.getElementById('cookie-overlay'); 
            
            if (!overlay) return; 
            
            const card = overlay.querySelector('div');
            const body = document.body;

            function loadGAScript() {
                const script = document.createElement('script');
                script.async = true;
                script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
                document.head.appendChild(script);
                window.dataLayer = window.dataLayer || [];
                function gtag(){ window.dataLayer.push(arguments); } 
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', GA_MEASUREMENT_ID, { 'anonymize_ip': true });
            }

            function showBanner() {
                body.classList.add('overflow-hidden');
                overlay.classList.remove('hidden');
                overlay.classList.add('flex');
                setTimeout(() => {
                    overlay.classList.remove('opacity-0');
                    card.classList.remove('scale-95', 'translate-y-8');
                    card.classList.add('scale-100', 'translate-y-0');
                }, 50);
            }

            function hideBanner() {
                overlay.classList.add('opacity-0');
                card.classList.remove('scale-100', 'translate-y-0');
                card.classList.add('scale-95', 'translate-y-8');
                setTimeout(() => {
                    overlay.classList.remove('flex');
                    overlay.classList.add('hidden');
                    const anyModalOpen = document.querySelectorAll('[id$="Modal"].flex').length > 0;
                    if(!anyModalOpen) {
                        body.classList.remove('overflow-hidden');
                    }
                }, 500);
            }

            const decision = localStorage.getItem(STORAGE_KEY);
            if (!decision) {
                setTimeout(showBanner, 500);
            } else if (decision === 'accepted') {
                loadGAScript();
            }

            const btnAccept = document.getElementById('cookie-accept');
            const btnDecline = document.getElementById('cookie-decline');

            if (btnAccept) {
                btnAccept.onclick = () => {
                    localStorage.setItem(STORAGE_KEY, 'accepted');
                    loadGAScript();
                    hideBanner();
                };
            }

            if (btnDecline) {
                btnDecline.onclick = () => {
                    localStorage.setItem(STORAGE_KEY, 'declined');
                    hideBanner();
                };
            }
        })();
        // --- ZENTRALE KLICK-STEUERUNG (Ersetzt die Inline-onclicks) ---
        document.addEventListener('click', (e) => {
        // Modals öffnen
        const openBtn = e.target.closest('[data-open-modal]');
        if (openBtn) {
        // e.preventDefault() verhindert, dass die Seite nach oben springt, falls es ein <a> Tag ist
        if (openBtn.tagName === 'A' || openBtn.tagName === 'BUTTON') e.preventDefault(); 
        openModal(openBtn.getAttribute('data-open-modal'));
            }
        // Modals schließen
        const closeBtn = e.target.closest('[data-close-modal]');
        if (closeBtn) {
        if (closeBtn.tagName === 'A' || closeBtn.tagName === 'BUTTON') e.preventDefault();
        closeModal(closeBtn.getAttribute('data-close-modal'));
            }
        // Alle Modals schließen (Klick auf das abgedunkelte Overlay)
        if (e.target.id === 'modal-overlay') {
        closeAllModals();
            }
        });
        // --- TASTATUR-STEUERUNG (Barrierefreiheit) ---
        document.addEventListener('keydown', (e) => {
        // Prüfen, ob die Escape-Taste gedrückt wurde
         if (e.key === 'Escape') {
        // Prüfen, ob überhaupt ein Modal (oder das Bestätigungs-Popup) offen ist
        const anyOpenModal = document.querySelectorAll('[id$="Modal"].flex, #confirmationPopup.flex').length > 0;
        if (anyOpenModal) {
            closeAllModals();
        }
    }
});
