const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { listFiles } = require('./fileUtils');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const videosDir = './videos'; // Your videos directory

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

  if (message.fromMe && message.body === "!memes") {
    const videoFiles = listFiles(videosDir);
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
client.initialize();