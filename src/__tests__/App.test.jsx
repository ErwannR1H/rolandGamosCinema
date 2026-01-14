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
    
    expect(screen.getByText(/Solo Classique/i)).toBeInTheDocument();
    expect(screen.getByText(/Solo Défi/i)).toBeInTheDocument();
    expect(screen.getByText(/Multijoueur Classique/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyse du Réseau/i)).toBeInTheDocument();
  });

  test('affiche la description sur la page d\'accueil', () => {
    render(<App />);
    
    expect(screen.getByText(/Choisissez votre mode de jeu/i)).toBeInTheDocument();
    expect(screen.getByText(/À propos/i)).toBeInTheDocument();
  });

  test('a un lien vers /game', () => {
    render(<App />);
    
    const gameLink = screen.getByText(/Multijoueur Classique/i).closest('a');
    expect(gameLink).toHaveAttribute('href', '/game');
  });

  test('a un lien vers /about', () => {
    render(<App />);
    
    const aboutLink = screen.getByText(/À propos/i).closest('a');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });
});
