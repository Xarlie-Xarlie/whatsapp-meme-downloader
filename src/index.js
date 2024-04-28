import { Worker } from 'worker_threads';
import client from './bot/main.js';
import enqueueJob from './bot/enqueue_job.js';

// Initialize client
client.initialize();

// Function to spawn a worker with error handling and respawn logic
function spawnWorker(workerPath) {
  const worker = new Worker(workerPath);

  // Listen for 'message' event from the worker
  worker.on('message', payload => {
    processWorkerNotification(payload)
  });

  // Handle worker errors
  worker.on('error', error => {
    console.error(`Worker error: ${error}`);
    // Respawn the worker after a delay (e.g., 5 seconds)
    setTimeout(() => {
      console.log("spawning a new worker...");
      spawnWorker(workerPath);
    }, 5000);
  });

  return worker;
}

setTimeout(() => {
  // Spawn downloader workers
  spawnWorker('./src/workers/download.js');
  spawnWorker('./src/workers/download.js');

  // Spawn cutter worker
  spawnWorker('./src/workers/cutter.js');
}, 10000)

function processWorkerNotification(payload) {
  if (payload.queueName === "download_queue") {
    payload.results.forEach(file => {
      enqueueJob("cutter_queue", { filePath: file, retryCount: 0, from: payload.from })
    })
  } else if (payload.queueName === "cutter_queue") {
    client.sendMessage(payload.from, `File downloaded and segmented: ${payload.filePath}`);
  } else if (payload.queueName === "download_queue_dlq") {
    client.sendMessage(payload.from, `Download failed: ${payload.link}`);
  } else if (payload.queueName === "cutter_queue_dlq") {
    client.sendMessage(payload.from, `Segmentation failed: ${payload.filePath}`);
  }
}
