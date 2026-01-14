/**
 * Service de téléchargement et stockage du graphe d'acteurs complet
 */

const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

/**
 * Télécharge un graphe en partant d'acteurs très populaires et en explorant leurs réseaux
 * Inclut automatiquement les co-acteurs moins connus
 * @param {number} startingActors - Nombre d'acteurs de départ
 * @param {number} maxActors - Nombre maximum total d'acteurs
 * @returns {Promise<Object>}
 */
export async function downloadExpandedActorGraph(startingActors = 200, maxActors = 5000) {
    console.log('Téléchargement d\'un graphe étendu...');
    
    // Requête qui récupère les acteurs populaires ET tous leurs co-acteurs en une fois
    const query = `
        SELECT DISTINCT ?actor1 ?actor1Label ?actor2 ?actor2Label ?movie ?movieLabel WHERE {
            # Sélection des acteurs hub basée sur la notoriété (sitelinks) et nombre de films
            {
                SELECT ?actor1 WHERE {
                    ?actor1 wdt:P106 wd:Q33999 .  # acteur/actrice
                    ?actor1 wikibase:sitelinks ?sitelinks .  # nombre de liens Wikipedia (notoriété)
                    
                    # Vérifier qu'ils ont au moins quelques films
                    {
                        SELECT ?actor1 (COUNT(DISTINCT ?m) as ?movieCount) WHERE {
                            ?m wdt:P161 ?actor1 .
                            ?m wdt:P31/wdt:P279* wd:Q11424 .
                        }
                        GROUP BY ?actor1
                        HAVING (COUNT(DISTINCT ?m) >= 5)
                    }
                }
                ORDER BY DESC(?sitelinks)  # Trier par notoriété
                LIMIT ${startingActors}
            }
            
            # Récupérer tous les films et co-acteurs de ces hubs
            ?movie wdt:P161 ?actor1 .
            ?movie wdt:P161 ?actor2 .
            ?movie wdt:P31/wdt:P279* wd:Q11424 .
            
            FILTER(?actor1 != ?actor2)
            
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        LIMIT ${maxActors * 5}
    `;

    const results = await executeSparqlQuery(query);
    console.log(`${results.length} connexions téléchargées`);
    
    const graph = buildGraphFromResults(results, maxActors);
    return graph;
}

/**
 * Nettoie une chaîne de caractères pour éviter les problèmes JSON
 * @param {string} str - Chaîne à nettoyer
 * @returns {string}
 */
function cleanString(str) {
    if (!str) return '';
    // Remplacer les caractères de contrôle et de saut de ligne
    return str.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
}

/**
 * Construit le graphe à partir des résultats SPARQL
 * Limite le nombre total d'acteurs mais garde la diversité
 * @param {Array} results - Résultats SPARQL
 * @param {number} maxActors - Nombre maximum d'acteurs à inclure
 * @returns {Object}
 */
