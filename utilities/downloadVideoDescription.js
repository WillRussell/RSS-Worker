const { exec } = require('child_process');
const chalk = require("chalk");

function logInfo(message, value) {
  console.log(chalk.blackBright(message + ': ') + chalk.white(value));
}

module.exports.downloadVideoDescription = async (url) => {

  console.log(chalk.bold.blueBright("\nFetching video meta data...\n"));

  // --skip-download skips downloading the video
  // --print prints the video metadata
  // --print-json prints the video metadata as a json string

  // %(description)j will render the description as a json string
  // %(description)s will render the description as a string
  
  const dlTemplate = `{"id":%(id)j, "upload_date":%(upload_date>%m-%d-%Y)j, "duration":%(duration_string)j, "title":%(title)j, "uploader":%(uploader)j}`;

  const shellCommand = `yt-dlp --skip-download --print '${dlTemplate}' ${url}`;
  const downloadPromise = new Promise((resolve, reject) => {
    exec(shellCommand, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      const result = JSON.parse(stdout);
      
      const { id, title, upload_date, duration, uploader } = result;
      logInfo('Channel Name', uploader);
      logInfo('Video Title', title);
      logInfo('Video ID', id);
      logInfo('Uploaded', upload_date);
      logInfo('Duration', duration);

      resolve(result);
    });
  });

  return await downloadPromise;
};
