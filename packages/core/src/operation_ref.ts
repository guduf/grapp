import { Injector } from './di';
import { DocRef } from './doc_ref';
import { DocStorage } from './doc_storage';
import { GrappRef } from './grapp_ref';
import {
  GenericOperation,
  getOperationMeta,
  OperationMeta,
  OperationTarget
} from './operation';
import { getDocOperationMeta } from './doc_operation';

export class OperationRef {
  constructor(private _grappRef: GrappRef, public target: OperationTarget) {
    if (!(this.meta = getOperationMeta(target))) throw new TypeError(`opeTarget has no meta`);
    const docTarget = getDocOperationMeta(target);
    if (docTarget && !(this._docRef = this._grappRef.getDoc(docTarget)))
      throw new Error(`docTarget(${docTarget.name}) is not referenced`);
  }
  meta: OperationMeta;
  async resolve(args, context, info) {
    if (!this._instance) await this._instanciate();
    const func = this._instance[this.meta.kind === 'Query' ? 'query' : 'mutate'];
    if (!func) throw new Error(`${this.meta.kind}(${this.target.name}) has no resolve method`);
    return func.call(this._instance, args, context, info);
  }
  private _docRef: DocRef;
  private _instance: GenericOperation;
  private _instanciate(): Promise<void> {
    if (this._instance) return;
    try {
      const providers = [...this.meta.providers];
      if (this._docRef) {
        providers.push({provide: DocStorage, useValue: this._docRef.storage});
      }
      const injector = Injector.resolveAndCreate(providers, this._grappRef.injector);
      this._instance = injector.resolveAndInstantiate(<any>this.target);
    } catch (err) {
      console.error(err.message);
      throw new Error(`Failed to instanciate Operation(${this.target.name})`)
    }
  }
}
