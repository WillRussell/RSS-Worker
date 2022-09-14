const { getUrl } = require("./utilities/getUrl");
const { downloadVideo } = require("./utilities/downloadVideo");
const { uploadPodcast } = require("./utilities/uploadPodcast");
const { updateRss } = require("./utilities/updateRss");
const { generateXml } = require("./utilities/generateXml");

async function run() {
  const url = await getUrl();
  await downloadVideo(url);
  await uploadPodcast();
  await generateXml();
  await updateRss();
  
  console.log("Task Complete: Youtube video transformed to Podcast");
}

run();
