#! /usr/bin/env node

const program = require('commander');
const FTP = require('./ftp.js');
const SFTP = require('./sftp.js');
const connect = require('./connect.js');
const logger = require('./logger.js');

program
  .command('connect')
  .alias('c')
  .description('connect to the ftp server')
  .option('--type [p]', 'FTP类型')
  .option('--host [p]', '服务器地址')
  .option('--port [p]', '连接服务器端口')
  .option('--user [p]', '登陆用户名')
  .option('--password [p]', '登陆密码')
  .option('--root [p]', '登陆服务器的文件夹')
  .action((option) => {
    connect(option).then(
      async (config) => {
        logger.info(config);

        let Constructor = config.type === 'ftp' ? FTP : SFTP;
        new Constructor(config);
      },
      (e) => {
        logger.error(e);
      }
    );
  });

program.on('--help', () => {
  logger.info(require('./help.txt'));
});

program.parse(process.argv);
