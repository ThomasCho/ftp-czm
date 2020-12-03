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

program.on('--help', () => {
  console.log('');
  console.log('登陆后的具体命令如下：');
  console.log('# 后面跟上传的文件名，可为文件或文件夹，可以为glob通配符，用空格分割 #');
  console.log('- upload 上传命令');
  console.log('- download 下载命令');
  console.log('- delete 删除命令');
  console.log('- list 查看文件列表');
});

program.parse(process.argv);
