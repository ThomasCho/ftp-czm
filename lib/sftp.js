const path = require('path');
const fs = require('fs');
const Client = require('ssh2-sftp-client');
const BaseUploader = require('./base-uploader.js');
const globUtil = require('../util/glob-util.js');
const { logger, devLogger } = require('./logger.js');
const chalk = require('chalk');

class SFTP extends BaseUploader {
  constructor(options) {
    super(options);
    this.baseConstructor = Client;
    this.initClient();
  }

  listFile(listPath = []) {
    let displayPath = path.join(this.options.root, listPath[0] || '');
    logger.info(`${displayPath} to be listed`);

    return new Promise((resolve, reject) => {
      this.c.list(displayPath).then(
        (data) => {
          logger.info(chalk.yellow(`####### [${displayPath}] on server #######`));
          logger.info(data);
          logger.info(chalk.yellow(`#####################`));
          resolve(data);
        },
        (err) => {
          devLogger.error(err);
          logger.error('Listing file meets error...');
          reject();
        }
      );
    });
  }

  download(files = []) {
    logger.info(`${files} to be downloaded`);

    return Promise.allSettled(
      files.map((file) => {
        return new Promise((resolve, reject) => {
          this.c.get(path.join(this.options.root, file)).then(
            (buffer) => {
              fs.writeFileSync(`remote-${file}`, buffer);
              this.onDownloadSuccess(file);
              resolve();
            },
            (err) => {
              devLogger.error(err);
              logger.error(`Downloading [${file}] meets error... Check if the file exists on server`);
              reject(err);
            }
          );
        });
      })
    )
      .then((promises) => {
        let len = promises.filter((pro) => pro.status !== 'rejected').length;
        logger.info(`${len} files have been downloaded successfully`);
      });
  }

  deleteFile(files = []) {
    logger.info(`${files} to be deleted`);

    return Promise.allSettled(
      files.map((file) => {
        return new Promise((resolve, reject) => {
          this.c.delete(path.join(this.options.root, file)).then(
            () => {
              this.onDelSuccess(file);
              resolve();
            },
            (err) => {
              devLogger.error(err);
              logger.error(`Deleting [${file}] meets error... Check if the file exists on server`);
              reject(err);
            }
          );
        });
      })
    );
  }

  async upload(files = []) {
    logger.info(`${files} to be uploaded`);

    let uploadFiles = globUtil.glob(files);
    this.onUploadStart();

    let successTimes = 0;

    for (let file of uploadFiles) {
      // 如果上传一个不存在的文件，报错，但不影响其他存在文件的继续上传
      if (!file) {
        logger.error(
          `${
            files[uploadFiles.indexOf(file)]
          } does not existed, upload failed...`
        );
      } else {
        await this._startUpload(file).then(
          () => {
            this.onFileUploaded(file);
            successTimes++;
          },
          (err) => {
            devLogger.error(err);
            logger.error(`${file} upload failed`);
          }
        );
      }
    }

    logger.info(`${successTimes} files have been uploaded successfully`);
    return Promise.resolve();
  }

  _startUpload(filePath) {
    return new Promise((resolve, reject) => {
      let remotePath = path.posix.join(this.options.root, filePath);
      if (fs.statSync(filePath).isDirectory()) {
        this.c.mkdir(remotePath, true).then(
          () => {
            resolve(filePath);
          },
          (err) => {
            reject(err);
          }
        );
        return;
      }

      this.c.put(filePath, remotePath).then(
        () => {
          resolve(filePath);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }
}

module.exports = SFTP;
