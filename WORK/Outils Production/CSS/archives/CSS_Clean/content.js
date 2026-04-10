// content.js: V3 - Final, Complete, and Fully Functional Implementation. No compromises.

'use strict';

// --- State Management ---
const state = { 
    activeTab: 'editor', 
    targetElement: null, 
    classIndex: new Set(), 
    auditResults: null, 
    shadowRoot: null,
    historyStack: [],
    historyIndex: -1,
    scanCycleIndices: {},
    scannerSearch: '',
    scannerSort: 'desc',
    editorSearch: '',
    isPicking: false,
    isModal: false, // New Modal Mode
    panelPos: { x: 20, y: 20 },
    elementClassMap: new Map(),
    scrollPositions: { editor: 0, scanner: 0 }
};

// --- Default Settings & Config ---
const DEFAULT_SETTINGS = { 
    keybindings: { 
        parent: 'ArrowUp', 
        firstChild: 'ArrowDown', 
        nextSibling: 'ArrowRight', 
        prevSibling: 'ArrowLeft' 
    }
};
let userSettings = DEFAULT_SETTINGS;

// --- SVG Icons ---
const ICONS = {
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    chevron: `<svg class="class-name-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
    prev: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
    next: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
    up: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>`,
    down: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
    pick: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="2" x2="12" y2="5"></line><line x1="12" y1="19" x2="12" y2="22"></line><line x1="2" y1="12" x2="5" y2="12"></line><line x1="19" y1="12" x2="22" y2="12"></line></svg>`,
    copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`,
    ghost: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.68 12.67a2 2 0 1 1 2.32 3.33M5.32 16a2 2 0 1 1 2.32-3.33"></path><path d="M9 10a3 3 0 1 1 6 0"></path><path d="M2 20a10 10 0 0 1 20 0v2H2v-2Z"></path></svg>`,
    zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
};

// --- Initialization ---
// Restore Alt + Right Click robustness
document.addEventListener("contextmenu", e => { 
    if (e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        startDeepClean(e.target);
        return false;
    }
    state.targetElement = e.target; 
}, true);

document.addEventListener("mousedown", e => {
    // Prevent default context menu from triggering on mouseup if Alt is held
    if (e.button === 2 && e.altKey) {
        e.preventDefault();
    }
}, true);

chrome.runtime.onMessage.addListener(req => {
    if (req.type === "DEEP_CLEAN_INIT" && state.targetElement) startDeepClean(state.targetElement);
});

// --- Core Application Logic ---
async function startDeepClean(targetElement) {
    if (!targetElement) return;
    
    // Persist scroll positions before potential full re-render
    if (state.shadowRoot) {
        const editorList = state.shadowRoot.querySelector('.deepclean-pane[data-pane="editor"] .deepclean-list');
        const scannerList = state.shadowRoot.querySelector('.deepclean-pane[data-pane="scanner"] .scanner-list');
        if (editorList) state.scrollPositions.editor = editorList.scrollTop;
        if (scannerList) state.scrollPositions.scanner = scannerList.scrollTop;
    }

    if (state.targetElement !== targetElement) {
        state.scrollPositions.editor = 0; // Reset editor scroll on new element
    }

    if (state.targetElement) {
        state.targetElement.style.outline = state.targetElement.dataset.originalOutline || '';
    }
    state.targetElement = targetElement;

    // Maintain persistent class list for this element
    const isNewElement = !state.elementClassMap.has(targetElement);
    if (isNewElement) {
        state.elementClassMap.set(targetElement, new Set(targetElement.classList));
    }

    if (!state.targetElement.dataset.originalOutline) {
        state.targetElement.dataset.originalOutline = state.targetElement.style.outline;
    }
    state.targetElement.style.outline = '2px solid var(--color-accent, #61afef)';

    document.removeEventListener('keydown', handleKeyboardNavigation);
    await loadSettings();
    if (state.classIndex.size === 0) await indexAllClasses();
    if (!state.auditResults) await performPageAudit();
    
    let host = document.getElementById('deepclean-host');
    if (!host) {
        host = document.createElement('div');
        host.id = 'deepclean-host';
        document.body.appendChild(host);
        state.shadowRoot = host.attachShadow({ mode: 'open' });
    }

    const cssText = await fetch(chrome.runtime.getURL('styles.css')).then(r => r.text());
    state.shadowRoot.innerHTML = `
        <style>${cssText}</style>
        <div id="deepclean-panel">
            <div class="deepclean-header">
                <div class="deepclean-header-info"><h1>Analyzing...</h1></div>
            </div>
        </div>`;
    
    // Initial history record if empty
    if (state.historyStack.length === 0) recordState();

    // V5 UX: Handle Trash classes on load
    if (isNewElement) {
        const analysis = await analyzeElementCSS(targetElement);
        let modified = false;
        analysis.forEach(cls => {
            if (cls.category === 'trash') {
                targetElement.classList.remove(cls.className);
                modified = true;
            }
        });
        if (modified) recordState();
    }

    await renderApp();
}

