import { findActorOnWikidata, findCommonMovieOnWikidata } from '../wikidataService';

// Mock global fetch
global.fetch = jest.fn();

describe('wikidataService', () => {
    beforeEach(() => {
        // Réinitialiser le mock avant chaque test
        fetch.mockClear();
    });

    describe('findActorOnWikidata', () => {
        test('devrait trouver un acteur et retourner ses informations', async () => {
            // Mock de la réponse de recherche
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    search: [
                        {
                            id: 'Q123',
                            label: 'Tom Hanks',
                            description: 'American actor'
                        }
                    ]
                })
            });

            // Mock de la vérification que c'est un acteur (ASK query)
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ boolean: true })
            });

            // Mock de la récupération de l'image
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: {
                        bindings: [
                            { image: { value: 'https://example.com/image.jpg' } }
                        ]
                    }
                })
            });

            const result = await findActorOnWikidata('Tom Hanks');

            expect(result).toEqual({
                actor: 'http://www.wikidata.org/entity/Q123',
                label: 'Tom Hanks',
                description: 'American actor',
                wikidataUrl: 'https://www.wikidata.org/wiki/Q123',
                imageUrl: 'https://example.com/image.jpg'
            });

            // Vérifier que fetch a été appelé 3 fois
            expect(fetch).toHaveBeenCalledTimes(3);
        });

        test('devrait retourner null si aucun résultat trouvé', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ search: [] })
            });

            const result = await findActorOnWikidata('Acteur Inexistant');

            expect(result).toBeNull();
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('devrait retourner null si l\'entité n\'est pas un acteur', async () => {
            // Mock de la réponse de recherche
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    search: [
                        {
                            id: 'Q456',
                            label: 'Paris',
                            description: 'Capital of France'
                        }
                    ]
                })
            });

            // Mock de la vérification - ce n'est pas un acteur
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ boolean: false })
            });

            const result = await findActorOnWikidata('Paris');

            expect(result).toBeNull();
            expect(fetch).toHaveBeenCalledTimes(2);
        });

        test('devrait gérer les erreurs de l\'API', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(findActorOnWikidata('Test')).rejects.toThrow('Network error');
        });
    });

    describe('findCommonMovieOnWikidata', () => {
        test('devrait trouver un film commun entre deux acteurs', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: {
                        bindings: [
                            {
                                movie: { value: 'http://www.wikidata.org/entity/Q456' },
                                movieLabel: { value: 'Forrest Gump' },
                                poster: { value: 'https://example.com/poster.jpg' }
                            }
                        ]
                    }
                })
            });

            const result = await findCommonMovieOnWikidata(
                'http://www.wikidata.org/entity/Q123',
                'http://www.wikidata.org/entity/Q789'
            );

            expect(result).toEqual({
                movie: 'http://www.wikidata.org/entity/Q456',
                movieLabel: 'Forrest Gump',
                moviePosterUrl: 'https://example.com/poster.jpg',
                source: 'Wikidata'
            });

            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('devrait retourner null si aucun film commun', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: { bindings: [] }
                })
            });

            const result = await findCommonMovieOnWikidata(
                'http://www.wikidata.org/entity/Q123',
                'http://www.wikidata.org/entity/Q789'
            );

            expect(result).toBeNull();
        });

        test('devrait gérer un film sans affiche', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: {
                        bindings: [
                            {
                                movie: { value: 'http://www.wikidata.org/entity/Q456' },
                                movieLabel: { value: 'Some Movie' }
                                // Pas de poster
                            }
                        ]
                    }
                })
            });

            const result = await findCommonMovieOnWikidata(
                'http://www.wikidata.org/entity/Q123',
                'http://www.wikidata.org/entity/Q789'
            );

            expect(result.moviePosterUrl).toBeNull();
        });

        test('devrait gérer les erreurs SPARQL', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            const result = await findCommonMovieOnWikidata(
                'http://www.wikidata.org/entity/Q123',
                'http://www.wikidata.org/entity/Q789'
            );

            expect(result).toBeNull();
        });
    });
});
