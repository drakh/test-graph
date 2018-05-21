import * as fs from 'fs-extra';
import { wrap } from 'async-middleware';
import { NextFunction, Request, Response, Router } from 'express';
import { baseDir } from 'common/constants';
import { nodeId, NodeItem, NodeRelation, RawData } from 'common/types';

async function loadRawData(): Promise<RawData> {
    const fileName = `${baseDir}/10000.json`;
    const data: RawData = await fs.readJson(fileName);
    return data;
}

async function simlifyData(): Promise<NodeItem[]> {
    const originalData = await loadRawData();
    const relationsMap = new Map<nodeId, NodeRelation[]>();
    originalData.edges.map(edge => {
        const relation = relationsMap.get(edge.data.source) || [];
        relation.push({
            targetId: edge.data.target,
            label: edge.data.label,
            weight: 1, // just dummy weight
        });
        relationsMap.set(edge.data.source, relation);
    });
    const nodes: NodeItem[] = originalData.nodes.map(node => {
        return {
            id: node.data.id,
            data: {
                wallets: node.data.wallets,
                label: node.data.label,
            },
            position: node.position,
            targets: relationsMap.get(node.data.id),
        };
    });
    return nodes;
}

export async function serveRawData(_req: Request, res: Response, _next: NextFunction) {
    // this form of data should be returned by server
    const data = await simlifyData();
    res.json(data);
}

export function register(app: Router): void {
    const router = Router();
    router.get('/', wrap(serveRawData));
    app.use('/nodes', router);
}
