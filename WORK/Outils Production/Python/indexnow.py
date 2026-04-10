import requests
import json

# Configuration
endpoint = "https://api.indexnow.org/indexnow"
host = "sexo-logique.com"
key = "f28b4799603242a0aa2eda4e825ae01e"
key_location = f"https://{host}/{key}.txt"

# Liste nettoyée de vos URLs
url_list = [
    "https://sexo-logique.com/",
    "https://sexo-logique.com/articles",
    "https://sexo-logique.com/FAQ",
    "https://sexo-logique.com/FAQ/accompagnement-individuel-couple",
    "https://sexo-logique.com/FAQ/blocages-emotionnels-psychologiques",
    "https://sexo-logique.com/FAQ/changements-vie-sexualite",
    "https://sexo-logique.com/FAQ/comment-convaincre-son-partenaire-de-consulter",
    "https://sexo-logique.com/FAQ/communication-intimite",
    "https://sexo-logique.com/FAQ/confidentialite-et-deontologie",
    "https://sexo-logique.com/FAQ/cycles-vie-sexualite-evolutive",
    "https://sexo-logique.com/FAQ/deroulement-d-une-seance-de-sexologie",
    "https://sexo-logique.com/FAQ/difficultes-communication-couple",
    "https://sexo-logique.com/FAQ/douleurs-rapports-sexuels",
    "https://sexo-logique.com/FAQ/ejaculation-precoce-retardee",
    "https://sexo-logique.com/FAQ/examen-physique-et-nudite-en-sexologie",
    "https://sexo-logique.com/FAQ/gestion-frustrations-conflits-sexuels",
    "https://sexo-logique.com/FAQ/identite-orientation-sexuelle",
    "https://sexo-logique.com/FAQ/impact-sante-maladie-sexualite",
    "https://sexo-logique.com/FAQ/la-sexologie-pour-qui-et-pourquoi",
    "https://sexo-logique.com/FAQ/medecin-sexologue-ou-sexologue-clinicien",
    "https://sexo-logique.com/FAQ/preserver-renforcer-complicite",
    "https://sexo-logique.com/FAQ/qu-est-ce-qu-un-sexologue",
    "https://sexo-logique.com/FAQ/qui-peut-consulter-un-sexologue",
    "https://sexo-logique.com/FAQ/retrouver-developper-desir",
    "https://sexo-logique.com/FAQ/sante-sexuelle-bien-etre",
    "https://sexo-logique.com/FAQ/tarifs-et-remboursements-sexologue",
    "https://sexo-logique.com/FAQ/teleconsultation-sexologie-efficacite",
    "https://sexo-logique.com/FAQ/troubles-desir-sexuel",
    "https://sexo-logique.com/FAQ/troubles-erection",
    "https://sexo-logique.com/FAQ/troubles-orgasme",
    "https://sexo-logique.com/FAQ/usage-problematique-pornographie",
    "https://sexo-logique.com/FAQ/vie-intime-satisfaction-personnelle",
    "https://sexo-logique.com/articles/le-desir-s-est-endormi",
    "https://sexo-logique.com/articles/libido-desir-et-intimite",
    "https://sexo-logique.com/articles/mon-corps-s-eveille-sans-moi-comprendre-les-mysteres-du-sommeil-intime",
    "https://sexo-logique.com/articles/pourquoi-consulter-un-sexologue",
    "https://sexo-logique.com/articles/retrouver-l-harmonie-quand-le-sommeil-nous-separe",
    "https://sexo-logique.com/articles/Se-Reconcilier-avec-son-Corps-pour-Retrouver-l-Intimite",
    "https://sexo-logique.com/articles/Sexualite-et-Couple-Durable-Laisser-la-Flamme-Evoluer",
    "https://sexo-logique.com/articles/sexualite-et-parentalite",
    "https://sexo-logique.com/articles/therapie-de-couple-a-nancy-pourquoi-attendre-la-crise-pour-reinventer-votre-lien"
]

data = {
    "host": host,
    "key": key,
    "keyLocation": key_location,
    "urlList": url_list
}

try:
    response = requests.post(endpoint, json=data, headers={"Content-Type": "application/json; charset=utf-8"})
    if response.status_code == 200:
        print("✅ Succès ! Toutes les URL ont été envoyées à IndexNow.")
    elif response.status_code == 202:
         print("✅ Reçu ! IndexNow va traiter les URL prochainement.")
    else:
        print(f"❌ Erreur : {response.status_code} - {response.text}")
except Exception as e:
    print(f"❌ Erreur de connexion : {e}")