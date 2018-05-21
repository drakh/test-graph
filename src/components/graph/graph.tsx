import * as React from 'react';
import DeckGL, { COORDINATE_SYSTEM, LineLayer, OrthographicViewport, ScatterplotLayer } from 'deck.gl';
// import { forceCenter, forceLink, forceManyBody, forceSimulation } from 'd3-force';
import { nodeId, NodeItem } from '../../common/types';
import { api } from './client/api';

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
    nodeMap: Map<nodeId, NodeItem>;
    scatterLayer?: ScatterplotLayer;
    arcLayer?: LineLayer;
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
    public constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            data: [],
            nodeMap: null,
        };
    }

    public async componentDidMount() {
        await this.load();
    }

    public render() {
        const {loaded, scatterLayer} = this.state;
        const layers = loaded === true ? [scatterLayer] : [];
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
            const map = new Map<nodeId, NodeItem>();
            const bounds: Bounds = {
                x_min: 0,
                x_max: 0,
                y_min: 0,
                y_max: 0,
            };
            const ids: nodeId[] = nodes.map((node, i) => {
                map.set(node.id, node);
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
            console.info(bounds);
            // generateSimulation(nodes);

            this.setState({
                ...this.state,
                loaded: true,
                data: nodes,
                nodeMap: map,
                bounds: bounds,
                scatterLayer: new ScatterplotLayer({
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
                    getColor: (d: nodeId) => this.getColor(d),
                }),
            });
        }
        catch (e) {
            console.error('Error loading data');
        }
    }

    private getColor(_id: nodeId): number[] {
        return [255, 140, 0];
    }

    private getRadius(id: nodeId): number {
        const node = this.state.nodeMap.get(id);
        return node.data.wallets ? node.data.wallets.length : 1;
    }

    private getPosition(id: nodeId): number[] {
        const {bounds, nodeMap} = this.state;
        const node = nodeMap.get(id);
        const coords = [
            numberMap({
                n: node.position.x,
                in_min: bounds.x_min,
                in_max: bounds.x_max,
                out_min: -size / 2,
                out_max: size / 2,
            })
            ,
            numberMap({
                n: node.position.y,
                in_min: bounds.y_min,
                in_max: bounds.y_max,
                out_min: -(size / 2),
                out_max: (size / 2),
            }), 0];
        return coords;
    }
}
