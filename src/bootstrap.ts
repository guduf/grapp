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
import { GrappTarget } from './grapp';
import { GrappRef } from './grapp_ref';
import { TypeInstance } from './type';
import { TypeRef } from './type_ref';

export interface RootParams {
  db: Db
  providers?: Provider[]
}

export class GrappRoot {
  constructor(
    private _target: GrappTarget|GrappTarget[],
    private _params: RootParams
  ) {
    this.injector = Injector.resolveAndCreate([
      ...(_params.providers || []),
      {provide: TYPER, useValue: this.typer.bind(this)}
    ]);
    this.registerGrappRef(_target);
  }

  injector: Injector;
  grappRefs = new Map<GrappTarget, GrappRef>();
  schema: GraphQLSchema;

  get db() { return this._params.db; }

  registerGrappRef(target: GrappTarget): GrappRef {
    if (this.grappRefs.has(target)) return this.grappRefs.get(target);
    const grappRef = new GrappRef(target, this);
    this.grappRefs.set(target, grappRef);
    return grappRef;
  }

  getType(selector: string) {
    for (const [, grappRef] of this.grappRefs)
      if (grappRef.typeRefs.has(selector))
        return grappRef.typeRefs.get(selector);
  }

  typer(selector: string, payload: { [key: string]: any }): TypeInstance {
    let typeRef: TypeRef;

    if (!typeRef) throw new Error('Cant find type with selector: ' + selector);
    return typeRef.instanciate(payload);
  }

  build(): GraphQLSchema {
    const rootResolverMap: { [type: string]: { [field: string]: any } } = {
      Mutation: {},
      Query: {}
    };
    const rootDocNode: DocumentNode = {kind: 'Document', definitions: []};
    const rootQueryNode: ObjectTypeDefinitionNode = {
      kind: 'ObjectTypeDefinition',
      name: {kind: 'Name', value: 'Query'},
      fields: []
    };
    const rootMutationNode: ObjectTypeDefinitionNode = {
      kind: 'ObjectTypeDefinition',
      name: {kind: 'Name', value: 'Mutation'},
      fields: []
    };
    for (const [, grappRef] of this.grappRefs) {
      const {docNode, resolverMap} = grappRef.parse() || {docNode: undefined, resolverMap: undefined};
      if (docNode) {
        for (const def of docNode.definitions) {
          if (def.kind !== 'ObjectTypeDefinition') rootDocNode.definitions.push(def);
          else if (['Mutation', 'Query'].indexOf(def.name.value) < 0) {
            console.log(`def.name.value`, def.name.value);
            rootDocNode.definitions.push(def);
          }
          else if (def.name.value === 'Mutation') rootMutationNode.fields.push(...def.fields);
          else if (def.name.value === 'Query') rootQueryNode.fields.push(...def.fields);
        }
        for (const selector in resolverMap) {
          if (['Mutation', 'Query'].indexOf(selector) >= 0) rootResolverMap[selector] = {
            ...rootResolverMap[selector],
            ...resolverMap[selector]
          };
          else rootResolverMap[selector] = resolverMap[selector];
        }
      }
    }
    rootDocNode.definitions.push(rootMutationNode, rootQueryNode);
    const schema = buildASTSchema(rootDocNode);
    addResolveFunctionsToSchema(schema, rootResolverMap);
    return schema;
  }
}

export async function bootstrapGrapp(target: GrappTarget, params: RootParams): Promise<GraphQLSchema> {
  let grappRef: GrappRef;
  const root = new GrappRoot(target, params);
  return root.build();
}
