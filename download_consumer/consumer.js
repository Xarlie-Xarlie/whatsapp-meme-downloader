import amqp from 'amqplib/callback_api.js';
import downloadScraper from './download_scraper.js';

const consumer = (queueName, nextQueue) => {
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
          const { link, retryCount } = JSON.parse(msg.content.toString());

          try {
            const filePaths = await downloadScraper(link);
            console.log("Finished consuming msg", link);
            filePaths.forEach(filePath => {
              channel.sendToQueue(nextQueue, Buffer.from(JSON.stringify({ filePath: filePath, retryCount: 0 })), { persistent: true });
            });
            channel.ack(msg);
          } catch (e) {
            console.log(e);
            channel.sendToQueue(`${queueName}_dlq`, Buffer.from(JSON.stringify({ link, retryCount })), { persistent: true });
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