async function renderApp() {
    if (!state.shadowRoot) return;
    const panel = state.shadowRoot.getElementById('deepclean-panel');
    
    // Save scroll positions
    const editorList = state.shadowRoot.querySelector('.deepclean-pane[data-pane="editor"] .deepclean-list');
    const scannerList = state.shadowRoot.querySelector('.deepclean-pane[data-pane="scanner"] .scanner-list');
    if (editorList) state.scrollPositions.editor = editorList.scrollTop;
    if (scannerList) state.scrollPositions.scanner = scannerList.scrollTop;

    const analysisResults = await analyzeElementCSS(state.targetElement);
    
    let filteredEditor = analysisResults;
    if (state.editorSearch) {
        filteredEditor = filteredEditor.filter(c => c.className.toLowerCase().includes(state.editorSearch.toLowerCase()));
    }

    let filteredAudit = state.auditResults;
    if (state.scannerSearch) {
        filteredAudit = filteredAudit.filter(r => r.selector.toLowerCase().includes(state.scannerSearch.toLowerCase()));
    }
    filteredAudit.sort((a, b) => state.scannerSort === 'desc' ? b.count - a.count : a.count - b.count);

    renderFullUI(panel, state.targetElement, filteredEditor, filteredAudit);
    addPanelEventListeners(analysisResults);
    
    const panelEl = state.shadowRoot.getElementById('deepclean-panel');
    panelEl.style.top = `${state.panelPos.y}px`;
    panelEl.style.right = `${state.panelPos.x}px`;

    state.shadowRoot.querySelector(`.deepclean-tab[data-tab="${state.activeTab}"]`).classList.add('active');
    state.shadowRoot.querySelector(`.deepclean-pane[data-pane="${state.activeTab}"]`).classList.add('active');
    updateUndoRedoButtons();

    // Restore scroll positions
    const newEditorList = state.shadowRoot.querySelector('.deepclean-pane[data-pane="editor"] .deepclean-list');
    const newScannerList = state.shadowRoot.querySelector('.deepclean-pane[data-pane="scanner"] .scanner-list');
    if (newEditorList) newEditorList.scrollTop = state.scrollPositions.editor;
    if (newScannerList) newScannerList.scrollTop = state.scrollPositions.scanner;
}

