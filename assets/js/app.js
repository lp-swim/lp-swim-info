(() => {
    "use strict";

    let activeModalElement = null;

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
        document.body.style.overflow = "hidden"; // Scrollen im Hintergrund verhindern
        modal.removeAttribute("hidden");
        modal.showModal();

        const firstFocusable = modal.querySelector('button, a, input, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();

        modal.addEventListener("keydown", handleFocusTrap);

        // URL-Hash setzen
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
        }
    };

    // Modal schließen
    window.closeModal = function(modalId, isPopState = false) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.removeEventListener("keydown", handleFocusTrap);
        modal.close();
        modal.setAttribute("hidden", "");
        document.body.style.overflow = ""; // Scrollen wieder erlauben

        if (activeModalElement) {
            activeModalElement.focus();
            activeModalElement = null;
        }

        if (!isPopState && window.location.hash) {
            history.pushState({ overlayOpen: null }, null, window.location.pathname + window.location.search);
        }
    };

    // Klick außerhalb des Modals schließt es
    document.querySelectorAll("dialog").forEach(dialog => {
        dialog.addEventListener("click", e => {
            if (e.target === dialog && dialog.id !== "cookie-overlay") {
                closeModal(dialog.id);
            }
        });
    });

    // Hash-Steuerung beim Laden der Seite
    window.addEventListener("DOMContentLoaded", () => {
        const currentHash = window.location.hash.substring(1);
        const hashMap = {
            datenschutz: "datenschutzModal",
            agb: "agbModal",
            impressum: "impressumModal",
            preise: "preisModal"
        };
        if (hashMap[currentHash]) {
            setTimeout(() => openModal(hashMap[currentHash]), 100);
        }
    });

    // Hash-Änderungen überwachen (z.B. Zurück-Button)
    window.addEventListener("hashchange", () => {
        const currentHash = window.location.hash.substring(1);
        const hashMap = {
            datenschutz: "datenschutzModal",
            agb: "agbModal",
            impressum: "impressumModal",
            preise: "preisModal"
        };
        if (hashMap[currentHash] && !document.getElementById(hashMap[currentHash]).hasAttribute("open")) {
            openModal(hashMap[currentHash]);
        }
    });

    window.addEventListener("popstate", () => {
        document.querySelectorAll("dialog[open]").forEach(dialog => {
            if (dialog.id !== "cookie-overlay") closeModal(dialog.id, true);
        });
    });

    // --- COOKIE BANNER ---
    function initCookieBanner() {
        const overlay = document.getElementById("cookie-overlay");
        const acceptBtn = document.getElementById("cookie-accept");
        const denyBtn = document.getElementById("cookie-deny");

        if (!overlay || !acceptBtn || !denyBtn) return;

        const consent = localStorage.getItem("cookieConsent");
        if (!consent) {
            overlay.classList.remove("hidden");
        }

        acceptBtn.addEventListener("click", () => {
            localStorage.setItem("cookieConsent", "accepted");
            overlay.classList.add("hidden");
            // Hier optional Google Analytics aktivieren
        });

        denyBtn.addEventListener("click", () => {
            localStorage.setItem("cookieConsent", "denied");
            overlay.classList.add("hidden");
        });
    }

    // --- AI CHAT SYSTEM ---
    const chatBtn = document.getElementById("toggle-chat-btn");
    const chatWin = document.getElementById("ai-chat-window");
    const chatClose = document.getElementById("close-chat-btn");
    const chatForm = document.getElementById("chat-input-form");
    const chatInput = document.getElementById("chat-input");
    const chatMessages = document.getElementById("chat-messages");

    let aiWorker = null;

    if (window.Worker) {
        aiWorker = new Worker("ai-worker.js");
        aiWorker.onmessage = (e) => {
            const { type, payload } = e.data;
            if (type === "REPLY") {
                // Lade-Indikator entfernen
                const loader = chatMessages.querySelector(".typing-indicator-wrapper");
                if (loader) loader.remove();

                appendChatMessage(payload, false);
            }
        };
    }

    function appendChatMessage(text, isUser, isHtml = true) {
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
            chatWin.classList.toggle("open");
        });

        if (chatClose) {
            chatClose.addEventListener("click", () => {
                chatWin.classList.remove("open");
            });
        }

        if (chatForm) {
            chatForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const text = chatInput.value.trim();
                if (!text) return;

                chatInput.value = "";
                appendChatMessage(text, true, false);

                // Lade-Indikator hinzufügen
                const loaderWrapper = document.createElement("div");
                loaderWrapper.className = "chat-msg bot typing-indicator-wrapper";
                loaderWrapper.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
                chatMessages.appendChild(loaderWrapper);
                chatMessages.scrollTop = chatMessages.scrollHeight;

                if (aiWorker) {
                    aiWorker.postMessage({ type: "CHAT", payload: text });
                }
            });
        }
    }

    // Initialisierung
    window.addEventListener("DOMContentLoaded", () => {
        initCookieBanner();
    });

})();
