import amqp from 'amqplib/callback_api.js';

/**
  * Enqueue a job for Rabbitmq Queues.
  *
  * @param {string} queueName - The name of the queue where job goes.
  * @param {object} payload - message payload with important info.
  *
  * @example
  * <caption>Enqueue a simple job.</caption>
  * enqueueJob("my_queue", {message: "hello from Queue"})
  *
  * @example
  * <caption>Failed to enqueue a job.</caption>
  * enqueueJob("my_queue", {message: "hello from Queue"})
  * Enqueue Failed for queue: my_queue and payload: {message: "hello from Queue"}.
  */
function enqueueJob(queueName, payload) {
  try {
    amqp.connect('amqp://guest:guest@rabbitmq:5672/', function(error0, connection) {
      if (error0) {
        throw error0;
      }
      connection.createChannel(function(error1, channel) {
        if (error1) {
          throw error1;
        }

        channel.assertQueue(queueName, { durable: true });
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)));

        console.log(`Enqueued Job for queue: ${queueName}`);
      });
      connection.close();
      return;
    });
  } catch (_e) {
    return `Enqueue Failed for queue: ${queueName} and payload: ${payload}.`
  }
}

export default enqueueJob;
