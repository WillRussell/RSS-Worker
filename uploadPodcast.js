require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { max } = require("lodash");

const AWS = require("aws-sdk");
const multer = require("multer");
const { memoryStorage } = require("multer");

const storage = memoryStorage();
const upload = multer({ storage });

const bucketName = "gray-wolf-feed";

const accessKeyId = process.env["ACCESS_KEY_ID"];
const secretAccessKey = process.env["SECRET_ACCESS_KEY_ID"];

const s3 = new AWS.S3({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

module.exports.uploadPodcast = async () => {
  const file = fs.readFileSync("./mr-fun.mp3");

  // const testFile = await fs.readFile('./mr-fun.mp3');
  // console.log(files);
  // console.log(testFile);

  const fileName = "mr fun 8/26";
  // const bucketName = null;
  // const file = null

  const params = {
    Key: fileName,
    Bucket: bucketName,
    Body: file,
    ContentType: "audio/mpeg",
    ACL: "public-read",
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.log(err);
      return err;
    } else {
      console.log(data);
      return data;
    }
  });

  //   const uploadPromise = new Promise((resolve, reject) => {
  //
  //
  //   });

  // return await uploadPromise;
};
