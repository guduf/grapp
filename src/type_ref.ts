import { Injector } from './di';
import { FieldRef, mapFieldMeta , FieldResolver} from './fields';
import { GrappRef } from './grapp_ref';
import { getTypeMeta, TypeMeta, TypeTarget, TypeInstance } from './type';
import { GrappRoot } from './root';
import { ObjectTypeDefinitionNode } from 'graphql';

export const DOC_DATA = Symbol('DOC_DATA');

export class TypeRef<I extends TypeInstance = TypeInstance, M extends TypeMeta = TypeMeta> {
  fields: Map<string, FieldRef>;

  get root(): GrappRoot { return this.grappRef.root; }
  get selector(): string { return this.meta.selector; }

  constructor(
    public grappRef: GrappRef,
    public meta: M,
    definition: ObjectTypeDefinitionNode
  ) {
    const providers = [...meta.providers];
    const fields = new Map<string, FieldRef>();
    const fieldsMeta = mapFieldMeta(meta.target);
    const methodKeys = Object.getOwnPropertyNames(meta.target.prototype).filter(key => {
      if (['constructor'].indexOf(key) >= 0) return false;
      if (key[0] === '_') return false;
      return true;
    });
    for (const key of methodKeys) {
      let fieldRef: FieldRef;
      try {
        fieldRef = new FieldRef(this, key, meta.target.prototype[key]);
      } catch (err) {
        console.error(err);
        throw new Error('Failed to reference Field: ' + key);
      }
      fields.set(key, fieldRef)
    }
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
    const injector = this.grappRef.injector.resolveAndCreateChild([...this.meta.providers]);
    const instance: I = injector.resolveAndInstantiate(this.meta.target);
    for (const [key, fieldRef] of this.fields) if (fieldRef.defineValue)
      Object.defineProperty(instance, key, {
        get: fieldRef.defineValue(instance),
        enumerable: true,
        configurable: false
       });
    return instance;
  }
}
