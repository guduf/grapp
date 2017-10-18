import { GrappRef } from './grapp_ref';
import { OperationMeta } from './operation';
import { TypeInstance, TypeTarget } from './type';
import { TypeRef } from './type_ref';

export class OperationRef<I = TypeInstance> extends TypeRef {
  constructor(public grappRef: GrappRef, public target: TypeTarget, public meta: OperationMeta) {
    super(grappRef, target, meta);
  }
}
