const { getUrl } = require("./utilities/getUrl");
const { downloadVideo } = require("./utilities/downloadVideo");
const { uploadPodcast } = require("./utilities/uploadPodcast");

async function run() {
  const url = await getUrl();

  await downloadVideo(url);
  
  const uploadInfo = await uploadPodcast();

  // update the rss xml

  console.log("FINISHED");
}

run();
