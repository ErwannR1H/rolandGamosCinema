import { findValidActorResponse, getHints, getRandomStartingActor } from '../aiPlayerService';

// Mock global fetch
global.fetch = jest.fn();

describe('aiPlayerService', () => {
    beforeEach(() => {
        fetch.mockClear();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        // Mock Math.random pour des résultats prévisibles
        jest.spyOn(Math, 'random').mockReturnValue(0);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('findValidActorResponse', () => {
        test('devrait trouver un co-acteur valide', async () => {
            const mockResponse = {
                results: {
                    bindings: [
                        {
                            coActor: { value: 'http://www.wikidata.org/entity/Q37079' },
                            coActorLabel: { value: 'Catherine Zeta-Jones' },
                            movie: { value: 'http://www.wikidata.org/entity/Q109331' },
                            movieLabel: { value: 'The Terminal' },
                            image: { value: 'https://example.com/image.jpg' }
                        }
                    ]
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await findValidActorResponse('http://www.wikidata.org/entity/Q2263');

            expect(result).toEqual({
                actor: 'http://www.wikidata.org/entity/Q37079',
                label: 'Catherine Zeta-Jones',
                imageUrl: 'https://example.com/image.jpg',
                commonMovie: {
                    uri: 'http://www.wikidata.org/entity/Q109331',
                    label: 'The Terminal'
                }
            });
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        test('devrait exclure les acteurs déjà utilisés', async () => {
            const mockResponse = {
                results: {
                    bindings: [
                        {
                            coActor: { value: 'http://www.wikidata.org/entity/Q456' },
                            coActorLabel: { value: 'Actor 2' },
                            movie: { value: 'http://www.wikidata.org/entity/Q789' },
                            movieLabel: { value: 'Movie' }
                        }
                    ]
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const excludedUris = [
                'http://www.wikidata.org/entity/Q123',
                'http://www.wikidata.org/entity/Q789'
            ];

            await findValidActorResponse('http://www.wikidata.org/entity/Q2263', excludedUris);

            const callArgs = fetch.mock.calls[0];
            const url = callArgs[0];
            
            // Vérifier que la requête SPARQL contient le filtre d'exclusion
            expect(url).toContain('FILTER');
            expect(url).toContain('Q123');
            expect(url).toContain('Q789');
        });

        test('devrait gérer le cas sans acteurs exclus', async () => {
            const mockResponse = {
                results: {
                    bindings: [
                        {
                            coActor: { value: 'http://www.wikidata.org/entity/Q456' },
                            coActorLabel: { value: 'Actor' },
                            movie: { value: 'http://www.wikidata.org/entity/Q789' },
                            movieLabel: { value: 'Movie' }
                        }
                    ]
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await findValidActorResponse('http://www.wikidata.org/entity/Q2263', []);

            expect(result).toBeTruthy();
            expect(result.actor).toBe('http://www.wikidata.org/entity/Q456');
        });

        test('devrait retourner null si aucun co-acteur trouvé', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: { bindings: [] }
                })
            });

            const result = await findValidActorResponse('http://www.wikidata.org/entity/Q2263');

            expect(result).toBeNull();
        });

        test('devrait retourner null si erreur SPARQL', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            const result = await findValidActorResponse('http://www.wikidata.org/entity/Q2263');

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });

        test('devrait gérer les acteurs sans image', async () => {
            const mockResponse = {
                results: {
                    bindings: [
                        {
                            coActor: { value: 'http://www.wikidata.org/entity/Q456' },
                            coActorLabel: { value: 'Actor' },
                            movie: { value: 'http://www.wikidata.org/entity/Q789' },
                            movieLabel: { value: 'Movie' }
                            // Pas d'image
                        }
                    ]
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await findValidActorResponse('http://www.wikidata.org/entity/Q2263');

            expect(result.imageUrl).toBeNull();
        });

        test('devrait choisir un acteur aléatoire parmi plusieurs résultats', async () => {
            const mockResponse = {
                results: {
                    bindings: [
                        {
                            coActor: { value: 'http://www.wikidata.org/entity/Q1' },
                            coActorLabel: { value: 'Actor 1' },
                            movie: { value: 'http://www.wikidata.org/entity/Q10' },
                            movieLabel: { value: 'Movie 1' }
                        },
                        {
                            coActor: { value: 'http://www.wikidata.org/entity/Q2' },
                            coActorLabel: { value: 'Actor 2' },
                            movie: { value: 'http://www.wikidata.org/entity/Q20' },
                            movieLabel: { value: 'Movie 2' }
                        }
                    ]
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            // Math.random est mocké à 0, donc devrait choisir le premier
            const result = await findValidActorResponse('http://www.wikidata.org/entity/Q2263');

            expect(result.label).toBe('Actor 1');
        });

        test('devrait gérer les erreurs réseau', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await findValidActorResponse('http://www.wikidata.org/entity/Q2263');

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('getHints', () => {
        test('devrait retourner 3 suggestions d\'acteurs', async () => {
            const mockResponse = {
                results: {
                    bindings: [
                        {
                            coActorLabel: { value: 'Actor 1' },
                            movieLabel: { value: 'Movie 1' }
                        },
                        {
                            coActorLabel: { value: 'Actor 2' },
                            movieLabel: { value: 'Movie 2' }
                        },
                        {
                            coActorLabel: { value: 'Actor 3' },
                            movieLabel: { value: 'Movie 3' }
                        },
                        {
                            coActorLabel: { value: 'Actor 4' },
                            movieLabel: { value: 'Movie 4' }
                        }
                    ]
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await getHints('http://www.wikidata.org/entity/Q2263', []);

            expect(result).toHaveLength(3);
            expect(result[0]).toHaveProperty('label');
            expect(result[0]).toHaveProperty('movie');
        });

        test('devrait retourner un tableau vide si aucun résultat', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: { bindings: [] }
                })
            });

            const result = await getHints('http://www.wikidata.org/entity/Q2263', []);

            expect(result).toEqual([]);
        });

        test('devrait exclure les acteurs déjà utilisés', async () => {
            const mockResponse = {
                results: {
                    bindings: [
                        {
                            coActorLabel: { value: 'Actor' },
                            movieLabel: { value: 'Movie' }
                        }
                    ]
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const excludedUris = ['http://www.wikidata.org/entity/Q123'];
            await getHints('http://www.wikidata.org/entity/Q2263', excludedUris);

            const callArgs = fetch.mock.calls[0];
            const url = callArgs[0];
            
            expect(url).toContain('FILTER');
            expect(url).toContain('Q123');
        });

        test('devrait retourner un tableau vide si erreur HTTP', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            const result = await getHints('http://www.wikidata.org/entity/Q2263', []);

            expect(result).toEqual([]);
        });

        test('devrait gérer les erreurs réseau', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await getHints('http://www.wikidata.org/entity/Q2263', []);

            expect(result).toEqual([]);
            expect(console.error).toHaveBeenCalled();
        });

        test('devrait retourner moins de 3 résultats si peu disponibles', async () => {
            const mockResponse = {
                results: {
                    bindings: [
                        {
                            coActorLabel: { value: 'Actor 1' },
                            movieLabel: { value: 'Movie 1' }
                        }
                    ]
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await getHints('http://www.wikidata.org/entity/Q2263', []);

            expect(result).toHaveLength(1);
        });
    });

    describe('getRandomStartingActor', () => {
        test('devrait retourner un acteur célèbre aléatoire', async () => {
            const mockResponse = {
                results: {
                    bindings: [
                        {
                            actor: { value: 'http://www.wikidata.org/entity/Q2263' },
                            actorLabel: { value: 'Tom Hanks' },
                            image: { value: 'https://example.com/tom.jpg' }
                        },
                        {
                            actor: { value: 'http://www.wikidata.org/entity/Q123' },
                            actorLabel: { value: 'Brad Pitt' },
                            image: { value: 'https://example.com/brad.jpg' }
                        }
                    ]
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await getRandomStartingActor();

            expect(result).toEqual({
                actor: 'http://www.wikidata.org/entity/Q2263',
                label: 'Tom Hanks',
                imageUrl: 'https://example.com/tom.jpg'
            });
        });

        test('devrait retourner null si aucun acteur trouvé', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    results: { bindings: [] }
                })
            });

            const result = await getRandomStartingActor();

            expect(result).toBeNull();
        });

        test('devrait retourner null si erreur HTTP', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            const result = await getRandomStartingActor();

            expect(result).toBeNull();
        });

        test('devrait gérer les acteurs sans image', async () => {
            const mockResponse = {
                results: {
                    bindings: [
                        {
                            actor: { value: 'http://www.wikidata.org/entity/Q123' },
                            actorLabel: { value: 'Actor' }
                            // Pas d'image dans ce mock
                        }
                    ]
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await getRandomStartingActor();

            // L'implémentation retourne null si l'image est manquante ou undefined si non présente
            expect([null, undefined]).toContain(result.imageUrl);
        });

        test('devrait gérer les erreurs réseau', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await getRandomStartingActor();

            expect(result).toBeNull();
            expect(console.error).toHaveBeenCalled();
        });
    });
});
