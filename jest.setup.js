import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill pour TextEncoder/TextDecoder requis par react-router-dom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
