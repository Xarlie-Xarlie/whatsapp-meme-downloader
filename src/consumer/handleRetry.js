function handleRetry(channel, msg, retryCount, queueName) {
  const data = JSON.parse(msg.content.toString());
  data["retryCount"] = retryCount + 1;

  // Requeue the message to the main queue with the increased retry count
  channel.sendToQueue(queueName.replace("_dlq", ""), Buffer.from(JSON.stringify(data)), {
    persistent: true
  });

  console.log(`Message ${data} retried (${retryCount + 1} retries).`);

  // Acknowledge the message from the DLQ
  channel.ack(msg);
}

export default handleRetry;
