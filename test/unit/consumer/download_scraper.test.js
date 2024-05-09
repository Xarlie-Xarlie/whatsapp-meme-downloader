import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert";
import puppeteer from "puppeteer";
import fs from "node:fs/promises";
import axios from "axios";
import downloadScraper from "../../../src/consumer/download_scraper.js";

// Mock puppeteer
function puppeteerMock(links) {
  return {
    newPage: async () => ({
      goto: async () => { },
      type: async () => { },
      waitForSelector: async () => { },
      click: async () => { },
      $$eval: async () => links, // Simulate links
      close: async () => { } // Simulate browser closing
    }),
    close: async () => { } // Simulate browser closing
  }
};

describe('downloadScraper Unit Tests', () => {
  let puppeteerContext;
  let fsContext;
  let axiosContext;

  beforeEach(() => {
    mock.restoreAll();

    puppeteerContext = mock.method(puppeteer, 'launch');
    fsContext = mock.method(fs, 'writeFile');
    axiosContext = mock.method(axios, 'get');
  });

  it('should scrap link and download video', async () => {
    const link = 'https://instagram.com/p/video/share';
    const scrapedLinks = ['https://linkTest'];

    puppeteerContext.mock.mockImplementation(() => puppeteerMock(scrapedLinks));
    fsContext.mock.mockImplementation(() => null);
    axiosContext.mock.mockImplementation(() => { return { data: 'AAAAIGZ0eXBpc29' } });

    const result = await downloadScraper({ link });

    assert.deepStrictEqual(result, ['./videos/video0.mp4']);
    assert.strictEqual(puppeteer.launch.mock.callCount(), 1);
    assert.strictEqual(fs.writeFile.mock.callCount(), 1);
    assert.strictEqual(axios.get.mock.callCount(), 1);
  });

  it('should scrap and download multiple videos in the same post', async () => {
    const link = 'https://instagram.com/p/video/share';
    const scrapedLinks = ['https://linkTest', 'https://linkTest'];

    puppeteerContext.mock.mockImplementation(() => puppeteerMock(scrapedLinks));
    fsContext.mock.mockImplementation(() => null);
    axiosContext.mock.mockImplementation(() => { return { data: 'AAAAIGZ0eXBpc29' } });

    const result = await downloadScraper({ link });

    assert.deepStrictEqual(result, ['./videos/video0.mp4', './videos/video1.mp4']);
    assert.strictEqual(fs.writeFile.mock.callCount(), 2);
    assert.strictEqual(axios.get.mock.callCount(), 2);
  });

  it('should throw error when video cannot be downloaded', async () => {
    const link = 'https://instagram.com/p/video/share';
    const scrapedLinks = ['https://linkTest', 'https://linkTest'];

    puppeteerContext.mock.mockImplementation(() => puppeteerMock(scrapedLinks));
    fsContext.mock.mockImplementation(() => null);
    axiosContext.mock.mockImplementation(async () => { throw new Error("mock axios error") });

    await assert.rejects(async () => await downloadScraper({ link }), {
      message: 'mock axios error'
    });

    assert.strictEqual(puppeteer.launch.mock.callCount(), 1);
    assert.strictEqual(fs.writeFile.mock.callCount(), 0);
    assert.strictEqual(axios.get.mock.callCount(), 1);
  });

  it('should throw error when video cannot be saved', async () => {
    const link = 'https://instagram.com/p/video/share';
    const scrapedLinks = ['https://linkTest', 'https://linkTest'];

    puppeteerContext.mock.mockImplementation(() => puppeteerMock(scrapedLinks));
    fsContext.mock.mockImplementation(() => { throw new Error("fs writeFile error") });
    axiosContext.mock.mockImplementation(async () => { return { data: 'AAAAIGZ0eXBpc29' } });

    await assert.rejects(async () => await downloadScraper({ link }), {
      message: 'fs writeFile error'
    });

    assert.strictEqual(puppeteer.launch.mock.callCount(), 1);
    assert.strictEqual(fs.writeFile.mock.callCount(), 1);
    assert.strictEqual(axios.get.mock.callCount(), 1);
  });

  it('should throw error when puppeteer cannot be started', async () => {
    const link = 'https://instagram.com/p/video/share';

    puppeteerContext.mock.mockImplementation(() => { throw new Error("puppeteer launch error") });
    fsContext.mock.mockImplementation(() => null);
    axiosContext.mock.mockImplementation(async () => { return { data: 'AAAAIGZ0eXBpc29' } });

    await assert.rejects(async () => await downloadScraper({ link }), {
      message: 'puppeteer launch error'
    });

    assert.strictEqual(puppeteer.launch.mock.callCount(), 1);
    assert.strictEqual(fs.writeFile.mock.callCount(), 0);
    assert.strictEqual(axios.get.mock.callCount(), 0);
  });

  it('should returns empty arrays when cannot find links to download', async () => {
    const link = 'https://instagram.com/p/video/share';

    puppeteerContext.mock.mockImplementation(() => puppeteerMock([]));
    fsContext.mock.mockImplementation(() => null);
    axiosContext.mock.mockImplementation(async () => { return { data: 'AAAAIGZ0eXBpc29' } });

    const result = await downloadScraper({ link })

    assert.deepStrictEqual(result, []);
    assert.strictEqual(puppeteer.launch.mock.callCount(), 1);
    assert.strictEqual(fs.writeFile.mock.callCount(), 0);
    assert.strictEqual(axios.get.mock.callCount(), 0);
  });

});
