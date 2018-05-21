import * as express from 'express';
import { apiPrefix } from 'common/constants';
import * as path from 'path';

export function registerApi(app: express.Application, register: Function): void {
    const router = express.Router();
    register(router);
    app.use(apiPrefix, router);
}

export function registerApp(app: express.Application, register: Function): void {
    const appRouter = express.Router();
    register(appRouter);
    app.use('/', appRouter);
}

export function setupApp(): express.Application {
    const app = express();
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.locals.req = req;
        next();
    });
    app.use('/static', express.static(path.join(__dirname, '../../static')));
    app.use('/dist', express.static(path.join(__dirname, '../../dist')));
    app.use('/tmp', express.static('tmp'));
    return app;
}
