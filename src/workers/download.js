import { parentPort } from 'node:worker_threads';
import consumer from '../consumer/consumer.js';
import downloadScraper from '../consumer/download_scraper.js';
import dlqConsumer from '../consumer/dlq_consumer.js';

const eventCallback = (payload) => {
  parentPort.postMessage(payload);
};

consumer('download_queue', downloadScraper, eventCallback);

dlqConsumer('download_queue_dlq', eventCallback);
