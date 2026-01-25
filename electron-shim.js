// Electron shim to work around module resolution issues
// When running inside Electron, process.versions.electron should be defined

if (process.versions.electron) {
  // We're running inside Electron
  // Try to get the real Electron API
  
  // The electron module should be a built-in module when running in Electron
  // But the npm package's index.js is interfering
  
  // Workaround: Use process.electronBinding or check global
  if (typeof process.electronBinding !== 'undefined') {
    // Modern Electron
    module.exports = require('electron');
  } else {
    // Fallback: The module should still work despite returning a string initially
    const electronPath = require('electron');
    if (typeof electronPath === 'string') {
      // This is the npm package, not the API
      // We need to access the real Electron API differently
      throw new Error('Cannot access Electron API - module resolution issue');
    }
    module.exports = electronPath;
  }
} else {
  // Not running in Electron, export the path
  module.exports = require('./node_modules/electron');
}
