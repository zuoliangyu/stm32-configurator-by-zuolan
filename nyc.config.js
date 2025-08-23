module.exports = {
  // Coverage output directory
  'temp-dir': './coverage/.nyc_output',
  'report-dir': './coverage',
  
  // File patterns to include/exclude
  include: [
    'out/**/*.js'
  ],
  exclude: [
    'out/test/**/*.js',
    'out/**/*.test.js',
    'out/**/test/**/*.js'
  ],
  
  // Reporter configuration
  reporter: [
    'text',
    'html',
    'lcov',
    'json'
  ],
  
  // Coverage thresholds
  'check-coverage': true,
  branches: 80,
  functions: 80,
  lines: 80,
  statements: 80,
  
  // Source map support
  'source-map': true,
  
  // All files should be included even if not tested
  all: true,
  
  // Instrument code in place
  instrument: true,
  
  // Cache configuration
  cache: true,
  'cache-dir': './coverage/.nyc_output'
};