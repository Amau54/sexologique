// --- 1. FONCTIONS GLOBALES (Accessibles depuis le HTML) ---

let zcalLoadTimeout; // Variable pour stocker le timer du timeout

/**
 * Ouvre la modale Zcal
 * @param {string} type - 'indiv', 'couple', ou 'tele'
 */
window.openZcalModal = function(type = 'indiv') {
    const modal = document.getElementById('zcal-modal');
    const container = document.getElementById('zcal-modal-container');
    
    if (!modal || !container) return;

    // Affiche la modale
    modal.classList.remove('hidden', 'pointer-events-none');
    
    // Animation d'entrée
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        container.classList.remove('scale-95', 'opacity-0');
    });

    // Bloque le scroll arrière-plan
    document.body.style.overflow = 'hidden';

    // Active l'onglet demandé
    window.switchZcalTab(type);
};

/**
 * Ferme la modale Zcal
 */
window.closeZcalModal = function() {
    const modal = document.getElementById('zcal-modal');
    const container = document.getElementById('zcal-modal-container');
    if (!modal || !container) return;

    // Animation de sortie
    container.classList.add('scale-95', 'opacity-0');
    modal.classList.add('opacity-0');

    // Cache complètement après l'animation
    setTimeout(() => {
        modal.classList.add('hidden', 'pointer-events-none');
        document.body.style.overflow = '';
    }, 300);
};

/**
 * Change l'onglet actif dans Zcal
 */
window.switchZcalTab = function(type) {
    const zcalSpinner = document.getElementById('zcal-spinner');
    const zcalFallback = document.getElementById('zcal-fallback');

    ['tele', 'couple', 'indiv'].forEach(t => {
        const content = document.getElementById('content-' + t);
        const btn = document.getElementById('tab-' + t);
        if (!content || !btn) return;

        if (t === type) {
            content.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
            content.classList.add('z-10');
            btn.classList.add('active'); // Style actif (couleur)
            
            // Lazy Load : Charge l'iframe uniquement quand on clique sur l'onglet
            const iframe = content.querySelector('iframe');
            if (iframe) {
                if (!iframe.src && iframe.dataset.src) {
                    // 1. Réinitialisation visuelle
                    if (zcalSpinner) zcalSpinner.style.display = 'block';
                    iframe.style.opacity = '0';
                    if (zcalFallback) zcalFallback.classList.add('hidden');

                    // 2. Lancement du chargement de l'URL
                    iframe.src = iframe.dataset.src;

                    // 3. Sécurité : Timeout de 8 secondes
                    if (zcalLoadTimeout) clearTimeout(zcalLoadTimeout);
                    zcalLoadTimeout = setTimeout(() => {
                        if (iframe.style.opacity === '0') {
                            if (zcalSpinner) zcalSpinner.style.display = 'none';
                            if (zcalFallback) zcalFallback.classList.remove('hidden');
                        }
                    }, 8000);

                    // 4. Détection de succès (Arrêt du Spinner)
                    iframe.onload = () => {
                        if (zcalSpinner) zcalSpinner.style.display = 'none';
                        iframe.style.opacity = '1';
                        if (zcalLoadTimeout) clearTimeout(zcalLoadTimeout);
                    };
                } else {
                    // Déjà chargé : on s'assure que le spinner est caché et l'iframe visible
                    if (zcalSpinner) zcalSpinner.style.display = 'none';
                    if (zcalFallback) zcalFallback.classList.add('hidden');
                    iframe.style.opacity = '1';
                }
            }
        } else {
            content.classList.add('hidden', 'opacity-0', 'pointer-events-none');
            content.classList.remove('z-10');
            btn.classList.remove('active');
        }
    });
};

// --- 2. CHARGEMENT ET INJECTIONS ---

