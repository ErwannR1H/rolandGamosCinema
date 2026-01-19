import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ChallengeSetup({ onStartChallenge }) {
  const navigate = useNavigate();
  const [actorSelection, setActorSelection] = useState('none'); // 'none', 'one', 'both'
  const [startActor, setStartActor] = useState('');
  const [endActor, setEndActor] = useState('');
  const [maxPathLength, setMaxPathLength] = useState(7);

  const handleStart = () => {
    const config = {
      actorSelection,
      startActor: actorSelection === 'both' || actorSelection === 'one' ? startActor : null,
      endActor: actorSelection === 'both' ? endActor : null,
      maxPathLength
    };
    onStartChallenge(config);
  };

  const buttonStyle = (isDisabled = false) => ({
    padding: '15px 30px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.1em',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s',
    fontWeight: '600',
    background: isDisabled ? '#ccc' : '#34c759',
    color: 'white',
    opacity: isDisabled ? 0.6 : 1
  });

  const canStart = () => {
    if (actorSelection === 'both') {
      return startActor.trim() && endActor.trim();
    }
    if (actorSelection === 'one') {
      return startActor.trim();
    }
    return true; // 'none' est toujours valide
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
        <div style={{ marginBottom: '30px' }}>
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
            ← Retour à l'accueil
          </button>
        </div>

        <header style={{
          textAlign: 'center',
          marginBottom: '40px',
          paddingBottom: '20px',
          borderBottom: '3px solid #f5576c'
        }}>
          <h1 style={{ color: '#333', fontSize: '2.5em', marginBottom: '10px' }}>
            🎯 Mode Défi
          </h1>
          <p style={{ color: '#666', fontSize: '1.1em' }}>
            Configurez votre défi
          </p>
        </header>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>
            Qui choisit les acteurs ?
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{
              padding: '15px',
              border: `2px solid ${actorSelection === 'none' ? '#f5576c' : '#ddd'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              background: actorSelection === 'none' ? '#fff5f7' : 'white',
              transition: 'all 0.3s'
            }}>
              <input
                type="radio"
                name="selection"
                value="none"
                checked={actorSelection === 'none'}
                onChange={(e) => setActorSelection(e.target.value)}
                style={{ marginRight: '10px' }}
              />
              <strong>Le jeu choisit les deux acteurs</strong> (plus difficile)
            </label>

            <label style={{
              padding: '15px',
              border: `2px solid ${actorSelection === 'one' ? '#f5576c' : '#ddd'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              background: actorSelection === 'one' ? '#fff5f7' : 'white',
              transition: 'all 0.3s'
            }}>
              <input
                type="radio"
                name="selection"
                value="one"
                checked={actorSelection === 'one'}
                onChange={(e) => setActorSelection(e.target.value)}
                style={{ marginRight: '10px' }}
              />
              <strong>Je choisis un acteur</strong> (difficulté moyenne)
            </label>

            <label style={{
              padding: '15px',
              border: `2px solid ${actorSelection === 'both' ? '#f5576c' : '#ddd'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              background: actorSelection === 'both' ? '#fff5f7' : 'white',
              transition: 'all 0.3s'
            }}>
              <input
                type="radio"
                name="selection"
                value="both"
                checked={actorSelection === 'both'}
                onChange={(e) => setActorSelection(e.target.value)}
                style={{ marginRight: '10px' }}
              />
              <strong>Je choisis les deux acteurs</strong> (plus facile)
            </label>
          </div>
        </div>

        {(actorSelection === 'one' || actorSelection === 'both') && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>
              {actorSelection === 'both' ? 'Acteurs de départ et d\'arrivée' : 'Acteur de départ'}
            </h3>
            <input
              type="text"
              placeholder="Acteur de départ (ex: Brad Pitt)"
              value={startActor}
              onChange={(e) => setStartActor(e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #ddd',
                borderRadius: '10px',
                fontSize: '1em',
                marginBottom: '10px',
                boxSizing: 'border-box'
              }}
            />
            {actorSelection === 'both' && (
              <input
                type="text"
                placeholder="Acteur d'arrivée (ex: Tom Hanks)"
                value={endActor}
                onChange={(e) => setEndActor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #ddd',
                  borderRadius: '10px',
                  fontSize: '1em',
                  boxSizing: 'border-box'
                }}
              />
            )}
          </div>
        )}

        {actorSelection !== 'both' && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>
              Longueur maximale du chemin
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '10px'
            }}>
              <div style={{ flex: 1 }}>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={maxPathLength}
                  onChange={(e) => setMaxPathLength(Number(e.target.value))}
                  style={{
                    width: '100%',
                    cursor: 'pointer'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.9em',
                  color: '#666',
                  marginTop: '5px'
                }}>
                  <span>3 (facile)</span>
                  <span>10 (difficile)</span>
                </div>
              </div>
              <div style={{
                fontSize: '2em',
                fontWeight: 'bold',
                color: '#f5576c',
                minWidth: '60px',
                textAlign: 'center'
              }}>
                {maxPathLength}
              </div>
            </div>
            <p style={{ 
              fontSize: '0.9em', 
              color: '#666', 
              marginTop: '10px',
              fontStyle: 'italic'
            }}>
              {maxPathLength === 3 && "1 acteur intermédiaire (très facile)"}
              {maxPathLength === 4 && "2 acteurs intermédiaires (facile)"}
              {maxPathLength === 5 && "3 acteurs intermédiaires (moyen)"}
              {maxPathLength === 6 && "4 acteurs intermédiaires (moyen)"}
              {maxPathLength === 7 && "5 acteurs intermédiaires (difficile)"}
              {maxPathLength === 8 && "6 acteurs intermédiaires (difficile)"}
              {maxPathLength === 9 && "7 acteurs intermédiaires (très difficile)"}
              {maxPathLength === 10 && "8 acteurs intermédiaires (expert)"}
            </p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button
            onClick={handleStart}
            disabled={!canStart()}
            style={buttonStyle(!canStart())}
          >
            🚀 Commencer le défi
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChallengeSetup;
