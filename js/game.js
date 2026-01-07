/**
 * Logique principale du jeu des acteurs
 */

// État du jeu
const gameState = {
    currentPlayer: 1,
    scores: { player1: 0, player2: 0 },
    actorsHistory: [],
    lastActor: null,
    isGameActive: false
};

// Éléments DOM
const elements = {
    actorInput: document.getElementById('actor-input'),
    submitBtn: document.getElementById('submit-btn'),
    giveUpBtn: document.getElementById('give-up-btn'),
    newGameBtn: document.getElementById('new-game-btn'),
    rulesBtn: document.getElementById('rules-btn'),
    currentPlayerSpan: document.getElementById('current-player'),
    scorePlayer1: document.getElementById('score-player1'),
    scorePlayer2: document.getElementById('score-player2'),
    lastActorContainer: document.getElementById('last-actor-container'),
    lastActorName: document.getElementById('last-actor-name'),
    messageContainer: document.getElementById('message-container'),
    actorsHistory: document.getElementById('actors-history'),
    loading: document.getElementById('loading'),
    rulesModal: document.getElementById('rules-modal'),
    closeModal: document.querySelector('.close')
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    updateUI();
});

/**
 * Initialise tous les écouteurs d'événements
 */
function initEventListeners() {
    elements.submitBtn.addEventListener('click', handleSubmit);
    elements.actorInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });
    elements.giveUpBtn.addEventListener('click', handleGiveUp);
    elements.newGameBtn.addEventListener('click', startNewGame);
    elements.rulesBtn.addEventListener('click', () => {
        elements.rulesModal.classList.remove('hidden');
    });
    elements.closeModal.addEventListener('click', () => {
        elements.rulesModal.classList.add('hidden');
    });
    
    // Fermer la modal en cliquant à l'extérieur
    elements.rulesModal.addEventListener('click', (e) => {
        if (e.target === elements.rulesModal) {
            elements.rulesModal.classList.add('hidden');
        }
    });
}

/**
 * Démarre une nouvelle partie
 */
function startNewGame() {
    gameState.currentPlayer = 1;
    gameState.scores = { player1: 0, player2: 0 };
    gameState.actorsHistory = [];
    gameState.lastActor = null;
    gameState.isGameActive = true;
    
    clearMessages();
    updateUI();
    elements.actorInput.value = '';
    elements.actorInput.focus();
    elements.lastActorContainer.classList.add('hidden');
    elements.actorsHistory.innerHTML = '';
    
    showMessage('Nouvelle partie commencée ! Joueur 1, entrez le nom d\'un acteur.', 'info');
}

/**
 * Gère la soumission d'un nom d'acteur
 */
async function handleSubmit() {
    const actorName = elements.actorInput.value.trim();
    
    if (!actorName) {
        showMessage('Veuillez entrer le nom d\'un acteur.', 'error');
        return;
    }
    
    if (!gameState.isGameActive) {
        showMessage('Démarrez une nouvelle partie pour jouer.', 'error');
        return;
    }
    
    // Vérifier si l'acteur a déjà été mentionné
    if (gameState.actorsHistory.some(a => a.label.toLowerCase() === actorName.toLowerCase())) {
        showMessage('Cet acteur a déjà été mentionné ! Le Joueur ' + gameState.currentPlayer + ' perd.', 'error');
        endGame(gameState.currentPlayer === 1 ? 2 : 1);
        return;
    }
    
    setLoading(true);
    clearMessages();
    
    try {
        // Rechercher l'acteur sur DBpedia
        const actor = await findActor(actorName);
        
        if (!actor) {
            showMessage('Acteur non trouvé sur DBpedia. Essayez un autre nom.', 'error');
            setLoading(false);
            return;
        }
        
        // Premier tour : accepter n'importe quel acteur
        if (!gameState.lastActor) {
            acceptActor(actor);
            setLoading(false);
            return;
        }
        
        // Vérifier si les deux acteurs ont joué dans un film commun
        const commonMovie = await haveCommonMovie(gameState.lastActor.actor, actor.actor);
        
        if (!commonMovie) {
            showMessage(
                `Aucun film commun trouvé entre ${gameState.lastActor.label} et ${actor.label}. Le Joueur ${gameState.currentPlayer} perd.`,
                'error'
            );
            endGame(gameState.currentPlayer === 1 ? 2 : 1);
            setLoading(false);
            return;
        }
        
        // Réponse valide
        showMessage(
            `✓ Correct ! Film commun: "${commonMovie.movieLabel}"`,
            'success'
        );
        acceptActor(actor);
        
    } catch (error) {
        console.error('Erreur:', error);
        showMessage('Erreur lors de la vérification. Veuillez réessayer.', 'error');
    }
    
    setLoading(false);
}

/**
 * Accepte un acteur et passe au joueur suivant
 */
function acceptActor(actor) {
    gameState.lastActor = actor;
    gameState.actorsHistory.push(actor);
    
    // Augmenter le score
    const scoreKey = 'player' + gameState.currentPlayer;
    gameState.scores[scoreKey]++;
    
    // Passer au joueur suivant
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    
    updateUI();
    elements.actorInput.value = '';
    elements.actorInput.focus();
}

/**
 * Gère l'abandon d'un joueur
 */
function handleGiveUp() {
    if (!gameState.isGameActive) {
        showMessage('Aucune partie en cours.', 'error');
        return;
    }
    
    const winner = gameState.currentPlayer === 1 ? 2 : 1;
    showMessage(`Le Joueur ${gameState.currentPlayer} abandonne. Le Joueur ${winner} gagne !`, 'info');
    endGame(winner);
}

/**
 * Termine la partie
 */
function endGame(winner) {
    gameState.isGameActive = false;
    showMessage(`🏆 Fin de partie ! Le Joueur ${winner} remporte la victoire !`, 'success');
    updateUI();
}

/**
 * Met à jour l'interface utilisateur
 */
function updateUI() {
    // Mettre à jour le joueur actuel
    elements.currentPlayerSpan.textContent = gameState.isGameActive 
        ? `Joueur ${gameState.currentPlayer}` 
        : 'Partie terminée';
    
    // Mettre à jour les scores
    elements.scorePlayer1.textContent = gameState.scores.player1;
    elements.scorePlayer2.textContent = gameState.scores.player2;
    
    // Mettre à jour le dernier acteur
    if (gameState.lastActor) {
        elements.lastActorName.textContent = gameState.lastActor.label;
        elements.lastActorContainer.classList.remove('hidden');
    }
    
    // Mettre à jour l'historique
    elements.actorsHistory.innerHTML = '';
    gameState.actorsHistory.forEach(actor => {
        const badge = document.createElement('div');
        badge.className = 'actor-badge';
        badge.textContent = actor.label;
        elements.actorsHistory.appendChild(badge);
    });
    
    // Activer/désactiver les boutons
    elements.submitBtn.disabled = !gameState.isGameActive;
    elements.giveUpBtn.disabled = !gameState.isGameActive;
    elements.actorInput.disabled = !gameState.isGameActive;
}

/**
 * Affiche un message à l'utilisateur
 */
function showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    elements.messageContainer.appendChild(message);
    
    // Faire défiler vers le message
    message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Efface tous les messages
 */
function clearMessages() {
    elements.messageContainer.innerHTML = '';
}

/**
 * Affiche/masque l'indicateur de chargement
 */
function setLoading(isLoading) {
    if (isLoading) {
        elements.loading.classList.remove('hidden');
        elements.submitBtn.disabled = true;
    } else {
        elements.loading.classList.add('hidden');
        elements.submitBtn.disabled = !gameState.isGameActive;
    }
}
