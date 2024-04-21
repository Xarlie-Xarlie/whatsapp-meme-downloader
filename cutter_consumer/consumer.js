import amqp from 'amqplib/callback_api.js';
import segmentVideoAtPath from './segmentVideoAtPath.js';

const consumer = queueName => {
  try {
    // Connect to RabbitMQ
    amqp.connect('amqp://guest:guest@rabbitmq:5672/', function(error0, connection) {
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

        channel.consume(queueName, async msg => {
          const { filePath, retryCount } = JSON.parse(msg.content.toString());

          console.log(filePath, retryCount);
          try {
            await segmentVideoAtPath(filePath);
            console.log("Finished consuming msg", filePath);
            channel.ack(msg);
          } catch (e) {
            console.log(e);
            channel.sendToQueue(`${queueName}_dlq`, Buffer.from(JSON.stringify({ filePath, retryCount })), { persistent: true });
            // Acknowledge message from the main queue to remove it
            channel.ack(msg);
          }
        }, { noAck: false });
      });
    });
  } catch (error) {
    console.error(`Error listening to queue '${queueName}':`, error);
  }
}

export default consumer;
