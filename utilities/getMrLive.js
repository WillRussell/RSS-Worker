require("dotenv").config();

const { Client } = require("youtubei");
const { get, pick } = require("lodash");

const channelName = process.env["CHANNEL_NAME"];

const youtube = new Client();

const isUrl = (str) => str.toLowerCase().includes("https://");

module.exports.getMrLiveUrl = async () => {

  /* Step 1: Find the Youtube channel & get latest uploads */
  const channel = await youtube.findOne(channelName, { type: "channel" });
  await channel.videos.next(); // most recent 30 videos

  /* Step 2: Create a list of only live broadcasts */
  const liveShowList = channel.videos.items.filter((item) =>
    item.title.toLowerCase().includes("mr live")
  );

  // liveShowList is broken since Youtube changed its UI and removed live streams from the "Videos" tab.
  // The YoutubeI api has no way of accessing the new "Live" tab where old streams are stored.
  // Github issue:
  // https://github.com/SuspiciousLookingOwl/youtubei/issues/72#issuecomment-1403395409

  console.log("LIVE SHOW LIST");
  console.log(liveShowList);

  /* Step 3: Get video ID of the most recent live broadcast  */
  const latestLiveShow = liveShowList.shift();
  const liveShowObj = pick(latestLiveShow, ["id", "title", "duration"]);

  /* Step 4: Fetch the video description  */
  const video = await youtube.getVideo(liveShowObj.id);
  const videoDescription = get(video, "description");

  /* Step 5: Parse the target URL from the description */
  const descriptionList = videoDescription.split("\n");
  const textRow = descriptionList.find((str) =>
    str.toLowerCase().includes("fun half")
  );
  const textCollection = textRow.split(" ");
  const endString = textCollection.pop();

  // If text row contains multiple URLs, it's preferable to use the last one
  const targetUrl = isUrl(endString)
    ? endString
    : textCollection.find((str) => isUrl(str));

  console.log(`Target URL: ${targetUrl}`);
  return targetUrl;
};
