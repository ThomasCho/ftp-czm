const ftp = require('ftp');
const FTP = require('../ftp.js');

jest.mock('ftp', () => {
  return jest.fn(() => ({
    connect: jest.fn(() => Promise),
    delete: jest.fn((path, cb) => {
      cb && cb();
    }),
    put: jest.fn((file, remoteFile, cb) => {
      cb && cb();
    }),
    list: jest.fn((path, cb) => {
      cb && cb(null, ['a.png', 'b.png']);
    }),
    get: jest.fn((path, cb) => {
      cb && cb();
    }),
    on: jest.fn((arg, cb) => {
      if (arg === 'ready' && cb) {
        cb();
      }
    }),
    end: jest.fn()
  }));
});

beforeEach(() => {
  ftp.mockClear();
});

let opt = {
  host: '47.107.157.97',
  port: '21',
  user: 'ftp',
  password: 'Admin@123',
  root: '/czm/',
};

describe('ftp test', () => {
  test('测试连接', async () => {
    const ftpClient = new FTP(opt);
    const options = await ftpClient.connect();
    ftpClient.destroy();
    expect(options).toEqual(opt);
  });

  test('列举文件', async () => {
    const ftpClient = new FTP(opt);
    await ftpClient.connect();

    const files = await ftpClient.listFile();
    expect(files).toBeInstanceOf(Array);
  });

  test('删除文件', async () => {
    let testFiles = ['a', 'b'];

    const ftpClient = new FTP(opt);
    await ftpClient.connect();

    let files = await ftpClient.deleteFile(testFiles);
    files = files.map(file => file.value);
    expect(files).toEqual(testFiles);
  });

  // test('上传文件', async () => {
  //   let testFiles = ['cat.png', 'coffee.png'];

  //   const ftpClient = new FTP(opt);
  //   await ftpClient.connect();

  //   let files = await ftpClient.upload(testFiles);
  //   files = files.map(file => file.value);

  //   console.log(files);
  //   expect(files).toEqual(testFiles);
  // });

  // test('下载文件', async () => {
  //   let testFiles = ['cat.png', 'coffee.png'];

  //   const ftpClient = new FTP(opt);
  //   await ftpClient.connect();

  //   let files = await ftpClient.download(testFiles);
  //   files = files.map(file => file.value);

  //   console.log(files);
  //   expect(files).toEqual(testFiles);
  // });
});