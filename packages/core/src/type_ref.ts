import { TypeMeta } from './type';
import { Injector, Provider, ReflectiveInjector } from './di';

export class TypeRef<T = any> {
  get instance() { return this._instance; }
  get selector() { return this._selector; }
  private _selector: string;
  private _instance: T;
  constructor(
    private _moduleInjector: Injector,
    protected _typeCtor: any,
    meta: TypeMeta
  ) {
    this._selector = meta.selector;
    const injector = ReflectiveInjector.resolveAndCreate(meta.providers || [], _moduleInjector);
    this._instance = injector.resolveAndInstantiate(_typeCtor);
  }
}
