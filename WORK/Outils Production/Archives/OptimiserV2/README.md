# Pipeline d'Optimisation Automatisé pour Site Statique

Ce projet est un pipeline de build "one-click" ultra-performant conçu pour transformer un site web statique multi-pages (HTML, CSS, JS) en une version optimisée pour la production, visant un score Lighthouse de 100.

Il est construit avec **Vite** et est compatible avec les runtimes **Node.js** et **Bun**.

---

## Fonctionnalités

- **Build "One-Click"** : Une seule commande pour nettoyer, optimiser et préparer tout le site pour la production.
- **Architecture Multi-Pages Automatique** : Tous les fichiers `.html` placés dans le dossier `src` sont automatiquement détectés et traités, sans aucune configuration manuelle.
- **Optimisations de Performance** :
  - **JavaScript** : Minification ultra-rapide et suppression du code mort (tree-shaking) avec `esbuild`.
  - **CSS** : Minification, ajout des préfixes vendeurs et gestion des imports avec `Lightning CSS`.
  - **CSS Inutilisé** : Suppression automatique des règles CSS non utilisées grâce à `PurgeCSS`.
  - **Images** : Compression agressive et conversion en formats modernes (WebP) pour un chargement plus rapide.
- **Qualité du Code** :
  - **ESLint** pour le JavaScript et **Stylelint** pour le CSS garantissent un code propre, cohérent et sans erreur.
  - Correction automatique des problèmes de style.
- **Analyse du Build** : Un rapport visuel (`stats.html`) est généré pour analyser la taille des différents fichiers de votre site.
- **Gestion du Cache** : Les noms des fichiers CSS et JS sont automatiquement renommés avec un "hash" pour garantir que les utilisateurs reçoivent toujours la version la plus récente.

---

## Prérequis

Assurez-vous d'avoir l'un des deux environnements suivants installé sur votre machine :
- **Node.js** (version 18 ou supérieure)
- **Bun** (version 1.0 ou supérieure)

---

## Installation

1.  Clonez ce projet sur votre machine.
2.  Ouvrez un terminal à la racine du projet.
3.  Installez les dépendances nécessaires avec la commande de votre choix :

    **Avec npm (Node.js) :**
    ```bash
    npm install
    ```

    **Avec Bun :**
    ```bash
    bun install
    ```

---

## Commandes Disponibles

### Construire le site pour la production

Cette commande lance l'ensemble du pipeline d'optimisation. Les fichiers finaux seront générés dans le dossier `/production-build`.

**Avec npm :**
```bash
npm run build
```

**Avec Bun :**
```bash
bun run build
```

### Analyser et Corriger la Qualité du Code

Cette commande vérifie tous les fichiers `.js`, `.html` et `.css` pour des erreurs de syntaxe ou de style, et les corrige automatiquement.

**Avec npm :**
```bash
npm run lint
```

**Avec Bun :**
```bash
bun run lint
```

---

## Structure des Dossiers

- **/src** : C'est ici que vous devez placer **tous vos fichiers sources** (HTML, CSS, JavaScript, images, etc.). Le pipeline est conçu pour fonctionner exclusivement avec ce dossier.
- **/production-build** : Contient la version optimisée et prête à être déployée de votre site. **Ne modifiez jamais ce dossier manuellement**, car il est entièrement regénéré à chaque `build`.
- **/stats.html** : Le rapport d'analyse de la taille de votre site. Il est généré à la racine du projet après chaque `build`.

---

Ce projet est conçu pour être aussi simple et automatisé que possible. Ajoutez simplement vos fichiers dans `src` et laissez le pipeline s'occuper du reste !
