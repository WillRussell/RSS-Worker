const chalk = require('chalk');

module.exports = {
  banner: function () {
    const lines = [
      ' ____   ___  ____   ____    _    ____ _____ ___ _______   __',
      '|  _ \\ / _ \\|  _ \\ / ___|  / \\  / ___|_   _|_ _|  ___\\ \\ / /',
      '| |_) | | | | | | | |     / _ \\ \\___ \\ | |  | || |_   \\ V / ',
      '|  __/| |_| | |_| | |___ / ___ \\ ___) || |  | ||  _|   | |  ',
      '|_|    \\___/|____/ \\____/_/   \\_\\____/ |_| |___|_|     |_|  ',
    ];
    const colors = ['#FF6B6B', '#FF8E53', '#FECA57', '#48DBFB', '#6C5CE7'];
    console.log('');
    lines.forEach((line, i) => {
      console.log(chalk.hex(colors[i]).bold(line));
    });
    console.log('');
  },

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
