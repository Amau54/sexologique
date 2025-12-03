// Fichier : generate-sitemap.js

const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const fs = require('fs');
const path = require('path');

// Le dossier contenant votre site construit
const buildDir = path.resolve(__dirname, 'public');

// L'URL de votre site
const hostname = 'https://sexo-logique.com';

async function generateSitemap() {
  console.log('Génération du sitemap...');

  // Crée un flux pour le sitemap
  const stream = new SitemapStream({ hostname });

  // Lit tous les fichiers dans le dossier de build
  const files = fs.readdirSync(buildDir);

  files.forEach(file => {
    // On ne traite que les fichiers HTML
    if (path.extname(file) === '.html') {
      const pageName = path.basename(file, '.html');
      
      // L'URL de la page. 'index.html' devient la racine '/'
      const url = pageName === 'index' ? '/' : `/${pageName}`;

      // Ajoute l'URL au sitemap
      stream.write({ url: url, changefreq: 'daily', priority: 0.8 });
    }
  });

  stream.end();

  // Convertit le flux en chaîne de caractères XML
  const sitemapXml = await streamToPromise(stream).then(data => data.toString());
  
  // Ecrit le fichier sitemap.xml dans le dossier de build
  const sitemapPath = path.join(buildDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXml);
  
  console.log(`Sitemap généré avec succès à l'emplacement : ${sitemapPath}`);
}

generateSitemap();