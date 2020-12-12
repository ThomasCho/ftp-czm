const inquirer = require('inquirer');
const logger = require('./logger.js');

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
      logger.error(e);
    });
  }

  connect() {
    this.beforeConnect();
    this.c.connect(this.options);
  }

  upload() {
    logger.error('[Method] upload has not been overwrite');
    return Promise.reject();
  }

  listFile() {
    logger.error('[Method] listFile has not been overwrite');
    return Promise.reject();
  }

  download() {
    logger.error('[Method] download has not been overwrite');
    return Promise.reject();
  }

  deleteFile() {
    logger.error('[Method] deleteFile has not been overwrite');
    return Promise.reject();
  }

  beforeConnect() {
    logger.info('ready to connect...');
  }

  onReady() {
    let o = this.options;
    logger.info(`connected to ftp://${o.host}:${o.port}${o.root} successfully`);

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

    logger.debug('action is: ' + action);
    logger.debug('args is: ' + args);

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
    logger.info(`${filename} has been downloaded successfully`);
  }

  onDelSuccess(filename) {
    logger.info(`${filename} has been deleted successfully`);
  }

  // 开始上传前
  onUploadStart() {
    logger.info('Upload is about to start...');
  }

  // 单个文件上传成功
  onFileUploaded(filename) {
    logger.info(`${filename} has been uploaded successfully`);
  }

  // 全部文件都上传完成
  onUploadSuccess() {
    logger.info('All files uploaded.');
  }

  destroy() {
    if (this.c) {
      this.c?.end();
      this.c = null;
    }
  }
}

module.exports = BaseUploader;
