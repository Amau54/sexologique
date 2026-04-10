// Fichier : generate-sitemap.js

const { SitemapStream, streamToPromise } = require('sitemap');
const fs = require('fs');
const path = require('path');

// Le dossier contenant votre site construit
const buildDir = path.resolve(__dirname, 'public');

// L'URL de ton site
const hostname = 'https://sexo-logique.com';

async function generateSitemap() {
  console.log('Génération du sitemap...');

  const stream = new SitemapStream({ hostname });

  /**
   * Ajoute récursivement les fichiers HTML au sitemap
   */
  function addHtmlFiles(dir, baseUrl = '') {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Descend dans les sous-dossiers (ex: /articles/)
        addHtmlFiles(fullPath, `${baseUrl}/${file}`);
      } else if (path.extname(file) === '.html') {
        const pageName = path.basename(file, '.html');

        // ❌ Exclure la page 404
        if (pageName === '404') return;

        // Construit l’URL
        let url;
        if (pageName === 'index') {
          url = baseUrl === '' ? '/' : baseUrl + '/';
        } else {
          url = `${baseUrl}/${pageName}`;
        }

        // Définir la priorité
        let priority = 0.5;
        if (url === '/') priority = 1.0;
        else if (url === '/sexeploration') priority = 0.9;
        else if (url.startsWith('/articles')) priority = 0.8;

        // Ajoute au sitemap
        stream.write({
          url,
          changefreq: 'daily',
          priority
        });
      }
    });
  }

  addHtmlFiles(buildDir);

  stream.end();

  // Récupère le sitemap généré
  const sitemapXml = await streamToPromise(stream).then(data => data.toString());

  // ➕ Beautify XML (ajoute des sauts de ligne & indentation)
  const beautifyXml = sitemapXml
    .replace(/></g, '>\n<') // saute une ligne entre les balises
    .replace(/ {2,}/g, '  '); // simplifie les espaces multiples

  const sitemapPath = path.join(buildDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, beautifyXml, 'utf8');

  console.log(`✅ Sitemap généré avec succès à l'emplacement : ${sitemapPath}`);
}

generateSitemap();
