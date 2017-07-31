import 'reflect-metadata';
import { get as stackTrace } from 'stack-trace';

import { Resolver } from './core';
import { Injector, Provider } from './di';
import { GrappRef } from './grapp_ref';

const OPERATION_META_TOKEN = 'grapp:operation';

export interface OperationParams {
  selector?: string;
  providers?: Provider[];
}

export interface OperationMeta extends OperationParams {
  kind: 'Query'|'Mutation';
  selector: string;
}

export function Operation(
  kind: 'Query'|'Mutation',
  params: OperationParams = {}
): ClassDecorator {
  return function OperationDecorator(opeTarget: any) {
    let selector = params.selector;
    if (!params.selector) {
      const match = (<string>opeTarget.name || '').match(/^([A-Z][a-zA-Z0-9]+)(Query|Mutation)$/);
      if (!match) throw new Error('You must provide a selector or respect the Type pattern');
      selector = match[1][0].toLowerCase() + match[1].slice(1);
    }
    const opeMeta: OperationMeta = {kind, selector, providers: params.providers || []};
    Reflect.defineMetadata(OPERATION_META_TOKEN, opeMeta, opeTarget);
  }
}

export function Query(params: OperationParams = {}) { return Operation('Query', params); }
export function Mutation(params: OperationParams = {}) { return Operation('Mutation', params); }

export abstract class GenericQuery { query: Resolver<any, any>; }
export abstract class GenericMutation { mutate: Resolver<any, any>; }
export type GenericOperation = GenericQuery|GenericMutation;
export type OperationTarget = any;

export function getOperationMeta(opeTarget: OperationTarget): OperationMeta {
  return Reflect.getMetadata(OPERATION_META_TOKEN, opeTarget);
}
