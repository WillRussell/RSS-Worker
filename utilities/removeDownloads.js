const fs = require('fs').promises;

module.exports.removeDownloads = async () => {
  try {
    await fs.rmdir('./downloads', { recursive: true });
    console.log('Successfully removed the "downloads" directory');
  } catch (error) {
    console.error(`Error while deleting "downloads" directory: ${error}`);
  }
};
