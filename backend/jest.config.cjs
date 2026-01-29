/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: '../reports',
  coverageReporters: ['cobertura'], 
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '../reports',
      outputName: 'junit.xml'
    }]
  ]
};
