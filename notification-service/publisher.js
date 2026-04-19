// ─────────────────────────────────────────────────────────────
// publisher.js  —  drop this file into your auth/profile service
// e.g. src/utils/publisher.js
// ─────────────────────────────────────────────────────────────
const amqp = require("amqplib");

const RABBITMQ_URL  = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const EXCHANGE_NAME = "app_events";

let channel = null;

// Call once when your service boots
const connectPublisher = async () => {
  const connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
  console.log("[Publisher] ✅ Connected to RabbitMQ.");
};

// Call this anywhere in your controllers
const publishEvent = (eventName, data) => {
  if (!channel) {
    console.warn("[Publisher] Not connected yet — event dropped:", eventName);
    return;
  }
  const payload = Buffer.from(JSON.stringify(data));
  channel.publish(EXCHANGE_NAME, eventName, payload, { persistent: true });
  console.log(`[Publisher] 📤 Published event: ${eventName}`);
};

module.exports = { connectPublisher, publishEvent };


// ─────────────────────────────────────────────────────────────
// HOW TO USE IN YOUR CONTROLLERS:
// ─────────────────────────────────────────────────────────────

// 1. In your server.js, connect on boot:
//
//    const { connectPublisher } = require("./utils/publisher");
//    await connectPublisher();

// 2. In authController.js — after successful register:
//
//    const { publishEvent } = require("../utils/publisher");
//
//    publishEvent("user.registered", {
//      email: user.email,
//      name:  user.name,
//    });

// 3. In authController.js — after creating a reset token:
//
//    publishEvent("password.reset", {
//      email:    user.email,
//      name:     user.name,
//      resetUrl: `${process.env.CLIENT_URL}/reset-password/${resetToken}`,
//    });
// ─────────────────────────────────────────────────────────────
