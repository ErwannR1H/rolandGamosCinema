export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{js,jsx}',
  ],
  collectCoverageFrom: [
    'src/components/**/*.{js,jsx}',
    'src/services/**/*.js',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx}'
  ]
};
