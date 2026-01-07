/**
 * Module de gestion des requêtes SPARQL vers DBpedia
 */

const DBPEDIA_ENDPOINT = 'https://dbpedia.org/sparql';

/**
 * Recherche un acteur sur DBpedia par son nom
 * @param {string} actorName - Nom de l'acteur à rechercher
 * @returns {Promise<Object|null>} - Objet contenant l'URI et le label de l'acteur, ou null
 */
export async function findActor(actorName) {
    const resourceName = actorName.replace(/ /g, '_');
    
    const query = `
        PREFIX dbo: <http://dbpedia.org/ontology/>
        PREFIX dbr: <http://dbpedia.org/resource/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        
        SELECT DISTINCT ?actor ?label WHERE {
            {
                # Recherche directe par URI
                BIND(dbr:${resourceName} AS ?actor)
                ?actor rdfs:label ?label .
                ?actor rdf:type ?type .
                FILTER(?type = dbo:Person || ?type = dbo:Actor)
                FILTER(LANG(?label) = "en")
            }
            UNION
            {
                # Recherche par label
                ?actor rdfs:label ?label .
                ?actor rdf:type ?type .
                FILTER(?type = dbo:Person || ?type = dbo:Actor)
                FILTER(LANG(?label) = "en")
                FILTER(REGEX(?label, "^${actorName}$", "i"))
            }
            UNION
            {
                # Recherche partielle par label
                ?actor rdfs:label ?label .
                ?actor rdf:type dbo:Person .
                FILTER(LANG(?label) = "en")
                FILTER(REGEX(?label, "${actorName}", "i"))
            }
        }
        LIMIT 10
    `;

    try {
        const results = await executeQuery(query);
        
        if (results.length === 0) {
            return null;
        }
        
        const exactMatch = results.find(r => 
            r.label.toLowerCase() === actorName.toLowerCase()
        );
        
        return exactMatch || results[0];
    } catch (error) {
        console.error('Erreur lors de la recherche de l\'acteur:', error);
        throw error;
    }
}

/**
 * Récupère tous les films dans lesquels un acteur a joué
 * @param {string} actorUri - URI DBpedia de l'acteur
 * @returns {Promise<Array>} - Liste des URIs des films
 */
export async function getActorMovies(actorUri) {
    const query = `
        PREFIX dbo: <http://dbpedia.org/ontology/>
        PREFIX dbr: <http://dbpedia.org/resource/>
        PREFIX dbp: <http://dbpedia.org/property/>
        
        SELECT DISTINCT ?movie WHERE {
            {
                <${actorUri}> dbo:starring ?movie .
            } UNION {
                ?movie dbo:starring <${actorUri}> .
            } UNION {
                <${actorUri}> dbp:starring ?movie .
            } UNION {
                ?movie dbp:starring <${actorUri}> .
            }
            
            ?movie a dbo:Film .
        }
        LIMIT 200
    `;

    try {
        const results = await executeQuery(query);
        return results.map(r => r.movie);
    } catch (error) {
        console.error('Erreur lors de la récupération des films:', error);
        throw error;
    }
}

/**
 * Vérifie si deux acteurs ont joué dans un film commun
 * @param {string} actor1Uri - URI du premier acteur
 * @param {string} actor2Uri - URI du second acteur
 * @returns {Promise<Object|null>} - Objet avec le film commun ou null
 */
export async function haveCommonMovie(actor1Uri, actor2Uri) {
    const query = `
        PREFIX dbo: <http://dbpedia.org/ontology/>
        PREFIX dbp: <http://dbpedia.org/property/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        SELECT DISTINCT ?movie ?movieLabel WHERE {
            # Films de l'acteur 1
            {
                {
                    <${actor1Uri}> dbo:starring ?movie .
                } UNION {
                    ?movie dbo:starring <${actor1Uri}> .
                } UNION {
                    <${actor1Uri}> dbp:starring ?movie .
                } UNION {
                    ?movie dbp:starring <${actor1Uri}> .
                }
            }
            
            # Films de l'acteur 2
            {
                {
                    <${actor2Uri}> dbo:starring ?movie .
                } UNION {
                    ?movie dbo:starring <${actor2Uri}> .
                } UNION {
                    <${actor2Uri}> dbp:starring ?movie .
                } UNION {
                    ?movie dbp:starring <${actor2Uri}> .
                }
            }
            
            ?movie a dbo:Film ;
                   rdfs:label ?movieLabel .
            
            FILTER(LANG(?movieLabel) = "en")
        }
        LIMIT 20
    `;

    try {
        const results = await executeQuery(query);
        
        if (results.length === 0) {
            return null;
        }
        
        return {
            movie: results[0].movie,
            movieLabel: results[0].movieLabel,
            allMovies: results
        };
    } catch (error) {
        console.error('Erreur lors de la vérification des films communs:', error);
        throw error;
    }
}

/**
 * Exécute une requête SPARQL sur DBpedia
 * @param {string} query - Requête SPARQL à exécuter
 * @returns {Promise<Array>} - Résultats de la requête
 */
async function executeQuery(query) {
    const url = DBPEDIA_ENDPOINT + '?query=' + encodeURIComponent(query) + '&format=json';
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        return data.results.bindings.map(binding => {
            const result = {};
            for (const key in binding) {
                result[key] = binding[key].value;
            }
            return result;
        });
    } catch (error) {
        console.error('Erreur lors de l\'exécution de la requête:', error);
        throw error;
    }
}

/**
 * Récupère des informations détaillées sur un acteur
 * @param {string} actorUri - URI de l'acteur
 * @returns {Promise<Object>} - Informations sur l'acteur
 */
export async function getActorInfo(actorUri) {
    const query = `
        PREFIX dbo: <http://dbpedia.org/ontology/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX dbp: <http://dbpedia.org/property/>
        
        SELECT ?label ?abstract ?birthDate WHERE {
            <${actorUri}> rdfs:label ?label .
            OPTIONAL { <${actorUri}> dbo:abstract ?abstract }
            OPTIONAL { <${actorUri}> dbo:birthDate ?birthDate }
            
            FILTER(LANG(?label) = "en" || LANG(?label) = "fr")
            FILTER(!BOUND(?abstract) || LANG(?abstract) = "en" || LANG(?abstract) = "fr")
        }
        LIMIT 1
    `;

    try {
        const results = await executeQuery(query);
        return results[0] || null;
    } catch (error) {
        console.error('Erreur lors de la récupération des infos de l\'acteur:', error);
        throw error;
    }
}
