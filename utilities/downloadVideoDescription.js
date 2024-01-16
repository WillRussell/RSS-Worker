const { exec } = require('child_process');

module.exports.downloadVideoDescription = async (url) => {
  console.log('Getting video description...');

  // --skip-download skips downloading the video
  // --print prints the video metadata
  // --print-json prints the video metadata as a json string

  // %(description)j will render the description as a json string
  // %(description)s will render the description as a string

  const shellCommand = `yt-dlp --skip-download --print '{"id":"%(id)s", "description":"%(description)j", "upload_date":"%(upload_date>%Y-%m-%d)s", "duration":"%(duration_string)s"}' ${url}`;
  const downloadPromise = new Promise((resolve, reject) => {
    exec(shellCommand, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      console.log(stdout);
      resolve(stdout);
    });
  });

  return await downloadPromise;
};
