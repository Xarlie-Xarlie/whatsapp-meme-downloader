const amqp = require('amqplib/callback_api');

function enqueueJob(queueName, payload) {
  amqp.connect('amqp://guest:guest@rabbitmq:5672/', function(error0, connection) {
    if (error0) {
      throw error0;
    }
    connection.createChannel(function(error1, channel) {
      if (error1) {
        throw error1;
      }

      channel.assertQueue(queueName, {
        durable: true
      });
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)));

      console.log(`Enqueued Job for queue: ${queueName}`);
    });
    setTimeout(function() {
      connection.close();
    }, 500);
  });
}

module.exports = { enqueueJob };
