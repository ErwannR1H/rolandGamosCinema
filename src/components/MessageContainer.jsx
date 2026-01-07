import React from 'react';

function MessageContainer({ messages }) {
  const getMessageStyle = (type) => {
    const baseStyle = {
      padding: '15px',
      borderRadius: '10px',
      marginBottom: '10px'
    };

    if (type === 'success') {
      return { ...baseStyle, background: '#d4edda', color: '#155724', borderLeft: '4px solid #28a745' };
    }
    if (type === 'error') {
      return { ...baseStyle, background: '#f8d7da', color: '#721c24', borderLeft: '4px solid #dc3545' };
    }
    return { ...baseStyle, background: '#d1ecf1', color: '#0c5460', borderLeft: '4px solid #17a2b8' };
  };

  return (
    <div style={{ marginBottom: '20px', minHeight: '50px' }}>
      {messages.map((message, index) => (
        <div key={index} style={getMessageStyle(message.type)}>
          {message.text}
        </div>
      ))}
    </div>
  );
}

export default MessageContainer;
