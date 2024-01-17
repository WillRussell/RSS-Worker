const chalk = require('chalk');

module.exports = {
  log: function (str) {
    console.log(chalk.blackBright(str));
  },

  logBright: function (str) {
    console.log(chalk.bold.blueBright(`${str}\n`));
  },

  logInfo: function (message, value) {
    console.log(chalk.blackBright(message + ': ') + chalk.white(value));
  },
};