// --- UI Rendering ---
function renderFullUI(panel, element, editorData, scannerData) {
    const tagName = element.tagName.toLowerCase(), id = element.id ? `#${element.id}` : '';
    const cssPath = generateCSSSelector(element);
    
    // Manage Modal Overlay
    let overlay = state.shadowRoot.getElementById('deepclean-overlay');
    if (state.isModal) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'deepclean-overlay';
            state.shadowRoot.insertBefore(overlay, panel);
        }
        panel.classList.add('modal-mode');
    } else {
        if (overlay) overlay.remove();
        panel.classList.remove('modal-mode');
    }

    panel.innerHTML = `
        <div class="deepclean-header" id="deepclean-header">
            <div class="deepclean-header-info">
                <h1>DeepClean</h1>
                <div style="display:flex; align-items:center; gap:8px;">
                    <p class="deepclean-header-path" title="${cssPath}">${cssPath}</p>
                </div>
            </div>
            <div class="header-actions">
             <button class="deepclean-copy-classes-btn" id="copy-classes-btn" title="Copier toutes les classes">${ICONS.copy}</button>
                <button class="deepclean-modal-toggle ${state.isModal ? 'active' : ''}" id="modal-toggle" title="Focus Mode (Modal)">${ICONS.zap}</button>
                <button class="deepclean-pick-btn ${state.isPicking ? 'active' : ''}" id="pick-btn" title="Inspecter Élément">${ICONS.pick}</button>
                <button class="deepclean-close-btn" id="close-btn">${ICONS.close}</button>
            </div>
        </div>
        <div class="deepclean-tabs">
            <button class="deepclean-tab" data-tab="editor">Éditeur</button>
            <button class="deepclean-tab" data-tab="scanner">Scanner</button>
            <button class="deepclean-tab" data-tab="settings">Réglages</button>
        </div>
        <div class="deepclean-pane" data-pane="editor">
            <div class="editor-nav">
                <button id="nav-parent" title="Parent (↑)">${ICONS.up} Parent</button>
                <button id="nav-child" title="Premier Enfant (↓)">${ICONS.down} Enfant</button>
                <button id="nav-prev" title="Frère précédent (←)">${ICONS.prev} Précédent</button>
                <button id="nav-next" title="Frère suivant (→)">Suivant ${ICONS.next}</button>
            </div>
            <div class="editor-controls">
                <input type="text" id="add-class-input" placeholder="Ajouter une classe...">
                <input type="text" id="editor-search-input" placeholder="Filtrer les classes..." value="${state.editorSearch}">
                <div id="autocomplete-list" style="display:none;"></div>
            </div>
            <ul class="deepclean-list">
                ${editorData.length > 0 ? editorData.map(renderClassCard).join('') : '<p class="micro-copy" style="padding:20px; text-align:center;">Aucune classe correspondante.</p>'}
            </ul>
            <div class="deepclean-footer">
                <div class="deepclean-footer-actions">
                    <div class="footer-row">
                        <button id="deepclean-clean-btn">✨ Nettoyer Élément</button>
                    </div>
                    <div class="footer-row">
                        <button id="global-export-btn">🌍 Exporter Page</button>
                        <button id="reset-all-btn">🔄 Reset Page</button>
                    </div>
                </div>
                <p class="micro-copy">Analyse et nettoie les classes CSS inutilisées.</p>
                <div id="deepclean-result" style="display:none;">
                    <button id="deepclean-copy-btn">COPIER</button>
                    <pre id="deepclean-code-output"></pre>
                </div>
            </div>
        </div>
        <div class="deepclean-pane" data-pane="scanner">
            <div class="scanner-controls">
                <div class="scanner-controls-top">
                    <input type="text" class="scanner-search" placeholder="Filtrer les sélecteurs..." value="${state.scannerSearch}">
                </div>
                <div class="scanner-controls-bottom">
                    <button id="undo-btn" disabled>Annuler</button>
                    <button id="redo-btn" disabled>Rétablir</button>
                    <div style="flex-grow:1"></div>
                    <span>Tri:</span>
                    <button id="scanner-sort-btn">${state.scannerSort === 'desc' ? 'Décroissant ↓' : 'Croissant ↑'}</button>
                </div>
            </div>
            <ul class="scanner-list">
                ${scannerData.map(renderScannerRule).join('')}
            </ul>
        </div>
        <div class="deepclean-pane settings-pane" data-pane="settings">
            ${renderSettings()}
        </div>
        <div id="deepclean-toast-container"></div>`;
}
function renderClassCard(cls) {
    const indicatorColor = cls.category === 'essential' ? 'success' : cls.category === 'partial' ? 'warning' : cls.category === 'ghost' ? 'accent' : 'danger';
    const ghostClass = cls.isGhost ? 'ghost-card' : '';
    const isActive = state.targetElement.classList.contains(cls.className);
    const disabledClass = isActive ? '' : 'disabled';

    let icon = '';
    if (cls.isGhost) icon = `<span class="ghost-icon" title="Classe Fantôme (Non définie)">${ICONS.ghost}</span>`;
    else if (cls.isConditional) icon = `<span class="ghost-icon" title="Protection Responsive/État (Conservé car utile sur mobile ou état :hover)">📱</span>`;
    else if (cls.hasVariant) icon = `<span class="ghost-icon" style="opacity:0.5;" title="Variante Tailwind (Vérification manuelle conseillée)">${ICONS.pick}</span>`;
    
    return `
        <li class="deepclean-class-card ${ghostClass} ${disabledClass}" data-class-name="${cls.className}">
            <div class="class-card-main clickable">
                <span style="color:var(--color-${indicatorColor}); font-size: 18px;">●</span>
                ${icon}
                <span class="class-name">${cls.className}</span>
                ${ICONS.chevron}
                <label class="switch">
                    <input type="checkbox" data-class-toggle="${cls.className}" ${isActive ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
        </li>`;
}
function renderScannerRule(rule) {
    const count = state.scanCycleIndices[rule.selector] !== undefined ? `${state.scanCycleIndices[rule.selector] + 1} / ${rule.count}` : rule.count;
    return `
        <li class="scanner-rule-card">
            <span class="selector" title="${rule.selector}">${rule.selector}</span>
            <span class="count">${count}</span>
            <div class="scanner-actions">
                <button data-scan-view='${rule.selector}'>Voir</button>
                <button data-scan-delete='${rule.selector}'>Suppr.</button>
            </div>
        </li>`;
}
function renderAccordion(cls) {
    const { kept, lost } = cls.properties;
    let content = '<div class="deepclean-details">';
    
    if (cls.isGhost || cls.hasVariant) {
        if (cls.isGhost) {
            content += `<div class="ghost-info"><h3>Classe Fantôme</h3><p>Cette classe n'est définie dans aucune feuille de style.</p></div>`;
        } else {
            content += `<div class="ghost-info"><h3>Variante Tailwind</h3><p>Cette classe utilise une variante (${cls.className.split(':')[0]}:). Elle peut ne pas apparaître comme active dans l'inspecteur standard.</p></div>`;
        }

        if (cls.suggestion) {
            content += `<div class="suggestion-box"><h3>Suggestion Tailwind</h3><pre>${cls.suggestion}</pre><button class="inject-btn" data-inject-class="${cls.className}" data-inject-css="${cls.suggestion.replace(/"/g, '&quot;')}">${ICONS.zap} Injecter</button></div>`;
        }
    } else {
        if (cls.isConditional && kept.length === 0) {
            content += `<div class="ghost-info" style="border-left: 3px solid var(--color-warning); padding-left: 8px;"><h3>Protection Conditionnelle</h3><p>Cette classe est inactive ici mais protégée car elle contient des règles Responsive (@media) ou des états (:hover, etc.).</p></div>`;
        }
        if (kept.length > 0) content += `<h3>Propriétés Actives</h3><ul>${kept.map(p => `<li>${p}</li>`).join('')}</ul>`;
        if (lost.length > 0) content += `<h3>Propriétés Écrasées</h3><ul class="lost-props">${lost.map(p => `<li>${p}</li>`).join('')}</ul>`;
    }
    
    return content + '</div>';
}
function renderSettings() {
    return `
        <div class="settings-group">
            <h3>Raccourcis Clavier</h3>
            ${Object.keys(DEFAULT_SETTINGS.keybindings).map(key => `
                <div class="keybinding">
                    <label>${key.replace(/([A-Z])/g, ' $1')}</label>
                    <input type="text" data-keybind-for="${key}" value="${userSettings.keybindings[key]}" readonly>
                </div>
            `).join('')}
        </div>
        <div class="settings-footer">
            <button id="save-settings-btn">Enregistrer</button>
        </div>`;
}

