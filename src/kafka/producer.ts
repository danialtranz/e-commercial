import { kafkaProducer } from "../config/kafka";
import { TOPICS } from "./topics";

export interface OrderCreatedPayload {
  orderId: string;
  userId: string;
  totalPrice: number;
  paymentMethod?: string;
  status?: string;
}

export async function publishOrderCreated(payload: OrderCreatedPayload) {
  await kafkaProducer.send({
    topic: TOPICS.ORDER_EVENTS,
    messages: [
      {
        key: payload.orderId,
        value: JSON.stringify({
          event: "order.created",
          ...payload,
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
}
