import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { findActor, haveCommonMovie } from '../services/sparqlService';
import { getRandomActor, generateRandomChallenge, generatePathBetweenActors, generateRandomChallengeFromStart, getActorFilms } from '../services/wikidataService';

function ChallengeGame({ config, onReset }) {
  const navigate = useNavigate();
  const [startActor, setStartActor] = useState(null);
  const [endActor, setEndActor] = useState(null);
  const [path, setPath] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [errors, setErrors] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [solutionPath, setSolutionPath] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintMessage, setHintMessage] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initializeChallenge();
    }
  }, []);

  const initializeChallenge = async () => {
    setIsLoading(true);
    setMessage('Initialisation du défi...');
    
    try {
      if (config.actorSelection === 'both') {
        // Les deux acteurs sont fournis par l'utilisateur
        const start = await findActor(config.startActor);
        const end = await findActor(config.endActor);
        
        if (!start || !end) {
          setMessage('Erreur: Un ou plusieurs acteurs non trouvés');
          setIsLoading(false);
          return;
        }
        
        setStartActor(start);
        setEndActor(end);
        setPath([start]);
        setSolutionPath(null); // Pas de chemin pré-calculé en mode "both"
        console.log('Défi initialisé avec les deux acteurs choisis');
      } else if (config.actorSelection === 'one') {
        // Un acteur fourni, construire un chemin aléatoire pour découvrir l'acteur d'arrivée
        const start = await findActor(config.startActor);
        
        if (!start) {
          setMessage('Erreur: Acteur de départ non trouvé');
          setIsLoading(false);
          return;
        }
        
        // Générer un chemin aléatoire depuis l'acteur de départ
        setMessage('Génération d\'un chemin aléatoire...');
        const maxLength = config.maxPathLength || 7;
        const challenge = await generateRandomChallengeFromStart(start, 3, maxLength);
        
        if (!challenge) {
          setMessage(`❌ Impossible de générer un chemin depuis ${start.label}. Réessayez.`);
          setIsLoading(false);
          setTimeout(() => {
            navigate('/defi');
          }, 3000);
          return;
        }
        
        setStartActor(challenge.startActor);
        setEndActor(challenge.endActor);
        setPath([challenge.startActor]);
        setSolutionPath(challenge.path);
        console.log('Chemin aléatoire généré depuis acteur de départ:', challenge);
      } else {
        // Générer un défi aléatoire complet avec chemin pré-calculé
        setMessage('Génération d\'un défi aléatoire...');
        const maxLength = config.maxPathLength || 7;
        const challenge = await generateRandomChallenge(3, maxLength);
        
        if (!challenge) {
          setMessage('Erreur: Impossible de générer un défi aléatoire');
          setIsLoading(false);
          return;
        }
        
        setStartActor(challenge.startActor);
        setEndActor(challenge.endActor);
        setPath([challenge.startActor]);
        setSolutionPath(challenge.path); // Stocker le chemin solution
        
        console.log('Défi généré avec succès:', challenge);
        console.log(`Chemin solution (${challenge.pathLength} étapes):`, 
          challenge.path.map(step => `${step.currentActorLabel} -> ${step.film.title} -> ${step.nextActor.label}`));
      }
      
      setMessage('');
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      const errorMessage = error.message || 'Erreur lors de l\'initialisation du défi';
      setMessage(errorMessage);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentInput.trim() || isLoading || gameOver) return;

    setIsLoading(true);
    setMessage('Vérification...');

    try {
      const newActor = await findActor(currentInput.trim());
      
      if (!newActor) {
        setErrors(errors + 1);
        setMessage(`❌ "${currentInput}" n'est pas un acteur valide sur Wikidata`);
        setCurrentInput('');
        setIsLoading(false);
        
        if (errors + 1 >= 3) {
          setGameOver(true);
          setShowSolution(true);
          setMessage(`💀 Défaite ! Vous avez fait 3 erreurs. Voici un exemple de chemin possible :`);
        }
        return;
      }

      // Vérifier si l'acteur a déjà été utilisé
      if (path.some(actor => actor.actor === newActor.actor)) {
        setErrors(errors + 1);
        setMessage(`❌ ${newActor.label} a déjà été mentionné !`);
        setCurrentInput('');
        setIsLoading(false);
        
        if (errors + 1 >= 3) {
          setGameOver(true);
          setShowSolution(true);
          setMessage(`💀 Défaite ! Vous avez fait 3 erreurs. Voici un exemple de chemin possible :`);
        }
        return;
      }

      // Vérifier si cet acteur est l'acteur cible
      if (newActor.actor === endActor.actor) {
        // Vérifier qu'il y a un film en commun avec le dernier acteur
        const lastActor = path[path.length - 1];
        const commonMovie = await haveCommonMovie(lastActor.actor, newActor.actor);
        
        if (commonMovie) {
          setPath([...path, { ...newActor, movie: commonMovie }]);
          setVictory(true);
          setGameOver(true);
          setMessage(`🎉 Victoire ! Vous avez trouvé le chemin en ${path.length} étapes !`);
        } else {
          setErrors(errors + 1);
          setMessage(`❌ ${newActor.label} n'a pas de film en commun avec ${lastActor.label}`);
          
          if (errors + 1 >= 3) {
            setGameOver(true);
            setShowSolution(true);
            setMessage(`💀 Défaite ! Vous avez fait 3 erreurs. Voici un exemple de chemin possible :`);
          }
        }
        setCurrentInput('');
        setIsLoading(false);
        return;
      }

      // Vérifier s'il y a un film en commun avec le dernier acteur du chemin
      const lastActor = path[path.length - 1];
      const commonMovie = await haveCommonMovie(lastActor.actor, newActor.actor);

      if (commonMovie) {
        setPath([...path, { ...newActor, movie: commonMovie }]);
        setMessage(`✅ ${newActor.label} a été ajouté au chemin via "${commonMovie.title}"`);
      } else {
        setErrors(errors + 1);
        setMessage(`❌ ${newActor.label} n'a pas de film en commun avec ${lastActor.label}`);
        
        if (errors + 1 >= 3) {
          setGameOver(true);
          setShowSolution(true);
          setMessage(`💀 Défaite ! Vous avez fait 3 erreurs. Voici un exemple de chemin possible :`);
        }
      }

      setCurrentInput('');
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Une erreur est survenue');
      setIsLoading(false);
    }
  };

  const handleAbandon = () => {
    if (window.confirm('Voulez-vous vraiment abandonner ce défi ?')) {
      setGameOver(true);
      setShowSolution(true);
      setMessage(`😔 Vous avez abandonné. Voici un exemple de chemin possible :`);
    }
  };

  const handleHint = async () => {
    if (gameOver || isLoading) return;
    
    setIsLoading(true);
    const newHintsUsed = hintsUsed + 1;
    setHintsUsed(newHintsUsed);
    
    try {
      // Obtenir l'acteur actuel dans le chemin
      const currentPosition = path.length - 1;
      const currentActor = path[currentPosition];
      
      // Récupérer les films de l'acteur actuel
      const films = await getActorFilms(currentActor.actor, 5);
      
      if (!films || films.length === 0) {
        setHintMessage(`💡 Indice ${newHintsUsed}: Impossible de récupérer les films de ${currentActor.label}`);
        setIsLoading(false);
        return;
      }
      
      // Afficher les films de l'acteur actuel
      const filmsList = films.map(f => f.title).join(', ');
      setHintMessage(`💡 Indice ${newHintsUsed}: ${currentActor.label} a joué dans : ${filmsList}`);
      setIsLoading(false);
    } catch (error) {
      console.error('Erreur lors de la recherche d\'indice:', error);
      setHintMessage(`💡 Indice ${newHintsUsed}: Continuez vers ${endActor.label}, vous êtes sur la bonne voie !`);
      setIsLoading(false);
    }
  };

  if (!startActor || !endActor) {
    return (
      <div style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        minHeight: '100vh',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
          maxWidth: '500px'
        }}>
          <div style={{
            fontSize: '3em',
            marginBottom: '20px',
            animation: 'spin 2s linear infinite'
          }}>
            🎬
          </div>
          <h2 style={{ color: '#f5576c', marginBottom: '15px' }}>
            Génération du défi...
          </h2>
          <p style={{ color: '#666', fontSize: '1.1em' }}>
            {message || 'Création d\'un chemin aléatoire entre deux acteurs...'}
          </p>
          <div style={{
            marginTop: '20px',
            height: '4px',
            background: '#f0f0f0',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              animation: 'loading 1.5s ease-in-out infinite',
              width: '50%'
            }} />
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {/* Header avec compteur d'erreurs */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button 
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: '#6c757d',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ← Accueil
          </button>
          
          <h2 style={{ margin: 0, color: '#333' }}>🎯 Mode Défi</h2>
          
          <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
            Erreurs: <span style={{ color: errors >= 2 ? '#dc3545' : '#f5576c' }}>
              {errors}/3
            </span>
          </div>
        </div>

        {/* Objectif */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.2em', color: '#666', marginBottom: '15px' }}>
            Trouvez le chemin de
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            {/* Acteur de départ */}
            <div style={{ textAlign: 'center' }}>
              {startActor.imageUrl && (
                <img 
                  src={startActor.imageUrl} 
                  alt={startActor.label}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #667eea',
                    marginBottom: '10px'
                  }}
                />
              )}
              <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#667eea' }}>
                {startActor.label}
              </div>
            </div>
            
            <div style={{ fontSize: '2em', color: '#f5576c' }}>→</div>
            
            {/* Acteur d'arrivée */}
            <div style={{ textAlign: 'center' }}>
              {endActor.imageUrl && (
                <img 
                  src={endActor.imageUrl} 
                  alt={endActor.label}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #f5576c',
                    marginBottom: '10px'
                  }}
                />
              )}
              <div style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#f5576c' }}>
                {endActor.label}
              </div>
            </div>
          </div>
        </div>

        {/* Chemin actuel */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>Chemin actuel:</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {path.map((actor, index) => (
              <React.Fragment key={index}>
                <div style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  borderRadius: '25px',
                  fontWeight: 'bold'
                }}>
                  {actor.label}
                </div>
                {index < path.length - 1 && actor.movie && (
                  <>
                    <span style={{ color: '#999' }}>via</span>
                    <div style={{
                      padding: '5px 15px',
                      background: '#f8f9fa',
                      borderRadius: '15px',
                      fontSize: '0.9em',
                      color: '#666'
                    }}>
                      {actor.movie.title}
                    </div>
                    <span style={{ color: '#999', fontSize: '1.5em' }}>→</span>
                  </>
                )}
                {index === path.length - 1 && !gameOver && (
                  <span style={{ color: '#999', fontSize: '1.5em' }}>→ ?</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            background: victory ? '#d4edda' : errors > 0 ? '#f8d7da' : '#d1ecf1',
            color: victory ? '#155724' : errors > 0 ? '#721c24' : '#0c5460',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {message}
          </div>
        )}

        {/* Message d'indice */}
        {hintMessage && (
          <div style={{
            background: '#fff3cd',
            color: '#856404',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 'bold',
            border: '2px solid #ffc107'
          }}>
            {hintMessage}
            <div style={{ fontSize: '0.9em', marginTop: '5px', fontWeight: 'normal' }}>
              Indices utilisés: {hintsUsed}
            </div>
          </div>
        )}

        {/* Input */}
        {!gameOver && (
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Entrez le nom d'un acteur..."
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: '2px solid #ddd',
                    borderRadius: '10px',
                    fontSize: '1.1em',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={isLoading || !currentInput.trim()}
                  style={{
                    flex: 1,
                    padding: '15px',
                    border: 'none',
                    borderRadius: '10px',
                    background: isLoading || !currentInput.trim() ? '#ccc' : '#28a745',
                    color: 'white',
                    fontSize: '1.1em',
                    cursor: isLoading || !currentInput.trim() ? 'not-allowed' : 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {isLoading ? 'Vérification...' : 'Valider'}
                </button>
                <button
                  type="button"
                  onClick={handleHint}
                  disabled={isLoading}
                  style={{
                    padding: '15px 30px',
                    border: 'none',
                    borderRadius: '10px',
                    background: '#ffc107',
                    color: '#000',
                    fontSize: '1.1em',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '600'
                  }}
                  title="Voir les films de l'acteur actuel"
                >
                   Indice
                </button>
                <button
                  type="button"
                  onClick={handleAbandon}
                  disabled={isLoading}
                  style={{
                    padding: '15px 30px',
                    border: 'none',
                    borderRadius: '10px',
                    background: '#dc3545',
                    color: 'white',
                    fontSize: '1.1em',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Abandonner
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Affichage de la solution en cas de défaite */}
        {gameOver && showSolution && solutionPath && solutionPath.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>
              💡 Un exemple de chemin possible :
            </h3>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '15px',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '10px'
            }}>
              {/* Acteur de départ */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '25px',
                  fontWeight: 'bold',
                  minWidth: '150px',
                  textAlign: 'center'
                }}>
                  {startActor.label}
                </div>
              </div>
              
              {/* Étapes du chemin */}
              {solutionPath.map((step, index) => (
                <div key={index} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  paddingLeft: '20px'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    color: '#666'
                  }}>
                    <span style={{ fontSize: '1.5em' }}>↓</span>
                    <span style={{ fontSize: '0.9em', fontStyle: 'italic' }}>via</span>
                    <div style={{
                      padding: '5px 15px',
                      background: '#fff',
                      borderRadius: '15px',
                      fontSize: '0.9em',
                      border: '2px solid #ffc107'
                    }}>
                      🎬 {step.film.title}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '1.5em', color: '#666' }}>↓</span>
                    <div style={{
                      padding: '10px 20px',
                      background: index === solutionPath.length - 1 
                        ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                        : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                      color: 'white',
                      borderRadius: '25px',
                      fontWeight: 'bold',
                      minWidth: '150px',
                      textAlign: 'center'
                    }}>
                      {step.nextActor.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ 
              fontSize: '0.9em', 
              color: '#666', 
              marginTop: '15px',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              Ce chemin comporte {solutionPath.length + 1} étapes. Il existe peut-être d'autres chemins possibles !
            </p>
          </div>
        )}

        {/* Boutons de fin de partie */}
        {gameOver && (
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={onReset}
                style={{
                  padding: '15px 30px',
                  border: 'none',
                  borderRadius: '10px',
                  background: '#f5576c',
                  color: 'white',
                  fontSize: '1.1em',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Retour au menu défi
              </button>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '15px 30px',
                  border: 'none',
                  borderRadius: '10px',
                  background: '#6c757d',
                  color: 'white',
                  fontSize: '1.1em',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Menu principal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChallengeGame;
