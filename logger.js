const log4js = require('log4js');

log4js.configure({
  appenders: {
    terminal: {
      type: 'stdout',
    },

    file: {
      type: 'file',
      filename: 'ftp-log.log',
    },
  },
  categories: {
    default: {
      appenders: ['terminal', 'file'],
      level: 'all',
    },
  },
});

const logger = log4js.getLogger();

module.exports = logger;