const { loadEnv } = require('@medusajs/utils')
loadEnv('test', process.cwd())

module.exports = {
  transform: {
    '^.+\\.[jt]s$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          target: 'es2022'
        }
      }
    ]
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'ts', 'json'],
  modulePathIgnorePatterns: ['dist/'],
  setupFiles: ["./integration-tests/setup.js"],

}

if (process.env.TEST_TYPE === 'integration:http') {
  module.exports.testMatch = ['**/integration-tests/http/*.spec.[jt]s']
} else if (process.env.TEST_TYPE === 'integration:modules') {
  module.exports.testMatch = ['**/src/modules/*/__tests__/**/*.[jt]s']
} else if (process.env.TEST_TYPE === 'unit') {
  module.exports.testMatch = ['**/src/**/__tests__/**/*.unit.spec.[jt]s']
}
