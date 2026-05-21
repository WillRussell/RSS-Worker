require('dotenv').config();

const { execFileSync } = require('child_process');
const { Client } = require('youtubei');

const { getVideoInfo } = require('./utilities/getVideoInfo');
const { downloadVideo } = require('./utilities/downloadVideo');
const { removeDownloads } = require('./utilities/removeDownloads');
const { uploadPodcast } = require('./utilities/uploadPodcast');
const { updateRss } = require('./utilities/updateRss');
const { generateXml } = require('./utilities/generateXml');

const { logBright, logInfo, banner } = require('./logging');

banner();

const channelName = process.env['CHANNEL_NAME'];

const youtube = new Client();

const URL_RE = /https?:\/\/[^\s)]+/gi;

const getLastUrl = (str) => {
  const urls = str.match(URL_RE);

  if (!urls) return undefined;

  return urls.pop().replace(/[.,;!?]+$/, '');
};

const normalizeYoutubeUrl = (urlStr) => {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname.replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/live/${videoId}` : urlStr;
    }

    if (hostname !== 'youtube.com') return urlStr;

    const watchVideoId = url.searchParams.get('v');
    const pathParts = url.pathname.split('/').filter(Boolean);
    const pathVideoId =
      ['live', 'shorts', 'embed'].includes(pathParts[0]) && pathParts[1];
    const videoId = watchVideoId || pathVideoId;

    return videoId ? `https://www.youtube.com/live/${videoId}` : urlStr;
  } catch (err) {
    return urlStr;
  }
};

const getLatestLiveShow = (channelId) => {
  const streamsUrl = `https://www.youtube.com/channel/${channelId}/streams`;
  const playlistJson = execFileSync(
    'yt-dlp',
    [
      '--flat-playlist',
      '--dump-single-json',
      '--playlist-end',
      '1',
      streamsUrl,
    ],
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );

  const { entries } = JSON.parse(playlistJson);
  const latestLiveShow = entries && entries[0];

  if (!latestLiveShow || !latestLiveShow.id) {
    throw new Error(`Could not find latest live show at ${streamsUrl}`);
  }

  return latestLiveShow;
};

async function getMrLive() {
  logBright('\nSearching for last MR Live...');

  /* Step 1: Find the Youtube channel */
  const channel = await youtube.findOne(channelName, { type: 'channel' });

  /* Step 2: Get video ID of the most recent live broadcast  */
  const latestLiveShow = getLatestLiveShow(channel.id);
  const liveShowUrl = `https://www.youtube.com/live/${latestLiveShow.id}`;

  logInfo('Live Show', latestLiveShow.title);

  /* Step 3: Fetch the video description  */
  const videoDescription = execFileSync(
    'yt-dlp',
    ['--skip-download', '--print', 'description', liveShowUrl],
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );

  /* Step 4: Parse the target URL from the description */
  const descriptionList = videoDescription.split('\n');
  const textRow = descriptionList.find((str) =>
    str.toLowerCase().includes('fun half')
  );

  if (!textRow) {
    throw new Error(`Could not find a "fun half" row in ${liveShowUrl}`);
  }

  // If text row contains multiple URLs, it's preferable to use the last one
  const targetUrl = normalizeYoutubeUrl(getLastUrl(textRow));

  if (!targetUrl) {
    throw new Error(`Could not find a URL in the "fun half" row: ${textRow}`);
  }

  logInfo('Target URL', `${targetUrl}`);

  const videoInfo = await getVideoInfo(targetUrl);
  await downloadVideo(targetUrl);
  await uploadPodcast(videoInfo);
  await removeDownloads();
  await generateXml();
  await updateRss();

  return targetUrl;
}

getMrLive().catch(console.error);
