require('dotenv').config();

const { getVideoInfo } = require('../utilities/getVideoInfo');
const { downloadVideo } = require('../utilities/downloadVideo');
const { removeDownloads } = require('../utilities/removeDownloads');
const { uploadPodcast } = require('../utilities/uploadPodcast');
const { updateRss } = require('../utilities/updateRss');
const { generateXml } = require('../utilities/generateXml');
const { findMrLink } = require('./find-mr-link');

const { logBright, logInfo, banner } = require('../logging');

banner();

const channelName = process.env['CHANNEL_NAME'];

async function getMrLive() {
  logBright('\nSearching for last MR Live...');

  const targetUrl = await findMrLink(channelName);

  logInfo('\nTarget URL', `${targetUrl}`);

  const videoInfo = await getVideoInfo(targetUrl);
  await downloadVideo(targetUrl);
  await uploadPodcast(videoInfo);
  await removeDownloads();
  await generateXml();
  await updateRss();

  return targetUrl;
}

getMrLive().catch(console.error);


