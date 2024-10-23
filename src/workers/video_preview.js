import consumer from '../consumer/consumer.js';
import createPreviewVideoAtPath from '../consumer/video_to_preview.js';
import dlqConsumer from '../consumer/dlq_consumer.js';

consumer('preview_queue', createPreviewVideoAtPath);

dlqConsumer('preview_queue_dlq');
