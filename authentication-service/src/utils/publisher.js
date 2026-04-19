const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'app_events';

let channel = null;

const connectWithRetry = async (retries = 10, delayMs = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`[Publisher] Connecting to RabbitMQ (attempt ${i}/${retries})...`);
      const connection = await amqp.connect(RABBITMQ_URL);
      console.log('[Publisher] Successfully connected to RabbitMQ.');
      return connection;
    } catch (err) {
      console.error(`[Publisher] Connection attempt ${i} failed: ${err.message}`);
      if (i === retries) throw err;
      console.log(`[Publisher] Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

const connectPublisher = async () => {
  const connection = await connectWithRetry();
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

  process.on('SIGTERM', async () => {
    console.log('[Publisher] SIGTERM received, closing RabbitMQ connection...');
    await channel.close();
    await connection.close();
    process.exit(0);
  });
};

const publishEvent = async (eventName, data) => {
  if (!channel) {
    throw new Error('RabbitMQ publisher not connected');
  }

  const payload = Buffer.from(JSON.stringify(data));
  channel.publish(EXCHANGE_NAME, eventName, payload, { persistent: true });
  console.log(`[Publisher] Published event: ${eventName} (data keys: ${Object.keys(data).join(', ')})`);
};

module.exports = { connectPublisher, publishEvent };
