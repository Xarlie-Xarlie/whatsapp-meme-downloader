import consumer from "./consumer.js";
import dlqConsumer from "./dlqConsumer.js";

// Listen to the queues
consumer('cutter_queue');
dlqConsumer(`cutter_queue_dlq`);
