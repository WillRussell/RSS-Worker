const { spawn } = require('child_process');
const chalk = require('chalk');
const { log, logBright } = require('../logging');

const DOWNLOAD_PROGRESS_RE = /\[download\]\s+([\d.]+)%/;

module.exports.downloadVideo = async (url) => {
  logBright('\nStarting download & mp3 transform...');

  const ytDlpArgs = [
    '-o', './downloads/%(title)s.%(ext)s',
    '-x',
    '--audio-format', 'mp3',
    url,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn('yt-dlp', ytDlpArgs);

    let inDownloadPhase = false;
    let conversionMessageShown = false;

    child.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const match = trimmed.match(DOWNLOAD_PROGRESS_RE);
        if (match) {
          inDownloadPhase = true;
          process.stdout.write(
            chalk.bold.blueBright(`\r  Downloading... ${chalk.white(match[1] + '%')}   `)
          );
        } else {
          if (inDownloadPhase) {
            process.stdout.write('\n');
            inDownloadPhase = false;
          }
          log(trimmed);
        }
      }
    });

    child.stderr.on('data', () => {
      if (!conversionMessageShown) {
        if (inDownloadPhase) {
          process.stdout.write('\n');
          inDownloadPhase = false;
        }
        conversionMessageShown = true;
        logBright('Converting to mp3...');
      }
    });

    child.on('close', (code) => {
      process.stdout.write('\n');
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
    });

    child.on('error', (err) => reject(err));
  });
};
