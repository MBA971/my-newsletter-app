/**
 * Test suite configuration for the newsletter application
 */

export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/frontend/__tests__/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/frontend/__tests__/__mocks__/fileMock.js'
  },
  testMatch: [
    '<rootDir>/frontend/__tests__/**/*.{test,spec}.{js,jsx}',
    '<rootDir>/backend/__tests__/**/*.{test,spec}.{js,jsx}'
  ],
  collectCoverageFrom: [
    'frontend/src/**/*.{js,jsx}',
    'backend/controllers/**/*.{js}',
    'backend/models/**/*.{js}',
    'backend/utils/**/*.{js}',
    '!frontend/src/services/api/index.js', // Exclude API index that just exports
    '!frontend/src/main.jsx', // Exclude entry points
    '!backend/server.js', // Exclude main server file
    '!backend/config/**/*', // Exclude config files
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react'] }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(lucide-react)/)'
  ]
};