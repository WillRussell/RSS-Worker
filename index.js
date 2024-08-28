const { getVideoInfo } = require('./utilities/getVideoInfo');
const { downloadVideo } = require('./utilities/downloadVideo');
const { uploadPodcast } = require('./utilities/uploadPodcast');
const { removeDownloads } = require('./utilities/removeDownloads');
const { updateRss } = require('./utilities/updateRss');
const { generateXml } = require('./utilities/generateXml');

const { logBright } = require('./logging');

async function run() {
  const args = process.argv.slice(2);
  const url = args[0];

  const videoInfo = await getVideoInfo(url);
  await downloadVideo(url);
  await uploadPodcast(videoInfo);
  await removeDownloads(); // Delete 'downloads' directory
  await generateXml();
  await updateRss();

  logBright(
    '\nSuccess! Youtube video transformed, stored, & exposed on the updated rss'
  );
}

run();
