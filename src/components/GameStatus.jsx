import React from 'react';

function GameStatus({ currentPlayer, scores, isGameActive }) {
  const playerColor = currentPlayer === 1 ? '#667eea' : '#f5576c';
  
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
        color: playerColor,
        transition: 'color 0.5s ease'
      }}>
        {isGameActive ? `Joueur ${currentPlayer}` : 'Partie terminée'}
      </div>
      <div style={{ display: 'flex', gap: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9em', color: '#667eea', fontWeight: '600' }}>Joueur 1:</span>
          <span style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#667eea' }}>{scores.player1}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9em', color: '#f5576c', fontWeight: '600' }}>Joueur 2:</span>
          <span style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#f5576c' }}>{scores.player2}</span>
        </div>
      </div>
    </div>
  );
}

export default GameStatus;
