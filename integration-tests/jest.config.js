const { loadEnv } = require("@medusajs/framework/utils")
loadEnv("test", process.cwd())

module.exports = {
  transform: {
    "^.+\\.[jt]s$": [
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
  modulePathIgnorePatterns: ["dist/"],
  setupFiles: ["./setup.js"],
  // Balance `--shard` partitions by estimated duration instead of file count
  // so heavy specs don't cluster in one shard and blow the job timeout.
  testSequencer: "./test-sequencer.js",
}

if (process.env.TEST_TYPE === "integration:http") {
  module.exports.testMatch = ["**/http/**/*.spec.[jt]s"]
  // The meilisearch specs exercise routes/modules that ship in the
  // `@mercurjs/registry` block, which is only wired into the test app when
  // MEILISEARCH_HOST is set (see the dedicated test:integration:meilisearch
  // script). Without it the routes 404, so skip them in the default HTTP run.
  if (!process.env.MEILISEARCH_HOST) {
    module.exports.testPathIgnorePatterns = ["/node_modules/", "/http/meilisearch/"]
  }
} else if (process.env.TEST_TYPE === "integration:modules") {
  module.exports.testMatch = ["**/src/modules/*/__tests__/**/*.[jt]s"]
} else if (process.env.TEST_TYPE === "unit") {
  module.exports.testMatch = ["**/src/**/__tests__/**/*.unit.spec.[jt]s"]
}