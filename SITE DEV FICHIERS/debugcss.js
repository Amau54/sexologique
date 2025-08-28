(function() {
  let elements = [];
  let currentIndex = 0;

  // Crée le conteneur flottant
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = 9999;
  container.style.display = 'flex';
  container.style.gap = '8px';
  container.style.alignItems = 'center';
  container.style.background = 'rgba(0,0,0,0.6)';
  container.style.padding = '8px 12px';
  container.style.borderRadius = '10px';
  container.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
  document.body.appendChild(container);

  // Bouton principal
  const mainBtn = document.createElement('button');
  mainBtn.textContent = '🔍 Highlight';
  mainBtn.className = 'highlight-btn';
  container.appendChild(mainBtn);

  // Boutons navigation
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '◀';
  prevBtn.className = 'nav-btn';
  prevBtn.disabled = true;
  container.appendChild(prevBtn);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = '▶';
  nextBtn.className = 'nav-btn';
  nextBtn.disabled = true;
  container.appendChild(nextBtn);

  function highlightElement(index) {
    elements.forEach((el) => {
      el.style.outline = '';
      el.style.backgroundColor = '';
    });
    const el = elements[index];
    el.style.outline = '3px solid red';
    el.style.backgroundColor = 'rgba(255,0,0,0.1)';
    if (el.tabIndex === -1) el.tabIndex = 0;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.focus();
  }

  // Récupère le dernier sélecteur depuis localStorage
  function getLastSelector() {
    return localStorage.getItem('lastHighlightSelector') || '';
  }

  // Sauvegarde le sélecteur
  function saveSelector(selector) {
    localStorage.setItem('lastHighlightSelector', selector);
  }

  mainBtn.addEventListener('click', () => {
    const lastSelector = getLastSelector();
    const selector = prompt('Entrez le sélecteur CSS à tester:', lastSelector || '.hero-bg h1');
    if (!selector) return;
    saveSelector(selector);

    elements = Array.from(document.querySelectorAll(selector));
    if (elements.length === 0) {
      alert(`Aucun élément trouvé pour "${selector}"`);
      return;
    }
    currentIndex = 0;
    highlightElement(currentIndex);
    prevBtn.disabled = false;
    nextBtn.disabled = false;
    console.log(`${elements.length} élément(s) trouvé(s) pour "${selector}"`);
  });

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      highlightElement(currentIndex);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < elements.length - 1) {
      currentIndex++;
      highlightElement(currentIndex);
    }
  });
})();
