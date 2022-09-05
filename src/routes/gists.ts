import { Router, Request } from 'express';
import $ax from '../utils/axios';
import redis from '../utils/redis';

const router = Router();
const getData = async (req: Request) => {
    const { params, method } = req;
    const { host, ...headers } = req.headers;
    const key = `${req.path}${JSON.stringify(params)}`;
    const cache = await redis.get(key);
    if (cache) return JSON.parse(cache);

    const result = (
        await $ax(req.path, {
            headers: headers as {},
            params,
            method,
        })
    ).data;
    await redis.setex(key, 600, JSON.stringify(result));
    return result;
};

router.get('/*', async (req, res) => {
    try {
        const result = await getData(req);
        console.log(result);
    } catch (err) {
        console.error(err);
    }
    res.send('Hello! gists');
});

export default router;
