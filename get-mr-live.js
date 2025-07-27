require('dotenv').config();

const { Client } = require('youtubei');
const { get, pick } = require('lodash');

const { getVideoInfo } = require('./utilities/getVideoInfo');
const { downloadVideo } = require('./utilities/downloadVideo');
const { uploadPodcast } = require('./utilities/uploadPodcast');
const { updateRss } = require('./utilities/updateRss');
const { generateXml } = require('./utilities/generateXml');

const { logBright, logInfo } = require('./logging');

const channelName = process.env['CHANNEL_NAME'];

const youtube = new Client();

const isUrl = (str) => str.toLowerCase().includes('https://');

async function getMrLive() {
  logBright('\nSearching for last MR Live...');

  /* Step 1: Find the Youtube channel & get latest uploads */
  const channel = await youtube.findOne(channelName, { type: 'channel' });
  await channel.live.next(); // most recent 30 live videos

  /* Step 2: Get video ID of the most recent live broadcast  */
  const latestLiveShow = channel.live.items.shift();
  const liveShowObj = pick(latestLiveShow, ['id', 'title', 'duration']);

  /* Step 3: Fetch the video description  */
  const video = await youtube.getVideo(liveShowObj.id);
  const videoDescription = get(video, 'description');

  /* Step 4: Parse the target URL from the description */
  const descriptionList = videoDescription.split('\n');
  const textRow = descriptionList.find((str) =>
    str.toLowerCase().includes('fun half')
  );

  const textCollection = textRow.split(' ');
  const endString = textCollection.pop();

  // If text row contains multiple URLs, it's preferable to use the last one
  const targetUrl = isUrl(endString)
    ? endString
    : textCollection.find((str) => isUrl(str));

  logInfo('Target URL', `${targetUrl}\n`);

  const videoInfo = await getVideoInfo(targetUrl);
  await downloadVideo(targetUrl);
  await uploadPodcast(videoInfo);
  await generateXml();
  await updateRss();

  return targetUrl;
}

getMrLive().catch(console.error);
