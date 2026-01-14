import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock des services externes
jest.mock('../services/sparqlService', () => ({
  findActor: jest.fn(),
  haveCommonMovie: jest.fn()
}));

describe('App', () => {
  test('affiche la page d\'accueil par défaut', () => {
    render(<App />);
    
    expect(screen.getByText(/Bienvenue sur notre plateforme d'analyse cinématographique/i)).toBeInTheDocument();
  });

  test('affiche les boutons de navigation sur l\'accueil', () => {
    render(<App />);
    
    expect(screen.getByText(/Tester maintenant ses connaissances/i)).toBeInTheDocument();
    expect(screen.getByText(/Vers analyse de data/i)).toBeInTheDocument();
  });

  test('affiche la description sur la page d\'accueil', () => {
    render(<App />);
    
    expect(screen.getByText(/À propos de l'application/i)).toBeInTheDocument();
  });

  test('a un lien vers /game', () => {
    render(<App />);
    
    const gameLink = screen.getByText(/Tester maintenant ses connaissances/i).closest('a');
    expect(gameLink).toHaveAttribute('href', '/game');
  });

  test('a un lien vers /about', () => {
    render(<App />);
    
    const aboutLink = screen.getByText(/Vers analyse de data/i).closest('a');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });
});
