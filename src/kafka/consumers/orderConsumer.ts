import { kafkaConsumer } from "../../config/kafka";
import { UserModel } from "../../models/modal";
import { emailService } from "../../utils/emailUtil";
import { TOPICS } from "../topics";

interface OrderCreatedEvent {
  event: string;
  orderId: string;
  userId: string;
  totalPrice: number;
  paymentMethod?: string;
  status?: string;
}

async function handleOrderCreated(event: OrderCreatedEvent) {
  const user = await UserModel.findByPk(event.userId, {
    attributes: ["id", "email"],
  });

  const email = user?.email?.trim();
  if (!email) {
    console.log(
      `[Kafka] Skip order confirmation email — user ${event.userId} has no email`,
    );
    return;
  }

  await emailService.sendOrderSuccessEmail(email, {
    orderId: event.orderId,
    totalPrice: event.totalPrice,
    paymentMethod: event.paymentMethod,
    status: event.status,
  });

  console.log(
    `[Kafka] Order confirmation email sent to ${email} for order ${event.orderId}`,
  );
}

export async function startOrderConsumer() {
  await kafkaConsumer.subscribe({
    topic: TOPICS.ORDER_EVENTS,
    fromBeginning: false,
  });

  await kafkaConsumer.run({
    eachMessage: async ({ message }) => {
      const raw = message.value?.toString();
      if (!raw) return;

      let event: OrderCreatedEvent;
      try {
        event = JSON.parse(raw);
      } catch {
        console.warn("[Kafka] Invalid message payload, skipped");
        return;
      }

      if (event.event !== "order.created") return;

      try {
        await handleOrderCreated(event);
      } catch (err) {
        console.error(
          `[Kafka] Failed to send order confirmation for ${event.orderId}:`,
          err,
        );
      }
    },
  });
}
