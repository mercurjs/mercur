const { loadEnv } = require("@medusajs/framework/utils");
loadEnv("test", process.cwd());

module.exports = {
  transform: {
    // Same as integration-tests/jest.config.js: Mercur patches core-flows through
    // Node module hooks, which Jest never consults, so the app refuses to boot
    // under Jest unless the patches go through this transformer.
    "node_modules[\\\\/].*core-flows[\\\\/]dist[\\\\/](cart|order|payment)[\\\\/].*\\.js$":
      "@mercurjs/core/patches/jest-transformer",
    "^.+\\.[jt]s$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", decorators: true },
        },
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/(?!.*core-flows[\\\\/]dist[\\\\/](cart|order|payment)[\\\\/])"],
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  modulePathIgnorePatterns: ["dist/", "<rootDir>/.medusa/"],
  setupFiles: ["./integration-tests/setup.js"],
};

if (process.env.TEST_TYPE === "integration:http") {
  module.exports.testMatch = ["**/integration-tests/http/*.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "integration:modules") {
  module.exports.testMatch = ["**/src/modules/*/__tests__/**/*.[jt]s"];
} else if (process.env.TEST_TYPE === "unit") {
  module.exports.testMatch = ["**/src/**/__tests__/**/*.unit.spec.[jt]s"];
}
