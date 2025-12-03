// generate-page.js
const { default: fetch } = require("node-fetch");
const { XMLParser } = require("fast-xml-parser");
const fs = require('fs');

const rssUrl = "https://feed.ausha.co/Vxg5ls9jY0D4";
const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
});

const generatePodcastsPage = async () => {
    try {
        console.log('Fetching RSS feed...');
        const response = await fetch(rssUrl);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const xmlText = await response.text();
        const result = parser.parse(xmlText);
        const episodes = result.rss.channel.item;

        // Génération du contenu HTML des épisodes
        let podcastsHtml = '';
        episodes.forEach((item) => {
            const date = new Date(item.pubDate).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const audioUrl = item.enclosure["@_url"];
            
            podcastsHtml += `
                <div class="episode-item">
                    <h2>${item.title}</h2>
                    <p class="episode-date">${date}</p>
                    <p>${item['itunes:summary'] || item.description || ''}</p>
                    <audio controls src="${audioUrl}"></audio>
                </div>
            `;
        });
        
        // Lire le template HTML existant
        let htmlTemplate = fs.readFileSync('./src/template.html', 'utf8');

        // Remplacer le marqueur par le contenu généré
        const finalHtml = htmlTemplate.replace('', podcastsHtml);
        
        // Sauvegarder la page finale
        fs.writeFileSync('./dist/podcasts.html', finalHtml);

        console.log('Page de podcasts générée avec succès !');
        
    } catch (error) {
        console.error('Erreur lors de la génération de la page:', error);
        process.exit(1); // Arrêter le processus en cas d'erreur
    }
};

generatePodcastsPage();