import { Client } from 'whatsapp-web.js';
import createVideoMedia from './create_video_media.js';
import LocalAuth from 'whatsapp-web.js/src/authStrategies/LocalAuth.js';
import listStatusVideos from './list_status_videos.js';
import enqueueJob from './enqueue_job.js';
import qrcode from 'qrcode-terminal';

const videosDir = './videos/';

const client = new Client({
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/usr/bin/google-chrome-stable'
  },
  webVersionCache: {
    type: 'remote',
    remotePath:
      'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
  },
  authStrategy: new LocalAuth()
});

client.once('ready', () => {
  console.log('Client is ready!');
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('message_create', async (message) => {
  if (message.body === '!on') {
    message.reply('CharlieCharlie is here!');
  } else if (message.hasMedia && message.body.startsWith('!download')) {
    try {
      const media = await message.downloadMedia();
      const noreply = message.body.includes('noreply');
      if (media) {
        const decodedText = atob(media.data);
        const lines = decodedText.split('\n');
        var jobs = 0;
        lines.forEach((line) => {
          enqueueJob('download_queue', {
            link: line,
            retryCount: 0,
            from: message.from,
            noreply: noreply
          });
          jobs++;
        });
      }
      message.reply(`Enqueued ${jobs} jobs!`);
    } catch (e) {
      console.log(e);
      message.reply('Error during Enqueue jobs!');
    }
  } else if (message.body.startsWith('!download')) {
    try {
      const links = message.body.split(' ').slice(1);
      const noreply = message.body.includes('noreply');
      var jobs = 0;
      links.forEach((link) => {
        enqueueJob('download_queue', {
          link: link,
          retryCount: 0,
          from: message.from,
          noreply: noreply
        });
        jobs++;
      });
      message.reply(`Enqueued ${jobs} jobs`);
    } catch (e) {
      console.error(e);
      message.reply(
        'Ensure your command is like: !download https://link1... https://link2..., separated by spaces( )!'
      );
    }
  } else if (message.fromMe && message.body === '!status') {
    const videoFiles = listStatusVideos(videosDir);
    for (const filePath of videoFiles) {
      try {
        const media = createVideoMedia(filePath);
        await client.sendMessage(message.from, media);
      } catch (e) {
        console.log(e);
        client.sendMessage(message.from, `Error for file: ${filePath}!`);
      }
    }
  } else if (message.body.startsWith('!video')) {
    const files = message.body.split(' ').slice(1);
    for (const file of files) {
      try {
        const media = createVideoMedia(`./videos/${file}`);
        await client.sendMessage(message.from, media);
      } catch (e) {
        console.log(e);
        client.sendMessage(message.from, `Error for file: ${filePath}!`);
      }
    }
  } else if (message.fromMe && message.body === '!stop') {
    client.destroy();
  }
});

export default client;
