const { getUrl } = require("./getUrl");
const { downloadVideo } = require("./downloadVideo");
const { uploadPodcast } = require("./uploadPodcast");

async function run() {
  const url = await getUrl();
  const downloadOutput = await downloadVideo(url);
  await uploadPodcast(url); // upload to s3 bucket
  // update the rss xml
}

run();
