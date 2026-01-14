/**
 * Service de gestion des scores pour le mode solo
 * Utilise localStorage pour la persistance
 */

const HIGH_SCORE_KEY = 'soloHighScore';

/**
 * Récupère le meilleur score enregistré
 * @returns {number} - Le high score ou 0 si aucun
 */
export function getHighScore() {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    return stored ? parseInt(stored, 10) : 0;
}

/**
 * Sauvegarde un nouveau high score si c'est un record
 * @param {number} score - Le score à sauvegarder
 * @returns {boolean} - true si c'est un nouveau record
 */
export function saveHighScore(score) {
    const currentHighScore = getHighScore();
    if (score > currentHighScore) {
        localStorage.setItem(HIGH_SCORE_KEY, score.toString());
        return true; // Nouveau record !
    }
    return false;
}

/**
 * Réinitialise le high score
 */
export function resetHighScore() {
    localStorage.removeItem(HIGH_SCORE_KEY);
}
