# Podcastify (RSS Worker)

Node.js app that turns youtube videos into podcasts.

## Get Started

Running this project locally requires [yt-dlp](https://github.com/yt-dlp/yt-dlp#installation), a `youtube-dl` fork with additional features and fixes.

##### Install the dependencies:

```
npm install
```

##### Add `.env` file to the root with AWS environment variables

```
ACCESS_KEY_ID=
SECRET_ACCESS_KEY_ID=
BUCKET_NAME=
BUCKET_URL=
PODCAST_FEED_IMAGE=
```

##### Run the command with your targeted Youtube URL

```
node index https://www.youtube.com/watch?v=ofmDFkcwXxA
```
##### Example output:
<img width="600" alt="Logging improvements" src="https://user-images.githubusercontent.com/8751625/231025988-f19c2317-dabf-4f88-aeeb-f9ecc5ff151a.png">

## TODO: 

- change `getUrl.js` -> `validateUrl.js` (and write logic to valid user input from cmd line)
- put the logic from getUrl into new file called runMrLiveTask.js & update the code find live episodes in the new ui

