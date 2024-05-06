import assert from "node:assert";
import { describe, it, beforeEach, mock } from "node:test";
import fs from "node:fs";
import path from "node:path";
import MessageMedia from 'whatsapp-web.js/src/structures/MessageMedia.js';
import createVideoMedia from '../../../src/bot/create_video_media.js';

describe('createVideoMedia Unit Tests', () => {
  let fsContext;
  let pathContext;

  beforeEach(() => {
    mock.restoreAll();
    fsContext = mock.method(fs, 'readFileSync');
    pathContext = mock.method(path, 'basename');
  })

  it('should create a MessageMedia object for a video file', () => {
    const filePath = '/path/to/video.mp4';

    fsContext.mock.mockImplementation(() => 'AAAAIGZ0eXBpc29');
    pathContext.mock.mockImplementation(() => 'video.mp4');

    const result = createVideoMedia(filePath);

    assert.ok(result instanceof MessageMedia);

    assert.strictEqual(fs.readFileSync.mock.callCount(), 1);
    assert.strictEqual(path.basename.mock.callCount(), 1);
    assert.strictEqual(result.mimetype, 'video');
    assert.strictEqual(result.filename, 'video.mp4');
    assert.strictEqual(result.filesize, 11);
  });

  it('should throws exceptions when cannot read the file', () => {
    const filePath = '/path/to/video.mp4';

    fsContext.mock.mockImplementation(() => { throw 'file read error' });
    pathContext.mock.mockImplementation(() => 'video.mp4');

    assert.throws(() => createVideoMedia(filePath), /file read error/);
    assert.strictEqual(fs.readFileSync.mock.callCount(), 1);
    assert.strictEqual(path.basename.mock.callCount(), 1);
  });
});
