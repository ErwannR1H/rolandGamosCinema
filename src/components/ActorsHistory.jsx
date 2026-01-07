import React from 'react';

function ActorsHistory({ actors }) {
  return (
    <div style={{ marginTop: '30px' }}>
      <h3 style={{ color: '#333', marginBottom: '15px' }}>Acteurs déjà mentionnés:</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {actors.map((actor, index) => (
          <div key={index} style={{
            background: '#667eea',
            color: 'white',
            padding: '8px 15px',
            borderRadius: '20px',
            fontSize: '0.9em'
          }}>
            {actor.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActorsHistory;
