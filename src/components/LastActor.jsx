import React from 'react';

function LastActor({ lastActor }) {
  if (!lastActor) return null;

  return (
    <div style={{
      background: '#e3f2fd',
      padding: '15px',
      borderRadius: '10px',
      marginBottom: '20px',
      borderLeft: '4px solid #2196f3'
    }}>
      <p style={{ margin: '5px 0' }}>
        Dernier acteur: <strong>{lastActor.label}</strong>
      </p>
      <p style={{ fontSize: '0.9em', color: '#666', fontStyle: 'italic', margin: '5px 0' }}>
        Trouvez un acteur ayant joué dans un film commun
      </p>
    </div>
  );
}

export default LastActor;
