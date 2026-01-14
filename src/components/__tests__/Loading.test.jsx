import { render, screen } from '@testing-library/react';
import Loading from '../Loading';

describe('Loading', () => {
  test('n\'affiche rien quand isLoading est false', () => {
    const { container } = render(<Loading isLoading={false} />);
    
    expect(container.firstChild).toBeNull();
  });

  test('affiche le message de chargement quand isLoading est true', () => {
    render(<Loading isLoading={true} />);
    
    expect(screen.getByText('Vérification avec Wikidata...')).toBeInTheDocument();
  });

  test('affiche le spinner de chargement', () => {
    const { container } = render(<Loading isLoading={true} />);
    
    const spinner = container.querySelector('div > div');
    expect(spinner).toBeInTheDocument();
  });
});
