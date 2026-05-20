require('dotenv').config();

const AWS = require('aws-sdk');
const chalk = require('chalk');
const { banner } = require('./logging');

// banner();

const bucketName = process.env['BUCKET_NAME'];

const accessKeyId = process.env['ACCESS_KEY_ID'];
const secretAccessKey = process.env['SECRET_ACCESS_KEY_ID'];

const s3 = new AWS.S3({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

const AUDIO_EXTENSIONS = new Set(['.m4a', '.mp3']);

function isAudioFile(key) {
  const extensionStart = key.lastIndexOf('.');
  const extension =
    extensionStart === -1 ? '' : key.slice(extensionStart).toLowerCase();

  return AUDIO_EXTENSIONS.has(extension);
}

async function clearAudioFiles() {
  console.log(
    chalk.bold.blueBright('\nFetching list of objects to remove...  \n')
  );

  // List all objects in the bucket
  const listObjectsResponse = await s3
    .listObjects({ Bucket: bucketName })
    .promise();
  const objects = listObjectsResponse.Contents;

  // Filter out objects that are not podcast audio files
  const audioObjects = objects.filter((object) => isAudioFile(object.Key));
  const audioCount = audioObjects.length;

  // Delete each podcast audio file
  for (const object of audioObjects) {
    await s3.deleteObject({ Bucket: bucketName, Key: object.Key }).promise();

    console.log(chalk.blackBright(`Deleted ${object.Key}`));
  }

  console.log(
    chalk.bold.blueBright(
      `\n${audioCount} audio files have been deleted from the s3 bucket.\n`
    )
  );
}

clearAudioFiles().catch(console.error);
