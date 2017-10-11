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
      throw new ReferenceError('The target has not been decorated as Grapp');
    this.imports = this.meta.imports.map(grappTarget => this.root.registerGrappRef(grappTarget));
    const providers = [...this.meta.providers];
    if (this.collection) {
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

  // build(): GraphQLSchema {
  //   const docNode = this._parseSchema();
  //   if (!docNode) throw new Error('Empty DocNode');
  //   let resolverMap: { [key: string]: any } = {}
  //   for (const defNode of docNode.definitions) if (defNode.kind === 'ObjectTypeDefinition') {
  //     const typeName = defNode.name.value;
  //     if (['Mutation', 'Query'].indexOf(typeName) >= 0) {
  //       resolverMap[typeName] = {};
  //       for (const field of defNode.fields) {
  //         if (field.type.kind !== 'NamedType') throw new Error(
  //           `${typeName} field must return NamedType`
  //         );
  //         const typeRef= this.typeRefs.get(field.type.name.value);
  //         if (!typeRef) throw new Error(
  //           `Cannot find type for ${typeName}: ${field.type.name.value}`
  //         );
  //         resolverMap[typeName][field.type.name.value] = typeRef.instanciate({});
  //       }
  //     } else {
  //       const typeRef = this.typeRefs.get(typeName);
  //       if (!typeRef) throw new Error('Cannot find type with selector: ' + typeName);
  //       resolverMap[typeName] = typeName;
  //     }
  //     console.log(`resolverMap`, resolverMap);
  //   }
  //   let queryFields: FieldDefinitionNode[];
  //   let mutationFields: FieldDefinitionNode[];
  //   for (const defNode of docNode.definitions)
  //     if (defNode.kind === 'ObjectTypeDefinition') {
  //       if (defNode.name.value === 'Query') queryFields = defNode.fields;
  //       if (defNode.name.value === 'Mutation') mutationFields = defNode.fields;
  //       if (queryFields && mutationFields) break;
  //     }
  //   let rootValue: { [key: string]: any } = {};
  //   for (const field of [...mutationFields, ...queryFields]) {
  //     if (field.type.kind !== 'NamedType') throw new Error('Query field must return NamedType');
  //     rootValue[field.name.value] = rootValue[field.name.value] || {};
  //     let type: ObjectTypeDefinitionNode;
  //     for (const defNode of docNode.definitions) if (
  //       defNode.kind === 'ObjectTypeDefinition' &&
  //       defNode.name.value === field.type.name.value
  //     ) {
  //       type = defNode;
  //       break;
  //     }
  //     for (const field of type.fields) {
  //       console.log(`Field`, field.name.value);
  //     }
  //   }
  //   return;
  // }

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
    // for (const def of docNode.definitions)
    //   if (def.kind !== 'ObjectTypeDefinition') miscDefs.push(def);
    //   else if (def.name.value === 'Mutation') mutationFieldDefs.push(...def.fields);
    //   else if (def.name.value === 'Query') queryFieldDefs.push(...def.fields);
    //   else typeDefs.push(def);
    // }
    // const docNode: DocumentNode = {
    //   kind: 'Document',
    //   definitions: []
    // };
    // const queryNode: ObjectTypeDefinitionNode = {
    //   kind: 'ObjectTypeDefinition',
    //   name: {kind: 'Name', value: 'Query'},
    //   fields: []
    // };
    // const mutationNode: ObjectTypeDefinitionNode = {
    //   kind: 'ObjectTypeDefinition',
    //   name: {kind: 'Name', value: 'Mutation'},
    //   fields: []
    // };
    // const nodes: DocumentNode[] = [
    //   ...this.imports.map(imp => imp.parseSchema()),
    //   this.meta.schema ?  : null
    // ]
    //   .filter(node => Boolean(node));
    // if (!nodes.length) return null;
    // for (const {definitions} of nodes) {
    //   for (const def of definitions) {
    //     if (def.kind === 'ObjectTypeDefinition') {
    //       if (def.name.value === 'Query') queryNode.fields.push(...def.fields);
    //       else if (def.name.value === 'Mutation') mutationNode.fields.push(...def.fields);
    //       else docNode.definitions.push(def);
    //     }
    //     else docNode.definitions.push(def);
    //   }
    // }
    // docNode.definitions.push(queryNode, mutationNode);
    // return docNode;
  }
}
