import amqp from 'amqplib/callback_api.js';

const consumer = (queueName, consumeCallback, eventCallback) => {
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
        try {
          const payload = JSON.parse(msg.content.toString());
          const result = await consumeCallback(payload);

          // Call eventCallback if provided
          if (eventCallback) {
            payload.results = result;
            payload.queueName = queueName;

            eventCallback(payload);
          }

          channel.ack(msg);
        } catch (e) {
          console.error(e);

          // If there's an error, send to DLQ and acknowledge message
          channel.sendToQueue(`${queueName}_dlq`, msg.content, { persistent: true });
          channel.ack(msg);
        }
      }, { noAck: false });
    });
  });
};

export default consumer;
