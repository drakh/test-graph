import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

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
            </head>
            <body>
            </body>
            </html>
        );
    }
}

export function render(): string {
    return renderToStaticMarkup(<Layout/>);
}
