import { render, screen } from '@testing-library/react';
import ActorsHistory from '../ActorsHistory';

describe('ActorsHistory', () => {
  test('n\'affiche rien quand la liste est vide', () => {
    const { container } = render(<ActorsHistory actors={[]} />);
    
    expect(container.firstChild).toBeNull();
  });

  test('affiche le titre quand il y a des acteurs', () => {
    const actors = [
      { label: 'Brad Pitt', imageUrl: null, player: 1 }
    ];

    render(<ActorsHistory actors={actors} />);
    
    expect(screen.getByText('Acteurs déjà mentionnés:')).toBeInTheDocument();
  });

  test('affiche la liste des acteurs', () => {
    const actors = [
      { label: 'Brad Pitt', imageUrl: null, player: 1 },
      { label: 'George Clooney', imageUrl: null, player: 2 },
      { label: 'Matt Damon', imageUrl: null, player: 1 }
    ];

    render(<ActorsHistory actors={actors} />);
    
    expect(screen.getByText('Brad Pitt')).toBeInTheDocument();
    expect(screen.getByText('George Clooney')).toBeInTheDocument();
    expect(screen.getByText('Matt Damon')).toBeInTheDocument();
  });

  test('affiche les images des acteurs quand disponibles', () => {
    const actors = [
      { label: 'Brad Pitt', imageUrl: 'https://example.com/brad.jpg', player: 1 }
    ];

    render(<ActorsHistory actors={actors} />);
    
    const image = screen.getByAltText('Brad Pitt');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/brad.jpg');
  });

  test('n\'affiche pas d\'image quand imageUrl est null', () => {
    const actors = [
      { label: 'Brad Pitt', imageUrl: null, player: 1 }
    ];

    render(<ActorsHistory actors={actors} />);
    
    expect(screen.queryByAltText('Brad Pitt')).not.toBeInTheDocument();
  });
});
