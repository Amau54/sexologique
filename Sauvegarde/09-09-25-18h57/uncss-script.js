const uncss = require('uncss');
const fs = require('fs');

const htmlFile = 'src/sexeploration.html';
const cssFile = 'src/style.css';
const outputFile = 'dist/style.css';

const options = {
    // Corrige le chemin vers le fichier CSS pour ne pas le dupliquer.
    stylesheets: [cssFile],
    
    // Simule l'API IntersectionObserver pour éviter le crash du script.
    inject: function(window) {
        // La plupart des méthodes peuvent être des fonctions vides car nous n'avons pas besoin de leur fonctionnalité réelle
        window.IntersectionObserver = class IntersectionObserver {
            constructor(callback, options) {}
            disconnect() {}
            observe() {}
            unobserve() {}
        };
    },

    // Optionnel : si le problème persiste avec des chemins absolus
    // vous pouvez essayer de le rendre relatif au répertoire public.
    // htmlroot: 'public',
};

// Lire le contenu de votre fichier HTML
const htmlContent = fs.readFileSync(htmlFile, 'utf8');

uncss([htmlContent], options, (error, output) => {
    if (error) {
        console.error("Erreur lors de l'exécution d'UnCSS :", error);
        return;
    }
    
    // Sauvegarde le code CSS optimisé dans un nouveau fichier
    fs.writeFileSync(outputFile, output, 'utf8');
    
    console.log(`UnCSS a terminé avec succès. Le code optimisé a été enregistré dans : ${outputFile}`);
});