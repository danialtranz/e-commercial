import "./config";
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "ecommerce-api",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

export const kafkaProducer = kafka.producer();
export const kafkaConsumer = kafka.consumer({ groupId: "order-worker-group" });

export async function connectKafkaProducer(): Promise<void> {
  await kafkaProducer.connect();
}

export async function connectKafkaConsumer(): Promise<void> {
  await kafkaConsumer.connect();
}
