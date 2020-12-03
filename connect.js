// 默认值，如果不输入则使用如下
const inquirer = require('inquirer');

// ftp和sftp的默认配置
let CONFIG = {
  type: 'ftp',
  host: '47.107.157.97',
  port: '21',
  user: 'ftp',
  password: 'Admin@123',
  root: '/czm/',
};
let SFTP_CONFIG = {
  type: 'sftp',
  host: '47.107.157.97',
  port: '22',
  user: 'sftp',
  password: 'Admin@123',
  root: '/czm/',
};
let promps = [];

// 输入项的正则校验值，可自行扩充
const REGEX = {
  host: /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  port: /\d+/,
  user: /\S+/,
};

function connect(option = {}) {
  return new Promise((resolve, reject) => {
    if (!option.type) {
      promps.push({
        type: 'input',
        name: 'type',
        message: `请输入连接FTP的类型：(${CONFIG.type}、${SFTP_CONFIG.type})`,
        validate: function (input) {
          if (input && ![CONFIG.type, SFTP_CONFIG.type].includes(input)) {
            return `请输入如 ${CONFIG.type}、${SFTP_CONFIG.type} 的FTP类型`;
          }

          return true;
        },
      });
    }

    if (!option.host) {
      promps.push({
        type: 'input',
        name: 'host',
        message: `请输入FTP服务器地址：(${CONFIG.host})`,
        validate: function (input) {
          if (input && !REGEX.host.exec(input)) {
            return `请输入如 ${CONFIG.host} 格式的FTP服务器地址`;
          }

          return true;
        },
      });
    }

    if (!option.port) {
      promps.push({
        type: 'input',
        name: 'port',
        message: `请输入FTP服务器端口：(${CONFIG.port})`,
        validate: function (input) {
          if (input && !REGEX.port.exec(input)) {
            return `请输入如 ${CONFIG.port} 格式的FTP服务器端口`;
          }

          return true;
        },
      });
    }

    if (!option.user) {
      promps.push({
        type: 'input',
        name: 'user',
        message: `请输入登入用户名：(${CONFIG.user})`,
        validate: function (input) {
          if (input && !REGEX.user.exec(input)) {
            return `请输入如 ${CONFIG.user} 格式的FTP服务器端口`;
          }

          return true;
        },
      });
    }

    if (!option.password) {
      // 密码可以为空
      promps.push({
        type: 'input',
        name: 'password',
        message: '请输入登陆密码：',
      });
    }

    inquirer.prompt(promps).then(function (answers) {
      // 合并数据 & 校验
      // 首先要确定好最终选中的FTP类型，好决定用哪套默认值
      answers.type = option.type || answers.type || CONFIG.type;
      let defaultConfig = answers.type === CONFIG.type ? CONFIG : SFTP_CONFIG;

      Object.keys(defaultConfig).forEach((key) => {
        // 以用户调用命令行时配置的参数最优先，其次问答式的键入，最后才用默认值
        answers[key] = option[key] || answers[key] || defaultConfig[key];
        if (REGEX[key] && !REGEX[key].exec(answers[key])) {
          reject(`${key}(${answers[key]}) 输入有误...请重启服务`);
          return;
        }
      });

      resolve(answers);
    });
  });
}

module.exports = connect;
