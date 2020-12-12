const chalk = require('chalk');
const inquirer = require('inquirer');
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

// ftp 和 sftp 的超类
class BaseUploader {
  constructor(options) {
    this.initOpts(options);
    this.initClient();
    this.connect();
  }

  initOpts(options) {
    this.baseConstructor = options.baseConstructor;
    this.options = {
      host: options.host,
      port: options.port,
      user: options.user,
      password: options.password,
      root: options.root,
    };
  }

  initClient() {
    this.c = new this.baseConstructor();

    this.c.on('ready', () => {
      this.onReady();
    });

    this.c.on('error', (e) => {
      this.onError(e);
    });
  }

  connect() {
    this.beforeConnect();
    this.c.connect(this.options);
  }

  upload() {
    this.onError('[Method] upload has not been overwrite');
    return Promise.reject();
  }

  listFile() {
    this.onError('[Method] listFile has not been overwrite');
    return Promise.reject();
  }

  download() {
    this.onError('[Method] download has not been overwrite');
    return Promise.reject();
  }

  deleteFile() {
    this.onError('[Method] deleteFile has not been overwrite');
    return Promise.reject();
  }

  log(val) {
    logger.debug(val);
  }

  beforeConnect() {
    this.log(chalk.blue('ready to connect...'));
  }

  onReady() {
    let o = this.options;
    this.log(
      chalk.blue(`connected to ftp://${o.host}:${o.port}${o.root} successfully`)
    );

    this.pollingInquire();
  }

  pollingInquire() {
    const ACTION = ['upload', 'download', 'delete', 'list', 'quit'];

    inquirer
      .prompt({
        type: 'input',
        name: 'action',
        message: `请问有什么可以帮到你？（${ACTION.join(', ')}）`,
        validate: function (input) {
          if (!ACTION.includes(input.split(' ')[0])) {
            return `请输入如 ${ACTION.join(', ')} 的命令`;
          }

          return true;
        },
      })
      .then(({ action }) => {
        this.dealWithAnswers(action);
      });
  }

  dealWithAnswers(action) {
    let input = action.split(' ');
    let args = input.slice(1);
    action = input[0];

    // TODO: 调试所用，不喜欢可以去掉
    this.log('action is: ' + action);
    this.log('args is: ' + args);

    const ACTION_FN = {
      upload: this.upload,
      download: this.download,
      delete: this.deleteFile,
      list: this.listFile,
      quit: this.destroy,
    };

    let fn = ACTION_FN[action].call(this, args);

    if (fn && fn instanceof Promise) {
      fn.catch((e) => {}).finally(() => {
        this.pollingInquire();
      });
    }
  }

  onDownloadSuccess(filename) {
    this.log(chalk.yellow(`${filename} has been downloaded successfully`));
  }

  onDelSuccess(filename) {
    this.log(chalk.yellow(`${filename} has been deleted successfully`));
  }

  onError(e) {
    this.log(chalk.red(new Error(e)));
  }

  // 开始上传前
  onUploadStart() {
    this.log(chalk.blue('Upload is about to start...'));
  }

  // 单个文件上传成功
  onFileUploaded(filename) {
    this.log(chalk.yellow(`${filename} has been uploaded successfully`));
  }

  // 全部文件都上传完成
  onUploadSuccess() {
    this.log(chalk.blue('All files uploaded.'));
  }

  destroy() {
    if (this.c) {
      this.c?.end();
      this.c = null;
    }
  }
}

module.exports = BaseUploader;
