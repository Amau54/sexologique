// content.js: V3 - Final, Complete, and Fully Functional Implementation. No compromises.

'use strict';

// --- State Management ---
const state = { 
    activeTab: 'editor', 
    targetElement: null, 
    classIndex: new Set(), 
    auditResults: null, 
    shadowRoot: null,
    history: [],
    undoStack: [],
    redoStack: [],
    scanCycleIndices: {}
};

// --- Default Settings & Config ---
const DEFAULT_SETTINGS = { 
    keybindings: { 
        nextElement: 'ArrowDown', 
        prevElement: 'ArrowUp', 
        parentElement: 'ArrowLeft', 
        firstChildElement: 'ArrowRight' 
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
};

// --- Initialization ---
document.addEventListener("contextmenu", e => { 
    state.targetElement = e.target; 
}, true);

document.addEventListener("mousedown", e => {
    if (e.button === 2 && e.altKey) {
        e.preventDefault();
        state.targetElement = e.target;
        startDeepClean(state.targetElement);
    }
}, true);

chrome.runtime.onMessage.addListener(req => {
    if (req.type === "DEEP_CLEAN_INIT" && state.targetElement) startDeepClean(state.targetElement);
});

// --- Core Application Logic ---
async function startDeepClean(targetElement) {
    state.targetElement = targetElement;
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
        <div id="deepclean-overlay">
            <div id="deepclean-panel">
                <div class="deepclean-header">
                    <div class="deepclean-header-info"><h1>Analyzing...</h1></div>
                </div>
            </div>
        </div>`;
    
    await renderApp();
}

async function renderApp() {
    if (!state.shadowRoot) return;
    const panel = state.shadowRoot.getElementById('deepclean-panel');
    const analysisResults = await analyzeElementCSS(state.targetElement);
    renderFullUI(panel, state.targetElement, analysisResults, state.auditResults);
    addPanelEventListeners(analysisResults);
    state.shadowRoot.querySelector(`.deepclean-tab[data-tab="${state.activeTab}"]`).classList.add('active');
    state.shadowRoot.querySelector(`.deepclean-pane[data-pane="${state.activeTab}"]`).classList.add('active');
    updateUndoRedoButtons();
}

// --- UI Rendering ---
function renderFullUI(panel, element, editorData, scannerData) {
    const tagName = element.tagName.toLowerCase(), id = element.id ? `#${element.id}` : '';
    const cssPath = generateCSSSelector(element);
    panel.innerHTML = `
        <div class="deepclean-header">
            <div class="deepclean-header-info">
                <h1>DeepClean V4</h1>
                <p class="deepclean-header-path" title="${cssPath}">${cssPath}</p>
            </div>
            <button class="deepclean-close-btn">${ICONS.close}</button>
        </div>
        <div class="deepclean-tabs">
            <button class="deepclean-tab" data-tab="editor">Éditeur</button>
            <button class="deepclean-tab" data-tab="scanner">Scanner</button>
            <button class="deepclean-tab" data-tab="settings">Réglages</button>
        </div>
        <div class="deepclean-pane" data-pane="editor">
            <div class="editor-nav">
                <button id="nav-prev" title="Élément précédent (↑)">${ICONS.up} Précédent</button>
                <button id="nav-next" title="Élément suivant (↓)">${ICONS.down} Suivant</button>
                <button id="nav-parent" title="Parent (←)">${ICONS.prev} Parent</button>
                <button id="nav-child" title="Premier enfant (→)">Enfant ${ICONS.next}</button>
            </div>
            <div class="editor-controls">
                <input type="text" id="add-class-input" placeholder="Ajouter une classe...">
                <div id="autocomplete-list" style="display:none;"></div>
            </div>
            <ul class="deepclean-list">
                ${editorData.length > 0 ? editorData.map(renderClassCard).join('') : '<p class="micro-copy" style="padding:20px; text-align:center;">Aucune classe à analyser.</p>'}
            </ul>
            <div class="deepclean-footer">
                <div class="deepclean-footer-actions">
                    <button id="deepclean-clean-btn">✨ Nettoyer Élément</button>
                    <button id="global-export-btn">🌍 Exporter Page</button>
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
                <button id="undo-btn" disabled>Annuler</button>
                <button id="redo-btn" disabled>Rétablir</button>
            </div>
            <ul class="scanner-list">
                ${scannerData.map(renderScannerRule).join('')}
            </ul>
        </div>
        <div class="deepclean-pane settings-pane" data-pane="settings">
            ${renderSettings()}
        </div>`;
}
function renderClassCard(cls) {
    const indicatorColor = cls.category === 'essential' ? 'success' : cls.category === 'partial' ? 'warning' : 'danger';
    const isClickable = cls.category !== 'essential';
    return `<li class="deepclean-class-card" data-class-name="${cls.className}"><div class="class-card-main ${isClickable ? 'clickable' : ''}"><span style="color:var(--color-${indicatorColor}); font-size: 18px;">●</span><span class="class-name">${cls.className}</span>${isClickable ? ICONS.chevron : ''}<label class="switch"><input type="checkbox" data-class-toggle="${cls.className}" ${cls.category !== 'trash' ? 'checked' : ''}><span class="slider"></span></label></div></li>`;
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
function renderAccordion(properties) {
    const { kept, lost } = properties;
    let content = '<div class="deepclean-details">';
    if (kept.length > 0) content += `<h3>Propriétés Actives</h3><ul>${kept.map(p => `<li>${p}</li>`).join('')}</ul>`;
    if (lost.length > 0) content += `<h3>Propriétés Écrasées</h3><ul class="lost-props">${lost.map(p => `<li>${p}</li>`).join('')}</ul>`;
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
    sr.querySelector('.deepclean-close-btn').addEventListener('click', () => { 
        sr.host.remove(); 
        document.removeEventListener('keydown', handleKeyboardNavigation); 
    });
    
    // Overlay click to close
    sr.getElementById('deepclean-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'deepclean-overlay') {
            sr.host.remove();
            document.removeEventListener('keydown', handleKeyboardNavigation);
        }
    });

    sr.querySelectorAll('.deepclean-tab').forEach(t => t.addEventListener('click', () => { 
        state.activeTab = t.dataset.tab; 
        renderApp(); 
    }));
    
    sr.querySelectorAll('[data-class-toggle]').forEach(t => t.addEventListener('change', e => {
        const className = e.target.dataset.classToggle;
        const isChecked = e.target.checked;
        const action = { 
            action: isChecked ? 'add-class' : 'remove-class', 
            element: state.targetElement, 
            className: className 
        };
        state.targetElement.classList.toggle(className, isChecked);
        recordHistory(action);
    }));

    sr.getElementById('deepclean-clean-btn').addEventListener('click', () => {
        const tempEl = state.targetElement.cloneNode(true);
        sr.querySelectorAll('input[data-class-toggle]:not(:checked)').forEach(t => tempEl.classList.remove(t.dataset.classToggle));
        sr.getElementById('deepclean-code-output').textContent = tempEl.outerHTML;
        sr.getElementById('deepclean-result').style.display = 'block';
    });

    sr.getElementById('global-export-btn').addEventListener('click', () => {
        const clonedDoc = document.documentElement.cloneNode(true);
        applyAllModifications(clonedDoc);
        sr.getElementById('deepclean-code-output').textContent = clonedDoc.outerHTML;
        sr.getElementById('deepclean-result').style.display = 'block';
    });

    sr.getElementById('deepclean-copy-btn').addEventListener('click', e => {
        navigator.clipboard.writeText(sr.getElementById('deepclean-code-output').textContent).then(() => { 
            e.target.textContent = 'Copié!'; 
            setTimeout(() => e.target.textContent = 'COPIER', 1500); 
        });
    });
    
    const addClassInput = sr.getElementById('add-class-input');
    const autocompleteList = sr.getElementById('autocomplete-list');
    addClassInput.addEventListener('input', () => {
        const value = addClassInput.value.toLowerCase();
        if (!value) { autocompleteList.style.display = 'none'; return; }
        const suggestions = Array.from(state.classIndex).filter(c => c.toLowerCase().includes(value));
        autocompleteList.innerHTML = suggestions.slice(0, 5).map(s => `<div class="autocomplete-item">${s}</div>`).join('');
        autocompleteList.style.display = 'block';
    });
    addClassInput.addEventListener('keydown', e => { 
        if (e.key === 'Enter' && addClassInput.value) { 
            const className = addClassInput.value;
            recordHistory({action:'add-class', element: state.targetElement, className: className }); 
            state.targetElement.classList.add(className); 
            renderApp(); 
        }
    });
    autocompleteList.addEventListener('click', e => { 
        if (e.target.classList.contains('autocomplete-item')) { 
            const className = e.target.textContent;
            recordHistory({action:'add-class', element: state.targetElement, className: className }); 
            state.targetElement.classList.add(className); 
            renderApp(); 
        }
    });
    
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
            card.insertAdjacentHTML('beforeend', renderAccordion(result.properties));
            details = card.querySelector('.deepclean-details');
            setTimeout(() => {
                details.classList.add('expanded');
                card.querySelector('.class-name-icon').classList.add('expanded');
            }, 10);
        }
    }));
    
    sr.querySelectorAll('[data-scan-view]').forEach(btn => btn.addEventListener('click', e => {
        const selector = e.target.dataset.scanView;
        const elements = Array.from(document.querySelectorAll(selector));
        if (elements.length === 0) return;
        let currentIndex = state.scanCycleIndices[selector] === undefined ? -1 : state.scanCycleIndices[selector];
        currentIndex = (currentIndex + 1) % elements.length;
        state.scanCycleIndices[selector] = currentIndex;
        const target = elements[currentIndex];
        target.scrollIntoView({behavior:'smooth', block:'center'});
        const originalOutline = target.style.outline; 
        target.style.outline = '2px solid #e06c75'; 
        setTimeout(() => { target.style.outline = originalOutline; }, 2500);
        renderApp();
    }));

    sr.querySelectorAll('[data-scan-delete]').forEach(btn => btn.addEventListener('click', e => {
        const selector = e.target.dataset.scanDelete;
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return;
        const record = { 
            action: 'delete-selector', 
            selector, 
            elements: Array.from(elements), 
            parentNodes: Array.from(elements).map(el => el.parentNode), 
            nextSiblings: Array.from(elements).map(el => el.nextSibling) 
        };
        recordHistory(record); 
        state.undoStack.push(record); 
        state.redoStack = [];
        elements.forEach(el => el.remove());
        performPageAudit().then(renderApp);
    }));
    
    sr.getElementById('undo-btn').addEventListener('click', handleUndo);
    sr.getElementById('redo-btn').addEventListener('click', handleRedo);

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
        const btn = sr.getElementById('save-settings-btn'); 
        btn.textContent = 'Enregistré !'; 
        setTimeout(() => { btn.textContent = 'Enregistrer'; }, 1500);
    });

    // Nav buttons
    sr.getElementById('nav-prev').addEventListener('click', () => navigateElement('prevElement'));
    sr.getElementById('nav-next').addEventListener('click', () => navigateElement('nextElement'));
    sr.getElementById('nav-parent').addEventListener('click', () => navigateElement('parentElement'));
    sr.getElementById('nav-child').addEventListener('click', () => navigateElement('firstChildElement'));

    // Prevent duplicate listeners
    document.removeEventListener('keydown', handleKeyboardNavigation);
    document.addEventListener('keydown', handleKeyboardNavigation);
}

