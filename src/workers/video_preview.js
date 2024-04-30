import consumer from '../consumer/consumer.js';
import createPreviewVideoAtPath from '../consumer/video_to_preview.js';
import dlqConsumer from '../consumer/dlq_consumer.js';

// Start the consumer for download process
consumer('preview_queue', createPreviewVideoAtPath);

// Start the DLQ consumer for download process
dlqConsumer('preview_queue_dlq');
