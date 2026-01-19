/**
 * Service de requêtes vers Wikidata
 * Utilise l'API Wikibase Search et SPARQL Query Service
 */

import { getCachedOrFetch } from './cacheService.js';

const WIKIDATA_SEARCH_API = 'https://www.wikidata.org/w/api.php';
const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

/**
 * Recherche un acteur sur Wikidata en utilisant l'API de recherche
 * @param {string} actorName - Nom de l'acteur à rechercher
 * @returns {Promise<Object|null>}
 */
export async function findActorOnWikidata(actorName) {
    const cacheKey = `actor_search:${actorName.toLowerCase()}`;
    
    return await getCachedOrFetch(cacheKey, async () => {
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
    });
}

/**
 * Vérifie si une entité Wikidata est un acteur
 * @param {string} entityId - ID de l'entité Wikidata (ex: Q123)
 * @returns {Promise<boolean>}
 */
async function checkIfActor(entityId) {
    const cacheKey = `check_actor:${entityId}`;
    
    return await getCachedOrFetch(cacheKey, async () => {
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
    });
}

/**
 * Récupère l'image d'un acteur depuis Wikidata
 * @param {string} entityId - ID de l'entité Wikidata (ex: Q123)
 * @returns {Promise<string|null>}
 */
async function getActorImage(entityId) {
    const cacheKey = `actor_image:${entityId}`;
    
    return await getCachedOrFetch(cacheKey, async () => {
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
    });
}

/**
 * Récupère TOUS les films d'un acteur (pour comparaison en JS)
 * @param {string} actorUri - URI de l'acteur
 * @returns {Promise<Set<string>>} - Set d'URIs de films
 */
