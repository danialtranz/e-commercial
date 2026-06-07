import "./config";
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6381,
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export async function connectRedis(): Promise<void> {
  await redis.ping();
}

/** Lưu object theo key. `ttlSeconds` tùy chọn — hết hạn sau N giây. */
export async function put(
  key: string,
  value: object,
  ttlSeconds?: number,
): Promise<void> {
  const serialized = JSON.stringify(value);
  if (ttlSeconds != null && ttlSeconds > 0) {
    await redis.set(key, serialized, "EX", ttlSeconds);
    return;
  }
  await redis.set(key, serialized);
}

/** Đọc giá trị string từ Redis. */
export async function get(key: string): Promise<string | null> {
  return redis.get(key);
}

/** Lưu string kèm TTL (giây). */
export async function setString(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<void> {
  await redis.set(key, value, "EX", ttlSeconds);
}

/** Kiểm tra key có tồn tại hay không. */
export async function exists(key: string): Promise<boolean> {
  return (await redis.exists(key)) === 1;
}

/** Xóa key khỏi Redis. Trả về số key đã xóa (0 hoặc 1). */
export async function del(key: string): Promise<number> {
  return redis.del(key);
}

/**
 * Kiểm tra key đã hết hạn hoặc không tồn tại.
 * - true: key không có hoặc TTL = 0
 * - false: key còn tồn tại (kể cả key không set expire)
 */
export async function isExpired(key: string): Promise<boolean> {
  const ttl = await redis.ttl(key);
  if (ttl === -2) return true;
  if (ttl === 0) return true;
  return false;
}

export default redis;