// --- Event Handling ---
function addPanelEventListeners(analysisResults) {
    const sr = state.shadowRoot;
    const panel = sr.getElementById('deepclean-panel');
    const header = sr.getElementById('deepclean-header');

    // Dragging logic
    let isDragging = false, startX, startY;
    header.onmousedown = (e) => {
        // Exception for header buttons
        if (e.target.closest('.header-actions') || e.target.closest('#copy-classes-btn')) return;

        isDragging = true;
        startX = e.clientX + state.panelPos.x;
        startY = e.clientY - state.panelPos.y;
        document.onmousemove = (e) => {
            if (!isDragging) return;
            state.panelPos.x = startX - e.clientX;
            state.panelPos.y = e.clientY - startY;
            panel.style.right = `${state.panelPos.x}px`;
            panel.style.top = `${state.panelPos.y}px`;
        };
        document.onmouseup = () => { isDragging = false; document.onmousemove = null; };
    };

    sr.getElementById('close-btn').addEventListener('click', () => { 
        if (state.targetElement) {
            state.targetElement.style.outline = state.targetElement.dataset.originalOutline || '';
        }
        sr.host.remove(); 
        document.removeEventListener('keydown', handleKeyboardNavigation);
        stopPicking();
    });

    sr.getElementById('pick-btn').addEventListener('click', () => {
        if (state.isPicking) stopPicking(); else startPicking();
    });

    sr.getElementById('modal-toggle').addEventListener('click', () => {
        state.isModal = !state.isModal;
        renderApp();
    });

    sr.querySelectorAll('.deepclean-tab').forEach(t => t.addEventListener('click', () => { 
        state.activeTab = t.dataset.tab; 
        renderApp(); 
    }));
    
    sr.querySelectorAll('[data-class-toggle]').forEach(t => t.addEventListener('change', e => {
        const className = e.target.dataset.classToggle;
        const card = t.closest('.deepclean-class-card');
        state.targetElement.classList.toggle(className, e.target.checked);
        recordState();
        
        // Targeted DOM update instead of full renderApp
        if (e.target.checked) card.classList.remove('disabled');
        else card.classList.add('disabled');
        
        // Still need to update the copy-classes logic etc if needed, 
        // but for immediate visual feedback this is enough.
    }));

    sr.getElementById('deepclean-clean-btn').addEventListener('click', () => {
        const tempEl = state.targetElement.cloneNode(true);
        // Live state is already in targetElement, no need to manually remove classes
        sr.getElementById('deepclean-code-output').textContent = tempEl.outerHTML;
        sr.getElementById('deepclean-result').style.display = 'block';
        showToast('HTML de l\'élément généré');
    });

    sr.getElementById('global-export-btn').addEventListener('click', async () => {
        showToast('Préparation du nettoyage global...');
        
        // 1. Label elements to maintain mapping after cloning
        const originalElements = Array.from(document.querySelectorAll('[class]')).filter(el => !el.closest('#deepclean-host'));
        originalElements.forEach((el, idx) => el.dataset.deepcleanIdx = idx);

        const clonedDoc = document.documentElement.cloneNode(true);
        const host = clonedDoc.getElementById('deepclean-host');
        if (host) host.remove();

        // 2. Fetch rules and map cloned elements for fast lookup
        const allRules = await getAllCSSRules();
        const total = originalElements.length;
        const cloneMap = new Map();
        clonedDoc.querySelectorAll('[data-deepclean-idx]').forEach(el => {
            cloneMap.set(el.dataset.deepcleanIdx, el);
        });

        // 3. Batch Process
        const batchSize = 15;
        for (let i = 0; i < total; i += batchSize) {
            const batch = originalElements.slice(i, i + batchSize);
            
            showToast(`Nettoyage: ${i}/${total} éléments...`);
            
            await Promise.all(batch.map(async (el) => {
                try {
                    const analysis = await analyzeElementCSS(el, allRules);
                    const trashClasses = analysis.filter(c => c.category === 'trash').map(c => c.className);
                    
                    if (trashClasses.length > 0) {
                        const clonedEl = cloneMap.get(el.dataset.deepcleanIdx);
                        if (clonedEl) {
                            trashClasses.forEach(tc => clonedEl.classList.remove(tc));
                            if (clonedEl.classList.length === 0) clonedEl.removeAttribute('class');
                        }
                    }
                } catch (err) {
                    console.error('DeepClean: Error analyzing element during export', err);
                }
            }));
            
            // Allow UI to breathe
            await new Promise(r => setTimeout(r, 10));
        }

        // 4. Cleanup and Display
        originalElements.forEach(el => delete el.dataset.deepcleanIdx);
        clonedDoc.querySelectorAll('[data-deepclean-idx]').forEach(el => el.removeAttribute('data-deepclean-idx'));

        sr.getElementById('deepclean-code-output').textContent = clonedDoc.outerHTML;
        sr.getElementById('deepclean-result').style.display = 'block';
        showToast('Nettoyage Terminé ! Exportation prête.');
    });

    sr.getElementById('reset-all-btn').addEventListener('click', () => {
        if (state.historyStack.length > 0) {
            applySnapshot(state.historyStack[0]);
            state.historyStack = state.historyStack.slice(0, 1);
            state.historyIndex = 0;
            showToast('Page Réinitialisée');
        }
    });

    sr.getElementById('deepclean-copy-btn').addEventListener('click', e => {
        navigator.clipboard.writeText(sr.getElementById('deepclean-code-output').textContent).then(() => { 
            showToast('Code Copié !');
            e.target.textContent = 'Copié!'; 
            setTimeout(() => e.target.textContent = 'COPIER', 1500); 
        });
    });
    
    const addClassInput = sr.getElementById('add-class-input');
    const editorSearchInput = sr.getElementById('editor-search-input');
    const autocompleteList = sr.getElementById('autocomplete-list');

    if (addClassInput) {
        addClassInput.addEventListener('input', () => {
            const value = addClassInput.value.toLowerCase();
            if (!value) { autocompleteList.style.display = 'none'; return; }
            const suggestions = Array.from(state.classIndex).filter(c => c.toLowerCase().includes(value));
            autocompleteList.innerHTML = suggestions.slice(0, 5).map(s => `<div class="autocomplete-item">${s}</div>`).join('');
            autocompleteList.style.display = 'block';
        });
        addClassInput.addEventListener('keydown', e => { 
            if (e.key === 'Enter' && addClassInput.value) { 
                const newClass = addClassInput.value;
                state.targetElement.classList.add(newClass); 
                if (state.elementClassMap.has(state.targetElement)) {
                    state.elementClassMap.get(state.targetElement).add(newClass);
                }
                recordState();
                renderApp(); 
            }
        });
    }

    if (editorSearchInput) {
        editorSearchInput.addEventListener('input', (e) => {
            state.editorSearch = e.target.value;
            // Debounce or just renderApp
            renderApp();
        });
    }
    if (autocompleteList) {
        autocompleteList.addEventListener('click', e => { 
            if (e.target.classList.contains('autocomplete-item')) { 
                const newClass = e.target.textContent;
                state.targetElement.classList.add(newClass); 
                if (state.elementClassMap.has(state.targetElement)) {
                    state.elementClassMap.get(state.targetElement).add(newClass);
                }
                recordState();
                renderApp(); 
            }
        });
    }
    
    sr.querySelectorAll('.class-card-main.clickable').forEach(cardMain => cardMain.addEventListener('click', e => {
        if (e.target.closest('.switch')) return;
        const card = cardMain.closest('.deepclean-class-card');
        const className = card.dataset.className;
        const result = analysisResults.find(r => r.className === className);
        let details = card.querySelector('.deepclean-details');
        if (details) {
            details.classList.remove('expanded');
            card.querySelector('.class-name-icon').classList.remove('expanded');
            details.addEventListener('transitionend', () => details.remove(), { once: true });
        } else {
            card.insertAdjacentHTML('beforeend', renderAccordion(result));
            details = card.querySelector('.deepclean-details');
            
            // Add listeners for Inject button
            const injectBtn = details.querySelector('.inject-btn');
            if (injectBtn) {
                injectBtn.addEventListener('click', () => {
                    const cls = injectBtn.dataset.injectClass;
                    const css = injectBtn.dataset.injectCss;
                    injectCSSRule(cls, css);
                    showToast(`Injecté : .${cls}`);
                    renderApp(); // Re-analyze to clear ghost status
                });
            }

            setTimeout(() => {
                details.classList.add('expanded');
                card.querySelector('.class-name-icon').classList.add('expanded');
            }, 10);
        }
    }));
    
    const scannerSearch = sr.querySelector('.scanner-search');
    if (scannerSearch) {
        scannerSearch.addEventListener('input', (e) => {
            state.scannerSearch = e.target.value;
            renderApp();
        });
    }

    const scannerSortBtn = sr.getElementById('scanner-sort-btn');
    if (scannerSortBtn) {
        scannerSortBtn.addEventListener('click', () => {
            state.scannerSort = state.scannerSort === 'desc' ? 'asc' : 'desc';
            renderApp();
        });
    }

    sr.querySelectorAll('[data-scan-view]').forEach(btn => {
        const selector = btn.dataset.scanView;
        btn.addEventListener('mouseenter', () => highlightAll(selector));
        btn.addEventListener('mouseleave', () => unhighlightAll());
        btn.addEventListener('click', e => {
            const elements = Array.from(document.querySelectorAll(selector));
            if (elements.length === 0) return;
            let currentIndex = state.scanCycleIndices[selector] === undefined ? -1 : state.scanCycleIndices[selector];
            currentIndex = (currentIndex + 1) % elements.length;
            state.scanCycleIndices[selector] = currentIndex;
            const target = elements[currentIndex];
            startDeepClean(target);
            smartScroll(target);
        });
    });

    sr.querySelectorAll('[data-scan-delete]').forEach(btn => btn.addEventListener('click', e => {
        const selector = e.target.dataset.scanDelete;
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return;
        showToast(`Supprimé ${elements.length} éléments`);
        elements.forEach(el => el.remove());
        recordState();
        performPageAudit().then(renderApp);
    }));
    
    const undoBtn = sr.getElementById('undo-btn');
    if (undoBtn) undoBtn.addEventListener('click', handleUndo);
    const redoBtn = sr.getElementById('redo-btn');
    if (redoBtn) redoBtn.addEventListener('click', handleRedo);

    sr.querySelectorAll('[data-keybind-for]').forEach(input => {
        input.addEventListener('focus', () => { input.value = 'Press key...'; });
        input.addEventListener('keydown', e => { 
            e.preventDefault(); 
            input.value = e.key; 
            userSettings.keybindings[input.dataset.keybindFor] = e.key; 
            input.blur(); 
        });
        input.addEventListener('blur', () => { input.value = userSettings.keybindings[input.dataset.keybindFor]; });
    });

    sr.getElementById('save-settings-btn').addEventListener('click', async () => {
        await saveSettings();
        showToast('Réglages enregistrés');
        const btn = sr.getElementById('save-settings-btn'); 
        btn.textContent = 'Enregistré !'; 
        setTimeout(() => { btn.textContent = 'Enregistrer'; }, 1500);
    });

    // Nav buttons
    sr.getElementById('nav-prev').addEventListener('click', () => navigateElement('prevTraversal'));
    sr.getElementById('nav-next').addEventListener('click', () => navigateElement('nextTraversal'));
    sr.getElementById('nav-parent').addEventListener('click', () => navigateElement('parent'));
    sr.getElementById('nav-child').addEventListener('click', () => navigateElement('firstChild'));

    sr.querySelector('.deepclean-header-path').addEventListener('click', () => {
        navigator.clipboard.writeText(generateCSSSelector(state.targetElement)).then(() => {
            showToast('Sélecteur copié !');
        });
    });

    sr.getElementById('copy-classes-btn').addEventListener('click', () => {
        const classes = Array.from(state.targetElement.classList).join(' ');
        navigator.clipboard.writeText(classes).then(() => {
            showToast('Classes copiées !');
            const btn = sr.getElementById('copy-classes-btn');
            btn.style.color = 'var(--color-success)';
            setTimeout(() => { btn.style.color = ''; }, 1500);
        });
    });

    // Prevent duplicate listeners
    document.removeEventListener('keydown', handleKeyboardNavigation);
    document.addEventListener('keydown', handleKeyboardNavigation);
}

