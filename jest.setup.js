/**
 * Jest Setup File
 * Runs before each test suite
 */

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};

global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Mock Web Crypto API
global.crypto = {
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  subtle: {
    digest: jest.fn(async () => new ArrayBuffer(32)),
    importKey: jest.fn(async () => ({})),
    deriveKey: jest.fn(async () => ({})),
    encrypt: jest.fn(async (algorithm, key, data) => data),
    decrypt: jest.fn(async (algorithm, key, data) => data)
  }
};

// Mock File and Blob
global.File = class File extends Blob {
  constructor(bits, name, options = {}) {
    super(bits, options);
    this.name = name;
    this.lastModified = options.lastModified || Date.now();
  }
};

// Mock FileReader
global.FileReader = class FileReader {
  readAsArrayBuffer(file) {
    setTimeout(() => {
      this.result = new ArrayBuffer(8);
      if (this.onload) this.onload({ target: this });
    }, 10);
  }

  readAsDataURL(file) {
    setTimeout(() => {
      this.result = 'data:text/plain;base64,dGVzdA==';
      if (this.onload) this.onload({ target: this });
    }, 10);
  }

  readAsText(file) {
    setTimeout(() => {
      this.result = 'test content';
      if (this.onload) this.onload({ target: this });
    }, 10);
  }
};

// Mock Worker
global.Worker = class Worker {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
  }

  postMessage(data) {
    // Mock worker response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({
          data: {
            id: data.id,
            success: true,
            result: { text: 'Mocked result' }
          }
        });
      }
    }, 10);
  }

  terminate() {
    // No-op
  }

  addEventListener(event, handler) {
    if (event === 'message') {
      this.onmessage = handler;
    }
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock performance.now
global.performance = {
  now: jest.fn(() => Date.now())
};

// Reset all mocks before each test
beforeEach(() => {
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  localStorageMock.length = 0;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllTimers();
});