export async function getActorFilmsSet(actorUri) {
    const actorId = actorUri.split('/').pop();
    const cacheKey = `actor_films:${actorId}`;
    
    // Récupérer l'array depuis le cache, puis convertir en Set
    const filmUrisArray = await getCachedOrFetch(cacheKey, async () => {
        const query = `
            SELECT DISTINCT ?movie WHERE {
                ?movie wdt:P161 wd:${actorId} .
                
                {
                    ?movie wdt:P31/wdt:P279* wd:Q11424 .
                } UNION {
                    ?movie wdt:P31/wdt:P279* wd:Q5398426 .
                }
            }
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
        const filmUris = data.results.bindings.map(b => b.movie.value);
        
        // Stocker un Array (JSON-sérialisable) au lieu d'un Set
        return filmUris;
    });
    
    // Convertir l'array en Set pour les opérations d'intersection
    // Gérer le cas où filmUrisArray est null ou undefined
    if (!filmUrisArray || !Array.isArray(filmUrisArray)) {
        return new Set();
    }
    return new Set(filmUrisArray);
}

/**
 * Récupère les détails d'un film (titre, poster)
 * @param {string} movieId - ID Wikidata du film
 * @returns {Promise<Object>}
 */
async function getMovieDetails(movieId) {
    const cacheKey = `movie_details:${movieId}`;
    
    return await getCachedOrFetch(cacheKey, async () => {
        const query = `
            SELECT ?movieLabel ?poster WHERE {
                BIND(wd:${movieId} AS ?movie)
                OPTIONAL { ?movie wdt:P18 ?poster . }
                SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
            }
        `;
        
        const url = `${WIKIDATA_SPARQL_ENDPOINT}?` + new URLSearchParams({
            query: query,
            format: 'json'
        });
        
        const response = await fetch(url);
        if (!response.ok) {
            return { title: 'Film inconnu', poster: null };
        }
        
        const data = await response.json();
        const result = data.results.bindings[0];
        
        return {
            title: result?.movieLabel?.value || 'Film inconnu',
            poster: result?.poster?.value || null
        };
    });
}

/**
 * Vérifie si deux acteurs ont joué dans un film commun sur Wikidata
 * Version optimisée avec cache et intersection JS
 * @param {string} actor1Uri - URI du premier acteur
 * @param {string} actor2Uri - URI du second acteur
 * @returns {Promise<Object|null>}
 */
export async function findCommonMovieOnWikidata(actor1Uri, actor2Uri) {
    try {
        // Vérifier que les URIs sont valides
        if (!actor1Uri || !actor2Uri) {
            console.error('URIs invalides:', { actor1Uri, actor2Uri });
            return null;
        }
        
        // Extraire l'ID Wikidata de l'URI
        const actor1Id = actor1Uri.split('/').pop();
        const actor2Id = actor2Uri.split('/').pop();
        
        console.log(`Recherche de films communs entre ${actor1Id} et ${actor2Id}`);
        
        // Récupérer les sets de films (depuis le cache si possible)
        const [films1, films2] = await Promise.all([
            getActorFilmsSet(actor1Uri),
            getActorFilmsSet(actor2Uri)
        ]);
        
        // Calculer l'intersection en JS
        const commonFilms = [...films1].filter(film => films2.has(film));
        
        if (commonFilms.length === 0) {
            console.log('Aucun film commun trouvé');
            return null;
        }
        
        console.log(`${commonFilms.length} film(s) commun(s) trouvé(s)`);
        
        // Récupérer les détails du premier film commun
        const movieUri = commonFilms[0];
        const movieId = movieUri.split('/').pop();
        
        const movieDetails = await getMovieDetails(movieId);
        
        return {
            movie: movieUri,
            title: movieDetails.title,
            movieLabel: movieDetails.title,
            moviePosterUrl: movieDetails.poster,
            source: 'Wikidata (cached)'
        };
    } catch (error) {
        console.error('Erreur vérification films communs Wikidata:', error);
        throw error;
    }
}

/**
 * Récupère un acteur aléatoire depuis Wikidata
 * @returns {Promise<Object|null>}
 */
export async function getRandomActor() {
    // Note: Ne pas cacher cette fonction car elle doit retourner un acteur différent à chaque appel
    try {
        // Requête SPARQL pour obtenir un acteur aléatoire
        // On cherche des acteurs célèbres avec une photo
        const query = `
            SELECT ?actor ?actorLabel ?image WHERE {
                # L'entité doit être un acteur
                ?actor wdt:P106 wd:Q33999 .
                
                # Doit avoir une image
                ?actor wdt:P18 ?image .
                
                # Doit avoir une date de naissance (pour filtrer les vrais acteurs)
                ?actor wdt:P569 ?birthDate .
                
                # Doit avoir joué dans au moins un film
                ?movie wdt:P161 ?actor .
                ?movie wdt:P31/wdt:P279* wd:Q11424 .
                
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
            console.warn(`Erreur SPARQL random actor: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const results = data.results.bindings;

        if (results.length === 0) {
            console.log('Aucun acteur aléatoire trouvé');
            return null;
        }

        // Sélectionner un acteur au hasard parmi les résultats
        const randomIndex = Math.floor(Math.random() * results.length);
        const randomActor = results[randomIndex];
        
        const actorId = randomActor.actor.value.split('/').pop();

        return {
            actor: randomActor.actor.value,
            label: randomActor.actorLabel.value,
            description: '',
            wikidataUrl: `https://www.wikidata.org/wiki/${actorId}`,
            imageUrl: randomActor.image ? randomActor.image.value : null
        };
    } catch (error) {
        console.error('Erreur récupération acteur aléatoire:', error);
        return null;
    }
}

/**
 * Génère un défi aléatoire avec un chemin pré-calculé
 * @param {number} minLength - Longueur minimale du chemin (par défaut 3)
 * @param {number} maxLength - Longueur maximale du chemin (par défaut 8)
 * @returns {Promise<Object|null>} - {startActor, endActor, path}
 */
export async function generateRandomChallenge(minLength = 3, maxLength = 8) {
    try {
        console.log('Génération d\'un défi aléatoire...');
        
        // 1. Choisir un acteur de départ aléatoire
        const startActor = await getRandomActor();
        if (!startActor) {
            console.error('Impossible de récupérer un acteur de départ');
            return null;
        }
        
        console.log(`Acteur de départ: ${startActor.label}`);
        
        // 2. Déterminer la longueur du chemin aléatoire
        const pathLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
        console.log(`Longueur du chemin: ${pathLength} étapes`);
        
        // 3. Construire le chemin aléatoire
        const path = [];
        let currentActor = startActor;
        
        for (let i = 0; i < pathLength; i++) {
            // Récupérer les films de l'acteur actuel
            const films = await getActorFilms(currentActor.actor);
            
            if (!films || films.length === 0) {
                console.error(`Aucun film trouvé pour ${currentActor.label}`);
                return null;
            }
            
            // Choisir un film aléatoire
            const randomFilm = films[Math.floor(Math.random() * films.length)];
            
            // Récupérer les co-acteurs de ce film
            const coActors = await getFilmActors(randomFilm.movie, currentActor.actor);
            
            if (!coActors || coActors.length === 0) {
                console.error(`Aucun co-acteur trouvé dans ${randomFilm.title}`);
                return null;
            }
            
            // Choisir un co-acteur aléatoire
            const nextActor = coActors[Math.floor(Math.random() * coActors.length)];
            
            // Ajouter cette étape au chemin
            path.push({
                currentActor: currentActor.actor,
                currentActorLabel: currentActor.label,
                film: randomFilm,
                nextActor: nextActor
            });
            
            console.log(`Étape ${i + 1}: ${currentActor.label} -> ${randomFilm.title} -> ${nextActor.label}`);
            
            // Le prochain acteur devient l'acteur actuel
            currentActor = nextActor;
        }
        
        // 4. Le dernier acteur du chemin est l'acteur cible
        const endActor = currentActor;
        
        console.log(`Défi généré: ${startActor.label} -> ${endActor.label} (${pathLength} étapes)`);
        
        return {
            startActor,
            endActor,
            path,
            pathLength
        };
    } catch (error) {
        console.error('Erreur génération défi aléatoire:', error);
        return null;
    }
}

/**
 * Récupère tous les films dans lesquels un acteur a joué (avec détails)
 * @param {string} actorUri - URI de l'acteur
 * @returns {Promise<Array>}
 */
async function getActorFilms(actorUri) {
    const actorId = actorUri.split('/').pop();
    const cacheKey = `actor_films_details:${actorId}`;
    
    return await getCachedOrFetch(cacheKey, async () => {
        try {
            const query = `
                SELECT DISTINCT ?movie ?movieLabel WHERE {
                    ?movie wdt:P161 wd:${actorId} .
                    
                    {
                        ?movie wdt:P31/wdt:P279* wd:Q11424 .
                    } UNION {
                        ?movie wdt:P31/wdt:P279* wd:Q5398426 .
                    }
                    
                    SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
                }
                LIMIT 50
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
            return data.results.bindings.map(b => ({
                movie: b.movie.value,
                title: b.movieLabel.value
            }));
        } catch (error) {
            console.error('Erreur récupération films acteur:', error);
            return [];
        }
    });
}

/**
 * Récupère tous les acteurs d'un film (sauf l'acteur spécifié)
 * @param {string} movieUri - URI du film
 * @param {string} excludeActorUri - URI de l'acteur à exclure
 * @returns {Promise<Array>}
 */
async function getFilmActors(movieUri, excludeActorUri) {
    const movieId = movieUri.split('/').pop();
    const excludeActorId = excludeActorUri.split('/').pop();
    const cacheKey = `film_actors:${movieId}:exclude_${excludeActorId}`;
    
    return await getCachedOrFetch(cacheKey, async () => {
        try {
            const query = `
                SELECT DISTINCT ?actor ?actorLabel ?image WHERE {
                    wd:${movieId} wdt:P161 ?actor .
                    
                    FILTER(?actor != wd:${excludeActorId})
                    
                    ?actor wdt:P106 wd:Q33999 .
                    
                    OPTIONAL { ?actor wdt:P18 ?image . }
                    
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
            return data.results.bindings.map(b => {
                const actorId = b.actor.value.split('/').pop();
                return {
                    actor: b.actor.value,
                    label: b.actorLabel.value,
                    imageUrl: b.image ? b.image.value : null,
                    wikidataUrl: `https://www.wikidata.org/wiki/${actorId}`
                };
            });
        } catch (error) {
            console.error('Erreur récupération acteurs film:', error);
            return [];
        }
    });
}

/**
 * Génère un chemin aléatoire depuis un acteur de départ vers un acteur cible
 * @param {Object} startActor - Acteur de départ {actor, label, imageUrl, wikidataUrl}
 * @param {Object} targetActor - Acteur cible {actor, label, imageUrl, wikidataUrl}
 * @param {number} maxLength - Longueur maximale du chemin (par défaut 5)
 * @returns {Promise<Array|null>} - Tableau du chemin [{currentActor, film, nextActor}]
 */
export async function generatePathBetweenActors(startActor, targetActor, maxLength = 5) {
    try {
        console.log(`Génération d'un chemin de ${startActor.label} vers ${targetActor.label}...`);
        
        // Déterminer une longueur aléatoire entre 2 et maxLength
        const pathLength = Math.floor(Math.random() * (maxLength - 1)) + 2;
        console.log(`Longueur du chemin: ${pathLength} étapes`);
        
        const path = [];
        let currentActor = startActor;
        
        for (let i = 0; i < pathLength - 1; i++) {
            // Récupérer les films de l'acteur actuel
            const films = await getActorFilms(currentActor.actor);
            
            if (!films || films.length === 0) {
                console.error(`Aucun film trouvé pour ${currentActor.label}`);
                return null;
            }
            
            // Choisir un film aléatoire
            const randomFilm = films[Math.floor(Math.random() * films.length)];
            
            // Récupérer les co-acteurs de ce film
            const coActors = await getFilmActors(randomFilm.movie, currentActor.actor);
            
            if (!coActors || coActors.length === 0) {
                console.error(`Aucun co-acteur trouvé dans ${randomFilm.title}`);
                return null;
            }
            
            // Choisir un co-acteur aléatoire
            const nextActor = coActors[Math.floor(Math.random() * coActors.length)];
            
            // Ajouter cette étape au chemin
            path.push({
                currentActor: currentActor.actor,
                currentActorLabel: currentActor.label,
                film: randomFilm,
                nextActor: nextActor
            });
            
            console.log(`Étape ${i + 1}: ${currentActor.label} -> ${randomFilm.title} -> ${nextActor.label}`);
            
            // Le prochain acteur devient l'acteur actuel
            currentActor = nextActor;
        }
        
        // Dernière étape : trouver un film commun entre le dernier acteur et l'acteur cible
        const lastActor = currentActor;
        const finalMovie = await findCommonMovieOnWikidata(lastActor.actor, targetActor.actor);
        
        if (!finalMovie) {
            console.error(`Aucun film commun trouvé entre ${lastActor.label} et ${targetActor.label}`);
            // Essayer avec un chemin plus court
            if (pathLength > 2) {
                return await generatePathBetweenActors(startActor, targetActor, pathLength - 1);
            }
            return null;
        }
        
        // Ajouter la dernière étape
        path.push({
            currentActor: lastActor.actor,
            currentActorLabel: lastActor.label,
            film: finalMovie,
            nextActor: targetActor
        });
        
        console.log(`Dernière étape: ${lastActor.label} -> ${finalMovie.title} -> ${targetActor.label}`);
        console.log(`Chemin généré avec succès (${path.length} étapes)`);
        
        return path;
    } catch (error) {
        console.error('Erreur génération chemin entre acteurs:', error);
        return null;
    }
}
