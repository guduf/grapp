import {
  buildASTSchema,
  DocumentNode,
  GraphQLResolveInfo,
  GraphQLSchema,
  FieldDefinitionNode,
  ObjectTypeDefinitionNode
} from 'graphql';
import { Db } from 'mongodb';

import { DocInstance } from './doc';
import { DocRef } from './doc_ref';
import { getGrappMeta, GrappMeta, GrappTarget } from './grapp';

export interface GraphQLResolver<T = any> {
  (
    args: { [key: string]: any },
    context: { [key: string]: any },
    info: GraphQLResolveInfo
  ): T|Promise<T>
}

export class GrappRef {
  docRefs = new Map<string, DocRef>();
  meta: GrappMeta;

  constructor(public db: Db, target: GrappTarget) {
    this.meta = getGrappMeta(target);
    if (typeof this.meta !== 'object') throw new ReferenceError('The target has not been decorated as Grapp');
    for (const docTarget of this.meta.docs) {
      let docRef: DocRef;
      try {
        docRef = new DocRef(this, docTarget);
      } catch (err) {
        console.error(err);
        throw new Error('Failed to reference Doc target: ' + docTarget.name);
      }
      if (this.docRefs.has(docRef.selector))
        throw new ReferenceError(`A doc is already registred with this selector: ${docRef.selector}`);
      this.docRefs.set(docRef.selector, docRef);
    }
  }

  build(): { schema: GraphQLSchema, rootValue: { [key: string]: any } } {
    return {schema: this._buildSchema(), rootValue: this._buildResolvers()};
  }

  private _buildResolvers(): { [key: string]: { [key: string]: GraphQLResolver } } {
    const rootResolver: { [key: string]: { [key: string]: GraphQLResolver } } = {};
    for (const [selector, docRef] of this.docRefs)
      rootResolver[selector] = docRef.resolvers;
    return rootResolver;
  }

  private _buildSchema(): GraphQLSchema {
    const docNode: DocumentNode = {
      kind: 'Document',
      definitions: []
    };
    const queryNode: ObjectTypeDefinitionNode = {
      kind: 'ObjectTypeDefinition',
      name: {kind: 'Name', value: 'Query'},
      fields: []
    };
    const mutationNode: ObjectTypeDefinitionNode = {
      kind: 'ObjectTypeDefinition',
      name: {kind: 'Name', value: 'Mutation'},
      fields: []
    };
    for (const [selector, docRef] of this.docRefs) {
      docNode.definitions.push(...docRef.schema.definitions);
      if (docRef.schema.mutation) {
        const fieldDef: FieldDefinitionNode = {
          kind: 'FieldDefinition',
          name: {kind: 'Name', value: docRef.selector},
          type: {
            kind: 'NamedType',
            name: {kind: 'Name', value: docRef.schema.mutation.name.value}
          },
          arguments: []
        };
        mutationNode.fields.push(fieldDef);
      }
      if (docRef.schema.query) {
        const fieldDef: FieldDefinitionNode = {
          kind: 'FieldDefinition',
          name: {kind: 'Name', value: docRef.selector},
          type: {
            kind: 'NamedType',
            name: {kind: 'Name', value: docRef.schema.query.name.value}
          },
          arguments: []
        };
        queryNode.fields.push(fieldDef);
      }
    }
    docNode.definitions.push(queryNode, mutationNode);
    return buildASTSchema(docNode);
  }
}
