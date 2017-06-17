import { readFileSync } from 'fs';
import {
  buildASTSchema,
  DefinitionNode,
  DocumentNode,
  FieldDefinitionNode,
  GraphQLInputFieldConfig,
  GraphQLResolveInfo,
  GraphQLSchema,
  ObjectTypeDefinitionNode,
  parse,
  print
} from 'graphql';
import { join } from 'path';
import { InjectionToken, Provider, Injector } from './di';
import {
  TypeBuilder,
  TypeMeta,
  TYPE_PAYLOAD_TOKEN,
  TypeTarget
} from './type';
import { getOperationMeta, OperationTarget } from './operation';
import { OperationRef } from './operation_ref';
import { GrappMeta } from './grapp';
import { Resolver } from './core';
import { DocTarget, DocRef } from './doc';
import { TypeRef } from './type_ref';

export interface GrappDefinition {
  types: DefinitionNode[]
  queries: FieldDefinitionNode[]
  mutations: FieldDefinitionNode[]
}

export interface SchemaDef {
  types: DefinitionNode[]
  queries: FieldDefinitionNode[]
  mutations: FieldDefinitionNode[]
}

export class GrappRef {
  constructor(rootInjector: Injector, meta: GrappMeta) {
    const typeBuilder = (target, payload) => this.buildType(target, payload);
    const providers: Provider[] = [
      ...meta.providers,
      {provide: TypeBuilder, useValue: {build: typeBuilder}}
    ];
    this._injector = Injector.resolveAndCreate(providers, rootInjector);
    this._parseMeta(meta);
    const schemaDef = this.parseSchema(meta);
    for (const [, typeRef] of this._types) {
      schemaDef.types = [...schemaDef.types, ...typeRef.schemaDef.types];
      schemaDef.mutations = [...schemaDef.mutations, ...typeRef.schemaDef.mutations];
      schemaDef.queries = [...schemaDef.queries, ...typeRef.schemaDef.queries];
    }
    this._schemaDef = schemaDef;
  }
  get injector() { return this._injector; }
  build(): [GraphQLSchema, { [key: string]: any }] {
    const docNode: DocumentNode = {
      kind: 'Document',
      definitions: [...this._schemaDef.types]
    };
    const rootValue: { [key: string]: Resolver<any, any> } = {};
    const kinds: ['Query', 'Mutation'] = ['Query', 'Mutation'];
    kinds.forEach(kind => {
      let opes: FieldDefinitionNode[]
      switch (kind) {
        case 'Query': opes = this._schemaDef.queries; break;
        case 'Mutation': opes = this._schemaDef.mutations; break;
        default: throw new Error('(kind) must be "Query" or "Mutation"');
      }
      if (!opes || !opes.length) return;
      const fields = opes.map(field => {
        const selector = field.name.value;
        if (rootValue[selector]) return field;
        rootValue[selector] = this._resolveOperation.bind(this);
        return field;
      });
      const opeDefinition: ObjectTypeDefinitionNode = {
        kind: 'ObjectTypeDefinition',
        name: {kind: 'Name', value: kind},
        fields
      };
      docNode.definitions.push(opeDefinition);
    });
    return [buildASTSchema(docNode), rootValue];
  }
  buildType(target: TypeTarget, payload: any): any {
    const typeRef = this._types.get(target);
    if (!typeRef) throw new Error(`cannot find typeRef with selector(${target.name})`);
    return typeRef.instanciate(payload);
  }
  getDoc(docTarget: DocTarget) { return this._docs.get(docTarget) }
  getTypeBySelector(selector: string) {
    for (const [, type] of this._types) if (type.meta.selector === selector) return type;
  }
  getMutationBySelector(selector: string) {
    for (const [, ope] of this._opes)
      if (ope.meta.kind === 'Mutation' && ope.meta.selector === selector) return ope;
  }
  getQueryBySelector(selector: string) {
    for (const [, ope] of this._opes)
      if (ope.meta.kind === 'Query' && ope.meta.selector === selector) return ope;
  }
  parseSchema(meta: GrappMeta|TypeMeta): SchemaDef {
    let schemaInput = '';
    if (meta.schema) {
      schemaInput = meta.schema;
    } else if (meta.schemaUrl) {
      const dirname = meta.filename.match(/^(\S+\/)[^\/]+$/)[1];
      schemaInput = readFileSync(join(dirname, meta.schemaUrl), 'utf8');
    } else return <SchemaDef>{types: [], mutations: [], queries: []};
    const docNode = parse(schemaInput, {noLocation: true});
    const types: DefinitionNode[] = [];
    const queries: FieldDefinitionNode[] = [];
    const mutations: FieldDefinitionNode[] = [];
    for (const def of docNode.definitions) if (def.kind === 'ObjectTypeDefinition') {
      if (def.name.value === 'Query') queries.push(...def.fields);
      else if (def.name.value === 'Mutation') mutations.push(...def.fields);
      else types.push(def);
    }
    return {types, queries, mutations};
  }
  private _injector: Injector;
  private _schemaDef: SchemaDef;
  private _docs: Map<DocTarget, DocRef> = new Map();
  private _types: Map<TypeTarget, TypeRef> = new Map();
  private _opes: Map<OperationTarget, OperationRef> = new Map();
  private _rootValue : { [key: string]: any }
  private _parseMeta(meta: GrappMeta) {
    for (const docTarget of meta.docs)
      try { this._docs.set(docTarget, new DocRef(docTarget)) } catch (err) {
        console.error(err);
        throw new Error(`Failed to reference DocTarget(${docTarget.name})`);
      }
    for (const typeTarget of meta.types)
      try { this._types.set(typeTarget, new TypeRef(this, typeTarget)) } catch (err) {
        console.error(err);
        throw new Error(`Failed to reference TypeTarget(${typeTarget.name})`);
      }
    for (const opeTarget of meta.operations)
      try { this._opes.set(opeTarget, new OperationRef(this, opeTarget)) } catch (err) {
        console.error(err);
        throw new Error(`Failed to reference OperationTarget(${opeTarget.name})`);
      }
  }
  private _resolveOperation(args: any, context: any, info: GraphQLResolveInfo) {
    const {fieldName, parentType} = info;
    let kind: 'Query'|'Mutation';
    if (parentType === info.schema.getMutationType()) kind = 'Mutation';
    else if (parentType === info.schema.getQueryType()) kind = 'Query';
    else throw new Error('Operation definition has invalid parent type');
    let ope: OperationRef;
    switch (kind) {
      case 'Query': ope = this.getQueryBySelector(fieldName); break;
      case 'Mutation': ope = this.getMutationBySelector(fieldName); break;
      default: throw new Error('(kind) must be "Query" or "Mutation"');
    }
    if (!ope) throw new Error(`Cannot find opeRef with fieldName(${fieldName})`);
    if (!ope || !ope.resolve) {
      console.error('Invalid operation', info.parentType, fieldName)
      throw new Error('Invalid operation');
    }
    return ope.resolve.call(ope, args, context, info);
  }
}
