import { render, screen } from '@testing-library/react';
import MessageContainer from '../MessageContainer';

describe('MessageContainer', () => {
  test('affiche un conteneur vide quand il n\'y a pas de messages', () => {
    const { container } = render(<MessageContainer messages={[]} />);
    
    const mainDiv = container.firstChild;
    expect(mainDiv).toBeInTheDocument();
    expect(mainDiv.children.length).toBe(0);
  });

  test('affiche un message de succès', () => {
    const messages = [
      { text: 'Acteur trouvé !', type: 'success' }
    ];

    render(<MessageContainer messages={messages} />);
    
    expect(screen.getByText('Acteur trouvé !')).toBeInTheDocument();
  });

  test('affiche un message d\'erreur', () => {
    const messages = [
      { text: 'Acteur non trouvé', type: 'error' }
    ];

    render(<MessageContainer messages={messages} />);
    
    expect(screen.getByText('Acteur non trouvé')).toBeInTheDocument();
  });

  test('affiche un message d\'info', () => {
    const messages = [
      { text: 'Recherche en cours...', type: 'info' }
    ];

    render(<MessageContainer messages={messages} />);
    
    expect(screen.getByText('Recherche en cours...')).toBeInTheDocument();
  });

  test('affiche plusieurs messages', () => {
    const messages = [
      { text: 'Premier message', type: 'success' },
      { text: 'Deuxième message', type: 'error' },
      { text: 'Troisième message', type: 'info' }
    ];

    render(<MessageContainer messages={messages} />);
    
    expect(screen.getByText('Premier message')).toBeInTheDocument();
    expect(screen.getByText('Deuxième message')).toBeInTheDocument();
    expect(screen.getByText('Troisième message')).toBeInTheDocument();
  });

  test('applique le bon style pour un message de succès', () => {
    const messages = [
      { text: 'Succès', type: 'success' }
    ];

    const { container } = render(<MessageContainer messages={messages} />);
    const messageDiv = screen.getByText('Succès');
    
    expect(messageDiv).toHaveStyle({ 
      background: 'rgb(212, 237, 218)', 
      color: 'rgb(21, 87, 36)',
      borderLeft: '4px solid rgb(40, 167, 69)'
    });
  });

  test('applique le bon style pour un message d\'erreur', () => {
    const messages = [
      { text: 'Erreur', type: 'error' }
    ];

    const { container } = render(<MessageContainer messages={messages} />);
    const messageDiv = screen.getByText('Erreur');
    
    expect(messageDiv).toHaveStyle({ 
      background: 'rgb(248, 215, 218)', 
      color: 'rgb(114, 28, 36)',
      borderLeft: '4px solid rgb(220, 53, 69)'
    });
  });
});
