/// <reference types="ws" />
import * as WebSocket from 'ws';
import { PubSub as BasePubSub } from 'graphql-subscriptions';
import { OperationMessage } from 'subscriptions-transport-ws/dist/server';
export declare class PubSub extends BasePubSub {
    constructor();
    completeOperation(ws: WebSocket, opId: string): void;
    connect(connectionParams: Object, ws: WebSocket): void;
    startOperation(msg: OperationMessage, params: {
        [key: string]: any;
    }, ws: WebSocket): OperationMessage;
    disconnect(ws: WebSocket): void;
}
