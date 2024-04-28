import { parentPort } from 'node:worker_threads';
import consumer from '../consumer/consumer.js';
import downloadScraper from '../consumer/download_scraper.js';
import dlqConsumer from '../consumer/dlq_consumer.js';

// Define the eventCallback function for download worker
const eventCallback = (payload) => {
  // Emit the event with result
  parentPort.postMessage(payload)
};

// Start the consumer for download process
consumer('download_queue', downloadScraper, eventCallback);

// Start the DLQ consumer for download process
dlqConsumer('download_queue_dlq', eventCallback);
