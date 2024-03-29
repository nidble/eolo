// const { pathsToModuleNameMapper } = require('ts-jest');
// const { compilerOptions } = require('./tsconfig-base');

module.exports = {
  preset: 'ts-jest',
  testMatch: [ "**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts", "**/tests/**/*.ts"],
  testEnvironment: 'node',
  transform: { // dp
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  coverageDirectory: 'coverage',
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/server.ts', '<rootDir>/src/worker.ts'],
  verbose: true,
  coverageReporters: ['html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig-base.json",
    },
  },
  moduleNameMapper: {
    "@eolo/(.*)": "<rootDir>/src/$1",
    "@eolo-types/(.*)": "<rootDir>/types/$1"
  },
  // This doesn't work because require('./tsconfig-base') doesn't recognize comments in JSON files
  // moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths , { prefix: '<rootDir>/' } ),
};
