const fs = require('fs').promises;

module.exports.removeDownloads = async () => {
  try {
    await fs.rm('./downloads', { recursive: true });
    console.log('Successfully removed the local download');
  } catch (error) {
    console.error(`Error while deleting "downloads" directory: ${error}`);
  }
};
