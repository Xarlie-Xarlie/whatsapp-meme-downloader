import consumer from '../consumer/consumer.js';
import segmentVideoAtPath from '../consumer/segment_video.js';
import dlqConsumer from '../consumer/dlq_consumer.js';
import { parentPort } from 'node:worker_threads';

const eventCallback = (payload) => {
  parentPort.postMessage(payload);
};

consumer('cutter_queue', segmentVideoAtPath, eventCallback);

dlqConsumer('cutter_queue_dlq', eventCallback);
