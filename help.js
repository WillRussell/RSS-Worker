const chalk = require('chalk');
const { banner } = require('./logging');

banner();

const commands = [
  { cmd: 'node index <youtube-url>', desc: 'Convert a YouTube video into a podcast episode' },
  { cmd: 'node videoWorker <youtube-url>', desc: 'Upload one browser-watchable video to the stable S3 video URL' },
  { cmd: 'node mr/get-mr-live', desc: 'Auto-find & process the latest MR Live episode' },
  { cmd: 'node mr/get-mr-live-video', desc: 'Auto-find & upload the latest MR Fun Half video' },
  { cmd: 'node mr/get-mr-link', desc: 'Display the latest MR Fun Half target URL' },
  { cmd: 'node list-bucket', desc: 'List all objects in the S3 bucket' },
  { cmd: 'node clear-bucket', desc: 'Delete all podcast audio files from the S3 bucket' },
  { cmd: 'node get-feed-url', desc: 'Display the podcast RSS feed URL' },
  { cmd: 'node get-video-url', desc: 'Display the stable S3 video URL' },
  { cmd: 'node help', desc: 'Show this help message' },
];

console.log(chalk.white('Convert YouTube videos into podcast episodes via S3 + RSS.\n'));
console.log(chalk.bold.white('Commands:\n'));

const maxCmd = Math.max(...commands.map(c => c.cmd.length));
for (const { cmd, desc } of commands) {
  console.log(`  ${chalk.green(cmd.padEnd(maxCmd + 2))}${chalk.blackBright(desc)}`);
}

console.log();
