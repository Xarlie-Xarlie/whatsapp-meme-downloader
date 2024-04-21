import consumer from "./consumer.js";
import dlqConsumer from "./dlqConsumer.js";

// Listen to the queues
consumer('download_queue', 'cutter_queue');
dlqConsumer(`download_queue_dlq`);
