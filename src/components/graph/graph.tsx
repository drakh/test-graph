import * as React from 'react';
import DeckGL, { COORDINATE_SYSTEM, LineLayer, OrthographicViewport, ScatterplotLayer } from 'deck.gl';
// import { forceCenter, forceLink, forceManyBody, forceSimulation } from 'd3-force';
import { nodeId, NodeItem } from '../../common/types';
import { api } from './client/api';

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

function numberMap(o: { n: number, in_min: number, in_max: number, out_min: number, out_max: number }): number {
    return (o.n - o.in_min) * (o.out_max - o.out_min) / (o.in_max - o.in_min) + o.out_min;
}

export interface Props {
}

export interface State {
    loaded: boolean;
    data: NodeItem[];
    scatterLayer?: ScatterplotLayer;
    lineLayer?: LineLayer;
    bounds?: Bounds;
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

/*
function generateSimulation(nodes: NodeItem[]) {
    // const maxSteps = 5;
    // const width = size;
    // const height = size;
    // const strength = 5;
    if (!data) {
        return {nodes: [], links: []};
    }
    // copy the data
    const nodes = data;
    console.info(nodes);
    // const links = data.links.map(d => ({...d}));
    // build the simuatation
    const simulation = forceSimulation(nodes);
        .force('link', forceLink().id(d => d.id))
        .force('charge', forceManyBody().strength(strength))
        .force('center', forceCenter(width / 2, height / 2))
        .stop();

    simulation.force('link').links(links);

    const upperBound = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay()));
    for (let i = 0; i < Math.min(maxSteps, upperBound); ++i) {
        simulation.tick();
    }

    return {nodes, links};
}
*/
export class Graph extends React.Component<Props, State> {
    private nodeMap: Map<nodeId, NodeItem>;

    public constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            data: [],
        };
    }

    public async componentDidMount() {
        await this.load();
    }

    public render() {
        const {loaded, scatterLayer, lineLayer} = this.state;
        const layers = loaded === true ? [lineLayer, scatterLayer] : [];
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
        this.nodeMap = new Map<nodeId, NodeItem>();
        const bounds: Bounds = {
            x_min: 0,
            x_max: 0,
            y_min: 0,
            y_max: 0,
        };
        // build quick nodes lookup
        const ids: nodeId[] = nodes.map((node, i) => {
            this.nodeMap.set(node.id, node);
            if (i === 0) {
                bounds.x_max = node.position.x;
                bounds.x_min = node.position.x;
                bounds.y_max = node.position.y;
                bounds.y_min = node.position.y;
            }
            else {
                if (node.position.x > bounds.x_max) {
                    bounds.x_max = node.position.x;
                }
                if (node.position.x < bounds.x_min) {
                    bounds.x_min = node.position.x;
                }
                if (node.position.y > bounds.y_max) {
                    bounds.y_max = node.position.y;
                }
                if (node.position.y < bounds.y_min) {
                    bounds.y_min = node.position.y;
                }
            }
            return node.id;
        });
        // we have some non existent links so this is why we do edges here;
        const lines: NodeLink[] = [];
        ids.forEach(id => {
            const node = this.nodeMap.get(id);
            if (node) {
                const targets = node.targets ? Array.from(Object.keys(node.targets)) : [];
                targets.forEach(targetId => {
                    if (this.nodeMap.get(targetId)) {
                        // only create link when both source and target node exists
                        lines.push({
                            source: id,
                            target: targetId,
                        });
                    }
                });
            }
        });

        // generateSimulation(nodes);

        const scatterPlot = new ScatterplotLayer({
            projectionMode: COORDINATE_SYSTEM.IDENTITY,
            coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
            autoHighlight: true,
            id: 'scatterplot-layer',
            data: ids,
            pickable: true,
            radiusScale: 1.5,
            radiusMinPixels: 10,
            radiusMaxPixels: 20,
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
            bounds: bounds,
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
        const node = this.nodeMap.get(id);
        return node.data.wallets ? node.data.wallets.length : 1;
    }

    private getPosition(id: nodeId): number[] {
        const half = (size / 2) - 80;
        const {bounds} = this.state;
        const node = this.nodeMap.get(id);
        const coords = [
            numberMap({
                n: node.position.x,
                in_min: bounds.x_min,
                in_max: bounds.x_max,
                out_min: -half,
                out_max: half,
            })
            ,
            numberMap({
                n: node.position.y,
                in_min: bounds.y_min,
                in_max: bounds.y_max,
                out_min: -half,
                out_max: half,
            }), 0];
        return coords;
    }
}
