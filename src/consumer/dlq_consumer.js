import amqp from 'amqplib/callback_api.js';
import handleRetry from './handleRetry.js';

const MAX_RETRIES = 5;

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
