import Redis from "ioredis";
import { env } from "@/config/env.js";

let _redis: Redis | null = null;

export function getRedis(): Redis {
    if (!_redis) {
        _redis = new Redis(env().REDIS_URL, {
            maxRetriesPerRequest: null, // required by BullMQ
            enableReadyCheck: false,
        });
    }
    return _redis;
}

export async function closeRedis(): Promise<void> {
    if (_redis) {
        await _redis.quit();
        _redis = null;
    }
}
