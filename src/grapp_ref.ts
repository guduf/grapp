import {
  buildASTSchema,
  DefinitionNode,
  DocumentNode,
  GraphQLResolveInfo,
  GraphQLSchema,
  FieldDefinitionNode,
  ObjectTypeDefinitionNode,
  NamedTypeNode,
  NonNullTypeNode,
  GraphQLFieldResolver,
  parse as parseSchema
} from 'graphql';

import { GrappRoot } from './root';
import { Db, Collection } from './db';
import { Injector, Provider, COLLECTION } from './di';
import { FieldRef, FieldResolver } from './fields';
import { getTypeMeta, TypeInstance } from './type';
import { TypeRef } from './type_ref';
import { getGrappMeta, GrappMeta, GrappTarget } from './grapp';
import { OperationMeta } from './operation';
import { OperationRef } from './operation_ref';

export interface GrappSchemaDefs {
  query: FieldDefinitionNode[]
  mutation: FieldDefinitionNode[]
  types: ObjectTypeDefinitionNode[]
  misc: DefinitionNode[]
}

export class GrappRef {
  collection: Collection;
  operationRefs: Set<OperationRef>;
  typeRefs: Map<string, TypeRef>;
  meta: GrappMeta;
  imports: GrappRef[];
  injector: Injector;

  constructor(public target: GrappTarget, public root: GrappRoot) {
    this.meta = getGrappMeta(target);
    if (typeof this.meta !== 'object') throw new ReferenceError(
      'The target has not been decorated as Grapp: ' + (target.name || typeof target)
    );
    this.imports = this.meta.imports.map(grappTarget => this.root.registerGrappRef(grappTarget));
    const providers = [...this.meta.providers];
    this.injector = this.root.injector.resolveAndCreateChild(providers);
    const typeRefs = new Map<string, TypeRef>();
    for (const grappRef of this.imports)
      for (const [key, typeRef] of grappRef.typeRefs) typeRefs.set(key, typeRef);
    for (const target of this.meta.types) {
      const meta = getTypeMeta(target);
      let typeRef: TypeRef;
      try {
        if (meta.TypeRefClass) typeRef = new meta.TypeRefClass(this, target, meta);
        else typeRef = new TypeRef(this, target, meta);
      } catch (err) {
        console.error(err);
        throw new Error(
          'Failed to reference Type: ' + (target.name ? target.name : typeof target)
        );
      }
      typeRefs.set(typeRef.selector, typeRef);
    }
    this.typeRefs = typeRefs;
    const operationRefs = new Set<OperationRef>();
    for (const target of this.meta.operations) {
      const meta = getTypeMeta<OperationMeta>(target);
      if (typeof this.meta !== 'object') throw new ReferenceError(
        'The target has not been decorated as Grapp: ' + (target.name || typeof target)
      );
      let operationRef: OperationRef
      try { operationRef = new OperationRef(this, target, meta); } catch (err) {
        console.error(err);
        throw new Error(
          'Failed to reference Type: ' + (target.name ? target.name : typeof target)
        );
      }
      operationRefs.add(operationRef);
    }
    this.operationRefs = operationRefs;
  }

  parse(): { docNode: DocumentNode, resolverMap: { [key: string]: { [key: string]: any } } } {
    if (!this.meta.schema) return null;
    const docNode = parseSchema(this.meta.schema, {noLocation: true});
    const resolverMap: { [key: string]: { [key: string]: any } } = {
      ...this.meta.resolvers
    };
    for (const def of docNode.definitions) if (def.kind === 'ObjectTypeDefinition') {
      if (['Mutation', 'Query'].indexOf(def.name.value) >= 0) {
        resolverMap[def.name.value] = {};
        for (const fieldDef of def.fields) {
          let operationInstance: TypeInstance;
          let fieldRef: FieldRef;
          for (const operationRef of this.operationRefs)
            if (operationRef.fields.has(fieldDef.name.value)) {
              operationInstance = operationRef.instanciate({});
              fieldRef = operationRef.fields.get(fieldDef.name.value);
              break;
            }
          if (fieldRef) {
            resolverMap[def.name.value][fieldDef.name.value] = (
              <GraphQLFieldResolver>(instance: any, args, context, info) => {
                return fieldRef.resolve(operationInstance, args, context, info);
              }
            );
          }
          else {
            if (fieldDef.type.kind !== 'NonNullType')
              throw new TypeError(def.name.value + ' fields must be NonNullType');
            const selector = (<NamedTypeNode>fieldDef.type.type).name.value;
            const typeRef = this.typeRefs.get(selector);
            if (!typeRef)
              throw new ReferenceError('Cannot find type with selector ' + selector);
            resolverMap[def.name.value][fieldDef.name.value] = () => typeRef.instanciate({});
          }
        }
      }
      else {
        const typeRef = this.typeRefs.get(def.name.value);
        if (!typeRef) throw new ReferenceError('Cannot find type with selector ' + def.name.value);
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
