const amqp = require('amqplib/callback_api');

const MAX_RETRIES = 5;

function listenToDlqQueue(queueName) {
  amqp.connect('amqp://guest:guest@rabbitmq:5672/', function(error0, connection) {
    // Connect to RabbitMQ
    if (error0) {
      throw error0;
    }

    connection.createChannel(function(error1, channel) {
      if (error1) {
        throw error1;
      }

      channel.assertQueue(queueName, { durable: true })

      console.log(`Listening to queue '${queueName}'`);

      channel.consume(queueName, function(msg) {
        const { id, payload, retryCount } = JSON.parse(msg.content.toString());
        console.log(`Received message from ${queueName}: ${id}, Payload: ${payload}`);

        // Handle worker process events
        if (retryCount < MAX_RETRIES) {
          retryMessage(channel, msg, retryCount);
        } else {
          console.log(`Maximum retry count reached for message ${id}. Rejecting message.`);
          // Reject the message if maximum retry count reached
          channel.reject(msg, false); // false indicates the message will not be requeued
        }
      }, { noAck: false });
    });
  });
}

function retryMessage(channel, msg, retryCount) {
  const { id, payload } = JSON.parse(msg.content.toString());
  console.log(`Retrying message ${id}...`);

  // Increase the retry count
  const newRetryCount = retryCount + 1;

  // Requeue the message to the main queue with the increased retry count
  channel.sendToQueue(msg.properties.headers.originalQueue, Buffer.from(JSON.stringify({ id, payload, retryCount: newRetryCount })), {
    persistent: true
  });

  console.log(`Message ${id} retried (${newRetryCount} retries).`);

  // Acknowledge the message from the DLQ
  channel.ack(msg);
}

module.exports = { listenToDlqQueue };
