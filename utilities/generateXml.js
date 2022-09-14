require("dotenv").config();

const fs = require("fs");
const { create } = require("xmlbuilder2");
const { get } = require("lodash");
const AWS = require("aws-sdk");

const { decodeCharCodes } = require("../helpers");

const bucketName = process.env["BUCKET_NAME"];
const bucketUrl = process.env["BUCKET_URL"];
const podcastFeedImage = process.env["PODCAST_FEED_IMAGE"];

const accessKeyId = process.env["ACCESS_KEY_ID"];
const secretAccessKey = process.env["SECRET_ACCESS_KEY_ID"];

const s3 = new AWS.S3({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

module.exports.generateXml = async () => {

  console.log("Generating new XML file...")

  const podcastCollection = [];

  const params = { Bucket: bucketName };

  const data = await s3.listObjects(params).promise();
  const contents = get(data, "Contents", []);

  for (let index = 0; index < contents.length; index++) {

    const fileObj = contents[index];
    const fileName = get(fileObj, "Key");

    const isMp3 = fileName.includes(".mp3");

    if (isMp3) {
      const headObj = await s3.headObject({ ...params, Key: fileName }).promise();
      const podcastMeta = get(headObj, "Metadata");

      const resourceId = get(podcastMeta, "uuid");
      const createdAtEncoded = get(podcastMeta, "created");
      const episodeTitleEncoded = get(podcastMeta, "title");

      const createdAtDecoded = decodeCharCodes(createdAtEncoded);
      const episodeTitleDecoded = decodeCharCodes(episodeTitleEncoded);

      const publicUrl = `${bucketUrl}/${resourceId}.mp3`;

      podcastCollection.push({
        id: resourceId,
        createdAt: createdAtDecoded,
        title: episodeTitleDecoded,
        url: publicUrl,
      });
    }
  }

  // Base of XML Document. Everything lives inside Channel Tag
  const dynamicRoot = create({ version: "1.0" })
    .ele("rss", { version: "2.0" })
    .ele("channel").up();

  // Append Channel Tag, add title and RSS Feed image
    dynamicRoot.root().first().ele("title")
    .txt("Gray Wolf Feed").up()
    .ele("image")
    .ele("url").txt(podcastFeedImage)
    .up();


  // Run the forEach loop across the mp3s from s3
  // add <item> tags for each podcast. 
  podcastCollection.forEach((o) => {
    dynamicRoot.root().first()
      .ele("item")
      .ele("title").txt(o.title).up()
      .ele("itunes:author").txt("GRAY WOLF AUTHOR").up()
      .ele("itunes:subtitle").txt("GRAY WOLF SUBTITLE").up()
      .ele("itunes:summary").txt("Podcast Summary goes here").up()
      .ele("itunes:image", { href: podcastFeedImage }).up()
      .ele("enclosure", {
        url: o.url,
        length: "",
        type: "audio/mpeg"
      }).up()
      .ele("guid").txt(" ").up()
      .ele("pubDate").txt(o.createdAt).up()
      .ele("itunes:duration").txt(" ").up();
    });

  // convert the XML tree to string
  const xml = dynamicRoot.end({ prettyPrint: true });

  const xmlPromise = new Promise((resolve, reject) => {
    fs.writeFile('rss.xml', xml, (err, data) => {
      if (err) return reject(err);
      console.log(`Success: XML file created for RSS Feed`);
      resolve();
    });
  });

  return await xmlPromise;
};
