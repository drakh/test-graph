import * as React from 'react';
import { NodeItem } from '../../common/types';
import { api } from './client/api';

export interface Props {
}

export interface State {
    data: NodeItem[];
}

export class Graph extends React.Component<Props, State> {
    public constructor(props) {
        super(props);
        this.state = {
            data: [],
        };
    }

    public async componentDidMount() {
        await this.load();
    }

    public render() {
        return (<h1>Hello world</h1>);
    }

    private async load() {
        try {
            const res = await api.data.load();
            this.setState({
                data: res.data,
            });
        }
        catch (e) {
            console.error('Error loading data');
        }
    }
}
