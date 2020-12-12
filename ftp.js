const path = require('path');
const fs = require('fs');
const Client = require('ftp');
const BaseUploader = require('./base-uploader.js');
const chalk = require('chalk');
const globUtil = require('./glob-util.js');

class FTP extends BaseUploader {
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
      this.c.list(this.options.root, (err, list) => {
        if (err) {
          this.onError(err);
          reject();
          return;
        }
        console.dir(list);
        resolve();
      });
    });
  }

  download(files = []) {
    return Promise.allSettled(
      files.map((file) => {
        return new Promise((resolve, reject) => {
          this.c.get(path.join(this.options.root, file), (err, stream) => {
            if (err) {
              this.onError(err);
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
        this.log(chalk.green(`${len} files have been downloaded successfully`));
      })
      .catch((e) => {
        this.destroy();
      });
  }

  deleteFile(files = []) {
    return Promise.allSettled(
      files.map((file) => {
        return new Promise((resolve, reject) => {
          this.c.delete(path.join(this.options.root, file), (err) => {
            if (err) {
              this.onError(err);
              reject(err);
              return;
            }
            resolve();
            this.onDelSuccess(file);
          });
        });
      })
    );
  }

  upload(files = []) {
    let uploadFiles = globUtil.glob(files);
    this.onUploadStart();

    return Promise.allSettled(
      uploadFiles.map((file, index) => {
        // 如果上传一个不存在的文件，报错，但不影响其他存在文件的继续上传
        if (!file) {
          this.onError(`${files[index]} does not existed, upload failed...`);
          return Promise.reject();
        }

        // 开始上传
        return this._startUpload(file).then(
          () => {
            this.onFileUploaded(file);
          },
          (err) => {
            this.onError(err);
          }
        );
      })
    ).then((pros) => {
      // 如果全部上传文件都上传失败了，则不打印总结信息
      if (pros.every((pro) => pro.status === 'rejected')) {
        return;
      }
      this.onUploadSuccess();
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
