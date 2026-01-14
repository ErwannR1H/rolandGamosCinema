import { getHighScore, saveHighScore, resetHighScore } from '../scoreService';

describe('scoreService', () => {
    beforeEach(() => {
        // Nettoyer le localStorage avant chaque test
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('getHighScore', () => {
        test('devrait retourner 0 si aucun score enregistré', () => {
            const score = getHighScore();
            expect(score).toBe(0);
        });

        test('devrait retourner le score enregistré', () => {
            localStorage.setItem('soloHighScore', '42');
            
            const score = getHighScore();
            expect(score).toBe(42);
        });

        test('devrait convertir correctement les nombres', () => {
            localStorage.setItem('soloHighScore', '123');
            
            const score = getHighScore();
            expect(score).toBe(123);
            expect(typeof score).toBe('number');
        });

        test('devrait gérer les valeurs invalides gracieusement', () => {
            localStorage.setItem('soloHighScore', 'invalid');
            
            const score = getHighScore();
            expect(isNaN(score)).toBe(true);
        });

        test('devrait retourner 0 pour un score de 0', () => {
            localStorage.setItem('soloHighScore', '0');
            
            const score = getHighScore();
            expect(score).toBe(0);
        });
    });

    describe('saveHighScore', () => {
        test('devrait sauvegarder un nouveau record et retourner true', () => {
            const isNewRecord = saveHighScore(100);
            
            expect(isNewRecord).toBe(true);
            expect(localStorage.getItem('soloHighScore')).toBe('100');
        });

        test('devrait ne pas sauvegarder un score inférieur et retourner false', () => {
            localStorage.setItem('soloHighScore', '100');
            
            const isNewRecord = saveHighScore(50);
            
            expect(isNewRecord).toBe(false);
            expect(localStorage.getItem('soloHighScore')).toBe('100');
        });

        test('devrait ne pas sauvegarder un score égal et retourner false', () => {
            localStorage.setItem('soloHighScore', '100');
            
            const isNewRecord = saveHighScore(100);
            
            expect(isNewRecord).toBe(false);
            expect(localStorage.getItem('soloHighScore')).toBe('100');
        });

        test('devrait sauvegarder un score supérieur', () => {
            localStorage.setItem('soloHighScore', '50');
            
            const isNewRecord = saveHighScore(100);
            
            expect(isNewRecord).toBe(true);
            expect(localStorage.getItem('soloHighScore')).toBe('100');
        });

        test('devrait gérer le score 0', () => {
            const isNewRecord = saveHighScore(0);
            
            expect(isNewRecord).toBe(false);
            expect(localStorage.getItem('soloHighScore')).toBeNull();
        });

        test('devrait convertir le score en string', () => {
            saveHighScore(42);
            
            const stored = localStorage.getItem('soloHighScore');
            expect(typeof stored).toBe('string');
            expect(stored).toBe('42');
        });

        test('devrait permettre de sauvegarder plusieurs records successifs', () => {
            expect(saveHighScore(10)).toBe(true);
            expect(saveHighScore(20)).toBe(true);
            expect(saveHighScore(30)).toBe(true);
            
            expect(localStorage.getItem('soloHighScore')).toBe('30');
        });

        test('devrait gérer les grands nombres', () => {
            const isNewRecord = saveHighScore(999999);
            
            expect(isNewRecord).toBe(true);
            expect(localStorage.getItem('soloHighScore')).toBe('999999');
        });
    });

    describe('resetHighScore', () => {
        test('devrait supprimer le score du localStorage', () => {
            localStorage.setItem('soloHighScore', '100');
            
            resetHighScore();
            
            expect(localStorage.getItem('soloHighScore')).toBeNull();
        });

        test('devrait fonctionner même si aucun score n\'existe', () => {
            expect(() => resetHighScore()).not.toThrow();
            expect(localStorage.getItem('soloHighScore')).toBeNull();
        });

        test('devrait permettre de sauvegarder un nouveau score après reset', () => {
            localStorage.setItem('soloHighScore', '100');
            
            resetHighScore();
            const isNewRecord = saveHighScore(50);
            
            expect(isNewRecord).toBe(true);
            expect(localStorage.getItem('soloHighScore')).toBe('50');
        });

        test('devrait retourner 0 après reset', () => {
            localStorage.setItem('soloHighScore', '100');
            
            resetHighScore();
            const score = getHighScore();
            
            expect(score).toBe(0);
        });
    });

    describe('Scénarios intégrés', () => {
        test('devrait gérer un cycle complet de jeu', () => {
            // Première partie
            expect(getHighScore()).toBe(0);
            expect(saveHighScore(10)).toBe(true);
            
            // Deuxième partie (moins bon)
            expect(saveHighScore(5)).toBe(false);
            expect(getHighScore()).toBe(10);
            
            // Troisième partie (meilleur)
            expect(saveHighScore(20)).toBe(true);
            expect(getHighScore()).toBe(20);
            
            // Reset
            resetHighScore();
            expect(getHighScore()).toBe(0);
        });

        test('devrait gérer plusieurs parties sans record', () => {
            saveHighScore(100);
            
            expect(saveHighScore(50)).toBe(false);
            expect(saveHighScore(75)).toBe(false);
            expect(saveHighScore(99)).toBe(false);
            
            expect(getHighScore()).toBe(100);
        });

        test('devrait permettre de battre progressivement son record', () => {
            const scores = [10, 15, 12, 20, 18, 25, 22, 30];
            const expectedRecords = [true, true, false, true, false, true, false, true];
            
            scores.forEach((score, index) => {
                expect(saveHighScore(score)).toBe(expectedRecords[index]);
            });
            
            expect(getHighScore()).toBe(30);
        });
    });
});
