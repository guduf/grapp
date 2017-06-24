import { DocTarget } from './doc';
import { Operation, OperationParams, OperationTarget } from './operation';

export const DOC_OPERATION_META = Symbol('DOC_OPETATION_META');

export function DocOperation(
  kind: 'Query'|'Mutation',
  docTarget: DocTarget,
  params: OperationParams = {}
) {
  return function docOperationDecorator(opeTarget: OperationTarget) {
    Reflect.defineMetadata(DOC_OPERATION_META, docTarget, opeTarget);
    Operation(kind, params)(opeTarget);
  }
}

export function getDocOperationMeta(opeTarget: OperationTarget): DocTarget {
  return Reflect.getMetadata(DOC_OPERATION_META, opeTarget);
}

export function DocMutation(
  docTarget: DocTarget,
  params: OperationParams = {}
) {
  return DocOperation('Mutation', docTarget, params);
}

export function DocQuery(
  docTarget: DocTarget,
  params: OperationParams = {}
) {
  return DocOperation('Query', docTarget, params);
}
