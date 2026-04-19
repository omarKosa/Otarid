const amqp = require("amqplib");
const { sendEmail } = require("../mailer");

// ─── Config ───────────────────────────────────────────────────
const RABBITMQ_URL  = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const EXCHANGE_NAME = "app_events";   // must match what auth/profile publish to
const QUEUE_NAME    = "notification_queue";

// Events this service cares about
const HANDLED_EVENTS = ["user.registered", "password.reset"];

// ─── Connect with retry ───────────────────────────────────────
// RabbitMQ might still be starting when this service boots,
// so we retry a few times before giving up.
const connectWithRetry = async (retries = 10, delayMs = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`[Consumer] Connecting to RabbitMQ (attempt ${i}/${retries})...`);
      const connection = await amqp.connect(RABBITMQ_URL);
      console.log("[Consumer] Successfully connected to RabbitMQ.");
      return connection;
    } catch (err) {
      console.error(`[Consumer] Connection attempt ${i} failed: ${err.message}`);
      if (i === retries) throw err;
      console.log(`[Consumer] Retrying in ${delayMs}ms...`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
};

// ─── Start Consumer ───────────────────────────────────────────
const startConsumer = async () => {
  const connection = await connectWithRetry();
  const channel    = await connection.createChannel();

  // Declare a fanout exchange — auth/profile publish here
  await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

  // Declare this service's queue
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  // Bind queue to exchange for each event we handle
  for (const event of HANDLED_EVENTS) {
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, event);
    console.log(`[Consumer] Listening for event: ${event}`);
  }

  // Only fetch one message at a time — don't overwhelm the mailer
  channel.prefetch(1);

  console.log("[Consumer] Ready to receive messages from queue: " + QUEUE_NAME);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    const routingKey = msg.fields.routingKey; // e.g. "user.registered"
    let data;

    try {
      data = JSON.parse(msg.content.toString());
    } catch (err) {
      console.error(`[Consumer] Failed to parse message JSON. Error: ${err.message}. Message discarded.`);
      channel.nack(msg, false, false); // discard bad message
      return;
    }

    console.log(`[Consumer] Received event routing_key=${routingKey} recipient=${data.email || "unknown"}`); 

    try {
      await sendEmail(routingKey, data);
      console.log(`[Consumer] Successfully processed event routing_key=${routingKey} recipient=${data.email}`);
      channel.ack(msg); // tell RabbitMQ: message processed successfully
    } catch (err) {
      console.error(`[Consumer] Failed to send email for routing_key=${routingKey} recipient=${data.email}. Error: ${err.message}`);
      // requeue: false — don't loop forever on a broken message
      channel.nack(msg, false, false);
    }
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("[Consumer] Shutting down...");
    await channel.close();
    await connection.close();
    process.exit(0);
  });
};

module.exports = { startConsumer };
