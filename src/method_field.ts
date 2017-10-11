import { TypeInstance } from './type';
import { TypeRef } from './type_ref';
import { FieldRef } from './fields';

export class MethodFieldRef<
  I extends TypeInstance = TypeInstance,
  R  = any
> implements FieldRef<R> {
  constructor(
    public typeRef: TypeRef,
    public key: string,
    private _method: { (this: I, args: {}, context: {}, info: {}): R|Promise<R> }
  ) { }

  async resolve(instance: I, args, context, infos): Promise<R> {
    return this._method.call(instance, args, context, infos);
  }
}
