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
    scannerMode: 'audit', // 'audit' or 'ghost'
    ghostClasses: [],
    ghostCycleStates: {}, // selector -> { mode: 'all'|'unit', index: -1 }
    editorSearch: '',
    isPicking: false,
    isModal: false, // New Modal Mode
    panelPos: { x: 20, y: 20 },
    panelSize: { w: 440, h: null },
    elementClassMap: new Map(),
    scrollPositions: { editor: 0, scanner: 0 },
    dynamicClasses: new Set(),
    mutationObserver: null
};

// --- Default Settings & Config ---
const DEFAULT_SETTINGS = { 
    keybindings: { 
        parent: 'ArrowUp', 
        firstChild: 'ArrowDown', 
        nextSibling: 'ArrowRight', 
        prevSibling: 'ArrowLeft' 
    },
    breakpoints: [375, 768, 1024, 1440]
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
        state.targetElement.style.outlineOffset = state.targetElement.dataset.originalOutlineOffset || '';
    }
    state.targetElement = targetElement;

    // Maintain persistent class list for this element
    const isNewElement = !state.elementClassMap.has(targetElement);
    if (isNewElement) {
        state.elementClassMap.set(targetElement, new Set(targetElement.classList));
    }

    if (state.targetElement.dataset.originalOutline === undefined) {
        state.targetElement.dataset.originalOutline = state.targetElement.style.outline;
        state.targetElement.dataset.originalOutlineOffset = state.targetElement.style.outlineOffset;
    }
    state.targetElement.style.setProperty('outline', '2px solid var(--color-accent, #61afef)', 'important');
    state.targetElement.style.setProperty('outline-offset', '2px', 'important');

    document.removeEventListener('keydown', handleKeyboardNavigation);
    await loadSettings();
    if (state.classIndex.size === 0) await indexAllClasses();
    if (!state.auditResults) await performPageAudit();
    
    // Start mutation observer for SPA support
    initMutationObserver();

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
    
    // 1. Save Focus & Selection
    const activeElId = state.shadowRoot.activeElement ? state.shadowRoot.activeElement.id : null;
    let selectionStart, selectionEnd;
    if (activeElId) {
        const activeEl = state.shadowRoot.getElementById(activeElId);
        if (activeEl instanceof HTMLInputElement) {
            selectionStart = activeEl.selectionStart;
            selectionEnd = activeEl.selectionEnd;
        }
    }

    // 2. Save scroll positions
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
    if (state.panelSize.w) panelEl.style.width = `${state.panelSize.w}px`;
    if (state.panelSize.h) panelEl.style.height = `${state.panelSize.h}px`;

    state.shadowRoot.querySelector(`.deepclean-tab[data-tab="${state.activeTab}"]`).classList.add('active');
    state.shadowRoot.querySelector(`.deepclean-pane[data-pane="${state.activeTab}"]`).classList.add('active');
    updateUndoRedoButtons();

    // Restore scroll positions
    const newEditorList = state.shadowRoot.querySelector('.deepclean-pane[data-pane="editor"] .deepclean-list');
    const newScannerList = state.shadowRoot.querySelector('.deepclean-pane[data-pane="scanner"] .scanner-list');
    if (newEditorList) newEditorList.scrollTop = state.scrollPositions.editor;
    if (newScannerList) newScannerList.scrollTop = state.scrollPositions.scanner;

    // 3. Restore Focus & Selection
    if (activeElId) {
        const newActiveEl = state.shadowRoot.getElementById(activeElId);
        if (newActiveEl) {
            newActiveEl.focus();
            if (newActiveEl instanceof HTMLInputElement && selectionStart !== undefined) {
                newActiveEl.setSelectionRange(selectionStart, selectionEnd);
            }
        }
    }
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
        <div class="deepclean-resizer"></div>
        <div class="deepclean-header" id="deepclean-header">
            <div class="deepclean-header-info">
                <h1>DeepClean V7.9 - Ultimate Studio</h1>
                <div style="display:flex; align-items:center; gap:8px;">
                    <p class="deepclean-header-path" title="${cssPath}">${cssPath}</p>
                    <button class="deepclean-copy-classes-btn" id="copy-classes-btn" title="Copier toutes les classes">${ICONS.copy}</button>
                </div>
            </div>
            <div class="header-actions">
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
                        <button class="icon-btn-subtle" id="deep-scan-responsive-btn" title="Lancer l'audit responsive">${ICONS.pick}</button>
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
                <div class="scanner-controls-tabs">
                    <button id="scanner-audit-mode-btn" class="${state.scannerMode === 'audit' ? 'active' : ''}">Audit CSS</button>
                    <button id="scanner-ghost-mode-btn" class="${state.scannerMode === 'ghost' ? 'active' : ''}">🔍 Voir les Fantômes</button>
                </div>
                <div class="scanner-controls-top">
                    <input type="text" class="scanner-search" placeholder="${state.scannerMode === 'audit' ? 'Filtrer les sélecteurs...' : 'Filtrer les classes fantômes...'}" value="${state.scannerSearch}">
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
                ${state.scannerMode === 'audit' 
                    ? scannerData.filter(r => {
                        const q = state.scannerSearch.toLowerCase();
                        if (!q) return true;
                        return q.length <= 2 ? r.selector.toLowerCase().startsWith('.' + q) || r.selector.toLowerCase().startsWith(q) : r.selector.toLowerCase().includes(q);
                    }).map(renderScannerRule).join('') 
                    : state.ghostClasses.filter(g => {
                        const q = state.scannerSearch.toLowerCase();
                        if (!q) return true;
                        return q.length <= 2 ? g.className.toLowerCase().startsWith(q) : g.className.toLowerCase().includes(q);
                    }).sort((a,b) => state.scannerSort === 'desc' ? b.count - a.count : a.count - b.count)
                    .map(renderGhostRule).join('')}
            </ul>
        </div>
        <div class="deepclean-pane settings-pane" data-pane="settings">
            ${renderSettings()}
        </div>
        <div id="deepclean-toast-container"></div>`;
}
function renderClassCard(cls) {
    const colorMap = { essential: 'success', interactive: 'accent', partial: 'warning', ghost: 'accent', danger: 'danger' };
    const indicatorColor = colorMap[cls.category] || 'danger';
    
    const ghostClass = cls.isGhost ? 'ghost-card' : '';
    const isActive = state.targetElement.classList.contains(cls.className);
    const disabledClass = isActive ? '' : 'disabled';

    let icon = '';
    if (cls.isGhost) icon = `<span class="ghost-icon" title="Classe Fantôme (Non définie)">${ICONS.ghost}</span>`;
    else if (cls.isInteractive) icon = `<span class="ghost-icon" style="color:var(--color-accent)" title="Classe Interactive (:hover, :focus...)">👆</span>`;
    else if (cls.isSaved) icon = `<span class="ghost-icon" title="Protection Durable (Inactif ici mais gardé car surchargé par un style Responsive/Mobile)">📱</span>`;
    else if (cls.isConditional) icon = `<span class="ghost-icon" style="opacity:0.6" title="Variante Conditionnelle (@media ou pseudo-état)">${ICONS.pick}</span>`;
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
function renderGhostRule(ghost) {
    const cycle = state.ghostCycleStates[ghost.className] || { mode: 'none' };
    const viewLabel = cycle.mode === 'all' ? 'Focus' : (cycle.mode === 'unit' ? 'Suivant' : 'Voir');
    
    return `
        <li class="scanner-rule-card ghost-scanner-card">
            <span class="selector" title="${ghost.className}">.${ghost.className}</span>
            <span class="count">x${ghost.count}</span>
            <div class="scanner-actions">
                <button data-ghost-view='${ghost.className}'>${viewLabel}</button>
                <button data-ghost-delete='${ghost.className}'>Suppr.</button>
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
        if (cls.isInteractive) {
            content += `<div class="ghost-info" style="border-left: 3px solid var(--color-accent); padding-left: 8px;"><h3>Protection Interactive</h3><p>Cette classe gère des états interactifs (:hover, :focus, etc.). Elle est conservée car elle est nécessaire lors de l'interaction utilisateur.</p></div>`;
        } else if (cls.isSaved) {
            content += `<div class="ghost-info" style="border-left: 3px solid var(--color-warning); padding-left: 8px;"><h3>Protection Durable</h3><p>Cette classe est écrasée par une règle <b>Responsive</b> (ex: une classe mobile ou tablette) ou détectée dynamiquement. Elle est conservée car elle est nécessaire sur d'autres tailles d'écran ou contextes.</p></div>`;
        } else if (cls.isConditional && kept.length === 0) {
            content += `<div class="ghost-info" style="border-left: 3px solid var(--color-warning); padding-left: 8px;"><h3>Protection Conditionnelle</h3><p>Cette classe est inactive car elle ne s'applique qu'à un état spécifique ou à une autre taille d'écran.</p></div>`;
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
        <div class="settings-group">
            <h3>Breakpoints Responsive</h3>
            <div id="breakpoint-list">
                ${(userSettings.breakpoints || []).map((b, i) => `
                    <div class="breakpoint-item">
                        <span>${b}px</span>
                        <button class="remove-breakpoint" data-idx="${i}">×</button>
                    </div>
                `).join('')}
            </div>
            <div class="add-breakpoint-row">
                <input type="number" id="new-breakpoint-input" placeholder="px">
                <button id="add-breakpoint-btn">+</button>
            </div>
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
            state.targetElement.style.outlineOffset = state.targetElement.dataset.originalOutlineOffset || '';
        }
        if (state.mutationObserver) {
            state.mutationObserver.disconnect();
            state.mutationObserver = null;
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
        showToast('HTML de l\'élément généré', 'success');
    });

    sr.getElementById('global-export-btn').addEventListener('click', async () => {
        showToast('Préparation du nettoyage global...', 'info');
        
        // 1. Label elements to maintain mapping after cloning
        const originalElements = Array.from(document.querySelectorAll('[class]')).filter(el => !el.closest('#deepclean-host'));
        originalElements.forEach((el, idx) => el.dataset.deepcleanIdx = idx);

        const clonedDoc = document.documentElement.cloneNode(true);
        const host = clonedDoc.querySelector('#deepclean-host');
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
            
            showToast(`Nettoyage: ${i}/${total} éléments... (Batch ${Math.ceil((i+1)/batchSize)}/${Math.ceil(total/batchSize)})`, 'info');
            
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

        // 4. Cleanup data attributes
        originalElements.forEach(el => delete el.dataset.deepcleanIdx);
        clonedDoc.querySelectorAll('[data-deepclean-idx]').forEach(el => el.removeAttribute('data-deepclean-idx'));

        // 5. Trigger Download
        const htmlContent = '<!DOCTYPE html>\n' + clonedDoc.outerHTML;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cleaned-page.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Nettoyage Terminé ! Téléchargement lancé.', 'success');
    });

    sr.getElementById('reset-all-btn').addEventListener('click', () => {
        if (state.historyStack.length > 0) {
            applySnapshot(state.historyStack[0]);
            state.historyStack = state.historyStack.slice(0, 1);
            state.historyIndex = 0;
            showToast('Page Réinitialisée', 'warning');
        }
    });

    sr.getElementById('deepclean-copy-btn').addEventListener('click', e => {
        navigator.clipboard.writeText(sr.getElementById('deepclean-code-output').textContent).then(() => { 
            showToast('Code Copié !', 'success');
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
                    showToast(`Injecté : .${cls}`, 'success');
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

    const auditModeBtn = sr.getElementById('scanner-audit-mode-btn');
    if (auditModeBtn) {
        auditModeBtn.addEventListener('click', () => {
            state.scannerMode = 'audit';
            renderApp();
        });
    }

    const ghostModeBtn = sr.getElementById('scanner-ghost-mode-btn');
    if (ghostModeBtn) {
        ghostModeBtn.addEventListener('click', async () => {
            state.scannerMode = 'ghost';
            showToast('Recherche des classes fantômes...', 'info');
            await identifyGhostClasses();
            renderApp();
        });
    }

    sr.querySelectorAll('[data-ghost-view]').forEach(btn => {
        const className = btn.dataset.ghostView;
        const selector = `.${className}`;
        
        btn.addEventListener('click', () => {
            const elements = Array.from(document.querySelectorAll(selector));
            if (elements.length === 0) { showToast('Aucun élément trouvé', 'warning'); return; }

            let cycle = state.ghostCycleStates[className] || { mode: 'none', index: -1 };
            unhighlightAll();
            
            if (cycle.mode === 'none' || cycle.mode === 'unit' && cycle.index === elements.length - 1) {
                // Mode 1: Global Highlight
                cycle.mode = 'all';
                cycle.index = -1;
                highlightAllGhost(selector);
                showToast(`Vue globale : ${elements.length} occurrences`, 'info');
            } else {
                // Mode 2: Sequential Focus
                cycle.mode = 'unit';
                cycle.index = (cycle.index + 1) % elements.length;
                const target = elements[cycle.index];
                
                // Pulsing highlight
                target.classList.add('deepclean-focus-pulse');
                setTimeout(() => target.classList.remove('deepclean-focus-pulse'), 3000);
                
                startDeepClean(target);
                smartScroll(target);
            }
            
            state.ghostCycleStates[className] = cycle;
            renderApp();
        });
    });

    sr.querySelectorAll('[data-ghost-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
            const className = btn.dataset.ghostDelete;
            const elements = document.querySelectorAll(`.${className}`);
            elements.forEach(el => el.classList.remove(className));
            showToast(`Supprimée de ${elements.length} éléments`, 'success');
            recordState();
            identifyGhostClasses().then(renderApp);
        });
    });

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
        showToast(`Supprimé ${elements.length} éléments`, 'success');
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
        showToast('Réglages enregistrés', 'success');
        const btn = sr.getElementById('save-settings-btn'); 
        btn.textContent = 'Enregistré !'; 
        setTimeout(() => { btn.textContent = 'Enregistrer'; }, 1500);
    });

    sr.querySelectorAll('.remove-breakpoint').forEach(btn => {
        btn.addEventListener('click', () => {
            userSettings.breakpoints.splice(parseInt(btn.dataset.idx), 1);
            renderApp();
        });
    });

    sr.getElementById('add-breakpoint-btn').addEventListener('click', () => {
        const val = parseInt(sr.getElementById('new-breakpoint-input').value);
        if (val && !userSettings.breakpoints.includes(val)) {
            userSettings.breakpoints.push(val);
            userSettings.breakpoints.sort((a,b) => a - b);
            renderApp();
        }
    });

    sr.getElementById('deep-scan-responsive-btn').addEventListener('click', () => {
        runDeepScanResponsive();
    });

    // Resizing Logic
    const resizer = sr.querySelector('.deepclean-resizer');
    let isResizing = false;
    resizer.onmousedown = (e) => {
        isResizing = true;
        let startW = panel.offsetWidth;
        let startH = panel.offsetHeight;
        let startX = e.clientX;
        let startY = e.clientY;
        
        const doResize = (moveE) => {
            if (!isResizing) return;
            requestAnimationFrame(() => {
                const newW = startW - (moveE.clientX - startX);
                const newH = startH + (moveE.clientY - startY);
                state.panelSize.w = Math.max(300, Math.min(newW, window.innerWidth * 0.9));
                state.panelSize.h = Math.max(400, Math.min(newH, window.innerHeight * 0.85));
                panel.style.width = `${state.panelSize.w}px`;
                panel.style.height = `${state.panelSize.h}px`;
            });
        };
        const stopResize = () => { isResizing = false; document.removeEventListener('mousemove', doResize); document.removeEventListener('mouseup', stopResize); };
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
    };

    // Nav buttons
    sr.getElementById('nav-prev').addEventListener('click', () => navigateElement('prevTraversal'));
    sr.getElementById('nav-next').addEventListener('click', () => navigateElement('nextTraversal'));
    sr.getElementById('nav-parent').addEventListener('click', () => navigateElement('parent'));
    sr.getElementById('nav-child').addEventListener('click', () => navigateElement('firstChild'));

    sr.querySelector('.deepclean-header-path').addEventListener('click', () => {
        navigator.clipboard.writeText(generateCSSSelector(state.targetElement)).then(() => {
            showToast('Sélecteur copié !', 'success');
        });
    });

    sr.getElementById('copy-classes-btn').addEventListener('click', () => {
        const classes = Array.from(state.targetElement.classList).join(' ');
        navigator.clipboard.writeText(classes).then(() => {
            showToast('Classes copiées !', 'success');
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
    if (!state.targetElement) return;
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
        showToast('Undo', 'info');
    }
}

function handleRedo() {
    if (state.historyIndex < state.historyStack.length - 1) {
        state.historyIndex++;
        applySnapshot(state.historyStack[state.historyIndex]);
        showToast('Redo', 'info');
    }
}

function applySnapshot(snapshot) {
    // Restore classes and styles for each element in the snapshot
    snapshot.elements.forEach(data => {
        try {
            if (!data.selector) return;
            const el = document.querySelector(data.selector);
            if (el) {
                el.className = '';
                data.classList.forEach(cls => el.classList.add(cls));
                if (data.style) el.setAttribute('style', data.style);
                else el.removeAttribute('style');
            }
        } catch (e) {}
    });

    try {
        const newTarget = snapshot.targetSelector ? document.querySelector(snapshot.targetSelector) : null;
        if (newTarget) {
            startDeepClean(newTarget);
        } else {
            renderApp();
        }
    } catch (e) {
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
    el.dataset.tempOutlineOffset = el.style.outlineOffset;
    el.style.setProperty('outline', '2px dashed var(--color-accent, #61afef)', 'important');
    el.style.setProperty('outline-offset', '2px', 'important');
}

function highlightAll(selector) {
    document.querySelectorAll(selector).forEach(el => {
        if (el.dataset.tempOutline !== undefined) return;
        el.dataset.tempOutline = el.style.outline;
        el.dataset.tempOutlineOffset = el.style.outlineOffset;
        el.style.setProperty('outline', '2px solid var(--color-warning, #e5c07b)', 'important');
        el.style.setProperty('outline-offset', '2px', 'important');
    });
}

function highlightAllGhost(selector) {
    document.querySelectorAll(selector).forEach(el => {
        el.dataset.tempOutline = el.style.outline;
        el.dataset.tempOutlineOffset = el.style.outlineOffset;
        el.style.setProperty('outline', '3px solid #ff00ea', 'important');
        el.style.setProperty('box-shadow', '0 0 15px rgba(255, 0, 234, 0.6)', 'important');
        el.style.setProperty('outline-offset', '2px', 'important');
        el.classList.add('deepclean-highlight-all');
    });
}

function unhighlightAll() {
    document.querySelectorAll('[data-temp-outline]').forEach(el => {
        el.style.outline = el.dataset.tempOutline;
        el.style.outlineOffset = el.dataset.tempOutlineOffset;
        el.style.boxShadow = '';
        el.classList.remove('deepclean-highlight-all', 'deepclean-focus-pulse');
        delete el.dataset.tempOutline;
        delete el.dataset.tempOutlineOffset;
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
    if (cssBody.includes('{')) {
        // Full rule provided (including media queries or pseudo-selectors)
        styleEl.textContent += `\n${cssBody}`;
    } else {
        // Only body provided, generate standard escaped selector
        const escapedClass = className.replace(/:/g, '\\:').replace(/\//g, '\\/').replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/#/g, '\\#');
        styleEl.textContent += `\n.${escapedClass} { ${cssBody} }`;
    }
}

function showToast(message, type = 'info') {
    const container = state.shadowRoot.getElementById('deepclean-toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `deepclean-toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    
    let icon = '';
    if (type === 'success') icon = '✅ ';
    if (type === 'warning') icon = '⚠️ ';
    if (type === 'error') icon = '❌ ';
    
    toast.textContent = icon + message;
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
    
    // 1. Identify "Winning Rules" for each property of the element
    const winningRulesMap = getWinningRulesMap(element, allRules);

    // Tailwind Variants to ignore for Ghost Class detection
    const TAILWIND_VARIANTS = ['sm:', 'md:', 'lg:', 'xl:', '2xl:', 'dark:', 'hover:', 'focus:', 'active:', 'group-hover:', 'peer-hover:'];

    for (const className of classList) {
        const { props: declaredProps, isConditional, rules: matchingRulesForClass } = getDeclaredPropsForClass(allRules, className, element);
        
        // Handle SPA Dynamic Classes
        const isDynamic = state.dynamicClasses.has(className);

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
        // Off-screen comparison but MUST be visible for computed style layout analysis
        tempElement.style.cssText += ';position:fixed !important;top:-9999px !important;left:-9999px !important;visibility:hidden !important;opacity:0 !important;pointer-events:none !important;'; 
        tempElement.classList.remove(className); 
        document.body.appendChild(tempElement);
        
        const computedStyleWithoutClass = window.getComputedStyle(tempElement);
        let keptProps = [], lostProps = [], protectedByResponsive = false;
        
        for (const prop in declaredProps) { 
            if (originalComputedStyle[prop] !== computedStyleWithoutClass[prop]) {
                keptProps.push(prop); 
            } else {
                lostProps.push(prop);
                // DURABLE PROTECTION: Check if the "Winner" for this lost property is a conditional rule
                const entry = winningRulesMap[prop];
                if (entry) {
                    const condType = isRuleConditional(entry.rule);
                    if (condType) {
                        if (condType === 'interactive') protectedByResponsive = 'interactive';
                        else if (!protectedByResponsive) protectedByResponsive = true;
                    }
                }
            }
        }
        document.body.removeChild(tempElement);
        
        let category = 'partial';
        if (keptProps.length === 0) {
            // If it's trash here but protected by a conditional override or dynamic observation
            if (isConditional === 'interactive' || protectedByResponsive === 'interactive') {
                category = 'interactive';
            } else if (isConditional || protectedByResponsive || isDynamic) {
                category = 'partial';
            } else {
                category = 'trash';
            }
        } else if (lostProps.length === 0) {
            category = 'essential';
        }
        
        results.push({ 
            className, 
            category, 
            isGhost: false, 
            isConditional: !!isConditional,
            isInteractive: category === 'interactive',
            isSaved: (protectedByResponsive || isConditional || isDynamic) && keptProps.length === 0, 
            properties: { kept: keptProps, lost: lostProps } 
        });
    }
    return results.sort((a,b) => {
        const order = { essential: 0, interactive: 1, partial: 2, ghost: 3, trash: 4 };
        return order[a.category] - order[b.category];
    });
}

function analyzeTailwindPattern(className) {
    const BREAKPOINTS = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' };
    const PSEUDOS = ['hover', 'focus', 'active', 'visited', 'focus-within', 'focus-visible', 'disabled', 'group-hover', 'peer-hover'];
    const TAILWIND_COLORS = { 
        white: '#ffffff', black: '#000000', transparent: 'transparent',
        red: { 500: '#ef4444' }, blue: { 500: '#3b82f6' }, green: { 500: '#22c55e' }, 
        gray: { 500: '#6b7280' }, slate: { 500: '#64748b' }
    };

    let workingName = className;
    let isImportant = false;
    if (workingName.startsWith('!')) { isImportant = true; workingName = workingName.substring(1); }

    const parts = workingName.split(':');
    const coreName = parts.pop();
    const prefixes = parts;

    const isNegative = coreName.startsWith('-');
    const baseName = isNegative ? coreName.substring(1) : coreName;

    let rules = [];

    // --- Core Parsing ---
    // Handle Arbitrary Values [x]
    const jitMatch = baseName.match(/^([a-z-]+)-\[(.+)\]$/);
    if (jitMatch) {
        const [_, prefix, value] = jitMatch;
        const propMap = { 
            w: 'width', h: 'height', minw: 'min-width', maxw: 'max-width', minh: 'min-height', maxh: 'max-height',
            bg: 'background-color', text: 'color', border: 'border-color', top: 'top', left: 'left', right: 'right', bottom: 'bottom',
            z: 'z-index', p: 'padding', m: 'margin', gap: 'gap', rounded: 'border-radius', opacity: 'opacity'
        };
        const prop = propMap[prefix.replace(/-/g, '')] || prefix;
        rules.push(`${prop}: ${value.replace(/_/g, ' ')};`);
    } else {
        // Standard Utilities (Minimal subset expanded)
        const layouts = {
            'flex': 'display: flex;', 'grid': 'display: grid;', 'hidden': 'display: none;', 'block': 'display: block;',
            'inline-block': 'display: inline-block;', 'relative': 'position: relative;', 'absolute': 'position: absolute;', 'fixed': 'position: fixed;',
            'inset-0': 'top: 0; right: 0; bottom: 0; left: 0;'
        };
        if (layouts[baseName]) rules.push(layouts[baseName]);

        // Spacing, sizing, typography, colors...
        const spacingMatch = baseName.match(/^(m|p|gap)([trblxy])?-([\d.]+)$/);
        if (spacingMatch) {
            const [_, prefix, side, val] = spacingMatch;
            const value = `${parseFloat(val) * 0.25}rem`;
            const v = isNegative ? `-${value}` : value;
            if (prefix === 'gap') {
                rules.push(`gap: ${v};`);
            } else {
                const type = prefix === 'm' ? 'margin' : 'padding';
                const sides = { '': [''], t: ['-top'], r: ['-right'], b: ['-bottom'], l: ['-left'], x: ['-left', '-right'], y: ['-top', '-bottom'] };
                (sides[side || ''] || ['']).forEach(s => rules.push(`${type}${s}: ${v};`));
            }
        }

        // Basic Colors (without opacity slash)
        const colorMatch = baseName.match(/^([a-z]+)-([a-z]+)-(\d+)$/);
        if (colorMatch && !baseName.includes('/')) {
            const [_, type, color, weight] = colorMatch;
            const prop = type === 'text' ? 'color' : (type === 'bg' ? 'background-color' : 'border-color');
            const hex = TAILWIND_COLORS[color]?.[weight] || (color === 'white' ? '#fff' : (color === 'black' ? '#000' : null));
            if (hex) rules.push(`${prop}: ${hex};`);
        }

        const opacityMatch = baseName.match(/^opacity-(\d+)$/);
        if (opacityMatch) rules.push(`opacity: ${parseInt(opacityMatch[1]) / 100};`);

        // Opacity Modifier (e.g. text-red-500/50)
        if (baseName.includes('/')) {
            const [colorPart, opacity] = baseName.split('/');
            const colorMatch = colorPart.match(/^([a-z]+)-([a-z]+)-(\d+)$/);
            if (colorMatch) {
                const [_, type, color, weight] = colorMatch;
                const prop = type === 'text' ? 'color' : (type === 'bg' ? 'background-color' : 'border-color');
                const hex = TAILWIND_COLORS[color]?.[weight] || '#888';
                rules.push(`${prop}: rgba(${hexToRgb(hex)}, ${parseInt(opacity) / 100});`);
            }
        }
    }

    // --- Smart Guess ---
    if (rules.length === 0 && baseName.includes('-')) {
        const lastDash = baseName.lastIndexOf('-');
        const prop = baseName.substring(0, lastDash);
        const val = baseName.substring(lastDash + 1);
        if (CSS.supports(prop, val)) rules.push(`${prop}: ${val};`);
    }

    if (rules.length === 0) return null;

    // --- Assembly ---
    let body = rules.join(' ') + (isImportant ? ' !important;' : '');
    let selector = `.${className.replace(/:/g, '\\:').replace(/\//g, '\\/').replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/#/g, '\\#')}`;
    
    // Apply state prefixes (hover, etc)
    prefixes.forEach(p => {
        if (PSEUDOS.includes(p)) {
            if (p === 'group-hover') selector = `.group:hover ${selector}`;
            else if (p === 'peer-hover') selector = `.peer:hover ~ ${selector}`;
            else selector += `:${p}`;
        }
    });

    let finalCSS = `${selector} { ${body} }`;

    // Wrap in media queries
    prefixes.reverse().forEach(p => {
        if (BREAKPOINTS[p]) {
            finalCSS = `@media (min-width: ${BREAKPOINTS[p]}) {\n  ${finalCSS.replace(/\n/g, '\n  ')}\n}`;
        }
    });

    return finalCSS;
}

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
}

async function getAllCSSRules() { 
    const rules = []; 
    const sheets = Array.from(document.styleSheets);
    let ruleIndex = 0;
    
    const injectedStyle = document.getElementById('deepclean-injected-styles');
    if (injectedStyle && injectedStyle.sheet) {
        sheets.push(injectedStyle.sheet);
    }

    function flatten(ruleList) {
        for (const rule of ruleList) {
            if (rule.type === CSSRule.STYLE_RULE) {
                rule._index = ruleIndex++;
                rules.push(rule);
            } else if (rule.cssRules) {
                flatten(Array.from(rule.cssRules));
            }
        }
    }

    for (const sheet of sheets) { 
        try { 
            flatten(Array.from(sheet.cssRules || [])); 
        } catch (e) {} 
    } 
    return rules; 
}

function getDeclaredPropsForClass(allRules, className, element) {
    const p = {};
    let isConditional = false;
    const finalMatchingRules = [];
    const escapedClassName = CSS.escape(className);
    const twEscapedClassName = className.replace(/:/g, '\\:');
    
    // Robust Regex for class matching (handling Tailwind's escaped colons)
    const classRegex = new RegExp(`\\.(?:${escapedClassName}|${twEscapedClassName})(?![\\w-])`);

    const potentialRules = allRules.filter(r => 
        r.selectorText && classRegex.test(r.selectorText)
    );

    for (const r of potentialRules) {
        try {
            let matchesMedia = true;
            if (r.parentRule && r.parentRule.type === CSSRule.MEDIA_RULE) {
                matchesMedia = window.matchMedia(r.parentRule.media.mediaText).matches;
                isConditional = true;
            }

            // A rule is relevant if the element matches it OR if it's a variant/pseudo of that class
            const isPseudoRule = r.selectorText.includes(`.${twEscapedClassName}:`) || 
                               r.selectorText.includes(`.${escapedClassName}:`);
            
            if (isPseudoRule) {
                if (/:(hover|focus|active|visited|focus-within|focus-visible)/.test(r.selectorText)) {
                    isConditional = 'interactive';
                } else {
                    isConditional = true;
                }
            }

            if (element.matches(r.selectorText) || isPseudoRule) {
                finalMatchingRules.push(r);
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
    return { props: p, isConditional, rules: finalMatchingRules };
}

// --- Winning Rule Logic ---
function getWinningRulesMap(element, allRules) {
    const map = {};
    const matchingRules = allRules.filter(r => {
        try { return element.matches(r.selectorText); } catch(e) { return false; }
    });

    // Sort matching rules by specificity. 
    // If specificity is equal, order in allRules (source order) breaks the tie.
    matchingRules.sort((a, b) => {
        const comp = compareSpecificity(calculateSpecificity(a.selectorText), calculateSpecificity(b.selectorText));
        if (comp !== 0) return comp;
        return (a._index || 0) - (b._index || 0);
    });

    for (const rule of matchingRules) {
        // Media query evaluation
        let parent = rule.parentRule, matchesMedia = true;
        while (parent) {
            if (parent.type === CSSRule.MEDIA_RULE && !window.matchMedia(parent.media.mediaText).matches) {
                matchesMedia = false; break;
            }
            parent = parent.parentRule;
        }
        
        if (matchesMedia) {
            for (let i = 0; i < rule.style.length; i++) {
                const prop = rule.style[i];
                const isImportant = rule.style.getPropertyPriority(prop) === 'important';
                
                const existing = map[prop];
                if (!existing || isImportant || (existing.priority !== 'important')) {
                    map[prop] = { rule, priority: isImportant ? 'important' : '' };
                }
            }
        }
    }
    
    // Also consider inline styles
    if (element.style.length > 0) {
        for (let i = 0; i < element.style.length; i++) {
            const prop = element.style[i];
            const isImportant = element.style.getPropertyPriority(prop) === 'important';
            map[prop] = { rule: { selectorText: 'inline', style: element.style }, priority: isImportant ? 'important' : '' };
        }
    }

    return map;
}

function isRuleConditional(rule) {
    if (!rule) return false;
    // Check Media Queries
    let parent = rule.parentRule;
    while (parent) {
        if (parent.type === CSSRule.MEDIA_RULE) return true;
        parent = parent.parentRule;
    }
    // Check Interactive Pseudo-classes
    if (rule.selectorText && /:(hover|focus|active|visited|focus-within|focus-visible|target)/i.test(rule.selectorText)) return 'interactive';
    // Check other conditionals (e.g. :checked, :disabled, :valid)
    if (rule.selectorText && /:(checked|disabled|enabled|valid|invalid|required|optional|read-only|read-write|indeterminate|empty|first-child|last-child|nth-child|only-child|root)/i.test(rule.selectorText)) return true;
    return false;
}

function calculateSpecificity(selector) {
    if (!selector) return [0, 0, 0];
    
    // Remove pseudo-elements (like ::before) as they don't apply to the element itself in matches()
    // but they add to specificity. However, our use case is mostly about classes on the element.
    const cleanSelector = selector.replace(/::[a-zA-Z-]+/g, '');
    
    let a = (cleanSelector.match(/#/g) || []).length;
    let b = (cleanSelector.match(/\.[\w-]+/g) || []).length + 
            (cleanSelector.match(/\[[^\]]+\]/g) || []).length + 
            (cleanSelector.match(/:[a-zA-Z-]+\([^)]*\)/g) || []).length +
            (cleanSelector.match(/:[a-zA-Z-]+/g) || []).filter(m => !m.startsWith('::')).length;
    let c = (cleanSelector.match(/(^|[\s>~+])[a-zA-Z]+/g) || []).length;
    
    // Handle universal selector and combinators (0,0,0)
    return [a, b, c];
}

function compareSpecificity(s1, s2) {
    if (s1[0] !== s2[0]) return s1[0] - s2[0];
    if (s1[1] !== s2[1]) return s1[1] - s2[1];
    return s1[2] - s2[2];
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

async function runDeepScanResponsive() {
    if (!userSettings.breakpoints || userSettings.breakpoints.length === 0) {
        showToast('Aucun breakpoint défini', 'warning');
        return;
    }

    const initialWidth = window.outerWidth;
    showToast('Audit Responsive en cours...', 'info');
    
    // Create temporary overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:1000000;display:flex;align-items:center;justify-content:center;color:white;font-family:sans-serif;font-size:24px;';
    overlay.innerHTML = 'Audit Responsive...';
    document.body.appendChild(overlay);

    const results = [];
    const target = state.targetElement;

    for (const bp of userSettings.breakpoints) {
        overlay.innerHTML = `Audit Responsive : ${bp}px`;
        await new Promise(resolve => {
            chrome.runtime.sendMessage({ type: "DEEP_CLEAN_RESIZE_WINDOW", width: bp }, resolve);
        });
        await new Promise(r => setTimeout(r, 600)); // Wait for media queries to settle
        
        const analysis = await analyzeElementCSS(target);
        results.push(...analysis);
    }

    // Merge results: a class is "Essential" if it's essential in ANY breakpoint
    const finalMap = new Map();
    results.forEach(res => {
        const existing = finalMap.get(res.className);
        if (!existing || (res.category === 'essential' && existing.category !== 'essential')) {
            finalMap.set(res.className, res);
        } else if (res.category === 'partial' && existing.category === 'trash') {
            finalMap.set(res.className, res);
        }
    });

    // Update internal Map
    const currentClasses = state.elementClassMap.get(target) || new Set(target.classList);
    finalMap.forEach((val, key) => {
        if (val.category !== 'trash') currentClasses.add(key);
    });
    
    // Restore
    overlay.innerHTML = 'Restauration...';
    await new Promise(resolve => {
        chrome.runtime.sendMessage({ type: "DEEP_CLEAN_RESIZE_WINDOW", width: initialWidth }, resolve);
    });
    
    document.body.removeChild(overlay);
    showToast(`Audit terminé : ${userSettings.breakpoints.length} tailles testées`, 'success');
    renderApp();
}

function initMutationObserver() {
    if (state.mutationObserver) return;
    state.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.id === 'deepclean-host' || node.closest('#deepclean-host')) return;
                        node.classList.forEach(cls => {
                            state.classIndex.add(cls);
                            state.dynamicClasses.add(cls);
                        });
                        // Recurse into children
                        node.querySelectorAll('*').forEach(child => {
                            child.classList.forEach(cls => {
                                state.classIndex.add(cls);
                                state.dynamicClasses.add(cls);
                            });
                        });
                    }
                });
            } else if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const node = mutation.target;
                if (node.id === 'deepclean-host' || node.closest('#deepclean-host')) return;
                node.classList.forEach(cls => {
                    state.classIndex.add(cls);
                    state.dynamicClasses.add(cls);
                });
            }
        });
    });
    state.mutationObserver.observe(document.body, { 
        childList: true, 
        subtree: true, 
        attributes: true, 
        attributeFilter: ['class'] 
    });
}

