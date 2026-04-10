# ✨ CSS DeepClean V8.0 - Strict Edition

DeepClean est une extension de navigateur professionnelle conçue pour l'audit, le nettoyage et l'édition en temps réel du CSS d'une page web. Elle permet d'identifier les classes inutilisées, de gérer les utilitaires Tailwind complexes et d'exporter un code HTML "propre".

---

## 🛠 Fonctionnalités Principales

### 1. Inspection & Interaction (Le "Studio")
*   **Déclenchement Magique** : Utilisez `Alt + Clic Droit` sur n'importe quel élément de la page pour lancer l'éditeur instantanément. Le menu contextuel natif est supprimé pour une expérience fluide.
*   **Shadow DOM Isolation** : L'interface de l'extension est encapsulée dans un Shadow DOM. Elle ne modifie jamais les styles de votre site et n'est pas affectée par eux.
*   **Panneau Redimensionnable** : Le panneau peut être déplacé par son en-tête et redimensionné via la poignée dans le coin inférieur droit (optimisé avec `requestAnimationFrame`).

### 2. Algorithme d'Audit de Haute Précision
DeepClean ne se contente pas de vérifier si une classe est présente, il simule son retrait pour analyser l'impact réel sur le rendu.
*   **Winning Rule Engine** : Détermine quelle règle CSS "gagne" pour chaque propriété en calculant la spécificité W3C (A, B, C) et en respectant l'ordre des sources ainsi que les déclarations `!important`.
*   **Protection Responsive & Interactive** : 
    *   **Interactive (👆)** : Les classes gérant les états `:hover`, `:focus`, `:active`, etc., sont protégées et jamais marquées comme inutiles.
    *   **Durable (📱)** : Les classes actives uniquement via des `@media queries` (ex: mobile) sont conservées même si vous êtes sur écran large.

### 3. Ultimate Injection Engine (Tailwind JIT Support)
Un moteur de génération CSS capable de décoder 99% des classes Tailwind, même les plus complexes.
*   **Préfixes Imbriqués** : Supporte les combinaisons comme `md:hover:bg-red-500`. Génère automatiquement la `@media query` et le pseudo-sélecteur.
*   **Valeurs Arbitraires** : Décode la syntaxe JIT : `w-[350px]`, `top-[calc(100%-20px)]`, `bg-[#123456]`.
*   **Modificateurs Avancés** : Gère l'opacité via le slash (`text-red-500/50`), les valeurs négatives (`-mt-4`) et l'importance (`!block`).
*   **Smart Guess** : Si une classe inconnue ressemble à `propriété-valeur`, le moteur vérifie si elle est valide et propose une injection automatique.

### 4. Scanner de Classes & Audit Global
*   **Audit CSS** : Liste tous les sélecteurs CSS utilisés sur la page et permet de naviguer entre les occurrences.
*   **Ghost Class Scanner** : Identifie les classes présentes dans le HTML (classList + attributs data/JS) qui ne sont définies dans aucune feuille de style.
    *   **Hybrid Detection** : Combine l'analyse DOM et Regex avec un filtre anti-bruit (ignore `aria-label`, `title`, etc.).
    *   **Focus Cyclique** : Visualisez chaque occurrence d'une classe fantôme avec un effet de pulsation néon ultra-visible.

### 5. Navigation "Microscopique"
*   **TreeWalker traversal** : Les boutons "Suivant" et "Précédent" utilisent un parcours en profondeur (Depth-First Search) pour naviguer linéairement dans le flux naturel du document.
*   **Smart Scroll** : Centre automatiquement l'élément sélectionné dans la vue sans sauts brusques.

### 6. Support SPA & Dynamic Content
*   **MutationObserver** : L'extension surveille les changements du DOM en temps réel. Si un élément est ajouté via React, Vue ou JS pur, ses classes sont immédiatement indexées et protégées.

### 7. Deep Scan Responsive
*   **Audit Automatisé** : Un bouton discret dans le footer permet de lancer un audit sur tous vos breakpoints (configurables dans les réglages). 
*   **Pont Background** : L'extension redimensionne physiquement la fenêtre du navigateur pour valider l'utilité des classes sur chaque taille d'écran.

### 8. Exportation Pro
*   **Clean Export** : Clone le document entier, supprime l'interface de l'extension, et purge toutes les classes identifiées comme "Trash".
*   **Batch Processing** : L'analyse pour l'export se fait par lots asynchrones pour ne jamais figer l'onglet, même sur des pages géantes.

---

## ⌨️ Raccourcis Clavier (Configurables)
*   **Flèche Haut** : Sélectionner le Parent
*   **Flèche Bas** : Sélectionner le Premier Enfant
*   **Flèche Gauche** : Élément Précédent (Flux DOM)
*   **Flèche Droite** : Élément Suivant (Flux DOM)

---

## 🎨 Système de Couleurs (Statuts)
*   🟢 **Essential** : La classe a un impact visuel direct et unique.
*   🔵 **Interactive** : Protégée car elle gère un état (hover, focus).
*   🟡 **Partial** : Impacte des propriétés mais est partiellement écrasée ou responsive.
*   🟣 **Ghost** : Inconnue du CSS mais présente dans le code.
*   🔴 **Trash** : N'a aucun impact visuel (totalement écrasée).

---

## 🔒 Confidentialité & Sécurité
*   **Local Only** : Tous les calculs sont faits localement dans votre navigateur.
*   **Clean Outlines** : L'extension restaure parfaitement l'état initial des éléments (outlines) après fermeture.
