#! /usr/bin/env node

const FTP = require('./ftp.js');
const SFTP = require('./sftp.js');
const connectInquiry = require('./bin/connect.js');
const pollingInquire = require('./bin/polling-inquire.js');
const { logger, devLogger } = require('./logger.js');
const program = require('commander');

async function startInquire(ftp) {
  const ACTION_FN = {
    upload: ftp.upload,
    download: ftp.download,
    delete: ftp.deleteFile,
    list: ftp.listFile,
    quit: ftp.destroy,
  };
  const actions = Object.keys(ACTION_FN);

  let answer = await pollingInquire(actions);

  let input = answer.split(' ');
  let args = input.slice(1);
  let action = input[0];

  devLogger.debug('action is: ' + action);
  devLogger.debug('args is: ' + args);

  let fn = ACTION_FN[answer]?.call(ftp, args);

  if (fn && fn instanceof Promise) {
    fn.catch((e) => {}).finally(() => {
      startInquire(ftp);
    });
  }
}

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
  .action(async (initOpts) => {
    const connectOpts = await connectInquiry(initOpts).catch((e) => {
      logger.error(e);
    });

    if (!connectOpts) {
      return;
    }

    logger.info(connectOpts);

    let Constructor = connectOpts.type === 'ftp' ? FTP : SFTP;
    let ftp = new Constructor(connectOpts);
    ftp
      .connect()
      .then(() => {
        startInquire(ftp);
      })
      .catch((e) => {});
  });

program.on('--help', () => {
  logger.info(require('./help.txt'));
});

program.parse(process.argv);
