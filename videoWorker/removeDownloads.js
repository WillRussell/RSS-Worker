const fs = require('fs');
const path = require('path');
const { logBright } = require('../logging');

const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

module.exports.removeDownloads = async () => {
  logBright('\nRemoving local video download...');
  fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
};

