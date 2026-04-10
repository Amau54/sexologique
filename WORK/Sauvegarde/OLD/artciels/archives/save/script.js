/**
 * sexo-logique.com - Main Script
 */

// --- GLOBAL FUNCTIONS (Available for onclick in HTML) ---

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
            btn.classList.add('active');
        } else {
            content.classList.add('opacity-0', 'pointer-events-none');
            btn.classList.remove('active');
        }
    });
};

document.addEventListener("DOMContentLoaded", function() {
    // --- INJECT ZCAL MODAL ---
    const zcalModalHtml = `
        <div id="zcal-modal" style="z-index: 99999 !important;" class="fixed inset-0 hidden flex items-center justify-center p-4 bg-black/30 transition-all duration-300 opacity-0" role="dialog" aria-modal="true" aria-labelledby="zcal-modal-title">
            <div class="absolute inset-0" onclick="closeZcalModal()"></div>
            <div id="zcal-modal-container" class="glass-effect relative w-full h-full md:h-[90vh] p-0 md:p-0 rounded-2xl shadow-xl flex flex-col overflow-hidden transform scale-95 opacity-0 transition-all duration-300">
                <div class="flex justify-between items-center px-6 py-4 border-b border-white/30 bg-white/40">
                    <h3 id="zcal-modal-title" class="text-2xl md:text-3xl font-light text-custom-accent">Prise de rendez-vous</h3>
                    <button onclick="closeZcalModal()" aria-label="Fermer la modale" class="text-gray-400 hover:text-gray-600 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="flex justify-center py-8 w-full">
                    <div class="inline-flex bg-[#a37b73]/10 p-1.5 rounded-full border border-[#a37b73]/20 gap-2">
                        <button id="tab-indiv" onclick="switchZcalTab('indiv')" class="tab-btn px-4 py-2 md:px-8 md:py-3 text-sm md:text-lg font-medium text-[#a37b73] rounded-full transition-all duration-300 hover:bg-[#a37b73]/10">
                            <span class="text-full">Individuelle</span>
                            <span class="text-short">Indiv.</span>
                        </button>
                        <button id="tab-couple" onclick="switchZcalTab('couple')" class="tab-btn px-4 py-2 md:px-8 md:py-3 text-sm md:text-lg font-medium text-[#a37b73] rounded-full transition-all duration-300 hover:bg-[#a37b73]/10">Couple</button>
                        <button id="tab-tele" onclick="switchZcalTab('tele')" class="tab-btn active px-4 py-2 md:px-8 md:py-3 text-sm md:text-lg font-medium text-[#a37b73] rounded-full transition-all duration-300">
                            <span class="text-full">Téléconsultation</span>
                            <span class="text-short">Télé.</span>
                        </button>
                    </div>
                </div>
                <div class="relative flex-grow bg-white">
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
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', zcalModalHtml);

    // --- ELEMENTS ---
    const header = document.getElementById("main-header");
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");
    const contactModal = document.getElementById('contact-modal');
    const contactModalContent = document.getElementById('contact-modal-content');
    const contactCloseModalBtn = document.getElementById('contact-close-modal-btn');
    const mailBtn = document.getElementById('mail-btn');
    const copyEmailBtn = document.getElementById('copy-email-btn');
    const copySuccessMsg = document.getElementById('copy-success-msg');

    // --- HEADER SCROLL ---
    if (header) {
        let ticking = false;
        window.addEventListener("scroll", () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    header.classList.toggle("header-scrolled", window.scrollY > 50);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // --- MOBILE MENU ---
    if (mobileMenuButton && mobileMenu) {
        const icon = mobileMenuButton.querySelector("i");
        const closeMenu = () => {
            mobileMenu.classList.add("hidden");
            if (icon) icon.className = "fas fa-bars";
            mobileMenuButton.setAttribute('aria-expanded', 'false');
            mobileMenuButton.setAttribute('aria-label', 'Ouvrir le menu');
        };

        mobileMenuButton.addEventListener("click", (e) => {
            e.stopPropagation();
            const isHidden = mobileMenu.classList.toggle("hidden");
            if (icon) icon.className = isHidden ? "fas fa-bars" : "fas fa-times";
            mobileMenuButton.setAttribute('aria-expanded', !isHidden);
            mobileMenuButton.setAttribute('aria-label', isHidden ? 'Ouvrir le menu' : 'Fermer le menu');
        });

        mobileMenu.addEventListener("click", (e) => {
            if (e.target.closest("a") || e.target.closest("button")) {
                closeMenu();
            }
        });

        document.addEventListener("click", (e) => {
            if (!mobileMenu.classList.contains("hidden") && !mobileMenu.contains(e.target) && !mobileMenuButton.contains(e.target)) {
                closeMenu();
            }
        });
    }

    // --- CONTACT MODAL ---
    if (contactModal && mailBtn) {
        const email = 'contact.sexologique@gmail.com';
        const openContactModal = () => {
            contactModal.classList.remove('opacity-0', 'pointer-events-none');
            if (contactModalContent) requestAnimationFrame(() => contactModalContent.classList.remove('scale-95'));
        };
        const closeContactModal = () => {
            if (contactModalContent) contactModalContent.classList.add('scale-95');
            contactModal.classList.add('opacity-0');
            setTimeout(() => contactModal.classList.add('pointer-events-none'), 300);
        };

        let mailtoTimeout;
        const onBlurHandler = () => {
            clearTimeout(mailtoTimeout);
            window.removeEventListener('blur', onBlurHandler);
        };

        mailBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.addEventListener('blur', onBlurHandler);
            mailtoTimeout = setTimeout(() => {
                openContactModal();
                window.removeEventListener('blur', onBlurHandler);
            }, 1500);
            window.location.href = e.currentTarget.href;
        });

        if (contactCloseModalBtn) contactCloseModalBtn.addEventListener('click', closeContactModal);
        contactModal.addEventListener('click', (e) => { if (e.target === contactModal) closeContactModal(); });

        if (copyEmailBtn) {
            copyEmailBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(email).then(() => {
                    if (copySuccessMsg) {
                        copySuccessMsg.classList.remove('opacity-0');
                        setTimeout(() => copySuccessMsg.classList.add('opacity-0'), 2500);
                    }
                }).catch(err => console.error('Erreur de copie:', err));
            });
        }
    }

    // --- ZCAL MODAL EVENTS ---
    const zcalModal = document.getElementById('zcal-modal');
    if (zcalModal) {
        zcalModal.addEventListener("click", (e) => {
            if (e.target === zcalModal) window.closeZcalModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            window.closeZcalModal();
            const contactModal = document.getElementById('contact-modal');
            if (contactModal && !contactModal.classList.contains('pointer-events-none')) {
                const closeBtn = document.getElementById('contact-close-modal-btn');
                if (closeBtn) closeBtn.click();
            }
        }
    });

    // --- SOCIAL SHARING ---
    const copyUrlButton = document.getElementById('copy-url-button');
    if (copyUrlButton) {
        const pageUrl = window.location.href.split('?')[0].split('#')[0];
        const articleTitle = document.title;
        const fbShare = document.getElementById('fb-share');
        const twShare = document.getElementById('tw-share');
        const liShare = document.getElementById('li-share');
        const mailShare = document.getElementById('mail-share');

        if (fbShare) fbShare.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
        if (twShare) twShare.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(articleTitle)}`;
        if (liShare) liShare.href = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(articleTitle)}`;
        if (mailShare) {
            mailShare.addEventListener('click', (e) => {
                e.preventDefault();
                window.open(`mailto:?subject=${encodeURIComponent(articleTitle)}&body=${encodeURIComponent('Je te recommande cet article : ' + pageUrl)}`, '_blank');
            });
        }

        copyUrlButton.addEventListener('click', () => {
            if (copyUrlButton.classList.contains('copied')) return;
            navigator.clipboard.writeText(pageUrl).then(() => {
                copyUrlButton.classList.add('copied');
                setTimeout(() => copyUrlButton.classList.remove('copied'), 2500);
            });
        });
    }

    // --- LATEST ARTICLES (INDEX) ---
    const latestContainer = document.getElementById('latest-articles-container');
    if (latestContainer) {
        const loadLatestArticles = async () => {
            try {
                const response = await fetch('articles.json');
                if (!response.ok) return;
                const allArticles = await response.json();
                const latestThree = allArticles.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
                
                const palettes = [['#a37b73', '#c28f82'], ['#b09e99', '#8a7974'], ['#d4c9bf', '#a37b73'], ['#8c92ac', '#5f6784']];
                
                latestContainer.innerHTML = latestThree.map(article => {
                    const palette = palettes[article.title.length % palettes.length];
                    const iconClass = article.iconClass || 'fa-solid fa-book-open';
                    return `
                        <a href="articles/${article.url}" class="group flex flex-col h-full bg-white/40 rounded-2xl overflow-hidden shadow-lg border border-white/20 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.03]">
                            <div class="h-24 flex items-center justify-center" style="background: linear-gradient(135deg, ${palette[0]}, ${palette[1]})">
                                <i class="${iconClass} text-3xl text-white bg-white/15 p-3 rounded-full backdrop-blur-sm"></i>
                            </div>
                            <div class="p-5 flex flex-col flex-grow">
                                <h3 class="text-xl font-bold text-custom-dark mb-3 leading-tight group-hover:text-custom-accent transition-colors">${article.title}</h3>
                                <p class="text-gray-700 text-base line-clamp-3">${article.excerpt}</p>
                                <div class="opacity-0 group-hover:opacity-100 transition-opacity mt-4">
                                    <span class="inline-block bg-custom-dark text-white text-xs font-bold px-3 py-1.5 rounded-full">Lire la suite</span>
                                </div>
                            </div>
                        </a>`;
                }).join('');
            } catch (error) { console.error(error); }
        };
        loadLatestArticles();
    }

    // --- RANDOM ARTICLES (SIDEBAR) ---
    const latestArticlesList = document.getElementById('latest-articles-list');
    if (latestArticlesList) {
        const card = latestArticlesList.closest('.card');
        let refreshButton = card ? card.querySelector('.refresh-articles-btn') : null;
        
        if (card && !refreshButton) {
            const title = card.querySelector('h3');
            if (title) {
                const titleContainer = document.createElement('div');
                titleContainer.className = 'flex justify-between items-baseline';
                refreshButton = document.createElement('button');
                refreshButton.className = 'refresh-articles-btn text-gray-400 hover:text-custom-dark transition-colors duration-200 text-base p-2 mb-4';
                refreshButton.setAttribute('aria-label', 'Rafraîchir les articles');
                refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
                title.replaceWith(titleContainer);
                titleContainer.appendChild(title);
                titleContainer.appendChild(refreshButton);
            }
        }

        const loadRandomArticles = () => {
            if (refreshButton) {
                refreshButton.disabled = true;
                refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }
            const jsonPath = window.location.pathname.includes('/articles/') ? '../articles.json' : 'articles.json';
            fetch(jsonPath)
                .then(response => response.json())
                .then(articles => {
                    const currentPath = window.location.pathname.replace(/\/$/, "");
                    const currentArticleID = currentPath.split('/').pop().replace('.html', '');
                    const filteredArticles = articles.filter(a => !a.url.includes(currentArticleID));
                    const selected = filteredArticles.sort(() => 0.5 - Math.random()).slice(0, 6);
                    latestArticlesList.innerHTML = selected.map(article => `
                        <li>
                            <a href="${article.url}" class="latest-article-card">
                                <div>
                                    <p class="article-title">${article.title}</p>
                                    <p class="article-category">${article.category}</p>
                                </div>
                            </a>
                        </li>`).join('') || '<li><p>Pas d\'autres articles disponibles.</p></li>';
                })
                .finally(() => {
                    if (refreshButton) {
                        refreshButton.disabled = false;
                        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
                    }
                });
        };
        if (refreshButton) refreshButton.addEventListener('click', loadRandomArticles);
        loadRandomArticles();
    }
});
