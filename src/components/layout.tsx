import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mountPoints } from 'common/mount-points';

export interface Props {
}

export interface State {
}

export class Layout extends React.Component<Props, State> {
    public render() {
        return (
            <html lang="en">
            <head>
                <title>Graphs</title>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500"/>
                <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
            </head>
            <body>
            <main id={mountPoints.APP}/>
            </body>
            </html>
        );
    }
}

export function render(): string {
    return renderToStaticMarkup(<Layout/>);
}
