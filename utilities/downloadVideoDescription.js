const { exec } = require("child_process");

module.exports.downloadVideoDescription = async (url) => {

  console.log("Writing video description to new file...");

  const shellCommand = `yt-dlp --skip-download --write-description -o './downloads/%(title)s.%(ext)s' ${url}`;

  const downloadPromise = new Promise((resolve, reject) => {
    exec(shellCommand, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      console.log(stdout);
      resolve(stdout);
    });
  });

  return await downloadPromise;
};
