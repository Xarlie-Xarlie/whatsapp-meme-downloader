import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import consumer from '../../../src/consumer/consumer.js';
import amqp from 'amqplib/callback_api.js';

// Mock implementation of amqp.connect for testing
function mockAmqpConnect(url, callback, message_payload) {
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
          consumeCallback(message_payload);
        },
        sendToQueue: (queueName, message, options) => {
          assert.deepStrictEqual(queueName, "testQueue_dlq");
          assert.deepStrictEqual(options, { persistent: true });
          assert.deepEqual(JSON.parse(message.toString()), { message: 'Test message 2' });
        },
        ack: message => {
          assert.ok(JSON.parse(message.content.toString()));
        }
      };
      createChannelCallback(null, channel); // Invoke callback with mock channel
    }
  };
  assert.strictEqual(url, 'amqp://guest:guest@rabbitmq:5672/')
  callback(null, connection); // Invoke callback with mock connection
};

describe('Consumer Unit Tests', () => {
  let context;

  beforeEach(() => {
    mock.restoreAll();
    context = mock.method(amqp, 'connect');
  });

  it('should consume messages from a queue', () => {
    // Mock consumeCallback and eventCallback
    const consumeCallback = mock.fn(message => {
      return assert.deepEqual(message, { message: 'Test message 1' });
    });

    const payload = { content: Buffer.from(JSON.stringify({ message: 'Test message 1' })) };

    // mock amqp.connect
    context.mock.mockImplementation((url, callback) => mockAmqpConnect(url, callback, payload));

    // Call the consumer module
    consumer('testQueue', consumeCallback);

    // Optional: Assert eventCallback interactions if provided
    assert.strictEqual(amqp.connect.mock.callCount(), 1);
    assert.strictEqual(consumeCallback.mock.callCount(), 1);
  });

  it('should enqueue messages in dlq when an error occurs in callback', () => {
    // Mock consumeCallback and eventCallback
    const consumeCallback = mock.fn(_message => {
      throw "consumer error";
    });

    const payload = { content: Buffer.from(JSON.stringify({ message: 'Test message 2' })) }

    // mock amqp.connect
    context.mock.mockImplementation((url, callback) => mockAmqpConnect(url, callback, payload));

    // Call the consumer module
    consumer('testQueue', consumeCallback);

    // Optional: Assert eventCallback interactions if provided
    assert.strictEqual(amqp.connect.mock.callCount(), 1);
    assert.strictEqual(consumeCallback.mock.callCount(), 1);
  });

  it('should crashes when connection is not available', () => {
    // Mock consumeCallback and eventCallback
    const consumeCallback = mock.fn(_message => {
      throw "consumer error";
    });

    // mock amqp.connect
    context.mock.mockImplementation(() => { throw "AMQP Connection Error" });

    // Optional: Assert eventCallback interactions if provided
    assert.strictEqual(amqp.connect.mock.callCount(), 0);
    assert.strictEqual(consumeCallback.mock.callCount(), 0);
    assert.throws(() => consumer('testQueue', consumeCallback), /AMQP Connection Error/);
  });
});
