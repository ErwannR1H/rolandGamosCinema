/**
 * Service de requêtes vers Wikidata
 * Utilise l'API Wikibase Search et SPARQL Query Service
 */

import { getCachedOrFetch } from './cacheService.js';

const WIKIDATA_SEARCH_API = 'https://www.wikidata.org/w/api.php';
const WIKIDATA_SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

/**
 * Recherche un acteur sur Wikidata avec tri par popularité
 * Utilise l'API de recherche puis vérifie tous les résultats avec leur popularité
 * @param {string} actorName - Nom de l'acteur à rechercher
 * @returns {Promise<Object|null>}
 */
export async function findActorOnWikidata(actorName) {
    const cacheKey = `actor_search:${actorName.toLowerCase()}`;
    
    return await getCachedOrFetch(cacheKey, async () => {
        try {
            // Étape 1: Rechercher l'acteur via l'API de recherche Wikidata (rapide)
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

            // Étape 2: Vérifier tous les résultats en UNE SEULE requête SPARQL avec tri
            const entityIds = searchData.search.map(r => r.id);
            const bestMatch = await checkMultipleActorsWithPopularity(entityIds);
            
            if (!bestMatch) {
                console.log(`Aucun acteur trouvé pour "${actorName}"`);
                return null;
            }

            // bestMatch est directement l'acteur le plus populaire
            const searchResult = searchData.search.find(r => r.id === bestMatch.id);
            console.log(`✅ Acteur trouvé: ${searchResult.label} (${bestMatch.id}) - ${bestMatch.popularity} sitelinks`);
            
            return {
                actor: `http://www.wikidata.org/entity/${bestMatch.id}`,
                label: searchResult.label,
                description: searchResult.description || '',
                wikidataUrl: `https://www.wikidata.org/wiki/${bestMatch.id}`,
                imageUrl: bestMatch.imageUrl,
                popularity: bestMatch.popularity
            };

        } catch (error) {
            console.error('Erreur recherche acteur Wikidata:', error);
            throw error;
        }
    });
}

/**
 * Vérifie plusieurs entités Wikidata en une seule requête avec tri par popularité
 * Retourne uniquement l'acteur le plus populaire parmi les entités fournies
 * @param {string[]} entityIds - Tableau d'IDs d'entités Wikidata (ex: ['Q123', 'Q456'])
 * @returns {Promise<{id: string, popularity: number, imageUrl: string|null}|null>}
 */
