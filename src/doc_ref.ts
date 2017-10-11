import {
  DefinitionNode,
  FieldDefinitionNode,
  GraphQLResolveInfo,
  ObjectTypeDefinitionNode,
  parse as parseSchema
} from 'graphql';
import { plural } from 'pluralize';
import { generate as shortid } from 'shortid';

import { Db, Collection } from './db';
import { DocInstance, DocMeta, DocTarget, getDocMeta } from './doc';
import { DataFieldRef } from './data_fields';
import { FieldRef, mapFieldMeta , FieldResolver} from './fields';
import { GraphQLResolver, GrappRef } from './grapp_ref';

export interface DocSchema {
  type: ObjectTypeDefinitionNode,
  query: ObjectTypeDefinitionNode,
  mutation: ObjectTypeDefinitionNode,
  definitions: DefinitionNode[]
}

export const DOC_DATA = Symbol('DOC_DATA');

export class DocRef<D extends DocInstance = DocInstance> {
  id: string;
  collection: Collection;
  meta: DocMeta;
  fields: Map<string, FieldRef>;
  operations: Map<string, Function>;
  schema: DocSchema;
  resolvers: { [key: string]: GraphQLResolver };

  constructor(private _grappRef: GrappRef, public target: DocTarget) {
    this.meta = getDocMeta(target);
    if (!this.meta) throw new ReferenceError('The target has not been decorated as Doc');
    this.operations = new Map();
    for (const opeName of Object.getOwnPropertyNames(target))
      if (['prototype', 'name', 'length'].indexOf(opeName) < 0)
        this.operations.set(opeName, target[opeName]);
    this.fields = new Map();
    for (const [key, meta] of mapFieldMeta(target))
       this.fields.set(key, new meta.RefClass(this, key, meta));
    this.collection = this._grappRef.root.db.collection(plural(this.selector.toLocaleLowerCase()));
    this.schema = this._parseSchema();
    this.resolvers = this._buildResolvers();
  }

  get idKey(): string { return `${this.selector.toLocaleLowerCase()}Id`; }
  get idsKey(): string { return `${this.selector.toLocaleLowerCase()}Ids`; }
  get selector(): string { return this.meta.selector; }
  get otherRefs(): Map<string, DocRef> { return new Map(); }

  async find(query: Object): Promise<D[]> {
    const ids = await this.collection.find<{id: string}>(query, {fields: {id: 1}}).toArray();
    return ids.map(({id}) => this._instanciate(id));
  }

  async findOne(query: Object): Promise<D> {
    const {id} = await this.collection.findOne<{id: string}>(query, {fields: {id: 1}});
    return this._instanciate(id);
  }

  async get(id: string): Promise<D> {
    await this.collection.count({id});
    return this._instanciate(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.collection.deleteOne({id});
    return true;
  }

  async insert(candidate: { [key: string]: any }): Promise<D> {
    const id = shortid();
    candidate = {...candidate, id};
    const body = {};
    for (const [key, ref] of this.fields) if (ref instanceof DataFieldRef && ref.meta.inputable) {
      const value = candidate[key];
      if (typeof value === 'undefined' || Object.is(null, value)) {
        if (ref.meta.required)
          throw new TypeError(`The value for field [${key}] is required to insert a doc of this type: ${this.selector}`);
      }
      else for (const vld of ref.meta.validators) {
        try { vld(value); } catch (err) {
          throw new TypeError(`Failed to validate field [${key}] for doc ${this.selector}: ${err.message}`);
        }
      }
      body[key] = value;
    }
    await this.collection.insertOne(body);
    return this._instanciate(id);
  }

  async update(id: string, update: { [key: string]: any }): Promise<D> {
    const body = {};
    for (const [key, ref] of this.fields) if (ref instanceof DataFieldRef && ref.meta.updatable) {
      const value = update[key];
      if (typeof value !== 'undefined' && !Object.is(null, value)) {
        for (const vld of ref.meta.validators) try { vld(value); } catch (err) {
          throw new TypeError(`Failed to validate field [${key}] for doc ${this.selector}: ${err.message}`);
        }
        body[key] = value;
      }
    }
    await this.collection.updateOne({id}, {$set: body});
    return this._instanciate(id);
  }

  private _buildResolvers(): { [key: string]: GraphQLResolver } {
    const fieldDefs: FieldDefinitionNode[] = [
      ...(this.schema.mutation || {fields: []}).fields,
      ...(this.schema.query || {fields: []}).fields
    ];
    const resolvers: { [key: string]: GraphQLResolver } = {};
    for (const fieldDef of fieldDefs) {
      const fieldName = fieldDef.name.value;
      let resolver: FieldResolver;
      switch (fieldName) {
        case 'delete':
          resolver = ({}, {id}: { id: string }) => this.delete(id);
          break;
        case 'get':
          resolver = ({}, {id}: { id: string }) => this.get(id);
          break;
        case 'insert':
          resolver = (
            ({candidate}: { candidate: { [key: string]: any } }) => this.insert(candidate)
          );
          break;
        case 'update':
          resolver = (
            ({}, {id, update}: { id: string, update: { [key: string]: any } }) => this.update(id, update)
          );
          break;
        default:
          let method;
          for (const key of Object.getOwnPropertyNames(this.target)) if (key === fieldName) {
            method = this.target[key];
            break;
          }
          if (!method) throw new ReferenceError(`The field has no corresponding resolver: ${fieldName}`)
          resolver = (args: { [key: string]: any }, context: { [key: string]: any }, info: GraphQLResolveInfo) => {
            return method.call({}, args, {...context, docRef: this}, info);
          }
      }
      resolvers[fieldName] = <any>resolver;
    }
    return resolvers;
  }

  private _instanciate(id: string): D {
    const instance: D = new this.target();
    instance[DOC_DATA] = {id};
    for (const [key, ref] of this.fields) {
      instance[key] = (args: {}, context, info) => ref.resolve({}, args, context, info);
    }
    return instance;
  }

  private _parseSchema(): DocSchema {
    const docNode = parseSchema(this.meta.schema, {noLocation: true});
    const docSchema: DocSchema = {
      type: undefined,
      query: undefined,
      mutation: undefined,
      definitions: []
    };
    for (const def of docNode.definitions) {
      if (def.kind === 'ObjectTypeDefinition') {
        const regExp = new RegExp(`^${this.selector}(?:(Query)|(Mutation))?$`)
        const match = def.name.value.match(regExp);
        if (!match) throw new ReferenceError(`The type definition doesn't match the pattern: ${def.name.value}`);
        if (match[1]) docSchema.query = def;
        else if (match[2]) docSchema.mutation = def;
        else docSchema.type = def;
      }
      docSchema.definitions.push(def);
    }
    if (!docSchema.type)
      throw new ReferenceError(`The schema doesn't contain a type definition corresponding to the selector`);
    return docSchema;
  }
}
