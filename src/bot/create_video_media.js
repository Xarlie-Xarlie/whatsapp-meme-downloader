import MessageMedia from 'whatsapp-web.js/src/structures/MessageMedia.js'
import fs from 'fs';
import path from 'path';

function createVideoMedia(filePath) {
  const filename = path.basename(filePath);
  const file = fs.readFileSync(filePath, { encoding: 'base64' });
  const filesize = Buffer.byteLength(file, 'base64');
  return new MessageMedia("video", file, filename, filesize);
}

export default createVideoMedia;
