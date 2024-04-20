import puppeteer from "puppeteer";
import fs from 'fs/promises';
import axios from "axios";

const url = "https://saveig.app/en/instagram-video-downloader"
const downloadScraper = async (link) => {
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

  links.forEach(async (href, index) => {
    const response = await axios.get(href, {
      responseType: 'arraybuffer' // To get binary data
    });

    // Save the file
    const filePath = `./videos/${link.split("/p/")[1].replace("/", "")}${index}.mp4`;
    fs.writeFile(filePath, response.data);
    console.log(`File downloaded and saved to ${filePath}`);
  });
}

export default downloadScraper;
