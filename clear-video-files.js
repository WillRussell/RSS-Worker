require('dotenv').config();

const AWS = require('aws-sdk');
const chalk = require('chalk');

const bucketName = process.env['BUCKET_NAME'];

const accessKeyId = process.env['ACCESS_KEY_ID'];
const secretAccessKey = process.env['SECRET_ACCESS_KEY_ID'];

const s3 = new AWS.S3({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

const VIDEO_EXTENSIONS = new Set(['.mp4']);

function isVideoFile(key) {
  const extensionStart = key.lastIndexOf('.');
  const extension =
    extensionStart === -1 ? '' : key.slice(extensionStart).toLowerCase();

  return VIDEO_EXTENSIONS.has(extension);
}

async function clearVideoFiles() {
  console.log(
    chalk.bold.blueBright('\nFetching list of objects to remove...  \n')
  );

  const listObjectsResponse = await s3
    .listObjects({ Bucket: bucketName })
    .promise();
  const objects = listObjectsResponse.Contents;

  const videoObjects = objects.filter((object) => isVideoFile(object.Key));
  const videoCount = videoObjects.length;

  for (const object of videoObjects) {
    await s3.deleteObject({ Bucket: bucketName, Key: object.Key }).promise();

    console.log(chalk.blackBright(`Deleted ${object.Key}`));
  }

  console.log(
    chalk.bold.blueBright(
      `\n${videoCount} video files have been deleted from the s3 bucket.\n`
    )
  );
}

clearVideoFiles().catch(console.error);
