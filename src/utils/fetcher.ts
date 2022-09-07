import { Request } from 'express';
import $ax from '../utils/axios';
import redis from '../utils/redis';

// const expireTime = 60 * 60 * 24; // one day.
const expireTime = isNaN(Number(process.env.EXPIRE_TIME))
    ? 60 * 60 * 24
    : Number(process.env.EXPIRE_TIME);
export const requestKey = 'requests';

export type CustomReq = {
    query: Request['query'];
    method: string;
    path: string;
    [key: string]: any;
};
// & Omit<IncomingHttpHeaders, 'host'>;

/**
 * Cache all request information for renew.
 * @param req
 * @returns
 */
export const saveRequest = async (req: CustomReq) => {
    const reqs: CustomReq[] = JSON.parse((await redis.get(requestKey)) ?? '[]');
    reqs.push(req);
    return await redis.set(requestKey, JSON.stringify(reqs));
};

/**
 * Cache the new data into redis.
 * @param key
 * @param statusKey
 * @param headerKey
 * @param data
 * @param status
 * @param headers
 */
export const cacheNew = async (
    key: string,
    statusKey: string,
    headerKey: string,
    data: string,
    status: number,
    headers: string
) => {
    await redis.setex(key, expireTime, data);
    await redis.setex(statusKey, expireTime, status);
    await redis.setex(headerKey, expireTime, headers);
};

/**
 * Fetch new gists from github.
 * @param req
 * @returns
 */
export const fetchNew = async (req: CustomReq) => {
    const { query, method, ...headers } = req;

    try {
        const result = await $ax(req.path, {
            headers: headers as {},
            params: query,
            method,
        });
        return {
            headers: JSON.stringify(result.headers),
            status: result.status,
            data: result.data,
        };
    } catch (err) {
        console.log(err);
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
                status: 500,
                data: {},
            };
        }
    }
};
