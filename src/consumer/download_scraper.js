import puppeteer from "puppeteer";
import fs from 'fs/promises';
import axios from "axios";

const url = "https://saveig.app/en/instagram-video-downloader"
const downloadScraper = async ({ link }) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: "/usr/bin/google-chrome-stable"
  });
  const page = await browser.newPage();
  await page.goto(url);
  await page.type('input', link);
  await page.waitForSelector('input');
  await page.click('input');

  await page.click('button');
  await page.waitForSelector('.abutton');
  const links = await page.$$eval('.abutton', aTags => { return aTags.map(a => a.href) });
  await browser.close();

  for await (var [index, href] of links.entries()) {
    const response = await downlaodFile(href)
    await fileWrite(link, index, response.data);
    index++;
  }

  return links.map((_e, index) => {
    return createFileName(link, index)
  })
}

function createFileName(link, index) {
  if (link.includes("/p/")) {
    return `./videos/${link.split("/p/")[1].replace(/\/.*/, "")}${index}.mp4`;
  } else if (link.includes("/reel/")) {
    return `./videos/${link.split("/reel/")[1].replace(/\/.*/, "")}${index}.mp4`;
  }
}

async function downlaodFile(href) {
  return axios.get(href, {
    responseType: 'arraybuffer' // To get binary data
  });
}

async function fileWrite(link, index, data) {
  const filePath = createFileName(link, index);
  await fs.writeFile(filePath, data);
  console.log(`File downloaded and saved to ${filePath}`);
}

export default downloadScraper;
