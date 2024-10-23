import MessageMedia from 'whatsapp-web.js/src/structures/MessageMedia.js';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Create a video Message Media from whatsapp-web.js.
 *
 * @param {string} filePath - The filePath of a video .mp4.
 * @returns {MessageMedia} The MessageMedia object with the video.
 *
 * @example
 * <caption>Creates a MessageMedia object.</caption>
 * createVideoMedia("video.mp4")
 * MessageMedia {
 *  mimetype: 'video',
 *  data: 'AAAAIGZ0eXBpc29...',
 *  filename: 'video.mp4',
 *  filesize: 463959
 * }
 */
function createVideoMedia(filePath) {
  const filename = path.basename(filePath);
  const file = fs.readFileSync(filePath, { encoding: 'base64' });
  const filesize = Buffer.byteLength(file, 'base64');
  return new MessageMedia('video', file, filename, filesize);
}

export default createVideoMedia;
