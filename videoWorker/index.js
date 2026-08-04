const { banner, log, logBright } = require('../logging');
const { downloadVideo } = require('./downloadVideo');
const { uploadVideo } = require('./uploadVideo');
const { removeDownloads } = require('./removeDownloads');

async function run(resource) {
  const url = resource;
  if (!url) {
    throw new Error('A YouTube URL is required');
  }

  const videoPath = await downloadVideo(url);
  const uploadData = await uploadVideo(videoPath);
  await removeDownloads();

  logBright('\nSuccess! Video uploaded to S3:');
  log(uploadData.publicUrl);
  console.log();

  return uploadData;
}

async function main() {
  banner();

  const args = process.argv.slice(2);
  const url = args[0];

  if (!url) {
    console.error('Usage: node videoWorker <youtube-url>');
    process.exit(1);
  }

  await run(url);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

module.exports = { run };
