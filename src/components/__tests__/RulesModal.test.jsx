import { render, screen, fireEvent } from '@testing-library/react';
import RulesModal from '../RulesModal';

describe('RulesModal', () => {
  test('n\'affiche rien quand isOpen est false', () => {
    const { container } = render(
      <RulesModal isOpen={false} onClose={() => {}} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  test('affiche le modal quand isOpen est true', () => {
    render(
      <RulesModal isOpen={true} onClose={() => {}} />
    );
    
    expect(screen.getByText('Règles du jeu')).toBeInTheDocument();
  });

  test('affiche les règles du jeu', () => {
    render(
      <RulesModal isOpen={true} onClose={() => {}} />
    );
    
    expect(screen.getByText(/Le Joueur 1 commence/i)).toBeInTheDocument();
  });

  test('appelle onClose quand on clique sur le X', () => {
    const mockOnClose = jest.fn();
    
    render(
      <RulesModal isOpen={true} onClose={mockOnClose} />
    );
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('affiche le titre des règles', () => {
    render(
      <RulesModal isOpen={true} onClose={() => {}} />
    );
    
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Règles du jeu');
  });
});
