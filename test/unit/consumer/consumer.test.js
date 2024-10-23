import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import consumer from '../../../src/consumer/consumer.js';
import amqp from 'amqplib/callback_api.js';

function mockAmqpConnect(url, callback, message_payload) {
  const connection = {
    createChannel: (createChannelCallback) => {
      const channel = {
        assertQueue: (queueName, options) => {
          assert.strictEqual(queueName, 'testQueue');
          assert.deepStrictEqual(options, { durable: true });
        },
        prefetch: (qtyMessages) => {
          assert.strictEqual(qtyMessages, 1);
        },
        consume: (queueName, consumeCallback, options) => {
          assert.strictEqual(queueName, 'testQueue');
          assert.strictEqual(options.noAck, false);

          consumeCallback(message_payload);
        },
        sendToQueue: (queueName, message, options) => {
          assert.deepStrictEqual(queueName, 'testQueue_dlq');
          assert.deepStrictEqual(options, { persistent: true });
          assert.deepEqual(JSON.parse(message.toString()), {
            message: 'Test message 2'
          });
        },
        ack: (message) => {
          assert.ok(JSON.parse(message.content.toString()));
        }
      };
      createChannelCallback(null, channel);
    }
  };
  assert.strictEqual(url, 'amqp://guest:guest@rabbitmq:5672/');
  callback(null, connection);
}

describe('Consumer Unit Tests', () => {
  let context;

  beforeEach(() => {
    mock.restoreAll();
    context = mock.method(amqp, 'connect');
  });

  it('should consume messages from a queue', () => {
    const consumeCallback = mock.fn((message) => {
      return assert.deepEqual(message, { message: 'Test message 1' });
    });

    const payload = {
      content: Buffer.from(JSON.stringify({ message: 'Test message 1' }))
    };

    context.mock.mockImplementation((url, callback) =>
      mockAmqpConnect(url, callback, payload)
    );

    consumer('testQueue', consumeCallback);

    assert.strictEqual(amqp.connect.mock.callCount(), 1);
    assert.strictEqual(consumeCallback.mock.callCount(), 1);
  });

  it('should enqueue messages in dlq when an error occurs in callback', () => {
    const consumeCallback = mock.fn((_message) => {
      throw 'consumer error';
    });

    const payload = {
      content: Buffer.from(JSON.stringify({ message: 'Test message 2' }))
    };

    context.mock.mockImplementation((url, callback) =>
      mockAmqpConnect(url, callback, payload)
    );

    consumer('testQueue', consumeCallback);

    assert.strictEqual(amqp.connect.mock.callCount(), 1);
    assert.strictEqual(consumeCallback.mock.callCount(), 1);
  });

  it('should crashes when connection is not available', () => {
    const consumeCallback = mock.fn(() => {});

    context.mock.mockImplementation(() => {
      throw 'AMQP Connection Error';
    });

    assert.strictEqual(amqp.connect.mock.callCount(), 0);
    assert.strictEqual(consumeCallback.mock.callCount(), 0);
    assert.throws(
      () => consumer('testQueue', consumeCallback),
      /AMQP Connection Error/
    );
  });
});
