/*
Pour utiliser, cela recrée la liste des articles dans /articles : node generate-articles-liste.js
Le script est maintenant interactif : il vous demandera de choisir une ou plusieurs catégories pour les nouveaux articles, 
en plaçant les plus pertinentes en tête de liste.
*/
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const readline = require("readline");

// --- CONFIGURATION ---

// 📂 Emplacement des fichiers
const articlesDir = path.join(__dirname, "public", "articles");
const outputPath = path.join(__dirname, "public", "articles.json");

// 🗺️ Logique des catégories
const categoryMap = {
    'Bien-être & Plaisir': ['plaisir', 'orgasme', 'jouissance', 'libido', 'désir', 'excitation', 'érotisme', 'satisfaction sexuelle', 'bien-être', 'point G', 'éjaculation féminine', 'sensualité', 'corps', 'image corporelle', 'masturbation', 'fantasme', 'préliminaires', 'épanouissement sexuel'],
    'Dysfonctions & Troubles': ['dysfonction érectile', 'impuissance', 'éjaculation précoce', 'anéjaculation', 'anorgasmie', 'vaginisme', 'dyspareunie', 'douleur', 'trouble du désir', 'libido en berne', 'anxiété de performance', 'trouble de l\'excitation', 'addiction sexuelle', 'hypersexualité'],
    'Anatomie & Physiologie': ['anatomie', 'clitoris', 'pénis', 'vagin', 'utérus', 'prostate', 'périnée', 'hormones', 'testostérone', 'œstrogène', 'progestérone', 'cycle menstruel', 'ovulation', 'lubrification', 'érection', 'réponse sexuelle', 'physiologie', 'neurologie'],
    'Couple & Dynamiques': ['couple', 'amour', 'relation', 'intimité', 'communication', 'conflit', 'jalousie', 'infidélité', 'rupture', 'deuil amoureux', 'attachement', 'vie à deux', 'thérapie de couple', 'conseiller conjugal', 'engagement', 'célibat', 'rencontre'],
    'Formes Relationnelles': ['polyamour', 'non-monogamie', 'trouple', 'relation libre', 'anarchie relationnelle', 'configurations relationnelles', 'monogamie', 'exclusivité'],
    'Identité & Expression de Genre': ['identité de genre', 'transgenre', 'transidentité', 'cisgenre', 'non-binaire', 'genre fluide', 'intersexe', 'dysphorie de genre', 'transition', 'expression de genre', 'mégenrage', 'pronom'],
    'Développement Sexuel': ['développement psychosexuel', 'puberté', 'adolescence', 'première fois', 'sexualité des seniors', 'vieillissement', 'ménopause', 'andropause', 'enfance', 'éducation à la sexualité', 'curiosité sexuelle'],
    'Représentations & Médias': ['pornographie', 'culture', 'société', 'médias', 'masculinité toxique', 'stéréotypes de genre', 'histoire de la sexologie', 'lois', 'éthique', 'anthropologie de la sexualité', 'sociologie du corps', 'religion et sexualité'],
    'Prévention & Risques': ['prévention', 'risque', 'ist', 'vih', 'contraception', 'préservatif', 'pilule', 'dépistage', 'sécurité', 'consentement'],
    'Orientation Sexuelle': ['orientation sexuelle', 'hétérosexualité', 'homosexualité', 'bisexualité', 'pansexualité', 'asexualité', 'aromantisme', 'lgbtq', 'coming out'],
    'Traumas & Violences': ['trauma', 'violence', 'agression sexuelle', 'harcèlement', 'abus', 'vss', 'violences conjugales', 'inceste']
};

