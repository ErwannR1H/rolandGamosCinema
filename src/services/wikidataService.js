/**
 * Service de requêtes vers Wikidata
 * Utilise l'API Wikibase Search et SPARQL Query Service
 */

const WIKIDATA_SEARCH_API = 'https://www.wikidata.org/w/api.php';
const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

/**
 * Recherche un acteur sur Wikidata en utilisant l'API de recherche
 * @param {string} actorName - Nom de l'acteur à rechercher
 * @returns {Promise<Object|null>}
 */
export async function findActorOnWikidata(actorName) {
    try {
        // Étape 1: Rechercher l'acteur via l'API de recherche Wikidata
        const searchUrl = `${WIKIDATA_SEARCH_API}?` + new URLSearchParams({
            action: 'wbsearchentities',
            search: actorName,
            language: 'en',
            format: 'json',
            type: 'item',
            limit: '10',
            origin: '*'
        });

        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
            throw new Error(`Erreur recherche Wikidata: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        
        if (!searchData.search || searchData.search.length === 0) {
            return null;
        }

        // Étape 2: Vérifier que les résultats sont des acteurs
        for (const result of searchData.search) {
            const entityId = result.id;
            
            // Vérifier si c'est un acteur via SPARQL
            const isActor = await checkIfActor(entityId);
            
            if (isActor) {
                // Récupérer l'image de l'acteur si disponible
                const imageUrl = await getActorImage(entityId);
                
                return {
                    actor: `http://www.wikidata.org/entity/${entityId}`,
                    label: result.label,
                    description: result.description || '',
                    wikidataUrl: `https://www.wikidata.org/wiki/${entityId}`,
                    imageUrl: imageUrl
                };
            }
        }

        return null;
    } catch (error) {
        console.error('Erreur recherche acteur Wikidata:', error);
        throw error;
    }
}

/**
 * Vérifie si une entité Wikidata est un acteur
 * @param {string} entityId - ID de l'entité Wikidata (ex: Q123)
 * @returns {Promise<boolean>}
 */
async function checkIfActor(entityId) {
    const query = `
        ASK {
            {
                wd:${entityId} wdt:P106 wd:Q33999 .  # acteur/actrice
            } UNION {
                wd:${entityId} wdt:P106 wd:Q10800557 .  # acteur de cinéma
            } UNION {
                wd:${entityId} wdt:P106 wd:Q10798782 .  # acteur de télévision
            } UNION {
                wd:${entityId} wdt:P106 wd:Q948329 .  # acteur de théâtre
            }
        }
    `;

    try {
        const url = `${WIKIDATA_SPARQL_ENDPOINT}?` + new URLSearchParams({
            query: query,
            format: 'json'
        });

        const response = await fetch(url);
        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.boolean === true;
    } catch (error) {
        console.error('Erreur vérification acteur:', error);
        return false;
    }
}

/**
 * Récupère l'image d'un acteur depuis Wikidata
 * @param {string} entityId - ID de l'entité Wikidata (ex: Q123)
 * @returns {Promise<string|null>}
 */
async function getActorImage(entityId) {
    const query = `
        SELECT ?image WHERE {
            wd:${entityId} wdt:P18 ?image .
        }
        LIMIT 1
    `;

    try {
        const url = `${WIKIDATA_SPARQL_ENDPOINT}?` + new URLSearchParams({
            query: query,
            format: 'json'
        });

        const response = await fetch(url);
        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        if (data.results.bindings.length > 0) {
            return data.results.bindings[0].image.value;
        }
        return null;
    } catch (error) {
        console.error('Erreur récupération image:', error);
        return null;
    }
}

/**
 * Vérifie si deux acteurs ont joué dans un film commun sur Wikidata
 * Utilise une seule requête SPARQL optimisée
 * @param {string} actor1Uri - URI du premier acteur
 * @param {string} actor2Uri - URI du second acteur
 * @returns {Promise<Object|null>}
 */
export async function findCommonMovieOnWikidata(actor1Uri, actor2Uri) {
    try {
        // Extraire l'ID Wikidata de l'URI
        const actor1Id = actor1Uri.split('/').pop();
        const actor2Id = actor2Uri.split('/').pop();
        
        console.log(`Recherche de films communs entre ${actor1Id} et ${actor2Id}`);
        
        // Requête SPARQL optimisée pour trouver les films communs en une seule fois
        const query = `
            SELECT DISTINCT ?movie ?movieLabel ?poster WHERE {
                # Le film doit avoir les deux acteurs dans son casting
                ?movie wdt:P161 wd:${actor1Id} .
                ?movie wdt:P161 wd:${actor2Id} .
                
                # C'est un film ou une série TV
                {
                    ?movie wdt:P31/wdt:P279* wd:Q11424 .  # film
                } UNION {
                    ?movie wdt:P31/wdt:P279* wd:Q5398426 .  # série TV
                }
                
                # Récupérer l'affiche si disponible
                OPTIONAL { ?movie wdt:P18 ?poster . }
                
                SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
            }
            LIMIT 10
        `;

        const url = `${WIKIDATA_SPARQL_ENDPOINT}?` + new URLSearchParams({
            query: query,
            format: 'json'
        });

        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Erreur SPARQL: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const results = data.results.bindings;

        if (results.length === 0) {
            console.log(`Aucun film commun trouvé`);
            return null;
        }

        console.log(`${results.length} film(s) commun(s) trouvé(s)`);
        console.log(`Films communs:`, results.map(r => r.movieLabel.value));

        const firstResult = results[0];
        
        return {
            movie: firstResult.movie.value,
            movieLabel: firstResult.movieLabel.value,
            moviePosterUrl: firstResult.poster ? firstResult.poster.value : null,
            source: 'Wikidata'
        };
    } catch (error) {
        console.error('Erreur vérification films communs Wikidata:', error);
        throw error;
    }
}
