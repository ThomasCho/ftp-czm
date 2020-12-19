const log4js = require('log4js');

log4js.configure({
  appenders: {
    terminal: {
      type: 'stdout'
    },

    file: {
      type: 'file',
      filename: 'ftp-log.log',
      layout: {
        type: 'pattern',
        pattern: '%d %p %c %X{IP} %m%n'
      }
    },
  },
  categories: {
    default: {
      appenders: ['terminal', 'file'],
      level: 'all',
    },

    dev: {
      appenders: ['file'],
      level: 'all',
    }
  },
});

const logger = log4js.getLogger();
const devLogger = log4js.getLogger('dev');

module.exports = {
  logger,
  devLogger
};