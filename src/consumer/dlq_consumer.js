import amqp from 'amqplib/callback_api.js';

const MAX_RETRIES = 5;

/**
 * Handle Retry of messages from dlq.
 * if a message has not reached the maximum retries.
 * It will enqueue the message in the original queue.
 *
 * @param {Object} amqp.Channel - Channel from the amqp module.
 * @param {Object} Message - Message that would be renqueued. 
 * @param {integer} retryCount - number of retried times of this message. 
 * @param {string} queueName - 
 * Queue name. It should ends with: "_dlq". Like: "your_queue_dlq"
 *
 * @example
 * <caption>Requeue a new message</caption>
 * handleRetry(channel, {message: "my message"}, 0, "my_queue_dlq")
 * Message {message: "my message"} retried (1 retries);
 */
function handleRetry(channel, msg, retryCount, queueName) {
  const data = JSON.parse(msg.content.toString());
  data["retryCount"] = retryCount + 1;

  // Requeue the message to the main queue with the increased retry count
  channel.sendToQueue(queueName.replace("_dlq", ""), Buffer.from(JSON.stringify(data)), {
    persistent: true
  });

  console.log(`Message ${JSON.stringify(data)} retried (${retryCount + 1} retries).`);

  // Acknowledge the message from the DLQ
  channel.ack(msg);
}

/**
 * Consumes a message from a dlq queue in RabbitMQ.
 *
 * It just sends the message to the default queue.
 *
 * if the maximum retries are not reached, it sends
 * the message to the default queue. otherwise, it
 * rejects the message.
 *
 * @param {string} queueName - The name of the queue. 
 * It should ends with: "_dlq". Like: "my_queue_dlq"
 *
 * @param {Function} eventCallback - callback function to emit events after
 * consuming a message, based on the results from the consumeCallback.
 *
 * @example
 * <caption>Starts consuming a dlq queue.</caption>
 * dlqConsumer(
 *   "my_queue_dlq",
 *   (msg) => {console.log(msg)},
 * )
 * Listening to queue 'my_queue_dlq_'
 * Message {message: "my message"} retried (1 retries);
 *
 * @example
 * <caption>A message have reached it's maximum number of retries.</caption>
 * dlqConsumer(
 *   "my_queue_dlq",
 *   (msg) => {console.log(msg)},
 * )
 * Listening to queue 'my_queue_dlq'
 * Maximum retry count reached for message {message: "my message"}. Rejecting message.
 */
function dlqConsumer(queueName, eventCallback) {
  amqp.connect('amqp://guest:guest@rabbitmq:5672/', function(error0, connection) {
    // Connect to RabbitMQ
    if (error0) {
      throw error0;
    }

    connection.createChannel(function(error1, channel) {
      if (error1) {
        throw error1;
      }

      channel.assertQueue(queueName, { durable: true });
      channel.prefetch(1);

      console.log(`Listening to queue '${queueName}'`);

      channel.consume(queueName, function(msg) {
        const payload = JSON.parse(msg.content.toString());
        const retryCount = payload.retryCount;

        // Handle worker process events
        if (retryCount < MAX_RETRIES) {
          handleRetry(channel, msg, retryCount, queueName);
        } else {
          if (eventCallback) {
            payload.queueName = queueName;
            eventCallback(payload);
          }
          console.log(`Maximum retry count reached for message ${msg.content.toString()}. Rejecting message.`);
          // Reject the message if maximum retry count reached
          channel.reject(msg, false); // false indicates the message will not be requeued
        }
      }, { noAck: false });
    });
  });
}

export default dlqConsumer;
