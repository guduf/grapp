import { Injector } from './di';
import { FieldRef, mapFieldMeta , FieldResolver} from './fields';
import { MethodFieldRef } from './method_field';
import { GrappRef } from './grapp_ref';
import { getTypeMeta, TypeMeta, TypeTarget, TypeInstance } from './type';

export const DOC_DATA = Symbol('DOC_DATA');

export class TypeRef<I extends TypeInstance = TypeInstance> {
  id: string;
  injector: Injector;
  meta: TypeMeta;
  fields: Map<string, FieldRef>;
  operations: Map<string, Function>;
  collection: any;

  get selector() { return this.meta.selector; }

  constructor(public grappRef: GrappRef, public target: TypeTarget) {
    this.meta = getTypeMeta(target);
    if (!this.meta) throw new ReferenceError('The target has not been decorated as Type');
    const providers = [...this.meta.providers];
    this.injector = this.grappRef.injector.resolveAndCreateChild(providers);
    const fields = new Map<string, FieldRef>();
    const methodKeys = Object.getOwnPropertyNames(this.target.prototype).filter(key => {
      if (['constructor'].indexOf(key) >= 0) return false;
      if (key[0] === '_') return false;
      return true;
    });
    for (const key of methodKeys) {
      let fieldRef: FieldRef;
      try {
        fieldRef = new MethodFieldRef(this, key, this.target.prototype[key]);
      } catch (err) {
        console.error(err);
        throw new Error('Failed to reference Field: ' + key);
      }
      fields.set(key, fieldRef)
    }
    const fieldsMeta = mapFieldMeta(target);
    if (fieldsMeta) for (const [key, fieldMeta] of fieldsMeta) {
      let fieldRef: FieldRef;
      try {
        fieldRef = new fieldMeta.FieldRefClass(this, key, fieldMeta);
      } catch (err) {
        console.error(err);
        throw new Error('Failed to reference Field: ' + key);
      }
      fields.set(key, fieldRef);
    }
    this.fields = fields;
  }

  instanciate(payload: { [key: string]: any }): I {
    let instance: I;
    if (typeof this.meta.instanciate === 'function') instance = this.meta.instanciate<I>(this, payload);
    else instance = this.injector.resolveAndInstantiate(this.target);
    return instance;
  }
}