function navigateElement(action) {
    let nextTarget = null;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
        acceptNode(node) {
            if (node.id === 'deepclean-host' || node.closest('#deepclean-host')) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    walker.currentNode = state.targetElement;

    switch (action) {
        case 'parent': nextTarget = state.targetElement.parentElement; break;
        case 'firstChild': nextTarget = state.targetElement.firstElementChild; break;
        case 'nextTraversal': nextTarget = walker.nextNode(); break;
        case 'prevTraversal': nextTarget = walker.previousNode(); break;
    }
    if (nextTarget && nextTarget.nodeName !== 'BODY' && nextTarget.nodeName !== 'HTML') {
        startDeepClean(nextTarget);
        smartScroll(nextTarget);
    }
}

function smartScroll(el) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Padding to avoid elements being right at the edge
    const padding = 50; 
    const isVisible = (
        rect.top >= padding &&
        rect.left >= padding &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) - padding &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) - padding
    );
    if (!isVisible) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
}

function handleKeyboardNavigation(e) {
    if (!state.shadowRoot || state.shadowRoot.activeElement instanceof HTMLInputElement) return;
    const keyAction = Object.entries(userSettings.keybindings).find(([,value]) => value === e.key);
    if (!keyAction) return;
    e.preventDefault();
    
    // Map old keybinding names to new traversal logic if they are next/prev
    let action = keyAction[0];
    if (action === 'nextSibling') action = 'nextTraversal';
    if (action === 'prevSibling') action = 'prevTraversal';
    
    navigateElement(action);
}

