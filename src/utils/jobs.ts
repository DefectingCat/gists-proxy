import schedule from 'node-schedule';
import { CustomReq, fetchNew, cacheNew, requestKey } from './fetcher';
import redis from './redis';
import { sleep } from './sleep';

export const updateCache = async () => {
    const rule = new schedule.RecurrenceRule();
    rule.minute = 30;

    const job = schedule.scheduleJob(rule, async () => {
        const reqs: CustomReq[] = JSON.parse(
            (await redis.get(requestKey)) ?? '[]'
        );
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

        await Promise.all(reqs.map(callback));
        console.log(`Update cache! - ${new Date()}`);
    });
};
