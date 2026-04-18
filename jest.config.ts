import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  preset: 'ts-jest',
  moduleNameMapper: {
    // Resolve @/ path alias to src/
    '^@/(.*)$': '<rootDir>/src/$1',
    // Stub CSS, image, and other asset imports
    '\\.(css|scss|png|jpg|svg)$': '<rootDir>/src/__tests__/__mocks__/fileMock.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        // Use commonjs for Jest compatibility
        module: 'commonjs',
        moduleResolution: 'node',
        jsx: 'react-jsx',
        esModuleInterop: true,
      },
    }],
  },
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts?(x)'],
};

export default config;
