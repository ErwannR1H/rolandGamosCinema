import React from 'react';
import { Link } from 'react-router-dom';

function HomeMenu() {
  const cardStyle = {
    background: 'white',
    padding: '30px',
    borderRadius: '15px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'center',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block'
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
        maxWidth: '1000px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          color: 'white', 
          fontSize: '3em', 
          marginBottom: '20px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
        }}>
          🎬 Jeu des Acteurs
        </h1>
        <p style={{ 
          color: 'rgba(255,255,255,0.9)', 
          fontSize: '1.2em', 
          marginBottom: '50px' 
        }}>
          Choisissez votre mode de jeu
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          marginBottom: '30px'
        }}>
          <Link 
            to="/classique" 
            style={cardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ fontSize: '4em', marginBottom: '10px' }}>🎮</div>
            <h2 style={{ color: '#667eea', marginBottom: '15px' }}>Mode Classique</h2>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              Deux joueurs s'affrontent pour trouver des acteurs ayant joué ensemble. 
              Le premier qui ne trouve pas de réponse perd !
            </p>
          </Link>

          <Link 
            to="/defi" 
            style={cardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ fontSize: '4em', marginBottom: '10px' }}>🎯</div>
            <h2 style={{ color: '#f5576c', marginBottom: '15px' }}>Mode Défi</h2>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              Trouvez le chemin le plus court entre deux acteurs ! 
              Choisissez la difficulté et relevez le défi.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomeMenu;
