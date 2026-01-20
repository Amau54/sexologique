document.addEventListener("DOMContentLoaded", function() {
    const header = document.getElementById("main-header");
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");

    if (header) {
        // Optimisation: { passive: true } améliore les performances de scroll sur mobile
        window.addEventListener("scroll", () => {
            header.classList.toggle("header-scrolled", window.scrollY > 50);
        }, { passive: true });
    }

    if (mobileMenuButton && mobileMenu) {
        const icon = mobileMenuButton.querySelector("i");
        const closeMenu = () => {
            mobileMenu.classList.add("hidden");
            if (icon) icon.className = "fas fa-bars";
        };
        mobileMenuButton.addEventListener("click", () => {
            const isHidden = mobileMenu.classList.toggle("hidden");
            if (icon) icon.className = isHidden ? "fas fa-bars" : "fas fa-times";
            const isExpanded = !isHidden;
            mobileMenuButton.setAttribute('aria-expanded', isExpanded);
            mobileMenuButton.setAttribute('aria-label', isExpanded ? 'Fermer le menu' : 'Ouvrir le menu');
        });
        mobileMenu.addEventListener("click", (e) => {
            if (e.target.closest("a") || e.target.closest("button")) {
                closeMenu();
            }
        });
    }

    const scheduleModal = document.getElementById("schedule-modal");
    const iframe = document.getElementById("acuity-iframe");
    const loadingSpinner = document.getElementById("loading-spinner");

    function initializeModalFallback() {
        if (document.getElementById("fallback-container") || !loadingSpinner) {
            return;
        }

        const spinnerContent = document.createElement('div');
        spinnerContent.id = 'spinner-content';

        while (loadingSpinner.firstChild) {
            spinnerContent.appendChild(loadingSpinner.firstChild);
        }

        const fallbackContainer = document.createElement('div');
        fallbackContainer.id = 'fallback-container';
        fallbackContainer.className = 'hidden';
        fallbackContainer.innerHTML = `
        <p class="text-lg text-custom-dark mb-4">Un problème de chargement ?</p>
        <a id="fallback-link" href="#" target="_blank" rel="noopener" 
           class="inline-block bg-custom-dark text-white font-semibold rounded-full px-6 py-3 shadow-lg hover:bg-opacity-90 transform transition-all duration-300 hover:scale-105 border border-white/30">
            Ouvrir dans un nouvel onglet
        </a>
    `;

        loadingSpinner.appendChild(spinnerContent);
        loadingSpinner.appendChild(fallbackContainer);
    }

    initializeModalFallback();

    const spinnerContent = document.getElementById("spinner-content");
    const fallbackContainer = document.getElementById("fallback-container");
    const fallbackLink = document.getElementById("fallback-link");
    let fallbackTimeout;

    function resetModalState() {
        clearTimeout(fallbackTimeout);
        if (iframe) iframe.src = "about:blank";
        if (loadingSpinner) loadingSpinner.classList.add("hidden");
        if (spinnerContent) spinnerContent.classList.add("hidden");
        if (fallbackContainer) fallbackContainer.classList.add("hidden");
        if (iframe) iframe.classList.add("hidden");
    }

    if (iframe) {
        iframe.addEventListener("load", () => {
            clearTimeout(fallbackTimeout);
            if (loadingSpinner) loadingSpinner.classList.add("hidden");
            iframe.classList.remove("hidden");
        });
    }

    if (scheduleModal) {
        scheduleModal.addEventListener("close", resetModalState);
    }

    document.body.addEventListener("click", (e) => {
        const openBtn = e.target.closest(".open-schedule-modal");
        if (openBtn) {
            e.preventDefault();
            const src = openBtn.dataset.src;
            if (!src || !scheduleModal) return;

            if (fallbackLink) fallbackLink.href = src;
            if (iframe) iframe.classList.add("hidden");
            if (iframe) iframe.src = src;

            if (loadingSpinner) loadingSpinner.classList.remove("hidden");
            if (spinnerContent) spinnerContent.classList.remove("hidden");
            if (fallbackContainer) fallbackContainer.classList.add("hidden");

            scheduleModal.showModal();

            fallbackTimeout = setTimeout(() => {
                if (fallbackContainer) fallbackContainer.classList.remove("hidden");
            }, 4000);
        }
    });

    const copyUrlButton = document.getElementById('copy-url-button');
    if (copyUrlButton) {
        const pageUrl = window.location.href.split('?')[0].split('#')[0];
        const articleTitle = document.title;
        const fbShare = document.getElementById('fb-share');
        const twShare = document.getElementById('tw-share');
        const liShare = document.getElementById('li-share');
        const mailShare = document.getElementById('mail-share');

        if (fbShare) {
            fbShare.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
        }
        if (twShare) {
            twShare.href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(articleTitle)}`;
        }
        if (liShare) {
            liShare.href = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(articleTitle)}`;
        }
        if (mailShare) {
            mailShare.addEventListener('click', (e) => {
                e.preventDefault();
                const subject = encodeURIComponent(articleTitle);
                const body = encodeURIComponent(`Je te recommande cet article : ${pageUrl}`);
                window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
            });
        }

        copyUrlButton.addEventListener('click', () => {
            if (copyUrlButton.classList.contains('copied')) return;
            navigator.clipboard.writeText(pageUrl).then(() => {
                copyUrlButton.classList.add('copied');
                setTimeout(() => copyUrlButton.classList.remove('copied'), 2500);
            }).catch(err => {
                console.error('Erreur : Impossible de copier le lien', err);
                const textCopy = copyUrlButton.querySelector('.text-copy');
                if (textCopy) {
                    textCopy.textContent = "Erreur de copie";
                    setTimeout(() => {
                        textCopy.textContent = "Copier le lien";
                    }, 2500);
                }
            });
        });
    }

    const latestArticlesList = document.getElementById('latest-articles-list');
    if (latestArticlesList) {
        const card = latestArticlesList.closest('.card');
        const title = card.querySelector('h3');

        // Conteneur flex
        const titleContainer = document.createElement('div');
        titleContainer.className = 'flex justify-between items-baseline';

        // Bouton de rafraîchissement
        const refreshButton = document.createElement('button');
        refreshButton.className = 'text-gray-400 hover:text-custom-dark transition-colors duration-200 text-base p-2 mb-4';
        refreshButton.setAttribute('aria-label', 'Rafraîchir les articles');
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';

        // Insère dans le DOM
        title.replaceWith(titleContainer);
        titleContainer.appendChild(title);
        titleContainer.appendChild(refreshButton);

        const normalizeFilename = (filename) => {
            return filename.endsWith('.html') ? filename.slice(0, -5) : filename;
        };

        // Gestion plus robuste des URLs (enlève le slash final si présent)
        const path = window.location.pathname.replace(/\/$/, "");
        const currentArticleID = normalizeFilename(path.split('/').pop());

        const loadRandomArticles = () => {
            // 1. Active spinner
            refreshButton.disabled = true;
            refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            // Détection du chemin relatif correct selon si on est à la racine ou dans /articles/
            const jsonPath = window.location.pathname.includes('/articles/') ? '../articles.json' : 'articles.json';

            fetch(jsonPath)
                .then(response => {
                    if (!response.ok) throw new Error('Erreur réseau');
                    return response.json();
                })
                .then(articles => {
                    const filteredArticles = articles.filter(article => {
                        const articleID = normalizeFilename(article.url.split('/').pop());
                        return articleID !== currentArticleID;
                    });

                    const getRandomArticles = (array, count) => {
                        const shuffled = [...array].sort(() => 0.5 - Math.random());
                        return shuffled.slice(0, count);
                    };

                    const selectedArticles = getRandomArticles(filteredArticles, 6);
                    let articlesHtml = '';
                    if (selectedArticles.length > 0) {
                        selectedArticles.forEach(article => {
                            articlesHtml += `
                            <li>
                                <a href="${article.url}" class="latest-article-card">
                                    <div>
                                        <p class="article-title">${article.title}</p>
                                        <p class="article-category">${article.category}</p>
                                    </div>
                                </a>
                            </li>`;
                        });
                    } else {
                        articlesHtml = '<li><p>Pas d\'autres articles disponibles.</p></li>';
                    }
                    latestArticlesList.innerHTML = articlesHtml;
                })
                .catch(error => {
                    console.error("Impossible de charger les articles :", error);
                    latestArticlesList.innerHTML = '<li>Impossible de charger les suggestions.</li>';
                })
                .finally(() => {
                    // 2. Remet l’icône après le chargement
                    refreshButton.disabled = false;
                    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
                });
        };

        refreshButton.addEventListener('click', loadRandomArticles);
        loadRandomArticles();
    }



    const mailBtn = document.getElementById('mail-btn');
    const contactModal = document.getElementById('contact-modal');
    const copyEmailBtn = document.getElementById('copy-email-btn');
    const copySuccessMsg = document.getElementById('copy-success-msg');

    if (mailBtn && contactModal && copyEmailBtn && copySuccessMsg) {
        const email = 'contact.sexologique@gmail.com';
        mailBtn.addEventListener('click', (e) => {
            e.preventDefault();
            contactModal.showModal();
        });
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                contactModal.close();
            }
        });
        copyEmailBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(email)
                .then(() => {
                    copySuccessMsg.classList.remove('opacity-0');
                    setTimeout(() => copySuccessMsg.classList.add('opacity-0'), 2500);
                })
                .catch(err => console.error('Erreur de copie:', err));
        });
    }

});