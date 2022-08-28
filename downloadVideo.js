const { exec } = require("child_process");

module.exports.downloadVideo = async (url) => {
  
  const shellCommand = `yt-dlp -o '%(title)s.%(ext)s' -x --audio-format mp3 ${url}`;

  const downloadPromise = new Promise((resolve, reject) => {
    exec(shellCommand, (err, stdout) => {
      if (err) return reject(err);
      console.log(stdout);
      resolve(stdout);
    });
  });

  return await downloadPromise;
};
