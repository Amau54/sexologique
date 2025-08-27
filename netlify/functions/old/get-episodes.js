// netlify/functions/get-episodes.js
const { default: fetch } = require("node-fetch");
const { XMLParser } = require("fast-xml-parser");

exports.handler = async (event) => {
  // Utilisez l'URL du flux RSS d'Ausha
  const rssUrl = "https://feed.ausha.co/Vxg5ls9jY0D4";

  try {
    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const result = parser.parse(xmlText);
    const episodes = result.rss.channel.item.map((item) => {
      return {
        id: item.guid["#text"],
        title: item.title,
        date: new Date(item.pubDate).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        audio_url: item.enclosure["@_url"],
      };
    });

  return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Autorise l'accès depuis n'importe quelle origine
        'Cache-Control': 'public, max-age=0, s-maxage=43200', // Cache de 12h
      },
      body: JSON.stringify(episodes),
    };
  } catch (error) {
    console.error('Erreur de la fonction:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Important pour voir l'erreur dans le client
      },
      body: JSON.stringify({ error: 'Erreur interne du serveur', details: error.message }),
    };
  }
};