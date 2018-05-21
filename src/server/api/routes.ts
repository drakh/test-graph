import { Router } from 'express';

export function register(app: Router): void {
    const router = Router();
    app.use('/', router);
}