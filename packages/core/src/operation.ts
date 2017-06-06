import 'reflect-metadata';
import { get as stackTrace } from 'stack-trace';

import { Injector, Provider } from './di';

const OPERATION_META_TOKEN = 'grapp:operation';

export interface OperationParams {
  selector?: string;
  providers?: Provider[];
}

export interface OperationMeta extends OperationParams {
  opeType: 'Query'|'Mutation';
  selector: string;
}

export interface IOperation {
  resolve(
    args?: { [key: string]: any },
    context?: { [key: string]: any },
    info?: { [key: string]: any }
  )
}

export function Operation(
  opeType: 'Query'|'Mutation',
  params: OperationParams = {}
): ClassDecorator {
  return function OperationDecorator(opeTarget: any) {
    let selector = params.selector;
    if (!params.selector) {
      const match = (<string>opeTarget.name || '').match(/^([A-Z][a-zA-Z0-9]+)(Query|Mutation)$/);
      if (!match) throw new Error('You must provide a selector or respect the Type pattern');
      selector = match[1].toLowerCase();
    }
    const opeMeta: OperationMeta = {opeType, selector, ...params};
    Reflect.defineMetadata(OPERATION_META_TOKEN, opeMeta, opeTarget);
  }
}

export function Query(params: OperationParams = {}) {
  return Operation('Query', params);
}

export function Mutation(params: OperationParams = {}) {
  return Operation('Mutation', params);
}

export function getOperationMeta(opeTarget: any): OperationMeta {
  return Reflect.getMetadata(OPERATION_META_TOKEN, opeTarget);
}
