# WhatsApp Meme Downloader

The goal of this project is to download memes from various social media platforms, such as Instagram, Facebook, Twitter, TikTok, etc. Currently, it only supports Instagram.

---

## Disclaimer

I'm using [Whatsapp-web-js](https://wwebjs.dev/), which implies that it is not fully guaranteed to avoid being banned by WhatsApp. Use it at your own risk.

I have been using it since 2024-04 and haven't faced any problems, so you should be fine.

---

## How to Run

Clone the repository:
```bash
git clone https://github.com/Xarlie-Xarlie/whatsapp-meme-downloader.git
```

Use Docker Compose to run:
```bash
docker-compose up -d
```

Follow the logs to get the QR code to log in to your WhatsApp account:
```bash
docker-compose logs -f wbot
```

When it logs in, your container will display the message: `Client is Ready!`.

Now you can download your memes from Instagram.

---

## How to Run Locally

Puppeteer uses Google Chrome to run the bot and web scraping script. If you want to run it locally, you have to change the `executablePath` in the application to match the path of your current Google Chrome installation in your OS. Change the `executablePath` in these files: `./src/bot/main.js` and `./src/consumer/download_scraper.js`.

### RabbitMQ Setup

You still need to run RabbitMQ:
```bash
docker-compose up -d rabbitmq
```

---

## How to Use

#### `!on` - replies if your bot is running

---

#### `!download URL` - download and send the video from the URL to you.

**URL** is the Instagram URL of the post or reels.

You can pass multiple links:
**!download URL1 URL2 URL3**

---

#### `!download_noreply URL` - downloads the meme but does not send it to you, only returns the file name.

---

#### `!video my_file_name.mp4` - sends you the video with the specified file name.

You can also pass multiple files:
`!video file1.mp4 file2.mp4 file3.mp4`

---

#### `!status` - sends you all your downloaded memes segmented by 30s parts.

By definition, videos for status updates cannot exceed 30s in duration. The `!status` command will segment all your memes into parts of 30s.

If a video you downloaded has a duration of 1:15, it will be sent as 3 videos: two 30s segments and one 15s segment, allowing you to "forward" them sequentially to your status.

---

#### `!stop` - stops your bot client.

After this command, you will not receive any commands. Your RabbitMQ and node workers will continue processing your downloads but will not send them back to the requestor, only saving them to your `./videos` directory.

---

### Note

The commands `!stop` and `!status` are allowed only for the account that is connected to the bot. It uses the [message.fromMe](https://docs.wwebjs.dev/Message.html#fromMe) property.

All other commands can be used by anyone who sends you a message.

---

## Run Tests

This project uses [Node Test Runner](https://nodejs.org/api/test.html#test-runner).

Run tests with:
```bash
yarn test
```
or
```bash
npm test
```

---

This revised version clarifies and improves the readability of your README.md file. Let me know if you need further adjustments!
