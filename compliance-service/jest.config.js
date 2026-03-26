module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  moduleNameMapper: {
    "^uuid$": "<rootDir>/src/services/__tests__/__mocks__/uuid.ts",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/index.ts", // Exclude main server file
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
};
