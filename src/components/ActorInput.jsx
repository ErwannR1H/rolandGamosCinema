import React from 'react';

function ActorInput({ value, onChange, onSubmit, onGiveUp, isGameActive, isLoading }) {
  const buttonStyle = (type) => {
    let bgColor = '#ccc';
    
    if (isGameActive && !isLoading) {
      if (type === 'submit') {
        bgColor = '#28a745'; // Vert pour valider
      } else if (type === 'giveup') {
        bgColor = '#dc3545'; // Rouge pour abandonner
      }
    }
    
    return {
      padding: '15px 25px',
      border: 'none',
      borderRadius: '10px',
      fontSize: '1em',
      cursor: isGameActive && !isLoading ? 'pointer' : 'not-allowed',
      transition: 'all 0.3s',
      fontWeight: '600',
      background: bgColor,
      color: 'white'
    };
  };

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
      <button onClick={onSubmit} disabled={!isGameActive || isLoading} style={buttonStyle('submit')}>
        Valider
      </button>
      <button onClick={onGiveUp} disabled={!isGameActive || isLoading} style={buttonStyle('giveup')}>
        Abandonner
      </button>
    </div>
  );
}

export default ActorInput;
