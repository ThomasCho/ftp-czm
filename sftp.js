const path = require('path');
const fs = require('fs');
const Client = require('ssh2-sftp-client');
const BaseUploader = require('./base-uploader.js');
const globUtil = require('./glob-util.js');
const logger = require('./logger.js');

class SFTP extends BaseUploader {
  constructor(options) {
    let opt = Object.assign(
      {
        baseConstructor: Client,
      },
      options
    );
    super(opt);
  }

  listFile() {
    return new Promise((resolve, reject) => {
      this.c.list(this.options.root).then(
        (data) => {
          console.dir(data);
          resolve();
        },
        (err) => {
          logger.error(err);
          reject();
        }
      );
    });
  }

  download(files = []) {
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
              logger.error(err);
              reject(err);
            }
          );
        });
      })
    )
      .then((promises) => {
        let len = promises.filter((pro) => pro.status !== 'rejected').length;
        logger.info(`${len} files have been downloaded successfully`);
      })
      .catch((e) => {
        this.destroy();
      });
  }

  deleteFile(files = []) {
    return Promise.allSettled(
      files.map((file) => {
        return new Promise((resolve, reject) => {
          this.c.delete(path.join(this.options.root, file)).then(
            () => {
              this.onDelSuccess(file);
              resolve();
            },
            (err) => {
              logger.error(err);
              reject(err);
            }
          );
        });
      })
    );
  }

  async upload(files = []) {
    let uploadFiles = globUtil.glob(files);
    this.onUploadStart();

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
          },
          (err) => {
            logger.error(err);
          }
        );
      }
    }

    this.onUploadSuccess();
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
