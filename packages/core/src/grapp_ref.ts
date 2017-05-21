import { readFileSync } from 'fs';
import {
  buildASTSchema,
  DefinitionNode,
  DocumentNode,
  FieldDefinitionNode,
  GraphQLSchema,
  NamedTypeNode,
  ObjectTypeDefinitionNode,
  parse,
  print
} from 'graphql';
import { join } from 'path';
import { InjectionToken, Injector, Provider, ReflectiveInjector } from './di';
import { getTypeMeta } from './type';
import { TypeRef } from './type_ref';
import { GrappMeta } from './grapp';
import { TypeTokenStore } from './core';

export interface GrappDefinition {
  types: DefinitionNode[]
  queries: FieldDefinitionNode[]
  mutations: FieldDefinitionNode[]
}

export class GrappRef {
  get injector() { return this._injector; }
  get mutations() { return this._definition.mutations; }
  get queries() { return this._definition.queries; }
  get types() { return this._definition.types; }
  private _injector: Injector;
  private _definition: GrappDefinition;
  private _rootValue : { [key: string]: any }
  constructor(rootInjector: Injector, meta: GrappMeta) {
    const preProviders: Provider[] = [];
    if (meta.providers) preProviders.push(...meta.providers);
    const preInjector = ReflectiveInjector.resolveAndCreate(preProviders, rootInjector);
    const typeTokenStore = rootInjector.get(TypeTokenStore);
    const providers = [];
    const typesRefs = new Map<InjectionToken<string>, TypeRef>();
    for (const typeCtor of meta.types) {
      let typeRef: TypeRef;
      const typeMeta = getTypeMeta(typeCtor);
      try { typeRef = new TypeRef(preInjector, typeCtor, typeMeta); }
      catch (err) { console.error(err); }
      const typeToken = typeTokenStore.create(typeMeta.selector);
      providers.push({provide: typeToken, useValue: typeRef.instance});
    }
    this._injector = ReflectiveInjector.resolveAndCreate(providers, preInjector);
    this._definition = this.parseDefinition(meta);
  }
  build(): [GraphQLSchema, { [key: string]: any }] {
    const docNode: DocumentNode = {
      kind: 'Document',
      definitions: [...this.types]
    };
    const rootValue: { [key: string]: any } = {};
    const opeNames: ['queries', 'mutations'] = ['queries', 'mutations'];
    opeNames.forEach(opeName => {
      const operations = this[opeName];
      if (!operations || !operations.length) return;
      const fields = operations.map(field => {
        if (field.type.kind !== 'NamedType') throw new TypeError('Query is not NamedType');
        const name = (<NamedTypeNode>field.type).name.value;
        const typeTokenStore = this._injector.get(TypeTokenStore);
        const instance = this.injector.get(typeTokenStore.get(name));
        rootValue[field.name.value] = instance;
        return field;
      });
      const opeDefinition: ObjectTypeDefinitionNode = {
        kind: 'ObjectTypeDefinition',
        name: {kind: 'Name', value: opeName === 'queries' ? 'Query' : 'Mutation'},
        fields
      };
      docNode.definitions.push(opeDefinition);
    });
    return [buildASTSchema(docNode), rootValue];
  }
  private parseDefinition(meta: GrappMeta): GrappDefinition  {
    let schemaInput: string;
    if (meta.schema) {
      schemaInput = meta.schema;
    } else if (meta.schemaUrl) {
      const dirname = meta.filename.match(/^(\S+\/)[^\/]+$/)[1];
      schemaInput = readFileSync(join(dirname, meta.schemaUrl), 'utf8');
    } else {
      throw new TypeError('Operation params must have schema or schemaUrl key');
    }
    const docNode = parse(schemaInput, {noLocation: true});
    const types: DefinitionNode[] = [];
    const queries: FieldDefinitionNode[] = [];
    const mutations: FieldDefinitionNode[] = [];
    docNode.definitions.forEach(def => {
      if (def.kind !== 'ObjectTypeDefinition') return types.push(def);
      if (def.name.value === 'Query') return queries.push(...def.fields);
      if (def.name.value === 'Mutation') return mutations.push(...def.fields);
      return types.push(def);
    });
    return {types, queries, mutations};
  }
}
