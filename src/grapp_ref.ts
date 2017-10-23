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

import { Root } from './root';
import { Db, Collection } from './db';
import { Injector, Provider } from './di';
import { FieldRef, FieldSubscriptionResolver } from './fields';
import { getTypeMeta, TypeInstance, TypeTarget } from './type';
import { TypeRef } from './type_ref';
import { getGrappMeta, GrappMeta, GrappTarget } from './grapp';
import { OperationMeta, OperationKind, OPERATION_KINDS } from './operation';
import { OperationRef } from './operation_ref';

export interface GrappSchemaDefs {
  query: FieldDefinitionNode[]
  mutation: FieldDefinitionNode[]
  types: ObjectTypeDefinitionNode[]
  misc: DefinitionNode[]
}

export class GrappRef<M extends GrappMeta = GrappMeta> {
  collection: Collection;
  operationRefs: Set<OperationRef>;
  typeRefs: Map<string, TypeRef>;
  imports: GrappRef[];
  injector: Injector;

  constructor(public root: Root, public target: GrappTarget, public meta: M) {
    this.imports = this.meta.imports.map(grappTarget => this.root.registerGrappRef(grappTarget));
    const providers = [...this.meta.providers];
    this.injector = this.root.injector.resolveAndCreateChild(providers);
    const typeRefs = new Map<string, TypeRef>();
    for (const grappRef of this.imports)
      for (const [key, typeRef] of grappRef.typeRefs) typeRefs.set(key, typeRef);
    for (const target of this.meta.types) {
      const typeRef = this.referenceType(target);
      typeRefs.set(typeRef.selector, typeRef);
    }
    this.typeRefs = typeRefs;
    const operationRefs = new Set<OperationRef>();
    for (const target of this.meta.operations) {
      const operationRef = this.referenceType<OperationRef>(target);
      operationRefs.add(operationRef);
    }
    this.operationRefs = operationRefs;
  }

  referenceType<R extends TypeRef = TypeRef>(target: TypeTarget): R {
    const meta = getTypeMeta(target);
    if (!meta) throw new Error(
      'Failed to find meta for Type: ' + (target.name ? target.name : typeof target)
    )
    let typeRef: R;
    try { typeRef = <R>new meta.TypeRefClass(this, target, meta); } catch (err) {
      console.error(err);
      throw new Error(
        'Failed to reference Type: ' + (target.name ? target.name : typeof target)
      );
    }
    return typeRef;
  }

  parse(): { docNode: DocumentNode, resolverMap: { [key: string]: { [key: string]: any } } } {
    if (!this.meta.schema) return null;
    const docNode = parseSchema(this.meta.schema, {noLocation: true});
    const resolverMap: { [key: string]: { [key: string]: any } } = {
      ...this.meta.resolvers
    };
    for (const def of docNode.definitions) if (def.kind === 'ObjectTypeDefinition') {
      const selector = def.name.value;
      if (OPERATION_KINDS.indexOf(<OperationKind>selector) >= 0) {
        resolverMap[selector] = {};
        for (const fieldDef of def.fields) {
          let operationInstance: TypeInstance;
          let fieldRef: FieldRef;
          let resolver: any;
          for (const operationRef of this.operationRefs)
            if (operationRef.fields.has(fieldDef.name.value)) {
              operationInstance = operationRef.instance;
              fieldRef = operationRef.fields.get(fieldDef.name.value);
              break;
            }
          if (!fieldRef) throw new Error('Missing fieldRef');
          if (selector === 'Subscription') resolverMap[selector][fieldDef.name.value] = {
            subscribe: <FieldSubscriptionResolver>(source, args, context, info) => {
              return fieldRef.resolveSubscription(operationInstance, args, context, info);
            }
          }
          else resolverMap[selector][fieldDef.name.value] = (
            <GraphQLFieldResolver>(source, args, context, info) => {
              return fieldRef.resolve(operationInstance, args, context, info);
            }
          );
        }
      }
      else {
        const typeRef = this.typeRefs.get(selector);
        if (!typeRef) throw new ReferenceError('Cannot find type with selector ' + selector);
        resolverMap[selector] = {};
        for (const fieldDef of def.fields) {
          const fieldRef = typeRef.fields.get(fieldDef.name.value);
          if (!fieldRef) throw new Error(
            'Cannot find field with this name: ' + fieldDef.name.value + ' for ' + typeRef.selector
          );
          resolverMap[selector][fieldDef.name.value] = fieldRef.resolve.bind(fieldRef);
        }
      }
    }
    return {docNode, resolverMap};
  }
}
