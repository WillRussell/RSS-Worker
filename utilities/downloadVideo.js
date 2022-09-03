const { exec } = require("child_process");

module.exports.downloadVideo = async (url) => {

  console.log("Starting download...");
  
  const shellCommand = `yt-dlp -o './downloads/%(title)s.%(ext)s' -x --audio-format mp3 ${url}`;

  const downloadPromise = new Promise((resolve, reject) => {
    exec(shellCommand, { maxBuffer: 1024 * 500 }, (err, stdout) => {
      if (err) return reject(err);
      console.log(stdout);
      resolve(stdout);
    });
  });

  return await downloadPromise;
};