import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import axios from 'axios';

const url = 'https://savevid.net/en';

async function downloadScraper({ link }) {
  const browser = await puppeteer.launch({
    browser: 'firefox',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/usr/bin/firefox'
  });
  const page = await browser.newPage();
  await page.goto(url);
  await page.type('input', link);
  await page.waitForSelector('.btn-default');
  await page.waitForSelector('input');

  await page.click('.btn-default');
  await page.waitForSelector('.abutton');
  const links = await page.$$eval('.abutton', (aTags) => {
    return aTags.filter((a) => a.title === 'Download Video').map((a) => a.href);
  });

  await browser.close();

  for await (var [index, href] of links.entries()) {
    const response = await downloadFile(href);
    await fileWrite(link, index, response.data);
    index++;
  }

  return links.map((_e, index) => {
    return createFileName(link, index);
  });
}

function createFileName(link, index) {
  if (link.includes('/p/')) {
    return `./videos/${link.split('/p/')[1].replace(/\/.*/, '')}${index}.mp4`;
  } else if (link.includes('/reel/')) {
    return `./videos/${link.split('/reel/')[1].replace(/\/.*/, '')}${index}.mp4`;
  } else if (link.includes('/reels/')) {
    return `./videos/${link.split('/reels/')[1].replace(/\/.*/, '')}${index}.mp4`;
  }
}

async function downloadFile(href) {
  return axios.get(href, {
    responseType: 'arraybuffer'
  });
}

async function fileWrite(link, index, data) {
  const filePath = createFileName(link, index);
  await fs.writeFile(filePath, data);
  console.log(`File downloaded and saved to ${filePath}`);
}

export default downloadScraper;
