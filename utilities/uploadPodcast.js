require('dotenv').config();

const chalk = require('chalk');
const fs = require('fs');
const glob = require('glob');
const crypto = require('crypto');
const { get } = require('lodash');

const AWS = require('aws-sdk');
const bucketName = process.env['BUCKET_NAME'];
const accessKeyId = process.env['ACCESS_KEY_ID'];
const secretAccessKey = process.env['SECRET_ACCESS_KEY_ID'];

const { encodeStr } = require('../helpers');

const s3 = new AWS.S3({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

const findLastDownload = () => {
  return new Promise((resolve, reject) => {
    glob('./downloads' + '/**/*.mp3', {}, (err, files) => {
      if (err) return reject(err);

      let cTime = null;
      let path = null;

      files.forEach((file) => {
        const stats = fs.statSync(file);
        const createdAt = stats.ctime;
        if (createdAt > cTime) {
          cTime = createdAt;
          path = file;
        }
      });

      const episodeTitle = path
        .split('./downloads/')
        .pop()
        .split('.mp3')
        .shift()
        .replace('｜', '-');

      resolve({ episodeTitle, path, cTime });
    });
  });
};

module.exports.uploadPodcast = async (podcastInfo) => {
  const podcast = await findLastDownload();

  const uploadKey = get(podcast, 'episodeTitle');
  const filePath = get(podcast, 'path');
  const createdAt = get(podcast, 'cTime');

  const file = fs.readFileSync(filePath);

  const episodeTitleEncoded = encodeStr(uploadKey);
  const createdAtEncoded = encodeStr(createdAt.toString());

  const uuid = crypto.randomBytes(16).toString('hex');

  const video_id = get(podcastInfo, 'id');
  const upload_date = get(podcastInfo, 'upload_date');
  const duration = get(podcastInfo, 'duration');

  const videoIdEncoded = encodeStr(video_id);
  const uploadDateEncoded = encodeStr(upload_date);
  const durationEncoded = encodeStr(duration);

  const params = {
    Key: `${uuid}.mp3`,
    Bucket: bucketName,
    Body: file,
    ContentType: 'audio/mpeg',
    ACL: 'public-read',
    Metadata: {
      uuid: uuid,
      created: createdAtEncoded.join(' '),
      title: episodeTitleEncoded.join(' '),
      video_id: videoIdEncoded.join(' '),
      upload_date: uploadDateEncoded.join(' '),
      duration: durationEncoded.join(' '),
    },
  };

  console.log(chalk.bold.blueBright('Starting S3 bucket upload...\n'));

  const uploadPromise = new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) return reject(err);
      Object.entries(data).forEach(([key, value]) => {
        console.log(`${chalk.blackBright(key)}: ${chalk.white(value)}`);
      });
      resolve(data);
    });
  });

  return await uploadPromise;
};
