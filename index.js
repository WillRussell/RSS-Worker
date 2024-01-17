const chalk = require('chalk');
const { getVideoInfo } = require('./utilities/getVideoInfo');
const { downloadVideo } = require('./utilities/downloadVideo');
const { uploadPodcast } = require('./utilities/uploadPodcast');
const { updateRss } = require('./utilities/updateRss');
const { generateXml } = require('./utilities/generateXml');

async function run() {
  const args = process.argv.slice(2);
  const url = args[0];

  const videoInfo = await getVideoInfo(url);
  await downloadVideo(url);
  await uploadPodcast(videoInfo);
  await generateXml();
  await updateRss();

  console.log(
    chalk.bold.blueBright(
      '\nSuccess! Youtube video transformed, stored, & exposed on the updated rss\n'
    )
  );
}

run();