function recordState() {
    // Collect all elements with class or style attributes
    const elements = document.querySelectorAll('[class], [style]');
    const snapshot = {
        elements: Array.from(elements).map(el => ({
            selector: generateCSSSelector(el),
            classList: Array.from(el.classList),
            style: el.getAttribute('style')
        })),
        targetSelector: generateCSSSelector(state.targetElement)
    };
    
    // Remove any future states if we are recording a new one
    state.historyStack = state.historyStack.slice(0, state.historyIndex + 1);
    state.historyStack.push(snapshot);
    state.historyIndex = state.historyStack.length - 1;
}

function handleUndo() {
    if (state.historyIndex > 0) {
        state.historyIndex--;
        applySnapshot(state.historyStack[state.historyIndex]);
        showToast('Undo');
    }
}

function handleRedo() {
    if (state.historyIndex < state.historyStack.length - 1) {
        state.historyIndex++;
        applySnapshot(state.historyStack[state.historyIndex]);
        showToast('Redo');
    }
}

function applySnapshot(snapshot) {
    // Restore classes and styles for each element in the snapshot
    snapshot.elements.forEach(data => {
        try {
            const el = document.querySelector(data.selector);
            if (el) {
                el.className = '';
                data.classList.forEach(cls => el.classList.add(cls));
                if (data.style) el.setAttribute('style', data.style);
                else el.removeAttribute('style');
            }
        } catch (e) {}
    });

    const newTarget = document.querySelector(snapshot.targetSelector);
    if (newTarget) {
        startDeepClean(newTarget);
    } else {
        renderApp();
    }
}

function updateUndoRedoButtons() {
    const sr = state.shadowRoot;
    if (!sr) return;
    const undoBtn = sr.getElementById('undo-btn');
    const redoBtn = sr.getElementById('redo-btn');
    if (undoBtn) undoBtn.disabled = state.historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = state.historyIndex >= state.historyStack.length - 1;
}

// --- Picking Mode ---
function startPicking() {
    state.isPicking = true;
    document.addEventListener('mouseover', handlePickMouseOver, true);
    document.addEventListener('click', handlePickClick, true);
    renderApp();
}

function stopPicking() {
    state.isPicking = false;
    document.removeEventListener('mouseover', handlePickMouseOver, true);
    document.removeEventListener('click', handlePickClick, true);
    unhighlightAll();
    renderApp();
}

function handlePickMouseOver(e) {
    if (e.target.closest('#deepclean-host')) return;
    highlightOnly(e.target);
}

function handlePickClick(e) {
    if (e.target.closest('#deepclean-host')) return;
    e.preventDefault();
    e.stopPropagation();
    startDeepClean(e.target);
    stopPicking();
}

function highlightOnly(el) {
    unhighlightAll();
    el.dataset.tempOutline = el.style.outline;
    el.style.outline = '2px dashed var(--color-accent, #61afef)';
}

function highlightAll(selector) {
    document.querySelectorAll(selector).forEach(el => {
        el.dataset.tempOutline = el.style.outline;
        el.style.outline = '2px solid var(--color-warning, #e5c07b)';
    });
}

function unhighlightAll() {
    document.querySelectorAll('[data-temp-outline]').forEach(el => {
        el.style.outline = el.dataset.tempOutline;
        delete el.dataset.tempOutline;
    });
}

function injectCSSRule(className, cssBody) {
    const styleId = 'deepclean-injected-styles';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
    }
    const escapedClass = className.replace(/:/g, '\\:');
    styleEl.textContent += `\n.${escapedClass} { ${cssBody} }`;
}

function showToast(message) {
    const container = state.shadowRoot.getElementById('deepclean-toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'deepclean-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toast-out 0.3s ease-in forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, 2700);
}

