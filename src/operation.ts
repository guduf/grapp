import { Provider } from './di';
import { OperationRef } from './operation_ref';
import { TypeMeta, TypeParams, TypeTarget, setTypeMeta } from './type';
import { TypeRef } from './type_ref';

export type OperationKind = 'mutation'|'query';

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
  return decorateOperation('mutation', params);
}

export function decorateQuery(params: OperationParams = {}): ClassDecorator {
  return decorateOperation('query', params);
}
