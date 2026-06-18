require("dotenv").config();

const AWS = require("aws-sdk");
const chalk = require("chalk");
const prettyBytes = require("pretty-bytes");
const { logBright, logInfo, banner } = require("./logging");

banner();

const bucketName = process.env["BUCKET_NAME"];
const accessKeyId = process.env["ACCESS_KEY_ID"];
const secretAccessKey = process.env["SECRET_ACCESS_KEY_ID"];

const s3 = new AWS.S3({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

const AUDIO_EXTENSIONS = new Set([".m4a", ".mp3"]);

function getObjectType(key) {
  const extensionStart = key.lastIndexOf(".");
  const extension =
    extensionStart === -1 ? "" : key.slice(extensionStart).toLowerCase();

  if (AUDIO_EXTENSIONS.has(extension)) return "Podcast audio";
  if (key === "rss.xml") return "RSS feed";
  return "Other";
}

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
      const sizeFormatted = prettyBytes(object.Size);
      const lastModified = new Date(object.LastModified).toLocaleString();

      console.log(chalk.cyan(`${index + 1}. ${object.Key}`));
      logInfo("   Type", getObjectType(object.Key));
      logInfo("   Size", sizeFormatted);
      logInfo("   Last Modified", lastModified);
      logInfo("   ETag", object.ETag);
      console.log("");
    });

    // Summary statistics
    const totalSize = objects.reduce((sum, obj) => sum + obj.Size, 0);
    const totalSizeFormatted = prettyBytes(totalSize);
    const audioCount = objects.filter(
      (object) => getObjectType(object.Key) === "Podcast audio",
    ).length;

    console.log(chalk.bold.green(`Total objects: ${objects.length}`));
    console.log(chalk.bold.green(`Podcast audio files: ${audioCount}`));
    console.log(chalk.bold.green(`Total size: ${totalSizeFormatted}\n`));
  } catch (error) {
    console.error(chalk.red("Error listing bucket contents:"), error.message);
    process.exit(1);
  }
}

listBucketContents();
