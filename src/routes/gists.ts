import { Router } from 'express';
import $ax from '../utils/axios';

const router = Router();

router.get('/*', async (req, res) => {
    try {
        const { params } = req;
        const { host, ...headers } = req.headers;
        const result = await $ax.get(req.path, {
            headers: headers as {},
            params,
        });
        console.log(result);
    } catch (err) {
        console.error(err);
    }
    res.send('Hello! gists');
});

export default router;
