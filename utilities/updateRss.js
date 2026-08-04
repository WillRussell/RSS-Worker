require('dotenv').config();

const fs = require('fs');

const AWS = require('aws-sdk');
const chalk = require('chalk');
const bytes = require('bytes');
const bucketName = process.env['BUCKET_NAME'];
const accessKeyId = process.env['ACCESS_KEY_ID'];
const secretAccessKey = process.env['SECRET_ACCESS_KEY_ID'];

const { logBright, logInfo } = require('../logging');

const s3 = new AWS.S3({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

module.exports.updateRss = async () => {
  logBright('Updating podcast RSS feed...');

  const fileName = 'rss.xml';
  const filePath = `./${fileName}`;
  const file = fs.readFileSync(filePath);

  const params = {
    Key: fileName,
    Bucket: bucketName,
    Body: file,
    ContentType: 'text/xml',
    ACL: 'public-read',
  };

  const updatePromise = new Promise((resolve, reject) => {
    const managedUpload = s3.upload(params);

    managedUpload.on('httpUploadProgress', (progress) => {
      const pct = Math.round((progress.loaded / progress.total) * 100);
      const width = 20;
      const filled = Math.round((pct / 100) * width);
      const bar =
        chalk.bold.blueBright('█'.repeat(filled)) +
        chalk.blackBright('░'.repeat(width - filled));
      const uploaded = chalk.blackBright(bytes(progress.loaded));
      const total = chalk.blackBright(bytes(progress.total));
      process.stdout.write(
        `\r${chalk.bold.blueBright('Uploading')}  ${chalk.white('[' + bar + ']')}  ${chalk.bold.white(pct + '%')}  ${uploaded} / ${total}   `,
      );
    });

    managedUpload.send((err, data) => {
      process.stdout.write('\n\n');
      if (err) return reject(err);
      Object.entries(data)
        .filter(([key]) => key !== 'Location')
        .forEach(([key, value]) => {
          logInfo(key, value);
        });
      resolve(data);
    });
  });

  return await updatePromise;
};
