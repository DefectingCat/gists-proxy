import express from 'express';
import expressWinston from 'express-winston';
import helmet from 'helmet';
import { updateCache } from './utils/jobs';
import winston from 'winston';
import gistsRouter from './routes/gists';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
}
app.use(
    expressWinston.logger({
        transports: [new winston.transports.Console()],
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.json()
        ),
    })
);

app.use(gistsRouter);

app.use(
    expressWinston.errorLogger({
        transports: [new winston.transports.Console()],
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.json()
        ),
    })
);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Auto update.
updateCache();

// Export default
export default app;