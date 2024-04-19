const { exec } = require("child_process");
const { logBright, logInfo } = require("../logging");

module.exports.getVideoInfo = async (url) => {
  logBright(`\nFetching video info...`);

  // --skip-download skips downloading the video
  // --print prints the video metadata
  // --print-json prints the video metadata as a json string

  // %(description)j will render the description as a json string
  // %(description)s will render the description as a string

  // yt-dlp template strings
  const id = `"id":%(id)j`;
  const title = `"title":%(title)j`;
  const upload_date = `"upload_date":%(upload_date>%m-%d-%Y)j`;
  const duration = `"duration":%(duration_string)j`;
  const uploader = `"uploader":%(uploader)j`;

  const dlTemplate = `{ ${id}, ${uploader}, ${title}, ${upload_date}, ${duration} }`;

  const shellCommand = `yt-dlp --skip-download --print '${dlTemplate}' ${url}`;

  const downloadPromise = new Promise((resolve, reject) => {
    exec(shellCommand, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return reject(err);
      const result = JSON.parse(stdout);
      const { id, title, upload_date, duration, uploader } = result;

      logInfo("Channel Name", uploader);
      logInfo("Video Title", title);
      logInfo("Video ID", id);
      logInfo("Upload Date", upload_date);
      logInfo("Duration", duration);

      resolve(result);
    });
  });

  return await downloadPromise;
};
