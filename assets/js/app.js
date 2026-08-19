(() => {
    "use strict";

    let activeModalElement = null;
    const COOKIE_KEY = "lp_swim_consent_einstellungen";

    // Focus Trap für Barrierefreiheit in Modals
    function handleFocusTrap(e) {
        if (e.key !== "Tab") return;
        const focusables = Array.from(e.currentTarget.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => !el.disabled && el.offsetWidth > 0);
        if (focusables.length === 0) return;
        
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstEl) {
                e.preventDefault();
                lastEl.focus();
            }
        } else {
            if (document.activeElement === lastEl) {
                e.preventDefault();
                firstEl.focus();
            }
        }
    }

    // Modal öffnen
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        activeModalElement = document.activeElement;
        document.body.classList.add("overflow-hidden");
        modal.removeAttribute("hidden");
        modal.showModal();

        const firstFocusable = modal.querySelector('button, a, input, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();

        modal.addEventListener("keydown", handleFocusTrap);

        // URL-Hash Zuordnung
        const hashMapping = {
            datenschutzModal: "datenschutz",
            agbModal: "agb",
            impressumModal: "impressum",
            preisModal: "preise"
        };
        const hash = hashMapping[modalId];
        const targetHash = hash ? "#" + hash : "";

        if (window.location.hash !== targetHash) {
            history.pushState({ overlayOpen: modalId }, null, targetHash || window.location.pathname + window.location.search);
        } else {
            history.replaceState({ overlayOpen: modalId }, null, window.location.href);
        }
    };

    // Modal schließen mit Animations-Ende-Prüfung
    window.closeModal = function(modalId, fromPopstate = false) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add("is-closing");
        modal.removeEventListener("keydown", handleFocusTrap);

        if (!fromPopstate && history.state && history.state.overlayOpen === modalId) {
            history.back();
        }

        const onAnimationEnd = (e) => {
            if (e.target === modal) {
                modal.classList.remove("is-closing");
                modal.close();
                modal.setAttribute("hidden", "true");
                modal.removeEventListener("animationend", onAnimationEnd);
                
                // Prüfen, ob noch andere Modals offen sind
                if (document.querySelectorAll("dialog[open]").length === 0) {
                    document.body.classList.remove("overflow-hidden");
                }
                
                document.body.classList.remove("cookie-open");
                if (activeModalElement) {
                    activeModalElement.focus();
                    activeModalElement = null;
                }
            }
        };
        modal.addEventListener("animationend", onAnimationEnd);
    };

    // --- COOKIE BANNER ---
    function initCookieBanner() {
        const overlay = document.getElementById("cookie-overlay");
        if (!overlay) return;

        const consent = localStorage.getItem(COOKIE_KEY);
        let consentValue = null;

        if (consent) {
            try {
                const parsed = JSON.parse(consent);
                // 180 Tage Gültigkeit prüfen (15552000000 ms)
                if (Date.now() - parsed.timestamp < 15552000000) {
                    consentValue = parsed.value;
                } else {
                    localStorage.removeItem(COOKIE_KEY);
                }
            } catch (e) {
                consentValue = consent;
            }
        }

        if (consentValue === "accepted") {
            loadGoogleAnalytics();
        } else if (!consent) {
            document.body.classList.add("overflow-hidden", "cookie-open");
            overlay.classList.remove("hidden");
            
            // Klicks innerhalb des Banners abfangen
            const acceptBtn = document.getElementById("cookie-accept");
            const denyBtn = document.getElementById("cookie-deny");

            if (acceptBtn) {
                acceptBtn.addEventListener("click", () => {
                    const consentData = { value: "accepted", timestamp: Date.now() };
                    localStorage.setItem(COOKIE_KEY, JSON.stringify(consentData));
                    document.body.classList.remove("cookie-open", "overflow-hidden");
                    overlay.classList.add("hidden");
                    loadGoogleAnalytics();
                });
            }

            if (denyBtn) {
                denyBtn.addEventListener("click", () => {
                    const consentData = { value: "declined", timestamp: Date.now() };
                    localStorage.setItem(COOKIE_KEY, JSON.stringify(consentData));
                    document.body.classList.remove("cookie-open", "overflow-hidden");
                    overlay.classList.add("hidden");
                });
            }
        }
    }

    function loadGoogleAnalytics() {
        if (window.gaLoaded) return;
        window.gaLoaded = true;
        const GA_ID = "G-T5H2XMBKFL";

        window.dataLayer = window.dataLayer||[];
        function gtag(){window.dataLayer.push(arguments);}
        window.gtag = gtag;

        gtag("consent", "default", {
            analytics_storage: "denied",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied"
        });
        gtag("consent", "update", {
            analytics_storage: "granted",
            ad_storage: "granted",
            ad_user_data: "granted",
            ad_personalization: "granted"
        });

        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        document.head.appendChild(script);

        gtag("js", new Date());
        gtag("config", GA_ID, { anonymize_ip: true });
    }

    // --- AI CHAT SYSTEM ---
    const chatBtn = document.getElementById("toggle-chat-btn");
    const chatWin = document.getElementById("ai-chat-window");
    const chatClose = document.getElementById("close-chat-btn");
    const chatForm = document.getElementById("chat-input-form");
    const chatInput = document.getElementById("chat-input");
    const chatMessages = document.getElementById("chat-messages");

    let aiWorker = null;

    function lazyInitWorker() {
        if (aiWorker) return;
        try {
            const workerPath = new URL("./ai-worker.js", window.location.href).href;
            aiWorker = new Worker(workerPath, { type: "module" });
            
            aiWorker.onmessage = (e) => {
                const { type, text, payload } = e.data;
                const msgText = text || payload; // Fallback für beide Event-Strukturen
                
                if (type === "REPLY") {
                    const loader = chatMessages.querySelector(".typing-indicator-wrapper");
                    if (loader) loader.remove();
                    appendChatMessage(msgText, false);
                } else if (type === "ERROR") {
                    const loader = chatMessages.querySelector(".typing-indicator-wrapper");
                    if (loader) loader.remove();
                    appendChatMessage("Es gab einen Fehler. Bitte nutzen Sie das Kontaktformular.", false);
                }
            };
            aiWorker.postMessage({ type: "INIT" });
        } catch (err) {
            console.error("Worker-Initialisierung fehlgeschlagen:", err);
        }
    }

    function appendChatMessage(text, isUser, isHtml = true) {
        if (!chatMessages) return;
        const msgDiv = document.createElement("div");
        msgDiv.className = `chat-msg ${isUser ? 'user' : 'bot'}`;
        
        if (isHtml) {
            msgDiv.innerHTML = text;
        } else {
            msgDiv.textContent = text;
        }
        
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (chatBtn && chatWin) {
        chatBtn.addEventListener("click", () => {
            const isOpen = chatWin.classList.contains("scale-100");
            if (isOpen) {
                chatWin.classList.remove("scale-100", "opacity-100");
                chatWin.classList.add("scale-0", "opacity-0");
                document.body.classList.remove("overflow-hidden");
            } else {
                chatWin.classList.remove("scale-0", "opacity-0");
                chatWin.classList.add("scale-100", "opacity-100");
                document.body.classList.add("overflow-hidden");
                lazyInitWorker();
                if (chatInput) setTimeout(() => chatInput.focus(), 150);
            }
        });

        if (chatClose) {
            chatClose.addEventListener("click", () => {
                chatWin.classList.remove("scale-100", "opacity-100");
                chatWin.classList.add("scale-0", "opacity-0");
                document.body.classList.remove("overflow-hidden");
            });
        }

        if (chatForm) {
            chatForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const text = chatInput.value.trim();
                if (!text) return;

                chatInput.value = "";
                appendChatMessage(text, true, false);

                const loaderWrapper = document.createElement("div");
                loaderWrapper.className = "chat-msg bot typing-indicator-wrapper";
                loaderWrapper.innerHTML = `<div class="typing-indicator flex items-center h-6 px-2" style="gap:6px"><div></div><div></div><div></div></div>`;
                chatMessages.appendChild(loaderWrapper);
                chatMessages.scrollTop = chatMessages.scrollHeight;

                if (aiWorker) {
                    aiWorker.postMessage({ type: "CHAT", payload: text });
                }
            });
        }
    }

    // --- EVENT LISTENERS & ROUTING ---
    window.addEventListener("DOMContentLoaded", () => {
        initCookieBanner();
        
        // Hash-Steuerung beim ersten Laden
        const currentHash = window.location.hash.substring(1);
        const hashMap = {
            datenschutz: "datenschutzModal",
            agb: "agbModal",
            impressum: "impressumModal",
            preise: "preisModal"
        };
        if (hashMap[currentHash]) {
            setTimeout(() => window.openModal(hashMap[currentHash]), 100);
        }
    });

    window.addEventListener("hashchange", () => {
        const currentHash = window.location.hash.substring(1);
        const hashMap = {
            datenschutz: "datenschutzModal",
            agb: "agbModal",
            impressum: "impressumModal",
            preise: "preisModal"
        };
        if (hashMap[currentHash] && !document.getElementById(hashMap[currentHash]).hasAttribute("open")) {
            window.openModal(hashMap[currentHash]);
        }
    });

    window.addEventListener("popstate", () => {
        document.querySelectorAll("dialog[open]").forEach(dialog => {
            if (dialog.id !== "cookie-overlay") window.closeModal(dialog.id, true);
        });
    });

    // Klick außerhalb schließt Modal (Backdrop-Klick)
    document.querySelectorAll("dialog").forEach(dialog => {
        dialog.addEventListener("click", e => {
            if (e.target === dialog && dialog.id !== "cookie-overlay") {
                window.closeModal(dialog.id);
            }
        });
        dialog.addEventListener("cancel", (e) => {
            e.preventDefault();
            if (dialog.id !== "cookie-overlay") window.closeModal(dialog.id);
        });
    });

    // PWA Service Worker
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./sw.js").catch(() => {});
        });
    }

    // Lazy Init Worker Fallback nach 3 Sekunden
    setTimeout(lazyInitWorker, 3000);

})();
