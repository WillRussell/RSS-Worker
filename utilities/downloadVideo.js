const { exec } = require('../logging.js');

module.exports.downloadVideo = async (url) => {

  console.log("Starting download...");
  
  const shellCommand = `yt-dlp -o './downloads/%(title)s.%(ext)s' -x --audio-format mp3 ${url}`;

  const downloadPromise = new Promise((resolve, reject) => {
    exec(shellCommand, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      console.log(stdout);
      resolve(stdout);
    });
  });

  return await downloadPromise;
};
