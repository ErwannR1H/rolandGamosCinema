import fs from 'fs';

const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

/**
 * Décode les entités HTML
 */
function decodeHtmlEntities(text) {
    const entities = {
        '&apos;': "'",
        '&quot;': '"',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>'
    };
    return text.replace(/&[a-z]+;/gi, match => entities[match] || match);
}

/**
 * Extrait les noms d'acteurs du fichier HTML IMDB
 */
function extractActorNamesFromHTML() {
    console.log('Lecture du fichier HTML...');
    
    const htmlContent = fs.readFileSync('./scripts/TOP250ACTORS.html', 'utf-8');
    
    // Extraction du JSON-LD
    const jsonLdMatch = htmlContent.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    
    if (!jsonLdMatch) {
        throw new Error('Impossible de trouver le JSON-LD dans le HTML');
    }

    const jsonData = JSON.parse(jsonLdMatch[1]);
    
    const actorNames = new Set();
    
    jsonData.itemListElement.forEach(item => {
        const cleanName = decodeHtmlEntities(item.item.name);
        actorNames.add(cleanName);
    });

    return Array.from(actorNames);
}

/**
 * Récupère tous les acteurs Wikidata correspondant aux noms en UNE SEULE requête
 */
async function fetchAllActorsFromWikidata(names) {
    console.log('\n🔍 Recherche de tous les acteurs sur Wikidata en une seule requête...');
    
    // Créer une liste VALUES avec tous les noms
    const valuesClause = names
        .map(name => `"${name.replace(/"/g, '\\"')}"@en`)
        .join(' ');
    
    const query = `
        SELECT DISTINCT ?actor ?actorLabel ?actorDescription ?image WHERE {
            VALUES ?label { ${valuesClause} }
            
            ?actor rdfs:label ?label .
            ?actor wdt:P31 wd:Q5 .  # instance de humain
            
            {
                ?actor wdt:P106 wd:Q33999 .  # acteur de cinéma
            } UNION {
                ?actor wdt:P106 wd:Q10800557 .  # acteur de films
            } UNION {
                ?actor wdt:P106 wd:Q10798782 .  # acteur de télévision
            }
            
            # Exiger une image (pour cohérence avec le jeu)
            ?actor wdt:P18 ?image .
            
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
        }
    `;
    
    try {
        const url = `${WIKIDATA_SPARQL_ENDPOINT}?` + new URLSearchParams({
            query: query,
            format: 'json'
        });

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/sparql-results+json',
                'User-Agent': 'RolandGamosCinema/1.0 (Educational project)'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        console.log(`${data.results.bindings.length} acteurs trouvés sur Wikidata !`);
        
        return data.results.bindings.map(binding => ({
            actor: binding.actor.value,
            label: binding.actorLabel.value,
            description: binding.actorDescription?.value || '',
            wikidataUrl: `https://www.wikidata.org/wiki/${binding.actor.value.split('/').pop()}`,
            imageUrl: binding.image.value  // Toujours présent maintenant
        }));
    } catch (error) {
        console.error('Erreur lors de la requête SPARQL:', error.message);
        return [];
    }
}

/**
 * Fonction principale
 */
async function main() {
    try {
        // 1. Extraire les noms du HTML
        const actorNames = extractActorNamesFromHTML();
        console.log(`✅ ${actorNames.length} noms d'acteurs extraits du HTML`);
        
        // 2. Récupérer tous les acteurs en une seule requête
        const actors = await fetchAllActorsFromWikidata(actorNames);
        
        if (actors.length === 0) {
            console.error('Aucun acteur trouvé !');
            return;
        }
        
        // 3. Sauvegarder le cache
        const outputPath = './public/popular-actors.json';
        fs.writeFileSync(outputPath, JSON.stringify(actors, null, 2));
        
        console.log(`\nCache créé avec succès !`);
        console.log(`Fichier: ${outputPath}`);
        console.log(`${actors.length} acteurs sauvegardés`);
        console.log(`${actors.filter(a => a.imageUrl).length} acteurs avec image`);
        
    } catch (error) {
        console.error('Erreur:', error.message);
        process.exit(1);
    }
}

main();
