import React from 'react';

function Loading({ isLoading }) {
  if (!isLoading) return null;

  return (
    <div style={{ textAlign: 'center', padding: '30px' }}>
      <div style={{
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 15px'
      }} />
      <p>Vérification avec Wikidata...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Loading;
