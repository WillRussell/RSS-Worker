const { exec } = require('child_process');
const { log, logBright } = require('../logging');

module.exports.downloadVideo = async (url) => {
  logBright('\nStarting download & mp3 transform...');

  const shellCommand = `yt-dlp -o './downloads/%(title)s.%(ext)s' -x --audio-format mp3 ${url}`;

  const downloadPromise = new Promise((resolve, reject) => {
    exec(shellCommand, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      log(stdout);
      resolve(stdout);
    });
  });

  return await downloadPromise;
};
