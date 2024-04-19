const amqp = require('amqplib/callback_api');
const { spawn } = require('child_process');

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
          const { id, payload } = JSON.parse(msg.content.toString());
          console.log(`Received message from ${queueName}: ${id}, Payload: ${payload}`);

          // Spawn worker process to handle message consumption
          const workerProcess = spawn('node', ['./consumer/worker.js', id, payload]);

          // Handle worker process events
          workerProcess.on('exit', (code) => {
            console.log(`Worker process exited with code ${code}`);
            // Acknowledge message if worker process exits successfully
            if (code === 0) {
              channel.ack(msg);
              // Acknowledge message from the queue if processing is successful
              channel.ack(msg);
              console.log(`Message ${id} processed successfully.`);
            } else {
              console.error(`Error processing message ${id}:`);
              // Move message to DLQ if processing error occurs
              channel.sendToQueue(`${queueName}_dlq`, Buffer.from(msg), { persistent: true });
              console.log(`Message ${id} moved to DLQ.`);
              // Acknowledge message from the main queue to remove it
              channel.ack(msg);
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