async function identifyGhostClasses() {
    const ghosts = new Map();
    const allElements = document.querySelectorAll('*');
    if (state.classIndex.size === 0) await indexAllClasses();

    const BLACKLIST_ATTRS = ['aria-label', 'title', 'alt', 'href', 'id', 'src', 'style', 'type', 'value'];

    for (const el of allElements) {
        if (el.id === 'deepclean-host' || el.closest('#deepclean-host')) continue;
        
        const potentialClasses = new Set(el.classList);

        // Hybrid Detection: Attribute Analysis
        for (const attr of el.attributes) {
            if (BLACKLIST_ATTRS.includes(attr.name)) continue;
            
            // Match potential class patterns in attribute values (words with letters, numbers, dashes)
            const matches = attr.value.match(/[a-zA-Z0-9\/_-]{2,}/g);
            if (matches) {
                matches.forEach(m => {
                    // Basic sanity check: must start with a letter for most classes
                    if (/^[a-zA-Z]/.test(m)) potentialClasses.add(m);
                });
            }
        }

        for (const cls of potentialClasses) {
            // Tailwind Opacity Support: if cls is "text-red-500/50", check "text-red-500"
            const baseClass = cls.includes('/') ? cls.split('/')[0] : cls;

            // Filter out Tailwind variants from ghost detection to avoid noise
            if (!state.classIndex.has(baseClass) && !cls.includes(':')) {
                ghosts.set(cls, (ghosts.get(cls) || 0) + 1);
            }
        }
    }
    state.ghostClasses = Array.from(ghosts.entries()).map(([className, count]) => ({ className, count }));
}

async function performPageAudit() { 
    const a = []; 
    const allRules = await getAllCSSRules();
    const selectors = Array.from(new Set(allRules.filter(r => r.selectorText).map(r => r.selectorText))); 
    
    // Performance optimization: Batch querySelectorAll to prevent long tasks
    const batchSize = 100;
    for (let i = 0; i < selectors.length; i += batchSize) {
        const batch = selectors.slice(i, i + batchSize);
        batch.forEach(sel => {
            try { 
                const count = document.querySelectorAll(sel).length;
                if (count > 0) a.push({ selector: sel, count: count }); 
            } catch (e) {}
        });
        if (i % (batchSize * 5) === 0) await new Promise(r => setTimeout(r, 0));
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
    if (!el || !(el instanceof Element)) return '';
    const path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
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

