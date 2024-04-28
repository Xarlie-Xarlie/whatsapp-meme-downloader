import consumer from '../consumer/consumer.js';
import segmentVideoAtPath from '../consumer/segment_video.js';
import dlqConsumer from '../consumer/dlq_consumer.js';
import { parentPort } from 'node:worker_threads';

const eventCallback = (payload) => {
  // Emit the event with result
  parentPort.postMessage(payload)
};

// Start the consumer for cutter process
consumer('cutter_queue', segmentVideoAtPath, eventCallback);

// Start the DLQ consumer for cutter process
dlqConsumer('cutter_queue_dlq', eventCallback);
