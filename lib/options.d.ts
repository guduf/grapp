import * as WebSocket from 'ws';
import { OperationMessage } from 'subscriptions-transport-ws/dist/server';
export declare const GRAPP_OPERATIONS: symbol;
export declare type GrappOperations = Map<string, Function>;
export declare function onConnect(connectionParams: Object, ws: WebSocket): {
    ws: any;
};
export declare function onOperation({id, payload}: OperationMessage, params: {
    [key: string]: any;
}, ws: WebSocket): {
    context: any;
};
export declare function onOperationComplete(ws: WebSocket, id: string): void;
export declare function onDisconnect(ws: WebSocket): void;
