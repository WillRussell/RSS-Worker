require('dotenv').config();

const { logBright, logInfo, banner } = require('./logging');

banner();

const bucketUrl = process.env['BUCKET_URL'];
const videoKey = 'video.mp4';

logBright('Stable Video URL');
logInfo('URL', `${bucketUrl}/${videoKey}`);
console.log();