// 🗺️ Logique des icônes
const iconRules = [
    // 1. URGENCES & SANTÉ MENTALE FORTE (Priorité haute)
    { 
        icon: 'fa-solid fa-triangle-exclamation', 
        keywords: ['urgence', 'danger', 'crise', 'suicide', 'violence', 'abus', 'viol', 'agression', 'harcèlement'] 
    },
    { 
        icon: 'fa-solid fa-head-side-virus', 
        keywords: ['burn-out', 'dépression', 'trauma', 'ptsd', 'toxique', 'charge mentale', 'bipolaire'] 
    },
    { 
        icon: 'fa-solid fa-cloud-bolt', 
        keywords: ['anxiété', 'stress', 'angoisse', 'phobie', 'peur', 'panique', 'blocage'] 
    },

    // 2. SANTÉ PHYSIQUE & CONDITIONS SPÉCIFIQUES
    { 
        icon: 'fa-solid fa-ribbon', // Ruban pour les causes/maladies
        keywords: ['endométriose', 'sopk', 'cancer', 'tumeur', 'fibrome', 'kyste'] 
    },
    { 
        icon: 'fa-solid fa-staff-snake', // Symbole médical plus clair que user-doctor
        keywords: ['vaginisme', 'dyspareunie', 'vulvodynie', 'douleur', 'médical', 'gynéco', 'urologue', 'infection', 'mycose', 'cystite'] 
    },
    { 
        icon: 'fa-solid fa-shield-virus', 
        keywords: ['ist', 'mst', 'vih', 'sida', 'chlamydia', 'herpès', 'syphilis', 'hpv', 'papillomavirus', 'préservatif', 'protection'] 
    },
    { 
        icon: 'fa-solid fa-baby-carriage', 
        keywords: ['grossesse', 'enceinte', 'bébé', 'accouchement', 'post-partum', 'fausse couche', 'iv-g', 'avortement', 'fertilité', 'infertilité', 'pma', 'fiv'] 
    },

    // 3. CYCLE & BIOLOGIE
    { 
        icon: 'fa-solid fa-droplet', 
        keywords: ['règles', 'menstruation', 'flux', 'sang', 'cycle', 'spm', 'tampon', 'cup'] 
    },
    { 
        icon: 'fa-solid fa-seedling', 
        keywords: ['ménopause', 'andropause', 'hormone', 'bouffée de chaleur', 'puberté', 'croissance', 'vieillissement'] 
    },
    { 
        icon: 'fa-solid fa-dna', 
        keywords: ['anatomie', 'génétique', 'biologie', 'corps humain', 'clitoris', 'pénis', 'vagin', 'vulve', 'prostate'] 
    },

    // 4. PRATIQUES & PLAISIR (Distinction Désir vs Pratique)
    { 
        icon: 'fa-solid fa-fire', 
        keywords: ['désir', 'libido', 'excitation', 'passion', 'feu', 'attirance', 'pulsion'] 
    },
    { 
        icon: 'fa-solid fa-wand-magic-sparkles', 
        keywords: ['sextoy', 'vibromasseur', 'godemichet', 'accessoire', 'lubrifiant', 'jeu', 'jouet'] 
    },
    { 
        icon: 'fa-solid fa-mask', 
        keywords: ['fantasme', 'bdsm', 'kink', 'fétichisme', 'domination', 'soumission', 'rôle', 'scénario', 'imaginaire'] 
    },
    { 
        icon: 'fa-solid fa-bed', 
        keywords: ['position', 'kamasutra', 'sodomie', 'fellation', 'cunnilingus', 'anulingus', 'pratique', 'technique', 'faire l\'amour', 'coït', 'pénétration'] 
    },
    { 
        icon: 'fa-solid fa-heart', // Le plaisir et l'amour
        keywords: ['orgasme', 'jouir', 'plaisir', 'masturbation', 'amour', 'sentiment', 'aimer'] 
    },

    // 5. RELATIONS & PSYCHO DU COUPLE
    { 
        icon: 'fa-solid fa-heart-crack', 
        keywords: ['rupture', 'séparation', 'divorce', 'ex', 'célibat', 'chagrin', 'deuil', 'infidélité', 'tromperie', 'adultère', 'jalousie'] 
    },
    { 
        icon: 'fa-solid fa-people-arrows', 
        keywords: ['polyamour', 'trouple', 'libre', 'échangisme', 'libertinage', 'non-monogamie', 'ouvert'] 
    },
    { 
        icon: 'fa-solid fa-comments', 
        keywords: ['communication', 'dispute', 'conflit', 'dialogue', 'parler', 'écouter', 'entendre', 'incompréhension', 'reproche'] 
    },
    { 
        icon: 'fa-solid fa-hand-holding-heart', 
        keywords: ['couple', 'relation', 'complicité', 'confiance', 'soutien', 'mariage', 'engagement', 'pacser', 'vivre ensemble'] 
    },

    // 6. SOCIÉTÉ & IDENTITÉ
    { 
        icon: 'fa-solid fa-rainbow', 
        keywords: ['lgbt', 'gay', 'lesbienne', 'trans', 'queer', 'bi', 'pansexuel', 'asexuel', 'genre', 'fluidité', 'coming out'] 
    },
    { 
        icon: 'fa-solid fa-scale-balanced', 
        keywords: ['droit', 'loi', 'justice', 'égalité', 'consentement', 'féminisme', 'patriarcat', 'culture du viol'] 
    },
    
    // 7. TECHNO & MODERNE
    { 
        icon: 'fa-solid fa-mobile-screen-button', 
        keywords: ['appli', 'tinder', 'bumble', 'grindr', 'virtuel', 'sexting', 'nudes', 'porno', 'écran', 'internet'] 
    },

    // 8. RESSOURCES & CONSEILS (Généralistes)
    { 
        icon: 'fa-solid fa-lightbulb', 
        keywords: ['conseil', 'astuce', 'guide', 'tuto', 'comment', 'solution', 'idée', 'réponse'] 
    },
    { 
        icon: 'fa-solid fa-book-open', 
        keywords: ['livre', 'lecture', 'culture', 'histoire', 'étude', 'recherche', 'science', 'savoir'] 
    },
    { 
        icon: 'fa-solid fa-spa', 
        keywords: ['bien-être', 'détente', 'soin', 'image de soi', 'acceptation', 'corps', 'complexes', 'beauté'] 
    },

    // 9. CATCH-ALL (Mots très génériques à la fin)
    { 
        icon: 'fa-solid fa-brain', 
        keywords: ['psycho', 'psychologie', 'mental', 'pensée', 'réflexion'] 
    },
    { 
        icon: 'fa-solid fa-venus-mars', 
        keywords: ['sexologie', 'sexualité', 'sexe', 'genre', 'humain'] 
    }
];