// --- Analysis, Audit, Settings, Selector Logic ---
async function analyzeElementCSS(element, preFetchedRules = null) {
    const persistentClasses = state.elementClassMap.get(element) || new Set(element.classList);
    const classList = Array.from(persistentClasses);
    const allRules = preFetchedRules || await getAllCSSRules();
    const results = [];
    const originalComputedStyle = window.getComputedStyle(element);
    
    // Tailwind Variants to ignore for Ghost Class detection
    const TAILWIND_VARIANTS = ['sm:', 'md:', 'lg:', 'xl:', '2xl:', 'dark:', 'hover:', 'focus:', 'active:', 'group-hover:', 'peer-hover:'];

    for (const className of classList) {
        const { props: declaredProps, isConditional } = getDeclaredPropsForClass(allRules, className, element);
        
        if (Object.keys(declaredProps).length === 0) {
            // Ghost Class Detection
            const hasVariant = TAILWIND_VARIANTS.some(v => className.startsWith(v));
            const tailwindSuggestion = analyzeTailwindPattern(className);
            
            results.push({ 
                className, 
                category: 'ghost', 
                isGhost: !hasVariant, 
                suggestion: tailwindSuggestion,
                hasVariant: hasVariant,
                properties: { kept: [], lost: [] } 
            });
            continue;
        }
        
        const tempElement = element.cloneNode(true); 
        tempElement.style.display = 'none'; 
        tempElement.classList.remove(className); 
        document.body.appendChild(tempElement);
        
        const computedStyleWithoutClass = window.getComputedStyle(tempElement);
        let keptProps = [], lostProps = [];
        
        for (const prop in declaredProps) { 
            if (originalComputedStyle[prop] !== computedStyleWithoutClass[prop]) {
                keptProps.push(prop); 
            } else {
                lostProps.push(prop); 
            }
        }
        document.body.removeChild(tempElement);
        
        let category = 'partial';
        if (keptProps.length === 0) {
            category = isConditional ? 'partial' : 'trash'; 
        } else if (lostProps.length === 0) {
            category = 'essential';
        }
        
        results.push({ 
            className, 
            category, 
            isGhost: false, 
            isConditional,
            properties: { kept: keptProps, lost: lostProps } 
        });
    }
    return results.sort((a,b) => {
        const order = { essential: 0, partial: 1, ghost: 2, trash: 3 };
        return order[a.category] - order[b.category];
    });
}

