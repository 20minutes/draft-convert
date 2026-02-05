/** @type {import('jest').Config} */
const config = {
  verbose: true,
  testEnvironment: 'jsdom',
  testRegex: '/test/spec/.*\\.js$',
  setupFiles: ['./test/setup-jest.js'],
  transform: {
    '^.+\\.[jt]sx?$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2022',
          parser: {
            syntax: 'ecmascript',
            jsx: true,
          },
          transform: {
            react: {
              runtime: 'classic',
            },
          },
        },
      },
    ],
  },
}

module.exports = config
