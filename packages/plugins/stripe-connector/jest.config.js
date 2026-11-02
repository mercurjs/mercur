module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          esModuleInterop: true,
          strict: false,
          baseUrl: ".",
          paths: { "@mercurjs/types": ["../../types/src/index.ts"] },
        },
      },
    ],
  },
  testMatch: ["**/__tests__/**/*.spec.ts"],
  moduleNameMapper: {
    "^@mercurjs/types$": "<rootDir>/../../types/src/index.ts",
    "^@mercurjs/core/workflows/payout/utils/(.*)$": "<rootDir>/../../core/src/workflows/payout/utils/$1.ts",
  },
}
