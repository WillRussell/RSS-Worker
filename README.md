# Podcastify (RSS Worker)

A Node.js command-line tool that turns a YouTube video into a
hosted podcast episode with a single command.

<img width="650" alt="Podcastify example" src="https://github.com/user-attachments/assets/4eb21bed-5036-4f0c-8113-bd4af2e778b7" />

## Requirements

- Node.js 20.10.0
- npm
- [`yt-dlp`](https://github.com/yt-dlp/yt-dlp#installation)
- [FFmpeg](https://ffmpeg.org/download.html), used by `yt-dlp` to extract audio
  and merge or remux video
- An Amazon S3 bucket
- AWS credentials that can list, read, upload, delete, and set public-read ACLs
  on objects in that bucket

Confirm that the external tools are available:

```bash
node --version
yt-dlp --version
ffmpeg -version
```

## Setup

Install the Node.js dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```dotenv
ACCESS_KEY_ID=your-aws-access-key-id
SECRET_ACCESS_KEY_ID=your-aws-secret-access-key
BUCKET_NAME=your-s3-bucket-name
BUCKET_URL=https://your-public-bucket-or-cdn.example.com
PODCAST_FEED_IMAGE=https://example.com/podcast-cover.jpg
```

Environment variables:

| Variable | Purpose |
| --- | --- |
| `ACCESS_KEY_ID` | AWS access key used by the S3 client. |
| `SECRET_ACCESS_KEY_ID` | AWS secret access key used by the S3 client. |
| `BUCKET_NAME` | Name of the S3 bucket that stores audio, video, and `rss.xml`. |
| `BUCKET_URL` | Public base URL for the bucket or CDN, without a trailing slash. It is used to build enclosure, feed, and video URLs. |
| `PODCAST_FEED_IMAGE` | Public URL of the image included in the podcast RSS feed. |

The upload code assigns `public-read` to published files. The bucket must allow
object ACLs and public reads, or `BUCKET_URL` must point to a CDN that can serve
the uploaded objects. Never commit `.env` or expose the AWS credentials.

## Commands

Run the command overview at any time with:

```bash
node help
```

### Create and publish a podcast episode

```bash
node podcastify "https://www.youtube.com/watch?v=ofmDFkcwXxA"
```

This command:

1. Reads the video's ID, title, uploader, upload date, and duration with
   `yt-dlp`.
2. Downloads the best compatible audio and converts it to M4A in `downloads/`.
3. Uploads the episode to S3 as a public object with a random key.
4. Removes the local `downloads/` directory.
5. Finds every M4A and MP3 episode in the bucket and regenerates `rss.xml`.
6. Uploads the new public `rss.xml` to S3.


### Create and publish a browser-playable video

```bash
node videoWorker "https://www.youtube.com/watch?v=VIDEO_ID"
```

This downloads a single video, produces an MP4 suitable for browser playback,
and uploads it as `video.mp4`. Because the S3 key is fixed, every run replaces
the previously published video. The temporary `videoWorker/videoDownloads/`
directory is removed after a successful upload.

### Display public URLs

Print the podcast feed URL (`BUCKET_URL/rss.xml`):

```bash
node get-feed-url
```

Print the stable video URL (`BUCKET_URL/video.mp4`):

```bash
node get-video-url
```

These commands only print calculated URLs; they do not check whether the
objects exist or are publicly accessible.

### Inspect S3 contents

```bash
npm run list-bucket
```

Equivalent direct command:

```bash
node list-bucket
```

Objects are shown newest first with their type, size, last-modified time, and
ETag, followed by bucket totals.

### Interactively delete selected S3 objects

```bash
npm run interactive-delete
```

Equivalent direct command:

```bash
node interactive-delete
```

This requires an interactive terminal. Use Up/Down to move, Space to select or
deselect an object, Enter to delete the selected objects, and `q` or Ctrl+C to
quit without deleting. Where available, the selector displays episode title,
duration, source video ID, and upload date from S3 metadata.

Deletion starts immediately after Enter; there is no additional confirmation.

### Delete all podcast audio from S3

```bash
node clear-bucket
```

This permanently deletes every `.m4a` and `.mp3` object in the bucket. It does
not delete `rss.xml`, videos, or other objects.

### Delete all published MP4 video files from S3

```bash
node clear-video-files
```

This permanently deletes every `.mp4` object in the bucket, including the
stable `video.mp4` upload. It does not delete podcast audio, `rss.xml`, or other
video extensions.

The deletion commands do not rebuild the RSS feed. If audio is deleted, the
published feed may still reference it until another podcast episode is
processed and the feed is regenerated.

## How the project works

### Podcast pipeline

`podcastify.js` coordinates the modules in `utilities/`:

| Step | Module | Responsibility |
| --- | --- | --- |
| 1 | `getVideoInfo.js` | Fetch source metadata with `yt-dlp` without downloading the video. |
| 2 | `downloadVideo.js` | Download and extract the best compatible audio as M4A. |
| 3 | `uploadPodcast.js` | Upload the newest local audio file to a unique, public S3 object. |
| 4 | `removeDownloads.js` | Remove temporary local audio files. |
| 5 | `generateXml.js` | Read all M4A and MP3 objects from S3 and create a local `rss.xml`. |
| 6 | `updateRss.js` | Upload `rss.xml` as a public `text/xml` object. |

Episode objects use a random key so new runs add episodes rather than replacing
older ones. The original title, creation time, duration, upload date, and source
video ID are stored as S3 object metadata. Since S3 metadata headers must be
ASCII-safe, string values are encoded as space-separated character codes by
`helpers.js` and decoded again while the feed is generated.

The RSS feed's title, author, subtitle, and summary format are currently defined
in `utilities/generateXml.js`. Change them there if you want to customize the
podcast's presentation.

### Video pipeline

`videoWorker/index.js` runs a separate workflow:

1. `videoWorker/downloadVideo.js` downloads one video, preferring MP4/H.264
   video and M4A audio, then merges or remuxes the result to MP4.
2. `videoWorker/uploadVideo.js` streams it to S3 as public `video.mp4` with an
   inline content disposition.
3. `videoWorker/removeDownloads.js` removes the temporary local copy.

This workflow does not add an RSS episode or modify `rss.xml`.

## Generated files and storage layout

| Location | Contents |
| --- | --- |
| `downloads/` | Temporary extracted podcast audio; removed after processing. |
| `videoWorker/videoDownloads/` | Temporary MP4 video; removed after processing. |
| `rss.xml` | Locally generated copy of the current podcast feed. |
| S3 random-key `.m4a`/`.mp3` objects | Published podcast episodes. |
| S3 `rss.xml` | Published podcast feed. |
| S3 `video.mp4` | Latest browser-playable video. |

## Notes

- Processing time depends on the source length, connection speed, FFmpeg work,
  and S3 upload speed.
- The main podcast command expects a single video URL. The video command also
  passes `--no-playlist` to `yt-dlp`.
- The project does not currently include an automated test suite; `npm test` is
  only the default placeholder and exits with an error.
