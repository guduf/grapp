import { GrappRef } from './grapp_ref';
import { OperationMeta, OperationKind } from './operation';
import { TypeInstance, TypeTarget } from './type';
import { TypeRef } from './type_ref';

export class OperationRef<I = TypeInstance> extends TypeRef<I> {
  constructor(public grappRef: GrappRef, public target: TypeTarget, public meta: OperationMeta) {
    super(grappRef, target, meta);
  }

  get kind(): OperationKind { return this.meta.kind; }
  get instance(): I {
    return this._instance ? this._instance : (this._instance = this.instanciate({}));
  }

  private _instance: I
}
