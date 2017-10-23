import { Provider } from './di';
import { OperationRef } from './operation_ref';
import { TypeMeta, TypeParams, TypeTarget, setTypeMeta } from './type';
import { TypeRef } from './type_ref';

export type OperationKind = 'Mutation'|'Query'|'Subscription';
export const OPERATION_KINDS: ['Mutation', 'Query', 'Subscription'] = ['Mutation', 'Query', 'Subscription'];

export interface OperationParams {
  selector?: string
  providers?: Provider[]
}

export class OperationMeta extends TypeMeta {
  constructor(target: TypeTarget, public kind: OperationKind, params: OperationParams) {
    super(target, params, <typeof TypeRef>OperationRef);
  }
}

export function decorateOperation(
  kind: OperationKind,
  params: OperationParams = {}
): ClassDecorator {
  return function operationDecorator(target: TypeTarget) {
    setTypeMeta(target, new OperationMeta(target, kind, params));
  }
}

export function decorateMutation(params: OperationParams = {}): ClassDecorator {
  return decorateOperation('Mutation', params);
}

export function decorateQuery(params: OperationParams = {}): ClassDecorator {
  return decorateOperation('Query', params);
}

export function decorateSubscription(params: OperationParams = {}): ClassDecorator {
  return decorateOperation('Subscription', params);
}
