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
                return {
                    actor: `http://www.wikidata.org/entity/${entityId}`,
                    label: result.label,
                    description: result.description || ''
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
            wd:${entityId} wdt:P106 wd:Q33999 .
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
 * Vérifie si deux acteurs ont joué dans un film commun sur Wikidata
 * Méthode robuste : récupère tous les films de chaque acteur et trouve l'intersection
 * @param {string} actor1Uri - URI du premier acteur
 * @param {string} actor2Uri - URI du second acteur
 * @returns {Promise<Object|null>}
 */
export async function findCommonMovieOnWikidata(actor1Uri, actor2Uri) {
    try {
        // Extraire l'ID Wikidata de l'URI
        const actor1Id = actor1Uri.split('/').pop();
        const actor2Id = actor2Uri.split('/').pop();
        
        console.log(`🎬 Recherche de films communs entre ${actor1Id} et ${actor2Id}`);
        
        // Étape 1: Récupérer tous les films de l'acteur 1
        const actor1Movies = await getActorMovies(actor1Id);
        console.log(`📽️ Acteur 1 a ${actor1Movies.length} films`);
        
        if (actor1Movies.length === 0) {
            return null;
        }
        
        // Étape 2: Récupérer tous les films de l'acteur 2
        const actor2Movies = await getActorMovies(actor2Id);
        console.log(`📽️ Acteur 2 a ${actor2Movies.length} films`);
        
        if (actor2Movies.length === 0) {
            return null;
        }
        
        // Étape 3: Trouver l'intersection (films communs)
        const commonMovies = actor1Movies.filter(movie1 => 
            actor2Movies.some(movie2 => movie2.movie === movie1.movie)
        );
        
        console.log(`✨ ${commonMovies.length} film(s) commun(s) trouvé(s)`);
        
        if (commonMovies.length > 0) {
            console.log(`🎬 Films communs:`, commonMovies.map(m => m.movieLabel));
        }
        
        if (commonMovies.length === 0) {
            return null;
        }

        return {
            movie: commonMovies[0].movie,
            movieLabel: commonMovies[0].movieLabel,
            source: 'Wikidata'
        };
    } catch (error) {
        console.error('Erreur vérification films communs Wikidata:', error);
        throw error;
    }
}

/**
 * Récupère tous les films d'un acteur sur Wikidata
 * @param {string} actorId - ID Wikidata de l'acteur (ex: Q123)
 * @returns {Promise<Array>} - Liste des films avec leur label
 */
async function getActorMovies(actorId) {
    const query = `
        SELECT DISTINCT ?movie ?movieLabel WHERE {
            {
                # Films où l'acteur est dans le cast (P161)
                ?movie wdt:P161 wd:${actorId} .
            } UNION {
                # Films où l'acteur est le réalisateur (P57) - parfois ils jouent aussi
                wd:${actorId} wdt:P800 ?movie .
                ?movie wdt:P31/wdt:P279* wd:Q11424 .
            } UNION {
                # Recherche inverse - l'acteur a participé à (P1344)
                wd:${actorId} wdt:P1344 ?movie .
                ?movie wdt:P31/wdt:P279* wd:Q11424 .
            }
            
            # Vérifier que c'est bien un film ou une série
            {
                ?movie wdt:P31/wdt:P279* wd:Q11424 .  # film
            } UNION {
                ?movie wdt:P31/wdt:P279* wd:Q5398426 .  # série TV
            }
            
            SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
        }
        LIMIT 500
    `;

    try {
        const url = `${WIKIDATA_SPARQL_ENDPOINT}?` + new URLSearchParams({
            query: query,
            format: 'json'
        });

        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Erreur récupération films pour ${actorId}: ${response.status}`);
            return [];
        }

        const data = await response.json();
        const movies = data.results.bindings.map(binding => ({
            movie: binding.movie.value,
            movieLabel: binding.movieLabel.value
        }));
        
        console.log(`📋 Films trouvés pour ${actorId}:`, movies.slice(0, 5).map(m => m.movieLabel));
        
        return movies;
    } catch (error) {
        console.error(`Erreur récupération films pour ${actorId}:`, error);
        return [];
    }
}
