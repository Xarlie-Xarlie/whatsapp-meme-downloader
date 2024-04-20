const queueListener = require('./modules/queueListener');
const dlqListener = require('./modules/dlqListener');

// Read the queue name from environment variables
const queueName = process.env.QUEUE_NAME;

if (!queueName) {
  console.error('QUEUE_NAME environment variable is not set.');
  return;
}

// Listen to the queues
queueListener.listenToQueue(queueName);
dlqListener.listenToDlqQueue(`${queueName}_dlq`);
