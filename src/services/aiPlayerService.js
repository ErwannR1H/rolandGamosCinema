/**
 * Service IA pour le mode solo
 * Trouve des acteurs valides pour répondre au joueur
 */

const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

/**
 * Trouve un acteur valide qui partage un film avec le dernier acteur
 * @param {string} lastActorUri - URI Wikidata du dernier acteur
 * @param {Array<string>} excludedActorUris - Liste des URIs d'acteurs déjà utilisés
 * @returns {Promise<Object|null>} - Acteur trouvé avec film commun ou null
 */
export async function findValidActorResponse(lastActorUri, excludedActorUris = []) {
    try {
        const lastActorId = lastActorUri.split('/').pop();

        // Construire le filtre pour exclure les acteurs déjà utilisés
        const excludeFilters = excludedActorUris
            .map(uri => `wd:${uri.split('/').pop()}`)
            .join(', ');

        const excludeClause = excludedActorUris.length > 0
            ? `FILTER(?coActor NOT IN (${excludeFilters}))`
            : '';

        const query = `
            SELECT DISTINCT ?coActor ?coActorLabel ?movie ?movieLabel ?image WHERE {
                # Trouver un film avec le dernier acteur
                ?movie wdt:P161 wd:${lastActorId} .
                
                # Trouver les co-acteurs de ce film
                ?movie wdt:P161 ?coActor .
                
                # Vérifier que c'est un acteur
                ?coActor wdt:P106 ?occupation .
                FILTER(?occupation IN (wd:Q33999, wd:Q10800557, wd:Q10798782))
                
                # Exclure le dernier acteur lui-même
                FILTER(?coActor != wd:${lastActorId})
                
                # Exclure les acteurs déjà utilisés
                ${excludeClause}
                
                # Filtre pour ne garder que les acteurs célèbres
                ?coActor wikibase:sitelinks ?sitelinks .
                FILTER(?sitelinks > 30)
                
                # Le film doit être un film ou une série
                {
                    ?movie wdt:P31/wdt:P279* wd:Q11424 .
                } UNION {
                    ?movie wdt:P31/wdt:P279* wd:Q5398426 .
                }
                
                # Récupérer l'image si disponible
                OPTIONAL { ?coActor wdt:P18 ?image . }
                
                SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
            }
            LIMIT 30
        `;

        const url = `${WIKIDATA_SPARQL_ENDPOINT}?` + new URLSearchParams({
            query: query,
            format: 'json'
        });

        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Erreur SPARQL: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const results = data.results.bindings;

        if (results.length === 0) {
            console.log('🤖 IA: Aucun co-acteur trouvé');
            return null;
        }

        // Choisir un acteur au hasard parmi les résultats
        const randomIndex = Math.floor(Math.random() * results.length);
        const chosen = results[randomIndex];

        console.log(`🤖 IA choisit: ${chosen.coActorLabel.value} (via ${chosen.movieLabel.value})`);

        return {
            actor: chosen.coActor.value,
            label: chosen.coActorLabel.value,
            imageUrl: chosen.image ? chosen.image.value : null,
            commonMovie: {
                uri: chosen.movie.value,
                label: chosen.movieLabel.value
            }
        };
    } catch (error) {
        console.error('Erreur IA:', error);
        return null;
    }
}

/**
 * Retourne 2-3 acteurs valides comme indices pour aider le joueur
 * @param {string} lastActorUri - URI Wikidata du dernier acteur
 * @param {Array<string>} excludedActorUris - Liste des URIs d'acteurs déjà utilisés
 * @returns {Promise<Array<Object>>} - Liste de 2-3 acteurs valides
 */
export async function getHints(lastActorUri, excludedActorUris = []) {
    try {
        const lastActorId = lastActorUri.split('/').pop();

        const excludeFilters = excludedActorUris
            .map(uri => `wd:${uri.split('/').pop()}`)
            .join(', ');

        const excludeClause = excludedActorUris.length > 0
            ? `FILTER(?coActor NOT IN (${excludeFilters}))`
            : '';

        const query = `
            SELECT DISTINCT ?coActor ?coActorLabel ?movie ?movieLabel WHERE {
                ?movie wdt:P161 wd:${lastActorId} .
                ?movie wdt:P161 ?coActor .
                
                ?coActor wdt:P106 ?occupation .
                FILTER(?occupation IN (wd:Q33999, wd:Q10800557, wd:Q10798782))
                
                FILTER(?coActor != wd:${lastActorId})
                ${excludeClause}
                
                # Filtre pour acteurs célèbres
                ?coActor wikibase:sitelinks ?sitelinks .
                FILTER(?sitelinks > 40)
                
                {
                    ?movie wdt:P31/wdt:P279* wd:Q11424 .
                } UNION {
                    ?movie wdt:P31/wdt:P279* wd:Q5398426 .
                }
                
                SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
            }
            LIMIT 20
        `;

        const url = `${WIKIDATA_SPARQL_ENDPOINT}?` + new URLSearchParams({
            query: query,
            format: 'json'
        });

        const response = await fetch(url);
        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        const results = data.results.bindings;

        if (results.length === 0) {
            return [];
        }

        // Sélectionner 3 acteurs aléatoires parmi les résultats
        const shuffled = results.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);

        return selected.map(r => ({
            label: r.coActorLabel.value,
            movie: r.movieLabel.value
        }));
    } catch (error) {
        console.error('Erreur récupération indices:', error);
        return [];
    }
}

/**
 * Génère un premier acteur aléatoire pour commencer la partie
 * @returns {Promise<Object|null>} - Un acteur célèbre aléatoire
 */
export async function getRandomStartingActor() {
    try {
        const query = `
            SELECT DISTINCT ?actor ?actorLabel ?image WHERE {
                ?actor wdt:P106 wd:Q33999 .  # Est un acteur
                ?actor wdt:P18 ?image .       # A une image (filtre les moins connus)
                ?actor wikibase:sitelinks ?sitelinks .
                FILTER(?sitelinks > 50)       # Au moins 50 liens wiki (acteurs connus)
                
                SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
            }
            LIMIT 100
        `;

        const url = `${WIKIDATA_SPARQL_ENDPOINT}?` + new URLSearchParams({
            query: query,
            format: 'json'
        });

        const response = await fetch(url);
        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const results = data.results.bindings;

        if (results.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * results.length);
        const chosen = results[randomIndex];

        return {
            actor: chosen.actor.value,
            label: chosen.actorLabel.value,
            imageUrl: chosen.image ? chosen.image.value : null
        };
    } catch (error) {
        console.error('Erreur obtention acteur initial:', error);
        return null;
    }
}
