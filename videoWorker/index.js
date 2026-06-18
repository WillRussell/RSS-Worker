const { banner, log, logBright } = require('../logging');
const { downloadVideo } = require('./downloadVideo');
const { uploadVideo } = require('./uploadVideo');
const { removeDownloads } = require('./removeDownloads');

banner();

async function run() {
  const args = process.argv.slice(2);
  const url = args[0];

  if (!url) {
    console.error('Usage: node videoWorker <youtube-url>');
    process.exit(1);
  }

  const videoPath = await downloadVideo(url);
  const uploadData = await uploadVideo(videoPath);
  await removeDownloads();

  logBright('\nSuccess! Video uploaded to S3:');
  log(uploadData.publicUrl);
  console.log();
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
