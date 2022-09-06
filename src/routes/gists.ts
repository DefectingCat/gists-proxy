import { Router, Request } from 'express';
import $ax from '../utils/axios';
import redis from '../utils/redis';

const router = Router();
// const expireTime = 60 * 60 * 24; // one day.
const expireTime = isNaN(Number(process.env.EXPIRE_TIME))
    ? 60 * 60 * 24
    : Number(process.env.EXPIRE_TIME);

const fetchNew = async (
    req: Request,
    key: string,
    statusKey: string,
    headerKey: string
) => {
    const { query, method } = req;
    const { host, ...headers } = req.headers;

    try {
        const result = await $ax(req.path, {
            headers: headers as {},
            params: query,
            method,
        });
        await redis.setex(key, expireTime, JSON.stringify(result.data));
        await redis.setex(statusKey, expireTime, result.status);
        await redis.setex(
            headerKey,
            expireTime,
            JSON.stringify(result.headers)
        );
        return {
            headers: JSON.stringify(result.headers),
            status: result.status,
            data: result.data,
        };
    } catch (err) {
        if ('response' in (err as {})) {
            const { response } = err as any;
            console.log(response);
            return {
                headers: JSON.stringify(response.headers),
                status: response.status,
                data: response.data,
            };
        } else {
            return {
                headers: '{}',
                status: 404,
                data: {},
            };
        }
    }
};

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

    return token
        ? await fetchNew(req, key, statusKey, headerKey)
        : {
              headers: '{}',
              status: 403,
              data: {
                  message: 'Has no token and no cache.',
              },
          };
};

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
