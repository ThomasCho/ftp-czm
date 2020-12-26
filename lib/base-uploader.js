const { logger } = require('./logger.js');

// ftp 和 sftp 的超类
class BaseUploader {
  constructor(options) {
    this.initOpts(options);
  }

  initOpts(options) {
    this.options = {
      host: options.host,
      port: options.port,
      user: options.user,
      password: options.password,
      root: options.root,
    };
  }

  initClient() {
    if (!this.baseConstructor) {
      logger.error('[Method] Initialization got no constructor');
      throw new Error('not overwritten');
    }

    this.c = new this.baseConstructor();
  }

  connect() {
    if (!this.c) {
      logger.error('[Method] Client has not been initialized. Can not connect.');
      return;
    }
    
    this.beforeConnect();

    return new Promise((resolve, reject) => {
      this.c.on('ready', () => {
        this.onReady();
        resolve(this.options);
      });

      this.c.on('error', (e) => {
        logger.error(e);
        reject(e);
      });

      this.c.connect(this.options);
    });
  }

  upload() {
    logger.error('[Method] upload has not been overwrite');
    throw new Error('not overwritten');
  }

  listFile() {
    logger.error('[Method] listFile has not been overwrite');
    throw new Error('not overwritten');
  }

  download() {
    logger.error('[Method] download has not been overwrite');
    throw new Error('not overwritten');
  }

  deleteFile() {
    logger.error('[Method] deleteFile has not been overwrite');
    throw new Error('not overwritten');
  }

  beforeConnect() {
    logger.info('ready to connect...');
  }

  onReady() {
    let o = this.options;
    logger.info(`connected to ftp://${o.host}:${o.port}${o.root} successfully`);
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

  destroy() {
    logger.info('you are logging out the FTP service...');
    if (this.c) {
      this.c?.end();
      this.c = null;
    }
  }
}

module.exports = BaseUploader;
