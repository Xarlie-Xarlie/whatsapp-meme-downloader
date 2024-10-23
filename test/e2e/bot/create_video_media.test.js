import assert from 'node:assert';
import { describe, it } from 'node:test';
import path from 'node:path';
import { statSync } from 'node:fs';
import MessageMedia from 'whatsapp-web.js/src/structures/MessageMedia.js';
import createVideoMedia from '../../../src/bot/create_video_media.js';

function resolveFixturePath(relativePath) {
  const testFileDir = path.dirname(new URL(import.meta.url).pathname);
  return path.resolve(testFileDir, '..', '..', 'fixtures', relativePath);
}

describe('createVideoMedia E2E Test', () => {
  it('should create a MessageMedia object for a video file', () => {
    const filePath = resolveFixturePath('video_fixture.mp4');

    const result = createVideoMedia(filePath);

    assert.ok(result instanceof MessageMedia);
    assert.strictEqual(result.mimetype, 'video');
    assert.strictEqual(result.filename, 'video_fixture.mp4');
    assert.strictEqual(result.filesize, getFileSize(filePath));
  });
});

function getFileSize(filePath) {
  const stats = statSync(filePath);
  return stats.size;
}
