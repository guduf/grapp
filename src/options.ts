import * as WebSocket from 'ws';

import {
  DocumentNode,
  ExecutionResult,
  GraphQLFieldResolver,
  GraphQLSchema
} from 'graphql';
import { OperationMessage } from 'subscriptions-transport-ws/dist/server';

export const GRAPP_OPERATIONS = Symbol('GRAPP_OPERATIONS');
export type GrappOperations = Map<string, Function>;

export function onConnect(connectionParams: Object, ws: WebSocket) {
  ws[GRAPP_OPERATIONS] = <GrappOperations>new Map<string, Function>();
  return {ws: ws};
}

export function onOperation({id, payload}: OperationMessage, params: { [key: string]: any }, ws: WebSocket) {
  const operations: GrappOperations = ws[GRAPP_OPERATIONS];
  let completeOperation: { (): void }
  let onSubscriptionComplete = new Promise(resolve => (completeOperation = resolve));
  operations.set(id, completeOperation);
  return {...params, context: {...params.context, onSubscriptionComplete}};
}

export function onOperationComplete(ws: WebSocket, id: string) {
  const operations: GrappOperations = ws[GRAPP_OPERATIONS];
  const completeOperation = operations.get(id);
  if (typeof completeOperation === 'function') completeOperation();
  operations.delete(id);
}

export function onDisconnect(ws: WebSocket) {
  const operations: GrappOperations = ws[GRAPP_OPERATIONS];
  if (typeof operations === 'undefined') {
    console.warn('WebSocket disconnected without operation references.');
    return;
  }
  for (const [, completeOperation] of operations)
    if (typeof completeOperation === 'function') completeOperation();
}
