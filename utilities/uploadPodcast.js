require("dotenv").config();

const fs = require("fs");
const glob = require("glob");
const { get } = require("lodash");

const AWS = require("aws-sdk");
const bucketName = process.env["BUCKET_NAME"];
const accessKeyId = process.env["ACCESS_KEY_ID"];
const secretAccessKey = process.env["SECRET_ACCESS_KEY_ID"];

const s3 = new AWS.S3({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

const findLastDownload = () => {
  return new Promise((resolve, reject) => {
    glob("./downloads" + "/**/*.mp3", {}, (err, files) => {
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
        .split("./downloads/")
        .pop()
        .split(".mp3")
        .shift()
        .replace("｜", "-");

      resolve({ episodeTitle, path });
    });
  });
};

module.exports.uploadPodcast = async () => {
  const podcast = await findLastDownload();

  const uploadKey = get(podcast, "episodeTitle");
  const filePath = get(podcast, "path");
  const file = fs.readFileSync(filePath);

  const params = {
    Key: uploadKey,
    Bucket: bucketName,
    Body: file,
    ContentType: "audio/mpeg",
    ACL: "public-read",
  };

  console.log("Starting S3 bucket upload...");

  const uploadPromise = new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) return reject(err);
      console.log(data);
      resolve(data);
    });
  });

  return await uploadPromise;
};
