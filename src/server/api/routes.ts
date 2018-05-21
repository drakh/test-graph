import { wrap } from 'async-middleware';
import { Router, Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as fs from 'fs-extra';

export async function serveData(_req: Request, res: Response, _next: NextFunction) {
    const fileName = path.join(__dirname, '../../../data/10000.json');
    const data = await fs.readJson(fileName);
    res.json(data);
}

export function register(app: Router): void {
    const router = Router();
    router.get('/', wrap(serveData));
    app.use('/nodes', router);
}
