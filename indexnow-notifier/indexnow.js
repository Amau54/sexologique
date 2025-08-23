// indexnow.js
const axios = require("axios");
const host = "sexo-logique.com";
const key = "f28b4799603242a0aa2eda4e825ae01e"; 
const urls = [
  "https://sexo-logique.com/"
];

async function notifyIndexNow() {
  try {
    const response = await axios.post("https://api.indexnow.org/indexnow", {
      host: host,
      key: key,
      urlList: urls
    }, {
      headers: { "Content-Type": "application/json" }
    });

    console.log("✅ URLs envoyées avec succès :", response.status);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi :", error.message);
  }
}

notifyIndexNow();
