import { Provider } from './di';
import { OperationRef } from './operation_ref';
import { TypeMeta, TypeParams, TypeTarget, setTypeMeta } from './type';

export interface OperationParams {
  providers?: Provider[]
}

export class OperationMeta extends TypeMeta {
  constructor(target: TypeTarget, public kind: 'mutation'|'query', params: OperationParams) {
    super(target, {...params, selector: `@${kind}`}, OperationRef);
  }
}

export function decorateOperation(kind: 'mutation'|'query', params: OperationParams = {}): ClassDecorator {
  return function oprationDecorator(target: TypeTarget) {
    setTypeMeta(target, new OperationMeta(target, kind, params));
  }
}

export function decorateMutation(params: OperationParams = {}): ClassDecorator {
  return decorateOperation('mutation', params);
}

export function decorateQuery(params: OperationParams = {}): ClassDecorator {
  return decorateOperation('query', params);
}
