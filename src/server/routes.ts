import { wrap } from 'async-middleware';
import { Router, Response, Request, NextFunction } from 'express';

export async function renderLayout(_req: Request, res: Response, _next: NextFunction) {
    const layout = await import('../components/layout');
    const html = layout.render();
    res.send(html);
}

export function register(app: Router): void {
    const router = Router();
    router.get('/', wrap(renderLayout));
    app.use('/', router);
}
