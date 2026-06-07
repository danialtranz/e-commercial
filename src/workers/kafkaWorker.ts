import "../config/config";
import sequelize from "../config/postgres";
import { connectKafkaConsumer } from "../config/kafka";
import { connectEmail } from "../utils/emailUtil";
import { startOrderConsumer } from "../kafka/consumers/orderConsumer";

async function main() {
  await sequelize.authenticate();
  console.log("Connected postgres!");

  await connectEmail();
  console.log("Connected email (SMTP)!");

  await connectKafkaConsumer();
  await startOrderConsumer();
  console.log("Kafka worker is running...");
}

main().catch((err) => {
  console.error("Kafka worker failed:", err);
  process.exit(1);
});
