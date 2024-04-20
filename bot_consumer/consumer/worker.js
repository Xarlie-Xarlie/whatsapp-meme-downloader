const { workerData } = require('worker_threads');
const handler = require('../handlers/handler');

const payload = workerData;

// Perform message handling using the handler module
handler.handleMessage(payload);
