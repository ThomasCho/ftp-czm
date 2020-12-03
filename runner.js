const FTP = require('./ftp.js');
const SFTP = require('./sftp.js');

async function runAction(options) {
  console.log(options);

  let Constructor = options.type === 'ftp' ? FTP : SFTP;

  let app = new Constructor(options);
  await app.connect();
}

module.exports = runAction;
