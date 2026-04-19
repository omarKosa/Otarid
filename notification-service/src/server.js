require("dotenv").config();
const { startConsumer } = require("./consumers/eventConsumer");

console.log("[Notification Service] Starting up...");

startConsumer().catch((err) => {
  console.error("[Notification Service] Fatal error:", err.message);
  process.exit(1);
});
