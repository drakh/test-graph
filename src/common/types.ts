export type wallet = string;
export type nodeId = string;
export type edgeWeight = number;
export type coordinate = number;

export interface NodeData {
    wallets: wallet[];
    label: string;
}

export interface NodeRelation {
    targetId: nodeId;
    weight: edgeWeight;
    label: string;
}

export interface Coordinates {
    x: coordinate;
    y: coordinate;
}

export interface NodeItem {
    id: nodeId;
    data: NodeData;
    position: Coordinates;
    targets: NodeRelation[];
}

export enum nodeGroup {
    nodes = 'nodes',
    edges = 'edges',
}

export interface RawNode {
    data: {
        id: string;
        wallets: string[];
        label: string;
    };
    position: {
        x: number;
        y: number;
    };
    group: nodeGroup.nodes;
    removed: boolean;
    selected: boolean;
    selectable: boolean;
    locked: boolean;
    grabbable: boolean;
    classes: string;
}

export interface RawEdge {
    data: {
        source: string;
        target: string;
        label: string;
        id: string;
    };
    position: {};
    group: nodeGroup.edges;
    removed: boolean;
    selected: boolean;
    selectable: boolean;
    locked: boolean;
    grabbable: boolean;
    classes: string;
}

export interface RawData {
    [nodeGroup.nodes]: RawNode[];
    [nodeGroup.edges]: RawEdge[];
}
