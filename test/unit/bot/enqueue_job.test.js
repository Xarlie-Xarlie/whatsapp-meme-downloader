import assert from 'node:assert';
import amqp from 'amqplib/callback_api.js';
import { describe, it, beforeEach, mock } from 'node:test';
import enqueueJob from '../../../src/bot/enqueue_job.js';

function mockAmqpConnect(url, callback) {
  const connection = {
    createChannel: (channelCallback) => {
      const channel = {
        assertQueue: (queueName, options) => {
          assert.equal(queueName, 'testQueue');
          assert.deepEqual(options, { durable: true });
        },
        sendToQueue: (queueName, buffer) => {
          assert.equal(queueName, 'testQueue');
          const payload = JSON.parse(buffer.toString());
          assert.deepStrictEqual(payload, { message: 'Hello, RabbitMQ!' });
        }
      };
      channelCallback(null, channel);
    },
    close: () => {}
  };
  assert.strictEqual(url, 'amqp://guest:guest@rabbitmq:5672/');
  callback(null, connection);
}

describe('enqueueJob Unit Tests', () => {
  let context;

  beforeEach(() => {
    mock.restoreAll();
    context = mock.method(amqp, 'connect');
  });

  it('should enqueue a job into the specified queue', () => {
    const queueName = 'testQueue';
    const payload = { message: 'Hello, RabbitMQ!' };

    context.mock.mockImplementation((url, callback) =>
      mockAmqpConnect(url, callback)
    );

    assert.strictEqual(enqueueJob(queueName, payload), undefined);
    assert.strictEqual(amqp.connect.mock.callCount(), 1);
  });

  it('should handle connection error', () => {
    context.mock.mockImplementation(() => {
      throw 'AMQP connection error';
    });

    const queueName = 'testQueue';
    const payload = { message: 'Try to simulate connection error' };

    assert.strictEqual(
      `Enqueue Failed for queue: ${queueName} and payload: ${payload}.`,
      enqueueJob(queueName, payload)
    );
    assert.strictEqual(amqp.connect.mock.callCount(), 1);
  });

  it('should handle channel creation error', () => {
    context.mock.mockImplementation(() => {
      throw 'Channel creation error';
    });

    const queueName = 'testQueue';
    const payload = { message: 'Try to simulate channel creation error' };

    assert.strictEqual(
      `Enqueue Failed for queue: ${queueName} and payload: ${payload}.`,
      enqueueJob(queueName, payload)
    );
    assert.strictEqual(amqp.connect.mock.callCount(), 1);
  });
});
