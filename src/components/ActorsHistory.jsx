import React from 'react';

function ActorsHistory({ actors }) {
  if (actors.length === 0) {
    return null;
  }

  const getPlayerGradient = (player) => {
    return player === 1
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <h3 style={{ color: '#333', marginBottom: '15px' }}>Acteurs déjà mentionnés:</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        {actors.map((actor, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: getPlayerGradient(actor.player || 1),
            color: 'white',
            padding: '10px 15px',
            borderRadius: '25px',
            fontSize: '0.9em',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {actor.imageUrl && (
              <img 
                src={actor.imageUrl} 
                alt={actor.label}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid white'
                }}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '600' }}>{actor.label}</span>
              {actor.wikidataUrl && (
                <a 
                  href={actor.wikidataUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#e0e7ff', 
                    fontSize: '0.75em',
                    textDecoration: 'none',
                    marginTop: '2px'
                  }}
                >
                  📖 Voir sur Wikidata
                </a>
              )}
            </div>
            {actor.moviePosterUrl && (
              <img 
                src={actor.moviePosterUrl} 
                alt="Affiche du film"
                style={{
                  width: '30px',
                  height: '45px',
                  borderRadius: '4px',
                  objectFit: 'cover',
                  border: '1px solid white',
                  marginLeft: '5px'
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActorsHistory;
