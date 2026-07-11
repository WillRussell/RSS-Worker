require('dotenv').config();

const AWS = require('aws-sdk');
const chalk = require('chalk');
const bytes = require('bytes');
const readline = require('readline');
const { decodeCharCodes } = require('./helpers');
const { logBright, banner } = require('./logging');

banner();

const bucketName = process.env['BUCKET_NAME'];
const accessKeyId = process.env['ACCESS_KEY_ID'];
const secretAccessKey = process.env['SECRET_ACCESS_KEY_ID'];

const s3 = new AWS.S3({
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});

const AUDIO_EXTENSIONS = new Set(['.m4a', '.mp3']);
const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mkv',
  '.webm',
  '.mov',
  '.avi',
  '.flv',
  '.wmv',
]);

function getObjectType(key) {
  const extensionStart = key.lastIndexOf('.');
  const extension =
    extensionStart === -1 ? '' : key.slice(extensionStart).toLowerCase();

  if (AUDIO_EXTENSIONS.has(extension)) return 'Podcast audio';
  if (VIDEO_EXTENSIONS.has(extension)) return 'Video';
  if (key === 'rss.xml') return 'RSS feed';
  return 'Other';
}

function decodeMetadataValue(value) {
  if (!value) return '';

  const trimmedValue = value.trim();
  if (!/^\d+( \d+)*$/.test(trimmedValue)) {
    return trimmedValue;
  }

  return decodeCharCodes(trimmedValue);
}

function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  if (maxLength <= 3) return str.slice(0, maxLength);
  return `${str.slice(0, maxLength - 3)}...`;
}