// --- MOTEUR DU SCRIPT ---

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => {
    return new Promise(resolve => rl.question(query, resolve));
};


//ANCIENNE VERSION DU CHOIX DES ICONES PAR TITRE ET description

// Fonction pour suggérer des catégories basées sur le contenu
const suggestCategory = (article) => {
    const content = `${article.title} ${article.excerpt}`;
    const scores = {};

    for (const [category, keywords] of Object.entries(categoryMap)) {
        scores[category] = 0;
        keywords.forEach(keyword => {
            // Crée une expression régulière pour trouver le mot-clé comme un mot entier, insensible à la casse, et gérant un 's' final optionnel.
            // On "échappe" le mot-clé pour éviter les erreurs si un mot-clé contient des caractères spéciaux (ex: point G).
            const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedKeyword}(s?)\\b`, 'i');

            if (regex.test(content)) {
                scores[category]++;
            }
        });
    }

    // Trier les catégories par score, du plus élevé au plus bas
    return Object.entries(scores)
        .filter(([, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([category]) => category);
};

// Nouvelle fonction pour sélectionner une icône
const selectIconForArticle = (article) => {
    const lowerCaseContent = `${article.title} ${article.excerpt}`.toLowerCase();
    let selectedIcon = 'fa-solid fa-book-open'; // Icône par défaut

    for (const [icon, keywords] of Object.entries(iconMap)) {
        if (keywords.some(key => lowerCaseContent.includes(key))) {
            selectedIcon = icon;
            break; 
        }
    }
    return selectedIcon;
};



/*
//NOUVELLE VERSION 
// --- CONSTANTES DE PONDÉRATION ---
const TITLE_WEIGHT = 3;    // Un mot-clé dans le titre a plus de poids
const EXCERPT_WEIGHT = 1;  // Un mot-clé dans l'extrait a un poids normal

// Fonction pour calculer les scores en donnant plus de poids au titre
const calculateScores = (article, map) => {
    const scores = {};
    const lowerCaseTitle = article.title.toLowerCase();
    const lowerCaseExcerpt = article.excerpt.toLowerCase();

    for (const [key, keywords] of Object.entries(map)) {
        scores[key] = 0;
        keywords.forEach(keyword => {
            const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            // Regex pour trouver le mot-clé comme un mot entier, insensible à la casse, avec un 's' optionnel
            const regex = new RegExp(`\\b${escapedKeyword}s?\\b`, 'i');

            if (regex.test(lowerCaseTitle)) {
                scores[key] += TITLE_WEIGHT;
            }
            if (regex.test(lowerCaseExcerpt)) {
                scores[key] += EXCERPT_WEIGHT;
            }
        });
    }
    return scores;
};

// Fonction améliorée pour suggérer des catégories basées sur le contenu et la pondération
const suggestCategory = (article) => {
    const scores = calculateScores(article, categoryMap);

    // Trier les catégories par score, du plus élevé au plus bas
    return Object.entries(scores)
        .filter(([, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([category]) => category);
};

// Fonction améliorée pour sélectionner l'icône la plus pertinente via un score
const selectIconForArticle = (article) => {
    const scores = calculateScores(article, iconMap);
    
    const sortedIcons = Object.entries(scores)
        .filter(([, score]) => score > 0)
        .sort((a, b) => b[1] - a[1]);

    // Retourne l'icône avec le meilleur score, ou une icône par défaut si aucun mot-clé n'a été trouvé
    return sortedIcons.length > 0 ? sortedIcons[0][0] : 'fa-solid fa-book-open';
};

*/









async function generateArticleList() {
    console.log("🚀 Lancement de la génération de la liste d'articles...");

    let existingArticles = new Map();
    if (fs.existsSync(outputPath)) {
        const fileContent = fs.readFileSync(outputPath, "utf8");
        if (fileContent.trim()) {
            const existingData = JSON.parse(fileContent);
            existingData.forEach(article => existingArticles.set(article.url, article));
            console.log(`🔎 ${existingArticles.size} articles existants trouvés dans articles.json.`);
        } else {
            console.log("📝 Le fichier articles.json existe mais est vide. Il sera recréé.");
        }
    }

		const files = fs.readdirSync(articlesDir)
        .filter(f => f.endsWith(".html") && !['articles.html', 'script.js', 'style.css'].includes(f));

    const allArticles = [];

    for (const file of files) {
        const filePath = path.join(articlesDir, file);
        const content = fs.readFileSync(filePath, "utf8");
        const dom = new JSDOM(content);
        const doc = dom.window.document;

        const articleData = {
            url: file,
            title: doc.querySelector("title")?.textContent.trim() || "Sans titre",
            excerpt: doc.querySelector("meta[name='description']")?.content || doc.querySelector("p")?.textContent.trim() || "",
            author: "Chloé François",
            date: doc.querySelector("time")?.getAttribute("datetime") || null,
            category: [],
            iconClass: ''
        };
        articleData.iconClass = selectIconForArticle(articleData);

        const existingArticle = existingArticles.get(file);

        if (existingArticle && Array.isArray(existingArticle.category) && existingArticle.category.length > 0) {
            articleData.category = existingArticle.category;
            process.stdout.write(`   - ${articleData.title} : Catégories existantes -> "${articleData.category.join(', ')}"\n`);
        } else {
            console.log(`\n---\n🆕 Nouvel article détecté : "${articleData.title}"`);

            if (!articleData.date) {
                articleData.date = new Date().toISOString().slice(0, 10);
                console.log(`   -> Date de publication assignée à aujourd'hui : ${articleData.date}`);
            }

            const suggestions = suggestCategory(articleData);
            const allCategories = Object.keys(categoryMap);
            const choices = [...new Set([...suggestions, ...allCategories])];

            console.log("   -> Quelles catégories souhaitez-vous assigner ?");
            choices.forEach((cat, i) => {
                const isSuggested = suggestions.includes(cat);
                console.log(`      ${i + 1}. ${cat}${isSuggested ? ' (Suggestion)' : ''}`);
            });
            console.log(`      ${choices.length + 1}. ✨ CRÉER une nouvelle catégorie`);

            let chosenCategories = [];
            while (chosenCategories.length === 0) {
                const answer = await askQuestion(`      Vos choix (ex: 1, 3) ou ${choices.length + 1} pour créer : `);
                const rawChoices = answer.split(',').map(s => s.trim());
                let selectedCategories = [];

                if (rawChoices.includes(String(choices.length + 1))) {
                    const newCategory = await askQuestion("      Nom de la nouvelle catégorie : ");
                    if (newCategory.trim()) {
                        const newCat = newCategory.trim();
                        selectedCategories.push(newCat);
                        if (!categoryMap[newCat]) {
                            categoryMap[newCat] = [];
                        }
                    } else {
                        console.log("      Le nom ne peut pas être vide. Veuillez réessayer.");
                        continue;
                    }
                }

                const invalidChoices = [];
                for (const choiceStr of rawChoices) {
                    if (parseInt(choiceStr, 10) === choices.length + 1) continue;
                    const choiceIndex = parseInt(choiceStr, 10) - 1;
                    if (choiceIndex >= 0 && choiceIndex < choices.length) {
                        selectedCategories.push(choices[choiceIndex]);
                    } else if (choiceStr) {
                        invalidChoices.push(choiceStr);
                    }
                }

                if (invalidChoices.length > 0) {
                    console.log(`      Choix invalides ignorés : ${invalidChoices.join(', ')}.`);
                }

                if (selectedCategories.length > 0) {
                    chosenCategories = [...new Set(selectedCategories)];
                } else {
                     console.log("      Aucune catégorie valide sélectionnée. Veuillez réessayer.");
                }
            }
            articleData.category = chosenCategories;
            console.log(`   -> 👍 Catégories assignées : "${chosenCategories.join(', ')}"`);
        }
        allArticles.push(articleData);
    }

    const finalArticles = allArticles
        .sort((a, b) => (new Date(b.date) || 0) - (new Date(a.date) || 0))
        .map((article, index) => ({
            id: index + 1,
            category: article.category,
            title: article.title,
            excerpt: article.excerpt,
            date: article.date,
            author: article.author,
            url: article.url,
            iconClass: article.iconClass,
        }));

    fs.writeFileSync(outputPath, JSON.stringify(finalArticles, null, 2), "utf8");
    console.log("\n---\n✅ Fichier articles.json généré et mis à jour avec les catégories et les icônes !");
    rl.close();
}

generateArticleList().catch(error => {
    console.error("Une erreur est survenue :", error);
    rl.close();
});