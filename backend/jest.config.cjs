/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: '../reports',
  coverageReporters: ['cobertura'], // ez lesz a coverage.xml
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '../reports',
      outputName: 'junit.xml'
    }]
  ]
};
