import React from 'react';

function ActorInput({ value, onChange, onSubmit, onGiveUp, isGameActive, isLoading }) {
  const buttonStyle = (isPrimary) => ({
    padding: '15px 25px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1em',
    cursor: isGameActive && !isLoading ? 'pointer' : 'not-allowed',
    transition: 'all 0.3s',
    fontWeight: '600',
    background: isGameActive && !isLoading ? (isPrimary ? '#667eea' : '#6c757d') : '#ccc',
    color: 'white'
  });

  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      <input 
        type="text" 
        placeholder="Entrez le nom d'un acteur (ex: Brad Pitt)"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
        disabled={!isGameActive || isLoading}
        style={{
          flex: 1,
          padding: '15px',
          border: '2px solid #ddd',
          borderRadius: '10px',
          fontSize: '1em'
        }}
      />
      <button onClick={onSubmit} disabled={!isGameActive || isLoading} style={buttonStyle(true)}>
        Valider
      </button>
      <button onClick={onGiveUp} disabled={!isGameActive || isLoading} style={buttonStyle(false)}>
        Abandonner
      </button>
    </div>
  );
}

export default ActorInput;
