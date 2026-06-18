require('dotenv').config();

const { findMrLink } = require('./find-mr-link');
const { run: runVideoWorker } = require('../videoWorker/index');
const { banner, logBright, logInfo } = require('../logging');

banner();

async function getMrLiveVideo() {
  const channelName = process.env['CHANNEL_NAME'];

  logBright('\nSearching for last MR Live...');

  const targetUrl = await findMrLink(channelName);

  logInfo('Target URL', targetUrl);

  await runVideoWorker(targetUrl);

  return targetUrl;
}

if (require.main === module) {
  getMrLiveVideo().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

module.exports = { getMrLiveVideo };