async function getBucketObjects() {
  const objects = [];
  let continuationToken;

  do {
    const response = await s3
      .listObjectsV2({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      })
      .promise();

    objects.push(...(response.Contents || []));
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return objects.sort(
    (a, b) => new Date(b.LastModified) - new Date(a.LastModified),
  );
}

async function getObjectDetails(object) {
  try {
    const headObject = await s3
      .headObject({ Bucket: bucketName, Key: object.Key })
      .promise();
    const metadata = headObject.Metadata || {};

    return {
      ...object,
      ContentType: headObject.ContentType,
      Metadata: metadata,
      title: decodeMetadataValue(metadata.title),
      duration: decodeMetadataValue(metadata.duration),
      videoId: decodeMetadataValue(metadata.video_id),
      uploadDate: decodeMetadataValue(metadata.upload_date),
    };
  } catch (error) {
    return {
      ...object,
      metadataError: error.message,
    };
  }
}

async function getObjectsWithDetails(objects) {
  const objectsWithDetails = [];

  for (const object of objects) {
    objectsWithDetails.push(await getObjectDetails(object));
  }

  return objectsWithDetails;
}

function getDetailLine(object) {
  const details = [
    getObjectType(object.Key),
    object.ContentType,
    object.title ? `Title: ${object.title}` : 'No title metadata',
    object.duration ? `Duration: ${object.duration}` : '',
    object.videoId ? `Video ID: ${object.videoId}` : '',
    object.uploadDate ? `Upload date: ${object.uploadDate}` : '',
    bytes(object.Size),
    new Date(object.LastModified).toLocaleString(),
  ].filter(Boolean);

  if (object.metadataError) {
    details.splice(2, 0, `Metadata error: ${object.metadataError}`);
  }

  return details.join(' | ');
}

function renderSelector(objects, cursorIndex, selectedIndexes) {
  const stdout = process.stdout;
  const terminalRows = stdout.rows || 30;
  const terminalColumns = stdout.columns || 100;
  const headerRows = 5;
  const footerRows = 3;
  const itemRows = 2;
  const visibleCount = Math.max(
    1,
    Math.floor((terminalRows - headerRows - footerRows) / itemRows),
  );
  const halfWindow = Math.floor(visibleCount / 2);
  const maxStartIndex = Math.max(0, objects.length - visibleCount);
  const startIndex = Math.min(
    Math.max(0, cursorIndex - halfWindow),
    maxStartIndex,
  );
  const visibleObjects = objects.slice(startIndex, startIndex + visibleCount);
  const rows = [];

  rows.push(
    chalk.bold.blueBright(
      `Found ${objects.length} objects in bucket "${bucketName}"`,
    ),
  );
  rows.push(
    chalk.blackBright(
      'Use Up/Down to move, Space to select, Enter to delete selected, q to quit.',
    ),
  );
  rows.push(chalk.blackBright(`${selectedIndexes.size} selected`));
  rows.push('');

  if (startIndex > 0) {
    rows.push(chalk.blackBright(`... ${startIndex} newer item(s) above`));
  }

  visibleObjects.forEach((object, visibleIndex) => {
    const objectIndex = startIndex + visibleIndex;
    const isCurrent = objectIndex === cursorIndex;
    const isSelected = selectedIndexes.has(objectIndex);
    const pointer = isCurrent ? '>' : ' ';
    const checkbox = isSelected ? '[x]' : '[ ]';
    const keyPrefix = `${pointer} ${checkbox} `;
    const keyMaxLength = Math.max(10, terminalColumns - keyPrefix.length);
    const detailMaxLength = Math.max(10, terminalColumns - 4);
    const keyLine = `${keyPrefix}${truncate(object.Key, keyMaxLength)}`;
    const detailLine = `    ${truncate(getDetailLine(object), detailMaxLength)}`;

    rows.push(isCurrent ? chalk.cyan(keyLine) : keyLine);
    rows.push(chalk.blackBright(detailLine));
  });

  const hiddenBelow = objects.length - startIndex - visibleObjects.length;
  if (hiddenBelow > 0) {
    rows.push(chalk.blackBright(`... ${hiddenBelow} older item(s) below`));
  }

  readline.cursorTo(stdout, 0, 0);
  readline.clearScreenDown(stdout);
  stdout.write(`${rows.join('\n')}\n`);
}

function selectObjects(objects) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY || !process.stdin.setRawMode) {
      console.log(
        chalk.yellow(
          'Interactive selection requires a TTY. Run this command in a terminal.',
        ),
      );
      resolve([]);
      return;
    }

    let cursorIndex = 0;
    const selectedIndexes = new Set();

    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.removeListener('keypress', handleKeypress);
      process.stdin.pause();
      readline.cursorTo(process.stdout, 0, 0);
      readline.clearScreenDown(process.stdout);
    };

    const finish = (selectedObjects) => {
      cleanup();
      resolve(selectedObjects);
    };

    function handleKeypress(_str, key) {
      if (key.name === 'down') {
        cursorIndex = Math.min(cursorIndex + 1, objects.length - 1);
        renderSelector(objects, cursorIndex, selectedIndexes);
        return;
      }

      if (key.name === 'up') {
        cursorIndex = Math.max(cursorIndex - 1, 0);
        renderSelector(objects, cursorIndex, selectedIndexes);
        return;
      }

      if (key.name === 'space') {
        if (selectedIndexes.has(cursorIndex)) {
          selectedIndexes.delete(cursorIndex);
        } else {
          selectedIndexes.add(cursorIndex);
        }

        renderSelector(objects, cursorIndex, selectedIndexes);
        return;
      }

      if (key.name === 'return') {
        finish(
          [...selectedIndexes]
            .sort((a, b) => a - b)
            .map((selectedIndex) => objects[selectedIndex]),
        );
        return;
      }

      if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
        finish([]);
      }
    }

    renderSelector(objects, cursorIndex, selectedIndexes);
    process.stdin.on('keypress', handleKeypress);
  });
}

async function deleteSelectedObjects(objects) {
  const selectedObjects = await selectObjects(objects);

  if (selectedObjects.length === 0) {
    console.log(chalk.yellow('\nNo objects selected. Nothing was deleted.\n'));
    return;
  }

  console.log(chalk.bold.red('\nObjects selected for deletion:\n'));
  selectedObjects.forEach((object) => {
    const title = object.title ? ` (${object.title})` : '';
    console.log(chalk.red(`- ${object.Key}${title}`));
  });

  for (const object of selectedObjects) {
    await s3.deleteObject({ Bucket: bucketName, Key: object.Key }).promise();
    console.log(chalk.blackBright(`Deleted ${object.Key}`));
  }

  console.log(
    chalk.bold.blueBright(
      `\n${selectedObjects.length} object${
        selectedObjects.length === 1 ? ' has' : 's have'
      } been deleted from the S3 bucket.\n`,
    ),
  );
}

async function run() {
  try {
    logBright('Fetching S3 bucket contents...');

    const objects = await getBucketObjects();

    if (objects.length === 0) {
      console.log(chalk.yellow('No objects found in the bucket.'));
      return;
    }

    logBright('Fetching object metadata...');

    const objectsWithDetails = await getObjectsWithDetails(objects);

    await deleteSelectedObjects(objectsWithDetails);
  } catch (error) {
    console.error(chalk.red('Error managing bucket contents:'), error.message);
    process.exit(1);
  }
}

run();
