import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import consumer from '../../../src/consumer/consumer.js';
import amqp from 'amqplib/callback_api.js';

// Mock implementation of amqp.connect for testing
const mockAmqpConnect = (_url, callback) => {
  // Simulate successful connection
  const connection = {
    createChannel: createChannelCallback => {
      // Simulate channel creation
      const channel = {
        assertQueue: (queueName, options) => {
          assert.strictEqual(queueName, 'testQueue');
          assert.deepStrictEqual(options, { durable: true });
        },
        prefetch: (qtyMessages) => { assert.strictEqual(qtyMessages, 1) }, // Stub prefetch method
        consume: (queueName, consumeCallback, options) => {
          assert.strictEqual(queueName, 'testQueue');
          assert.strictEqual(options.noAck, false);

          // Simulate message consumption
          const message = { content: Buffer.from(JSON.stringify({ message: 'Test message' })) };
          consumeCallback(message);
        },
        sendToQueue: (queueName, message, options) => {
          assert.strictEqual(queueName, "testQueue_dlq");
          assert.deepStrictEqual(options, { persistent: true });
          assert.deepEqual(JSON.parse(message.toString()), { message: 'Test message' });

        },
        ack: message => {
          assert.deepStrictEqual(JSON.parse(message.content.toString()), { message: 'Test message' });
        }
      };
      createChannelCallback(null, channel); // Invoke callback with mock channel
    }
  };
  callback(null, connection); // Invoke callback with mock connection
};

describe('consumer Module', () => {
  let connectStub;

  beforeEach(() => {
    // Override amqp.connect with mock implementation
    connectStub = amqp.connect;
    amqp.connect = mockAmqpConnect;
  });

  afterEach(() => {
    // Restore original amqp.connect implementation
    amqp.connect = connectStub;
  });

  it('should consume messages from a queue', () => {
    // Mock consumeCallback and eventCallback
    const consumeCallback = mock.fn(message => {
      assert.deepEqual(message, { message: 'Test message' });
    });


    // Call the consumer module
    consumer('testQueue', consumeCallback);

    // Optional: Assert eventCallback interactions if provided
    assert.strictEqual(consumeCallback.mock.callCount(), 1);

  });

  it('should enqueue messages when an error occurs', () => {
    // Mock consumeCallback and eventCallback
    const consumeCallback = mock.fn(_message => {
      throw "consumer error";
    });

    // Call the consumer module
    consumer('testQueue', consumeCallback);

    // Optional: Assert eventCallback interactions if provided
    assert.strictEqual(consumeCallback.mock.callCount(), 1);
  });
});
