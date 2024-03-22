/** @type {import('jest').Config} */
const config = {
  verbose: true,
  testEnvironment: 'jsdom',
  testRegex: '/test/spec/.*\\.js$',
  setupFiles: ['./test/setup-jest.js'],
}

module.exports = config
