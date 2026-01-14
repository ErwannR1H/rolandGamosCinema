import { render, screen } from '@testing-library/react';
import GameStatus from '../GameStatus';

describe('GameStatus', () => {
  const mockScores = { player1: 0, player2: 0 };

  test('affiche le joueur courant quand le jeu est actif', () => {
    render(<GameStatus currentPlayer={1} scores={mockScores} isGameActive={true} />);
    
    expect(screen.getByText('Joueur 1')).toBeInTheDocument();
  });

  test('affiche "Partie terminée" quand le jeu n\'est pas actif', () => {
    render(<GameStatus currentPlayer={1} scores={mockScores} isGameActive={false} />);
    
    expect(screen.getByText('Partie terminée')).toBeInTheDocument();
  });

  test('affiche les scores des deux joueurs', () => {
    const scores = { player1: 3, player2: 5 };
    render(<GameStatus currentPlayer={1} scores={scores} isGameActive={true} />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('affiche Joueur 2 quand c\'est son tour', () => {
    render(<GameStatus currentPlayer={2} scores={mockScores} isGameActive={true} />);
    
    expect(screen.getByText('Joueur 2')).toBeInTheDocument();
  });

  test('affiche les labels des joueurs', () => {
    render(<GameStatus currentPlayer={1} scores={mockScores} isGameActive={true} />);
    
    expect(screen.getByText('Joueur 1:')).toBeInTheDocument();
    expect(screen.getByText('Joueur 2:')).toBeInTheDocument();
  });
});