async function checkMultipleActorsWithPopularity(entityIds) {
    const cacheKey = `check_actors_batch:${entityIds.join(',')}`;
    
    return await getCachedOrFetch(cacheKey, async () => {
        // Construire la liste VALUES pour SPARQL
        const valuesClause = entityIds.map(id => `wd:${id}`).join(' ');
        
        const query = `
            SELECT ?entity ?sitelinks ?image WHERE {
                # Liste des entités à vérifier
                VALUES ?entity { ${valuesClause} }
                
                # Vérifier que c'est un acteur
                {
                    ?entity wdt:P106 wd:Q33999 .  # acteur/actrice
                } UNION {
                    ?entity wdt:P106 wd:Q10800557 .  # acteur de cinéma
                } UNION {
                    ?entity wdt:P106 wd:Q10798782 .  # acteur de télévision
                } UNION {
                    ?entity wdt:P106 wd:Q948329 .  # acteur de théâtre
                }
                
                # Récupérer la popularité
                ?entity wikibase:sitelinks ?sitelinks .
                
                # Récupérer l'image (optionnel)
                OPTIONAL { ?entity wdt:P18 ?image . }
            }
            ORDER BY DESC(?sitelinks)  # Trier par popularité décroissante
            LIMIT 1  # Récupérer uniquement le plus populaire
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
            
            if (data.results.bindings.length === 0) {
                return null;
            }
            
            const result = data.results.bindings[0];
            return {
                id: result.entity.value.split('/').pop(),
                popularity: parseInt(result.sitelinks.value),
                imageUrl: result.image?.value || null
            };
        } catch (error) {
            console.error('Erreur vérification acteurs batch:', error);
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
                SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
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
 * Cache des acteurs populaires chargé depuis le fichier JSON
 */
let popularActorsCache = null;
let cacheGenerationAttempted = false;

/**
 * Charge le cache des acteurs populaires depuis le fichier JSON
 * Si le fichier n'existe pas, affiche un message pour générer le cache
 */
async function loadPopularActorsCache() {
    if (popularActorsCache !== null) {
        return popularActorsCache;
    }

    try {
        const response = await fetch('/popular-actors.json');
        if (!response.ok) {
            if (!cacheGenerationAttempted) {
                cacheGenerationAttempted = true;
                console.warn('⚠️ Cache des acteurs populaires non trouvé.');
                console.info('💡 Pour améliorer les performances, exécutez: npm run generate-cache');
                console.info('📝 Utilisation de la méthode SPARQL (plus lente)...');
            }
            return null;
        }
        const data = await response.json();
        
        // Filtrer uniquement les acteurs avec image
        popularActorsCache = data.filter(actor => actor.imageUrl);
        
        console.log(`✅ Cache chargé: ${popularActorsCache.length} acteurs populaires disponibles`);
        return popularActorsCache;
    } catch (error) {
        console.warn('Erreur chargement cache acteurs:', error);
        return null;
    }
}

/**
 * Récupère un acteur aléatoire depuis Wikidata
 * Utilise le cache d'acteurs populaires si disponible
 * @returns {Promise<Object|null>}
 */
export async function getRandomActor() {
    // Essayer d'abord avec le cache
    const cache = await loadPopularActorsCache();
    
    if (cache && cache.length > 0) {
        // Choisir un acteur aléatoire depuis le cache
        const randomIndex = Math.floor(Math.random() * cache.length);
        const actor = cache[randomIndex];
        console.log(`🎬 Acteur depuis cache: ${actor.label}`);
        return actor;
    }

    // Fallback: requête SPARQL si pas de cache
    console.log('⚠️ Utilisation de la méthode SPARQL (plus lente)');
    
    try {
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
    const MAX_RETRIES = 3; 
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`Génération d'un défi aléatoire (tentative ${attempt}/${MAX_RETRIES})...`);
            
            // 1. Choisir un acteur de départ aléatoire
            const startActor = await getRandomActor();
            if (!startActor) {
                console.error('Impossible de récupérer un acteur de départ');
                continue;
            }
            
            console.log(`Acteur de départ: ${startActor.label}`);
            
            // 2. Déterminer la longueur du chemin aléatoire
            const pathLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
            console.log(`Longueur du chemin: ${pathLength} étapes`);
            
            // 3. Construire le chemin aléatoire
            const path = [];
            let currentActor = startActor;
            let pathCompleted = false;
            
            for (let i = 0; i < pathLength; i++) {
                // Récupérer les films de l'acteur actuel
                const films = await getActorFilms(currentActor.actor);
                
                if (!films || films.length === 0) {
                    console.warn(`Aucun film trouvé pour ${currentActor.label} à l'étape ${i + 1}`);
                    // Si on a au moins 3 étapes (minLength), on s'arrête là
                    if (path.length >= minLength - 1) {
                        console.log(`Arrêt du chemin à ${path.length + 1} étapes (minimum atteint)`);
                        pathCompleted = true;
                        break;
                    } else if (i === 0) {
                        // Si c'est l'acteur de départ qui pose problème, essayer un autre acteur
                        console.warn(`L'acteur de départ ${startActor.label} n'a pas de films, essai d'un autre acteur...`);
                        break; // Sort de la boucle for et continue avec une nouvelle tentative
                    } else {
                        // Sinon, on abandonne cette tentative
                        console.error(`Chemin trop court (${path.length} étapes), recommencer`);
                        break;
                    }
                }
                
                // Choisir un film aléatoire
                const randomFilm = films[Math.floor(Math.random() * films.length)];
                
                // Récupérer les co-acteurs de ce film
                const coActors = await getFilmActors(randomFilm.movie, currentActor.actor);
                
                if (!coActors || coActors.length === 0) {
                    console.warn(`Aucun co-acteur trouvé dans ${randomFilm.title} à l'étape ${i + 1}`);
                    // Si on a au moins 3 étapes (minLength), on s'arrête là
                    if (path.length >= minLength - 1) {
                        console.log(`Arrêt du chemin à ${path.length + 1} étapes (minimum atteint)`);
                        pathCompleted = true;
                        break;
                    } else if (i === 0) {
                        // Si c'est l'acteur de départ qui pose problème, essayer un autre acteur
                        console.warn(`L'acteur de départ ${startActor.label} n'a pas de co-acteurs, essai d'un autre acteur...`);
                        break; // Sort de la boucle for et continue avec une nouvelle tentative
                    } else {
                        // Sinon, on abandonne cette tentative
                        console.error(`Chemin trop court (${path.length} étapes), recommencer`);
                        break;
                    }
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
                
                // Si on a atteint la longueur demandée
                if (i === pathLength - 1) {
                    pathCompleted = true;
                }
            }
            
            // Vérifier si le chemin est valide
            if (!pathCompleted || path.length < minLength - 1) {
                console.warn(`Chemin invalide (${path.length} étapes), nouvelle tentative...`);
                continue;
            }
            
            // 4. Le dernier acteur du chemin est l'acteur cible
            const endActor = currentActor;
            
            console.log(`Défi généré: ${startActor.label} -> ${endActor.label} (${path.length + 1} étapes)`);
            
            return {
                startActor,
                endActor,
                path,
                pathLength: path.length + 1
            };
        } catch (error) {
            console.error(`Erreur lors de la tentative ${attempt}:`, error);
            if (attempt === MAX_RETRIES) {
                throw new Error('Impossible de générer un défi après plusieurs tentatives. Veuillez réessayer.');
            }
        }
    }
    
    return null;
}

/**
 * Récupère tous les films dans lesquels un acteur a joué (avec détails)
 * @param {string} actorUri - URI de l'acteur
 * @param {number} limit - Nombre maximum de films à retourner (par défaut 50)
 * @returns {Promise<Array>}
 */
export async function getActorFilms(actorUri, limit = 50) {
    const actorId = actorUri.split('/').pop();
    const cacheKey = `actor_films_details:${actorId}:${limit}`;
    
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
                LIMIT ${limit}
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
                    
                    # Exiger une image (pas OPTIONAL)
                    ?actor wdt:P18 ?image .
                    
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
                    imageUrl: b.image.value,
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
        
        // Utiliser une longueur fixe plus courte pour être plus rapide
        const pathLength = Math.min(4, maxLength); // Maximum 4 étapes pour la rapidité
        console.log(`Longueur du chemin: ${pathLength} étapes`);
        
        const path = [];
        let currentActor = startActor;
        
        for (let i = 0; i < pathLength - 1; i++) {
            // Récupérer les films de l'acteur actuel
            const films = await getActorFilms(currentActor.actor);
            
            if (!films || films.length === 0) {
                console.error(`Aucun film trouvé pour ${currentActor.label}`);
                // Essayer avec un chemin plus court
                if (pathLength > 2) {
                    return await generatePathBetweenActors(startActor, targetActor, pathLength - 1);
                }
                return null;
            }
            
            // Choisir un film aléatoire
            const randomFilm = films[Math.floor(Math.random() * films.length)];
            
            // Récupérer les co-acteurs de ce film
            const coActors = await getFilmActors(randomFilm.movie, currentActor.actor);
            
            if (!coActors || coActors.length === 0) {
                console.error(`Aucun co-acteur trouvé dans ${randomFilm.title}`);
                // Essayer avec un autre film
                if (films.length > 1) {
                    const otherFilm = films[Math.floor(Math.random() * films.length)];
                    const otherCoActors = await getFilmActors(otherFilm.movie, currentActor.actor);
                    if (otherCoActors && otherCoActors.length > 0) {
                        const nextActor = otherCoActors[Math.floor(Math.random() * otherCoActors.length)];
                        path.push({
                            currentActor: currentActor.actor,
                            currentActorLabel: currentActor.label,
                            film: otherFilm,
                            nextActor: nextActor
                        });
                        currentActor = nextActor;
                        continue;
                    }
                }
                // Sinon essayer avec un chemin plus court
                if (pathLength > 2) {
                    return await generatePathBetweenActors(startActor, targetActor, pathLength - 1);
                }
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

/**
 * Génère un chemin aléatoire depuis un acteur de départ spécifique
 * L'acteur d'arrivée est découvert naturellement à la fin du chemin
 * @param {Object} startActor - Acteur de départ {actor, label, imageUrl, wikidataUrl}
 * @param {number} minLength - Longueur minimale du chemin (par défaut 3)
 * @param {number} maxLength - Longueur maximale du chemin (par défaut 8)
 * @returns {Promise<Object|null>} - {startActor, endActor, path}
 */
export async function generateRandomChallengeFromStart(startActor, minLength = 3, maxLength = 8) {
    const MAX_RETRIES = 3;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`Génération d'un chemin aléatoire depuis ${startActor.label} (tentative ${attempt}/${MAX_RETRIES})...`);
            
            // Déterminer la longueur du chemin aléatoire
            const pathLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
            console.log(`Longueur du chemin: ${pathLength} étapes`);
            
            // Construire le chemin aléatoire
            const path = [];
            let currentActor = startActor;
            let pathCompleted = false;
            
            for (let i = 0; i < pathLength; i++) {
                // Récupérer les films de l'acteur actuel
                const films = await getActorFilms(currentActor.actor);
                
                if (!films || films.length === 0) {
                    console.warn(`Aucun film trouvé pour ${currentActor.label} à l'étape ${i + 1}`);
                    if (path.length >= minLength - 1) {
                        console.log(`Arrêt du chemin à ${path.length + 1} étapes (minimum atteint)`);
                        pathCompleted = true;
                        break;
                    } else {
                        console.error(`Chemin trop court (${path.length} étapes), recommencer`);
                        break;
                    }
                }
                
                // Choisir un film aléatoire
                const randomFilm = films[Math.floor(Math.random() * films.length)];
                
                // Récupérer les co-acteurs de ce film
                const coActors = await getFilmActors(randomFilm.movie, currentActor.actor);
                
                if (!coActors || coActors.length === 0) {
                    console.warn(`Aucun co-acteur trouvé dans ${randomFilm.title} à l'étape ${i + 1}`);
                    if (path.length >= minLength - 1) {
                        console.log(`Arrêt du chemin à ${path.length + 1} étapes (minimum atteint)`);
                        pathCompleted = true;
                        break;
                    } else {
                        console.error(`Chemin trop court (${path.length} étapes), recommencer`);
                        break;
                    }
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
                
                // Si on a atteint la longueur demandée
                if (i === pathLength - 1) {
                    pathCompleted = true;
                }
            }
            
            // Vérifier si le chemin est valide
            if (!pathCompleted || path.length < minLength - 1) {
                console.warn(`Chemin invalide (${path.length} étapes), nouvelle tentative...`);
                continue;
            }
            
            // Le dernier acteur du chemin est l'acteur d'arrivée découvert
            const endActor = currentActor;
            
            console.log(`Chemin généré: ${startActor.label} -> ${endActor.label} (${path.length + 1} étapes)`);
            
            return {
                startActor,
                endActor,
                path,
                pathLength: path.length + 1
            };
        } catch (error) {
            console.error(`Erreur lors de la tentative ${attempt}:`, error);
            if (attempt === MAX_RETRIES) {
                throw new Error('Impossible de générer un chemin depuis cet acteur. Veuillez réessayer.');
            }
        }
    }
    
    return null;
}
