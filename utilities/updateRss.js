require("dotenv").config();

const chalk = require("chalk");
const fs = require("fs");

const AWS = require("aws-sdk");
const bucketName = process.env["BUCKET_NAME"];
const accessKeyId = process.env["ACCESS_KEY_ID"];
const secretAccessKey = process.env["SECRET_ACCESS_KEY_ID"];

const s3 = new AWS.S3({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

module.exports.updateRss = async () => {
  console.log(chalk.bold.blueBright("Updating podcast RSS feed...\n"));

  const fileName = "rss.xml";
  const filePath = `./${fileName}`;
  const file = fs.readFileSync(filePath);

  const params = {
    Key: fileName,
    Bucket: bucketName,
    Body: file,
    ContentType: "text/xml",
    ACL: "public-read",
  };

  const updatePromise = new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) return reject(err);
      Object.entries(data).forEach(([key,value]) => {
        console.log(`${chalk.blackBright(key)}: ${chalk.white(value)}`);
      });
      resolve(data);
    });
  });

  return await updatePromise;
};
