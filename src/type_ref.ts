import { Injector } from './di';
import { FieldRef, mapFieldMeta , FieldResolver} from './fields';
import { MethodFieldRef } from './method_field';
import { GrappRef } from './grapp_ref';
import { getTypeMeta, TypeMeta, TypeTarget, TypeInstance } from './type';

export const DOC_DATA = Symbol('DOC_DATA');

export class TypeRef<I extends TypeInstance = TypeInstance> {
  injector: Injector;
  fields: Map<string, FieldRef>;

  get selector() { return this.meta.selector; }

  constructor(public grappRef: GrappRef, public target: TypeTarget, public meta: TypeMeta) {
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

  instanciate(payload: { [key: string]: any }): TypeInstance {
    const instance: TypeInstance = this.injector.resolveAndInstantiate(this.target);
    for (const [key, fieldRef] of this.fields)
      if (fieldRef.defineProperty) fieldRef.defineProperty(instance);
    return instance;
  }
}