function buildGraphFromResults(results, maxActors = 10000) {
    const actors = new Map();
    const connections = new Map();

    // Phase 1: Compter tous les acteurs et leurs films
    results.forEach(result => {
        const actor1Id = result.actor1.value.split('/').pop();
        const actor2Id = result.actor2.value.split('/').pop();
        const movieId = result.movie.value.split('/').pop();

        // Initialiser les acteurs avec labels nettoyés
        if (!actors.has(actor1Id)) {
            actors.set(actor1Id, {
                id: actor1Id,
                label: cleanString(result.actor1Label.value),
                movies: new Set(),
                coActors: new Set()
            });
        }
        if (!actors.has(actor2Id)) {
            actors.set(actor2Id, {
                id: actor2Id,
                label: cleanString(result.actor2Label.value),
                movies: new Set(),
                coActors: new Set()
            });
        }

        // Compter les films
        actors.get(actor1Id).movies.add(movieId);
        actors.get(actor2Id).movies.add(movieId);
    });

    // Phase 2: Sélectionner les acteurs (mix de populaires et moins connus)
    const actorsList = Array.from(actors.entries());
    
    // Trier par nombre de films décroissant
    actorsList.sort((a, b) => b[1].movies.size - a[1].movies.size);
    
    // Stratégie de sélection :
    // - Garder tous les acteurs avec beaucoup de films
    // - Garder un échantillon d'acteurs avec peu de films
    const selectedActors = new Set();
    
    // Garder les top acteurs (hub importants)
    const topCount = Math.min(Math.floor(maxActors * 0.4), actorsList.length);
    for (let i = 0; i < topCount; i++) {
        selectedActors.add(actorsList[i][0]);
    }
    
    // Garder un échantillon aléatoire du reste (acteurs moins connus)
    const remainingActors = actorsList.slice(topCount);
    const sampleSize = Math.min(maxActors - selectedActors.size, remainingActors.length);
    
    // Échantillonnage aléatoire pour garder la diversité
    const shuffled = remainingActors.sort(() => Math.random() - 0.5);
    for (let i = 0; i < sampleSize; i++) {
        selectedActors.add(shuffled[i][0]);
    }

    console.log(`Sélection : ${selectedActors.size} acteurs (${topCount} populaires + ${selectedActors.size - topCount} variés)`);

    // Phase 3: Construire le graphe final avec seulement les acteurs sélectionnés
    results.forEach(result => {
        const actor1Id = result.actor1.value.split('/').pop();
        const actor2Id = result.actor2.value.split('/').pop();
        const movieId = result.movie.value.split('/').pop();

        // Ne garder que si les deux acteurs sont sélectionnés
        if (!selectedActors.has(actor1Id) || !selectedActors.has(actor2Id)) {
            return;
        }

        // Ajouter les co-acteurs
        actors.get(actor1Id).coActors.add(actor2Id);
        actors.get(actor2Id).coActors.add(actor1Id);

        // Ajouter la connexion
        const pairKey = [actor1Id, actor2Id].sort().join('-');
        if (!connections.has(pairKey)) {
            connections.set(pairKey, {
                actor1: actor1Id,
                actor2: actor2Id,
                movies: []
            });
        }
        connections.get(pairKey).movies.push({
            id: movieId,
            label: cleanString(result.movieLabel.value)
        });
    });

    // Convertir en format sérialisable
    const actorsArray = Array.from(actors.entries())
        .filter(([id]) => selectedActors.has(id))
        .map(([id, actor]) => ({
            id,
            label: actor.label,
            movies: Array.from(actor.movies),
            coActors: Array.from(actor.coActors),
            degree: actor.coActors.size,
            movieCount: actor.movies.size
        }));

    const connectionsArray = Array.from(connections.values());

    // Statistiques sur la distribution
    const movieCounts = actorsArray.map(a => a.movieCount);
    const distribution = {
        '1-2 films': movieCounts.filter(c => c <= 2).length,
        '3-5 films': movieCounts.filter(c => c >= 3 && c <= 5).length,
        '6-10 films': movieCounts.filter(c => c >= 6 && c <= 10).length,
        '11-20 films': movieCounts.filter(c => c >= 11 && c <= 20).length,
        '20+ films': movieCounts.filter(c => c > 20).length
    };

    return {
        actors: actorsArray,
        connections: connectionsArray,
        metadata: {
            actorCount: actorsArray.length,
            connectionCount: connectionsArray.length,
            downloadDate: new Date().toISOString(),
            distribution: distribution
        }
    };
}

/**
 * Execute une requête SPARQL
 */
async function executeSparqlQuery(query) {
    const url = `${WIKIDATA_SPARQL_ENDPOINT}?` + new URLSearchParams({
        query: query,
        format: 'json',
        origin: '*'
    });

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur SPARQL: ${response.status}`);
    }

    const data = await response.json();
    return data.results.bindings;
}

/**
 * Sauvegarde le graphe en localStorage
 */
export function saveGraphToStorage(graph) {
    try {
        localStorage.setItem('actorGraph', JSON.stringify(graph));
        console.log('Graphe sauvegardé en localStorage');
        return true;
    } catch (error) {
        console.error('Erreur sauvegarde localStorage:', error);
        return false;
    }
}

/**
 * Charge le graphe depuis localStorage
 */
export function loadGraphFromStorage() {
    try {
        const data = localStorage.getItem('actorGraph');
        if (data) {
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('Erreur chargement localStorage:', error);
        return null;
    }
}

/**
 * Télécharge le graphe en tant que fichier JSON
 */
export function downloadGraphAsFile(graph) {
    const dataStr = JSON.stringify(graph, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `actor-graph-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

/**
 * Charge un graphe depuis un fichier JSON
 */
export async function loadGraphFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const graph = JSON.parse(e.target.result);
                resolve(graph);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}
