module.exports = {
  transform: {
    "^.+\\.[jt]sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", decorators: true },
          target: "es2021",
        },
      },
    ],
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  testMatch: ["**/__tests__/**/*.unit.spec.[jt]s"],
  modulePathIgnorePatterns: ["dist/"],
  transformIgnorePatterns: [
    "node_modules/(?!(@medusajs)/)",
  ],
}
