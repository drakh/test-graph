import axios, { AxiosResponse } from 'axios';
import { NodeItem } from '../../../common/types';

export const api = {
    data: {
        async load(): Promise<AxiosResponse<NodeItem[]>> {
            return axios.get('/api/nodes');
        },
    },
};
