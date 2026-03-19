const chalk = require('chalk');
const { banner } = require('./logging');

banner();

const commands = [
  { cmd: 'node index <youtube-url>', desc: 'Convert a YouTube video into a podcast episode' },
  { cmd: 'node get-mr-live', desc: 'Auto-find & process the latest MR Live episode' },
  { cmd: 'node list-bucket', desc: 'List all objects in the S3 bucket' },
  { cmd: 'node clear-bucket', desc: 'Delete all mp3 files from the S3 bucket' },
  { cmd: 'node get-feed-url', desc: 'Display the podcast RSS feed URL' },
  { cmd: 'node help', desc: 'Show this help message' },
];

console.log(chalk.white('Convert YouTube videos into podcast episodes via S3 + RSS.\n'));
console.log(chalk.bold.white('Commands:\n'));

const maxCmd = Math.max(...commands.map(c => c.cmd.length));
for (const { cmd, desc } of commands) {
  console.log(`  ${chalk.green(cmd.padEnd(maxCmd + 2))}${chalk.blackBright(desc)}`);
}

console.log();
