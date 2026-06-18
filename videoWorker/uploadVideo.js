require('dotenv').config();

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const { logBright, logInfo } = require('../logging');

const bucketName = process.env['BUCKET_NAME'];
const accessKeyId = process.env['ACCESS_KEY_ID'];
const secretAccessKey = process.env['SECRET_ACCESS_KEY_ID'];
const bucketUrl = process.env['BUCKET_URL'];

const VIDEO_KEY = 'video.mp4';

const s3 = new AWS.S3({
  accessKeyId,
  secretAccessKey,
});

function getPublicUrl(uploadData) {
  if (bucketUrl) {
    return `${bucketUrl.replace(/\/$/, '')}/${VIDEO_KEY}`;
  }

  return uploadData.Location;
}

module.exports.uploadVideo = async (filePath) => {
  if (!bucketName) {
    throw new Error('BUCKET_NAME is required in .env');
  }

  logBright('\nStarting S3 video upload...');

  const params = {
    Key: VIDEO_KEY,
    Bucket: bucketName,
    Body: fs.createReadStream(filePath),
    ContentLength: fs.statSync(filePath).size,
    ContentType: 'video/mp4',
    ContentDisposition: `inline; filename="${path.basename(VIDEO_KEY)}"`,
    CacheControl: 'no-cache',
    ACL: 'public-read',
  };

  const uploadData = await new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });

  Object.entries(uploadData).forEach(([key, value]) => {
    logInfo(key, value);
  });

  const publicUrl = getPublicUrl(uploadData);
  logInfo('Public URL', publicUrl);

  return {
    ...uploadData,
    publicUrl,
  };
};
