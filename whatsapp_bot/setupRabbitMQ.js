const amqp = require('amqplib/callback_api');

const MAX_RETRIES = 5;

async function setupRabbitMQ(queues) {
  try {
    // Connect to RabbitMQ
    const connection = amqp.connect('amqp://rabbitmq', function(error0, connection, queues) {
      if (error0) {
        throw error0;
      }

      connection.createChannel(function(error1, channel) {
        if (error1) {
          throw error1;
        }

        queues.forEach(queueName => {
          declareQueueWithDLQ(channel, queueName)
        });
      });
    });

    // Declare queue with DLQ
    await declareQueueWithDLQ(channel, queueName);

    // Start consumer for DLQ
    await startDLQConsumer(channel, `${queueName}_dlq`);

    console.log('RabbitMQ setup completed.');

    // Close connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error setting up RabbitMQ:', error);
  }
}

async function declareQueueWithDLQ(channel, queueName) {
  // Declare main queue
  channel.assertQueue(queueName, {
    durable: true,
    deadLetterExchange: '', // Empty string indicates the default exchange
    deadLetterRoutingKey: `${queueName}_dlq`
  });

  // Declare DLQ
  await channel.assertQueue(`${queueName}_dlq`, { durable: true });

  // Configure DLQ as dead letter queue for the main queue
  await channel.bindQueue(queueName, '', `${queueName}_dlq`);

  console.log(`Queue '${queueName}' and its DLQ created.`);
}

async function startDLQConsumer(channel, dlqQueueName) {
  // Start consuming messages from the DLQ
  await channel.consume(dlqQueueName, async (msg) => {
    const { id, payload, retryCount } = JSON.parse(msg.content.toString());
    console.log(`Received message from DLQ: ${id}, Payload: ${payload}`);

    // Retry the message if the maximum retry count has not been reached
    if (retryCount < MAX_RETRIES) {
      await retryMessage(channel, msg, retryCount);
    } else {
      console.log(`Maximum retry count reached for message ${id}. Rejecting message.`);
      // Reject the message if maximum retry count reached
      channel.reject(msg, false); // false indicates the message will not be requeued
    }
  }, { noAck: false });

  console.log(`DLQ Consumer started for queue '${dlqQueueName}'.`);
}


setupRabbitMQ(["scraper_queue", "download_queue", "cutter_queue"]);
