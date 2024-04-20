import amqp from 'amqplib/callback_api.js';
const MAX_RETRIES = 5;

function dlqConsumer(queueName) {
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
        const { link, retryCount } = JSON.parse(msg.content.toString());

        // Handle worker process events
        if (retryCount < MAX_RETRIES) {
          retryMessage(channel, msg, retryCount, queueName);
        } else {
          console.log(`Maximum retry count reached for message ${link}. Rejecting message.`);
          // Reject the message if maximum retry count reached
          channel.reject(msg, false); // false indicates the message will not be requeued
        }
      }, { noAck: false });
    });
  });
}

function retryMessage(channel, msg, retryCount, queueName) {
  const { link } = JSON.parse(msg.content.toString());

  // Increase the retry count
  const newRetryCount = retryCount + 1;

  // Requeue the message to the main queue with the increased retry count
  channel.sendToQueue(queueName.replace("_dlq", ""), Buffer.from(JSON.stringify({ link, retryCount: newRetryCount })), {
    persistent: true
  });

  console.log(`Message ${link} retried (${newRetryCount} retries).`);

  // Acknowledge the message from the DLQ
  channel.ack(msg);
}

export default dlqConsumer;
