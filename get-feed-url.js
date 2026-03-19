require("dotenv").config();

const { logBright, logInfo, banner } = require("./logging");

banner();

const bucketUrl = process.env["BUCKET_URL"];

logBright("Podcast RSS Feed URL");
logInfo("URL", `${bucketUrl}/rss.xml`);
console.log();