function navigateElement(action) {
    let nextTarget = null;
    switch (action) {
        case 'nextElement': nextTarget = state.targetElement.nextElementSibling; break;
        case 'prevElement': nextTarget = state.targetElement.previousElementSibling; break;
        case 'parentElement': nextTarget = state.targetElement.parentElement; break;
        case 'firstChildElement': nextTarget = state.targetElement.firstElementChild; break;
    }
    if (nextTarget && nextTarget.nodeName !== 'BODY' && nextTarget.nodeName !== 'HTML') {
        startDeepClean(nextTarget);
        nextTarget.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
}

function handleKeyboardNavigation(e) {
    if (!state.shadowRoot || state.shadowRoot.activeElement instanceof HTMLInputElement) return;
    const keyAction = Object.entries(userSettings.keybindings).find(([,value]) => value === e.key);
    if (!keyAction) return;
    e.preventDefault();
    navigateElement(keyAction[0]);
}

function handleUndo() {
    const lastAction = state.undoStack.pop();
    if (!lastAction) return;
    if (lastAction.action === 'delete-selector') {
        lastAction.elements.forEach((el, index) => {
            lastAction.parentNodes[index].insertBefore(el, lastAction.nextSiblings[index]);
        });
    }
    state.redoStack.push(lastAction);
    performPageAudit().then(renderApp);
}

function handleRedo() {
    const nextAction = state.redoStack.pop();
    if (!nextAction) return;
    if (nextAction.action === 'delete-selector') {
        nextAction.elements.forEach(el => el.remove());
    }
    state.undoStack.push(nextAction);
    performPageAudit().then(renderApp);
}

function updateUndoRedoButtons() {
    const undoBtn = state.shadowRoot.getElementById('undo-btn');
    const redoBtn = state.shadowRoot.getElementById('redo-btn');
    if (undoBtn) undoBtn.disabled = state.undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = state.redoStack.length === 0;
}

function recordHistory(record) { 
    state.history.push(record); 
}

// --- Analysis, Audit, Settings, Selector Logic ---
async function analyzeElementCSS(element) {
    const classList = Array.from(element.classList), allRules = await getAllCSSRules(), results = [];
    const originalComputedStyle = window.getComputedStyle(element);
    
    for (const className of classList) {
        const declaredProps = getDeclaredPropsForClass(allRules, className, element);
        if (Object.keys(declaredProps).length === 0) continue;
        
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
        if (keptProps.length === 0) category = 'trash'; 
        else if (lostProps.length === 0) category = 'essential';
        
        results.push({ className, category, properties: { kept: keptProps, lost: lostProps } });
    }
    return results.sort((a,b) => ({essential:0,partial:1,trash:2}[a.category] - {essential:0,partial:1,trash:2}[b.category]));
}

async function getAllCSSRules() { 
    const r = []; 
    for (const s of Array.from(document.styleSheets)) { 
        try { 
            Array.from(s.cssRules || []).forEach(ru => r.push(ru)); 
        } catch (e) {} 
    } 
    return r; 
}

function getDeclaredPropsForClass(allRules, className, element) {
    const p = {};
    // Escape for use in .includes and .matches
    const escapedClassName = CSS.escape(className);
    const twEscapedClassName = className.replace(/:/g, '\\:');
    
    for (const r of allRules) {
        if (!r.selectorText) continue;
        
        // Check if class is in selector
        const hasClass = r.selectorText.includes(`.${escapedClassName}`) || 
                         r.selectorText.includes(`.${twEscapedClassName}`);
        
        if (hasClass) {
            try {
                // If the rule is inside a media query, check if it matches
                if (r.parentRule && r.parentRule.type === CSSRule.MEDIA_RULE) {
                    if (!window.matchMedia(r.parentRule.media.mediaText).matches) {
                        // Media query doesn't match, but we might still want to show the props
                        // if the class is explicitly about this media query (e.g. md:...)
                        if (!className.includes(':')) continue; 
                    }
                }

                if (element.matches(r.selectorText)) {
                    for (const prop of r.style) {
                        p[prop] = r.style.getPropertyValue(prop);
                    }
                } else {
                    // Handle pseudo-classes (hover:, focus:, etc.)
                    // Extract parts before pseudo-classes
                    const parts = r.selectorText.split(/[:\s+>~]/);
                    const baseSelector = parts[0] || '*';
                    
                    if (element.matches(baseSelector) || r.selectorText.includes(`.${escapedClassName}`)) {
                         // Even if it doesn't match perfectly (e.g. not hovered), 
                         // if the class name is in the selector and the element matches the base,
                         // we consider these properties as part of the class definition.
                         for (const prop of r.style) {
                             if (!p[prop]) p[prop] = r.style.getPropertyValue(prop);
                         }
                    }
                }
            } catch (e) {}
        }
    }
    return p;
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

function applyAllModifications(rootEl) {
    const historyBySelector = {};
    state.history.forEach(mod => {
        if (!mod.element) return;
        const selector = generateCSSSelector(mod.element);
        if (!historyBySelector[selector]) historyBySelector[selector] = { add: new Set(), remove: new Set() };
        if (mod.action === 'remove-class') { 
            historyBySelector[selector].remove.add(mod.className); 
            historyBySelector[selector].add.delete(mod.className); 
        }
        if (mod.action === 'add-class') { 
            historyBySelector[selector].add.add(mod.className); 
            historyBySelector[selector].remove.delete(mod.className); 
        }
    });
    for (const selector in historyBySelector) {
        try {
            const element = rootEl.querySelector(selector);
            if (element) {
                historyBySelector[selector].add.forEach(c => element.classList.add(c));
                historyBySelector[selector].remove.forEach(c => element.classList.remove(c));
            }
        } catch(e) {}
    }
    state.undoStack.forEach(mod => {
        if(mod.action === 'delete-selector') {
            try { 
                rootEl.querySelectorAll(mod.selector).forEach(el => el.remove()); 
            } catch(e) {}
        }
    });
}
