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
    
    expect(screen.getByText(/multijoueur/i)).toBeInTheDocument();
    expect(screen.getByText(/Mode Solo - Défiez l'IA/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyse du réseau d'acteurs/i)).toBeInTheDocument();
  });

  test('a un lien vers /game', () => {
    render(<App />);
    
    const gameLink = screen.getByText(/multijoueur/i).closest('a');
    expect(gameLink).toHaveAttribute('href', '/game');
  });

  test('a un lien vers /solo', () => {
    render(<App />);
    
    const soloLink = screen.getByText(/solo/i).closest('a');
    expect(soloLink).toHaveAttribute('href', '/solo');
  });

  test('a un lien vers /analysis', () => {
    render(<App />);
    
    const analysisLink = screen.getByText(/Analyse du réseau d'acteurs/i).closest('a');
    expect(analysisLink).toHaveAttribute('href', '/analysis');
  });
});
