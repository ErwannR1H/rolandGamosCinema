import React from 'react';

function GameStatus({ currentPlayer, scores, isGameActive }) {
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
        color: '#667eea'
      }}>
        {isGameActive ? `Joueur ${currentPlayer}` : 'Partie terminée'}
      </div>
      <div style={{ display: 'flex', gap: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9em', color: '#666' }}>Joueur 1:</span>
          <span style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{scores.player1}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9em', color: '#666' }}>Joueur 2:</span>
          <span style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{scores.player2}</span>
        </div>
      </div>
    </div>
  );
}

export default GameStatus;
