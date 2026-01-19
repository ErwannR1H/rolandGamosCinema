/**
 * Tests d'intégration - Scénarios utilisateur complets
 * Ces tests simulent des parcours utilisateurs réels dans l'application
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SoloGame from '../components/SoloGame';
import ChallengeGame from '../components/ChallengeGame';
import * as wikidataService from '../services/wikidataService';
import * as aiPlayerService from '../services/aiPlayerService';

// Mock des services externes
jest.mock('../services/wikidataService');
jest.mock('../services/aiPlayerService');

describe('Tests d\'intégration - Scénarios complets', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        if (localStorage.clear) {
            localStorage.clear();
        }
    });

    /**
     * SCÉNARIO 1 : Démarrage d'une partie solo
     * User story : Un utilisateur lance l'application en mode solo et démarre une partie
     */
    test('Scénario 1 : Lancement et démarrage d\'une partie solo', async () => {
        // Render
        render(
            <BrowserRouter>
                <SoloGame />
            </BrowserRouter>
        );

        // Vérifier l'écran d'accueil
        expect(screen.getByText(/🤖 Mode Solo/i)).toBeInTheDocument();
        expect(screen.getByText(/Score/i)).toBeInTheDocument();
        expect(screen.getByText(/Record/i)).toBeInTheDocument();
        
        // Bouton de démarrage
        const startButton = screen.getByText(/🎮 Commencer/i);
        expect(startButton).toBeInTheDocument();
        
        // Démarrer la partie
        fireEvent.click(startButton);

        // Vérifier que le jeu est lancé
        await waitFor(() => {
            expect(screen.getByText(/C'est parti/i)).toBeInTheDocument();
        });

        // Vérifier la présence des éléments de jeu
        expect(screen.getByPlaceholderText(/nom d'un acteur/i)).toBeInTheDocument();
        expect(screen.getByText(/Valider/i)).toBeInTheDocument();
        expect(screen.getByText(/Abandonner/i)).toBeInTheDocument();
    });

    /**
     * SCÉNARIO 2 : Saisie d'un acteur
     * User story : Un joueur saisit le nom d'un acteur dans l'input
     */
    test('Scénario 2 : Saisie et soumission d\'un nom d\'acteur', async () => {
        // Mock de la recherche d'acteur
        wikidataService.findActorOnWikidata.mockResolvedValue({
            actor: 'http://www.wikidata.org/entity/Q123',
            label: 'Brad Pitt',
            imageUrl: 'https://example.com/brad.jpg',
            wikidataUrl: 'https://www.wikidata.org/wiki/Q123'
        });

        wikidataService.findCommonMovieOnWikidata.mockResolvedValue(null);
        aiPlayerService.findValidActorResponse.mockResolvedValue(null);

        // Render et démarrer
        render(
            <BrowserRouter>
                <SoloGame />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByText(/🎮 Commencer/i));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/nom d'un acteur/i)).toBeInTheDocument();
        });

        // Saisir un nom
        const input = screen.getByPlaceholderText(/nom d'un acteur/i);
        fireEvent.change(input, { target: { value: 'Brad Pitt' } });
        
        expect(input.value).toBe('Brad Pitt');

        // Soumettre
        const submitButton = screen.getByText(/Valider/i);
        fireEvent.click(submitButton);

        // Vérifier que le service a été appelé
        await waitFor(() => {
            expect(wikidataService.findActorOnWikidata).toHaveBeenCalledWith('Brad Pitt');
        }, { timeout: 2000 });
    });

    /**
     * SCÉNARIO 3 : Abandon d'une partie
     * User story : Un joueur abandonne sa partie en cours
     */
    test('Scénario 3 : Abandon d\'une partie en cours', async () => {
        // Render et démarrer
        render(
            <BrowserRouter>
                <SoloGame />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByText(/🎮 Commencer/i));

        await waitFor(() => {
            expect(screen.getByText(/C'est parti/i)).toBeInTheDocument();
        });

        // Abandonner
        const abandonButton = screen.getByText(/Abandonner/i);
        fireEvent.click(abandonButton);

        // Vérifier le game over
        await waitFor(() => {
            const gameOverElements = screen.getAllByText(/Game Over/i);
            expect(gameOverElements.length).toBeGreaterThan(0);
        });

        // Vérifier qu'on peut recommencer
        expect(screen.getByText(/Rejouer|Nouvelle partie/i)).toBeInTheDocument();
    });

    /**
     * SCÉNARIO 4 : Nouvelle partie après game over
     * User story : Après un game over, le joueur relance une nouvelle partie
     */
    test('Scénario 4 : Relancer une partie après game over', async () => {
        // Render
        render(
            <BrowserRouter>
                <SoloGame />
            </BrowserRouter>
        );

        // Démarrer et abandonner
        fireEvent.click(screen.getByText(/🎮 Commencer/i));
        
        await waitFor(() => {
            expect(screen.getByText(/C'est parti/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Abandonner/i));

        await waitFor(() => {
            const gameOverElements = screen.getAllByText(/Game Over/i);
            expect(gameOverElements.length).toBeGreaterThan(0);
        });

        // Nouvelle partie
        const newGameButton = screen.getByText(/Rejouer|Nouvelle partie/i);
        fireEvent.click(newGameButton);

        // Vérifier que le jeu redémarre
        await waitFor(() => {
            expect(screen.getByText(/C'est parti/i)).toBeInTheDocument();
        });

        // Vérifier la réinitialisation
        expect(screen.getByPlaceholderText(/nom d'un acteur/i)).toBeInTheDocument();
        expect(screen.getAllByText('0')).toHaveLength(2); // Score et Record
    });

    /**
     * SCÉNARIO 5 : Navigation - Retour à l'accueil
     * User story : Un joueur retourne à l'accueil depuis le jeu
     */
    test('Scénario 5 : Navigation vers la page d\'accueil', () => {
        // Render
        render(
            <BrowserRouter>
                <SoloGame />
            </BrowserRouter>
        );

        // Vérifier le bouton de retour
        const backButton = screen.getByText(/Retour à l'accueil/i);
        expect(backButton).toBeInTheDocument();
        
        // Vérifier le lien
        const backLink = backButton.closest('a');
        expect(backLink).toHaveAttribute('href', '/');
    });

    /**
     * SCÉNARIO 6 : Mode défi - Initialisation
     * User story : Un joueur lance un défi aléatoire
     */
    test('Scénario 6 : Initialisation d\'un défi aléatoire', async () => {
        // Mock du défi
        const challengeData = {
            startActor: {
                actor: 'http://www.wikidata.org/entity/Q100',
                label: 'John Doe',
                imageUrl: 'https://example.com/john.jpg',
                wikidataUrl: 'https://www.wikidata.org/wiki/Q100'
            },
            endActor: {
                actor: 'http://www.wikidata.org/entity/Q200',
                label: 'Jane Smith',
                imageUrl: 'https://example.com/jane.jpg',
                wikidataUrl: 'https://www.wikidata.org/wiki/Q200'
            },
            path: [],
            pathLength: 2
        };

        wikidataService.generateRandomChallenge.mockResolvedValue(challengeData);

        const config = {
            actorSelection: 'random',
            maxErrors: 3,
            hintsEnabled: false
        };

        const onReset = jest.fn();

        // Render
        render(
            <BrowserRouter>
                <ChallengeGame config={config} onReset={onReset} />
            </BrowserRouter>
        );

        // Attendre l'initialisation
        await waitFor(() => {
            const johnDoeElements = screen.getAllByText(/John Doe/i);
            expect(johnDoeElements.length).toBeGreaterThan(0);
            expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
        }, { timeout: 3000 });

        // Vérifier l'interface du défi
        expect(screen.getByText(/Mode Défi/i)).toBeInTheDocument();
        expect(screen.getByText(/Erreurs/i)).toBeInTheDocument();
        expect(screen.getByText(/0\/3/i)).toBeInTheDocument();
    });
});
