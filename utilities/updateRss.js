require("dotenv").config();

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
  console.log("Updating RSS File...");

  const fileName = "rss.xml";
  const filePath = `./${fileName}`;
  const file = fs.readFileSync(filePath);

  const params = {
    Key: fileName,
    Bucket: bucketName,
    Body: file,
    ContentType: "text/xml",
    ACL: "public-read",
    Metadata: {
      duration: "999",
      otherKey: "xyz",
    },
  };

  const updatePromise = new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) return reject(err);
      console.log(data);
      resolve(data);
    });
  });

  return await updatePromise;
};
