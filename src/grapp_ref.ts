import {
  buildASTSchema,
  DefinitionNode,
  DocumentNode,
  GraphQLResolveInfo,
  GraphQLSchema,
  FieldDefinitionNode,
  ObjectTypeDefinitionNode,
  NamedTypeNode,
  GraphQLFieldResolver,
  parse as parseSchema
} from 'graphql';

import { GrappRoot } from './bootstrap';
import { Db, Collection } from './db';
import { Injector, Provider, COLLECTION } from './di';
import { FieldResolver } from './fields';
import { TypeInstance } from './type';
import { TypeRef } from './type_ref';
import { getGrappMeta, GrappMeta, GrappTarget } from './grapp';

export interface GraphQLResolver<T = any> {
  (
    args: { [key: string]: any },
    context: { [key: string]: any },
    info: GraphQLResolveInfo
  ): T|Promise<T>
}

export interface GrappSchemaDefs {
  query: FieldDefinitionNode[]
  mutation: FieldDefinitionNode[]
  types: ObjectTypeDefinitionNode[]
  misc: DefinitionNode[]
}

export class GrappRef {
  collection: Collection;
  typeRefs: Map<string, TypeRef>;
  meta: GrappMeta;
  imports: GrappRef[];
  injector: Injector;

  constructor(target: GrappTarget, public root: GrappRoot) {
    this.meta = getGrappMeta(target);
    if (typeof this.meta !== 'object')
      throw new ReferenceError('The target has not been decorated as Grapp: ' + (target.name || typeof target));
    this.imports = this.meta.imports.map(grappTarget => this.root.registerGrappRef(grappTarget));
    const providers = [...this.meta.providers];
    if (this.meta.collection) {
      this.collection = this.root.db.collection(this.meta.collection);
      providers.push({provide: COLLECTION, useValue: this.collection});
    }
    this.injector = this.root.injector.resolveAndCreateChild(providers);
    const typeRefs = new Map<string, TypeRef>();
    for (const grappRef of this.imports) {
      for (const [key, typeRef] of grappRef.typeRefs) typeRefs.set(key, typeRef);
    }
    for (const typeTarget of this.meta.types) {
      let typeRef: TypeRef;
      try {
        typeRef = new TypeRef(this, typeTarget);
      } catch (err) {
        console.error(err);
        throw new Error(
          'Failed to reference Type: ' + (typeTarget.name ? typeTarget.name : typeof typeTarget)
        );
      }
      typeRefs.set(typeRef.selector, typeRef);
    }
    this.typeRefs = typeRefs;
  }

  parse(): { docNode: DocumentNode, resolverMap: { [key: string]: { [key: string]: any } } } {
    if (!this.meta.schema) return null;
    const docNode = parseSchema(this.meta.schema, {noLocation: true});
    const resolverMap: { [key: string]: { [key: string]: any } } = {};
    for (const def of docNode.definitions) if (def.kind === 'ObjectTypeDefinition') {
      if (['Mutation', 'Query'].indexOf(def.name.value) >= 0) {
        resolverMap[def.name.value] = {};
        for (const fieldDef of def.fields) {
          if (fieldDef.type.kind !== 'NamedType')
            throw new TypeError(def.name.value + ' fields must be NamedType');
          const typeRef = this.typeRefs.get(fieldDef.type.name.value);
          if (!typeRef)
            throw new ReferenceError('Cannot find type with selector' + fieldDef.type.name.value);
          resolverMap[def.name.value][fieldDef.name.value] = typeRef.instanciate({});
        }
      }
      else {
        const typeRef = this.typeRefs.get(def.name.value);
        if (!typeRef) throw new ReferenceError('Cannot find type with selector' + def.name.value);
        resolverMap[def.name.value] = {};
        for (const fieldDef of def.fields) {
          const fieldRef = typeRef.fields.get(fieldDef.name.value);
          if (!fieldRef) throw new Error(
            'Cannot find field with this name: ' + fieldDef.name.value + ' for ' + typeRef.selector
          );
          resolverMap[def.name.value][fieldDef.name.value] = fieldRef.resolve.bind(fieldRef);
        }
      }
    }
    return {docNode, resolverMap};
  }
}
