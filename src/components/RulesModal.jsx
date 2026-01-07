import React from 'react';

function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div onClick={onClose} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white',
        padding: '30px',
        borderRadius: '15px',
        maxWidth: '600px',
        width: '90%',
        position: 'relative'
      }}>
        <span onClick={onClose} style={{
          position: 'absolute',
          top: '15px',
          right: '20px',
          fontSize: '2em',
          cursor: 'pointer',
          color: '#999'
        }}>
          &times;
        </span>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>Règles du jeu</h2>
        <ol style={{ marginLeft: '20px' }}>
          <li style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            Le Joueur 1 commence en donnant le nom d'un acteur de cinéma
          </li>
          <li style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            Le Joueur 2 doit donner le nom d'un acteur ayant joué dans un film commun avec l'acteur précédent
          </li>
          <li style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            Les joueurs alternent les tours
          </li>
          <li style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            Un acteur ne peut être mentionné qu'une seule fois par partie
          </li>
          <li style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            Si un joueur répète un acteur ou ne trouve pas de réponse valide, il perd
          </li>
          <li style={{ marginBottom: '10px', lineHeight: '1.6' }}>
            Les données proviennent de DBpedia
          </li>
        </ol>
      </div>
    </div>
  );
}

export default RulesModal;
