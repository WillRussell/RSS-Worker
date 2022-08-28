const { getUrl } = require("./getUrl");
const { downloadVideo } = require("./downloadVideo");

async function run() {
  const url = await getUrl();
  const downloadOutput = await downloadVideo(url);
  // upload to s3 bucket
  // update the rss xml
}

run();
