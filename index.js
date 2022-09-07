const { getUrl } = require("./utilities/getUrl");
const { downloadVideo } = require("./utilities/downloadVideo");
const { uploadPodcast } = require("./utilities/uploadPodcast");
const { updateRss } = require("./utilities/updateRss");

async function run() {
  const url = await getUrl();

  await downloadVideo(url);
  
  const uploadInfo = await uploadPodcast();

  // generate xml dynamically

  const rssInfo = await updateRss();
}

run();
