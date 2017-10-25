import {
  buildASTSchema,
  DocumentNode,
  GraphQLSchema,
  FieldDefinitionNode,
  ObjectTypeDefinitionNode,
  DefinitionNode
} from 'graphql';
import { addResolveFunctionsToSchema } from 'graphql-tools';

import { Db } from './db';
import { Injector, Provider, TYPER } from './di';
import { DocEvent, DocEvents } from './doc_event';
import { GrappMeta, GrappTarget, getGrappMeta } from './grapp';
import { GrappRef } from './grapp_ref';
import { OperationKind, OPERATION_KINDS } from './operation';
import { TypeInstance } from './type';
import { TypeRef } from './type_ref';

export interface RootParams {
  db: Db
  providers?: Provider[]
}

export class Root {
  constructor(
    target: GrappTarget|GrappTarget[],
    params: RootParams
  ) {
    this.db = params.db;
    this.docEvents = new DocEvents();

    this.injector = Injector.resolveAndCreate([
      ...(params.providers || []),
      {provide: TYPER, useValue: this.typer.bind(this)},
      {provide: DocEvents, useValue: this.docEvents}
    ]);

    this.registerGrappRef(target);
  }

  db: Db
  injector: Injector;
  grappRefs = new Map<GrappTarget, GrappRef>();
  docEvents: DocEvents
  schema: GraphQLSchema;

  registerGrappRef(target: GrappTarget): GrappRef {
    if (this.grappRefs.has(target)) return this.grappRefs.get(target);
    const grappMeta = getGrappMeta(target);
    const grappRef = new grappMeta.ctor(this, target, grappMeta);
    this.grappRefs.set(target, grappRef);
    return grappRef;
  }

  getTypeRef(selector: string): TypeRef {
    for (const [, grappRef] of this.grappRefs)
      if (grappRef.typeRefs.has(selector))
        return grappRef.typeRefs.get(selector);
  }

  typer(selector: string, payload: { [key: string]: any }): TypeInstance {
    const typeRef = this.getTypeRef(selector);
    if (!typeRef) throw new Error('Cant find type with selector: ' + selector);
    return typeRef.instanciate(payload);
  }

  build(): GraphQLSchema {
    const rootResolverMap: { [type: string]: { [field: string]: any } } = {
      Mutation: {},
      Query: {}
    };
    const rootDocNode: DocumentNode = {kind: 'Document', definitions: []};
    const opNodes: { [key: string]: ObjectTypeDefinitionNode } = {};
    for (const opKind of OPERATION_KINDS) opNodes[opKind] = {
      kind: 'ObjectTypeDefinition',
      name: {kind: 'Name', value: opKind},
      fields: []
    };
    const rootMutationNode: ObjectTypeDefinitionNode = {
      kind: 'ObjectTypeDefinition',
      name: {kind: 'Name', value: 'Mutation'},
      fields: []
    };
    for (const [, grappRef] of this.grappRefs) {
      let parsed: { docNode: DocumentNode, resolverMap: { [key: string]: any } }
      try {
        parsed = grappRef.parse();
      } catch (err) {
        console.error(err);
        throw new Error('Failed to parse grappRef: ' + grappRef.target.name);
      }
      if (parsed) {
        for (const def of parsed.docNode.definitions) {
          if (def.kind !== 'ObjectTypeDefinition') rootDocNode.definitions.push(def);
          else if (OPERATION_KINDS.indexOf(<OperationKind>def.name.value) >= 0)
            opNodes[def.name.value].fields.push(...def.fields);
          else rootDocNode.definitions.push(def);
        }
        for (const selector in parsed.resolverMap) {
          if (OPERATION_KINDS.indexOf(<OperationKind>selector) >= 0) rootResolverMap[selector] = {
            ...rootResolverMap[selector],
            ...parsed.resolverMap[selector]
          };
          else rootResolverMap[selector] = parsed.resolverMap[selector];
        }
      }
    }
    rootDocNode.definitions.push(...OPERATION_KINDS.map(kind => opNodes[kind]));
    const schema = buildASTSchema(rootDocNode);
    addResolveFunctionsToSchema(schema, rootResolverMap);
    return schema;
  }
}

export function bootstrapGrapp(target: GrappTarget, params: RootParams): GraphQLSchema {
  const root = new Root(target, params);
  return root.build();
}
