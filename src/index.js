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
  // spawnWorker('./src/workers/video_preview.js');
}, 10000)

const QUEUE_NAMES = {
  DOWNLOAD: "download_queue",
  CUTTER: "cutter_queue",
  DOWNLOAD_DLQ: "download_queue_dlq",
  CUTTER_DLQ: "cutter_queue_dlq",
  PREVIEW: "preview_queue"
};

function processWorkerNotification(payload) {
  const { queueName, filePath, from, noreply, link } = payload;

  switch (queueName) {
    case QUEUE_NAMES.DOWNLOAD:
      processDownloadQueue(payload.results, from, noreply);
      break;
    case QUEUE_NAMES.CUTTER:
      processCutterQueue(filePath, from, noreply);
      break;
    case QUEUE_NAMES.DOWNLOAD_DLQ:
      sendDownloadFailureMessage(from, link);
      break;
    case QUEUE_NAMES.CUTTER_DLQ:
      sendSegmentationFailureMessage(from, filePath);
      break;
    default:
      return;
  }
}

function processDownloadQueue(files, from, noreply) {
  files.forEach(file => {
    enqueueJob(QUEUE_NAMES.CUTTER, { filePath: file, retryCount: 0, from, noreply });
  });
}

function processCutterQueue(filePath, from, noreply) {
  // enqueueJob(QUEUE_NAMES.PREVIEW, { filePath, retryCount: 0 });

  if (noreply) {
    sendMessage(from, `File downloaded: ${filePath.replace("./videos/", "")}`);
  } else {
    const media = createVideoMedia(filePath);
    sendMessage(from, media);
  }
}

function sendDownloadFailureMessage(from, link) {
  sendMessage(from, `Download failed: ${link}`);
}

function sendSegmentationFailureMessage(from, filePath) {
  sendMessage(from, `Segmentation failed: ${filePath.replace("./videos/", "")}`);
}

function sendMessage(to, message) {
  client.sendMessage(to, message);
}
