module.exports = {
  testEnvironment: "node",
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: { module: "commonjs", esModuleInterop: true, strict: false } }] },
  testMatch: ["**/__tests__/**/*.spec.ts"],
  moduleNameMapper: { "^@mercurjs/types$": "<rootDir>/../../types/src/index.ts" },
}
