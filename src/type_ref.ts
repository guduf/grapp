import { Injector } from './di';
import { FieldMeta, mapFieldMeta } from './field';
import { FieldRef } from './field_ref';
import { GrappRef } from './grapp_ref';
import { getTypeMeta, TypeMeta, TypeTarget, TypeInstance } from './type';
import { GrappRoot } from './root';
import { ObjectTypeDefinitionNode, FieldDefinitionNode } from 'graphql';

export const DOC_DATA = Symbol('DOC_DATA');

export class TypeRef<I extends TypeInstance = TypeInstance, M extends TypeMeta = TypeMeta> {
  readonly fields: Map<string, FieldRef>;
  readonly injector: Injector;
  readonly target: TypeTarget;
  readonly selector: string;

  constructor(
    grappRef: GrappRef,
    meta: M,
    readonly definition: ObjectTypeDefinitionNode
  ) {
    this.injector = grappRef.injector.resolveAndCreateChild([...meta.providers]);
    this.fields = this._mapFieldDefinitions(definition.fields, meta.fields);
    this.selector = meta.selector;
  }

  instanciate(payload: { [key: string]: any }): I {
    const instance: I = this.injector.resolveAndInstantiate(this.target);
    for (const [key, fieldRef] of this.fields) if (fieldRef.defineValue)
      Object.defineProperty(instance, key, {
        get: fieldRef.defineValue(instance),
        enumerable: true,
        configurable: false
       });
    return instance;
  }

  private _mapFieldDefinitions(
    definitions: FieldDefinitionNode[],
    metaMap: Map<string, FieldMeta>
  ): Map<string, FieldRef> {
    const references = new Map<string, FieldRef>();
    for (const definition of definitions) {
      const key = definition.name.value;
      const meta = metaMap.get(key);
      if (!(meta instanceof FieldMeta)) throw new ReferenceError(
        `Failed to get field meta for field key: ${key}`
      );
      if (references.has(key)) throw new ReferenceError(
        `Duplicate meta field key: '${key}'`
      )
      let fieldRef: FieldRef;
      try { fieldRef = new meta.FieldRefClass(this, key, meta, definition); }
      catch (catched) {
        console.error(catched);
        throw new Error(`Failed to instanciate field reference '${key}': ${catched.message}`);
      }
      if (!(fieldRef instanceof FieldRef)) throw new TypeError(
        `Type reference with key '${key}' is not a instance of TypeRef`
      );
      references.set(key, fieldRef);
    }
    return references;
  }
}
