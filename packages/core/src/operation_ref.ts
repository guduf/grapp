import { Injector } from './di';
import { GrappRef } from './grapp_ref';
import {
  GenericOperation,
  getOperationMeta,
  OperationMeta,
  OperationTarget
} from './operation';

export class OperationRef {
  constructor(private _grappRef: GrappRef, public target: OperationTarget) {
    if (!(this.meta = getOperationMeta(target))) throw new TypeError(`opeTarget has no meta`);
  }
  meta: OperationMeta;
  async resolve(args, context, info) {
    if (!this._instance) await this._instanciate();
    const func = this._instance[this.meta.kind === 'Query' ? 'query' : 'mutate'];
    if (!func) throw new Error(`${this.meta.kind}(${this.target.name}) has no resolve method`);
    return func.call(this._instance, args, context, info);
  }
  private _instance: GenericOperation;
  private _instanciate(): Promise<void> {
    if (this._instance) return;
    try {
      const injector = Injector.resolveAndCreate(this.meta.providers, this._grappRef.injector);
      this._instance = injector.resolveAndInstantiate(<any>this.target);
    } catch (err) {
      console.error(err.message);
      throw new Error(`Failed to instanciate Operation(${this.target.name})`)
    }
  }
}
