// Définition des en-têtes CORS
const CORS_HEADERS = {
  // Une meilleure pratique de sécurité est d'autoriser uniquement votre domaine
  'Access-Control-Allow-Origin': 'https://sexo-logique.com',
  'Cache-Control': 'public, max-age=3600, s-maxage=43200',
  // Vous pouvez utiliser '*' pour le développement, mais ce n'est pas recommandé en production
  // 'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Origin, Accept, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// netlify/functions/get-episode-audio.js
const fetch = require('node-fetch');
const Parser = require('rss-parser');

exports.handler = async (event) => {
  // Gère la requête de pré-vérification (preflight request)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  const { podcastId, episodeIndex } = event.queryStringParameters;
  if (!podcastId ||!episodeIndex) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS, // Ajout des en-têtes CORS pour permettre au navigateur de lire l'erreur
      body: 'Missing podcastId or episodeIndex.',
    };
  }

  try {
    const parser = new Parser();
    const rssFeedUrl = 'https://feed.ausha.co/Vxg5ls9jY0D4';
    const feed = await parser.parseURL(rssFeedUrl);
    
    const episode = feed.items[parseInt(episodeIndex, 10)];
    if (!episode ||!episode.enclosure ||!episode.enclosure.url) {
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: 'Episode not found or no download URL available.',
      };
    }

    const audioUrl = episode.enclosure.url;

    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buffer = await response.buffer();
    const filename = `${episode.title.replace(/[^\w\s]/gi, '').trim().replace(/ /g, '_')}.mp3`;

    return {
      statusCode: 200,
      headers: {
       ...CORS_HEADERS, // Utilise les en-têtes définis plus haut
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS, // Inclut les en-têtes CORS pour que le navigateur puisse lire l'erreur
      body: `Error: ${error.message}`,
    };
  }
};