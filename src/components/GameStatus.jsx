import React from 'react';
function GameStatus({ currentPlayer, scores = {}, isGameActive }) {
  const colors = ['#667eea', '#f5576c', '#34c759', '#ffb400', '#6f42c1'];

  const playerLabel = isGameActive ? `Joueur ${currentPlayer}` : 'Partie terminée';

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: '#f8f9fa',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px'
    }}>
      <div style={{
        fontSize: '1.3em',
        fontWeight: 'bold',
        color: colors[(currentPlayer - 1) % colors.length],
        transition: 'color 0.5s ease'
      }}>
        {playerLabel}
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        {Object.keys(scores).map((key, idx) => {
          const playerNum = key.replace('player', '');
          const color = colors[(Number(playerNum) - 1) % colors.length];
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9em', color, fontWeight: '600' }}>{`Joueur ${playerNum}:`}</span>
              <span style={{ fontSize: '1.5em', fontWeight: 'bold', color }}>{scores[key] ?? 0}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GameStatus;
