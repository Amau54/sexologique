// --- 1. FONCTIONS GLOBALES FAQ (Accessibles depuis le HTML) ---

	/* ======================
   ZCAL MODAL
====================== */
window.openZcalModal = function(type = 'indiv') {
    const modal = document.getElementById('zcal-modal');
    const container = document.getElementById('zcal-modal-container');
    if (!modal || !container) return;

    modal.classList.remove('hidden', 'opacity-0');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
        container.classList.remove('scale-95', 'opacity-0');
    });

    window.switchZcalTab(type);
};

window.closeZcalModal = function() {
    const modal = document.getElementById('zcal-modal');
    const container = document.getElementById('zcal-modal-container');
    if (!modal || !container) return;

    container.classList.add('scale-95', 'opacity-0');
    modal.classList.add('opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
};

window.switchZcalTab = function(type) {
    ['tele', 'couple', 'indiv'].forEach(t => {
        const content = document.getElementById('content-' + t);
        const btn = document.getElementById('tab-' + t);
        if (!content || !btn) return;

        if (t === type) {
            content.classList.remove('opacity-0', 'pointer-events-none');
            content.classList.add('z-10'); // Place l'élément actif au-dessus
            btn.classList.add('active');
        } else {
            content.classList.add('opacity-0', 'pointer-events-none');
            content.classList.remove('z-10'); // Place les inactifs en dessous
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
            <div id="zcal-modal" style="z-index: 99999 !important;" class="fixed inset-0 hidden flex items-center justify-center p-4 bg-black/30 transition-all duration-300 opacity-0" role="dialog" aria-modal="true" aria-labelledby="zcal-modal-title">
            <!-- Overlay -->
            <div class="absolute inset-0" onclick="closeZcalModal()"></div>
            <!-- Modal -->
<div id="zcal-modal-container" class="glass-effect relative w-full h-full md:h-[95vh] rounded-2xl shadow-xl flex flex-col overflow-hidden transform scale-95 opacity-0 transition-all duration-300">
                <!-- Header -->
                <div class="flex justify-between items-center px-6 py-4 border-b border-white/30 bg-white/40">
                    <h3 id="zcal-modal-title" class="text-2xl md:text-3xl font-light text-custom-accent">Prise de rendez-vous
      </h3>
                    <button onclick="closeZcalModal()" aria-label="Fermer la modale" class="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <!-- Tabs -->
                <div class="flex justify-center py-8 w-full">
                    <div class="inline-flex bg-[#a37b73]/10 p-1.5 rounded-full border border-[#a37b73]/20 gap-2">
                        <button id="tab-indiv" onclick="switchZcalTab('indiv')" class="tab-btn px-4 py-2 md:px-8 md:py-3 md:text-lg font-medium text-[#a37b73] rounded-full transition-all duration-300 hover:bg-[#a37b73]/10">
                            <span class="text-full">Individuelle</span>
                            <span class="text-short">Indiv.</span>
                        </button>
                        <button id="tab-couple" onclick="switchZcalTab('couple')" class="tab-btn px-4 py-2 md:px-8 md:py-3 md:text-lg font-medium text-[#a37b73] rounded-full transition-all duration-300 hover:bg-[#a37b73]/10">Couple
        </button>
                        <button id="tab-tele" onclick="switchZcalTab('tele')" class="tab-btn active px-4 py-2 md:px-8 md:py-3 md:text-lg font-medium text-[#a37b73] rounded-full transition-all duration-300">
                            <span class="text-full">Téléconsultation</span>
                            <span class="text-short">Télé.</span>
                        </button>
                    </div>
                </div>
                <!-- Content -->
                <div class="relative flex-grow">
                    <div id="content-tele" class="absolute inset-0 opacity-100 transition-opacity duration-300">
                        <iframe src="https://zcal.co/i/QAIUtOXb?embed=1&embedType=iframe" class="w-full h-full border-0" title="Agenda téléconsultation"></iframe>
                    </div>
                    <div id="content-couple" class="absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-300">
                        <iframe src="https://zcal.co/i/yjsqTQCY?embed=1&embedType=iframe" class="w-full h-full border-0" title="Agenda couple"></iframe>
                    </div>
                    <div id="content-indiv" class="absolute inset-0 opacity-0 pointer-events-none transition-opacity duration-300">
                        <iframe src="https://zcal.co/i/9zS2bGmt?embed=1&embedType=iframe" class="w-full h-full border-0" title="Agenda individuel"></iframe>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', zcalHtml);
    }





    // 2. Injection Modale CONTACT
    if (!document.getElementById('contact-modal')) {
        const contactHtml = `
            <div id="contact-modal" style="background-color: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);" class="hidden pointer-events-none fixed inset-0 flex items-center justify-center z-50 opacity-0 transition-opacity duration-300">
                <div style="background-color: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);" class="border border-white/30 rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center relative transform scale-95 transition-transform duration-300">
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
            const jsonPath = window.location.pathname.includes('/articles/') ? '../FAQ.json' : 'FAQ.json';
            
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