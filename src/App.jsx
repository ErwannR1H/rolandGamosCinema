import React, { useState } from 'react';
import GameStatus from './components/GameStatus';
import LastActor from './components/LastActor';
import ActorInput from './components/ActorInput';
import MessageContainer from './components/MessageContainer';
import ActorsHistory from './components/ActorsHistory';
import Loading from './components/Loading';
import RulesModal from './components/RulesModal';
import { findActor, haveCommonMovie } from './services/sparqlService';

function App() {
  const [gameState, setGameState] = useState({
    currentPlayer: 1,
    scores: { player1: 0, player2: 0 },
    actorsHistory: [],
    lastActor: null,
    isGameActive: false
  });

  const [actorInput, setActorInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const addMessage = (text, type = 'info') => {
    setMessages(prev => [...prev, { text, type }]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const startNewGame = () => {
    setGameState({
      currentPlayer: 1,
      scores: { player1: 0, player2: 0 },
      actorsHistory: [],
      lastActor: null,
      isGameActive: true
    });
    setActorInput('');
    clearMessages();
    addMessage('Nouvelle partie commencée ! Joueur 1, entrez le nom d\'un acteur.', 'info');
  };

  const endGame = (winner) => {
    setGameState(prev => ({ ...prev, isGameActive: false }));
    addMessage(`🏆 Fin de partie ! Le Joueur ${winner} remporte la victoire !`, 'success');
  };

  const acceptActor = (actor) => {
    setGameState(prev => {
      const newScores = { ...prev.scores };
      const scoreKey = `player${prev.currentPlayer}`;
      newScores[scoreKey]++;

      return {
        ...prev,
        lastActor: actor,
        actorsHistory: [...prev.actorsHistory, actor],
        scores: newScores,
        currentPlayer: prev.currentPlayer === 1 ? 2 : 1
      };
    });
    setActorInput('');
  };

  const handleSubmit = async () => {
    const actorName = actorInput.trim();

    if (!actorName) {
      addMessage('Veuillez entrer le nom d\'un acteur.', 'error');
      return;
    }

    if (!gameState.isGameActive) {
      addMessage('Démarrez une nouvelle partie pour jouer.', 'error');
      return;
    }

    // Vérifier si l'acteur a déjà été mentionné
    if (gameState.actorsHistory.some(a => a.label.toLowerCase() === actorName.toLowerCase())) {
      addMessage('Cet acteur a déjà été mentionné ! Le Joueur ' + gameState.currentPlayer + ' perd.', 'error');
      endGame(gameState.currentPlayer === 1 ? 2 : 1);
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      // Rechercher l'acteur sur DBpedia
      const actor = await findActor(actorName);

      if (!actor) {
        addMessage('Acteur non trouvé sur DBpedia. Essayez un autre nom.', 'error');
        setIsLoading(false);
        return;
      }

      // Premier tour : accepter n'importe quel acteur
      if (!gameState.lastActor) {
        acceptActor(actor);
        setIsLoading(false);
        return;
      }

      // Vérifier si les deux acteurs ont joué dans un film commun
      const commonMovie = await haveCommonMovie(gameState.lastActor.actor, actor.actor);

      if (!commonMovie) {
        addMessage(
          `Aucun film commun trouvé entre ${gameState.lastActor.label} et ${actor.label}. Le Joueur ${gameState.currentPlayer} perd.`,
          'error'
        );
        endGame(gameState.currentPlayer === 1 ? 2 : 1);
        setIsLoading(false);
        return;
      }

      // Réponse valide
      addMessage(
        `✓ Correct ! Film commun: "${commonMovie.movieLabel}"`,
        'success'
      );
      acceptActor(actor);

    } catch (error) {
      console.error('Erreur:', error);
      addMessage('Erreur lors de la vérification. Veuillez réessayer.', 'error');
    }

    setIsLoading(false);
  };

  const handleGiveUp = () => {
    if (!gameState.isGameActive) {
      addMessage('Aucune partie en cours.', 'error');
      return;
    }

    const winner = gameState.currentPlayer === 1 ? 2 : 1;
    addMessage(`Le Joueur ${gameState.currentPlayer} abandonne. Le Joueur ${winner} gagne !`, 'info');
    endGame(winner);
  };

  const buttonStyle = (isPrimary) => ({
    flex: 1,
    padding: '15px 25px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1em',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontWeight: '600',
    background: isPrimary ? '#667eea' : '#6c757d',
    color: 'white'
  });

  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        padding: '30px'
      }}>
        <header style={{
          textAlign: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '3px solid #667eea'
        }}>
          <h1 style={{ color: '#333', fontSize: '2.5em', marginBottom: '10px' }}>
            🎬 Jeu des Acteurs
          </h1>
          <p style={{ color: '#666', fontSize: '1.1em' }}>
            Trouvez des acteurs ayant joué dans un film commun
          </p>
        </header>

        <main>
          <GameStatus 
            currentPlayer={gameState.currentPlayer}
            scores={gameState.scores}
            isGameActive={gameState.isGameActive}
          />

          <LastActor lastActor={gameState.lastActor} />

          <ActorInput 
            value={actorInput}
            onChange={setActorInput}
            onSubmit={handleSubmit}
            onGiveUp={handleGiveUp}
            isGameActive={gameState.isGameActive}
            isLoading={isLoading}
          />

          <MessageContainer messages={messages} />

          <ActorsHistory actors={gameState.actorsHistory} />

          <Loading isLoading={isLoading} />
        </main>

        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '2px solid #eee'
        }}>
          <button onClick={startNewGame} style={buttonStyle(true)}>
            Nouvelle Partie
          </button>
          <button onClick={() => setIsRulesOpen(true)} style={buttonStyle(false)}>
            Règles
          </button>
        </div>

        <RulesModal 
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
        />
      </div>
    </div>
  );
}

export default App;
