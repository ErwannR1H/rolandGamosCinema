/**
 * Service orchestrateur qui interroge Wikidata
 * DBpedia est conservé dans dbPediaService.js pour usage futur
 */

import { improveActorNameForDBpedia } from './ollamaService.js';
import { findActorOnWikidata, findCommonMovieOnWikidata } from './wikidataService.js';

/**
 * Recherche un acteur en interrogeant Wikidata
 * @param {string} actorName - Nom de l'acteur à rechercher
 * @returns {Promise<Object|null>} - Objet contenant l'URI et le label de l'acteur, ou null
 */
export async function findActor(actorName) {
    console.log(`🔍 Recherche de: "${actorName}"`);
    
    // Étape 1 : Recherche directe sur Wikidata
    const directResult = await searchActor(actorName);
    if (directResult) {
        console.log(`✅ Trouvé directement sur Wikidata!`);
        return directResult;
    }
    
    // Étape 2 : Si échec, utiliser l'IA pour corriger le nom
    console.log(`❌ Pas trouvé directement, utilisation de l'IA...`);
    const improvedName = await improveActorNameForDBpedia(actorName);
    
    // Si l'IA retourne le même nom, pas la peine de réessayer
    if (improvedName.toLowerCase() === actorName.toLowerCase()) {
        console.log(`ℹ️ L'IA n'a pas changé le nom`);
        return null;
    }
    
    // Étape 3 : Réessayer avec le nom amélioré
    const aiResult = await searchActor(improvedName);
    if (aiResult) {
        console.log(`✅ Trouvé avec le nom corrigé par l'IA sur Wikidata!`);
        return aiResult;
    }
    
    console.log(`❌ Acteur non trouvé même après correction IA`);
    return null;
}

/**
 * Recherche un acteur sur Wikidata
 * @param {string} actorName - Nom de l'acteur
 * @returns {Promise<Object|null>} - Résultat de la recherche
 */
async function searchActor(actorName) {
    try {
        const result = await findActorOnWikidata(actorName);
        return result ? { ...result, source: 'Wikidata' } : null;
    } catch (error) {
        console.error('Erreur recherche acteur:', error);
        return null;
    }
}

/**
 * Vérifie si deux acteurs ont joué dans un film commun
 * Interroge uniquement Wikidata pour assurer la compatibilité des URIs
 * @param {string} actor1Uri - URI du premier acteur
 * @param {string} actor2Uri - URI du second acteur
 * @returns {Promise<Object|null>} - Objet avec le film commun ou null
 */
export async function haveCommonMovie(actor1Uri, actor2Uri) {
    try {
        const result = await findCommonMovieOnWikidata(actor1Uri, actor2Uri);
        
        if (result) {
            console.log(`✅ Film commun trouvé sur Wikidata: ${result.movieLabel}`);
        }
        
        return result;
    } catch (error) {
        console.error('Erreur lors de la vérification des films communs:', error);
        throw error;
    }
}