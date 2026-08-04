require('dotenv').config();

const { findMrLink } = require('./find-mr-link');
const { banner, logBright, logInfo } = require('../logging');

async function run() {
  const channelName = process.env['CHANNEL_NAME'];

  logBright('\nFinding MR link...');

  const targetUrl = await findMrLink(channelName);

  logInfo('\nTarget URL', targetUrl);
  console.log();
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
