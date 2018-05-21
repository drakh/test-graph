import * as webpack from 'webpack';
import { CheckerPlugin, TsConfigPathsPlugin } from 'awesome-typescript-loader';
import { outPath } from '../common/constants';

const conf: webpack.Configuration = {
    entry: 'components/graph/app.tsx',
    output: {
        filename: 'app.js',
        path: outPath,
        publicPath: '/dist/',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        plugins: [new TsConfigPathsPlugin()],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/, loaders: [
                    'awesome-typescript-loader',
                ],
            },
        ],
    },
    plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(true),
        new CheckerPlugin(),
    ],
};
export default conf;
