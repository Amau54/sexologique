// netlify/functions/get-episodes.js
const { default: fetch } = require("node-fetch");
const { XMLParser } = require("fast-xml-parser");

// Définition d'une constante pour les en-têtes CORS
const CORS_HEADERS = {
  // Une meilleure pratique de sécurité est d'autoriser uniquement votre domaine
  'Access-Control-Allow-Origin': 'https://sexo-logique.com',
  
  
  // Vous pouvez utiliser '*' pour le développement, mais ce n'est pas recommandé en production
  // 'Access-Control-Allow-Origin': '*', 
  'Cache-Control': 'public, max-age=3600, s-maxage=43200',
  'Access-Control-Allow-Headers': 'Content-Type, Origin, Accept, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

exports.handler = async (event) => {
  // Les navigateurs envoient une requête de pré-vérification OPTIONS avant les requêtes complexes.
  // La fonction doit y répondre avec les en-têtes CORS nécessaires pour autoriser la requête suivante.
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  // Si la requête n'est pas une requête OPTIONS, on exécute la logique de la fonction.
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

    // Les en-têtes CORS doivent également être présents dans la réponse finale, même en cas de succès.
    return {
      statusCode: 200,
      headers: {
       ...CORS_HEADERS, // Utilise les en-têtes définis plus haut
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=0, s-maxage=43200',
      },
      body: JSON.stringify(episodes),
    };
  } catch (error) {
    console.error('Erreur de la fonction:', error);
    return {
      statusCode: 500,
      headers: {
       ...CORS_HEADERS, // Inclut les en-têtes CORS pour que le navigateur puisse lire l'erreur
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Erreur interne du serveur', details: error.message }),
    };
  }
};