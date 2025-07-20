// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'], // ignore Playwright tests
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
};

module.exports = customJestConfig; 