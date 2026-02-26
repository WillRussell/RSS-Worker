# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Node.js CLI tool that converts YouTube videos into podcast episodes by downloading audio via `yt-dlp`, uploading to AWS S3, and regenerating an RSS XML feed. Podcast metadata is encoded as char codes in S3 object metadata (see `helpers.js`).

## Prerequisites

- `yt-dlp` must be installed on the system (used via shell `exec` in `utilities/downloadVideo.js` and `utilities/getVideoInfo.js`)
- AWS S3 bucket with appropriate permissions
- `.env` file at root (see below)

## Environment Variables (`.env`)

```
ACCESS_KEY_ID=
SECRET_ACCESS_KEY_ID=
BUCKET_NAME=
BUCKET_URL=
PODCAST_FEED_IMAGE=
CHANNEL_NAME=        # YouTube channel name for get-mr-live.js
```

## Commands

```bash
# Install dependencies
npm install

# Convert a YouTube URL to a podcast episode
node index <youtube-url>

# Auto-find & process the latest MR Live episode (uses youtubei to search the channel)
node get-mr-live.js

# List all objects in the S3 bucket
node list-bucket.js

# Delete all mp3 files from S3 bucket (destructive)
node clear-bucket.js
```

## Architecture

The main pipeline (`index.js`) runs these steps sequentially:

1. **`utilities/getVideoInfo.js`** — Calls `yt-dlp --skip-download --print` to fetch video metadata (id, title, upload_date, duration, uploader) as JSON
2. **`utilities/downloadVideo.js`** — Calls `yt-dlp -x --audio-format mp3` to download and convert video to mp3 into `./downloads/`
3. **`utilities/uploadPodcast.js`** — Finds the latest mp3 in `./downloads/`, uploads to S3 with a UUID key; metadata (title, dates, duration, video_id) is stored as char-code-encoded strings in S3 object metadata
4. **`utilities/removeDownloads.js`** — Deletes the `./downloads/` directory
5. **`utilities/generateXml.js`** — Lists all mp3s from S3, reads their metadata (decoding char codes), builds a podcast RSS XML document using `xmlbuilder2`, and writes `rss.xml` locally
6. **`utilities/updateRss.js`** — Uploads `rss.xml` to S3 as a public-read `text/xml` object

**`get-mr-live.js`** is an alternate entry point that uses the `youtubei` library to search for the latest live show on the configured YouTube channel, parses the video description to find the "fun half" URL, then runs the same pipeline (skipping `removeDownloads`).

### Metadata encoding

S3 HTTP headers only allow ASCII. Since episode titles can contain Unicode, `helpers.js` provides `encodeStr` (string → char code array) and `decodeCharCodes` (space-separated char codes → string) to handle this round-trip.

### Key files

| File | Purpose |
|------|---------|
| `index.js` | Main entry point for manual URL processing |
| `get-mr-live.js` | Auto-detect latest MR Live episode |
| `utilities/generateXml.js` | Rebuilds entire RSS feed from S3 bucket contents |
| `helpers.js` | Char-code encode/decode for S3 metadata |
| `logging.js` | Chalk-based colored logging helpers |
| `list-bucket.js` | Inspect S3 bucket contents |
| `clear-bucket.js` | Remove all mp3s from S3 (use carefully) |
