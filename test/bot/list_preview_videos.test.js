import listPreviewVideos from '../../src/bot/list_preview_videos.js';
import { describe, it, mock } from "node:test";
import assert from "node:assert";

describe('listPreviewVideos', () => {
  it('should list compressed mp4 files in the directory', () => {
    const directoryPath = '/path/to/directory/';
    const mockFiles = ['video1_compressed.mp4', 'video2.mp4', 'video3_compressed.mp4'];

    // Mock readdirSync to return mockFiles
    const readdirSync = mock.fn(_path => {
      return mockFiles;
    });

    const result = listPreviewVideos(directoryPath, readdirSync);

    const expectedFiles = [
      '/path/to/directory/video1_compressed.mp4',
      '/path/to/directory/video3_compressed.mp4',
    ];

    assert.strictEqual(readdirSync.mock.callCount(), 1);
    assert.deepEqual(expectedFiles, result);
  });

  it('should return an empty array if no compressed mp4 files are found', () => {
    const directoryPath = '/path/to/directory';
    const mockFiles = ['video1.mp4', 'video2.mp4', 'video3.mov'];

    // Mock readdirSync to return mockFiles
    const readdirSync = mock.fn(_path => {
      return mockFiles;
    })

    const result = listPreviewVideos(directoryPath, readdirSync);

    assert.deepEqual(result, []);
    assert(readdirSync.mock.callCount(), 1);
  });

  it('should return an empty array if an error occurs during file reading', () => {
    const directoryPath = '/path/to/directory';

    // Mock readdirSync to throw an error
    const readdirSync = mock.fn(_path => {
      throw new Error('Test error');
    })

    const result = listPreviewVideos(directoryPath, readdirSync);

    assert.deepEqual(result, []);
    assert(readdirSync.mock.callCount(), 1);
  });
});
