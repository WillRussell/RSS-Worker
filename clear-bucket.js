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

async function clearMp3Files() {
  console.log(
    chalk.bold.blueBright('\nFetching list of objects to remove...  \n')
  );

  // List all objects in the bucket
  const listObjectsResponse = await s3
    .listObjects({ Bucket: bucketName })
    .promise();
  const objects = listObjectsResponse.Contents;

  // Filter out objects that are not mp3 files
  const mp3Objects = objects.filter((object) => object.Key.endsWith('.mp3'));
  const mp3Count = mp3Objects.length;

  // Delete each mp3 file
  for (const object of mp3Objects) {
    await s3.deleteObject({ Bucket: bucketName, Key: object.Key }).promise();

    console.log(chalk.blackBright(`Deleted ${object.Key}`));
  }

  console.log(
    chalk.bold.blueBright(
      `\n${mp3Count} mp3 files have been deleted from the s3 bucket.\n`
    )
  );
}

clearMp3Files().catch(console.error);
