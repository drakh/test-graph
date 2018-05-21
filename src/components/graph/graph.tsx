import * as React from 'react';
import DeckGL, { COORDINATE_SYSTEM, LineLayer, OrthographicViewport, ScatterplotLayer } from 'deck.gl';
import { forceCenter, forceLink, forceManyBody, forceSimulation } from 'd3-force';
import { Coordinates, nodeId, NodeItem } from '../../common/types';
import { api } from './client/api';

export interface GraphNode {
    id: nodeId;
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
}

export interface NodeLink {
    source: nodeId;
    target: nodeId;
}

export interface Bounds {
    x_min: number;
    x_max: number;
    y_min: number;
    y_max: number;
}

export interface GraphLayout {
    bounds: Bounds;
    positions: Map<nodeId, Coordinates>;
}

function numberMap(o: { n: number, in_min: number, in_max: number, out_min: number, out_max: number }): number {
    return (o.n - o.in_min) * (o.out_max - o.out_min) / (o.in_max - o.in_min) + o.out_min;
}

export interface Props {
}

export interface State {
    loaded: boolean;
    data: NodeItem[];
    positions: Map<nodeId, Coordinates>;
    scatterLayer?: ScatterplotLayer;
    lineLayer?: LineLayer;
    bounds?: Bounds;
    nodeMap: Map<nodeId, NodeItem>;
}

const size = 1080;

const viewport = new OrthographicViewport({
    width: size,
    height: size,
    left: (-size / 2),
    top: (-size / 2),
    right: (size / 2),
    bottom: (size / 2),
});

export class Graph extends React.Component<Props, State> {
    public constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            positions: null,
            nodeMap: null,
            data: [],
        }
        ;
    }

    public async componentDidMount() {
        await this.load();
    }

    public render() {
        const {loaded, scatterLayer, lineLayer} = this.state;
        const layers = loaded === true ? [scatterLayer, lineLayer] : [];
        return (
            <div style={{
                width: size,
                height: size,
                position: 'relative',
            }}>
                <DeckGL
                    width={size}
                    height={size}
                    viewport={viewport}
                    layers={layers}
                />
            </div>
        );
    }

    private async load() {
        try {
            const res = await api.data.load();
            const nodes = res.data;
            this.prepareData(nodes);
        }
        catch (e) {
            console.error('Error loading data', e);
        }
    }

    private prepareData(nodes: NodeItem[]) {
        const nodeMap = new Map<nodeId, NodeItem>();
        // build quick nodes lookup
        const ids: nodeId[] = nodes.map((node) => {
            nodeMap.set(node.id, node);
            return node.id;
        });
        // we have some non existent links so this is why we do edges here;
        const lines: NodeLink[] = [];
        ids.forEach(sourceId => {
            const sourceNode = nodeMap.get(sourceId);
            if (sourceNode) {
                const targets = sourceNode.targets ? Array.from(Object.keys(sourceNode.targets)) : [];
                targets.forEach(targetId => {
                    if (nodeMap.get(targetId)) {
                        // only create link when both source and target node exists
                        lines.push({
                            source: sourceId,
                            target: targetId,
                        });
                    }
                    else {
                        // console.error('target non existant:', targetId, this.nodeMap.get(targetId));
                    }
                });
            }
        });

        const computed = this.computePositions(ids, lines);

        const scatterPlot = new ScatterplotLayer({
            projectionMode: COORDINATE_SYSTEM.IDENTITY,
            coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
            autoHighlight: true,
            id: 'scatterplot-layer',
            data: ids,
            pickable: true,
            radiusScale: 6,
            radiusMinPixels: 2,
            radiusMaxPixels: 4,
            getPosition: (d: nodeId) => this.getPosition(d),
            getRadius: (d: nodeId) => this.getRadius(d),
            getColor: () => this.getColor(),
        });

        const linePlot = new LineLayer({
            projectionMode: COORDINATE_SYSTEM.IDENTITY,
            coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
            id: 'edge-layer',
            data: lines,
            width: 2,
            getSourcePosition: (d: NodeLink) => this.getLinkSourcePos(d),
            getTargetPosition: (d: NodeLink) => this.getLinkTargetPos(d),
            getColor: () => this.getLinkColor(),
        });

        this.setState({
            ...this.state,
            loaded: true,
            data: nodes,
            nodeMap: nodeMap,
            bounds: computed.bounds,
            positions: computed.positions,
            scatterLayer: scatterPlot,
            lineLayer: linePlot,
        });
    }

    private getLinkSourcePos(d: NodeLink): number[] {
        const {source} = d;
        return this.getPosition(source);
    }

    private getLinkTargetPos(d: NodeLink): number[] {
        const {target} = d;
        return this.getPosition(target);
    }

    private getColor(): number[] {
        return [255, 140, 0];
    }

    private getLinkColor(): number[] {
        return [0, 0, 140];
    }

    private getRadius(id: nodeId): number {
        const {nodeMap} = this.state;
        const node = nodeMap.get(id);
        return node.data.wallets ? node.data.wallets.length : 1;
    }

    private getPosition(id: nodeId): number[] {
        const half = (size / 2) - 80;
        const {bounds, positions} = this.state;
        const pos = positions.get(id);
        const coords = [
            numberMap({
                n: pos.x,
                in_min: bounds.x_min,
                in_max: bounds.x_max,
                out_min: -half,
                out_max: half,
            })
            ,
            numberMap({
                n: pos.y,
                in_min: bounds.y_min,
                in_max: bounds.y_max,
                out_min: -half,
                out_max: half,
            }), 0];
        return coords;
    }

    private computePositions(ids: nodeId[], lines: NodeLink[]): GraphLayout {
        const nodes: GraphNode[] = ids.map((id) => {
            return {
                id: id,
            };
        });
        const edges = lines.map(line => {
            return {
                source: line.source,
                target: line.target,
                value: Math.round(Math.random() * 100),
            };
        });
        const simulation = forceSimulation(nodes)
            .force('link', forceLink().id(d => {
                return d['id'];
            }))
            .force('charge', forceManyBody().distanceMin(1).distanceMax(100))
            .force('center', forceCenter(0, 0))
            .stop();
        simulation.force('link', forceLink(edges).iterations(1).strength(0.5));
        simulation.alpha(0.2);
        simulation.alphaTarget(0.1);
        for (let i = 0; i < 10; i++) {
            simulation.tick();
        }
        const x: number[] = [];
        const y: number[] = [];
        const positions = new Map<nodeId, Coordinates>();
        nodes.forEach(node => {
            x.push(node.x);
            y.push(node.y);
            positions.set(node.id, {x: node.x, y: node.y});
        });
        const bounds: Bounds = {
            x_min: Math.min(...x),
            x_max: Math.max(...x),
            y_min: Math.min(...y),
            y_max: Math.max(...y),
        };
        return {
            bounds: bounds,
            positions: positions,
        };
    }
}
