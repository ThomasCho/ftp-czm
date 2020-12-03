#! /usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const runner = require('./runner.js');
const connect = require('./connect.js');

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
      (config) => {
        runner(config);
      },
      (e) => {
        console.error(chalk.red(e));
      }
    );
  });

program.parse(process.argv);
