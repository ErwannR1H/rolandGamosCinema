import React, { useState } from 'react';
import GameStatus from './components/GameStatus';
import LastActor from './components/LastActor';
import ActorInput from './components/ActorInput';
import MessageContainer from './components/MessageContainer';
import ActorsHistory from './components/ActorsHistory';
import Loading from './components/Loading';
import RulesModal from './components/RulesModal';
import SoloGame from './components/SoloGame';
import { findActor, haveCommonMovie } from './services/sparqlService';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function Accueil() {
  const buttonStyle = {
    flex: 1,
    padding: '15px 25px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1em',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontWeight: '600',
    background: '#667eea',
    color: 'white',
    textDecoration: 'none',
    display: 'inline-block'
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
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
            Bienvenue sur notre plateforme d'analyse cinématographique
          </h1>
          <p style={{ color: '#666', fontSize: '1.1em' }}>
            Enrichir & Tester ses connaissances cinématographiques
          </p>
        </header>

        <main style={{ marginBottom: '30px' }}>
          <div style={{
            background: '#f8f9fa',
            padding: '30px',
            borderRadius: '15px',
            marginBottom: '30px'
          }}>
            <h2 style={{ color: '#333', fontSize: '1.5em', marginBottom: '15px' }}>
              À propos de l'application
            </h2>
            <p style={{ color: '#666', fontSize: '1.1em', lineHeight: '1.6' }}>
              Testez votre culture cinématographique avec notre jeu des acteurs !
              Défiez vos amis en trouvant des acteurs ayant joué ensemble dans un même film.
              L'application utilise les technologies du <strong>Web Sémantique</strong> (Wikidata & SPARQL)
              pour vérifier en temps réel les liens entre acteurs et films.
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '15px',
            flexDirection: 'column'
          }}>
            <Link to="/game" style={{ textDecoration: 'none' }}>
              <button style={{ ...buttonStyle, width: '100%' }}>
                👥 Mode Multijoueur - Défiez vos amis !
              </button>
            </Link>

            <Link to="/solo" style={{ textDecoration: 'none' }}>
              <button style={{
                ...buttonStyle,
                width: '100%',
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
              }}>
                🤖 Mode Solo - Défiez l'IA !
              </button>
            </Link>

            <Link to="/about" style={{ textDecoration: 'none' }}>
              <button style={{
                ...buttonStyle,
                width: '100%',
                background: '#6c757d'
              }}>
                Vers analyse de data (TODO)
              </button>
            </Link>
          </div>
        </main>

        <footer style={{
          textAlign: 'center',
          paddingTop: '20px',
          borderTop: '2px solid #eee',
          color: '#999',
          fontSize: '0.9em'
        }}>
          Propulsé par Wikidata & SPARQL
        </footer>
      </div>
    </div>
  );
}

