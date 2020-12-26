const ftp = require('ftp');
const FTP = require('../lib/ftp.js');
const BaseUploader = require('../lib/base-uploader.js');

let opt = {
  host: '47.107.157.97',
  port: '21',
  user: 'ftp',
  password: 'Admin@123',
  root: '/czm/',
};

jest.mock('ftp', () => {
  return jest.fn(() => ({
    connect: jest.fn(() => Promise),
    delete: jest.fn((path, cb) => {
      if (path === (opt.root + 'error')) {
        return cb && cb('error');
      }
      cb && cb();
    }),
    put: jest.fn((file, remoteFile, cb) => {
      // 假设上传 error.png 会上传失败
      if (file === 'error.png') {
        return cb && cb('error');
      }
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

describe('Suite：接口缺失', () => {
  test('[Constructor] 构造器未传递', async () => {
    class FakeFTP extends BaseUploader {
      constructor(options) {
        super(options);
        expect(() => {
          this.initClient();
        }).toThrowError('not overwritten');
      }
    }
  });

  test('[Method] upload 未被复写', async () => {
    class FakeFTP extends BaseUploader {
      constructor(options) {
        super(options);
        this.baseConstructor = ftp;
        this.initClient();
      }
    }

    const ftpClient = new FakeFTP(opt);
    await ftpClient.connect();

    expect(() => {
      ftpClient.upload('xxx');
    }).toThrowError('not overwritten');
  });

  test('[Method] listFile 未被复写', async () => {
    class FakeFTP extends BaseUploader {
      constructor(options) {
        super(options);
        this.baseConstructor = ftp;
        this.initClient();
      }
    }

    const ftpClient = new FakeFTP(opt);
    await ftpClient.connect();

    expect(() => {
      ftpClient.listFile();
    }).toThrowError('not overwritten');
  });

  test('[Method] download 未被复写', async () => {
    class FakeFTP extends BaseUploader {
      constructor(options) {
        super(options);
        this.baseConstructor = ftp;
        this.initClient();
      }
    }

    const ftpClient = new FakeFTP(opt);
    await ftpClient.connect();

    expect(() => {
      ftpClient.download('xxx');
    }).toThrowError('not overwritten');
  });

  test('[Method] deleteFile 未被复写', async () => {
    class FakeFTP extends BaseUploader {
      constructor(options) {
        super(options);
        this.baseConstructor = ftp;
        this.initClient();
      }
    }

    const ftpClient = new FakeFTP(opt);
    await ftpClient.connect();

    expect(() => {
      ftpClient.deleteFile('xxx');
    }).toThrowError('not overwritten');
  });
});

describe('Suite：测试连接', () => {
  test('测试连接', async () => {
    const ftpClient = new FTP(opt);
    const options = await ftpClient.connect();
    ftpClient.destroy();
    expect(options).toEqual(opt);
  });
});

describe('Suite：列举文件', () => {
  test('列举文件', async () => {
    const ftpClient = new FTP(opt);
    await ftpClient.connect();

    const files = await ftpClient.listFile();
    expect(files).toBeInstanceOf(Array);
  });

  test('列举文件，带路径', async () => {
    let path = '/imgs';

    const ftpClient = new FTP(opt);
    await ftpClient.connect();

    const files = await ftpClient.listFile(path);
    expect(files).toBeInstanceOf(Array);
  });
});

describe('Suite：删除功能', () => {
  test('删除文件（单文件）', async () => {
    let testFiles = ['a'];

    const ftpClient = new FTP(opt);
    await ftpClient.connect();

    let files = await ftpClient.deleteFile(testFiles);
    files = files.map(file => file.value);
    expect(files).toEqual(testFiles);
  });

  test('删除文件（多文件）', async () => {
    let testFiles = ['a', 'b'];

    const ftpClient = new FTP(opt);
    await ftpClient.connect();

    let files = await ftpClient.deleteFile(testFiles);
    files = files.map(file => file.value);
    expect(files).toEqual(testFiles);
  });

  test('删除文件（失败）', async () => {
    let testFiles = ['error'];

    const ftpClient = new FTP(opt);
    await ftpClient.connect();

    let files = await ftpClient.deleteFile(testFiles);
    files = files.map(file => file.reason);
    expect(files).toEqual(testFiles);
  });
});

describe('Suite：上传功能', () => {
  test('上传文件（单文件）', async () => {
    let testFiles = ['cat.png'];

    const ftpClient = new FTP(opt);
    await ftpClient.connect();

    let files = await ftpClient.upload(testFiles);

    files = files
      .filter(pro => pro.status === 'fulfilled')
      .map(pro => pro.value);

    expect(files).toEqual(testFiles);
  });

  test('上传文件（多文件）', async () => {
    let testFiles = ['cat.png', 'coffee.png'];

    const ftpClient = new FTP(opt);
    await ftpClient.connect();

    let files = await ftpClient.upload(testFiles);

    files = files
      .filter(pro => pro.status === 'fulfilled')
      .map(pro => pro.value);

    expect(files).toEqual(testFiles);
  });

  test('上传文件（失败：文件不存在）', async () => {
    let testFiles = ['fake-file.png'];

    const ftpClient = new FTP(opt);
    await ftpClient.connect();

    let files = await ftpClient.upload(testFiles);

    files = files
      .filter(pro => pro.status === 'rejected')
      .map(pro => pro.reason);

    expect(files).toEqual(['file not existed']);
  });


  test('上传文件（失败：文件存在，但上传失败）', async () => {
    let testFiles = ['error.png'];

    const ftpClient = new FTP(opt);
    await ftpClient.connect();

    let files = await ftpClient.upload(testFiles);

    files = files
      .filter(pro => pro.status === 'rejected')
      .map(pro => pro.reason);

    expect(files).toEqual(['error']);
  });
});