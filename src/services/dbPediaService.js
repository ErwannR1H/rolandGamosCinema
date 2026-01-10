/**
 * Service de requêtes SPARQL vers DBpedia
 */

const DBPEDIA_ENDPOINT = 'https://dbpedia.org/sparql';

/**
 * Exécute une requête SPARQL sur DBpedia
 * @param {string} query - Requête SPARQL à exécuter
 * @returns {Promise<Array>} - Résultats de la requête
 */
async function executeQuery(query) {
    const url = DBPEDIA_ENDPOINT + '?query=' + encodeURIComponent(query) + '&format=json';
    
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/sparql-results+json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP DBpedia: ${response.status}`);
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
        console.error('Erreur DBpedia:', error);
        throw error;
    }
}

/**
 * Recherche un acteur sur DBpedia
 * @param {string} actorName - Nom de l'acteur
 * @returns {Promise<Object|null>}
 */
export async function findActorOnDBpedia(actorName) {
    const resourceName = actorName.replace(/ /g, '_');
    const safeActorName = actorName.replace(/([\\^$.*+?()[\]{}|])/g, '\\$1');
    
    const query = `
        PREFIX dbo: <http://dbpedia.org/ontology/>
        PREFIX dbr: <http://dbpedia.org/resource/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
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
        
        // Recherche d'une correspondance exacte ou retourne le premier résultat
        const exactMatch = results.find(r => 
            r.label.toLowerCase() === actorName.toLowerCase()
        );
        
        return exactMatch || results[0];
    } catch (error) {
        console.error('Erreur recherche acteur DBpedia:', error);
        throw error;
    }
}

/**
 * Vérifie si deux acteurs ont joué dans un film commun sur DBpedia
 * @param {string} actor1Uri - URI du premier acteur
 * @param {string} actor2Uri - URI du second acteur
 * @returns {Promise<Object|null>}
 */
export async function findCommonMovieOnDBpedia(actor1Uri, actor2Uri) {
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
            
            OPTIONAL { 
                ?movie rdfs:label ?movieLabel .
                FILTER(LANG(?movieLabel) = "en" || LANG(?movieLabel) = "fr")
            }
        }
        LIMIT 50
    `;

    try {
        const results = await executeQuery(query);
        
        if (results.length === 0) {
            return null;
        }
        
        return {
            movie: results[0].movie,
            movieLabel: results[0].movieLabel,
            source: 'DBpedia'
        };
    } catch (error) {
        console.error('Erreur vérification films communs DBpedia:', error);
        throw error;
    }
}
