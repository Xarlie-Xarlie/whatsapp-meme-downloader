import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import dlqConsumer from '../../../src/consumer/dlq_consumer.js';
import amqp from 'amqplib/callback_api.js';

// Mock implementation of amqp.connect for testing
function mockAmqpConnect(url, callback, message_payload) {
  // Simulate successful connection
  const connection = {
    createChannel: createChannelCallback => {
      // Simulate channel creation
      const channel = {
        assertQueue: (queueName, options) => {
          assert.strictEqual(queueName, 'testQueue_dlq');
          assert.deepStrictEqual(options, { durable: true });
        },
        prefetch: (qtyMessages) => { assert.strictEqual(qtyMessages, 1) }, // Stub prefetch method
        consume: (queueName, consumeCallback, options) => {
          assert.strictEqual(queueName, 'testQueue_dlq');
          assert.strictEqual(options.noAck, false);

          // Simulate message consumption
          consumeCallback(message_payload);
        },
        sendToQueue: (queueName, message, options) => {
          assert.deepStrictEqual(queueName, "testQueue");
          assert.deepStrictEqual(options, { persistent: true });
          assert.deepEqual(JSON.parse(message.toString()), { message: 'Test message', retryCount: 1 });
        },
        ack: message => {
          assert.ok(JSON.parse(message.content.toString()));
        },
        reject: (message, renqueue) => {
          assert.ok(message);
          assert.strictEqual(renqueue, false);
        }
      };
      createChannelCallback(null, channel); // Invoke callback with mock channel
    }
  };
  assert.strictEqual(url, 'amqp://guest:guest@rabbitmq:5672/')
  callback(null, connection); // Invoke callback with mock connection
};

describe('dlqConsumer Unit Tests', () => {
  let context;

  beforeEach(() => {
    mock.restoreAll();
    context = mock.method(amqp, 'connect');
  });

  it('should consume messages', () => {
    const eventCallback = mock.fn(() => { });

    const payload = { content: Buffer.from(JSON.stringify({ retryCount: 0, message: 'Test message' })) };
    context.mock.mockImplementation((url, callback) => mockAmqpConnect(url, callback, payload));

    dlqConsumer('testQueue_dlq', eventCallback);

    assert.strictEqual(amqp.connect.mock.callCount(), 1);
    assert.strictEqual(eventCallback.mock.callCount(), 0);
  });

  it('should reject messages when maximum retry count reached', () => {
    const eventCallback = mock.fn(payload => {
      assert.deepStrictEqual(payload, { message: 'Test message', retryCount: 5, queueName: 'testQueue_dlq' });
    });

    const payload = { content: Buffer.from(JSON.stringify({ retryCount: 5, message: 'Test message' })) };
    context.mock.mockImplementation((url, callback) => mockAmqpConnect(url, callback, payload));

    dlqConsumer('testQueue_dlq', eventCallback);

    assert.strictEqual(amqp.connect.mock.callCount(), 1);
    assert.strictEqual(eventCallback.mock.callCount(), 1);
  });

  it('should enqueue messages in dlq when an error occurs in callback', () => {
    const eventCallback = mock.fn(_payload => {
      throw "eventCallback error";
    });

    const payload = { content: Buffer.from(JSON.stringify({ retryCount: 5, message: 'Test message' })) };

    context.mock.mockImplementation((url, callback) => mockAmqpConnect(url, callback, payload));

    assert.throws(() => dlqConsumer('testQueue_dlq', eventCallback), /eventCallback error/);

    assert.strictEqual(amqp.connect.mock.callCount(), 1);
    assert.strictEqual(eventCallback.mock.callCount(), 1);
  });

  it('should crashes when connection is not available', () => {
    const eventCallback = mock.fn(() => { });

    context.mock.mockImplementation(() => { throw "AMQP Connection Error" });

    assert.strictEqual(amqp.connect.mock.callCount(), 0);
    assert.strictEqual(eventCallback.mock.callCount(), 0);
    assert.throws(() => dlqConsumer('testQueue_dlq', eventCallback), /AMQP Connection Error/);
  });
});
