import React, { useState } from 'react';
import GameStatus from './components/GameStatus';
import LastActor from './components/LastActor';
import ActorInput from './components/ActorInput';
import MessageContainer from './components/MessageContainer';
import ActorsHistory from './components/ActorsHistory';
import Loading from './components/Loading';
import RulesModal from './components/RulesModal';
import ChallengeSetup from './components/ChallengeSetup';
import ChallengeGame from './components/ChallengeGame';
import NetworkAnalysis from './components/NetworkAnalysis';
import { findActor, haveCommonMovie } from './services/sparqlService';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function Accueil() {
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
            🎬 Bienvenue sur notre plateforme d'analyse cinématographique
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
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#333', fontSize: '1.5em', marginBottom: '15px' }}>
              Choisissez votre mode de jeu
            </h2>
            <p style={{ color: '#666', fontSize: '1.1em', lineHeight: '1.6' }}>
              Quatre modes disponibles pour tester et enrichir vos connaissances cinématographiques
            </p>
          </div>

          {/* 4 gros boutons principaux */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {/* Solo Classique */}
            <Link 
              to="/classique" 
              style={{
                background: 'white',
                padding: '30px',
                borderRadius: '15px',
                border: '3px solid #667eea',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'center',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.4)';
                e.currentTarget.style.borderColor = '#5568d3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#667eea';
              }}
            >
              <div style={{ fontSize: '4em', marginBottom: '15px' }}>🎮</div>
              <h3 style={{ color: '#667eea', marginBottom: '12px', fontSize: '1.4em', fontWeight: 'bold' }}>
                Solo Classique
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6', fontSize: '1em' }}>
                Jouez seul et trouvez des acteurs ayant joué ensemble
              </p>
            </Link>

            {/* Solo Défi */}
            <Link 
              to="/defi" 
              style={{
                background: 'white',
                padding: '30px',
                borderRadius: '15px',
                border: '3px solid #f5576c',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'center',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(245, 87, 108, 0.4)';
                e.currentTarget.style.borderColor = '#e4465b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#f5576c';
              }}
            >
              <div style={{ fontSize: '4em', marginBottom: '15px' }}>🎯</div>
              <h3 style={{ color: '#f5576c', marginBottom: '12px', fontSize: '1.4em', fontWeight: 'bold' }}>
                Solo Défi
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6', fontSize: '1em' }}>
                Trouvez le chemin le plus court entre deux acteurs avec des indices
              </p>
            </Link>

            {/* Multijoueur Classique */}
            <Link 
              to="/game" 
              style={{
                background: 'white',
                padding: '30px',
                borderRadius: '15px',
                border: '3px solid #11998e',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'center',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(17, 153, 142, 0.4)';
                e.currentTarget.style.borderColor = '#0e8174';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#11998e';
              }}
            >
              <div style={{ fontSize: '4em', marginBottom: '15px' }}>👥</div>
              <h3 style={{ color: '#11998e', marginBottom: '12px', fontSize: '1.4em', fontWeight: 'bold' }}>
                Multijoueur Classique
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6', fontSize: '1em' }}>
                Affrontez vos amis en trouvant des acteurs ayant joué ensemble
              </p>
            </Link>

            {/* Analyse du réseau */}
            <Link 
              to="/analysis" 
              style={{
                background: 'white',
                padding: '30px',
                borderRadius: '15px',
                border: '3px solid #6c757d',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'center',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(108, 117, 125, 0.4)';
                e.currentTarget.style.borderColor = '#5a6268';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#6c757d';
              }}
            >
              <div style={{ fontSize: '4em', marginBottom: '15px' }}>📊</div>
              <h3 style={{ color: '#6c757d', marginBottom: '12px', fontSize: '1.4em', fontWeight: 'bold' }}>
                Analyse du Réseau
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6', fontSize: '1em' }}>
                Explorez les connexions entre acteurs et films
              </p>
            </Link>
          </div>

          {/* Bouton À propos en bas */}
          <div style={{ textAlign: 'center' }}>
            <Link to="/about" style={{ textDecoration: 'none' }}>
              <button style={{ 
                padding: '12px 30px',
                border: '2px solid #dee2e6',
                borderRadius: '10px',
                fontSize: '1em',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontWeight: '600',
                background: 'white',
                color: '#6c757d'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
                e.currentTarget.style.borderColor = '#adb5bd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}>
                ℹ️ À propos
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
    addMessage(`Fin de partie ! Le Joueur ${winner} remporte la victoire !`, 'success');
  };

  const acceptActor = (actor) => {
    setGameState(prev => {
      const newScores = { ...prev.scores };
      const scoreKey = `player${prev.currentPlayer}`;
      newScores[scoreKey]++;

      return {
        ...prev,
        lastActor: actor,
        actorsHistory: [...prev.actorsHistory, { ...actor, player: prev.currentPlayer }],
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
        endGame(gameState.currentPlayer === 1 ? 2 : 1);
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

    const winner = gameState.currentPlayer === 1 ? 2 : 1;
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
        <div style={{ marginBottom: '20px' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: '#6c757d',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              ← Retour à l'accueil
            </button>
          </Link>
        </div>

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
                Cliquez sur "Nouvelle Partie" pour commencer à jouer !
              </p>
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

// Composant pour gérer le mode défi
function ChallengeMode() {
  const [config, setConfig] = useState(null);

  const handleStartChallenge = (challengeConfig) => {
    setConfig(challengeConfig);
  };

  if (!config) {
    return <ChallengeSetup onStartChallenge={handleStartChallenge} />;
  }

  return <ChallengeGame config={config} />;
}

// Composant principal qui gère la navigation
function App() {
  return (
    <Router>
      <Routes>
        {/* Page d'accueil */}
        <Route path="/" element={<Accueil />} />
        
        {/* Mode solo classique */}
        <Route path="/classique" element={<Game />} />
        
        {/* Mode multijoueur classique */}
        <Route path="/game" element={<Game />} />
        
        {/* Mode défi (solo) */}
        <Route path="/defi" element={<ChallengeMode />} />
        
        {/* Analyse du réseau d'acteurs */}
        <Route path="/analysis" element={<NetworkAnalysis />} />
      </Routes>
    </Router>
  );
}

export default App;
