import Redis from 'ioredis';
import { config } from 'dotenv';

config();
const host = process.env.REDIS_HOST ?? '127.0.0.1';
const port = Number(process.env.REDIS_PORT) ?? 6379;
const db = Number(process.env.REDIS_DB) ?? 0;

const redis = new Redis({
    host,
    port,
    db,
});

export default redis;
