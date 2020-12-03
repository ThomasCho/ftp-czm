const chalk = require('chalk');
const inquirer = require('inquirer');

// ftp 和 sftp 的超类
class BaseUploader {
  constructor(options) {
    this.options = options;
  }

  connect() {
    throw new Error('[Method] connect has not been overwrite');
  }

  upload() {
    throw new Error('[Method] upload has not been overwrite');
  }

  onReady() {
    let o = this.options;
    console.log(
      chalk.blue(`connect to ftp://${o.host}:${o.port}${o.root} successfully`)
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
        let input = action.split(' ');
        let args = input.slice(1);
        action = input[0];

        // TODO: 调试所用，不喜欢可以去掉
        console.log('action is: ' + action);
        console.log('args is: ' + args);

        switch (action) {
          case 'upload':
            this.upload(args)
              .catch((e) => {})
              .finally(() => {
                this.pollingInquire();
              });
            break;

          case 'download':
            this.download(args)
              .catch((e) => {})
              .finally(() => {
                this.pollingInquire();
              });
            break;

          case 'delete':
            this.deleteFile(args)
              .catch((e) => {})
              .finally(() => {
                this.pollingInquire();
              });
            break;

          case 'list':
            this.listFile()
              .catch((e) => {})
              .finally(() => {
                this.pollingInquire();
              });
            break;

          case 'quit':
            this.destroy();
            break;
        }
      });
  }

  onDownloadSuccess(filename) {
    console.log(chalk.yellow(`${filename} has been downloaded successfully`));
  }

  onDelSuccess(filename) {
    console.log(chalk.yellow(`${filename} has been deleted successfully`));
  }

  onError(e) {
    console.log(chalk.red(new Error(e)));
  }

  // 开始上传前
  onUploadStart() {
    console.log(chalk.blue('Upload is about to start...'));
  }

  // 单个文件上传成功
  onFileUploaded(filename) {
    console.log(chalk.yellow(`${filename} has been uploaded successfully`));
  }

  // 全部文件都上传完成
  onUploadSuccess() {
    console.log(chalk.blue('All files uploaded.'));
  }

  destroy() {
    if (this.c) {
      this.c?.end();
      this.c = null;
    }
  }
}

module.exports = BaseUploader;