function Game() {
  const [gameState, setGameState] = useState({
    currentPlayer: 1,
    scores: { player1: 0, player2: 0 },
    actorsHistory: [],
    lastActor: null,
    isGameActive: false
  });
  const [playerCount, setPlayerCount] = useState(2); // default 2 joueurs

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

  const startNewGameWithCount = (count) => {
    const scores = {};
    for (let i = 1; i <= count; i++) {
      scores[`player${i}`] = 0;
    }

    setPlayerCount(count);
    setGameState({
      currentPlayer: 1,
      scores,
      actorsHistory: [],
      lastActor: null,
      isGameActive: true,
      playerCount: count
    });
    setActorInput('');
    clearMessages();
    addMessage('Nouvelle partie commencée ! Joueur 1, entrez le nom d\'un acteur.', 'info');
  };

  const startNewGame = () => startNewGameWithCount(playerCount);

  const endGame = (winner) => {
    setGameState(prev => ({ ...prev, isGameActive: false }));
    addMessage(`🏆 Fin de partie ! Le Joueur ${winner} remporte la victoire !`, 'success');
  };

  const acceptActor = (actor) => {
    setGameState(prev => {
      const newScores = { ...prev.scores };
      const scoreKey = `player${prev.currentPlayer}`;
      newScores[scoreKey]++;

      const pc = prev.playerCount || playerCount || 2;
      const nextPlayer = prev.currentPlayer === pc ? 1 : prev.currentPlayer + 1;

      return {
        ...prev,
        lastActor: actor,
        actorsHistory: [...prev.actorsHistory, { ...actor, player: prev.currentPlayer }],
        scores: newScores,
        currentPlayer: nextPlayer
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
      const pc = gameState.playerCount || playerCount || 2;
      const winnerDup = gameState.currentPlayer === pc ? 1 : gameState.currentPlayer + 1;
      endGame(winnerDup);
      return;
    }

    setIsLoading(true);
    clearMessages();

    try {
      // Rechercher l'acteur sur Wikidata
      const actor = await findActor(actorName);

      if (!actor) {
        addMessage('Acteur non trouvé sur Wikidata. Essayez un autre nom.', 'error');
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
        const pc2 = gameState.playerCount || playerCount || 2;
        const winnerNoCommon = gameState.currentPlayer === pc2 ? 1 : gameState.currentPlayer + 1;
        endGame(winnerNoCommon);
        setIsLoading(false);
        return;
      }

      // Réponse valide - ajouter l'affiche du film à l'acteur
      addMessage(
        `✓ Correct ! Film commun: "${commonMovie.movieLabel}"`,
        'success'
      );
      acceptActor({ ...actor, moviePosterUrl: commonMovie.moviePosterUrl });

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
    const pc = gameState.playerCount || playerCount || 2;
    const winner = gameState.currentPlayer === pc ? 1 : gameState.currentPlayer + 1;
    addMessage(`Le Joueur ${gameState.currentPlayer} abandonne. Le Joueur ${winner} gagne !`, 'info');
    endGame(winner);
  };

  const buttonStyle = (isPrimary) => {
    const baseColor = gameState.currentPlayer === 1 ? '#667eea' : '#f5576c';

    return {
      flex: 1,
      padding: '15px 25px',
      border: 'none',
      borderRadius: '10px',
      fontSize: '1em',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontWeight: '600',
      background: isPrimary ? baseColor : '#6c757d',
      color: 'white'
    };
  };

  // Dégradé de couleur basé sur le joueur actuel
  const getBackgroundGradient = () => {
    if (!gameState.isGameActive) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    return gameState.currentPlayer === 1
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' // Bleu/Violet pour joueur 1
      : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'; // Rose/Rouge pour joueur 2
  };

  const getBorderColor = () => {
    if (!gameState.isGameActive) {
      return '#667eea';
    }
    return gameState.currentPlayer === 1 ? '#667eea' : '#f5576c';
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: getBackgroundGradient(),
      minHeight: '100vh',
      padding: '20px',
      transition: 'background 0.5s ease'
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
          borderBottom: `3px solid ${getBorderColor()}`,
          transition: 'border-color 0.5s ease'
        }}>
          <h1 style={{ color: '#333', fontSize: '2.5em', marginBottom: '10px' }}>
            🎬 Jeu des Acteurs
          </h1>
          <p style={{ color: '#666', fontSize: '1.1em' }}>
            Trouvez des acteurs ayant joué dans un film commun
          </p>
        </header>

        <main>
          {gameState.isGameActive && (
            <>
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
            </>
          )}

          {!gameState.isGameActive && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#666'
            }}>
              <p style={{ fontSize: '1.2em', marginBottom: '20px' }}>
                Choisissez le nombre de joueurs puis cliquez sur "Nouvelle Partie".
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                <label style={{ alignSelf: 'center' }}>Joueurs :</label>
                <select value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))} style={{ padding: '10px', borderRadius: '8px' }}>
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <MessageContainer messages={messages} />

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                  <button style={{ ...buttonStyle(false) }}>Retour à l'accueil</button>
                </Link>
              </div>
            </div>
          )}
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
          {gameState.isGameActive && ((gameState.playerCount || playerCount) > 1) && (
            <Link to="/" style={{ textDecoration: 'none' }}>
              <button style={{ ...buttonStyle(false) }}>Retour à l'accueil</button>
            </Link>
          )}
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

// 3. Le composant principal qui gère la navigation
function App() {
  return (
    <Router>
      <Routes>
        {/* La route racine "/" affiche l'accueil */}
        <Route path="/" element={<Accueil />} />

        {/* La route "/game" affiche le mode multijoueur */}
        <Route path="/game" element={<Game />} />

        {/* La route "/solo" affiche le mode solo contre l'IA */}
        <Route path="/solo" element={<SoloGame />} />
      </Routes>
    </Router>
  );
}

export default App;
