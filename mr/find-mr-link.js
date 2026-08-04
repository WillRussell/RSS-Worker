const { execFileSync } = require('child_process');
const { Client } = require('youtubei');

const { logInfo } = require('../logging');

const URL_RE = /https?:\/\/[^\s)]+/gi;

const youtube = new Client();

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

module.exports.findMrLink = async (channelName) => {
  const channel = await youtube.findOne(channelName, { type: 'channel' });
  const latestLiveShow = getLatestLiveShow(channel.id);
  const liveShowUrl = `https://www.youtube.com/live/${latestLiveShow.id}`;

  logInfo('Live Show', latestLiveShow.title);

  const videoDescription = execFileSync(
    'yt-dlp',
    ['--skip-download', '--print', 'description', liveShowUrl],
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );

  const descriptionList = videoDescription.split('\n');
  const textRow = descriptionList.find((str) =>
    str.toLowerCase().includes('fun half')
  );

  if (!textRow) {
    throw new Error(`Could not find a "fun half" row in ${liveShowUrl}`);
  }

  // If the text row contains multiple URLs, use the last one.
  const targetUrl = normalizeYoutubeUrl(getLastUrl(textRow));

  if (!targetUrl) {
    throw new Error(`Could not find a URL in the "fun half" row: ${textRow}`);
  }

  return targetUrl;
};
