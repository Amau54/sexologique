export default async (request) => {
  try {
    const url = new URL(request.url);
    const episodeIndex = url.searchParams.get("episodeIndex");

    if (episodeIndex === null) {
      return new Response("Le paramètre 'episodeIndex' est manquant.", { status: 400 });
    }

    // 1. Récupère le flux RSS sous forme de texte brut
    const rssFeedUrl = "https://feed.ausha.co/Vxg5ls9jY0D4";
    const rssResponse = await fetch(rssFeedUrl);
    if (!rssResponse.ok) {
        return new Response("Impossible de récupérer le flux RSS.", { status: 502 });
    }
    const rssText = await rssResponse.text();

    // 2. Analyse manuelle du texte pour trouver l'épisode
    const items = rssText.split('<item>');
    // L'index 0 est l'en-tête du flux, donc on l'ignore (+1)
    const episodeBlock = items[parseInt(episodeIndex, 10) + 1];

    if (!episodeBlock) {
      return new Response("Épisode non trouvé dans le flux.", { status: 404 });
    }

    // 3. Fonctions manuelles pour extraire les données des balises
    const extractContent = (block, tagName) => {
        const startTag = `<${tagName}>`;
        const endTag = `</${tagName}>`;
        let startIndex = block.indexOf(startTag);
        let endIndex = block.indexOf(endTag);

        if (startIndex === -1 || endIndex === -1) return null;
        
        let content = block.substring(startIndex + startTag.length, endIndex);
        // Nettoie les données CDATA qui protègent le texte
        if (content.startsWith("<![CDATA[")) {
            content = content.substring(9, content.length - 3);
        }
        return content;
    };

    const extractAttribute = (block, tagName, attrName) => {
        let tagStartIndex = block.indexOf(`<${tagName}`);
        if (tagStartIndex === -1) return null;

        let tagEndIndex = block.indexOf('>', tagStartIndex);
        if (tagEndIndex === -1) return null;

        const tagText = block.substring(tagStartIndex, tagEndIndex);
        const attrText = `${attrName}="`;
        let attrStartIndex = tagText.indexOf(attrText);
        if (attrStartIndex === -1) return null;

        let attrEndIndex = tagText.indexOf('"', attrStartIndex + attrText.length);
        if (attrEndIndex === -1) return null;
        
        return tagText.substring(attrStartIndex + attrText.length, attrEndIndex);
    };

    // 4. Extraction des informations de l'épisode
    const title = extractContent(episodeBlock, 'title') || "episode-sans-titre";
    const audioUrl = extractAttribute(episodeBlock, 'enclosure', 'url');

    if (!audioUrl) {
      return new Response("URL de l'audio introuvable pour cet épisode.", { status: 404 });
    }

    // 5. Récupère et renvoie le fichier audio (cette partie ne change pas)
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      return new Response("Impossible de récupérer le fichier audio depuis la source.", { status: 502 });
    }

    const filename = `${title.replace(/[^\w\s.-]/gi, '').trim().replace(/\s+/g, '_')}.mp3`;
    const headers = new Headers();
    headers.set("Content-Type", "audio/mpeg");
    headers.set("Content-Length", audioResponse.headers.get("Content-Length") || "");
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(audioResponse.body, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error("Erreur dans l'Edge Function:", error);
    return new Response("Une erreur interne est survenue.", { status: 500 });
  }
};