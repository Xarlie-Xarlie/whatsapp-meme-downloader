import assert from "node:assert";
import amqp from 'amqplib/callback_api.js';
import { describe, it } from "node:test";
import enqueueJob from '../../src/bot/enqueue_job.js';

describe('enqueueJob', () => {
  it('should enqueue a job into the specified queue', () => {
    const queueName = 'testQueue';
    const payload = { message: 'Hello, RabbitMQ!' };

    // Override the amqplib connect function with a mock
    amqp.connect = (_url, callback) => {
      // Simulate successful connection
      const connection = {
        createChannel: (channelCallback) => {
          // Simulate successful channel creation
          const channel = {
            assertQueue: (queueName, options) => {
              assert.equal(queueName, 'testQueue');
              assert.deepEqual(options, { durable: true });
            },
            sendToQueue: (queueName, buffer) => {
              assert.equal(queueName, 'testQueue');
              const payload = JSON.parse(buffer.toString());
              assert.deepEqual(payload, { message: 'Hello, RabbitMQ!' });
            }
          };
          channelCallback(null, channel);
        },
        close: () => {
          // Simulate closing connection
          // No need to assert anything here
        }
      };
      callback(null, connection);
    };
    // Call the enqueueJob function
    enqueueJob(queueName, payload);
  });

  it('should handle connection error', () => {
    // Mock amqplib connect function to simulate connection error
    amqp.connect = (_url, callback) => {
      callback(new Error('Connection error'));
    };

    // Call enqueueJob with test arguments
    const queueName = 'testQueue';
    const payload = { message: 'Hello, RabbitMQ!' };

    assert.strictEqual(
      `Enqueue Failed for queue: ${queueName} and payload: ${payload}.`,
      enqueueJob(queueName, payload)
    );
  });

  it('should handle channel creation error', () => {
    // Mock amqplib connect function to simulate successful connection
    amqp.connect = (_url, callback) => {
      // Simulate successful connection
      const connection = {
        createChannel: (channelCallback) => {
          channelCallback(new Error('Channel creation error'));
        },
        close: () => {
          // Simulate closing connection
          // No need to assert anything here
        }
      };
      callback(null, connection);
    };

    // Call enqueueJob with test arguments
    const queueName = 'testQueue';
    const payload = { message: 'Hello, RabbitMQ!' };

    assert.strictEqual(
      `Enqueue Failed for queue: ${queueName} and payload: ${payload}.`,
      enqueueJob(queueName, payload)
    );
  });
});
