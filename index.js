const { getMrLiveUrl } = require("./utilities/getMrLive");
const { downloadVideo } = require("./utilities/downloadVideo");
const { uploadPodcast } = require("./utilities/uploadPodcast");
const { updateRss } = require("./utilities/updateRss");
const { generateXml } = require("./utilities/generateXml");

async function run() {
  const args = process.argv.slice(2);
  const url = args[0];
  // const url = await getMrLiveUrl();

  await downloadVideo(url);
  await uploadPodcast();
  await generateXml();
  await updateRss();

  console.log("Task Complete: Youtube video transformed to Podcast");
}

run();
