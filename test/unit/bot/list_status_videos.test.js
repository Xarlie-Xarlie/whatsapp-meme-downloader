import listStatusVideos from '../../../src/bot/list_status_videos.js';
import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert";
import fs from "node:fs";

describe('listStatusVideos Unit Tests', () => {
  let context;

  beforeEach(() => {
    mock.restoreAll();
    context = mock.method(fs, 'readdirSync');
  });

  it('should list mp4 files in the directory', () => {
    const directoryPath = '/path/to/directory/';
    const mockFiles = ['video1.mp4', 'video2.mp4', 'video3.mp4'];

    // Mock readdirSync to return mockFiles
    context.mock.mockImplementation(() => mockFiles);

    const result = listStatusVideos(directoryPath);

    const expectedFiles = [
      '/path/to/directory/video1.mp4',
      '/path/to/directory/video2.mp4',
      '/path/to/directory/video3.mp4',
    ];

    assert.strictEqual(fs.readdirSync.mock.callCount(), 1);
    assert.deepEqual(expectedFiles, result);
  });

  it('should return only the segmented files over the original ones', () => {
    const directoryPath = '/path/to/directory/';
    const mockFiles = ['video1.mp4', 'video1_part_0.mp4', 'video1_part_1.mp4'];

    // Mock readdirSync to return mockFiles
    context.mock.mockImplementation(() => mockFiles);

    const result = listStatusVideos(directoryPath);

    const expectedFiles = [
      '/path/to/directory/video1_part_0.mp4',
      '/path/to/directory/video1_part_1.mp4'
    ];

    assert.deepEqual(result, expectedFiles);
    assert.strictEqual(fs.readdirSync.mock.callCount(), 1);
  });

  it("should return the segmented files over the original, but keep those who aren't semented", () => {
    const directoryPath = '/path/to/directory/';
    const mockFiles = ['video1.mp4', 'video2.mp4', 'video2_part_0.mp4', 'video2_part_1.mp4'];

    // Mock readdirSync to throw an error
    context.mock.mockImplementation(() => mockFiles);

    const result = listStatusVideos(directoryPath);

    const expectedFiles = [
      '/path/to/directory/video1.mp4',
      '/path/to/directory/video2_part_0.mp4',
      '/path/to/directory/video2_part_1.mp4'
    ];

    assert.deepEqual(result, expectedFiles);
    assert.strictEqual(fs.readdirSync.mock.callCount(), 1);
  });

  it("should return the segmented files in order", () => {
    const directoryPath = '/path/to/directory/';
    const mockFiles = ['video1_part_2.mp4', 'video1_part_1.mp4', 'video1_part_0.mp4'];

    // Mock readdirSync to throw an error
    context.mock.mockImplementation(() => mockFiles);

    const result = listStatusVideos(directoryPath);

    const expectedFiles = [
      '/path/to/directory/video1_part_0.mp4',
      '/path/to/directory/video1_part_1.mp4',
      '/path/to/directory/video1_part_2.mp4'
    ];

    assert.deepEqual(result, expectedFiles);
    assert.strictEqual(fs.readdirSync.mock.callCount(), 1);
  });

  it("should return the segmented files in order per video", () => {
    const directoryPath = '/path/to/directory/';
    const mockFiles = ['video1_part_1.mp4', 'video1_part_0.mp4', 'video2_part_1.mp4', 'video2_part_0.mp4'];

    // Mock readdirSync to throw an error
    context.mock.mockImplementation(() => mockFiles);

    const result = listStatusVideos(directoryPath);

    const expectedFiles = [
      '/path/to/directory/video1_part_0.mp4',
      '/path/to/directory/video1_part_1.mp4',
      '/path/to/directory/video2_part_0.mp4',
      '/path/to/directory/video2_part_1.mp4'
    ];

    assert.deepEqual(result, expectedFiles);
    assert.strictEqual(fs.readdirSync.mock.callCount(), 1);
  });


  it("should not return compressed files", () => {
    const directoryPath = '/path/to/directory/';
    const mockFiles = ['video1.mp4', 'video2_part_1.mp4', 'video2_part_0.mp4', 'video1_compressed.mp4'];

    // Mock readdirSync to throw an error
    context.mock.mockImplementation(() => mockFiles);

    const result = listStatusVideos(directoryPath);

    const expectedFiles = [
      '/path/to/directory/video1.mp4',
      '/path/to/directory/video2_part_0.mp4',
      '/path/to/directory/video2_part_1.mp4'
    ];

    assert.deepEqual(result, expectedFiles);
    assert.strictEqual(fs.readdirSync.mock.callCount(), 1);
  });

  it('should return an empty array if an error occurs during file reading', () => {
    const directoryPath = '/path/to/directory/';

    // Mock readdirSync to throw an error
    context.mock.mockImplementation(() => new Error('Test error'));

    const result = listStatusVideos(directoryPath);

    assert.deepEqual(result, []);
    assert.strictEqual(fs.readdirSync.mock.callCount(), 1);
  });
});
