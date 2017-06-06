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
import { InjectionToken, Provider, Injector } from './di';
import {
  getTypeMeta,
  TYPE_BUILDER_INJECTION_PREFIX,
  TYPE_PAYLOAD_TOKEN,
  TypeTarget
} from './type';
import { getOperationMeta, IOperation } from './operation';
import { GrappMeta } from './grapp';
import { TypeTokenStore } from './core';

export interface GrappDefinition {
  types: DefinitionNode[]
  queries: FieldDefinitionNode[]
  mutations: FieldDefinitionNode[]
}

export class GrappRef {
  get queries() { return this._definition.queries; }
  get types() { return this._definition.types; }
  private _injector: Injector;
  private _definition: GrappDefinition;
  private _operations: Map<string, any>;
  private _rootValue : { [key: string]: any }
  constructor(rootInjector: Injector, meta: GrappMeta) {
    const typeTokenStore = rootInjector.get(TypeTokenStore);
    const providers: Provider[] = [...(meta.providers || [])];
    for (const target of (meta.types || [])) {
      const meta = getTypeMeta(target);
      if (!meta) throw new Error('Cannot found type meta');
      const token = typeTokenStore.create(meta.selector);
      const typeBuilder = (payload?: any) => this._buildType(target, payload);
      providers.push({
        provide: TYPE_BUILDER_INJECTION_PREFIX + meta.selector,
        useValue: typeBuilder
      });
    }
    this._injector = Injector.resolveAndCreate(providers, rootInjector);
    const operations = new Map<string, any>();
    for (const target of meta.operations) {
      const meta = getOperationMeta(target);
      if (!meta) throw new Error('Cannot found operation meta');
      const instance: IOperation = this._injector.resolveAndInstantiate(target);
      if (!instance || !instance.resolve) throw new Error('The operation instance doesn’t have resolve method');
      operations.set(meta.selector, instance);
    }
    this._operations = operations;
    this._definition = this.parseDefinition(meta);
    // try { typeRef = new TypeRef(preInjector, typeTarget, typeMeta); }
    // catch (err) { console.error(err); }
    // const typeToken = typeTokenStore.create(typeMeta.selector);
    // providers.push({provide: typeToken, useValue: typeRef.instance});
    // this._injector = Injector.resolveAndCreate(providers, preInjector);
    // this._definition = this.parseDefinition(meta);
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
        const selector = (<NamedTypeNode>field).name.value;
        const instance: IOperation = this._operations.get(selector);
        if (!instance) throw new Error('Operation not found with this selector: ' + selector);
        rootValue[field.name.value] = function resolveOperation(args, context, info) {
          return instance.resolve(args, context, info);
        }
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
  private _buildType(target: TypeTarget, payload: any): any {
    let injector: Injector = this._injector;
    if (payload) injector = this._injector.resolveAndCreateChild([{
      provide: TYPE_PAYLOAD_TOKEN, useValue: payload
    }]);
    return injector.resolveAndInstantiate(target);
  }
}
