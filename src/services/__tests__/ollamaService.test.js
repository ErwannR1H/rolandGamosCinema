import { improveActorNameForWikiData } from '../ollamaService';

// Mock global fetch
global.fetch = jest.fn();

describe('ollamaService', () => {
    beforeEach(() => {
        fetch.mockClear();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('improveActorNameForWikiData', () => {
        test('devrait corriger un nom d\'acteur mal orthographié', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: 'Tom Hanks'
                            }
                        }
                    ]
                })
            });

            const result = await improveActorNameForWikiData('tom hank');

            expect(result).toBe('Tom Hanks');
            expect(fetch).toHaveBeenCalledTimes(1);
            
            const callArgs = fetch.mock.calls[0];
            expect(callArgs[0]).toContain('ollama-ui.pagoda.liris.cnrs.fr');
            
            const body = JSON.parse(callArgs[1].body);
            expect(body.model).toBe('llama3:70b');
            expect(body.messages[1].content).toContain('tom hank');
        });

        test('devrait formater un nom en anglais', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: 'Leonardo DiCaprio'
                            }
                        }
                    ]
                })
            });

            const result = await improveActorNameForWikiData('leonardo di caprio');

            expect(result).toBe('Leonardo DiCaprio');
        });

        test('devrait retourner le nom amélioré avec espaces nettoyés', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: '  Brad Pitt  '
                            }
                        }
                    ]
                })
            });

            const result = await improveActorNameForWikiData('brad pit');

            expect(result).toBe('Brad Pitt');
        });

        test('devrait retourner le nom original si erreur réseau', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await improveActorNameForWikiData('Tom Hanks');

            expect(result).toBe('Tom Hanks');
            expect(console.error).toHaveBeenCalled();
        });

        test('devrait retourner le nom original si erreur HTTP', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            const result = await improveActorNameForWikiData('Tom Hanks');

            expect(result).toBe('Tom Hanks');
            expect(console.error).toHaveBeenCalled();
        });

        test('devrait inclure les headers d\'authentification', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Test' } }]
                })
            });

            await improveActorNameForWikiData('test');

            const callArgs = fetch.mock.calls[0];
            const headers = callArgs[1].headers;
            
            expect(headers['Content-Type']).toBe('application/json');
            expect(headers['Authorization']).toContain('Bearer');
        });

        test('devrait utiliser une température basse pour la cohérence', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Test' } }]
                })
            });

            await improveActorNameForWikiData('test');

            const callArgs = fetch.mock.calls[0];
            const body = JSON.parse(callArgs[1].body);
            
            expect(body.temperature).toBe(0.1);
        });

        test('devrait gérer les réponses vides de l\'IA', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: ''
                            }
                        }
                    ]
                })
            });

            const result = await improveActorNameForWikiData('test');

            expect(result).toBe('');
        });
    });
});
