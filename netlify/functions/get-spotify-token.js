// Fichier : netlify/functions/get-spotify-token.js

const fetch = require('node-fetch'); // Netlify fournit node-fetch par défaut

exports.handler = async (event, context) => {
    // Les variables d'environnement sont accessibles via process.env
    // Assurez-vous de les configurer dans le tableau de bord de Netlify
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error('Missing Spotify API credentials.');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Missing Spotify API credentials.' }),
        };
    }

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            console.error(`Spotify authentication error: ${response.status}`);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: 'Failed to authenticate with Spotify.' }),
            };
        }

        const data = await response.json();
        const accessToken = data.access_token;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                // Permet à votre site de faire des requêtes vers cette fonction
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ access_token: accessToken }),
        };

    } catch (error) {
        console.error('Error fetching Spotify token:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch access token' }),
        };
    }
};
