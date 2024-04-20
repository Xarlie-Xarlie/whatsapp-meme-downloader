const amqp = require('amqplib/callback_api');
const { Worker } = require('worker_threads');

function listenToQueue(queueName) {
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

        channel.assertQueue(queueName, { durable: true })

        console.log(`Listening to queue '${queueName}'`);

        channel.consume(queueName, function(msg) {
          const { link, scriptFile } = JSON.parse(msg.content.toString());

          // Create a new worker thread to handle message consumption
          const worker = new Worker('./consumer/worker.js', { workerData: { link, scriptFile } });

          worker.on('error', (error) => {
            console.error('Error in worker thread:', error);
            // Move message to DLQ if processing error occurs
            channel.sendToQueue(`${queueName}_dlq`, Buffer.from(JSON.stringify({ link, scriptFile })), { persistent: true });
            // Acknowledge message from the main queue to remove it
            channel.ack(msg);
          });

          worker.on('exit', (code) => {
            if (code === 0) {
              console.log('Worker process finished with success');
              channel.ack(msg);
            }
            else {
              console.error(`Worker stopped with exit code ${code}`);
            }
          });
        }, { noAck: false });
      });
    });
  } catch (error) {
    console.error(`Error listening to queue '${queueName}':`, error);
  }
}

module.exports = { listenToQueue };
