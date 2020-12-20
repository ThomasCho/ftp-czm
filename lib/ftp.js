const path = require('path');
const fs = require('fs');
const Client = require('ftp');
const BaseUploader = require('./base-uploader.js');
const globUtil = require('../util/glob-util.js');
const { logger, devLogger } = require('./logger.js');
const chalk = require('chalk');

class FTP extends BaseUploader {
  constructor(options) {
    super(options);
    this.baseConstructor = Client;
    this.initClient();
  }

  listFile(listPath = []) {
    let displayPath = path.join(this.options.root, listPath[0] || '');
    logger.info(`${displayPath} to be listed`);

    return new Promise((resolve, reject) => {
      this.c.list(displayPath, (err, list) => {
        if (err) {
          devLogger.error(err);
          logger.error('Listing file meets error...');
          reject();
          return;
        }
        logger.info(chalk.yellow(`####### [${displayPath}] on server #######`));
        logger.info(list);
        logger.info(chalk.yellow(`#####################`));
        resolve(list);
      });
    });
  }

  download(files = []) {
    logger.info(`${files} to be downloaded`);

    return Promise.allSettled(
      files.map((file) => {
        return new Promise((resolve, reject) => {
          this.c.get(path.join(this.options.root, file), (err, stream) => {
            if (err) {
              devLogger.error(err);
              logger.error(`Downloading [${file}] meets error... Check if the file exists on server`);
              reject(err);
              return;
            }
            stream.once('close', () => {
              this.onDownloadSuccess(file);
              resolve();
            });
            stream.pipe(fs.createWriteStream(`remote-${file}`));
          });
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
          this.c.delete(path.join(this.options.root, file), (err) => {
            if (err) {
              devLogger.error(err);
              logger.error(`Deleting [${file}] meets error... Check if the file exists on server`);
              reject(err);
              return;
            }
            resolve(file);
            this.onDelSuccess(file);
          });
        });
      })
    );
  }

  upload(files = []) {
    logger.info(`${files} to be uploaded`);
    
    let uploadFiles = globUtil.glob(files);
    this.onUploadStart();

    return Promise.allSettled(
      uploadFiles.map((file, index) => {
        // 如果上传一个不存在的文件，报错，但不影响其他存在文件的继续上传
        if (!file) {
          logger.error(`${files[index]} does not existed, upload failed...`);
          return Promise.reject();
        }

        // 开始上传
        return this._startUpload(file).then(
          () => {
            this.onFileUploaded(file);
          },
          (err) => {
            devLogger.error(err);
            logger.error(`${file} upload failed`);
          }
        );
      })
    ).then((promises) => {
      let len = promises.filter((pro) => pro.status !== 'rejected').length;
      logger.info(`${len} files have been uploaded successfully`);
    });
  }

  _startUpload(filePath) {
    return new Promise((resolve, reject) => {
      let cb = (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(filePath);
      };

      let remotePath = path.join(this.options.root, filePath);

      if (fs.statSync(filePath).isDirectory()) {
        this.c.mkdir(remotePath, true, cb);
        return;
      }

      this.c.put(filePath, remotePath, cb);
    });
  }
}

module.exports = FTP;
