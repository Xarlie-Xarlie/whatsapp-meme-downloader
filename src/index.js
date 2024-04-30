import { Worker } from 'worker_threads';
import client from './bot/main.js';
import createVideoMedia from './bot/create_video_media.js'
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
  // Spawn gif worker
  spawnWorker('./src/workers/video_preview.js');
}, 10000)

function processWorkerNotification(payload) {
  if (payload.queueName === "download_queue") {
    payload.results.forEach(file => {
      enqueueJob("cutter_queue", { filePath: file, retryCount: 0, from: payload.from, noreply: payload.noreply });
    })
  } else if (payload.queueName === "cutter_queue") {
    enqueueJob("preview_queue", { filePath: payload.filePath, retryCount: 0 });
    if (payload.noreply) {
      client.sendMessage(payload.from, `File downloaded: ${payload.filePath.replace("./videos/", "")}`);
    } else {
      const media = createVideoMedia(payload.filePath);
      client.sendMessage(payload.from, media);
    }
  } else if (payload.queueName === "download_queue_dlq") {
    client.sendMessage(payload.from, `Download failed: ${payload.link}`);
  } else if (payload.queueName === "cutter_queue_dlq") {
    client.sendMessage(payload.from, `Segmentation failed: ${payload.filePath.replace("./videos/", "")}`);
  } else {
    return;
  }
}
