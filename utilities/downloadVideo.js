const { exec } = require("child_process");
const chalk = require("chalk");

module.exports.downloadVideo = async (url) => {

  console.log(chalk.bold.blueBright("\nStarting download & mp3 transform...\n"));

  const shellCommand = `yt-dlp -o './downloads/%(title)s.%(ext)s' -x --audio-format mp3 ${url}`;

  const downloadPromise = new Promise((resolve, reject) => {
    exec(shellCommand, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      console.log(chalk.blackBright(stdout));
      resolve(stdout);
    });
  });

  return await downloadPromise;
};
