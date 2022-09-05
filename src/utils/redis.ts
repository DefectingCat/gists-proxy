import Redis from 'ioredis';
import { config } from 'dotenv';

config();

const host = process.env.REDIS_HOST ?? '127.0.0.1';
const port = Number(process.env.REDIS_PORT);
const db = Number(process.env.REDIS_DB);

const redis = new Redis({
    host,
    port: isNaN(port) ? 6379 : port,
    db: isNaN(db) ? 0 : db,
});

export default redis;
