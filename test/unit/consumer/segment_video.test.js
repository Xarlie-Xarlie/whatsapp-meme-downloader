import assert from "node:assert";
import { describe, it, beforeEach, mock } from "node:test";
import childProcess from "node:child_process";
import fs from "node:fs";
import segmentVideoAtPath from "../../../src/consumer/segment_video.js";

describe('segmentVideoAtPath Unit Tests', () => {
  let childProcessContext;
  let fsContext;

  beforeEach(() => {
    mock.restoreAll();
    childProcessContext = mock.method(childProcess, 'exec');
    fsContext = mock.method(fs, 'existsSync');
  })

  it('should segment a video of 60 seconds into two videos', async () => {
    const filePath = '/path/to/video.mp4';

    childProcessContext.mock.mockImplementation((_command, callback) => {
      callback(null, '60.0', null);
    });

    fsContext.mock.mockImplementation(() => false);

    const results = await segmentVideoAtPath({ filePath });

    assert.deepStrictEqual(results, ["/path/to/video_part_0.mp4", "/path/to/video_part_1.mp4"]);
    assert.strictEqual(childProcess.exec.mock.callCount(), 3);
    assert.strictEqual(fs.existsSync.mock.callCount(), 2);
  });

  it('should segment a video between 60 and 90 seconds into three videos', async () => {
    const filePath = '/path/to/video.mp4';

    childProcessContext.mock.mockImplementation((_command, callback) => {
      callback(null, '75.0', null);
    });

    fsContext.mock.mockImplementation(() => false);

    const results = await segmentVideoAtPath({ filePath });

    assert.deepStrictEqual(results, [
      "/path/to/video_part_0.mp4",
      "/path/to/video_part_1.mp4",
      "/path/to/video_part_2.mp4"
    ]);

    assert.strictEqual(childProcess.exec.mock.callCount(), 4);
    assert.strictEqual(fs.existsSync.mock.callCount(), 3);
  });

  it('should skip segmentation when video has 30 seconds', async () => {
    const filePath = '/path/to/video.mp4';

    childProcessContext.mock.mockImplementation((_command, callback) => {
      callback(null, '30.0', null);
    });

    fsContext.mock.mockImplementation(() => false);

    const results = await segmentVideoAtPath({ filePath });

    assert.deepStrictEqual(results, undefined);
    assert.strictEqual(childProcess.exec.mock.callCount(), 1);
    assert.strictEqual(fs.existsSync.mock.callCount(), 0);
  });

  it('should skip segmentation when video has less than 30 seconds', async () => {
    const filePath = '/path/to/video.mp4';

    childProcessContext.mock.mockImplementation((_command, callback) => {
      callback(null, '29.0', null);
    });

    fsContext.mock.mockImplementation(() => false);

    const results = await segmentVideoAtPath({ filePath });

    assert.deepStrictEqual(results, undefined);
    assert.strictEqual(childProcess.exec.mock.callCount(), 1);
    assert.strictEqual(fs.existsSync.mock.callCount(), 0);
  });

  it('should skip segmentation if they alread exists', async () => {
    const filePath = '/path/to/video.mp4';

    childProcessContext.mock.mockImplementation((_command, callback) => {
      callback(null, '31.0', null);
    });

    fsContext.mock.mockImplementation(() => true);

    const results = await segmentVideoAtPath({ filePath });

    assert.deepStrictEqual(results, []);
    assert.strictEqual(childProcess.exec.mock.callCount(), 1);
    assert.strictEqual(fs.existsSync.mock.callCount(), 2);
  });

  it('should segment the video even if one of their parts alread exists', async () => {
    const filePath = '/path/to/video.mp4';

    childProcessContext.mock.mockImplementation((_command, callback) => {
      callback(null, '31.0', null);
    });

    fsContext.mock.mockImplementationOnce(() => true);
    fsContext.mock.mockImplementation(() => false);

    const results = await segmentVideoAtPath({ filePath });

    assert.deepStrictEqual(results, ["/path/to/video_part_1.mp4"]);
    assert.strictEqual(childProcess.exec.mock.callCount(), 2);
    assert.strictEqual(fs.existsSync.mock.callCount(), 2);
  });

  it('should segment videos that are greater than 30 seconds', async () => {
    const filePath = '/path/to/video.mp4';

    childProcessContext.mock.mockImplementation((_command, callback) => {
      callback(null, '31.0', null);
    });

    fsContext.mock.mockImplementation(() => false);

    const results = await segmentVideoAtPath({ filePath });

    assert.deepStrictEqual(results, ['/path/to/video_part_0.mp4', '/path/to/video_part_1.mp4']);
    assert.strictEqual(childProcess.exec.mock.callCount(), 3);
    assert.strictEqual(fs.existsSync.mock.callCount(), 2);
  });

  it('should return undefined when an error occurs in exec', async () => {
    const filePath = '/path/to/video.mp4';

    childProcessContext.mock.mockImplementation((_command, callback) => {
      callback("testError", '31.0', null);
    });

    fsContext.mock.mockImplementation(() => false);

    const results = await segmentVideoAtPath({ filePath });

    assert.deepStrictEqual(results, undefined);
    assert.strictEqual(childProcess.exec.mock.callCount(), 1);
    assert.strictEqual(fs.existsSync.mock.callCount(), 0);
  });

  it('should return undefined when an error is returned from stderr', async () => {
    const filePath = '/path/to/video.mp4';

    childProcessContext.mock.mockImplementation((_command, callback) => {
      callback(null, '31.0', "test stderr");
    });

    fsContext.mock.mockImplementation(() => false);

    const results = await segmentVideoAtPath({ filePath });

    assert.deepStrictEqual(results, undefined);
    assert.strictEqual(childProcess.exec.mock.callCount(), 1);
    assert.strictEqual(fs.existsSync.mock.callCount(), 0);
  });

  it('should return undefined when an exception occurs in exec', async () => {
    const filePath = '/path/to/video.mp4';

    childProcessContext.mock.mockImplementation(() => { throw "childProcess error test" });

    fsContext.mock.mockImplementation(() => false);

    const results = await segmentVideoAtPath({ filePath });

    assert.deepStrictEqual(results, undefined);
    assert.strictEqual(childProcess.exec.mock.callCount(), 1);
    assert.strictEqual(fs.existsSync.mock.callCount(), 0);
  });

  it('should return undefined when an exception occurs in existsSync', async () => {
    const filePath = '/path/to/video.mp4';

    childProcessContext.mock.mockImplementation((_command, callback) => {
      callback(null, '31.0', null);
    });

    fsContext.mock.mockImplementation(() => { throw "existsSync test error" });

    const results = await segmentVideoAtPath({ filePath });

    assert.deepStrictEqual(results, undefined);
    assert.strictEqual(childProcess.exec.mock.callCount(), 1);
    assert.strictEqual(fs.existsSync.mock.callCount(), 1);
  });
});
