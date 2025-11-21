/**
 * Jest Configuration
 */

export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'jsx'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**',
    '!src/workers/**' // Workers are harder to test
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  globals: {
    'window': {
      'crypto': {
        'getRandomValues': (arr) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        },
        'subtle': {
          'digest': async () => new ArrayBuffer(32),
          'importKey': async () => ({}),
          'deriveKey': async () => ({}),
          'encrypt': async (algorithm, key, data) => data,
          'decrypt': async (algorithm, key, data) => data
        }
      }
    }
  }
};

