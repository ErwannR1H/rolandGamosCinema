/**
 * Service de cache pour les requêtes Wikidata
 * Stocke les résultats dans localStorage avec un hash de la requête comme clé
 */
import CryptoJS from 'crypto-js';

const CACHE_PREFIX = 'wikidata_cache_';
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes

/**
 * Génère un hash SHA256 d'une chaîne de caractères
 * @param {string} str - Chaîne à hasher
 * @returns {string} Hash hexadécimal
 */
function generateHash(str) {
    return CryptoJS.SHA256(str).toString();
}

/**
 * Récupère une valeur du cache ou exécute la fonction et met en cache
 * @param {string} key - Clé de cache (sera hashée)
 * @param {Function} fetchFunction - Fonction async qui récupère les données
 * @returns {Promise<any>}
 */
export async function getCachedOrFetch(key, fetchFunction) {
    const hash = generateHash(key);
    const cacheKey = CACHE_PREFIX + hash;
    
    try {
        // Vérifier si le cache existe
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();
            
            // Vérifier si le cache n'a pas expiré
            if (now - timestamp < CACHE_EXPIRATION) {
                console.log(`Cache hit pour: ${key.substring(0, 50)}...`);
                return data;
            } else {
                console.log(`Cache expiré pour: ${key.substring(0, 50)}...`);
                localStorage.removeItem(cacheKey);
            }
        }
        
        // Cache manquant ou expiré : exécuter la fonction
        console.log(`Fetching depuis Wikidata: ${key.substring(0, 50)}...`);
        const data = await fetchFunction();
        
        // Stocker dans le cache
        const cacheData = {
            data,
            timestamp: Date.now(),
            key: key.substring(0, 100) // Pour debug
        };
        
        try {
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            console.log(`Résultat mis en cache`);
        } catch (error) {
            console.warn('Impossible de stocker dans le cache (quota dépassé??)', error);
            // Nettoyer les vieux caches si le quota est dépassé
            cleanOldCache();
        }
        
        return data;
    } catch (error) {
        console.error('Erreur cache:', error);
        // En cas d'erreur, exécuter la fonction sans cache
        return await fetchFunction();
    }
}

/**
 * Nettoie les entrées de cache les plus anciennes
 */
function cleanOldCache() {
    const keys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
            try {
                const cached = JSON.parse(localStorage.getItem(key));
                keys.push({ key, timestamp: cached.timestamp });
            } catch (error) {
                // Supprimer les entrées corrompues
                localStorage.removeItem(key);
            }
        }
    }
    
    // Trier par timestamp et supprimer les 20% les plus anciennes
    keys.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.ceil(keys.length * 0.2);
    
    for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(keys[i].key);
    }
    
    console.log(`🧹 ${toRemove} anciennes entrées de cache supprimées`);
}

/**
 * Vide tout le cache Wikidata
 */
export function clearCache() {
    const keys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
            keys.push(key);
        }
    }
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`🗑️ ${keys.length} entrées de cache supprimées`);
}

/**
 * Récupère les statistiques du cache
 */
export function getCacheStats() {
    let count = 0;
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
            count++;
            const value = localStorage.getItem(key);
            totalSize += value.length;
        }
    }
    
    return {
        entries: count,
        sizeKB: (totalSize / 1024).toFixed(2),
        sizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };
}