function analyzeTailwindPattern(className) {
    const rules = [];
    const isNegative = className.startsWith('-');
    const baseName = isNegative ? className.substring(1) : className;

    // Layout Utilities
    const layouts = {
        'flex': 'display: flex;',
        'grid': 'display: grid;',
        'hidden': 'display: none;',
        'block': 'display: block;',
        'inline-block': 'display: inline-block;',
        'contents': 'display: contents;',
        'items-center': 'align-items: center;',
        'items-start': 'align-items: flex-start;',
        'items-end': 'align-items: flex-end;',
        'justify-between': 'justify-content: space-between;',
        'justify-center': 'justify-content: center;',
        'relative': 'position: relative;',
        'absolute': 'position: absolute;',
        'fixed': 'position: fixed;',
        'inset-0': 'top: 0; right: 0; bottom: 0; left: 0;'
    };
    if (layouts[className]) rules.push(layouts[className]);

    // Spacing (m-, p-, gap-, space-)
    const spacingMatch = baseName.match(/^(m|p|gap|space-([xy]))-(\[?[\w\d.\/%-]+\]?)$/);
    if (spacingMatch) {
        const [_, prefix, axis, val] = spacingMatch;
        let value = val.startsWith('[') ? val.slice(1, -1) : `${parseFloat(val) * 0.25}rem`;
        if (isNegative) value = `-${value}`;

        if (prefix.startsWith('m') || prefix.startsWith('p')) {
            const type = prefix[0] === 'm' ? 'margin' : 'padding';
            const side = prefix[1] || '';
            const sides = { '': [''], t: ['-top'], r: ['-right'], b: ['-bottom'], l: ['-left'], x: ['-left', '-right'], y: ['-top', '-bottom'] };
            (sides[side] || ['']).forEach(s => rules.push(`${type}${s}: ${value};`));
        } else if (prefix === 'gap') {
            rules.push(`gap: ${value};`);
        } else if (prefix.startsWith('space')) {
            rules.push(`/* Suggestion for children of .${className} */\nmargin-${axis === 'x' ? 'left' : 'top'}: ${value};`);
        }
    }

    // Sizing (w-, h-)
    const sizingMatch = baseName.match(/^(w|h|min-w|max-w|min-h|max-h)-(full|screen|[\d\/.]+|\[.+\])$/);
    if (sizingMatch) {
        const [_, prop, val] = sizingMatch;
        let value = val;
        if (val === 'full') value = '100%';
        else if (val === 'screen') value = prop.includes('w') ? '100vw' : '100vh';
        else if (val.includes('/')) {
            const [n, d] = val.split('/');
            value = `${(parseFloat(n) / parseFloat(d)) * 100}%`;
        } else if (val.startsWith('[')) value = val.slice(1, -1);
        else value = `${parseFloat(val) * 0.25}rem`;
        rules.push(`${prop}: ${value};`);
    }

    // Typography
    const typographyMatch = baseName.match(/^(text|font|leading|tracking|rounded|opacity)-(.+)$/);
    if (typographyMatch) {
        const [_, type, val] = typographyMatch;
        if (type === 'text') {
            const sizes = { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem' };
            if (sizes[val]) rules.push(`font-size: ${sizes[val]}; line-height: 1;`);
            else if (val.startsWith('[')) rules.push(`color: ${val.slice(1, -1)};`);
            else rules.push(`color: ${val}; /* Suggestion */`);
        } else if (type === 'font') {
            const weights = { thin: '100', light: '300', normal: '400', medium: '500', bold: '700', black: '900' };
            rules.push(`font-weight: ${weights[val] || val};`);
        } else if (type === 'leading') {
            const heights = { none: '1', tight: '1.25', snug: '1.375', normal: '1.5', relaxed: '1.625', loose: '2' };
            rules.push(`line-height: ${heights[val] || (val.startsWith('[') ? val.slice(1, -1) : val)};`);
        } else if (type === 'tracking') {
            const spacing = { tighter: '-0.05em', tight: '-0.025em', normal: '0em', wide: '0.025em', wider: '0.05em', widest: '0.1em' };
            rules.push(`letter-spacing: ${spacing[val] || (val.startsWith('[') ? val.slice(1, -1) : val)};`);
        } else if (type === 'rounded') {
            const radii = { none: '0px', sm: '0.125rem', DEFAULT: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', full: '9999px' };
            rules.push(`border-radius: ${radii[val] || (val.startsWith('[' ) ? val.slice(1, -1) : val)};`);
        } else if (type === 'opacity') {
            rules.push(`opacity: ${parseFloat(val) / 100};`);
        }
    }

    // Border Width & Ring
    const borderMatch = baseName.match(/^(border|ring)-?([trblxy])?-?(\d+)?$/);
    if (borderMatch) {
        const [_, type, side, width] = borderMatch;
        const w = width ? `${width}px` : '1px';
        if (type === 'border') {
            const sides = { '': [''], t: ['-top'], r: ['-right'], b: ['-bottom'], l: ['-left'], x: ['-left', '-right'], y: ['-top', '-bottom'] };
            (sides[side || ''] || ['']).forEach(s => rules.push(`border${s}-width: ${w}; border-style: solid;`));
        } else {
            rules.push(`box-shadow: 0 0 0 ${w} var(--ring-color, #3b82f6);`);
        }
    }

    // Common transforms & misc
    if (className === 'uppercase') rules.push('text-transform: uppercase;');
    if (className === 'lowercase') rules.push('text-transform: lowercase;');
    if (className === 'capitalize') rules.push('text-transform: capitalize;');
    if (className === 'shadow') rules.push('box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);');

    return rules.length > 0 ? rules.join('\n') : null;
}

async function getAllCSSRules() { 
    const r = []; 
    const sheets = Array.from(document.styleSheets);
    
    // Include the injected stylesheet if it exists
    const injectedStyle = document.getElementById('deepclean-injected-styles');
    if (injectedStyle && injectedStyle.sheet) {
        sheets.push(injectedStyle.sheet);
    }

    for (const s of sheets) { 
        try { 
            Array.from(s.cssRules || []).forEach(ru => r.push(ru)); 
        } catch (e) {} 
    } 
    return r; 
}

function getDeclaredPropsForClass(allRules, className, element) {
    const p = {};
    let isConditional = false;
    const escapedClassName = CSS.escape(className);
    const twEscapedClassName = className.replace(/:/g, '\\:');
    
    // Robust Regex for class matching (handling Tailwind's escaped colons)
    const classRegex = new RegExp(`\\.(?:${escapedClassName}|${twEscapedClassName})(?![\\w-])`);

    const matchingRules = allRules.filter(r => 
        r.selectorText && classRegex.test(r.selectorText)
    );

    for (const r of matchingRules) {
        try {
            let matchesMedia = true;
            if (r.parentRule && r.parentRule.type === CSSRule.MEDIA_RULE) {
                matchesMedia = window.matchMedia(r.parentRule.media.mediaText).matches;
                isConditional = true;
            }

            // A rule is relevant if the element matches it OR if it's a variant/pseudo of that class
            const isPseudoRule = r.selectorText.includes(`.${twEscapedClassName}:`) || 
                               r.selectorText.includes(`.${escapedClassName}:`);
            
            if (isPseudoRule) isConditional = true;

            if (element.matches(r.selectorText) || isPseudoRule) {
                for (const prop of r.style) {
                    // We prioritize active properties, but collect all declared ones
                    if (!p[prop] || matchesMedia) {
                        p[prop] = r.style.getPropertyValue(prop);
                    }
                }
            } else {
                // Handle complex selectors where the class is part of it
                if (r.selectorText.includes(`.${escapedClassName}`) || r.selectorText.includes(`.${twEscapedClassName}`)) {
                    for (const prop of r.style) {
                        if (!p[prop]) p[prop] = r.style.getPropertyValue(prop);
                    }
                }
            }
        } catch (e) {}
    }
    return { props: p, isConditional };
}

async function indexAllClasses() { 
    (await getAllCSSRules()).forEach(r => { 
        if (r.selectorText) {
            (r.selectorText.match(/\.[\w\d\\:_-]+/g) || []).forEach(c => {
                let name = c.substring(1).replace(/\\:/g, ':');
                state.classIndex.add(name);
            });
        }
    }); 
}

async function performPageAudit() { 
    const a = []; 
    const allRules = await getAllCSSRules();
    const selectors = new Set(allRules.filter(r => r.selectorText).map(r => r.selectorText)); 
    for (const sel of selectors) { 
        try { 
            const count = document.querySelectorAll(sel).length;
            if (count > 0) {
                a.push({ selector: sel, count: count }); 
            }
        } catch (e) {} 
    } 
    state.auditResults = a.sort((x, y) => y.count - x.count); 
}

async function loadSettings() { 
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get('deepCleanSettings'); 
        userSettings = data.deepCleanSettings || DEFAULT_SETTINGS; 
    } else {
        userSettings = DEFAULT_SETTINGS;
    }
}

async function saveSettings() { 
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ deepCleanSettings: userSettings }); 
    }
}

function generateCSSSelector(el) {
    if (!(el instanceof Element)) return '';
    const path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        if (el.id) { 
            selector += '#' + el.id; 
            path.unshift(selector); 
            break; 
        } else { 
            let sib = el, nth = 1; 
            while (sib = sib.previousElementSibling) { 
                if (sib.nodeName.toLowerCase() == selector) nth++; 
            } 
            if (nth != 1) selector += ":nth-of-type("+nth+")"; 
        }
        path.unshift(selector);
        el = el.parentNode;
    }
    return path.join(" > ");
}

