const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

let loaded = false;

function loadEnvFiles() {
  if (loaded) {
    return;
  }

  const rootDir = path.resolve(__dirname, '..', '..');
  const envFiles = [
    path.resolve(rootDir, '.env'),
    path.resolve(rootDir, '.env.local'),
    path.resolve(rootDir, 'client/.env'),
    path.resolve(rootDir, 'client/.env.local'),
  ];

  for (const filePath of envFiles) {
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
    }
  }

  loaded = true;
}

module.exports = {
  loadEnvFiles,
};
