require("dotenv").config();

const { exec } = require("child_process");
const { Client } = require("youtubei");
const { get, pick } = require("lodash");

const channelName = process.env["CHANNEL_NAME"];

const youtube = new Client();

const isLink = (str) => str.toLowerCase().includes("https://");

const getLinkFromDescription = (description) => {
  const descriptionList = description.split("\n");

  const textLine = descriptionList.find((str) =>
    str.toLowerCase().includes("fun half")
  );

  const textCollection = textLine.split(" ");

  const endString = textCollection.pop();

  // If the line of text contains multiple URLs, it's preferable to use the last URL
  return isLink(endString)
    ? endString
    : textCollection.find((str) => isLink(str));
};

const run = async () => {
  const channel = await youtube.findOne(channelName, { type: "channel" });
  await channel.videos.next(); // most recent 30 videos

  const liveShowList = channel.videos.items.filter((item) =>
    item.title.toLowerCase().includes("mr live")
  );

  const latestLiveShow = liveShowList.shift();

  const liveShowObj = pick(latestLiveShow, ["id", "title", "duration"]);

  const video = await youtube.getVideo(liveShowObj.id);

  const videoDescription = get(video, "description");

  const targetUrl = getLinkFromDescription(videoDescription);

  const shellCommand = `yt-dlp -o '%(title)s.%(ext)s' -x --audio-format mp3 ${targetUrl}`;

  exec(shellCommand, (err, output) => {
    if (err) {
      console.error("could not execute command: ", err);
      return;
    }
    console.log("Output: \n", output);
  });
};

run();
