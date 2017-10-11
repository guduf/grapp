import {
  DocumentNode,
  GraphQLSchema,
  FieldDefinitionNode,
  ObjectTypeDefinitionNode,
  DefinitionNode
} from 'graphql';

import { Db } from './db';
import { Injector, Provider, TYPER } from './di';
import { GrappTarget } from './grapp';
import { GrappRef } from './grapp_ref';
import { TypeInstance } from './type';
import { TypeRef } from './type_ref';

export interface RootParams {
  db: Db
  providers: Provider[]
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
    const docResolverMap: { [type: string]: { [field: string]: any } } = {
      Mutation: {},
      Query: {}
    };
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
    for (const [, grappRef] of this.grappRefs) {
      const {docNode, resolverMap} = grappRef.parse() || {docNode: undefined, resolverMap: undefined};
      if (docNode) {
        for (const def of docNode.definitions) {
          if (def.kind !== 'ObjectTypeDefinition') docNode.definitions.push(def);
          else if (['Mutation', 'Query'].indexOf(def.name.value) < 0) docNode.definitions.push(def);
          else if (def.name.value === 'Mutation') mutationNode.fields.push(...def.fields);
          else if (def.name.value === 'Query') queryNode.fields.push(...def.fields);
        }
        for (const selector in resolverMap) {
          if (selector === 'Mutation') docResolverMap['Mutation'] = {
            ...docResolverMap['Mutation'],
            ...resolverMap['Query']
          };
          else if (selector === 'Query') docResolverMap['Query'] = {
            ...docResolverMap['Query'],
            ...resolverMap['Query']
          };
          else docResolverMap[selector] = resolverMap[selector];
        }
      }
    }
    console.log(`docNode`, docNode);
    console.log(`docResolverMap`, docResolverMap);
    return null;
    // const queryFieldDefs: FieldDefinitionNode[] = [];
    // const mutationFieldDefs: FieldDefinitionNode[] = [];
    // const typeDefs: ObjectTypeDefinitionNode[] = [];
    // const miscDefs: DefinitionNode[] = [];
    // for (const [, grappRef] of this.grappRefs) {
    //   const docNode = grappRef.parseSchema();
    //   if (docNode) for (const def of docNode.definitions)
    //     if (def.kind !== 'ObjectTypeDefinition') miscDefs.push(def);
    //     else if (def.name.value === 'Mutation') mutationFieldDefs.push(...def.fields);
    //     else if (def.name.value === 'Query') queryFieldDefs.push(...def.fields);
    //     else typeDefs.push(def);
    // }

    // docNode.definitions.push(...miscDefs);

    // for (const typeDef of typeDefs) {
    //   const typeRef = this.getType(typeDef.name.value);
    //   if (typeRef) throw new Error('Cannot find type with this selector: ' + typeDef.name.value);
    //   resolverMap[typeDef.name.value] = {};
    //   for (const fieldDef of typeDef.fields) {
    //     const fieldRef = typeRef.fields.get(fieldDef.name.value);
    //     if (typeRef) throw new Error('Cannot find field with this selector: ' + fieldDef.name.value);
    //     resolverMap[typeDef.name.value][fieldDef.name.value] = fieldRef.resolve.bind(fieldRef);
    //     docNode.definitions.push(typeDef);
    //   }
    // }

    // for (const typeDef of )

    // return;
  }
}

export function bootstrapGrapp(target: GrappTarget, params: RootParams): Promise<GraphQLSchema> {
  let grappRef: GrappRef;
  const root = new GrappRoot(target, params);
  console.log(root.build());
  return;
}
