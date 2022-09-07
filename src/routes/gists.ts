import { Router, Request } from 'express';
import { sleep } from '../utils/sleep';
import {
    fetchNew,
    cacheNew,
    saveRequest,
    CustomReq,
    requestKey,
} from '../utils/fetcher';
import redis from '../utils/redis';

const router = Router();

const getData = async (req: Request) => {
    const { query } = req;
    const { host, ...headers } = req.headers;
    const token = headers.authorization;

    const key = `${req.path}${JSON.stringify(query)}`;
    const headerKey = `${key}-headers`;
    const statusKey = `${key}-status`;

    const cache = await redis.get(key);
    if (cache) {
        const headers = await redis.get(headerKey);
        const status = Number(await redis.get(statusKey));
        if (!headers || !status) throw new Error('no headrs');
        return {
            headers,
            status,
            data: cache,
        };
    }

    if (!token)
        return {
            headers: '{}',
            status: 403,
            data: {
                message: 'Has no token and no cache.',
            },
        };

    const customReq: CustomReq = {
        query: req.query,
        method: req.method,
        path: req.path,
        ...headers,
    };
    const result = await fetchNew(customReq);
    await cacheNew(
        key,
        statusKey,
        headerKey,
        JSON.stringify(result.data),
        result.status,
        result.headers
    );
    await saveRequest(customReq);
    return result;
};

router.post('/update', async (req, res) => {
    const reqs: CustomReq[] = JSON.parse((await redis.get(requestKey)) ?? '[]');
    const callback = async (req: CustomReq) => {
        const { query } = req;

        const key = `${req.path}${JSON.stringify(query)}`;
        const headerKey = `${key}-headers`;
        const statusKey = `${key}-status`;

        const result = await fetchNew(req);
        await cacheNew(
            key,
            statusKey,
            headerKey,
            JSON.stringify(result.data),
            result.status,
            result.headers
        );
        await sleep(10);
    };

    try {
        await Promise.all(reqs.map(callback));
        res.send('OK');
    } catch (err) {
        res.status(500).send('Not ok');
    }
});
router.post('/clean', async (req, res) => {
    const result = await redis.flushall();
    res.send(result);
});

router.all('/*', async (req, res) => {
    const result = await getData(req);
    res.header(JSON.parse(result.headers));
    res.status(result.status);
    res.setHeader(
        'content-length',
        result.data.length ?? result.data.toString().length
    );
    res.setHeader('transfer-encoding', '');
    res.send(result.data);
});

export default router;
