import listPreviewVideos from '../../../src/bot/list_preview_videos.js';
import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert";
import fs from "node:fs";

describe('listPreviewVideos', () => {
  let context;

  beforeEach(() => {
    mock.restoreAll();
    context = mock.method(fs, 'readdirSync');
  });

  it('should list compressed mp4 files in the directory', () => {
    const directoryPath = '/path/to/directory/';
    const mockFiles = ['video1_compressed.mp4', 'video2.mp4', 'video3_compressed.mp4'];

    // Mock readdirSync to return mockFiles
    context.mock.mockImplementation(() => mockFiles);

    const result = listPreviewVideos(directoryPath);

    const expectedFiles = [
      '/path/to/directory/video1_compressed.mp4',
      '/path/to/directory/video3_compressed.mp4',
    ];

    assert.strictEqual(fs.readdirSync.mock.callCount(), 1);
    assert.deepEqual(expectedFiles, result);
  });

  it('should return an empty array if no compressed mp4 files are found', () => {
    const directoryPath = '/path/to/directory';
    const mockFiles = ['video1.mp4', 'video2.mp4', 'video3.mp4'];

    // Mock readdirSync to return mockFiles
    context.mock.mockImplementation(() => mockFiles);

    const result = listPreviewVideos(directoryPath);

    assert.deepEqual(result, []);
    assert.strictEqual(fs.readdirSync.mock.callCount(), 1);
  });

  it('should return an empty array if an error occurs during file reading', () => {
    const directoryPath = '/path/to/directory';

    // Mock readdirSync to throw an error
    context.mock.mockImplementation(() => new Error('Test error'));

    const result = listPreviewVideos(directoryPath);

    assert.deepEqual(result, []);
    assert.strictEqual(fs.readdirSync.mock.callCount(), 1);
  });
});
