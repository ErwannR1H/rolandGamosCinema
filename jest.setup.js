import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill pour TextEncoder/TextDecoder requis par react-router-dom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock de localStorage pour les tests
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    length: 0
};
global.localStorage = localStorageMock;

// Mock de console.log/error pour éviter le spam dans les tests
const originalError = console.error;
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn((...args) => {
        // Afficher quand même les erreurs importantes en mode debug
        if (process.env.DEBUG_TESTS) {
            originalError(...args);
        }
    })
};
