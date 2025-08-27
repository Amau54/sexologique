const fetch = require('node-fetch');
const Parser = require('rss-parser');

exports.handler = async (event) => {
    const { podcastId, episodeIndex } = event.queryStringParameters;
    if (!podcastId || !episodeIndex) {
        return {
            statusCode: 400,
            body: 'Missing podcastId or episodeIndex.',
        };
    }

    try {
        const parser = new Parser();
        const rssFeedUrl = 'https://feed.ausha.co/Vxg5ls9jY0D4';
        const feed = await parser.parseURL(rssFeedUrl);
        
        const episode = feed.items[parseInt(episodeIndex, 10)];
        if (!episode || !episode.enclosure || !episode.enclosure.url) {
            return {
                statusCode: 404,
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
            body: `Error: ${error.message}`,
        };
    }
};