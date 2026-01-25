try {
  const electron = require('electron');
  console.log('Electron module:', electron);
  console.log('Type:', typeof electron);
  console.log('Keys:', Object.keys(electron || {}));
} catch (error) {
  console.error('Error requiring electron:', error);
}
