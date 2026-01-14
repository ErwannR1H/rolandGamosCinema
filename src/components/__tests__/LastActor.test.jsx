import { render, screen } from '@testing-library/react';
import LastActor from '../LastActor';

describe('LastActor', () => {
  test('n\'affiche rien quand pas d\'acteur', () => {
    const { container } = render(<LastActor lastActor={null} />);
    
    expect(container.firstChild).toBeNull();
  });

  test('affiche le nom de l\'acteur', () => {
    const lastActor = {
      label: 'Leonardo DiCaprio'
    };

    render(<LastActor lastActor={lastActor} />);
    
    expect(screen.getByText('Leonardo DiCaprio')).toBeInTheDocument();
  });

  test('affiche le texte "Dernier acteur:"', () => {
    const lastActor = {
      label: 'Leonardo DiCaprio'
    };

    render(<LastActor lastActor={lastActor} />);
    
    expect(screen.getByText(/Dernier acteur:/)).toBeInTheDocument();
  });

  test('affiche le message d\'aide', () => {
    const lastActor = {
      label: 'Brad Pitt'
    };

    render(<LastActor lastActor={lastActor} />);
    
    expect(screen.getByText(/Trouvez un acteur ayant joué dans un film commun/)).toBeInTheDocument();
  });
});
