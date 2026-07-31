const chalk = require('chalk');
const { banner } = require('./logging');

banner();

const commandGroups = [
  {
    title: 'Create & Upload',
    commands: [
      { cmd: 'node index <youtube-url>', desc: 'Convert a YouTube video into a podcast episode' },
      { cmd: 'node videoWorker <youtube-url>', desc: 'Upload a browser-watchable video to S3' },
    ],
  },
  {
    title: 'Majority Report',
    commands: [
      { cmd: 'node mr/get-mr-live', desc: 'Find and process the latest MR Live episode' },
      { cmd: 'node mr/get-mr-live-video', desc: 'Find and upload the latest MR Fun Half video' },
      { cmd: 'node mr/get-mr-link', desc: 'Display the latest MR Fun Half target URL' },
    ],
  },
  {
    title: 'View & Inspect',
    commands: [
      { cmd: 'node get-feed-url', desc: 'Display the podcast RSS feed URL' },
      { cmd: 'node get-video-url', desc: 'Display the stable S3 video URL' },
      { cmd: 'node list-bucket', desc: 'List all objects in the S3 bucket' },
    ],
  },
  {
    title: 'Storage Maintenance',
    commands: [
      { cmd: 'node delete-bucket-files', desc: 'Interactively select and delete S3 objects' },
      { cmd: 'node clear-bucket', desc: 'Delete all podcast audio files from S3' },
      { cmd: 'node clear-video-files', desc: 'Delete all video files from S3' },
    ],
  },
];

console.log(chalk.white('Convert YouTube videos into podcast episodes via S3 + RSS.\n'));
console.log(chalk.bold.white('Commands:\n'));

const maxCmd = Math.max(
  ...commandGroups.flatMap(({ commands }) => commands.map(({ cmd }) => cmd.length))
);

for (const { title, commands } of commandGroups) {
  console.log(chalk.bold.cyan(`  ${title}`));

  for (const { cmd, desc } of commands) {
    console.log(`    ${chalk.green(cmd.padEnd(maxCmd + 2))}${chalk.blackBright(desc)}`);
  }

  console.log();
}