document.addEventListener("DOMContentLoaded", function() {

    // =========================================================================
    // SECTION A : INJECTIONS HTML (Modales)
    // =========================================================================

    // 1. Injection Modale ZCAL (Unique système de RDV désormais)
    if (!document.getElementById('zcal-modal')) {
        const zcalHtml = `
            <div id="zcal-modal" style="z-index: 99999;" class="hidden pointer-events-none fixed inset-0 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300 opacity-0">
                <div class="absolute inset-0" onclick="window.closeZcalModal()"></div>
                <div id="zcal-modal-container" class="glass-effect relative w-full h-full md:h-[90vh] max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transform scale-95 opacity-0 transition-all duration-300">
                    <!-- Header Modale -->
                    <div class="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white/80">
                        <h3 class="text-xl md:text-2xl font-light text-custom-accent">Prise de rendez-vous</h3>
                        <button onclick="window.closeZcalModal()" class="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"><i class="fas fa-times"></i></button>
                    </div>
                    <!-- Onglets -->
                    <div class="flex justify-center py-4 bg-white/50 gap-2 overflow-x-auto px-2">
                        <button id="tab-indiv" onclick="window.switchZcalTab('indiv')" class="tab-btn px-4 py-2 text-sm font-medium text-[#a37b73] rounded-full hover:bg-[#a37b73]/10 transition-colors whitespace-nowrap">Individuelle</button>
                        <button id="tab-couple" onclick="window.switchZcalTab('couple')" class="tab-btn px-4 py-2 text-sm font-medium text-[#a37b73] rounded-full hover:bg-[#a37b73]/10 transition-colors whitespace-nowrap">Couple</button>
                        <button id="tab-tele" onclick="window.switchZcalTab('tele')" class="tab-btn px-4 py-2 text-sm font-medium text-[#a37b73] rounded-full hover:bg-[#a37b73]/10 transition-colors whitespace-nowrap">Visio</button>
                    </div>
                    <!-- Contenu (Iframes avec data-src pour perf) -->
                    <div class="relative flex-grow bg-white w-full h-full">
                        <!-- Spinner -->
                        <div id="zcal-spinner" class="zcal-spinner" style="display: none;">
                            <div class="zcal-spinner-circle"></div>
                            <p class="text-gray-600 mb-4">Chargement de l'agenda sécurisé..</p>
                        </div>

                        <!-- Fallback Message -->
                        <div id="zcal-fallback" class="zcal-fallback hidden">
                            <p class="text-gray-600 mb-4">Le chargement prend plus de temps que prévu.</p>
                            <button id="retry-zcal" class="bg-custom-dark text-white px-6 py-2 rounded-full hover:opacity-90 transition">Réessayer</button>
                        </div>

                        <div id="content-indiv" class="absolute inset-0 hidden opacity-0 transition-opacity duration-300 pointer-events-none"><iframe data-src="https://zcal.co/i/9zS2bGmt?embed=1&embedType=iframe" class="w-full h-full border-0"></iframe></div>
                        <div id="content-couple" class="absolute inset-0 hidden opacity-0 transition-opacity duration-300 pointer-events-none"><iframe data-src="https://zcal.co/i/yjsqTQCY?embed=1&embedType=iframe" class="w-full h-full border-0"></iframe></div>
                        <div id="content-tele" class="absolute inset-0 hidden opacity-0 transition-opacity duration-300 pointer-events-none"><iframe data-src="https://zcal.co/i/QAIUtOXb?embed=1&embedType=iframe" class="w-full h-full border-0"></iframe></div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', zcalHtml);
    }

    // Dépendances Zcal (Après injection)
    const zcalModal = document.getElementById('zcal-modal');
    const zcalSpinner = document.getElementById('zcal-spinner');
    const zcalFallback = document.getElementById('zcal-fallback');
    const retryZcalBtn = document.getElementById('retry-zcal');

    // Logique de "Réessayer" (Bouton Fallback)
    if (retryZcalBtn) {
        retryZcalBtn.addEventListener('click', () => {
            // Masque l'erreur, réaffiche le spinner
            if (zcalFallback) zcalFallback.classList.add('hidden');
            if (zcalSpinner) zcalSpinner.style.display = 'block';
            
            // On cherche l'iframe active
            const activeContent = document.querySelector('#zcal-modal-container .relative.flex-grow > div:not(.hidden):not(.zcal-spinner):not(.zcal-fallback)');
            const iframe = activeContent ? activeContent.querySelector('iframe') : null;

            if (iframe) {
                // Force le rechargement de la source
                iframe.src = iframe.src;
                
                // Relance le timeout de sécurité
                if (zcalLoadTimeout) clearTimeout(zcalLoadTimeout);
                zcalLoadTimeout = setTimeout(() => {
                    if (iframe.style.opacity === '0') {
                        if (zcalSpinner) zcalSpinner.style.display = 'none';
                        if (zcalFallback) zcalFallback.classList.remove('hidden');
                    }
                }, 8000);
            }
        });
    }

    // 2. Injection Modale CONTACT
    if (!document.getElementById('contact-modal')) {
        const contactHtml = `
            <div id="contact-modal" class="hidden pointer-events-none fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 opacity-0 transition-opacity duration-300">
                <div class="bg-white/90 backdrop-blur-lg border border-white/30 rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center relative transform scale-95 transition-transform duration-300">
                    <button id="contact-close-modal-btn" class="absolute top-3 right-3 text-gray-500 hover:bg-gray-100 p-2 rounded-full"><i class="fas fa-times"></i></button>
                    <h2 class="text-2xl font-bold text-custom-dark mb-4">Me contacter</h2>
                    <p class="mb-4">contact.sexologique@gmail.com</p>
                    <button id="copy-email-btn" class="bg-custom-dark text-white px-4 py-2 rounded-full mb-2 hover:opacity-90 transition">Copier l'email</button>
                    <div id="copy-success-msg" class="text-green-600 opacity-0 transition-opacity text-sm font-semibold">Copié !</div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', contactHtml);
    }

    // =========================================================================
    // SECTION B : LOGIQUE FONCTIONNELLE
    // =========================================================================

    // 1. Header Scroll Effect
    const header = document.getElementById("main-header");
    if (header) {
        window.addEventListener("scroll", () => header.classList.toggle("header-scrolled", window.scrollY > 50), { passive: true });
    }

    // 2. Menu Mobile
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");
    if (mobileMenuButton && mobileMenu) {
        const icon = mobileMenuButton.querySelector("i");
        const closeMenu = () => {
            mobileMenu.classList.add("hidden");
            if (icon) icon.className = "fas fa-bars";
            mobileMenuButton.setAttribute('aria-expanded', 'false');
        };
        
        mobileMenuButton.addEventListener("click", (e) => {
            e.stopPropagation();
            const isHidden = mobileMenu.classList.toggle("hidden");
            if (icon) icon.className = isHidden ? "fas fa-bars" : "fas fa-times";
            mobileMenuButton.setAttribute('aria-expanded', !isHidden);
        });

        document.addEventListener("click", (e) => {
            if (!mobileMenu.classList.contains("hidden") && !mobileMenu.contains(e.target) && !mobileMenuButton.contains(e.target)) closeMenu();
        });
        
        mobileMenu.querySelectorAll('a, button').forEach(l => l.addEventListener('click', closeMenu));
    }

    // 3. Gestion des boutons "Prendre RDV" (Compatibilité Anciens Boutons)
    // Redirige tous les clics sur .open-schedule-modal vers Zcal
    document.body.addEventListener("click", (e) => {
        const openBtn = e.target.closest(".open-schedule-modal");
        if (openBtn) {
            e.preventDefault();
            // On ouvre Zcal par défaut sur 'indiv', ou on pourrait créer une logique plus complexe
            window.openZcalModal('indiv');
        }
    });

    // Gestion de la touche Echap
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            window.closeZcalModal();
            // Ferme aussi contact si ouvert
            const contactModal = document.getElementById('contact-modal');
            if(contactModal && !contactModal.classList.contains('hidden')) {
                document.getElementById('contact-close-modal-btn')?.click();
            }
        }
    });

    // 4. Logique Contact & Email
    const contactModal = document.getElementById('contact-modal');
    const mailBtn = document.getElementById('mail-btn');
    const closeContactBtn = document.getElementById('contact-close-modal-btn');
    const copyEmailBtn = document.getElementById('copy-email-btn');
    
    if (mailBtn && contactModal) {
        const openContact = (e) => {
            if(e) e.preventDefault();
            contactModal.classList.remove('hidden', 'pointer-events-none');
            requestAnimationFrame(() => contactModal.classList.remove('opacity-0'));
        };
        const closeContact = () => {
            contactModal.classList.add('opacity-0');
            setTimeout(() => contactModal.classList.add('hidden', 'pointer-events-none'), 300);
        };

        mailBtn.addEventListener('click', openContact);
        if(closeContactBtn) closeContactBtn.addEventListener('click', closeContact);
        contactModal.addEventListener('click', (e) => { if (e.target === contactModal) closeContact(); });

        if (copyEmailBtn) {
            copyEmailBtn.addEventListener('click', () => {
                navigator.clipboard.writeText('contact.sexologique@gmail.com').then(() => {
                    const msg = document.getElementById('copy-success-msg');
                    if(msg) { msg.classList.remove('opacity-0'); setTimeout(() => msg.classList.add('opacity-0'), 2000); }
                });
            });
        }
    }

    // 5. Partage & Copy URL
    const copyUrlButton = document.getElementById('copy-url-button');
    if (copyUrlButton) {
        const pageUrl = window.location.href.split('?')[0];
        const title = document.title;
        
        ['fb-share', 'tw-share', 'li-share'].forEach(id => {
            const el = document.getElementById(id);
            if(!el) return;
            if(id === 'fb-share') el.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
            if(id === 'tw-share') el.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(title)}`;
            if(id === 'li-share') el.href = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(title)}`;
        });
        
        const mailShare = document.getElementById('mail-share');
        if (mailShare) {
            mailShare.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent("Je te recommande cet article : " + pageUrl)}`;
            });
        }

        copyUrlButton.addEventListener('click', () => {
            navigator.clipboard.writeText(pageUrl).then(() => {
                copyUrlButton.classList.add('copied');
                setTimeout(() => copyUrlButton.classList.remove('copied'), 2500);
            });
        });
    }

    // 6. Articles Suggérés (Avec Refresh)
    const latestArticlesList = document.getElementById('latest-articles-list');
    if (latestArticlesList) {
        // Injection Bouton Refresh s'il n'existe pas
        const cardTitle = latestArticlesList.closest('.card')?.querySelector('h3');
        let refreshBtn = document.getElementById('refresh-articles');
        if (cardTitle && !refreshBtn) {
            const container = document.createElement('div');
            container.className = 'flex justify-between items-baseline';
            refreshBtn = document.createElement('button');
            refreshBtn.id = 'refresh-articles';
            refreshBtn.className = 'text-gray-400 hover:text-custom-dark transition p-2 mb-4';
            refreshBtn.setAttribute('aria-label', 'Rafraîchir les suggestions');
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            cardTitle.replaceWith(container);
            container.appendChild(cardTitle);
            container.appendChild(refreshBtn);
        }

        const loadRandomArticles = () => {
            if (refreshBtn) { refreshBtn.disabled = true; refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }
            
            // Gestion chemin relatif (racine vs dossier articles)
            const jsonPath = window.location.pathname.includes('/articles/') ? '../articles.json' : 'articles.json';
            
            fetch(jsonPath).then(r => r.json()).then(articles => {
                const currentID = window.location.pathname.replace(/\/$/, "").split('/').pop().replace('.html','');
                // Filtre l'article courant et prend 6 au hasard
                const selected = articles.filter(a => !a.url.includes(currentID)).sort(() => 0.5 - Math.random()).slice(0, 6);
                
                latestArticlesList.innerHTML = selected.map(a => `
                    <li><a href="${a.url}" class="latest-article-card">
                        <div><p class="article-title">${a.title}</p><p class="article-category">${a.category}</p></div>
                    </a></li>`).join('') || '<li><p>Aucun autre article.</p></li>';
            })
            .catch(e => {
                console.warn("Erreur chargement articles:", e);
                latestArticlesList.innerHTML = '<li>Impossible de charger les suggestions.</li>';
            })
            .finally(() => { if (refreshBtn) { refreshBtn.disabled = false; refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>'; }});
        };
        
        if (refreshBtn) refreshBtn.addEventListener('click', loadRandomArticles);
        loadRandomArticles();
    }
});