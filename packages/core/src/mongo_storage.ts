import { Collection, Db } from '@types/mongodb';
import { generate as shortid } from 'shortid';
import { Inject, InjectionToken } from './di';
import { DocState, DocTarget, Doc, DocParams } from './doc';
import { DocStorageFactory } from './doc_storage';
import { validators as vld } from './doc_field';
import { DocRefs, DOC_REFS } from './doc_ref';

export const MongoDb = new InjectionToken('MongoDb');

export class MongoStorage implements DocStorageFactory {
  constructor(
    @Inject(MongoDb) private _db: Promise<Db>,
    @Inject(DOC_REFS) private _docRefs: DocRefs
  ) { }
  get db() { return this._db; }
  async collection(target: DocTarget): Promise<Collection> {
    const docRef = this._docRefs.get(target);
    if (!docRef) throw new ReferenceError(`Cannot find DocRef with DocTarget(${target.name})`);
    return (await this._db).collection(docRef.meta.collection);
  }
  async create(target: DocTarget, input: { [key: string]: any }): Promise<DocState> {
    const docRef = this._docRefs.get(target);
    const collection = (await this._db).collection(docRef.meta.collection);
    const candidate: { [key: string]: any } = {};
    for (const [field, meta] of docRef.meta.fields) if (meta.inputable) {
      const value = input[field];
      if (typeof value !== 'undefined' || meta.required) {
        if (typeof value === 'undefined') throw new Error(`Input field required (${field})`);
        for (const vld of meta.validators) vld(value);
        candidate[field] = value;
      }
    }
    const id = shortid();
    await collection.insertOne({...candidate, id});
    return {id};
  }
  async find(
    target: DocTarget, conditions: { [key: string]: any }, ...fields: string[]
    ): Promise<DocState[]> {
    const docRef = this._docRefs.get(target);
    const collection = (await this._db).collection(docRef.meta.collection);
    const _fields = {id: 1};
    for (const field of fields) if (field !== 'id') _fields[field] = 1;
    const raw = await collection.find<DocState>(conditions, _fields).toArray();
    if (typeof raw !== 'object') throw new Error('Raw data is not a object');
    const states = raw.map(raw => docRef.parseState(raw));
    return states;
  }
  async findOne(target: DocTarget, conditions: { [key: string]: any }, ...fields: string[]): Promise<DocState> {
    const docRef = this._docRefs.get(target);
    const collection = (await this._db).collection(docRef.meta.collection);
    const _fields: { [key: string]: 0|1 } = {id: 1};
    for (const field of fields) if (field !== 'id') _fields[field] = 1;
    const raw = await collection.findOne<DocState>(conditions, fields.length ? _fields : undefined);
    if (typeof raw !== 'object') throw new Error('Raw data is not a object');
    const state = docRef.parseState(raw);
    return state;
  }
  async remove(target: DocTarget, id: string): Promise<string> {
    const docRef = this._docRefs.get(target);
    const collection = (await this._db).collection(docRef.meta.collection);
    await collection.deleteOne({id});
    return id;
  }
  async update(target: DocTarget, id: string, input: { [key: string]: any }): Promise<DocState> {
    const docRef = this._docRefs.get(target);
    const collection = (await this._db).collection(docRef.meta.collection);
    const update: { [key: string]: any } = {};
    for (const [field, meta] of docRef.meta.fields) if (meta.updatable) {
      const value = input[field];
      if (typeof value !== 'undefined') {
        for (const vld of meta.validators) vld(value);
        update.value = value;
      }
    }
    await collection.updateOne({id}, {$set: update});
    return {id};
  }
}

export function MongoDoc(params: DocParams = {}): ClassDecorator {
  return target => Doc({...params, storage: MongoStorage})(target);
}
