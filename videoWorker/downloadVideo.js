const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');
const { log, logBright } = require('../logging');

const DOWNLOAD_DIR = path.join(__dirname, 'videoDownloads');
const VIDEO_PATH = path.join(DOWNLOAD_DIR, 'video.mp4');

const DOWNLOAD_PROGRESS_RE =
  /\[download\]\s+([\d.]+)%(?:\s+of\s+[^\s]+\s+at\s+([\S]+)\s+ETA\s+(\S+))?/;

function buildProgressBar(pct, width = 20) {
  const filled = Math.round((pct / 100) * width);
  return (
    chalk.bold.blueBright('█'.repeat(filled)) +
    chalk.blackBright('░'.repeat(width - filled))
  );
}

function resetDownloadDir() {
  fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

function findDownloadedVideo() {
  if (fs.existsSync(VIDEO_PATH)) return VIDEO_PATH;

  const files = fs
    .readdirSync(DOWNLOAD_DIR)
    .filter((file) => path.extname(file).toLowerCase() === '.mp4')
    .map((file) => path.join(DOWNLOAD_DIR, file))
    .sort((a, b) => fs.statSync(b).ctime - fs.statSync(a).ctime);

  return files[0];
}

module.exports.downloadVideo = async (url) => {
  logBright('\nStarting video download...');
  resetDownloadDir();

  const ytDlpArgs = [
    '--no-playlist',
    '-f',
    'bv*[ext=mp4][vcodec^=avc1]+ba[ext=m4a]/b[ext=mp4][vcodec^=avc1]/b[ext=mp4]/best',
    '--merge-output-format',
    'mp4',
    '--remux-video',
    'mp4',
    '--force-overwrites',
    '-o',
    VIDEO_PATH,
    url,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn('yt-dlp', ytDlpArgs);
    let inDownloadPhase = false;

    child.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const match = trimmed.match(DOWNLOAD_PROGRESS_RE);
        if (match) {
          inDownloadPhase = true;
          const pct = parseFloat(match[1]);
          const bar = buildProgressBar(pct);
          const speed = match[2] ? chalk.blackBright(`  ${match[2]}`) : '';
          const eta = match[3] ? chalk.blackBright(`  ETA ${match[3]}`) : '';
          process.stdout.write(
            `\r${chalk.bold.blueBright('Downloading')}  ${chalk.white('[' + bar + ']')}  ${chalk.bold.white(match[1] + '%')}${speed}${eta}   `,
          );
        } else {
          const isDownloadDestination = trimmed.startsWith('[download] Destination:');

          if (inDownloadPhase) {
            process.stdout.write('\n\n');
            inDownloadPhase = false;
          } else if (isDownloadDestination) {
            process.stdout.write('\n');
          }

          log(trimmed);
          if (isDownloadDestination) {
            process.stdout.write('\n');
          }
        }
      }
    });

    child.stderr.on('data', (chunk) => {
      if (inDownloadPhase) {
        process.stdout.write('\n');
        inDownloadPhase = false;
      }
      process.stderr.write(chunk.toString());
    });

    child.on('close', (code) => {
      if (inDownloadPhase) process.stdout.write('\n');

      if (code !== 0) {
        reject(new Error(`yt-dlp exited with code ${code}`));
        return;
      }

      const downloadedVideo = findDownloadedVideo();
      if (!downloadedVideo) {
        reject(new Error(`Expected video file was not created in ${DOWNLOAD_DIR}`));
        return;
      }

      resolve(downloadedVideo);
    });

    child.on('error', (err) => reject(err));
  });
};
