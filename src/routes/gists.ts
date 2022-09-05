import { Router, Request } from 'express';
import $ax from '../utils/axios';
import redis from '../utils/redis';

const router = Router();
const getData = async (req: Request) => {
    const { query, method } = req;
    const { host, ...headers } = req.headers;
    const key = `${req.path}${JSON.stringify(query)}`;
    const headerKey = `${key}-headers`;
    const cache = await redis.get(key);
    if (cache) {
        const headers = await redis.get(headerKey);
        if (!headers) throw new Error('no headrs');
        return {
            headers,
            data: cache,
        };
    }

    const result = await $ax(req.path, {
        headers: headers as {},
        params: query,

        method,
    });
    await redis.setex(key, 600, JSON.stringify(result.data));
    await redis.setex(headerKey, 600, JSON.stringify(result.headers));
    return {
        headers: JSON.stringify(result.headers),
        data: result.data,
    };
};

router.all('/*', async (req, res) => {
    try {
        const result = await getData(req);
        res.header(JSON.parse(result.headers));
        res.setHeader('content-length', result.data.length);
        res.setHeader('transfer-encoding', '');
        res.send(result.data);
    } catch (err) {
        console.error(err);
        res.status(404).send(JSON.stringify(err));
    }
});

export default router;
