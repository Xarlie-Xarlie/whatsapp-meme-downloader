import { Client } from 'whatsapp-web.js';
import MessageMedia from 'whatsapp-web.js/src/structures/MessageMedia.js'
import LocalAuth from 'whatsapp-web.js/src/authStrategies/LocalAuth.js';
import listSegmentedFiles from './file_utils.js';
import enqueueJob from './enqueue_job.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';

const videosDir = './videos/'; // Your videos directory

// Create a new client instance
const client = new Client({
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: "/usr/bin/google-chrome-stable"
  },
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  },
  authStrategy: new LocalAuth()
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
  console.log('Client is ready!');
});

// When the client received QR-Code
client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('message_create', async message => {
  if (message.body === '!on') {
    message.reply('CharlieCharlie is here!');
  }

  if (message.fromMe && message.hasMedia && message.body.startsWith("!download")) {
    try {
      const media = await message.downloadMedia();
      if (media) {
        const decodedText = atob(media.data);
        const lines = decodedText.split("\n");
        var jobs = 0;
        lines.forEach(line => {
          enqueueJob("download_queue", { link: line, retryCount: 0, from: message.from });
          jobs++;
        });
      }
      message.reply(`Enqueued ${jobs} jobs!`)
    }
    catch (e) {
      console.log(e)
      message.reply("Error during Enqueue jobs!")
    }
  }

  if (message.fromMe && message.body.startsWith("!download")) {
    try {
      const link = message.body.split(" ")[1];
      if (link) {
        enqueueJob("download_queue", { link: link, retryCount: 0, from: message.from });
        message.reply(`Enqueued job: ${link}`);
      }
    } catch (e) {
      message.reply(`Error in comand: ${e}`);
    }
  }

  if (message.fromMe && message.body === "!memes") {
    const videoFiles = listSegmentedFiles(videosDir);
    for (const filePath of videoFiles) {
      try {
        const filename = path.basename(filePath);
        const file = fs.readFileSync(filePath, { encoding: 'base64' });
        const filesize = Buffer.byteLength(file, 'base64');
        const media = new MessageMedia("video", file, filename, filesize);
        await client.sendMessage(message.from, media);
      } catch (e) {
        console.log(e)
        client.sendMessage(message.from, `Error for file: ${filePath}!`);
      }
    }
  }

  if (message.fromMe && message.body === "!stop") {
    client.destroy()
  }
});

// Start your client
export default client;
