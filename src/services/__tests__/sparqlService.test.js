import { findActor, haveCommonMovie } from '../sparqlService';
import * as wikidataService from '../wikidataService';
import * as ollamaService from '../ollamaService';

// Mock des dépendances
jest.mock('../wikidataService');
jest.mock('../ollamaService');

describe('sparqlService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Supprimer les console.log pour les tests
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('findActor', () => {
        test('devrait trouver un acteur directement sur Wikidata', async () => {
            const mockActor = {
                actor: 'http://www.wikidata.org/entity/Q2263',
                label: 'Tom Hanks',
                description: 'American actor',
                wikidataUrl: 'https://www.wikidata.org/wiki/Q2263',
                imageUrl: 'https://example.com/tom.jpg'
            };

            wikidataService.findActorOnWikidata.mockResolvedValueOnce(mockActor);

            const result = await findActor('Tom Hanks');

            expect(result).toEqual({
                ...mockActor,
                source: 'Wikidata'
            });
            expect(wikidataService.findActorOnWikidata).toHaveBeenCalledWith('Tom Hanks');
            expect(ollamaService.improveActorNameForWikiData).not.toHaveBeenCalled();
        });

        test('devrait utiliser l\'IA si l\'acteur n\'est pas trouvé directement', async () => {
            const mockActor = {
                actor: 'http://www.wikidata.org/entity/Q2263',
                label: 'Tom Hanks',
                description: 'American actor',
                wikidataUrl: 'https://www.wikidata.org/wiki/Q2263',
                imageUrl: 'https://example.com/tom.jpg'
            };

            // Première recherche échoue
            wikidataService.findActorOnWikidata.mockResolvedValueOnce(null);
            
            // L'IA corrige le nom
            ollamaService.improveActorNameForWikiData.mockResolvedValueOnce('Tom Hanks');
            
            // Deuxième recherche réussit avec le nom corrigé
            wikidataService.findActorOnWikidata.mockResolvedValueOnce(mockActor);

            const result = await findActor('tom hank');

            expect(result).toEqual({
                ...mockActor,
                source: 'Wikidata'
            });
            expect(wikidataService.findActorOnWikidata).toHaveBeenCalledTimes(2);
            expect(ollamaService.improveActorNameForWikiData).toHaveBeenCalledWith('tom hank');
        });

        test('devrait retourner null si l\'IA retourne le même nom', async () => {
            wikidataService.findActorOnWikidata.mockResolvedValueOnce(null);
            ollamaService.improveActorNameForWikiData.mockResolvedValueOnce('test');

            const result = await findActor('test');

            expect(result).toBeNull();
            expect(wikidataService.findActorOnWikidata).toHaveBeenCalledTimes(1);
        });

        test('devrait retourner null si l\'IA retourne un nom vide', async () => {
            wikidataService.findActorOnWikidata.mockResolvedValueOnce(null);
            ollamaService.improveActorNameForWikiData.mockResolvedValueOnce('');

            const result = await findActor('acteur inconnu');

            expect(result).toBeNull();
        });

        test('devrait gérer les erreurs de l\'IA gracieusement', async () => {
            wikidataService.findActorOnWikidata.mockResolvedValueOnce(null);
            ollamaService.improveActorNameForWikiData.mockRejectedValueOnce(new Error('API error'));

            const result = await findActor('test');

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });

        test('devrait retourner null si aucun acteur trouvé même après correction IA', async () => {
            // Première recherche échoue
            wikidataService.findActorOnWikidata.mockResolvedValueOnce(null);
            
            // L'IA suggère un nom différent
            ollamaService.improveActorNameForWikiData.mockResolvedValueOnce('Unknown Actor');
            
            // Deuxième recherche échoue aussi
            wikidataService.findActorOnWikidata.mockResolvedValueOnce(null);

            const result = await findActor('acteur inconnu');

            expect(result).toBeNull();
            expect(wikidataService.findActorOnWikidata).toHaveBeenCalledTimes(2);
        });

        test('devrait gérer les erreurs de recherche Wikidata', async () => {
            wikidataService.findActorOnWikidata.mockRejectedValueOnce(new Error('Network error'));

            const result = await findActor('Tom Hanks');

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('haveCommonMovie', () => {
        test('devrait trouver un film commun entre deux acteurs', async () => {
            const mockMovie = {
                movie: 'http://www.wikidata.org/entity/Q109331',
                movieLabel: 'The Terminal',
                moviePosterUrl: 'https://example.com/poster.jpg',
                source: 'Wikidata'
            };

            wikidataService.findCommonMovieOnWikidata.mockResolvedValueOnce(mockMovie);

            const result = await haveCommonMovie(
                'http://www.wikidata.org/entity/Q2263',
                'http://www.wikidata.org/entity/Q37079'
            );

            expect(result).toEqual(mockMovie);
            expect(wikidataService.findCommonMovieOnWikidata).toHaveBeenCalledWith(
                'http://www.wikidata.org/entity/Q2263',
                'http://www.wikidata.org/entity/Q37079'
            );
        });

        test('devrait retourner null si aucun film commun', async () => {
            wikidataService.findCommonMovieOnWikidata.mockResolvedValueOnce(null);

            const result = await haveCommonMovie(
                'http://www.wikidata.org/entity/Q2263',
                'http://www.wikidata.org/entity/Q12345'
            );

            expect(result).toBeNull();
        });

        test('devrait propager les erreurs', async () => {
            wikidataService.findCommonMovieOnWikidata.mockRejectedValueOnce(
                new Error('SPARQL error')
            );

            await expect(
                haveCommonMovie(
                    'http://www.wikidata.org/entity/Q2263',
                    'http://www.wikidata.org/entity/Q12345'
                )
            ).rejects.toThrow('SPARQL error');
        });
    });
});
