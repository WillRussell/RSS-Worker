require("dotenv").config();

const AWS = require("aws-sdk");
const chalk = require("chalk");
const { logBright, logInfo } = require("./logging");

const bucketName = process.env["BUCKET_NAME"];
const accessKeyId = process.env["ACCESS_KEY_ID"];
const secretAccessKey = process.env["SECRET_ACCESS_KEY_ID"];

const s3 = new AWS.S3({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

async function listBucketContents() {
  try {
    logBright("Fetching S3 bucket contents...");

    const listObjectsResponse = await s3
      .listObjects({ Bucket: bucketName })
      .promise();

    const objects = listObjectsResponse.Contents;

    if (!objects || objects.length === 0) {
      console.log(chalk.yellow("No objects found in the bucket."));
      return;
    }

    console.log(
      chalk.bold.blueBright(
        `\nFound ${objects.length} objects in bucket "${bucketName}":\n`,
      ),
    );

    // Sort objects by last modified date (newest first)
    objects.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));

    objects.forEach((object, index) => {
      const sizeInKB = (object.Size / 1024).toFixed(2);
      const lastModified = new Date(object.LastModified).toLocaleString();

      console.log(chalk.cyan(`${index + 1}. ${object.Key}`));
      logInfo("   Size", `${sizeInKB} KB`);
      logInfo("   Last Modified", lastModified);
      logInfo("   ETag", object.ETag);
      console.log("");
    });

    // Summary statistics
    const totalSize = objects.reduce((sum, obj) => sum + obj.Size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    console.log(chalk.bold.green(`Total objects: ${objects.length}`));
    console.log(chalk.bold.green(`Total size: ${totalSizeMB} MB\n`));
  } catch (error) {
    console.error(chalk.red("Error listing bucket contents:"), error.message);
    process.exit(1);
  }
}

listBucketContents();
